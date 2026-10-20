import { type ChangeEvent, type ChangeEventHandler, type FC, type ReactNode } from "react";
import cx from "../../foundation/cx";
import useField, { type FieldState } from "../../foundation/useField";
import Surface from "../../surface/Surface";
import "./Switch.css";

/**
 * Checks whether a React node renders visible content.
 * @param value - Node to inspect.
 * @example
 * const visible = hasContent(description);
 * @returns True when the node is renderable and not empty.
 */
const hasContent: (value: ReactNode) => boolean = (value: ReactNode): boolean =>
    value !== (void 0) && value !== null && value !== false && value !== "";

/**
 * Props for the Switch.
 * Type: interface.
 * Fields: checked, onChange, label, size, description, error, required, disabled, id, className.
 * @example
 * <Switch label="Reminders" checked={enabled} onChange={setEnabled} description="A quiet nudge" />
 */
export interface SwitchProps {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
    size?: "sm" | "md" | "lg";
    description?: ReactNode;
    error?: ReactNode;
    required?: boolean;
    disabled?: boolean;
    id?: string;
    className?: string;
}

/**
 * Renders a labelled switch on a Surface track with a native checkbox underneath.
 * @param props - Checked state, change handler, label, description, error, size, and disabled state.
 * @example
 * <Switch label="Weekly digest" checked={digest} onChange={setDigest} size="sm" />
 * @returns A switch element.
 */
const Switch: FC<SwitchProps> = ({
    checked,
    onChange,
    label,
    size = "md",
    description,
    error,
    required = false,
    disabled = false,
    id,
    className = "",
}: SwitchProps) => {
    const field: FieldState = useField({ id, label, hint: description, error, required });
    const hasDescription: boolean = hasContent(description);

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent<HTMLInputElement>): void => {
        onChange(event.currentTarget.checked);
    };

    return (
        <div
            className={cx("switch-field", `switch-field--${size}`, className)}
            data-invalid={field.invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
        >
            <div className="switch-field__copy">
                <label className="switch-field__label" htmlFor={field.controlId}>
                    {label}
                    {required ? (
                        <span className="switch-field__required" aria-hidden="true">
                            *
                        </span>
                    ) : null}
                </label>
                {hasDescription ? (
                    <span className="switch-field__description" id={field.hintId}>
                        {description}
                    </span>
                ) : null}
                {field.invalid ? (
                    <span className="switch-field__error" id={field.errorId} aria-live="polite">
                        {error}
                    </span>
                ) : null}
            </div>

            <Surface
                className={cx("switch", `switch--${size}`, checked && "switch--on")}
                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                stateLayer={!disabled}
                disabled={disabled}
            >
                <input
                    id={field.controlId}
                    className="switch__native"
                    type="checkbox"
                    role="switch"
                    checked={checked}
                    disabled={disabled}
                    required={required}
                    aria-checked={checked}
                    aria-invalid={field.invalid}
                    aria-describedby={field.describedBy.length > 0 ? field.describedBy : (void 0)}
                    onChange={handleChange}
                />

                <span className="switch__track" aria-hidden="true">
                    <span className="switch__thumb" />
                </span>
            </Surface>
        </div>
    );
};

export default Switch;
