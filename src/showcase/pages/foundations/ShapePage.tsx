import type { FC, ReactNode } from "react";
import Demo from "../../Demo";
import "../../Foundations.css";

const radiusSteps: ReadonlyArray<readonly [string, string]> = [
    ["xs", "--radius-xs"],
    ["sm", "--radius-sm"],
    ["md", "--radius-md"],
    ["lg", "--radius-lg"],
    ["pill", "--radius-pill"],
];

const shapeCode: string = `<span style={{ borderRadius: "var(--radius-xs)" }} />
<span style={{ borderRadius: "var(--radius-sm)" }} />
<span style={{ borderRadius: "var(--radius-md)" }} />
<span style={{ borderRadius: "var(--radius-lg)" }} />
<span style={{ borderRadius: "var(--radius-pill)" }} />`;

/**
 * Documents the corner radius tokens.
 * @example
 * <ShapePage />
 * @returns The Shape entry.
 */
const ShapePage: FC = () => (
    <Demo
        title="Corner radii"
        description="Small radii for controls, larger radii for sheets and surfaces."
        code={shapeCode}
    >
        <div className="foundation-shape">
            {radiusSteps.map(([name, token]: readonly [string, string]): ReactNode => (
                <div className="foundation-shape__item" key={token}>
                    <span className="foundation-shape__box" style={{ borderRadius: `var(${token})` }} />
                    <span>{name}</span>
                    <code>{token}</code>
                </div>
            ))}
        </div>
    </Demo>
);

export default ShapePage;
