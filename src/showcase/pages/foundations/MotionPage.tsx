import type { FC, ReactNode } from "react";
import Demo from "../../Demo";
import "../../Foundations.css";

const motionSteps: ReadonlyArray<readonly [string, string, string]> = [
    ["Fast", "--duration-fast", "250ms"],
    ["Medium", "--duration-medium", "500ms"],
    ["Slow", "--duration-slow", "750ms"],
    ["Slower", "--duration-slower", "1000ms"],
];

const motionCode: string = `<div style={{ animationDuration: "var(--duration-fast)" }} />
<div style={{ animationDuration: "var(--duration-medium)" }} />
<div style={{ animationDuration: "var(--duration-slow)" }} />
<div style={{ animationDuration: "var(--duration-slower)" }} />

{/* Every transition also uses --ease-standard. */}`;

/**
 * Documents the duration and easing tokens.
 * @example
 * <MotionPage />
 * @returns The Motion entry.
 */
const MotionPage: FC = () => (
    <Demo
        title="Duration and easing"
        description="Short, decelerating transitions; the same rhythm across components."
        code={motionCode}
    >
        <div className="foundation-motion">
            {motionSteps.map(([name, token, duration]: readonly [string, string, string]): ReactNode => (
                <div className="foundation-motion__row" key={token}>
                    <span className="foundation-motion__name">{name}</span>
                    <span className="foundation-motion__track">
                        <span
                            className="foundation-motion__dot"
                            style={{ animationDuration: `var(${token})` }}
                        />
                    </span>
                    <code>
                        {token} · {duration}
                    </code>
                </div>
            ))}
        </div>
    </Demo>
);

export default MotionPage;
