import {
    useId,
    useState,
    type FC,
    type InputEvent,
    type InputHTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
import InputLayout from "../shared/InputLayout";

export type TextInputVariant = "outline" | "fill" | "standard";

export type TextInputSize = "sm" | "md" | "lg";

/**
 * Props for the Material-style text field.
 * Type: interface.
 * Native input attributes are forwarded to the underlying `<input>`; `className` and `style` apply to the field root.
 * Fields: label, value, defaultValue, onChange, prefix, hint, message, limitation, error, suffix,
 * variant, size, leading, trailing, disabled, readOnly, required, placeholder, className, id, ref,
 * rootRef, and native input attributes.
 * @param label - Accessible label.
 * @param prefix - Leading icon slot; a string is treated as an icon name.
 * @param hint - Floating placeholder shown inside the field until focus or content.
 * @param message - Supporting message shown below the field.
 * @param limitation - Character counter shown under the suffix; defaults to a counter when
 * `minLength` or `maxLength` is set.
 * @param error - Validation message; replaces `message` and marks the field invalid.
 * @param suffix - Trailing icon slot; a string is treated as an icon name.
 * @param variant - Field variant: outline, fill, or standard.
 * @param size - Control size.
 * @param leading - Deprecated alias for `prefix`.
 * @param trailing - Deprecated alias for `suffix`.
 * @param disabled - Disables the field.
 * @param readOnly - Makes the value read-only.
 * @param required - Marks the field as required.
 * @param placeholder - Native placeholder fallback for the floating hint.
 * @param className - Extra classes for the field root.
 * @param id - Input id.
 * @param ref - Ref to the underlying input element.
 * @param rootRef - Ref to the field root.
 * @example
 * <TextInput label="Email" hint="name@example.com" message="We never share it" prefix="Mail" />
 */
export interface TextInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix" | "content"> {
    label: string;
    hint?: string;
    message?: ReactNode;
    limitation?: boolean | ReactNode;
    error?: string;
    variant?: TextInputVariant;
    size?: TextInputSize;
    prefix?: ReactNode;
    suffix?: ReactNode;
    /** @deprecated Use `prefix`. */
    leading?: ReactNode;
    /** @deprecated Use `suffix`. */
    trailing?: ReactNode;
    className?: string;
    ref?: Ref<HTMLInputElement>;
    rootRef?: Ref<HTMLDivElement>;
}

const countText: (current: number, minimum: number | undefined, maximum: number | undefined) => string = (
    current: number,
    minimum: number | undefined,
    maximum: number | undefined,
): string => {
    if (minimum !== (void 0) && maximum !== (void 0)) {
        return `${current} / ${minimum}–${maximum}`;
    }

    if (maximum !== (void 0)) {
        return `${current} / ${maximum}`;
    }

    if (minimum !== (void 0)) {
        return `${current} / ≥${minimum}`;
    }

    return `${current}`;
};

/**
 * Renders an Android TextInputLayout-style field with six slots: prefix, hint,
 * message, limitation, error, and suffix.
 * @param props - Label, slots, state, variant, size, and native input attributes.
 * @example
 * <TextInput label="Email" hint="name@example.com" message="We never share it" />
 * @returns A six-slot text field.
 */
const TextInput: FC<TextInputProps> = ({
    label,
    hint,
    message,
    limitation,
    error,
    variant = "outline",
    size = "md",
    prefix,
    suffix,
    leading,
    trailing,
    className = "",
    style,
    id,
    value,
    defaultValue,
    placeholder,
    minLength,
    maxLength,
    onInput,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    required = false,
    ref,
    rootRef,
    ...rest
}: TextInputProps) => {
    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const labelId: string = `${inputId}-label`;
    const messageId: string = `${inputId}-message`;
    const errorId: string = `${inputId}-error`;
    const hasError: boolean = error !== (void 0) && error.length > 0;
    const hasMessage: boolean = message !== (void 0) && message !== null && message !== false;
    const [length, setLength]: [number, (next: number) => void] = useState<number>(
        `${value ?? defaultValue ?? ""}`.length,
    );
    const describedBy: string = [
        hasError ? errorId : hasMessage ? messageId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((item: string): boolean => item.length > 0)
        .join(" ");
    const limitationVisible: boolean =
        limitation !== false &&
        (limitation === true || limitation !== (void 0) || minLength !== (void 0) || maxLength !== (void 0));
    const effectiveLength: number = value === (void 0) ? length : `${value}`.length;
    const limitationContent: ReactNode =
        typeof limitation === "boolean" || limitation === (void 0)
            ? countText(effectiveLength, minLength, maxLength)
            : limitation;
    const hintText: string = hint ?? placeholder ?? label;
    const prefixSlot: ReactNode = prefix ?? leading;
    const suffixSlot: ReactNode = suffix ?? trailing;

    const handleInput: (event: InputEvent<HTMLInputElement>) => void = (
        event: InputEvent<HTMLInputElement>,
    ): void => {
        setLength(event.currentTarget.value.length);
        onInput?.(event);
    };

    return (
        <InputLayout
            variant={variant}
            size={size}
            prefix={prefixSlot}
            suffix={suffixSlot}
            hint={hintText}
            message={message}
            limitation={limitationVisible ? limitationContent : null}
            error={hasError ? error : null}
            invalid={hasError}
            disabled={rest.disabled === true}
            readOnly={rest.readOnly === true}
            messageId={messageId}
            errorId={errorId}
            className={className}
            style={style}
            ref={rootRef}
        >
            <input
                {...rest}
                ref={ref}
                id={inputId}
                className="text-field__input"
                value={value}
                defaultValue={defaultValue}
                placeholder=" "
                minLength={minLength}
                maxLength={maxLength}
                required={required}
                aria-labelledby={labelId}
                aria-invalid={hasError ? true : ariaInvalid}
                aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                onInput={handleInput}
            />
            <label className="visually-hidden" id={labelId} htmlFor={inputId}>
                {label}
                {required ? "*" : null}
            </label>
        </InputLayout>
    );
};

export default TextInput;
