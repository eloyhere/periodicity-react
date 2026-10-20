import {
    useEffect,
    useRef,
    type ChangeEvent,
    type ChangeEventHandler,
    type FC,
    type ReactNode,
    type RefObject,
} from "react";
import Icon from "../../icon/Icon";
import cx from "../../foundation/cx";
import useControllableState from "../../foundation/useControllableState";
import useField, { type FieldState } from "../../foundation/useField";
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
 * Fields: checked, defaultChecked, onCheckedChange, indeterminate, label, description,
 * error, disabled, required, name, value, size, className.
 * @example
 * <Checkbox label="Remember me" description="Stay signed in" defaultChecked />
 */
export interface CheckboxProps {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    indeterminate?: boolean;
    label: ReactNode;
    description?: ReactNode;
    error?: ReactNode;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
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
    indeterminate = false,
    label,
    description,
    error,
    disabled = false,
    required = false,
    name,
    value,
    size = "md",
    className = "",
}: CheckboxProps) => {
    const field: FieldState = useField({ label, hint: description, error, required });
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
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
        setChecked(event.currentTarget.checked);
    };

    const labelId: string = `${field.controlId}-label`;
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
                className,
            )}
            data-invalid={field.invalid ? "true" : "false"}
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
                    ref={inputRef}
                    id={field.controlId}
                    className="checkbox__native"
                    type="checkbox"
                    name={name}
                    value={value}
                    checked={isChecked}
                    disabled={disabled}
                    required={required}
                    aria-labelledby={labelId}
                    aria-invalid={field.invalid}
                    aria-describedby={field.describedBy.length > 0 ? field.describedBy : (void 0)}
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
