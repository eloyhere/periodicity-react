import type { CSSProperties, FC, HTMLAttributes, Ref } from "react";
import { useInternational, type InternationalContextValue } from "../../international";
import cx from "../foundation/cx";
import "./ProgressRing.css";

/**
 * Props for the ProgressRing component.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `title`, `aria-*`, `data-*`, `tabIndex`, and pointer,
 * mouse, keyboard, and focus handlers are forwarded to the progressbar element. A caller supplied
 * `aria-label` takes precedence over `label`.
 * Fields: value, size, stroke, label, showValue, className.
 * @example
 * <ProgressRing value={72} label="Cycle" />
 */
export interface ProgressRingProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> {
    value: number;
    size?: number;
    stroke?: number;
    label?: string;
    showValue?: boolean;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a circular percentage ring with an optional centred label.
 * @param props - Percentage, diameter, stroke width, label, value visibility, class name, and native
 * div attributes.
 * @example
 * <ProgressRing value={72} size={132} label="Cycle" />
 * @returns A determinate ring progress element.
 */
const ProgressRing: FC<ProgressRingProps> = ({
    value,
    size = 132,
    stroke = 4,
    label,
    showValue = true,
    className = "",
    ref,
    ...rest
}: ProgressRingProps) => {
    const { t }: InternationalContextValue = useInternational();
    const clampedValue: number = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
    const center: number = size / 2;
    const radius: number = Math.max((size - stroke) / 2, 1);
    const circumference: number = 2 * Math.PI * radius;
    const dashOffset: number = circumference * (1 - clampedValue / 100);
    const percent: number = Math.round(clampedValue);
    const percentLabel: string = `${percent}%`;
    const valueFontSize: number = Math.max(15, size * 0.2);
    const labelFontSize: number = Math.max(9, size * 0.072);
    const hasLabel: boolean = label !== (void 0) && label.length > 0;
    const valueY: number = hasLabel ? center - size * 0.055 : center;
    const labelY: number = center + size * 0.125;
    const style: CSSProperties = { width: `${size}px`, height: `${size}px` };

    return (
        <div
            ref={ref}
            className={cx("progress-ring", className)}
            style={style}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={percentLabel}
            aria-label={hasLabel ? label : t("progress")}
            {...rest}
        >
            <svg
                className="progress-ring__svg"
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                aria-hidden="true"
            >
                <circle
                    className="progress-ring__track"
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                />
                <circle
                    className="progress-ring__progress"
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${center} ${center})`}
                />
                {showValue ? (
                    <text
                        className="progress-ring__value"
                        x={center}
                        y={valueY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={valueFontSize}
                    >
                        {percentLabel}
                    </text>
                ) : null}
                {hasLabel ? (
                    <text
                        className="progress-ring__label"
                        x={center}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={labelFontSize}
                    >
                        {label}
                    </text>
                ) : null}
            </svg>
        </div>
    );
};

export default ProgressRing;
