import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type ChangeEventHandler,
    type FC,
    type RefObject,
} from "react";
import cx from "../../foundation/cx";
import useField, { type FieldState } from "../../foundation/useField";
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
 * Fields: label, value, onChange, hint, error, rows, maxLength, showCount, variant,
 * disabled, placeholder, autoGrow, className.
 * @example
 * <TextArea label="Notes" rows={4} maxLength={240} showCount />
 */
export interface TextAreaProps {
    label: string;
    value?: string;
    onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
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
}: TextAreaProps) => {
    const field: FieldState = useField({ label, hint, error });
    const textAreaRef: RefObject<HTMLTextAreaElement | null> = useRef<HTMLTextAreaElement>(null);
    const [uncontrolledLength, setUncontrolledLength]: [number, (next: number) => void] = useState<number>(
        value === (void 0) ? 0 : value.length,
    );
    const hasHint: boolean = hint !== (void 0) && hint.length > 0;
    const describedBy: string = field.invalid ? field.errorId : hasHint ? field.hintId : "";
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
                            ref={textAreaRef}
                            id={field.controlId}
                            className="text-area__field"
                            value={value}
                            rows={rows}
                            maxLength={maxLength}
                            placeholder={placeholder === (void 0) || placeholder.length === 0 ? " " : placeholder}
                            disabled={disabled}
                            aria-invalid={field.invalid}
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
