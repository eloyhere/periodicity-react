import type { FC, ReactNode } from "react";
import Demo from "../../Demo";
import "../../Foundations.css";

const elevationSteps: ReadonlyArray<readonly [string, string]> = [
    ["1", "--elevation-1"],
    ["2", "--elevation-2"],
    ["3", "--elevation-3"],
];

const elevationCode: string = `<div style={{ boxShadow: "var(--elevation-1)" }} />
<div style={{ boxShadow: "var(--elevation-2)" }} />
<div style={{ boxShadow: "var(--elevation-3)" }} />`;

/**
 * Documents the three elevation shadows.
 * @example
 * <ElevationPage />
 * @returns The Elevation entry.
 */
const ElevationPage: FC = () => (
    <Demo
        title="Elevation"
        description="Three soft heights for menus, cards, and dialogs. Shadows come from tokens, never literal values."
        code={elevationCode}
    >
        <div className="foundation-elevation">
            {elevationSteps.map(([name, token]: readonly [string, string]): ReactNode => (
                <div className="foundation-elevation__item" key={token}>
                    <span className="foundation-elevation__box" style={{ boxShadow: `var(${token})` }} />
                    <span>Elevation {name}</span>
                    <code>{token}</code>
                </div>
            ))}
        </div>
    </Demo>
);

export default ElevationPage;
