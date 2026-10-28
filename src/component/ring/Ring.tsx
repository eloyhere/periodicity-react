import type { CSSProperties, FC, HTMLAttributes, Ref } from "react";
import { useInternational, type InternationalContextValue } from "../../international";
import cx from "../foundation/cx";
import VisuallyHidden from "../foundation/VisuallyHidden";
import "./Ring.css";

/**
 * Preset diameter of a ring.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: RingSize = "lg";
 */
export type RingSize = "sm" | "md" | "lg";

/**
 * Semantic colour of the ring.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: RingTone = "mint";
 */
export type RingTone = "accent" | "neutral" | "mint" | "violet" | "amber" | "danger";

/**
 * Props for the Ring component.
 * Type: interface.
 * Extends the native `span` attributes, so `id`, `title`, `aria-*`, `data-*`, and pointer, mouse, keyboard,
 * and focus handlers are forwarded to the root element.
 * @param value - Percentage from 0 to 100. Supplying it renders a determinate arc; omitting it spins forever
 * like the Android loading ring.
 * @param size - Preset diameter, or an explicit one in pixels; defaults to `md` (40px).
 * @param thickness - Stroke width in pixels; defaults to a tenth of the diameter.
 * @param tone - Semantic colour of the arc.
 * @param label - Screen-reader announcement; defaults to the localised `loading` or `progress` message.
 * @param showValue - Paints the percentage in the middle of a determinate ring.
 * @param className - Extra class names applied to the root element.
 * @param ref - Ref forwarded to the root element.
 * @example
 * <Ring />
 * @example
 * <Ring size="lg" thickness={6} tone="mint" label="Uploading" />
 * @example
 * <Ring value={68} size={96} thickness={8} showValue label="Cycle progress" />
 */
export interface RingProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className"> {
    value?: number;
    size?: RingSize | number;
    thickness?: number;
    tone?: RingTone;
    label?: string;
    showValue?: boolean;
    className?: string;
    ref?: Ref<HTMLSpanElement>;
}

/**
 * Diameter used by each preset size.
 * Type: constant.
 * Fields: none.
 * @example
 * const large: number = RingDiameters.lg;
 */
const RingDiameters: Readonly<Record<RingSize, number>> = {
    sm: 24,
    md: 40,
    lg: 56,
};

/**
 * Fixed SVG coordinate space, so the stroke geometry never depends on the rendered diameter.
 * Type: constant.
 * Fields: none.
 * @example
 * const centre: number = RingViewBox / 2;
 */
const RingViewBox: number = 100;

/**
 * Radius of the circle inside the fixed coordinate space.
 * Type: constant.
 * Fields: none.
 * @example
 * const radius: number = RingRadius;
 */
const RingRadius: number = 44;

/**
 * Length of the full circle inside the fixed coordinate space.
 * Type: constant.
 * Fields: none.
 * @example
 * const length: number = RingCircumference;
 */
const RingCircumference: number = 2 * Math.PI * RingRadius;

/**
 * Gap large enough that only one dash is ever painted.
 * Type: constant.
 * Fields: none.
 * @example
 * const gap: number = RingGap;
 */
const RingGap: number = RingCircumference * 1.6;

/**
 * Resolves how thick the arc should be drawn.
 * @param thickness - Requested stroke width in pixels, when supplied.
 * @param diameter - Rendered diameter in pixels.
 * @example
 * const stroke: number = resolveThickness(undefined, 40);
 * @returns A stroke width between 1px and a fifth of the diameter.
 */
const resolveThickness: (thickness: number | void, diameter: number) => number = (
    thickness: number | void,
    diameter: number,
): number => {
    const requested: number = thickness ?? Math.max(2, Math.round(diameter / 10));

    return Math.min(diameter / 5, Math.max(1, requested));
};

/**
 * Renders the Android-style circular indicator.
 *
 * Without a `value` the ring spins forever: the graphic rotates while the rounded arc grows, shrinks, and
 * shifts, which is the same motion the Android circular loader uses. With a `value` the same geometry draws a
 * determinate arc and the component reports a progressbar instead of a live status. Colours come from semantic
 * theme roles, and the indeterminate turn slows down rather than freezing when reduced motion is requested, so the
 * indicator always communicates that work is still in progress.
 * @param props - Value, diameter, stroke width, tone, screen-reader label, value text, class name, and native
 * span attributes.
 * @example
 * <Ring size="lg" tone="mint" label="Uploading" />
 * @example
 * <Ring value={68} size={96} thickness={8} showValue label="Cycle progress" />
 * @returns A spinning or determinate ring.
 */
const Ring: FC<RingProps> = ({
    value,
    size = "md",
    thickness,
    tone = "accent",
    label,
    showValue = false,
    className = "",
    ref,
    ...rest
}: RingProps) => {
    const { t }: InternationalContextValue = useInternational();
    const determinate: boolean = value !== (void 0) && Number.isFinite(value);
    const rawValue: number = value ?? 0;
    const resolvedLabel: string = label ?? t(determinate ? "progress" : "loading");
    const diameter: number = typeof size === "number" ? Math.max(8, size) : RingDiameters[size];
    const stroke: number = resolveThickness(thickness, diameter);
    const strokeUnits: number = (stroke / diameter) * RingViewBox;
    const percentage: number = determinate ? Math.round(Math.min(100, Math.max(0, rawValue))) : 0;
    const arcLength: number = (percentage / 100) * RingCircumference;
    const valueUnits: number = (Math.max(14, diameter * 0.2) / diameter) * RingViewBox;
    const style: CSSProperties = { width: `${diameter}px`, height: `${diameter}px` };
    const centre: number = RingViewBox / 2;

    return (
        <span
            {...rest}
            ref={ref}
            className={cx("ring", `ring--${tone}`, determinate && "ring--determinate", className)}
            style={style}
            role={determinate ? "progressbar" : "status"}
            aria-label={determinate ? resolvedLabel : (void 0)}
            aria-valuemin={determinate ? 0 : (void 0)}
            aria-valuemax={determinate ? 100 : (void 0)}
            aria-valuenow={determinate ? percentage : (void 0)}
            aria-valuetext={determinate ? `${percentage}%` : (void 0)}
        >
            <svg
                className="ring__svg"
                viewBox={`0 0 ${RingViewBox} ${RingViewBox}`}
                aria-hidden="true"
                focusable="false"
            >
                {determinate ? (
                    <circle
                        className="ring__track"
                        cx={centre}
                        cy={centre}
                        r={RingRadius}
                        fill="none"
                        strokeWidth={strokeUnits}
                    />
                ) : null}
                <circle
                    className="ring__arc"
                    cx={centre}
                    cy={centre}
                    r={RingRadius}
                    fill="none"
                    strokeWidth={strokeUnits}
                    style={
                        determinate
                            ? {
                                  strokeDasharray: `${arcLength} ${RingGap}`,
                                  strokeDashoffset: 0,
                              }
                            : (void 0)
                    }
                />
                {determinate && showValue ? (
                    <text
                        className="ring__value"
                        x={centre}
                        y={centre}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={valueUnits}
                    >
                        {`${percentage}%`}
                    </text>
                ) : null}
            </svg>
            {determinate ? null : <VisuallyHidden>{resolvedLabel}</VisuallyHidden>}
        </span>
    );
};

export default Ring;
