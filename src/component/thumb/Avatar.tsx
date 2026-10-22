import {
    useState,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type KeyboardEvent,
    type PointerEvent,
    type ReactNode,
    type Ref,
    type SetStateAction,
} from "react";
import cx from "../foundation/cx";
import { useRipple, type RippleHandlers } from "../foundation/useRipple";
import VisuallyHidden from "../foundation/VisuallyHidden";
import "./Avatar.css";

/**
 * Size of an avatar.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: AvatarSize = "lg";
 */
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Semantic tone of an avatar placeholder.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: AvatarTone = "mint";
 */
export type AvatarTone = "neutral" | "accent" | "mint" | "violet" | "amber";

/**
 * Presence state of an avatar.
 * Type: type alias.
 * Fields: none.
 * @example
 * const status: AvatarStatus = "online";
 */
export type AvatarStatus = "online" | "offline" | "busy" | "away";

/**
 * Source rendered inside an avatar.
 * Type: type alias.
 * Fields: none.
 * Strings are used as `<img>` sources, so an `https:`/`blob:` URL and a
 * `data:image/...;base64,...` URI both work. Any other node, such as an inline
 * `<svg>` or an icon element, is rendered as avatar content instead.
 * @example
 * const url: AvatarSource = "https://example.com/mira.png";
 * @example
 * const mark: AvatarSource = <svg viewBox="0 0 24 24">...</svg>;
 */
export type AvatarSource = string | ReactNode;

/**
 * Props for the Avatar component.
 * Type: interface.
 * Extends the native `span` attributes, so `id`, `style`, `title`, `aria-*`, `data-*`, `tabIndex`, and
 * pointer, mouse, keyboard, and focus handlers are forwarded to the avatar element.
 * Fields: name, src, size, tone, status, statusLabel, className.
 * @param src - Image URL, base64 data URI, or a React node such as an inline SVG.
 * @example
 * <Avatar name="Mira Chen" src="/mira.png" status="online" />
 * @example
 * <Avatar name="Mira Chen" src={<svg viewBox="0 0 32 32">...</svg>} />
 */
export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className"> {
    name: string;
    /** Image URL, base64 data URI, or a React node such as an inline SVG. */
    src?: AvatarSource;
    size?: AvatarSize;
    tone?: AvatarTone;
    status?: AvatarStatus;
    statusLabel?: string;
    disabled?: boolean;
    className?: string;
    ref?: Ref<HTMLSpanElement>;
}

const StatusLabels: Record<AvatarStatus, string> = {
    online: "Online",
    offline: "Offline",
    busy: "Busy",
    away: "Away",
};

/**
 * Derives up to two initials from a display name.
 * @param name - Display name of the person.
 * @example
 * const initials = getInitials("Mira Chen");
 * @returns The initials, or a question mark when the name is blank.
 */
const getInitials: (name: string) => string = (name: string): string => {
    const words: string[] = name
        .trim()
        .split(/\s+/)
        .filter((word: string): boolean => word.length > 0);

    if (words.length === 0) {
        return "?";
    }

    const first: string = words[0];

    if (words.length === 1) {
        return first.charAt(0).toUpperCase();
    }

    const last: string = words[words.length - 1];

    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
};

/**
 * Renders an avatar image, a custom SVG node, or an initials fallback with an optional presence dot.
 * @param props - Name, image source or custom node, size, tone, status, status label, class name, and
 * native span attributes.
 * @example
 * <Avatar name="Ada Lovelace" tone="violet" status="busy" />
 * @returns An avatar element.
 */
const Avatar: FC<AvatarProps> = ({
    name,
    src,
    size = "md",
    tone = "neutral",
    status,
    statusLabel,
    disabled = false,
    className = "",
    onPointerDown,
    onPointerEnter,
    onKeyDown,
    ref,
    ...rest
}: AvatarProps) => {
    const ripple: RippleHandlers = useRipple({ trigger: "both", disabled });
    const [failedSrc, setFailedSrc]: [string | void, Dispatch<SetStateAction<string | void>>] =
        useState<string | void>((void 0));
    const imageSrc: string | void = typeof src === "string" && src.length > 0 ? src : (void 0);
    const visibleImageSrc: string | void =
        imageSrc !== (void 0) && imageSrc !== failedSrc ? imageSrc : (void 0);
    const customContent: ReactNode = typeof src === "string" ? (void 0) : src;
    const hasCustomContent: boolean =
        customContent !== (void 0) && customContent !== null && customContent !== false;
    const initials: string = getInitials(name);

    const handleImageError: () => void = (): void => {
        if (imageSrc !== (void 0)) {
            setFailedSrc(imageSrc);
        }
    };

    return (
        <span
            ref={ref}
            className={cx(
                "avatar",
                `avatar--${size}`,
                `avatar--${tone}`,
                disabled && "avatar--disabled",
                className,
            )}
            aria-disabled={disabled ? "true" : (void 0)}
            data-disabled={disabled ? "true" : "false"}
            onPointerDown={(event: PointerEvent<HTMLSpanElement>): void => {
                ripple.onPointerDown(event);
                onPointerDown?.(event);
            }}
            onPointerEnter={(event: PointerEvent<HTMLSpanElement>): void => {
                ripple.onPointerEnter(event);
                onPointerEnter?.(event);
            }}
            onKeyDown={(event: KeyboardEvent<HTMLSpanElement>): void => {
                ripple.onKeyDown(event);
                onKeyDown?.(event);
            }}
            {...rest}
        >
            <span className="avatar__frame" role="img" aria-label={name}>
                {visibleImageSrc !== (void 0) ? (
                    <img
                        className="avatar__image"
                        src={visibleImageSrc}
                        alt=""
                        onError={handleImageError}
                    />
                ) : hasCustomContent ? (
                    <span className="avatar__custom" aria-hidden="true">
                        {customContent}
                    </span>
                ) : (
                    <span className="avatar__initials" aria-hidden="true">
                        {initials}
                    </span>
                )}
            </span>
            {status === (void 0) ? null : (
                <>
                    <span className={cx("avatar__status", `avatar__status--${status}`)} aria-hidden="true" />
                    <VisuallyHidden>{statusLabel ?? StatusLabels[status]}</VisuallyHidden>
                </>
            )}
        </span>
    );
};

export default Avatar;
