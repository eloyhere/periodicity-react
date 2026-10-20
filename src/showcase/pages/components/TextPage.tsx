import type { FC, ReactNode } from "react";
import { type TextTone } from "../../../component";
import Text from "../../../component/text/Text";
import Demo, { DemoGroup } from "../../Demo";

const scaleCode: string = `<Text variant="display">Display / The Long Now</Text>
<Text variant="h1">Heading one</Text>
<Text variant="h2">Heading two</Text>
<Text variant="h3">Heading three</Text>
<Text variant="h4">Heading four</Text>
<Text variant="body">
    Body copy carries the argument: small loops, repeated with care, become a season.
    Select this sentence to check the exception.
</Text>
<Text variant="body-sm">
    Small body copy for secondary explanations and compact rows.
</Text>
<Text variant="label">Label · Cycle 04</Text>
<Text variant="mono">MONO / 09:41:00</Text>`;

const tonesCode: string = `<Text variant="body-sm" tone="default">default</Text>
<Text variant="body-sm" tone="soft">soft</Text>
<Text variant="body-sm" tone="muted">muted</Text>
<Text variant="body-sm" tone="accent">accent</Text>
<Text variant="body-sm" tone="danger">danger</Text>`;

const textTones: readonly TextTone[] = ["default", "soft", "muted", "accent", "danger"];

/**
 * Documents the Text component across its scale and semantic tones.
 * @example
 * <TextPage />
 * @returns The Text entry.
 */
const TextPage: FC = () => (
    <>
        <Demo
            title="Type scale"
            description="Text is the only selectable component besides inputs. Every variant is live on this page."
            code={scaleCode}
        >
            <div className="showcase__text-scale">
                <Text variant="display">Display / The Long Now</Text>
                <Text variant="h1">Heading one</Text>
                <Text variant="h2">Heading two</Text>
                <Text variant="h3">Heading three</Text>
                <Text variant="h4">Heading four</Text>
                <Text variant="body">
                    Body copy carries the argument: small loops, repeated with care, become a season.
                    Select this sentence to check the exception.
                </Text>
                <Text variant="body-sm">
                    Small body copy for secondary explanations and compact rows.
                </Text>
                <Text variant="label">Label · Cycle 04</Text>
                <Text variant="mono">MONO / 09:41:00</Text>
            </div>
        </Demo>

        <Demo title="Tones" description="Five semantic tones drawn from the colour roles." code={tonesCode}>
            <DemoGroup label="Tones">
                {textTones.map((tone: TextTone): ReactNode => (
                    <Text key={tone} variant="body-sm" tone={tone}>
                        {tone}
                    </Text>
                ))}
            </DemoGroup>
        </Demo>
    </>
);

export default TextPage;
