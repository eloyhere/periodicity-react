import { useRef, type FC, type ReactNode, type RefObject } from "react";
import { type TextTone } from "../../../component";
import Font from "../../../component/font/Font";
import { useFont, type FontInfo } from "../../../component/font/useFont";
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

const fontCode: string = `<Font level="h4" family="mono" color="var(--accent)">
    <Text variant="body">Every type token inside the slot uses the Font hierarchy.</Text>
    <Text variant="label">Label</Text>
</Font>

<Font level="body" scale={1.25}>
    <Text variant="body">A nested Font raises the whole hierarchy by 1.25×.</Text>
</Font>`;

const textTones: readonly TextTone[] = ["default", "soft", "muted", "accent", "danger"];

interface FontProbeProps {
    target: RefObject<HTMLElement | null>;
}

/**
 * Shows the metadata returned by useFont for a Font ref.
 * @param props - Ref to the Font element being measured.
 * @example
 * <FontProbe target={fontRef} />
 * @returns A readout of the computed font family, size, and colour.
 */
const FontProbe: FC<FontProbeProps> = ({ target }: FontProbeProps) => {
    const font: FontInfo = useFont(target);

    return (
        <DemoGroup label="useFont(ref)">
            <Text variant="mono">{font.family}</Text>
            <Text variant="mono">{font.size}</Text>
            <Text variant="mono">{font.color}</Text>
        </DemoGroup>
    );
};

/**
 * Documents the Text component across its scale and semantic tones.
 * @example
 * <TextPage />
 * @returns The Text entry.
 */
const TextPage: FC = () => {
    const fontRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);

    return (
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

            <Demo
                title="Font scope"
                description="Font owns the hierarchy, family, colour, and scale; Text and other components consume its variables."
                code={fontCode}
            >
                <div className="showcase__text-scale">
                    <Font ref={fontRef} level="h4" family="mono" color="var(--accent)">
                        <Text variant="body">
                            Every type token inside the slot uses the Font hierarchy.
                        </Text>
                        <Text variant="label">Label</Text>
                    </Font>
                    <Font level="body" scale={1.25}>
                        <Text variant="body">
                            A nested Font raises the whole hierarchy by 1.25×.
                        </Text>
                    </Font>
                </div>
                <FontProbe target={fontRef} />
            </Demo>
        </>
    );
};

export default TextPage;
