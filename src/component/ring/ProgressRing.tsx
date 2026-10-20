import type { FC } from "react";
import "./ProgressRing.css";

export interface ProgressRingProps {
    value: number;
    size?: number;
    stroke?: number;
    label?: string;
    className?: string;
}

const ProgressRing: FC<ProgressRingProps> = ({
    value,
    size = 132,
    stroke = 4,
    label,
    className = "",
}: ProgressRingProps) => {
    const clampedValue: number = Math.min(100, Math.max(0, value));
    const center: number = size / 2;
    const radius: number = Math.max((size - stroke) / 2, 1);
    const circumference: number = 2 * Math.PI * radius;
    const dashOffset: number = circumference * (1 - clampedValue / 100);
    const percent: number = Math.round(clampedValue);
    const percentLabel: string = `${percent}%`;
    const valueFontSize: number = Math.max(15, size * 0.2);
    const labelFontSize: number = Math.max(9, size * 0.072);
    const valueY: number = label ? center - size * 0.055 : center;
    const labelY: number = center + size * 0.125;

    return (
        <div
            className={`progress-ring ${className}`.trim()}
            style={{ width: `${size}px`, height: `${size}px` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={label ?? "Progress"}
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
                {label ? (
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
