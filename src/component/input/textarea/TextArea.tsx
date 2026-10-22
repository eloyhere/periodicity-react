import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type ChangeEventHandler,
    type FC,
    type Ref,
    type RefCallback,
    type ReactNode,
    type RefObject,
    type TextareaHTMLAttributes,
} from "react";
import useField, { type FieldState } from "../../foundation/useField";
import useMergedRef from "../../foundation/useMergedRef";
import InputLayout from "../shared/InputLayout";

/**
 * Visual variant of the text area.
 * Type: type alias.
 * Fields: none.
 * @example
 * const variant: TextAreaVariant = "standard";
 */
export type TextAreaVariant = "outline" | "fill" | "standard";

/**
 * Props for the TextArea.
 * Type: interface.
 * Native textarea attributes are forwarded to the `<textarea>`; `className` and `style` apply to the field root.
 * Fields: label, value, defaultValue, onChange, prefix, hint, message, limitation, error, suffix,
 * rows, maxLength, minLength, showCount, variant, disabled, readOnly, required, placeholder, autoGrow,
 * className, id, ref, and native textarea attributes.
 * @param label - Accessible label.
 * @param value - Controlled text value.
 * @param defaultValue - Initial text value when uncontrolled.
 * @param onChange - Called after every edit with the native change event.
 * @param prefix - Leading icon slot; a string is treated as an icon name.
 * @param hint - Floating placeholder shown inside the field until focus or content.
 * @param message - Supporting message shown below the field.
 * @param limitation - Character counter shown under the suffix; defaults to a counter when
 * `minLength`, `maxLength`, or `showCount` is set.
 * @param error - Validation message; replaces `message` and marks the field invalid.
 * @param suffix - Trailing icon slot; a string is treated as an icon name.
 * @param rows - Visible row count.
 * @param maxLength - Maximum accepted character count.
 * @param showCount - Shows the character counter when true.
 * @param variant - Field variant: outline, fill, or standard.
 * @param disabled - Disables the field natively and suppresses the ripple.
 * @param placeholder - Placeholder text.
 * @param autoGrow - Resizes the field to fit its content.
 * @param className - Extra classes for the field root.
 * @param ref - Ref to the underlying textarea element.
 * @example
 * <TextArea label="Notes" rows={4} maxLength={240} showCount />
 */
export interface TextAreaProps
    extends Omit<
        TextareaHTMLAttributes<HTMLTextAreaElement>,
        "children" | "value" | "onChange" | "prefix" | "content"
    > {
    label: string;
    value?: string;
    defaultValue?: string;
    onChange?: ChangeEventHandler<HTMLTextAreaElement>;
    prefix?: ReactNode;
    suffix?: ReactNode;
    hint?: string;
    message?: ReactNode;
    limitation?: boolean | ReactNode;
    error?: string;
    rows?: number;
    maxLength?: number;
    showCount?: boolean;
    variant?: TextAreaVariant;
    disabled?: boolean;
    placeholder?: string;
    autoGrow?: boolean;
    className?: string;
    ref?: Ref<HTMLTextAreaElement>;
}

/**
 * Resizes a textarea to fit its content.
 * @param element - Textarea to measure.
 * @example
 * resizeTextArea(element);
 * @returns Nothing.
 */
const resizeTextArea: (element: HTMLTextAreaElement) => void = (element: HTMLTextAreaElement): void => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
};

/**
 * Renders a multi-line Material field with an optional counter and automatic height.
 * @param props - Value, change handler, hint, error, rows, maximum length, variant, and auto-growth.
 * @example
 * <TextArea label="Journal" placeholder="Today I noticed..." maxLength={200} showCount />
 * @returns A text area element.
 */
const TextArea: FC<TextAreaProps> = ({
    label,
    value,
    defaultValue,
    onChange,
    prefix,
    suffix,
    hint,
    message,
    limitation,
    error,
    rows = 4,
    maxLength,
    minLength,
    showCount = false,
    variant = "outline",
    disabled = false,
    placeholder,
    autoGrow = false,
    className = "",
    style,
    id,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    ref,
    ...rest
}: TextAreaProps) => {
    const field: FieldState = useField({ id, label, error });
    const textAreaRef: RefObject<HTMLTextAreaElement | null> = useRef<HTMLTextAreaElement>(null);
    const mergedRef: RefCallback<HTMLTextAreaElement> = useMergedRef<HTMLTextAreaElement>(
        textAreaRef,
        ref,
    );
    const [uncontrolledLength, setUncontrolledLength]: [number, (next: number) => void] = useState<number>(
        value !== (void 0)
            ? value.length
            : typeof defaultValue === "string"
              ? defaultValue.length
              : 0,
    );
    const messageId: string = `${field.controlId}-message`;
    const hasMessage: boolean = message !== (void 0) && message !== null && message !== false;
    const describedBy: string = [
        field.invalid ? field.errorId : hasMessage ? messageId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((item: string): boolean => item.length > 0)
        .join(" ");
    const length: number = value === (void 0) ? uncontrolledLength : value.length;
    const counter: string =
        minLength !== (void 0) && maxLength !== (void 0)
            ? `${length} / ${minLength}–${maxLength}`
            : maxLength === (void 0)
              ? `${length}`
              : `${length} / ${maxLength}`;
    const limitationVisible: boolean =
        limitation !== false &&
        (limitation === true ||
            limitation !== (void 0) ||
            showCount ||
            minLength !== (void 0) ||
            maxLength !== (void 0));
    const limitationContent: ReactNode =
        typeof limitation === "boolean" || limitation === (void 0) ? counter : limitation;

    useEffect((): void => {
        const node: HTMLTextAreaElement | null = textAreaRef.current;

        if (node !== null && autoGrow) {
            resizeTextArea(node);
        }
    }, [autoGrow, rows, value]);

    useEffect((): void => {
        const node: HTMLTextAreaElement | null = textAreaRef.current;

        if (node !== null && !autoGrow) {
            node.style.removeProperty("height");
        }
    }, [autoGrow]);

    const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (
        event: ChangeEvent<HTMLTextAreaElement>,
    ): void => {
        const element: HTMLTextAreaElement = event.currentTarget;

        setUncontrolledLength(element.value.length);

        if (autoGrow) {
            resizeTextArea(element);
        }

        onChange?.(event);
    };

    return (
        <InputLayout
            variant={variant}
            size="md"
            prefix={prefix}
            suffix={suffix}
            hint={hint ?? placeholder ?? label}
            message={message}
            limitation={limitationVisible ? limitationContent : null}
            error={field.invalid ? error : null}
            invalid={field.invalid}
            disabled={disabled}
            multiline
            messageId={messageId}
            errorId={field.errorId}
            className={["text-area", autoGrow ? "text-area--auto-grow" : "", className]
                .filter((item: string): boolean => item.length > 0)
                .join(" ")}
            style={style}
        >
            <textarea
                {...rest}
                ref={mergedRef}
                id={field.controlId}
                className="text-area__field"
                value={value}
                defaultValue={defaultValue}
                rows={rows}
                maxLength={maxLength}
                minLength={minLength}
                placeholder=" "
                disabled={disabled}
                aria-invalid={field.invalid ? true : ariaInvalid}
                aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                onChange={handleChange}
            />
            <label className="visually-hidden" htmlFor={field.controlId}>
                {label}
            </label>
        </InputLayout>
    );
};

export default TextArea;
