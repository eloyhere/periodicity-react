import { useId, type FC, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import cx from "../../foundation/cx";
import Surface from "../../surface/Surface";
import "./TextInput.css";

export type TextInputVariant = "outline" | "fill" | "standard";

export type TextInputSize = "sm" | "md" | "lg";

/**
 * Props for the Material-style text field.
 * Type: interface.
 * Native input attributes are forwarded to the underlying `<input>`; `className` and `style` apply to the field root.
 * @param label - Floating label.
 * @param hint - Supporting text shown below the field.
 * @param error - Validation message; replaces the hint and marks the field invalid.
 * @param variant - Field variant: outline, fill, or standard.
 * @param size - Control size.
 * @param leading - Optional node before the input.
 * @param trailing - Optional node after the input.
 * @param className - Extra classes for the field root.
 * @param ref - Ref to the underlying input element.
 * @example
 * <TextInput label="Email" variant="fill" hint="name@example.com" />
 */
export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
    label: string;
    hint?: string;
    error?: string;
    variant?: TextInputVariant;
    size?: TextInputSize;
    leading?: ReactNode;
    trailing?: ReactNode;
    className?: string;
    ref?: Ref<HTMLInputElement>;
}

/**
 * Renders a Material-style text field with a floating label.
 * @param props - Label, hint, error, variant, size, adornments, and native input attributes.
 * @example
 * <TextInput label="Ritual" variant="outline" placeholder="Morning pages" />
 * @returns A text field element.
 */
const TextInput: FC<TextInputProps> = ({
    label,
    hint,
    error,
    variant = "outline",
    size = "md",
    leading,
    trailing,
    className = "",
    style,
    id,
    placeholder,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    required = false,
    ref,
    ...rest
}: TextInputProps) => {
    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const hintId: string = `${inputId}-hint`;
    const errorId: string = `${inputId}-error`;
    const hasError: boolean = error !== (void 0) && error.length > 0;
    const describedBy: string = [
        hasError ? errorId : hint !== (void 0) && hint.length > 0 ? hintId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((value: string): boolean => value.length > 0)
        .join(" ");

    return (
        <div
            className={cx(
                "text-field",
                `text-field--${variant}`,
                `text-field--${size}`,
                leading !== (void 0) && "text-field--leading",
                hasError && "text-field--invalid",
                className,
            )}
            style={style}
            data-invalid={hasError ? "true" : "false"}
        >
            <div className="text-field__control">
                <Surface
                    className="text-field__surface"
                    background={<span className="text-field__background" />}
                    foreground={<span className="text-field__edge" />}
                >
                    <div className="text-field__row">
                        {leading === (void 0) ? null : (
                            <span className="text-field__leading" aria-hidden="true">
                                {leading}
                            </span>
                        )}
                        <input
                            {...rest}
                            ref={ref}
                            id={inputId}
                            className="text-field__input"
                            placeholder={placeholder === (void 0) || placeholder.length === 0 ? " " : placeholder}
                            required={required}
                            aria-invalid={hasError ? true : ariaInvalid}
                            aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                        />
                        {trailing === (void 0) ? null : (
                            <span className="text-field__trailing" aria-hidden="true">
                                {trailing}
                            </span>
                        )}
                    </div>
                </Surface>

                <label className="text-field__label" htmlFor={inputId}>
                    {label}
                    {required ? (
                        <span className="text-field__required" aria-hidden="true">
                            *
                        </span>
                    ) : null}
                </label>
            </div>

            {hasError ? (
                <p className="text-field__error" id={errorId} aria-live="polite">
                    {error}
                </p>
            ) : hint !== (void 0) && hint.length > 0 ? (
                <p className="text-field__hint" id={hintId} key={hint}>
                    {hint}
                </p>
            ) : null}
        </div>
    );
};

export default TextInput;
