import {
    useId,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
    type RefObject,
    type SetStateAction,
} from "react";
import cx from "../../foundation/cx";
import useMergedRef from "../../foundation/useMergedRef";
import { useRipple, type RippleHandlers } from "../../foundation/useRipple";
import Icon from "../../icon/Icon";
import { useFilePick, resolveFileAccept, type FilePickAccept } from "../file/useFilePick";
import PickerField from "../shared/PickerField";
import ImageEditorDialog, { type ImageCropSlotContext } from "../shared/ImageEditorDialog";
import { readFileAsDataUrl, type CroppedImage } from "../shared/imageCrop";
import type { ImagePickerLabels } from "../shared/imagePickerLabels";
import type { ImageDraft, ImageSelection } from "../shared/imageSelection";
import type { PickerDataAttributes } from "../shared/native";
import { dispatchChange } from "../shared/dispatchChange";
import "./PhotoPicker.css";

/**
 * Context handed to the photo pick and preview slots.
 * Type: interface.
 * @param open - Opens the native file dialog; the surrounding trigger already does this.
 * @param disabled - Whether the picker is disabled.
 * @param value - Current Base64 preview, or `null` before a selection.
 * @example
 * const pick = ({ value }: PhotoPickerSlotContext): ReactNode => <span>{value === null ? "Choose" : "Change"}</span>;
 */
export interface PhotoPickerSlotContext {
    open: () => void;
    disabled: boolean;
    value: string | null;
}

/**
 * Context handed to the photo preview slot; the value is always present.
 * Type: interface.
 * @param open - Opens the native file dialog.
 * @param disabled - Whether the picker is disabled.
 * @param value - Base64 preview of the current photo.
 * @example
 * const preview = ({ value }: PhotoPickerPreviewSlotContext): ReactNode => <img src={value} alt="" />;
 */
export interface PhotoPickerPreviewSlotContext {
    open: () => void;
    disabled: boolean;
    value: string;
}

/**
 * Replaceable photo picker UI.
 * Type: interface.
 * @param pick - Replaces the empty trigger contents.
 * @param preview - Replaces the image preview inside the trigger.
 * @param crop - Replaces the crop stage and controls in the editor.
 * Keep pick and preview content presentational because it renders inside the trigger button.
 * @example
 * <PhotoPicker
 *     label="Cover"
 *     slots={{
 *         pick: () => <span className="my-pick">Choose a cover</span>,
 *         preview: ({ value }) => <img className="my-preview" src={value} alt="" />,
 *         crop: ({ src }) => <img className="my-crop" src={src} alt="" />,
 *     }}
 * />
 */
export interface PhotoPickerSlots {
    pick?: (context: PhotoPickerSlotContext) => ReactNode;
    preview?: (context: PhotoPickerPreviewSlotContext) => ReactNode;
    crop?: (context: ImageCropSlotContext) => ReactNode;
}

/**
 * Props for the photo picker.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `style`, `title`, `aria-*`, `data-*`, `tabIndex`,
 * and pointer, mouse, keyboard, and focus handlers are forwarded to the root element.
 * Fields: label, hint, error, value, defaultValue, onChange, accept, aspect, outputWidth,
 * labels, slots, alt, disabled, required, className, id, ref.
 * @param value - Controlled Base64 preview.
 * @param defaultValue - Initial Base64 preview when uncontrolled.
 * @param onChange - Called only after the editor closes with Done or Cancel.
 * @param aspect - Crop aspect ratio; defaults to `4 / 3`.
 * @param outputWidth - Pixel width of the cropped file; defaults to `1600`.
 * @param slots - Pick, preview, and crop slot replacements.
 * @example
 * <PhotoPicker label="Cover photo" onChange={(selection) => save(selection.file)} />
 */
export interface PhotoPickerProps
    extends Omit<
            HTMLAttributes<HTMLDivElement>,
            "children" | "className" | "defaultValue" | "onChange"
        >,
        PickerDataAttributes {
    label: string;
    hint?: string;
    error?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (selection: ImageSelection) => void;
    accept?: FilePickAccept;
    aspect?: number;
    outputWidth?: number;
    labels?: Partial<ImagePickerLabels>;
    slots?: PhotoPickerSlots;
    alt?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    id?: string;
    ref?: Ref<HTMLDivElement>;
}

