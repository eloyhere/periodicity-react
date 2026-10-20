import { type CSSProperties, type FC } from "react";
import cx from "../foundation/cx";
import "./CircularProgress.css";

/**
 * Props for the Material circular progress indicator.
 * Type: interface.
 * Fields: value, minimum, maximum, step, size, stroke, label, className.
 * @example
 * <CircularProgress />
 * <CircularProgress value={42} minimum={0} maximum={100} />
 */
export interface CircularProgressProps {
    value?: number;
    minimum?: number;
    maximum?: number;
    step?: number;
    size?: number;
    stroke?: number;
    label?: string;
    className?: string;
}

/**
 * Renders an Android-style circular progress. A maximum less than or equal to
 * the minimum means the progress is unknown, so the arc spins forever.
 * @param props - Range, step, size, and accessible label.
 * @example
 * <CircularProgress minimum={0} maximum={0} step={0} />
 * @returns A determinate or indeterminate circular progress.
 */
const CircularProgress: FC<CircularProgressProps> = ({
    value,
    minimum = 0,
    maximum = 0,
    step = 0,
    size = 48,
    stroke = 4,
    label = "Loading",
    className = "",
}: CircularProgressProps) => {
    const determinate: boolean =
        maximum > minimum && value !== (void 0) && Number.isFinite(value);
    const radius: number = Math.max((size - stroke) / 2, 1);
    const circumference: number = 2 * Math.PI * radius;
    const raw: number = value ?? minimum;
    const snapped: number =
        step > 0
            ? Math.min(maximum, Math.max(minimum, minimum + Math.round((raw - minimum) / step) * step))
            : Math.min(maximum, Math.max(minimum, raw));
    const ratio: number = determinate ? (snapped - minimum) / (maximum - minimum) : 0;
    const dash: number = ratio * circumference;
    const style: CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
    };

    return (
        <span
            className={cx(
                "circular-progress",
                determinate ? "circular-progress--determinate" : "circular-progress--indeterminate",
                className,
            )}
            role="progressbar"
            aria-label={label}
            aria-valuemin={determinate ? minimum : (void 0)}
            aria-valuemax={determinate ? maximum : (void 0)}
            aria-valuenow={determinate ? Math.round(snapped) : (void 0)}
            aria-valuetext={determinate ? `${Math.round(ratio * 100)}%` : "Loading"}
            style={style}
        >
            <svg
                className="circular-progress__svg"
                viewBox={`0 0 ${size} ${size}`}
                width={size}
                height={size}
                aria-hidden="true"
                focusable="false"
            >
                <circle
                    className="circular-progress__track"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                />
                <circle
                    className="circular-progress__arc"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={
                        determinate ? `${dash} ${circumference - dash}` : (void 0)
                    }
                    strokeDashoffset={determinate ? 0 : (void 0)}
                />
            </svg>
        </span>
    );
};

export default CircularProgress;
