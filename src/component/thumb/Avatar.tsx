import {
    useState,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type Ref,
    type SetStateAction,
} from "react";
import cx from "../foundation/cx";
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
 * Props for the Avatar component.
 * Type: interface.
 * Extends the native `span` attributes, so `id`, `style`, `title`, `aria-*`, `data-*`, `tabIndex`, and
 * pointer, mouse, keyboard, and focus handlers are forwarded to the avatar element.
 * Fields: name, src, size, tone, status, statusLabel, className.
 * @example
 * <Avatar name="Mira Chen" src="/mira.png" status="online" />
 */
export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className"> {
    name: string;
    src?: string;
    size?: AvatarSize;
    tone?: AvatarTone;
    status?: AvatarStatus;
    statusLabel?: string;
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
    const last: string = words.length > 1 ? words[words.length - 1] : first;

    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
};

/**
 * Renders an avatar image with an initials fallback and an optional presence dot.
 * @param props - Name, image source, size, tone, status, status label, class name, and native span
 * attributes.
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
    className = "",
    ref,
    ...rest
}: AvatarProps) => {
    const [failedSrc, setFailedSrc]: [string | void, Dispatch<SetStateAction<string | void>>] = useState<
        string | void
    >((void 0));
    const hasSource: boolean = src !== (void 0) && src.length > 0;
    const showImage: boolean = hasSource && src !== failedSrc;
    const initials: string = getInitials(name);

    const handleImageError: () => void = (): void => {
        setFailedSrc(src);
    };

    return (
        <span ref={ref} className={cx("avatar", `avatar--${size}`, `avatar--${tone}`, className)} {...rest}>
            <span className="avatar__frame" role="img" aria-label={name}>
                {showImage ? (
                    <img className="avatar__image" src={src} alt="" onError={handleImageError} />
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
