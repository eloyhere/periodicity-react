import {
    type ChangeEvent,
    type ChangeEventHandler,
    type FC,
    type InputHTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
import cx from "../../foundation/cx";
import useControllableState from "../../foundation/useControllableState";
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
 * Native input attributes are forwarded to the hidden checkbox; `className` and `style` apply to the field root.
 * Fields: checked, defaultChecked, onChange, label, size, description, error, required, disabled, readOnly,
 * id, className, ref, and native input attributes.
 * @param checked - Controlled checked state.
 * @param defaultChecked - Initial checked state when uncontrolled.
 * @param onChange - Called with the next checked state.
 * @param label - Visible label content.
 * @param size - Control size.
 * @param description - Supporting text shown below the label.
 * @param error - Validation message; marks the field invalid.
 * @param required - Marks the native input as required.
 * @param disabled - Disables the native input and the state layer.
 * @param readOnly - Keeps the native input focusable but suppresses internal state changes.
 * @param id - Id for the native input; generated when omitted.
 * @param className - Extra classes for the field root.
 * @param ref - Ref to the underlying input element.
 * @example
 * <Switch label="Reminders" checked={enabled} onChange={setEnabled} description="A quiet nudge" />
 */
export interface SwitchProps
    extends Omit<
        InputHTMLAttributes<HTMLInputElement>,
        "checked" | "defaultChecked" | "onChange" | "type" | "size" | "className"
    > {
    checked?: boolean;
    defaultChecked?: boolean;
    onChange: (next: boolean) => void;
    label: string;
    size?: "sm" | "md" | "lg";
    description?: ReactNode;
    error?: ReactNode;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    id?: string;
    className?: string;
    ref?: Ref<HTMLInputElement>;
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
    defaultChecked = false,
    onChange,
    label,
    size = "md",
    description,
    error,
    required = false,
    disabled = false,
    readOnly = false,
    id,
    className = "",
    style,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ref,
    ...rest
}: SwitchProps) => {
    const field: FieldState = useField({ id, label, hint: description, error, required });
    const [isChecked, setChecked]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: checked,
        defaultValue: defaultChecked,
        onChange,
    });
    const hasDescription: boolean = hasContent(description);
    const describedBy: string = [field.describedBy, ariaDescribedBy ?? ""]
        .filter((item: string): boolean => item.length > 0)
        .join(" ");

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent<HTMLInputElement>): void => {
        if (!disabled && !readOnly) {
            setChecked(event.currentTarget.checked);
        }
    };

    return (
        <div
            className={cx("switch-field", `switch-field--${size}`, className)}
            style={style}
            data-invalid={field.invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
            data-readonly={readOnly ? "true" : "false"}
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
                className={cx("switch", `switch--${size}`, isChecked && "switch--on")}
                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                stateLayer={!disabled}
                disabled={disabled}
            >
                <input
                    {...rest}
                    ref={ref}
                    id={field.controlId}
                    className="switch__native"
                    type="checkbox"
                    role="switch"
                    checked={isChecked}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={required}
                    aria-checked={isChecked}
                    aria-invalid={field.invalid ? true : ariaInvalid}
                    aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
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
