import {
    useState,
    type ChangeEvent,
    type Dispatch,
    type FC,
    type FormEvent,
    type ReactNode,
    type SetStateAction,
} from "react";
import { Stack } from "../../../arrange/layout";
import {
    Button,
    PeriodicityAudio,
    PeriodicityBarrage,
    PeriodicityForm,
    PeriodicityHorizontalVideo,
    PeriodicityTextInput,
    PeriodicityVerticalVideo,
    Tag,
} from "../../../component";
import type { PeriodicityFormProps } from "../../../component";
import type { BarrageItem, BarrageSlotContext } from "../../../component/barrage/Barrage";
import Icon from "../../../component/icon/Icon";
import Text from "../../../component/text/Text";
import type { VideoControlsContext } from "../../../component/video/VideoPlayer";
import Demo from "../../Demo";
import "./MediaPage.css";

// MDN shared assets are CC0, so the documentation can play a real clip without shipping a binary.
const sampleClip: string = "https://mdn.github.io/shared-assets/videos/flower.mp4";
const sampleAudio: string = "https://mdn.github.io/shared-assets/audio/t-rex-roar.mp3";

const audioCode: string = `<PeriodicityAudio
    src={sampleAudio}
    title="Tyrannosaurus rex"
    subtitle="Field recording · MDN shared assets"
    artwork={<span className="cover"><Icon name="Headphones" size={24} /></span>}
    caption="The shell, cover tile, transport, and volume rail all follow the active theme."
/>`;

const horizontalCode: string = `<PeriodicityHorizontalVideo
    src={sampleClip}
    label="Launch film"
    caption="The 16:9 frame, the control bar, and the seek track all take their colours from the active theme."
/>`;

const verticalCode: string = `<PeriodicityVerticalVideo
    src={sampleClip}
    label="Portrait cut"
    caption="A 9:16 stage with a right-hand action stack, a time badge, and a slim progress rail."
/>`;

const customBarCode: string = `<PeriodicityHorizontalVideo
    src={sampleClip}
    label="Launch film"
    slots={{
        controls: (context) => (
            <div className="bar">
                <button type="button" onClick={context.togglePlayback}>
                    {context.playing ? "Pause" : "Play"}
                </button>
                <span>{context.currentTime.toFixed(0)}s / {context.duration.toFixed(0)}s</span>
            </div>
        ),
    }}
/>`;

const barrageCode: string = `const [comments, setComments] = useState<BarrageItem[]>([
    { id: "one", text: "First!" },
    { id: "two", text: "The frame follows the theme" },
    { id: "three", text: "Nice cut" },
]);
const [draft, setDraft] = useState("");

const send = () => {
    if (draft.trim().length === 0) return;
    setComments([...comments, { text: draft }]);
    setDraft("");
};

<PeriodicityBarrage
    items={comments}
    repeat
    duration={12000}
    stagger={900}
    bottomInset={108}
    respectReducedMotion={false}
    slots={{
        overlay: <Tag tone="danger">LIVE</Tag>,
        item: ({ item }) => <span className="bubble">{item.text}</span>,
    }}
>
    <PeriodicityHorizontalVideo
        src={sampleClip}
        label="Launch film"
        slots={{
            aboveControls: () => (
                <PeriodicityForm
                    className="composer"
                    onSubmit={(event) => {
                        event.preventDefault();
                        send();
                    }}
                >
                    <PeriodicityTextInput
                        label="Add a comment"
                        value={draft}
                        onChange={(event) => setDraft(event.currentTarget.value)}
                    />
                    <Button type="submit" prefix="Send" aria-label="Send" />
                </PeriodicityForm>
            ),
        }}
    />
</PeriodicityBarrage>`;

const initialComments: readonly BarrageItem[] = [
    { id: "one", text: "First!" },
    { id: "two", text: "The frame follows the theme" },
    { id: "three", text: "Nice cut" },
    { id: "four", text: "Seek track is theme-aware" },
    { id: "five", text: "Slot pills, not just text" },
    { id: "six", text: "Portrait next?" },
];

/**
 * Documents the media family: the audio player, both video variants, and the floating comment layer.
 * @example
 * <MediaPage />
 * @returns The Media entry.
 */
