import { type FC, type MouseEventHandler, type ReactNode } from "react";
import cx from "../../foundation/cx";
import "./PickerField.css";

/**
 * Props for the shared picker field shell.
 * Type: interface.
 * Fields: label, hint, error, htmlFor, disabled, children, className, onClick.
 * @example
 * <PickerField label="Time">...</PickerField>
 */
export interface PickerFieldProps {
    label: string;
    hint?: string;
    error?: string;
    htmlFor?: string;
    disabled?: boolean;
    children: ReactNode;
    className?: string;
    onClick?: MouseEventHandler<HTMLDivElement>;
}

/**
 * Renders a Material outlined shell around any native picker control.
 * @param props - Label, support text, and control.
 * @example
 * <PickerField label="Time" hint="24 hour clock"><input type="time" /></PickerField>
 * @returns A picker field shell.
 */
const PickerField: FC<PickerFieldProps> = ({
    label,
    hint,
    error,
    htmlFor,
    disabled = false,
    children,
    className = "",
    onClick,
}: PickerFieldProps) => {
    const invalid: boolean = error !== (void 0) && error.length > 0;

    return (
        <div
            className={cx("picker-field", disabled && "picker-field--disabled", className)}
            data-invalid={invalid ? "true" : "false"}
            onClick={onClick}
        >
            <label className="picker-field__label" htmlFor={htmlFor}>
                {label}
            </label>
            <div className="picker-field__control">{children}</div>
            {invalid ? (
                <p className="picker-field__error" role="alert">
                    {error}
                </p>
            ) : hint === (void 0) || hint.length === 0 ? null : (
                <p className="picker-field__hint">{hint}</p>
            )}
        </div>
    );
};

export default PickerField;
