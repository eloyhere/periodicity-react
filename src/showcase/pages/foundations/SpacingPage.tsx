import type { FC, ReactNode } from "react";
import Demo from "../../Demo";
import "../../Foundations.css";

const spacingSteps: ReadonlyArray<number> = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11];

const spacingCode: string = `<div className="stack">
    <span style={{ width: "var(--space-1)" }} />
    <span style={{ width: "var(--space-2)" }} />
    <span style={{ width: "var(--space-3)" }} />
    <span style={{ width: "var(--space-4)" }} />
    <span style={{ width: "var(--space-5)" }} />
    <span style={{ width: "var(--space-6)" }} />
    <span style={{ width: "var(--space-7)" }} />
    <span style={{ width: "var(--space-8)" }} />
    <span style={{ width: "var(--space-10)" }} />
    <span style={{ width: "var(--space-11)" }} />
</div>`;

/**
 * Documents the 4px spacing rhythm exposed as space tokens.
 * @example
 * <SpacingPage />
 * @returns The Spacing entry.
 */
const SpacingPage: FC = () => (
    <Demo
        title="Space tokens"
        description="A 4px base rhythm exposed as space tokens. Each bar is drawn at the token width."
        code={spacingCode}
    >
        <div className="foundation-spacing">
            {spacingSteps.map((step: number): ReactNode => (
                <div className="foundation-spacing__row" key={step}>
                    <code>--space-{step}</code>
                    <span className="foundation-spacing__bar" style={{ width: `var(--space-${step})` }} />
                </div>
            ))}
        </div>
    </Demo>
);

export default SpacingPage;