const MediaPage: FC = () => {
    const [comments, setComments]: [
        readonly BarrageItem[],
        Dispatch<SetStateAction<readonly BarrageItem[]>>,
    ] = useState<readonly BarrageItem[]>(initialComments);
    const [draft, setDraft]: [string, Dispatch<SetStateAction<string>>] = useState<string>("");
    const [nextId, setNextId]: [number, Dispatch<SetStateAction<number>>] = useState<number>(1);

    const handleSend: () => void = (): void => {
        const text: string = draft.trim();

        if (text.length === 0) {
            return;
        }

        setComments(
            (current: readonly BarrageItem[]): readonly BarrageItem[] => [
                ...current,
                { id: `sent-${nextId}`, text },
            ],
        );
        setNextId((current: number): number => current + 1);
        setDraft("");
    };

    const handleBarrageSubmit: NonNullable<PeriodicityFormProps["onSubmit"]> = (
        event: FormEvent<HTMLFormElement>,
    ): void => {
        event.preventDefault();
        handleSend();
    };

    const renderBarrageComposer: () => ReactNode = (): ReactNode => (
        <PeriodicityForm className="media__composer" onSubmit={handleBarrageSubmit}>
            <PeriodicityTextInput
                className="media__composer-input"
                label="Add a comment"
                size="sm"
                value={draft}
                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                    setDraft(event.currentTarget.value)
                }
            />
            <Button type="submit" size="sm" className="media__send" prefix="Send" aria-label="Send" />
        </PeriodicityForm>
    );

    return (
        <>
            <Demo
                title="Audio player"
                description="A compact player around the native audio element. The cover tile, title, transport, and volume rail use the page's surface and accent roles; the built-in transport covers play and pause, seeking with buffered progress, time, mute, a vertical volume rail, and playback speed, and slots.controls can replace it."
                code={audioCode}
            >
                <PeriodicityAudio
                    src={sampleAudio}
                    title="Tyrannosaurus rex"
                    subtitle="Field recording · MDN shared assets"
                    artwork={
                        <span className="media__cover">
                            <Icon name="Headphones" size={24} />
                        </span>
                    }
                    caption="The shell, cover tile, transport, and volume rail all follow the active theme."
                />
            </Demo>

            <Demo
                title="Horizontal player"
                description="A themed 16:9 frame around the native video element. The bar, the buttons, the seek track, and the centred affordance all use the page's surface and accent roles, so the chrome follows the preset like the rest of the page."
                code={horizontalCode}
            >
                <Stack gap="lg">
                    <PeriodicityHorizontalVideo
                        src={sampleClip}
                        label="Launch film"
                        caption="The 16:9 frame, the control bar, and the seek track all take their colours from the active theme."
                    />
                    <Text variant="body-sm" tone="muted">
                        The sample clip is CC0 footage served by MDN shared assets.
                    </Text>
                </Stack>
            </Demo>

            <Demo
                title="Vertical player"
                description="The same player in a 9:16 stage: the control bar becomes a right-hand action stack, a time badge, and a slim progress rail along the bottom edge."
                code={verticalCode}
            >
                <div className="media__portrait">
                    <PeriodicityVerticalVideo
                        src={sampleClip}
                        label="Portrait cut"
                        caption="A 9:16 stage with a right-hand action stack, a time badge, and a slim progress rail."
                    />
                </div>
            </Demo>

            <Demo
                title="Custom control bar"
                description="The bottom bar is a slot. Pass controls a render function and the player hands it the live state, the labels, and the seek, volume, mute, and full-screen actions, so a bespoke bar keeps working with the same playback core."
                code={customBarCode}
            >
                <PeriodicityHorizontalVideo
                    src={sampleClip}
                    label="Launch film"
                    slots={{
                        controls: (context: VideoControlsContext) => (
                            <div className="media__bar">
                                <button
                                    type="button"
                                    className="media__bar-button"
                                    onClick={context.togglePlayback}
                                >
                                    {context.playing ? "Pause" : "Play"}
                                </button>
                                <span className="media__bar-clock">
                                    {`${context.currentTime.toFixed(0)}s / ${context.duration.toFixed(0)}s`}
                                </span>
                            </div>
                        ),
                    }}
                />
            </Demo>

            <Demo
                title="Barrage overlay"
                description="Barrage floats comments over any wrapped component without touching its layout or its interactions. A bottomInset keeps the player chrome clear, and the composer appends a new comment to the live stream."
                code={barrageCode}
            >
                <Stack gap="md">
                    <PeriodicityBarrage
                        items={comments}
                        repeat
                        duration={12000}
                        stagger={900}
                        bottomInset={108}
                        respectReducedMotion={false}
                        slots={{
                            overlay: (
                                <Tag className="media__live" tone="danger">
                                    LIVE
                                </Tag>
                            ),
                            item: (context: BarrageSlotContext) => (
                                <span className="media__bubble">
                                    <Icon name="Message" size={12} />
                                    {context.item.text}
                                </span>
                            ),
                        }}
                    >
                        <PeriodicityHorizontalVideo
                            src={sampleClip}
                            label="Launch film"
                            slots={{ aboveControls: renderBarrageComposer }}
                        />
                    </PeriodicityBarrage>
                </Stack>
            </Demo>
        </>
    );
};

export default MediaPage;
