import type { FC, ReactNode } from "react";
import Text from "../../../component/text/Text";
import type { TextVariant } from "../../../component/text/Text";
import Demo from "../../Demo";
import "../../Foundations.css";

const typeScale: ReadonlyArray<readonly [TextVariant, string, string]> = [
    ["display", "Display", "64 / 700"],
    ["h1", "Heading 1", "48 / 700"],
    ["h2", "Heading 2", "32 / 600"],
    ["h3", "Heading 3", "24 / 600"],
    ["h4", "Heading 4", "20 / 600"],
    ["body", "Body", "16 / 400"],
    ["body-sm", "Body small", "14 / 400"],
    ["label", "Label", "12 / 500"],
    ["mono", "Mono", "12 / 500"],
];

const typographyCode: string = `<Text variant="display">The quick brown fox</Text>
<Text variant="h1">The quick brown fox</Text>
<Text variant="h2">The quick brown fox</Text>
<Text variant="h3">The quick brown fox</Text>
<Text variant="h4">The quick brown fox</Text>
<Text variant="body">The quick brown fox</Text>
<Text variant="body-sm">The quick brown fox</Text>
<Text variant="label">The quick brown fox</Text>
<Text variant="mono">The quick brown fox</Text>`;

/**
 * Documents the single typographic scale used across the system.
 * @example
 * <TypographyPage />
 * @returns The Typography entry.
 */
const TypographyPage: FC = () => (
    <Demo
        title="Type scale"
        description="One scale from display to mono, with stable line heights and live rows."
        code={typographyCode}
    >
        <div className="foundation-type">
            {typeScale.map(([variant, name, spec]: readonly [TextVariant, string, string]): ReactNode => (
                <div className="foundation-type__row" key={variant}>
                    <div className="foundation-type__meta">
                        <span className="foundation-type__name">{name}</span>
                        <code>{spec}</code>
                    </div>
                    <Text variant={variant}>The quick brown fox</Text>
                </div>
            ))}
        </div>
    </Demo>
);

export default TypographyPage;
