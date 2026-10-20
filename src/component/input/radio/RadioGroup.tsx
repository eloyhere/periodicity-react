import { useId, type FC, type ReactNode } from "react";
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
 * Fields: value, defaultValue, onValueChange, label, hint, error, disabled, orientation, children, className.
 * @example
 * <RadioGroup label="Cadence" defaultValue="daily">
 *     <Radio value="daily" label="Daily" />
 *     <Radio value="weekly" label="Weekly" />
 * </RadioGroup>
 */
export interface RadioGroupProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    label?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    orientation?: RadioOrientation;
    children: ReactNode;
    className?: string;
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
    children,
    className = "",
}: RadioGroupProps) => {
    const field: FieldState = useField({ hint, error });
    const groupName: string = useId();
    const legendId: string = `${groupName}-legend`;
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
            className={cx("radio-group", `radio-group--${orientation}`, className)}
            data-invalid={field.invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
            disabled={disabled}
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
