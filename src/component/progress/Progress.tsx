import type { CSSProperties, FC } from "react";
import cx from "../foundation/cx";
import "./Progress.css";

/**
 * Semantic tone of a progress bar.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: ProgressTone = "mint";
 */
export type ProgressTone = "accent" | "mint" | "violet" | "amber";

/**
 * Height of a progress bar.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: ProgressSize = "sm";
 */
export type ProgressSize = "sm" | "md";

/**
 * Props for the Progress component.
 * Type: interface.
 * Fields: value, max, label, showValue, tone, size, className.
 * @example
 * <Progress value={68} label="Cycle progress" showValue />
 */
export interface ProgressProps {
    value?: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    tone?: ProgressTone;
    size?: ProgressSize;
    className?: string;
}

/**
 * Renders a determinate or indeterminate linear progress bar.
 * @param props - Value, maximum, label, value visibility, tone, size, and class name.
 * @example
 * <Progress value={3} max={7} label="Rituals done" showValue tone="mint" />
 * @returns A progress bar element.
 */
const Progress: FC<ProgressProps> = ({
    value,
    max = 100,
    label,
    showValue = false,
    tone = "accent",
    size = "md",
    className = "",
}: ProgressProps) => {
    const safeMax: number = max > 0 ? max : 100;
    const numericValue: number = typeof value === "number" ? value : 0;
    const boundedValue: number = Math.min(Math.max(numericValue, 0), safeMax);
    const isDeterminate: boolean = typeof value === "number" && Number.isFinite(value);
    const percent: number = isDeterminate ? (boundedValue / safeMax) * 100 : 0;
    const percentLabel: string = `${Math.round(percent)}%`;
    const valueText: string = isDeterminate ? percentLabel : "Loading";
    const hasLabel: boolean = label !== (void 0) && label.length > 0;
    const accessibleName: string = label !== (void 0) && label.length > 0 ? label : "Progress";
    const fillStyle: CSSProperties = { width: `${percent}%` };
    const hasMeta: boolean = hasLabel || showValue;

    return (
        <div
            className={cx("progress", `progress--${size}`, `progress--${tone}`, className)}
            role="progressbar"
            aria-label={accessibleName}
            aria-valuemin={0}
            aria-valuemax={safeMax}
            aria-valuenow={isDeterminate ? boundedValue : (void 0)}
            aria-valuetext={valueText}
        >
            {hasMeta ? (
                <div className="progress__meta">
                    {label !== (void 0) && label.length > 0 ? (
                        <span className="progress__label">{label}</span>
                    ) : null}
                    {showValue ? <span className="progress__value">{valueText}</span> : null}
                </div>
            ) : null}
            <div className="progress__track" aria-hidden="true">
                <span
                    className={cx("progress__fill", !isDeterminate && "progress__fill--indeterminate")}
                    style={isDeterminate ? fillStyle : (void 0)}
                />
            </div>
        </div>
    );
};

export default Progress;
