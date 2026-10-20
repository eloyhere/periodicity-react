import {
    useId,
    type ChangeEvent,
    type FC,
    type FormEvent,
    type ReactElement,
} from "react";
import Button from "../button/Button";
import cx from "../foundation/cx";
import useControllableState from "../foundation/useControllableState";
import TextInput from "../input/text/TextInput";
import Dialog, { type DialogProps } from "./Dialog";
import { useInternational, type InternationalContextValue } from "../../international";
import "./InputDialog.css";

/**
 * Props for the single-field input dialog.
 * Type: interface.
 * Fields: open, defaultOpen, onOpenChange, onClose, onSubmit, title, label, value, defaultValue,
 * onValueChange, placeholder, hint, error, submitLabel, cancelLabel, required, className,
 * plus all remaining dialog props and native dialog attributes.
 * @example
 * <InputDialog
 *     open={open}
 *     onClose={close}
 *     onSubmit={rename}
 *     title="Rename ritual"
 *     label="Ritual name"
 *     defaultValue="Morning pages"
 * />
 */
export interface InputDialogProps
    extends Omit<DialogProps, "role" | "size" | "title" | "children" | "footer" | "onSubmit"> {
    title: string;
    label: string;
    /** Controlled draft value; omit to let the dialog own the draft. */
    value?: string;
    defaultValue?: string;
    /** Called with the next draft value whenever the field changes. */
    onValueChange?: (value: string) => void;
    placeholder?: string;
    hint?: string;
    error?: string;
    submitLabel?: string;
    cancelLabel?: string;
    required?: boolean;
    onSubmit: (value: string) => void;
}

/**
 * Renders the mounted body of an input dialog and owns its draft value.
 * The draft may be controlled through `value` and `onValueChange`.
 * @param props - Open state, callbacks, field copy, and validation display.
 * @example
 * <InputDialogContent {...props} />
 * @returns A dialog containing a single-field form.
 */
const InputDialogContent: FC<InputDialogProps> = ({
    open,
    defaultOpen,
    onOpenChange,
    onClose,
    title,
    label,
    value: valueProp,
    defaultValue = "",
    onValueChange,
    placeholder,
    hint,
    error,
    submitLabel,
    cancelLabel,
    required = false,
    onSubmit,
    className = "",
    ...rest
}: InputDialogProps): ReactElement => {
    const { t }: InternationalContextValue = useInternational();
    const [value, setValue]: readonly [
        string,
        (next: string | ((previous: string) => string)) => void,
    ] = useControllableState<string>({
        value: valueProp,
        defaultValue,
        onChange: onValueChange,
    });
    const formId: string = useId();
    const submitDisabled: boolean = required && value.trim().length === 0;
    const resolvedSubmitLabel: string = submitLabel ?? t("submit");
    const resolvedCancelLabel: string = cancelLabel ?? t("cancel");

    const handleChange: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        setValue(event.target.value);
    };

    const handleSubmit: (event: FormEvent<HTMLFormElement>) => void = (
        event: FormEvent<HTMLFormElement>,
    ): void => {
        event.preventDefault();

        if (required && value.trim().length === 0) {
            return;
        }

        onSubmit(value);
    };

    return (
        <Dialog
            {...rest}
            open={open}
            defaultOpen={defaultOpen}
            onOpenChange={onOpenChange}
            onClose={onClose}
            title={title}
            className={cx("input-dialog", className)}
            size="sm"
            footer={
                <>
                    <Button variant="ghost" onClick={(): void => onClose("close-button")}>
                        {resolvedCancelLabel}
                    </Button>
                    <Button type="submit" form={formId} disabled={submitDisabled}>
                        {resolvedSubmitLabel}
                    </Button>
                </>
            }
        >
            <form className="input-dialog__form" id={formId} onSubmit={handleSubmit}>
                <TextInput
                    label={label}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    hint={hint}
                    error={error}
                    required={required}
                    autoComplete="off"
                    data-autofocus="true"
                />
            </form>
        </Dialog>
    );
};

/**
 * Renders a single-field prompt and resets the draft each time it opens.
 * @param props - Open state, callbacks, field copy, and validation display.
 * @example
 * <InputDialog
 *     open={open}
 *     onClose={close}
 *     onSubmit={save}
 *     title="New label"
 *     label="Label"
 *     required
 * />
 * @returns An input dialog, or null while closed.
 */
const InputDialog: FC<InputDialogProps> = (props: InputDialogProps): ReactElement | null => {
    const isOpen: boolean = props.open ?? props.defaultOpen ?? false;

    if (!isOpen) {
        return null;
    }

    return <InputDialogContent {...props} />;
};

export default InputDialog;
