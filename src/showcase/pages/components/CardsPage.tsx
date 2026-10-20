import type { FC, ReactNode } from "react";
import { Columns, Inline, Stack } from "../../../arrange/layout";
import { Badge, Card, Surface } from "../../../component";
import type { CardTone } from "../../../component";
import Text from "../../../component/text/Text";
import Demo, { DemoGroup } from "../../Demo";

const surfacesCode: string = `<Columns count={3} gap="lg">
    <Card eyebrow="Surface" title="Accent" tone="accent" interactive>
        <Text variant="body-sm" tone="muted">
            A layered surface with tone, elevation, and ripple.
        </Text>
    </Card>
    <Card eyebrow="Surface" title="Mint" tone="mint">
        <Text variant="body-sm" tone="muted">Background → component → foreground.</Text>
    </Card>
    <Surface tone="violet" elevation={2} shape="md" className="showcase__surface" stateLayer>
        <Stack gap="xs">
            <Text variant="label">Raw surface</Text>
            <Text variant="h4">Violet</Text>
            <Text variant="body-sm" tone="muted">Used directly by bespoke layouts.</Text>
        </Stack>
    </Surface>
</Columns>`;

const tonesCode: string = `{["default", "accent", "mint", "violet", "amber"].map((tone) => (
    <Card key={tone} eyebrow="Tone" title={tone} tone={tone}>
        <Text variant="body-sm" tone="muted">Card body copy.</Text>
    </Card>
))}`;

const mediaCode: string = `<Card
    eyebrow="Media"
    title="With media"
    media={<div className="showcase__card-media" />}
    interactive
    footer={
        <Inline gap="sm" align="center">
            <Badge tone="mint">Ready</Badge>
            <Text variant="body-sm" tone="muted">Footer slot</Text>
        </Inline>
    }
>
    <Text variant="body-sm" tone="muted">
        Clickable card with a media slot and footer.
    </Text>
</Card>`;

const cardTones: readonly CardTone[] = ["default", "accent", "mint", "violet", "amber"];

/**
 * Documents the three-layer surface and the editorial card.
 * @example
 * <CardsPage />
 * @returns The Cards entry.
 */
const CardsPage: FC = () => (
    <>
        <Demo
            title="Cards and surfaces"
            description="Background, component, and foreground layers make up every surface."
            code={surfacesCode}
        >
            <Columns className="showcase__fields" count={3} gap="lg">
                <Card eyebrow="Surface" title="Accent" tone="accent" interactive>
                    <Text variant="body-sm" tone="muted">
                        A layered surface with tone, elevation, and ripple.
                    </Text>
                </Card>
                <Card eyebrow="Surface" title="Mint" tone="mint">
                    <Text variant="body-sm" tone="muted">
                        Background → component → foreground.
                    </Text>
                </Card>
                <Surface
                    tone="violet"
                    elevation={2}
                    shape="md"
                    className="showcase__surface"
                    stateLayer
                >
                    <Stack gap="xs" className="showcase__surface-body">
                        <Text variant="label">Raw surface</Text>
                        <Text variant="h4">Violet</Text>
                        <Text variant="body-sm" tone="muted">
                            Used directly by bespoke layouts.
                        </Text>
                    </Stack>
                </Surface>
            </Columns>
        </Demo>

        <Demo title="Card tones" code={tonesCode}>
            <DemoGroup label="Card tones">
                {cardTones.map((tone: CardTone): ReactNode => (
                    <Card key={tone} eyebrow="Tone" title={tone} tone={tone}>
                        <Text variant="body-sm" tone="muted">
                            Card body copy.
                        </Text>
                    </Card>
                ))}
            </DemoGroup>
        </Demo>

        <Demo
            title="Media, footer, and interactive state"
            description="A clickable card with a media slot and a footer."
            code={mediaCode}
        >
            <DemoGroup label="Card media, footer, and interactive state">
                <Card
                    eyebrow="Media"
                    title="With media"
                    media={<div className="showcase__card-media" />}
                    interactive
                    footer={
                        <Inline gap="sm" align="center">
                            <Badge tone="mint">Ready</Badge>
                            <Text variant="body-sm" tone="muted">
                                Footer slot
                            </Text>
                        </Inline>
                    }
                >
                    <Text variant="body-sm" tone="muted">
                        Clickable card with a media slot and footer.
                    </Text>
                </Card>
            </DemoGroup>
        </Demo>
    </>
);

export default CardsPage;
