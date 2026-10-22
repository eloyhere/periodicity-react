import {
    useRef,
    type CSSProperties,
    type FC,
    type FocusEvent as ReactFocusEvent,
    type HTMLAttributes,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
    type Ref,
    type RefObject,
} from "react";
import { readCaretPoint } from "../../../gesture/core/caret";
import cx from "../../foundation/cx";
import Icon, { type IconName } from "../../icon/Icon";
import Surface from "../../surface/Surface";
import "./InputLayout.css";

export type InputLayoutVariant = "outline" | "fill" | "standard";
export type InputLayoutSize = "sm" | "md" | "lg";

/**
 * Stores the projection origin and the per-edge distance ratios used by the
 * radial focus-border wave.
 * @param control - Control element that owns the field bounds.
 * @param clientX - Pointer or caret client x.
 * @param clientY - Pointer or caret client y.
 * @example
 * applyEdgeOrigin(control, event.clientX, event.clientY);
 * @returns Nothing.
 */
const applyEdgeOrigin: (control: HTMLElement, clientX: number, clientY: number) => void = (
    control: HTMLElement,
    clientX: number,
    clientY: number,
): void => {
    const rect: DOMRect = control.getBoundingClientRect();
    const x: number = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y: number = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    const xPercent: number = rect.width > 0 ? (x / rect.width) * 100 : 50;
    const yPercent: number = rect.height > 0 ? (y / rect.height) * 100 : 50;
    const top: number = y;
    const right: number = Math.max(0, rect.width - x);
    const bottom: number = Math.max(0, rect.height - y);
    const left: number = x;
    const maxRadius: number = Math.max(
        Math.hypot(left, top),
        Math.hypot(right, top),
        Math.hypot(left, bottom),
        Math.hypot(right, bottom),
    );
    const ratio: (distance: number) => number = (distance: number): number =>
        maxRadius > 0 ? distance / maxRadius : 0;

    control.style.setProperty("--input-activation-x", `${xPercent}%`);
    control.style.setProperty("--input-activation-y", `${yPercent}%`);
    control.style.setProperty("--input-distance-top", `${ratio(top)}`);
    control.style.setProperty("--input-distance-right", `${ratio(right)}`);
    control.style.setProperty("--input-distance-bottom", `${ratio(bottom)}`);
    control.style.setProperty("--input-distance-left", `${ratio(left)}`);
};

/**
 * Reports whether a focused control is empty, so keyboard focus falls back to the field centre.
 * @param target - Focused control.
 * @example
 * const blank = isBlankControl(input);
 * @returns `true` for an empty input, textarea, or contenteditable.
 */
const isBlankControl: (target: HTMLElement) => boolean = (target: HTMLElement): boolean => {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return target.value.length === 0;
    }

    return target.isContentEditable && (target.textContent ?? "").length === 0;
};

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
    const pointerOriginPendingRef: RefObject<boolean> = useRef<boolean>(false);
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
        const control: HTMLElement | null = root.querySelector<HTMLElement>(
            ".input-layout__control",
        );

        // Resolve the wave origin before focusing: the focus transition reads
        // these variables as soon as :focus-within turns on.
        if (control !== null) {
            applyEdgeOrigin(control, event.clientX, event.clientY);
            pointerOriginPendingRef.current = true;
        }

        if (!interactive) {
            event.preventDefault();

            const field: HTMLElement | null = root.querySelector<HTMLElement>(
                "input, textarea, [contenteditable='true'], [data-input-layout-control]",
            );

            if (field !== null && document.activeElement !== field) {
                field.focus({ preventScroll: true });
            }
        }
    };
    const handleFocusCapture: (event: ReactFocusEvent<HTMLDivElement>) => void = (
        event: ReactFocusEvent<HTMLDivElement>,
    ): void => {
        const related: EventTarget | null = event.relatedTarget;

        if (related instanceof Node && event.currentTarget.contains(related)) {
            return;
        }

        if (pointerOriginPendingRef.current) {
            pointerOriginPendingRef.current = false;
            return;
        }

        const target: EventTarget | null = event.target;

        if (!(target instanceof HTMLElement)) {
            return;
        }

        const control: HTMLElement | null = event.currentTarget.querySelector<HTMLElement>(
            ".input-layout__control",
        );

        if (control === null) {
            return;
        }

        const rect: DOMRect = control.getBoundingClientRect();
        const point: { x: number; y: number } = isBlankControl(target)
            ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
            : readCaretPoint(target);

        applyEdgeOrigin(control, point.x, point.y);
    };
    const handleBlurCapture: (event: ReactFocusEvent<HTMLDivElement>) => void = (
        event: ReactFocusEvent<HTMLDivElement>,
    ): void => {
        const related: EventTarget | null = event.relatedTarget;

        if (!(related instanceof Node) || !event.currentTarget.contains(related)) {
            pointerOriginPendingRef.current = false;
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
            onFocusCapture={handleFocusCapture}
            onBlurCapture={handleBlurCapture}
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
                    foreground={
                        <>
                            {variant === "outline" ? (
                                <span className="input-layout__edge input-layout__edge--top" />
                            ) : null}
                            {variant === "outline" ? (
                                <span className="input-layout__edge input-layout__edge--right" />
                            ) : null}
                            <span className="input-layout__edge input-layout__edge--bottom" />
                            {variant === "outline" ? (
                                <span className="input-layout__edge input-layout__edge--left" />
                            ) : null}
                        </>
                    }
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
