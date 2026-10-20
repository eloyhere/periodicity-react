import {
    useContext,
    useId,
    type ChangeEvent,
    type ChangeEventHandler,
    type FC,
    type InputHTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
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
 * Fields: value, label, description, disabled, className, id, name, ref, and native input attributes.
 * Native input attributes are forwarded to the hidden `<input>`; `className` and `style` apply to the option root.
 * @param value - Option value compared with the group selection.
 * @param label - Visible label content.
 * @param description - Supporting text shown below the label.
 * @param disabled - Disables the option; a disabled group also disables every option.
 * @param className - Extra classes for the option root.
 * @param id - Id for the underlying input; generated when omitted.
 * @param name - Form field name; a surrounding RadioGroup supplies its own name.
 * @param ref - Ref to the underlying input element.
 * @example
 * <Radio value="weekly" label="Weekly" description="Every Monday" />
 */
export interface RadioProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "checked" | "children"> {
    value: string;
    label: ReactNode;
    description?: ReactNode;
    disabled?: boolean;
    className?: string;
    ref?: Ref<HTMLInputElement>;
}

/**
 * Renders one option inside a RadioGroup using a hidden native radio input.
 * @param props - Option value, label, description, disabled state, and class name.
 * @example
 * <Radio value="monthly" label="Monthly" />
 * @returns A radio option element.
 */
const Radio: FC<RadioProps> = ({
    value,
    label,
    description,
    disabled = false,
    readOnly = false,
    className = "",
    style,
    id,
    name,
    onChange,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    "aria-labelledby": ariaLabelledBy,
    ref,
    ...rest
}: RadioProps) => {
    const group: RadioGroupContextValue | null = useContext(RadioGroupContext);
    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const labelId: string = `${inputId}-label`;
    const descriptionId: string = `${inputId}-description`;
    const isDisabled: boolean = disabled || (group !== null && group.disabled);
    const isChecked: boolean = group !== null && group.value === value;
    const hasDescription: boolean = hasContent(description);
    const describedBy: string = [
        hasDescription ? descriptionId : "",
        group === null ? "" : group.describedBy,
        ariaDescribedBy ?? "",
    ]
        .filter((item: string): boolean => item.length > 0)
        .join(" ");
    const labelledBy: string = [labelId, ariaLabelledBy ?? ""]
        .filter((item: string): boolean => item.length > 0)
        .join(" ");

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent<HTMLInputElement>): void => {
        if (!isDisabled && !readOnly) {
            group?.select(value);
        }

        onChange?.(event);
    };

    return (
        <Surface
            className={cx("radio", isChecked && "radio--checked", className)}
            style={style}
            ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
            stateLayer={!isDisabled}
            disabled={isDisabled}
        >
            <input
                {...rest}
                ref={ref}
                id={inputId}
                className="radio__native"
                type="radio"
                name={group === null ? name : group.name}
                value={value}
                {...(group === null ? {} : { checked: isChecked })}
                disabled={isDisabled}
                readOnly={readOnly}
                aria-readonly={readOnly ? true : (void 0)}
                aria-labelledby={labelledBy}
                aria-invalid={group !== null && group.invalid ? true : ariaInvalid}
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
