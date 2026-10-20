import {
    useId,
    useState,
    type ChangeEvent,
    type Dispatch,
    type FC,
    type FormEvent,
    type ReactElement,
    type SetStateAction,
} from "react";
import Button from "../button/Button";
import TextInput from "../input/text/TextInput";
import Dialog from "./Dialog";
import "./InputDialog.css";

/**
 * Props for the single-field input dialog.
 * Type: interface.
 * Fields: open, onClose, onSubmit, title, label, defaultValue, placeholder, hint, error,
 * submitLabel, cancelLabel, required.
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
export interface InputDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    title: string;
    label: string;
    defaultValue?: string;
    placeholder?: string;
    hint?: string;
    error?: string;
    submitLabel?: string;
    cancelLabel?: string;
    required?: boolean;
}

/**
 * Renders the mounted body of an input dialog and owns its draft value.
 * @param props - Open state, callbacks, field copy, and validation display.
 * @example
 * <InputDialogContent {...props} />
 * @returns A dialog containing a single-field form.
 */
const InputDialogContent: FC<InputDialogProps> = ({
    open,
    onClose,
    onSubmit,
    title,
    label,
    defaultValue = "",
    placeholder,
    hint,
    error,
    submitLabel = "Submit",
    cancelLabel = "Cancel",
    required = false,
}: InputDialogProps): ReactElement => {
    const [value, setValue]: [string, Dispatch<SetStateAction<string>>] = useState<string>(defaultValue);
    const formId: string = useId();
    const submitDisabled: boolean = required && value.trim().length === 0;

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
            open={open}
            onClose={onClose}
            title={title}
            className="input-dialog"
            size="sm"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        {cancelLabel}
                    </Button>
                    <Button type="submit" form={formId} disabled={submitDisabled}>
                        {submitLabel}
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
    if (!props.open) {
        return null;
    }

    return <InputDialogContent {...props} />;
};

export default InputDialog;
