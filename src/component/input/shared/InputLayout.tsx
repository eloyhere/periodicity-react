import type {
    CSSProperties,
    FC,
    HTMLAttributes,
    MouseEvent as ReactMouseEvent,
    PointerEvent as ReactPointerEvent,
    ReactNode,
    Ref,
} from "react";
import cx from "../../foundation/cx";
import Icon, { type IconName } from "../../icon/Icon";
import Surface from "../../surface/Surface";
import "./InputLayout.css";

export type InputLayoutVariant = "outline" | "fill" | "standard";
export type InputLayoutSize = "sm" | "md" | "lg";

/**
 * Props for the six-slot input shell.
 * Type: interface.
 * Fields: children, variant, size, prefix, hint, message, limitation, error, suffix,
 * invalid, disabled, readOnly, multiline, hintFloating, className, style, ref, and native div attributes.
 * @example
 * <InputLayout hint="Email" message="We never share it" prefix="Mail">
 *     <input />
 * </InputLayout>
 */
export interface InputLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "prefix" | "content"> {
    children: ReactNode;
    variant?: InputLayoutVariant;
    size?: InputLayoutSize;
    prefix?: ReactNode;
    hint?: ReactNode;
    message?: ReactNode;
    limitation?: ReactNode;
    error?: ReactNode;
    suffix?: ReactNode;
    invalid?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    multiline?: boolean;
    /** Keeps the floating hint above the field even when focus is elsewhere. */
    hintFloating?: boolean;
    messageId?: string;
    errorId?: string;
    className?: string;
    style?: CSSProperties;
    ref?: Ref<HTMLDivElement>;
}

const renderDecoration: (slot: ReactNode, size: InputLayoutSize) => ReactNode = (
    slot: ReactNode,
    size: InputLayoutSize,
): ReactNode => {
    if (typeof slot === "string") {
        const iconSize: number = size === "sm" ? 15 : size === "lg" ? 19 : 17;

        return <Icon name={slot as IconName} size={iconSize} />;
    }

    return slot;
};

const hasContent: (value: ReactNode) => boolean = (value: ReactNode): boolean =>
    value !== (void 0) && value !== null && value !== false && value !== "";

/**
 * Renders the Android TextInputLayout-style shell with prefix, hint, message,
 * limitation, error, and suffix slots.
 * @param props - Slots, state, variant, size, and native div attributes.
 * @example
 * <InputLayout hint="Name" limitation="0/40" message="Required">
 *     <input />
 * </InputLayout>
 * @returns A six-slot input shell.
 */
const InputLayout: FC<InputLayoutProps> = ({
    children,
    variant = "outline",
    size = "md",
    prefix,
    hint,
    message,
    limitation,
    error,
    suffix,
    invalid = false,
    disabled = false,
    readOnly = false,
    multiline = false,
    hintFloating = false,
    messageId,
    errorId,
    className = "",
    style,
    onClick,
    ref,
    ...rest
}: InputLayoutProps) => {
    const hasError: boolean = hasContent(error);
    const hasMessage: boolean = hasContent(message);
    const hasHint: boolean = hasContent(hint);
    const hasLimitation: boolean = hasContent(limitation);
    const handlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        if (disabled) {
            event.preventDefault();
            return;
        }

        const root: HTMLDivElement = event.currentTarget;
        const target: HTMLElement = event.target as HTMLElement;
        const interactive: boolean =
            target.closest(
                "input, textarea, button, a, select, label, [contenteditable='true'], [data-input-layout-control]",
            ) !== null;

        if (!interactive) {
            event.preventDefault();

            const field: HTMLElement | null = root.querySelector<HTMLElement>(
                "input, textarea, [contenteditable='true'], [data-input-layout-control]",
            );

            if (field !== null && document.activeElement !== field) {
                field.focus({ preventScroll: true });
            }
        }

        const control: HTMLElement | null = root.querySelector<HTMLElement>(
            ".input-layout__control",
        );

        if (control !== null) {
            const rect: DOMRect = control.getBoundingClientRect();

            control.style.setProperty("--input-activation-x", `${event.clientX - rect.left}px`);
            control.style.setProperty("--input-activation-y", `${event.clientY - rect.top}px`);
        }
    };
    const handleFieldClick: (event: ReactMouseEvent<HTMLDivElement>) => void = (
        event: ReactMouseEvent<HTMLDivElement>,
    ): void => {
        if (disabled) {
            onClick?.(event);
            return;
        }

        const target: HTMLElement = event.target as HTMLElement;

        if (
            target.closest(
                "input, textarea, button, a, select, label, [contenteditable='true'], [data-input-layout-control]",
            ) !== null
        ) {
            onClick?.(event);
            return;
        }

        const field: HTMLElement | null = event.currentTarget.querySelector<HTMLElement>(
            "input, textarea, [contenteditable='true'], [data-input-layout-control]",
        );

        field?.focus({ preventScroll: true });
        onClick?.(event);
    };

    return (
        <div
            {...rest}
            ref={ref}
            onPointerDownCapture={handlePointerDown}
            onClick={handleFieldClick}
            className={cx(
                "input-layout",
                `input-layout--${variant}`,
                `input-layout--${size}`,
                hasContent(prefix) && "input-layout--prefix",
                multiline && "input-layout--multiline",
                hasLimitation && "input-layout--limited",
                invalid && "input-layout--invalid",
                disabled && "input-layout--disabled",
                readOnly && "input-layout--readonly",
                className,
            )}
            style={style}
            data-invalid={invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
            data-readonly={readOnly ? "true" : "false"}
            data-hint-floating={hintFloating ? "true" : (void 0)}
        >
            <div className="input-layout__control">
                <Surface
                    className="input-layout__surface"
                    background={<span className="input-layout__background" />}
                    foreground={<span className="input-layout__edge" />}
                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                    disabled={disabled}
                >
                    <div className="input-layout__row">
                        {hasContent(prefix) ? (
                            <span className="input-layout__prefix" aria-hidden="true">
                                {renderDecoration(prefix, size)}
                            </span>
                        ) : null}
                        {children}
                        {hasContent(suffix) ? (
                            <span className="input-layout__suffix">
                                {renderDecoration(suffix, size)}
                            </span>
                        ) : null}
                    </div>
                    {hasLimitation ? (
                        <span className="input-layout__limitation">{limitation}</span>
                    ) : null}
                </Surface>

                {hasHint ? (
                    <span className="input-layout__hint" aria-hidden="true">
                        {hint}
                    </span>
                ) : null}
            </div>

            {hasError ? (
                <p className="input-layout__error" id={errorId} aria-live="polite">
                    {error}
                </p>
            ) : hasMessage ? (
                <p className="input-layout__message" id={messageId}>
                    {message}
                </p>
            ) : null}
        </div>
    );
};

export default InputLayout;
