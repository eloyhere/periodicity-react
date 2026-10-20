import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type ChangeEventHandler,
    type FC,
    type Ref,
    type RefCallback,
    type RefObject,
    type TextareaHTMLAttributes,
} from "react";
import cx from "../../foundation/cx";
import useField, { type FieldState } from "../../foundation/useField";
import useMergedRef from "../../foundation/useMergedRef";
import Surface from "../../surface/Surface";
import "./TextArea.css";

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
 * Fields: label, value, defaultValue, onChange, hint, error, rows, maxLength, showCount, variant, disabled,
 * readOnly, required, placeholder, autoGrow, className, id, ref, and native textarea attributes.
 * @param label - Floating label.
 * @param value - Controlled text value.
 * @param defaultValue - Initial text value when uncontrolled.
 * @param onChange - Called after every edit with the native change event.
 * @param hint - Supporting text shown below the field.
 * @param error - Validation message; replaces the hint and marks the field invalid.
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
    extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "children" | "value" | "onChange"> {
    label: string;
    value?: string;
    defaultValue?: string;
    onChange?: ChangeEventHandler<HTMLTextAreaElement>;
    hint?: string;
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
    hint,
    error,
    rows = 4,
    maxLength,
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
    const field: FieldState = useField({ id, label, hint, error });
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
    const hasHint: boolean = hint !== (void 0) && hint.length > 0;
    const describedBy: string = [
        field.invalid ? field.errorId : hasHint ? field.hintId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((item: string): boolean => item.length > 0)
        .join(" ");
    const length: number = value === (void 0) ? uncontrolledLength : value.length;
    const counter: string = maxLength === (void 0) ? `${length}` : `${length}/${maxLength}`;

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
        <div
            className={cx(
                "text-area",
                `text-area--${variant}`,
                field.invalid && "text-area--invalid",
                autoGrow && "text-area--auto-grow",
                className,
            )}
            style={style}
            data-invalid={field.invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
        >
            <div className="text-area__control">
                <Surface
                    className="text-area__surface"
                    background={<span className="text-area__background" />}
                    foreground={<span className="text-area__edge" />}
                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                    disabled={disabled}
                >
                    <div className="text-area__row">
                        <textarea
                            {...rest}
                            ref={mergedRef}
                            id={field.controlId}
                            className="text-area__field"
                            value={value}
                            defaultValue={defaultValue}
                            rows={rows}
                            maxLength={maxLength}
                            placeholder={placeholder === (void 0) || placeholder.length === 0 ? " " : placeholder}
                            disabled={disabled}
                            aria-invalid={field.invalid ? true : ariaInvalid}
                            aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                            onChange={handleChange}
                        />
                    </div>
                </Surface>

                <label className="text-area__label" htmlFor={field.controlId}>
                    {label}
                </label>
            </div>

            {field.invalid || hasHint || showCount ? (
                <div className="text-area__support">
                    <span className="text-area__messages">
                        {field.invalid ? (
                            <span className="text-area__error" id={field.errorId} aria-live="polite">
                                {error}
                            </span>
                        ) : hasHint ? (
                            <span className="text-area__hint" id={field.hintId}>
                                {hint}
                            </span>
                        ) : null}
                    </span>
                    {showCount ? <span className="text-area__counter">{counter}</span> : null}
                </div>
            ) : null}
        </div>
    );
};

export default TextArea;
