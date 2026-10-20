import type { FC, ReactNode } from "react";
import Text from "../../../component/text/Text";
import Demo from "../../Demo";
import "../../Foundations.css";

/**
 * A colour token group in the foundation documentation.
 * Type: interface.
 * Fields: title, note, tokens.
 * @example
 * const group: ColourGroup = { title: "Brand", note: "Primary roles", tokens: [] };
 */
interface ColourGroup {
    title: string;
    note: string;
    tokens: ReadonlyArray<readonly [string, string]>;
}

const colourGroups: ColourGroup[] = [
    {
        title: "Brand",
        note: "Primary action, dark emphasis, and the secondary accent.",
        tokens: [
            ["Primary", "--colourPrimary"],
            ["Primary dark", "--colourPrimaryDark"],
            ["Primary light", "--colourPrimaryLight"],
            ["On primary", "--colourOnPrimary"],
            ["Primary container", "--colourPrimaryContainer"],
            ["On primary container", "--colourOnPrimaryContainer"],
            ["Accent", "--colourAccent"],
            ["Accent dark", "--colourAccentDark"],
            ["Accent light", "--colourAccentLight"],
        ],
    },
    {
        title: "Text",
        note: "Three levels of emphasis for readable hierarchy.",
        tokens: [
            ["Text primary", "--colourTextPrimary"],
            ["Text second", "--colourTextSecond"],
            ["Text disabled", "--colourTextDisabled"],
        ],
    },
    {
        title: "Surface",
        note: "Background, paper, and divider tones.",
        tokens: [
            ["Background", "--colourBackground"],
            ["Surface", "--colourSurface"],
            ["Surface dark", "--colourSurfaceDark"],
            ["Divider", "--colourDivider"],
            ["Control highlight", "--colourControlHighlight"],
        ],
    },
    {
        title: "Semantic",
        note: "Status roles; never the only signal.",
        tokens: [
            ["Error", "--colourError"],
            ["Warning", "--colourWarning"],
            ["Secondary", "--colourSecondary"],
            ["Tertiary", "--colourTertiary"],
            ["Control highlight", "--colourControlHighlight"],
            ["Scrim", "--colourScrim"],
        ],
    },
];

const colourCode: string = `{colourGroups.map((group) => (
    <section key={group.title}>
        <h3>{group.title}</h3>
        {group.tokens.map(([label, token]) => (
            <span
                key={token}
                style={{ background: \`var(\${token})\` }}
                title={\`\${label} · \${token}\`}
            />
        ))}
    </section>
))}`;

/**
 * Documents the colour roles and their public CSS custom properties.
 * @example
 * <ColourPage />
 * @returns The Colour entry.
 */
const ColourPage: FC = () => (
    <Demo
        title="Colour roles"
        description="Android-style roles for brand, text, surface, and semantics, shown as live token swatches."
        code={colourCode}
    >
        <div className="foundation-colour-groups">
            {colourGroups.map((group: ColourGroup): ReactNode => (
                <section className="foundation-colour-group" key={group.title}>
                    <div className="foundation-colour-group__heading">
                        <Text as="h3" variant="h4">
                            {group.title}
                        </Text>
                        <Text variant="body-sm" tone="muted">
                            {group.note}
                        </Text>
                    </div>
                    <div className="foundation-swatches">
                        {group.tokens.map(([label, token]: readonly [string, string]): ReactNode => (
                            <div className="foundation-swatch" key={token}>
                                <span
                                    className="foundation-swatch__chip"
                                    style={{ background: `var(${token})` }}
                                />
                                <span className="foundation-swatch__name">{label}</span>
                                <code className="foundation-swatch__token">{token}</code>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    </Demo>
);

export default ColourPage;
