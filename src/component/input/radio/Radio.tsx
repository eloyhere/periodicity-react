import { useContext, useId, type ChangeEventHandler, type FC, type ReactNode } from "react";
import cx from "../../foundation/cx";
import Surface from "../../surface/Surface";
import { RadioGroupContext, type RadioGroupContextValue } from "./RadioGroupContext";
import "./Radio.css";

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
 * Props for a single radio option.
 * Type: interface.
 * Fields: value, label, description, disabled, className.
 * @example
 * <Radio value="weekly" label="Weekly" description="Every Monday" />
 */
export interface RadioProps {
    value: string;
    label: ReactNode;
    description?: ReactNode;
    disabled?: boolean;
    className?: string;
}

/**
 * Renders one option inside a RadioGroup using a hidden native radio input.
 * @param props - Option value, label, description, disabled state, and class name.
 * @example
 * <Radio value="monthly" label="Monthly" />
 * @returns A radio option element.
 */
const Radio: FC<RadioProps> = ({ value, label, description, disabled = false, className = "" }: RadioProps) => {
    const group: RadioGroupContextValue | null = useContext(RadioGroupContext);
    const inputId: string = useId();
    const labelId: string = `${inputId}-label`;
    const descriptionId: string = `${inputId}-description`;
    const isDisabled: boolean = disabled || (group !== null && group.disabled);
    const isChecked: boolean = group !== null && group.value === value;
    const hasDescription: boolean = hasContent(description);
    const describedBy: string = [hasDescription ? descriptionId : "", group === null ? "" : group.describedBy]
        .filter((part: string): boolean => part.length > 0)
        .join(" ");

    const handleChange: ChangeEventHandler<HTMLInputElement> = (): void => {
        group?.select(value);
    };

    return (
        <Surface
            className={cx("radio", isChecked && "radio--checked", className)}
            ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
            stateLayer={!isDisabled}
            disabled={isDisabled}
        >
            <input
                id={inputId}
                className="radio__native"
                type="radio"
                name={group === null ? (void 0) : group.name}
                value={value}
                checked={group === null ? (void 0) : isChecked}
                disabled={isDisabled}
                aria-labelledby={labelId}
                aria-invalid={group === null ? (void 0) : group.invalid}
                aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                onChange={handleChange}
            />

            <label className="radio__label" htmlFor={inputId}>
                <Surface
                    className="radio__indicator"
                    background={<span className="radio__indicator-background" />}
                    foreground={<span className="radio__indicator-edge" />}
                >
                    <span className="radio__dot" aria-hidden="true" />
                </Surface>

                <span className="radio__copy">
                    <span className="radio__text" id={labelId}>
                        {label}
                    </span>
                    {hasDescription ? (
                        <span className="radio__description" id={descriptionId}>
                            {description}
                        </span>
                    ) : null}
                </span>
            </label>
        </Surface>
    );
};

export default Radio;
