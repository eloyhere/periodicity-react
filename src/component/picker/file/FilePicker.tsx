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
import { useInternational, type InternationalContextValue } from "../../../international";
import { useFilePick, resolveFileAccept, type FilePickAccept } from "./useFilePick";
import { DefaultFilePickerLabels, type FilePickerLabels } from "./filePickerLabels";
import PickerField from "../shared/PickerField";
import type { PickerDataAttributes } from "../shared/native";
import { dispatchChange } from "../shared/dispatchChange";
import "./FilePicker.css";

/**
 * Context handed to the file picker default slot.
 * Type: interface.
 * @param open - Opens the native file dialog; the surrounding trigger already does this.
 * @param disabled - Whether the picker is disabled.
 * @param files - Currently selected files.
 * @param summary - Comma-separated file names, or the empty-state label.
 * @example
 * const slot = ({ summary }: FilePickerSlotContext): ReactNode => <span>{summary}</span>;
 */
export interface FilePickerSlotContext {
    open: () => void;
    disabled: boolean;
    files: readonly File[];
    summary: string;
}

/**
 * Props for the file picker.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `style`, `title`, `aria-*`, `data-*`, `tabIndex`,
 * and pointer, mouse, keyboard, and focus handlers are forwarded to the root element.
 * Fields: label, hint, error, accept, multiple, capture, value, defaultValue, onChange,
 * labels, disabled, required, className, id, ref, children.
 * @param accept - Accepted MIME types or extensions; defaults to every file type.
 * @param multiple - Allows more than one file per selection.
 * @param capture - Preferred camera on devices that expose one.
 * @param value - Controlled list of files to display.
 * @param defaultValue - Initial list of files to display when uncontrolled.
 * @param onChange - Called with the chosen files whenever the user completes a selection.
 * @param labels - Copy overrides for the trigger.
 * @param children - Default slot replacing the trigger contents; pass a function to receive the picker context.
 * Keep slot content presentational because it renders inside the trigger button.
 * @example
 * <FilePicker label="Attachment" accept=".pdf,.png" onChange={(files) => upload(files)} />
 * @example
 * <FilePicker label="Attachment">
 *     {({ summary }) => <span className="file-summary">{summary}</span>}
 * </FilePicker>
 */
export interface FilePickerProps
    extends Omit<
            HTMLAttributes<HTMLDivElement>,
            "children" | "className" | "defaultValue" | "onChange"
        >,
        PickerDataAttributes {
    label: string;
    hint?: string;
    error?: string;
    accept?: FilePickAccept;
    multiple?: boolean;
    capture?: "user" | "environment";
    value?: readonly File[];
    defaultValue?: readonly File[];
    onChange?: (files: File[]) => void;
    labels?: Partial<FilePickerLabels>;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    id?: string;
    ref?: Ref<HTMLDivElement>;
    children?: ReactNode | ((context: FilePickerSlotContext) => ReactNode);
}

/**
 * Renders a labelled file field backed by `useFilePick`.
 * A hidden native `input[type="file"]` carries the selection; the trigger paints
 * hover and click ripples. A completed selection calls `onChange` and dispatches
 * a bubbling `change` event carrying the files.
 * @param props - Label, accepted types, selection mode, controlled value, and change handler.
 * @example
 * <FilePicker label="Import" accept="application/json" onChange={setFiles} />
 * @returns A file picker field.
 */
const FilePicker: FC<FilePickerProps> = ({
    label,
    hint,
    error,
    accept,
    multiple = false,
    capture,
    value,
    defaultValue,
    onChange,
    labels,
    disabled = false,
    required = false,
    className = "",
    id,
    ref,
    children,
    "aria-describedby": ariaDescribedBy,
    ...rest
}: FilePickerProps) => {
    const { t }: InternationalContextValue = useInternational();
    const generatedId: string = useId();
    const rootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
    const mergedRef: (element: HTMLDivElement | null) => void = useMergedRef<HTMLDivElement>(
        rootRef,
        ref,
    );
    const triggerId: string = `${id ?? generatedId}-trigger`;
    const acceptValue: string = resolveFileAccept(accept);
    const ripple: RippleHandlers = useRipple({ trigger: "both", disabled });
    const hintId: string = `${triggerId}-hint`;
    const errorId: string = `${triggerId}-error`;
    const invalid: boolean = error !== (void 0) && error.length > 0;
    const [selected, setSelected]: [readonly File[], Dispatch<SetStateAction<readonly File[]>>] =
        useState<readonly File[]>(defaultValue ?? []);
    const [picking, setPicking]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const files: readonly File[] = value ?? selected;
    const chooseLabel: string = labels?.choose ?? DefaultFilePickerLabels.choose;
    const emptyLabel: string = labels?.empty ?? t("noFileSelected");
    const summary: string =
        files.length === 0
            ? emptyLabel
            : files.map((file: File): string => file.name).join(", ");
    const describedBy: string = [
        invalid ? errorId : hint !== (void 0) && hint.length > 0 ? hintId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((entry: string): boolean => entry.length > 0)
        .join(" ");
    const pick: () => Promise<File[]> = useFilePick(acceptValue, {
        multiple,
        capture,
        disabled,
        inputRef,
    });

    /**
     * Opens the native dialog and publishes a completed selection.
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
            const next: File[] = await pick();

            if (next.length === 0) {
                return;
            }

            setSelected(next);
            onChange?.(next);
            dispatchChange(rootRef.current, next);
        } finally {
            setPicking(false);
        }
    };

    /**
     * Opens the native file dialog from the default slot or the trigger.
     * @example
     * <button onClick={openPicker}>Choose</button>
     * @returns Nothing.
     */
    const openPicker: () => void = (): void => {
        void handlePick();
    };

    const slotContent: ReactNode =
        typeof children === "function"
            ? children({ open: openPicker, disabled, files, summary })
            : children;

    return (
        <div
            {...rest}
            ref={mergedRef}
            id={id}
            className={cx("file-picker", className)}
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
                    id={triggerId}
                    type="button"
                    className="file-picker__trigger"
                    disabled={disabled || picking}
                    aria-label={`${label}: ${summary}`}
                    aria-invalid={invalid ? "true" : (void 0)}
                    aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                    onPointerDown={ripple.onPointerDown}
                    onPointerEnter={ripple.onPointerEnter}
                    onKeyDown={ripple.onKeyDown}
                    onClick={openPicker}
                >
                    {children === (void 0) ? (
                        <>
                            <span className="file-picker__icon" aria-hidden="true">
                                <Icon name="Upload" size={18} />
                            </span>
                            <span
                                className={cx(
                                    "file-picker__value",
                                    files.length === 0 && "file-picker__value--empty",
                                )}
                            >
                                {summary}
                            </span>
                            <span className="file-picker__action" aria-hidden="true">
                                {chooseLabel}
                            </span>
                        </>
                    ) : (
                        slotContent
                    )}
                </button>
            </PickerField>
            <input
                ref={inputRef}
                type="file"
                accept={acceptValue}
                multiple={multiple}
                {...(capture === (void 0) ? {} : { capture })}
                data-file-pick="true"
                disabled={disabled}
                hidden
            />
        </div>
    );
};

export default FilePicker;
