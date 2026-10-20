import {
    useEffect,
    useRef,
    type ChangeEvent,
    type ChangeEventHandler,
    type FC,
    type InputHTMLAttributes,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import Icon from "../../icon/Icon";
import cx from "../../foundation/cx";
import useControllableState from "../../foundation/useControllableState";
import useField, { type FieldState } from "../../foundation/useField";
import useMergedRef from "../../foundation/useMergedRef";
import Surface from "../../surface/Surface";
import "./Checkbox.css";

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
 * Props for the Material checkbox.
 * Type: interface.
 * Fields: checked, defaultChecked, onCheckedChange, onChange, indeterminate, label, description, error,
 * disabled, readOnly, required, name, value, size, className, id, ref, and native input attributes.
 * Native input attributes are forwarded to the hidden `<input>`; `className` and `style` apply to the field root.
 * @param checked - Controlled checked state.
 * @param defaultChecked - Initial checked state when uncontrolled.
 * @param onCheckedChange - Called with the next checked state.
 * @param onChange - Native change handler, called after the internal state update.
 * @param indeterminate - Paints the mixed state without changing `checked`.
 * @param label - Visible label content.
 * @param description - Supporting text shown below the label.
 * @param error - Validation message; marks the field invalid.
 * @param disabled - Disables the native input and the state layer.
 * @param readOnly - Keeps the native input focusable but suppresses internal state changes.
 * @param required - Marks the input as required natively.
 * @param name - Form field name.
 * @param value - Form field value.
 * @param size - Control size.
 * @param className - Extra classes for the field root.
 * @param ref - Ref to the underlying input element.
 * @example
 * <Checkbox label="Remember me" description="Stay signed in" defaultChecked />
 */
export interface CheckboxProps
    extends Omit<
        InputHTMLAttributes<HTMLInputElement>,
        "checked" | "defaultChecked" | "type" | "value" | "size" | "children"
    > {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    indeterminate?: boolean;
    label: ReactNode;
    description?: ReactNode;
    error?: ReactNode;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    ref?: Ref<HTMLInputElement>;
}

/**
 * Renders a Material checkbox with a circular state layer, ripple, and painted box.
 * @param props - Controlled or default state, mixed state, label, description, error, and size.
 * @example
 * <Checkbox label="Email digest" description="One summary each morning" defaultChecked />
 * @returns A checkbox element.
 */
const Checkbox: FC<CheckboxProps> = ({
    checked,
    defaultChecked = false,
    onCheckedChange,
    onChange,
    indeterminate = false,
    label,
    description,
    error,
    disabled = false,
    readOnly = false,
    required = false,
    name,
    value,
    size = "md",
    className = "",
    style,
    id,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    "aria-labelledby": ariaLabelledBy,
    ref,
    ...rest
}: CheckboxProps) => {
    const field: FieldState = useField({ id, label, hint: description, error, required });
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
    const mergedRef: RefCallback<HTMLInputElement> = useMergedRef<HTMLInputElement>(inputRef, ref);
    const [isChecked, setChecked]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: checked,
        defaultValue: defaultChecked,
        onChange: onCheckedChange,
    });

    useEffect((): void => {
        const node: HTMLInputElement | null = inputRef.current;

        if (node !== null) {
            node.indeterminate = indeterminate;
        }
    }, [indeterminate, isChecked]);

    const handleChange: ChangeEventHandler<HTMLInputElement> = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        if (!disabled && !readOnly) {
            setChecked(event.currentTarget.checked);
        }

        onChange?.(event);
    };

    const labelId: string = `${field.controlId}-label`;
    const describedBy: string = [field.describedBy, ariaDescribedBy ?? ""]
        .filter((item: string): boolean => item.length > 0)
        .join(" ");
    const labelledBy: string = [labelId, ariaLabelledBy ?? ""]
        .filter((item: string): boolean => item.length > 0)
        .join(" ");
    const hasDescription: boolean = hasContent(description);
    const iconSize: number = size === "sm" ? 12 : size === "lg" ? 18 : 14;

    return (
        <div
            className={cx(
                "checkbox",
                `checkbox--${size}`,
                indeterminate && "checkbox--mixed",
                !indeterminate && isChecked && "checkbox--checked",
                disabled && "checkbox--disabled",
                readOnly && "checkbox--readonly",
                className,
            )}
            style={style}
            data-invalid={field.invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
            data-readonly={readOnly ? "true" : "false"}
        >
            <label className="checkbox__label" htmlFor={field.controlId}>
                <Surface
                    className="checkbox__touch"
                    tone="accent"
                    stateLayer={!disabled}
                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                    disabled={disabled}
                >
                    <span className="checkbox__box" aria-hidden="true">
                        <Icon
                            name="Check"
                            size={iconSize}
                            className="checkbox__icon checkbox__icon--check"
                        />
                        <Icon
                            name="Subtract"
                            size={iconSize}
                            className="checkbox__icon checkbox__icon--mixed"
                        />
                    </span>
                </Surface>

                <input
                    {...rest}
                    ref={mergedRef}
                    id={field.controlId}
                    className="checkbox__native"
                    type="checkbox"
                    name={name}
                    value={value}
                    checked={isChecked}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={required}
                    aria-labelledby={labelledBy}
                    aria-invalid={field.invalid ? true : ariaInvalid}
                    aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                    onChange={handleChange}
                />

                <span className="checkbox__copy">
                    <span className="checkbox__text" id={labelId}>
                        {label}
                        {required ? (
                            <span className="checkbox__required" aria-hidden="true">
                                *
                            </span>
                        ) : null}
                    </span>
                    {hasDescription ? (
                        <span className="checkbox__description" id={field.hintId}>
                            {description}
                        </span>
                    ) : null}
                </span>
            </label>

            {field.invalid ? (
                <p className="checkbox__error" id={field.errorId} aria-live="polite">
                    {error}
                </p>
            ) : null}
        </div>
    );
};

export default Checkbox;
