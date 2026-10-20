import {
    createElement,
    type FC,
    type HTMLAttributes,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type Ref,
} from "react";
import cx from "../foundation/cx";
import Surface, { type RippleLayer, type RippleOptions, type SurfaceTone } from "../surface/Surface";
import "./Card.css";

/**
 * Semantic tone of a card.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: CardTone = "mint";
 */
export type CardTone = "default" | "accent" | "mint" | "violet" | "amber";

/**
 * Props for the Card component.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `style`, `aria-*`, `data-*`, `tabIndex`, and pointer,
 * mouse, keyboard, and focus handlers are forwarded to the card surface. `title` remains the card
 * heading rather than a tooltip, and `onClick` remains the card activation callback.
 * Fields: children, className, eyebrow, title, action, ripple, tone, interactive, disabled, onClick,
 * media, headingLevel, footer.
 * @example
 * <Card eyebrow="Today" title="Rituals" action={<Badge>3</Badge>}>
 *     <p>Three small loops.</p>
 * </Card>
 */
export interface CardProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "title" | "onClick"> {
    children: ReactNode;
    className?: string;
    eyebrow?: string;
    title?: string;
    action?: ReactNode;
    ripple?: RippleLayer | RippleOptions | false;
    tone?: CardTone;
    interactive?: boolean;
    disabled?: boolean;
    onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
    media?: ReactNode;
    headingLevel?: 2 | 3 | 4;
    footer?: ReactNode;
    ref?: Ref<HTMLDivElement>;
}

const SurfaceTones: Record<CardTone, SurfaceTone> = {
    default: "neutral",
    accent: "accent",
    mint: "mint",
    violet: "violet",
    amber: "amber",
};

/**
 * Maps a permitted heading level to its element.
 * @param level - Heading level from two to four.
 * @example
 * const tag = getHeadingElement(2);
 * @returns The matching heading element name.
 */
const getHeadingElement: (level: 2 | 3 | 4) => "h2" | "h3" | "h4" = (
    level: 2 | 3 | 4,
): "h2" | "h3" | "h4" => {
    if (level === 2) {
        return "h2";
    }

    if (level === 4) {
        return "h4";
    }

    return "h3";
};

/**
 * Renders an elevated content card with an optional media slot, configurable heading, and footer.
 * @param props - Header content, tone, ripple, media, heading level, footer, click behaviour, children,
 * and native div attributes.
 * @example
 * <Card title="Momentum" headingLevel={2} interactive onClick={openMomentum} footer={<Button>View</Button>}>
 *     <p>Focused minutes across the week.</p>
 * </Card>
 * @returns A card element.
 */
const Card: FC<CardProps> = ({
    children,
    className = "",
    eyebrow,
    title,
    action,
    ripple = { layer: "foreground", trigger: ["hover", "click"] },
    tone = "default",
    interactive = false,
    disabled = false,
    onClick,
    media,
    headingLevel = 3,
    footer,
    ref,
    ...rest
}: CardProps) => {
    const isClickable: boolean = onClick !== (void 0);
    const hasEyebrow: boolean = eyebrow !== (void 0) && eyebrow.length > 0;
    const hasTitle: boolean = title !== (void 0) && title.length > 0;
    const hasAction: boolean = action !== (void 0) && action !== null && action !== false;
    const hasHeader: boolean = hasEyebrow || hasTitle || hasAction;
    const surfaceTone: SurfaceTone = SurfaceTones[tone];
    const headingElement: "h2" | "h3" | "h4" = getHeadingElement(headingLevel);
    const hitLabel: string = title || eyebrow || "Open card";
    const surfaceRipple: RippleLayer | RippleOptions | false = isClickable
        ? { layer: "foreground", trigger: ["hover", "click"] }
        : ripple;

    return (
        <Surface
            ref={ref}
            className={cx(
                "card",
                `card--${tone}`,
                (interactive || isClickable) && "card--interactive",
                isClickable && "card--clickable",
                disabled && "card--disabled",
                className,
            )}
            tone={surfaceTone}
            ripple={surfaceRipple}
            stateLayer={isClickable && !disabled}
            disabled={disabled}
            background={<span className="card__wash" />}
            foreground={<span className="card__edge" />}
            {...rest}
        >
            {isClickable ? (
                <button
                    type="button"
                    className="card__hit"
                    aria-label={hitLabel}
                    disabled={disabled}
                    onClick={onClick}
                />
            ) : null}
            {media === (void 0) || media === null || media === false ? null : (
                <div className="card__media">{media}</div>
            )}
            <div className="card__content">
                {hasHeader ? (
                    <header className="card__header">
                        <div className="card__heading">
                            {hasEyebrow ? <p className="card__eyebrow">{eyebrow}</p> : null}
                            {hasTitle
                                ? createElement(headingElement, { className: "card__title" }, title)
                                : null}
                        </div>
                        {hasAction ? <div className="card__action">{action}</div> : null}
                    </header>
                ) : null}
                {children}
                {footer === (void 0) || footer === null || footer === false ? null : (
                    <footer className="card__footer">{footer}</footer>
                )}
            </div>
        </Surface>
    );
};

export default Card;
