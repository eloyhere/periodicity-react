import { useId, type FC, type FieldsetHTMLAttributes, type ReactNode, type Ref } from "react";
import cx from "../../foundation/cx";
import useControllableState from "../../foundation/useControllableState";
import useField, { type FieldState } from "../../foundation/useField";
import { RadioGroupContext, type RadioGroupContextValue } from "./RadioGroupContext";
import "./RadioGroup.css";

/**
 * Arrangement of radio options inside a group.
 * Type: type alias.
 * Fields: none.
 * @example
 * const orientation: RadioOrientation = "horizontal";
 */
export type RadioOrientation = "horizontal" | "vertical";

/**
 * Props for the RadioGroup.
 * Type: interface.
 * Native fieldset attributes are forwarded to the `<fieldset>`; `className` and `style` apply to that element.
 * Fields: value, defaultValue, onValueChange, label, hint, error, disabled, orientation, name, children,
 * className, id, ref, and native fieldset attributes.
 * @param value - Controlled selected option value.
 * @param defaultValue - Initial selected value when uncontrolled.
 * @param onValueChange - Called with the next selected option value.
 * @param label - Visible legend text.
 * @param hint - Supporting text shown below the group.
 * @param error - Validation message; replaces the hint and marks the group invalid.
 * @param disabled - Disables every option natively.
 * @param orientation - Arrangement of the options.
 * @param name - Form field name shared by the native radios; generated when omitted.
 * @param children - Radio options belonging to the group.
 * @param className - Extra classes for the fieldset.
 * @param id - Id for the fieldset; generated when omitted.
 * @param ref - Ref to the underlying fieldset element.
 * @example
 * <RadioGroup label="Cadence" defaultValue="daily">
 *     <Radio value="daily" label="Daily" />
 *     <Radio value="weekly" label="Weekly" />
 * </RadioGroup>
 */
export interface RadioGroupProps
    extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "children" | "className" | "disabled"> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    label?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    orientation?: RadioOrientation;
    name?: string;
    children: ReactNode;
    className?: string;
    id?: string;
    ref?: Ref<HTMLFieldSetElement>;
}

/**
 * Renders a labelled fieldset that coordinates a group of native radio inputs.
 * @param props - Controlled or default value, label, hint, error, disabled state, and orientation.
 * @example
 * <RadioGroup label="Plan" defaultValue="monthly" orientation="horizontal">
 *     <Radio value="monthly" label="Monthly" />
 *     <Radio value="yearly" label="Yearly" />
 * </RadioGroup>
 * @returns A radio group element.
 */
const RadioGroup: FC<RadioGroupProps> = ({
    value,
    defaultValue = "",
    onValueChange,
    label,
    hint,
    error,
    disabled = false,
    orientation = "vertical",
    name,
    children,
    className = "",
    style,
    id,
    ref,
    ...rest
}: RadioGroupProps) => {
    const field: FieldState = useField({ id, hint, error });
    const generatedName: string = useId();
    const groupName: string = name ?? generatedName;
    const legendId: string = `${field.controlId}-legend`;
    const hasLabel: boolean = label !== (void 0) && label.length > 0;
    const hasHint: boolean = hint !== (void 0) && hint.length > 0;
    const describedBy: string = field.invalid ? field.errorId : hasHint ? field.hintId : "";
    const [selectedValue, setSelectedValue]: readonly [
        string,
        (next: string | ((previous: string) => string)) => void,
    ] = useControllableState<string>({
        value,
        defaultValue,
        onChange: onValueChange,
    });

    const contextValue: RadioGroupContextValue = {
        name: groupName,
        value: selectedValue,
        disabled,
        select: setSelectedValue,
        describedBy,
        invalid: field.invalid,
    };

    return (
        <fieldset
            {...rest}
            ref={ref}
            id={field.controlId}
            className={cx("radio-group", `radio-group--${orientation}`, className)}
            style={style}
            disabled={disabled}
            data-invalid={field.invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
        >
            {hasLabel ? (
                <legend className="radio-group__legend" id={legendId}>
                    {label}
                </legend>
            ) : null}

            <div
                className="radio-group__options"
                role="radiogroup"
                aria-labelledby={hasLabel ? legendId : (void 0)}
                aria-label={hasLabel ? (void 0) : "Options"}
                aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                aria-invalid={field.invalid ? true : (void 0)}
                aria-disabled={disabled ? true : (void 0)}
                aria-orientation={orientation}
                data-orientation={orientation}
            >
                <RadioGroupContext.Provider value={contextValue}>{children}</RadioGroupContext.Provider>
            </div>

            {field.invalid || hasHint ? (
                <div className="radio-group__support">
                    {field.invalid ? (
                        <span className="radio-group__error" id={field.errorId} aria-live="polite">
                            {error}
                        </span>
                    ) : (
                        <span className="radio-group__hint" id={field.hintId}>
                            {hint}
                        </span>
                    )}
                </div>
            ) : null}
        </fieldset>
    );
};

export default RadioGroup;