const DefaultPhotoAspect: number = 4 / 3;
const DefaultPhotoOutputWidth: number = 1600;

/**
 * Renders a photo field with a Base64 preview and a crop editor.
 * A hidden native `input[type="file"]` carries the selection, and the preview
 * tile paints hover and click ripples. Choosing a file opens the editor; the
 * change event fires only when the editor closes through Done (cropped) or
 * Cancel (original). Closing the dialog abandons the selection without emitting
 * anything.
 * @param props - Label, preview value, crop settings, and change handler.
 * @example
 * <PhotoPicker label="Photo" onChange={({ file, dataUrl }) => save(file, dataUrl)} />
 * @returns A photo picker field.
 */
const PhotoPicker: FC<PhotoPickerProps> = ({
    label,
    hint,
    error,
    value,
    defaultValue,
    onChange,
    accept,
    aspect = DefaultPhotoAspect,
    outputWidth = DefaultPhotoOutputWidth,
    labels,
    slots,
    alt,
    disabled = false,
    required = false,
    className = "",
    id,
    ref,
    "aria-describedby": ariaDescribedBy,
    ...rest
}: PhotoPickerProps) => {
    const generatedId: string = useId();
    const rootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
    const triggerRef: RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement | null>(null);
    const mergedRef: (element: HTMLDivElement | null) => void = useMergedRef<HTMLDivElement>(
        rootRef,
        ref,
    );
    const triggerId: string = `${id ?? generatedId}-trigger`;
    const acceptValue: string = resolveFileAccept(accept ?? "image/*");
    const hintId: string = `${triggerId}-hint`;
    const errorId: string = `${triggerId}-error`;
    const invalid: boolean = error !== (void 0) && error.length > 0;
    const safeAspect: number = Number.isFinite(aspect) && aspect > 0 ? aspect : DefaultPhotoAspect;
    const chooseLabel: string = labels?.choose ?? "Choose photo";
    const editLabel: string = labels?.edit ?? "Edit photo";
    const [preview, setPreview]: [string | void, Dispatch<SetStateAction<string | void>>] =
        useState<string | void>(defaultValue);
    const [draft, setDraft]: [ImageDraft | null, Dispatch<SetStateAction<ImageDraft | null>>] =
        useState<ImageDraft | null>(null);
    const [editorOpen, setEditorOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [picking, setPicking]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const shown: string | void = value ?? preview;
    const triggerStyle: CSSProperties = { aspectRatio: safeAspect };
    const describedBy: string = [
        invalid ? errorId : hint !== (void 0) && hint.length > 0 ? hintId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((entry: string): boolean => entry.length > 0)
        .join(" ");
    const pick: () => Promise<File[]> = useFilePick(acceptValue, {
        multiple: false,
        disabled,
        inputRef,
    });
    const ripple: RippleHandlers = useRipple({ trigger: "both", disabled });

    /**
     * Reads the chosen image as Base64 and opens the crop editor.
     * @example
     * void handlePick();
     * @returns Nothing.
     */
    const handlePick: () => Promise<void> = async (): Promise<void> => {
        if (disabled || picking) {
            return;
        }

        setPicking(true);

        try {
            const files: File[] = await pick();
            const file: File | void = files[0];

            if (file === (void 0)) {
                return;
            }

            const dataUrl: string = await readFileAsDataUrl(file);

            setDraft({ file, dataUrl });
            triggerRef.current?.focus();
            setEditorOpen(true);
        } catch {
            // An unreadable file leaves the previous preview in place.
        } finally {
            setPicking(false);
        }
    };

    /**
     * Publishes the final image and mirrors it in the preview.
     * @param selection - Cropped or original image emitted by the editor.
     * @example
     * emit({ file, dataUrl, cropped: true });
     * @returns Nothing.
     */
    const emit: (selection: ImageSelection) => void = (selection: ImageSelection): void => {
        setPreview(selection.dataUrl);
        onChange?.(selection);
        dispatchChange(rootRef.current, selection);
    };

    /**
     * Accepts the rendered crop.
     * @param result - File and Base64 preview produced by the editor.
     * @example
     * handleDone(cropped);
     * @returns Nothing.
     */
    const handleDone: (result: CroppedImage) => void = (result: CroppedImage): void => {
        if (draft !== null) {
            emit({ file: result.file, dataUrl: result.dataUrl, cropped: true });
        }

        setEditorOpen(false);
        setDraft(null);
    };

    /**
     * Keeps the original image when the user cancels the crop.
     * @example
     * handleUseOriginal();
     * @returns Nothing.
     */
    const handleUseOriginal: () => void = (): void => {
        if (draft !== null) {
            emit({ file: draft.file, dataUrl: draft.dataUrl, cropped: false });
        }

        setEditorOpen(false);
        setDraft(null);
    };

    /**
     * Abandons the selection without emitting a change event.
     * @example
     * handleAbort();
     * @returns Nothing.
     */
    const handleAbort: () => void = (): void => {
        setEditorOpen(false);
        setDraft(null);
    };

    /**
     * Opens the native file dialog for a pick slot action.
     * @example
     * <button onClick={openPicker}>Choose</button>
     * @returns Nothing.
     */
    const openPicker: () => void = (): void => {
        void handlePick();
    };

    const pickSlot: ((context: PhotoPickerSlotContext) => ReactNode) | void = slots?.pick;
    const previewSlot: ((context: PhotoPickerPreviewSlotContext) => ReactNode) | void =
        slots?.preview;
    const triggerContent: ReactNode =
        shown === (void 0)
            ? pickSlot === (void 0)
                ? (
                      <span className="photo-picker__empty">
                          <Icon name="Photo" size={28} />
                          <span className="photo-picker__empty-label">{chooseLabel}</span>
                      </span>
                  )
                // eslint-disable-next-line react-hooks/refs -- The slot receives an event-only opener; refs are read on click, not during render.
                : pickSlot({ open: openPicker, disabled, value: null })
            : previewSlot === (void 0)
              ? <img className="photo-picker__image" src={shown} alt={alt ?? ""} />
              // eslint-disable-next-line react-hooks/refs -- The slot receives an event-only opener; refs are read on click, not during render.
              : previewSlot({ open: openPicker, disabled, value: shown });

    return (
        <div
            {...rest}
            ref={mergedRef}
            id={id}
            className={cx("photo-picker", className)}
            data-disabled={disabled ? "true" : "false"}
            data-invalid={invalid ? "true" : "false"}
        >
            <PickerField
                label={label}
                hint={hint}
                error={error}
                htmlFor={triggerId}
                hintId={hintId}
                errorId={errorId}
                required={required}
                disabled={disabled}
            >
                <button
                    ref={triggerRef}
                    id={triggerId}
                    type="button"
                    className={cx(
                        "photo-picker__trigger",
                        shown === (void 0) && "photo-picker__trigger--empty",
                    )}
                    style={triggerStyle}
                    disabled={disabled}
                    aria-label={`${label}: ${shown === (void 0) ? chooseLabel : editLabel}`}
                    aria-invalid={invalid ? "true" : (void 0)}
                    aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                    onPointerDown={ripple.onPointerDown}
                    onPointerEnter={ripple.onPointerEnter}
                    onKeyDown={ripple.onKeyDown}
                    onClick={openPicker}
                >
                    {triggerContent}
                    <span className="photo-picker__badge" aria-hidden="true">
                        <Icon name={shown === (void 0) ? "Plus" : "Camera"} size={16} />
                    </span>
                </button>
            </PickerField>
            <input
                ref={inputRef}
                type="file"
                accept={acceptValue}
                data-file-pick="true"
                disabled={disabled}
                hidden
            />
            {draft === null ? null : (
                <ImageEditorDialog
                    open={editorOpen}
                    src={draft.dataUrl}
                    fileName={draft.file.name}
                    mimeType={draft.file.type}
                    aspect={safeAspect}
                    shape="rect"
                    outputWidth={outputWidth}
                    title={editLabel}
                    labels={labels}
                    renderCrop={slots?.crop}
                    alt={alt ?? label}
                    onDone={handleDone}
                    onUseOriginal={handleUseOriginal}
                    onAbort={handleAbort}
                />
            )}
        </div>
    );
};

export default PhotoPicker;
