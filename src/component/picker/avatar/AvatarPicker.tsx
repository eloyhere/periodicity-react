import {
    useId,
    useRef,
    useState,
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
import Avatar, { type AvatarSize } from "../../thumb/Avatar";
import { useFilePick, resolveFileAccept, type FilePickAccept } from "../file/useFilePick";
import PickerField from "../shared/PickerField";
import ImageEditorDialog, { type ImageCropSlotContext } from "../shared/ImageEditorDialog";
import { readFileAsDataUrl, type CroppedImage } from "../shared/imageCrop";
import type { ImagePickerLabels } from "../shared/imagePickerLabels";
import type { ImageDraft, ImageSelection } from "../shared/imageSelection";
import type { PickerDataAttributes } from "../shared/native";
import { dispatchChange } from "../shared/dispatchChange";
import "./AvatarPicker.css";

/**
 * Context handed to the avatar slot.
 * Type: interface.
 * @param open - Opens the native file dialog; the surrounding trigger already does this.
 * @param disabled - Whether the picker is disabled.
 * @param value - Current Base64 preview, or `null` before a selection.
 * @param name - Display name used by the initials fallback.
 * @example
 * const avatar = ({ value }: AvatarPickerSlotContext): ReactNode => <img src={value ?? fallback} alt="" />;
 */
export interface AvatarPickerSlotContext {
    open: () => void;
    disabled: boolean;
    value: string | null;
    name: string;
}

/**
 * Replaceable avatar picker UI.
 * Type: interface.
 * @param avatar - Replaces the default Avatar preview.
 * @param crop - Replaces the crop stage and controls in the editor.
 * Keep avatar content presentational because it renders inside the trigger button.
 * @example
 * <AvatarPicker
 *     label="Profile photo"
 *     slots={{
 *         avatar: ({ value }) => <img src={value ?? "/fallback.png"} alt="" />,
 *         crop: ({ src }) => <img src={src} alt="" />,
 *     }}
 * />
 */
export interface AvatarPickerSlots {
    avatar?: (context: AvatarPickerSlotContext) => ReactNode;
    crop?: (context: ImageCropSlotContext) => ReactNode;
}

/**
 * Props for the avatar picker.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `style`, `title`, `aria-*`, `data-*`, `tabIndex`,
 * and pointer, mouse, keyboard, and focus handlers are forwarded to the root element.
 * Fields: label, name, hint, error, value, defaultValue, onChange, accept, outputWidth,
 * labels, slots, size, disabled, required, className, id, ref.
 * @param name - Display name used for the initials fallback.
 * @param value - Controlled Base64 preview.
 * @param defaultValue - Initial Base64 preview when uncontrolled.
 * @param onChange - Called only after the editor closes with Done or Cancel.
 * @param outputWidth - Pixel width of the square cropped file; defaults to `512`.
 * @param slots - Avatar and crop slot replacements.
 * @param size - Avatar size; defaults to `xl`.
 * @example
 * <AvatarPicker label="Profile photo" name="Mira Chen" onChange={saveAvatar} />
 */
export interface AvatarPickerProps
    extends Omit<
            HTMLAttributes<HTMLDivElement>,
            "children" | "className" | "defaultValue" | "onChange"
        >,
        PickerDataAttributes {
    label: string;
    name?: string;
    hint?: string;
    error?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (selection: ImageSelection) => void;
    accept?: FilePickAccept;
    outputWidth?: number;
    labels?: Partial<ImagePickerLabels>;
    slots?: AvatarPickerSlots;
    size?: AvatarSize;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    id?: string;
    ref?: Ref<HTMLDivElement>;
}

const DefaultAvatarOutputWidth: number = 512;

/**
 * Renders a circular avatar field with a Base64 preview and a square crop editor.
 * A hidden native `input[type="file"]` carries the selection, and the avatar
 * paints hover and click ripples. Choosing a file opens the editor; the change
 * event fires only when the editor closes through Done (cropped) or Cancel
 * (original). Closing the dialog abandons the selection without emitting anything.
 * @param props - Label, display name, preview value, and change handler.
 * @example
 * <AvatarPicker label="Avatar" name="Ada Lovelace" onChange={({ file }) => upload(file)} />
 * @returns An avatar picker field.
 */
const AvatarPicker: FC<AvatarPickerProps> = ({
    label,
    name,
    hint,
    error,
    value,
    defaultValue,
    onChange,
    accept,
    outputWidth = DefaultAvatarOutputWidth,
    labels,
    slots,
    size = "xl",
    disabled = false,
    required = false,
    className = "",
    id,
    ref,
    "aria-describedby": ariaDescribedBy,
    ...rest
}: AvatarPickerProps) => {
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
    const chooseLabel: string = labels?.choose ?? "Choose avatar";
    const editLabel: string = labels?.edit ?? "Edit avatar";
    const displayName: string = name ?? label;
    const [preview, setPreview]: [string | void, Dispatch<SetStateAction<string | void>>] =
        useState<string | void>(defaultValue);
    const [draft, setDraft]: [ImageDraft | null, Dispatch<SetStateAction<ImageDraft | null>>] =
        useState<ImageDraft | null>(null);
    const [editorOpen, setEditorOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [picking, setPicking]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const shown: string | void = value ?? preview;
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
     * Reads the chosen image as Base64 and opens the square crop editor.
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
     * Publishes the final avatar and mirrors it in the preview.
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
     * Accepts the rendered square crop.
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
     * Opens the native file dialog for an avatar slot action.
     * @example
     * <button onClick={openPicker}>Choose</button>
     * @returns Nothing.
     */
    const openPicker: () => void = (): void => {
        void handlePick();
    };

    const avatarSlot: ((context: AvatarPickerSlotContext) => ReactNode) | void = slots?.avatar;
    const avatarContent: ReactNode =
        avatarSlot === (void 0)
            ? (
                  <Avatar
                      name={displayName}
                      src={shown === (void 0) ? "" : shown}
                      size={size}
                      tone="accent"
                  />
              )
            // eslint-disable-next-line react-hooks/refs -- The slot receives an event-only opener; refs are read on click, not during render.
            : avatarSlot({
                  open: openPicker,
                  disabled,
                  value: shown === (void 0) ? null : shown,
                  name: displayName,
              });

    return (
        <div
            {...rest}
            ref={mergedRef}
            id={id}
            className={cx("avatar-picker", className)}
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
                    className="avatar-picker__trigger"
                    disabled={disabled}
                    aria-label={`${label}: ${shown === (void 0) ? chooseLabel : editLabel}`}
                    aria-invalid={invalid ? "true" : (void 0)}
                    aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                    onClick={openPicker}
                >
                    {avatarContent}
                    <span
                        className="avatar-picker__ripple"
                        aria-hidden="true"
                        onPointerDown={ripple.onPointerDown}
                        onPointerEnter={ripple.onPointerEnter}
                    />
                    <span className="avatar-picker__badge" aria-hidden="true">
                        <Icon name={shown === (void 0) ? "Plus" : "Camera"} size={14} />
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
                    aspect={1}
                    shape="circle"
                    outputWidth={outputWidth}
                    title={editLabel}
                    labels={labels}
                    renderCrop={slots?.crop}
                    alt={displayName}
                    onDone={handleDone}
                    onUseOriginal={handleUseOriginal}
                    onAbort={handleAbort}
                />
            )}
        </div>
    );
};

export default AvatarPicker;
