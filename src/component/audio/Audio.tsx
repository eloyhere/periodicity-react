import {
    useEffect,
    useId,
    useRef,
    useState,
    type AudioHTMLAttributes,
    type Dispatch,
    type FC,
    type ReactEventHandler,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
    type SetStateAction,
    type SyntheticEvent,
} from "react";
import cx from "../foundation/cx";
import useMergedRef from "../foundation/useMergedRef";
import { useRipple, type RippleHandlers } from "../foundation/useRipple";
import Icon from "../icon/Icon";
import Spinner from "../progress/Spinner";
import SeekBar from "../input/seekbar/SeekBar";
import "./Audio.css";

/**
 * Control surface rendered for the audio.
 * Type: type alias.
 * Fields: none.
 * @example
 * const controls: AudioControls = "native";
 */
export type AudioControls = "custom" | "native" | "none";

/**
 * One encoded rendition offered to the browser.
 * Type: interface.
 * @param src - URL of the encoded file.
 * @param type - MIME type such as `audio/mpeg`, used by the browser to skip unsupported renditions.
 * @param media - Media query that scopes a rendition, such as `(min-width: 800px)`.
 * @example
 * const source: AudioSource = { src: "/episode.mp3", type: "audio/mpeg" };
 */
export interface AudioSource {
    readonly src: string;
    readonly type?: string;
    readonly media?: string;
}

/**
 * User-facing copy used by the custom controls.
 * Type: interface.
 * Fields: play, pause, volume, mute, unmute, seek, speed, loading, error, retry, noSource.
 * @example
 * const labels: AudioLabels = { play: "Play episode", pause: "Pause episode" };
 */
export interface AudioLabels {
    /** Accessible name of the play action. */
    play: string;
    /** Accessible name of the pause action. */
    pause: string;
    /** Accessible name of the volume rail and of the entry that opens it. */
    volume: string;
    /** Accessible name of the mute action. */
    mute: string;
    /** Accessible name of the unmute action. */
    unmute: string;
    /** Accessible name of the seek slider. */
    seek: string;
    /** Accessible name of the playback-speed action. */
    speed: string;
    /** Busy announcement while the audio buffers. */
    loading: string;
    /** Message shown when the browser cannot load the media. */
    error: string;
    /** Action that reloads the media after a failure. */
    retry: string;
    /** Message shown when no source was supplied. */
    noSource: string;
}

/**
 * State and actions handed to the control and action slots.
 * Type: interface.
 * Fields: playing, muted, volume, currentTime, duration, buffered, playbackRate, labels, togglePlayback,
 * seek, setVolume, toggleMute, setPlaybackRate.
 * @example
 * const controls: AudioControlsContext = context;
 * controls.seek(30);
 */
export interface AudioControlsContext {
    readonly playing: boolean;
    readonly muted: boolean;
    readonly volume: number;
    readonly currentTime: number;
    readonly duration: number;
    readonly buffered: number;
    readonly playbackRate: number;
    readonly labels: AudioLabels;
    togglePlayback: () => void;
    seek: (seconds: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    setPlaybackRate: (rate: number) => void;
}

/**
 * Replacement regions of the player.
 * Type: interface.
 * @param controls - Replaces the built-in transport row.
 * @param actions - Extra chrome rendered beside the title in the header row.
 * @example
 * const slots: AudioSlots = { controls: (context) => <MyTransport {...context} /> };
 */
export interface AudioSlots {
    controls?: (context: AudioControlsContext) => ReactNode;
    actions?: (context: AudioControlsContext) => ReactNode;
}

/**
 * Props for the audio player.
 * Type: interface.
 * Extends the native `audio` attributes, so `preload`, `loop`, `autoPlay`, `muted`, `crossOrigin`,
 * `aria-*`, `data-*`, and every media, mouse, keyboard, and focus handler are forwarded to the `<audio>`
 * element. `className` and `style` style the surrounding figure instead.
 * @param src - Single media URL.
 * @param sources - Encoded renditions rendered as `<source>` children; use instead of, or with, `src`.
 * @param controls - Control surface: `custom` (default), `native`, or `none`.
 * @param label - Accessible name of the audio; an explicit `aria-label` wins, then a string `title`.
 * @param title - Visible title of the track.
 * @param subtitle - Visible supporting line under the title.
 * @param artwork - Artwork rendered in the cover tile; defaults to a music icon.
 * @param caption - Visible caption rendered under the player as a `<figcaption>`.
 * @param rates - Playback speeds offered by the speed action; a list of one or fewer hides the action.
 * @param labels - Overrides for the custom-control copy.
 * @param slots - Transport and header-action slots for custom chrome.
 * @param className - Extra class names applied to the root figure.
 * @param ref - Ref forwarded to the `<audio>` element.
 * @example
 * const props: AudioProps = { src: "/episode.mp3", title: "Episode 12" };
 */
export interface AudioProps
    extends Omit<
        AudioHTMLAttributes<HTMLAudioElement>,
        "children" | "className" | "controls" | "src" | "title"
    > {
    src?: string;
    sources?: readonly AudioSource[];
    controls?: AudioControls;
    label?: string;
    title?: ReactNode;
    subtitle?: ReactNode;
    artwork?: ReactNode;
    caption?: ReactNode;
    rates?: readonly number[];
    labels?: Partial<AudioLabels>;
    slots?: AudioSlots;
    className?: string;
    ref?: Ref<HTMLAudioElement>;
}

/**
 * Event type delivered to the composed media handlers.
 * Type: type alias.
 * Fields: none.
 * @example
 * const handler: ReactEventHandler<HTMLAudioElement> = (event) => event.currentTarget.pause();
 */
type AudioEvent = SyntheticEvent<HTMLAudioElement>;

/**
 * Copy used when the caller overrides nothing.
 * Type: constant.
 * Fields: play, pause, volume, mute, unmute, seek, speed, loading, error, retry, noSource.
 * @example
 * const play: string = DefaultAudioLabels.play;
 */
const DefaultAudioLabels: AudioLabels = {
    play: "Play audio",
    pause: "Pause audio",
    volume: "Volume",
    mute: "Mute",
    unmute: "Unmute",
    seek: "Seek",
    speed: "Playback speed",
    loading: "Loading audio",
    error: "The audio could not be loaded.",
    retry: "Retry",
    noSource: "No audio source",
};

/**
 * Speeds offered by the built-in speed action.
 * Type: constant.
 * Fields: none.
 * @example
 * const rates: readonly number[] = DefaultRates;
 */
const DefaultRates: readonly number[] = [0.75, 1, 1.25, 1.5, 2];

const emptySources: readonly AudioSource[] = [];
const SecondsPerMinute: number = 60;
const SecondsPerHour: number = 3600;
const DigitPadBoundary: number = 10;
const SeekStep: number = 0.1;
const FullPercent: number = 100;
const VolumeTrackLength: number = 96;

/**
 * Formats a duration as `m:ss`, or `h:mm:ss` past an hour.
 * @param seconds - Elapsed or total time in seconds.
 * @example
 * const label: string = formatTime(83);
 * @returns The clock label, or `0:00` for an unknown duration.
 */
const formatTime: (seconds: number) => string = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds <= 0) {
        return "0:00";
    }

    const total: number = Math.floor(seconds);
    const hours: number = Math.floor(total / SecondsPerHour);
    const minutes: number = Math.floor((total % SecondsPerHour) / SecondsPerMinute);
    const remainder: number = total % SecondsPerMinute;
    const rest: string = remainder < DigitPadBoundary ? `0${remainder}` : `${remainder}`;

    if (hours === 0) {
        return `${minutes}:${rest}`;
    }

    return `${hours}:${minutes < DigitPadBoundary ? `0${minutes}` : `${minutes}`}:${rest}`;
};

/**
 * Formats a playback speed as a multiplier label.
 * @param rate - Playback speed, such as `1.25`.
 * @example
 * const label: string = formatRate(1.5);
 * @returns The multiplier label, such as `1.5×`.
 */
const formatRate: (rate: number) => string = (rate: number): string => `${rate}×`;

/**
 * Reports whether a node prop carries visible content.
 * @param value - Node supplied through a content prop.
 * @example
 * const shown: boolean = hasContent("Episode 12");
 * @returns `true` unless the node is absent, `null`, `false`, or an empty string.
 */
const hasContent: (value: ReactNode) => boolean = (value: ReactNode): boolean =>
    value !== (void 0) && value !== null && value !== false && value !== "";

/**
 * Wraps an internal media handler and the caller's handler in one listener.
 * @param internal - Handler that updates component state.
 * @param external - Handler supplied by the caller through the native prop.
 * @example
 * onPlay={composeHandler(handlePlay, onPlay)}
 * @returns A handler that runs both, internal first.
 */
const composeHandler: (
    internal: ReactEventHandler<HTMLAudioElement>,
    external: ReactEventHandler<HTMLAudioElement> | undefined,
) => ReactEventHandler<HTMLAudioElement> = (
    internal: ReactEventHandler<HTMLAudioElement>,
    external: ReactEventHandler<HTMLAudioElement> | undefined,
): ReactEventHandler<HTMLAudioElement> => (event: AudioEvent): void => {
    internal(event);
    external?.(event);
};

/**
 * Renders a themed audio player around the native `audio` element.
 *
 * The shell, cover tile, buttons, seek track, and volume rail are painted with the page's semantic surface
 * and accent roles, so the player follows the active preset exactly like the surrounding page. Seeking is
 * delegated to `SeekBar`, whose track, fill, and thumb use the same accent roles. The built-in transport
 * covers playback, seeking with buffered progress, time, mute, a volume rail, and playback speed, while
 * `controls="native"` hands the chrome to the browser and `slots.controls` replaces the transport with a
 * render function that receives the live state, labels, and actions. Every native media attribute and event
 * is preserved, and the component calls the caller's handler after its own.
 * @param props - Sources, control style, title, artwork, labels, slots, speeds, caption, class names, and
 * native audio attributes or events.
 * @example
 * <Audio
 *     src="/episode.mp3"
 *     title="Episode 12"
 *     subtitle="Rituals, rhythm, and the shape of a week"
 * />
 * @returns A figure containing the player, its transport, and an optional caption.
 */
const Audio: FC<AudioProps> = ({
    src,
    sources = emptySources,
    controls = "custom",
    label,
    title,
    subtitle,
    artwork,
    caption,
    rates = DefaultRates,
    labels,
    slots,
    className = "",
    style,
    muted: mutedProp,
    preload = "metadata",
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onDurationChange,
    onLoadedMetadata,
    onVolumeChange,
    onWaiting,
    onStalled,
    onCanPlay,
    onPlaying,
    onProgress,
    onRateChange,
    onError,
    "aria-label": ariaLabel,
    ref,
    ...rest
}: AudioProps) => {
    const mediaRef: RefObject<HTMLAudioElement | null> = useRef<HTMLAudioElement | null>(null);
    const mergedRef: RefCallback<HTMLAudioElement> = useMergedRef<HTMLAudioElement>(ref, mediaRef);
    const [playing, setPlaying]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [muted, setMuted]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(mutedProp === true);
    const [time, setTime]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
    const [buffered, setBuffered]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
    const [duration, setDuration]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
    const [buffering, setBuffering]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [failed, setFailed]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [volume, setVolume]: [number, Dispatch<SetStateAction<number>>] = useState<number>(1);
    const [volumeOpen, setVolumeOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [rate, setRate]: [number, Dispatch<SetStateAction<number>>] = useState<number>(1);
    const volumePanelId: string = useId();

    const resolvedLabels: AudioLabels = {
        play: labels?.play ?? DefaultAudioLabels.play,
        pause: labels?.pause ?? DefaultAudioLabels.pause,
        volume: labels?.volume ?? DefaultAudioLabels.volume,
        mute: labels?.mute ?? DefaultAudioLabels.mute,
        unmute: labels?.unmute ?? DefaultAudioLabels.unmute,
        seek: labels?.seek ?? DefaultAudioLabels.seek,
        speed: labels?.speed ?? DefaultAudioLabels.speed,
        loading: labels?.loading ?? DefaultAudioLabels.loading,
        error: labels?.error ?? DefaultAudioLabels.error,
        retry: labels?.retry ?? DefaultAudioLabels.retry,
        noSource: labels?.noSource ?? DefaultAudioLabels.noSource,
    };

    const sourceNodes: ReactNode[] = sources.map(
        (source: AudioSource, index: number): ReactNode => (
            <source
                key={`${source.src}-${index}`}
                src={source.src}
                type={source.type}
                media={source.media}
            />
        ),
    );
    const hasSource: boolean = src !== (void 0) || sourceNodes.length > 0;
    const maxTime: number = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const resolvedLabel: string | undefined =
        ariaLabel ??
        (label !== (void 0) && label.length > 0
            ? label
            : typeof title === "string" && title.length > 0
              ? title
              : (void 0));
    const clock: string = `${formatTime(time)} / ${formatTime(maxTime)}`;
    const showCustomControls: boolean = controls === "custom";
    const showRate: boolean = rates.length > 1;
    const artworkNode: ReactNode = hasContent(artwork) ? artwork : <Icon name="Music" size={24} />;
    const hasTitle: boolean = hasContent(title);
    const hasSubtitle: boolean = hasContent(subtitle);

    useEffect((): void => {
        const node: HTMLAudioElement | null = mediaRef.current;

        if (node === null) {
            return;
        }

        node.muted = mutedProp === true;
        setMuted(mutedProp === true);
    }, [mutedProp]);

    const setDurationFrom: (node: HTMLAudioElement) => void = (node: HTMLAudioElement): void => {
        setDuration(Number.isFinite(node.duration) ? node.duration : 0);
    };

    const togglePlayback: () => void = (): void => {
        const node: HTMLAudioElement | null = mediaRef.current;

        if (node === null) {
            return;
        }

        if (playing) {
            node.pause();

            return;
        }

        const result: Promise<void> | undefined = node.play();

        // Browsers reject play() when autoplay is blocked; stay paused instead of surfacing an error.
        result?.catch((): void => {
            setPlaying(false);
        });
    };

    const toggleMuted: () => void = (): void => {
        const node: HTMLAudioElement | null = mediaRef.current;

        if (node === null) {
            return;
        }

        node.muted = !node.muted;
        setMuted(node.muted);
    };

    const handleRetry: () => void = (): void => {
        const node: HTMLAudioElement | null = mediaRef.current;

        setFailed(false);
        node?.load();
    };

    /** Applies an absolute volume between 0 and 1 and mutes at zero. */
    const applyVolume: (level: number) => void = (level: number): void => {
        const node: HTMLAudioElement | null = mediaRef.current;
        const next: number = Math.min(1, Math.max(0, level));

        if (node !== null) {
            node.volume = next;
            node.muted = next === 0;
        }

        setVolume(next);
        setMuted(next === 0);
    };

    /** Applies a positive playback rate to the media element. */
    const applyRate: (next: number) => void = (next: number): void => {
        const node: HTMLAudioElement | null = mediaRef.current;

        if (!Number.isFinite(next) || next <= 0) {
            return;
        }

        if (node !== null) {
            node.playbackRate = next;
        }

        setRate(next);
    };

    const handleVolume: (percent: number) => void = (percent: number): void => {
        applyVolume(percent / FullPercent);
    };

    const toggleVolume: () => void = (): void => {
        setVolumeOpen((open: boolean): boolean => !open);
    };

    const cycleRate: () => void = (): void => {
        const index: number = rates.indexOf(rate);
        const next: number | undefined = rates[(index + 1) % rates.length];

        if (next !== (void 0)) {
            applyRate(next);
        }
    };

    const handleSeek: (next: number) => void = (next: number): void => {
        const node: HTMLAudioElement | null = mediaRef.current;

        setTime(next);

        if (node !== null) {
            node.currentTime = next;
        }
    };

    const handlePlay: ReactEventHandler<HTMLAudioElement> = (): void => {
        setPlaying(true);
        setBuffering(false);
    };

    const handlePause: ReactEventHandler<HTMLAudioElement> = (): void => {
        setPlaying(false);
    };

    const handleEnded: ReactEventHandler<HTMLAudioElement> = (): void => {
        setPlaying(false);
    };

    const handleTimeUpdate: ReactEventHandler<HTMLAudioElement> = (event: AudioEvent): void => {
        setTime(event.currentTarget.currentTime);
    };

    const handleDurationChange: ReactEventHandler<HTMLAudioElement> = (event: AudioEvent): void => {
        setDurationFrom(event.currentTarget);
    };

    const handleLoadedMetadata: ReactEventHandler<HTMLAudioElement> = (event: AudioEvent): void => {
        setDurationFrom(event.currentTarget);
    };

    const handleVolumeChange: ReactEventHandler<HTMLAudioElement> = (event: AudioEvent): void => {
        setMuted(event.currentTarget.muted);
        setVolume(event.currentTarget.volume);
    };

    const handleRateChange: ReactEventHandler<HTMLAudioElement> = (event: AudioEvent): void => {
        setRate(event.currentTarget.playbackRate);
    };

    const handleProgress: ReactEventHandler<HTMLAudioElement> = (event: AudioEvent): void => {
        const ranges: TimeRanges = event.currentTarget.buffered;

        setBuffered(ranges.length === 0 ? 0 : ranges.end(ranges.length - 1));
    };

    const handleWaiting: ReactEventHandler<HTMLAudioElement> = (): void => {
        setBuffering(true);
    };

    const handleStalled: ReactEventHandler<HTMLAudioElement> = (): void => {
        setBuffering(true);
    };

    const handleCanPlay: ReactEventHandler<HTMLAudioElement> = (): void => {
        setBuffering(false);
    };

    const handlePlaying: ReactEventHandler<HTMLAudioElement> = (): void => {
        setPlaying(true);
        setBuffering(false);
    };

    const handleError: ReactEventHandler<HTMLAudioElement> = (): void => {
        setFailed(true);
        setBuffering(false);
        setPlaying(false);
    };

    const controlsContext: AudioControlsContext = {
        playing,
        muted,
        volume,
        currentTime: time,
        duration: maxTime,
        buffered,
        playbackRate: rate,
        labels: resolvedLabels,
        togglePlayback,
        seek: handleSeek,
        setVolume: applyVolume,
        toggleMute: toggleMuted,
        setPlaybackRate: applyRate,
    };
    const ripple: RippleHandlers = useRipple({ trigger: "both" });
    const busy: boolean = buffering && !failed && hasSource;
    const playButton: ReactNode = (
        <button
            type="button"
            className="audio__button audio__button--play"
            aria-label={playing ? resolvedLabels.pause : resolvedLabels.play}
            onClick={togglePlayback}
            onPointerDown={ripple.onPointerDown}
            onPointerEnter={ripple.onPointerEnter}
            onKeyDown={ripple.onKeyDown}
        >
            {busy ? (
                <Spinner size="sm" label={resolvedLabels.loading} />
            ) : (
                <Icon name={playing ? "Pause" : "Play"} size={18} />
            )}
        </button>
    );
    const muteButton: ReactNode = (
        <button
            type="button"
            className="audio__button"
            aria-label={muted ? resolvedLabels.unmute : resolvedLabels.mute}
            onClick={toggleMuted}
            onPointerDown={ripple.onPointerDown}
            onPointerEnter={ripple.onPointerEnter}
            onKeyDown={ripple.onKeyDown}
        >
            <Icon name={muted ? "Mute" : "Volume"} size={18} />
        </button>
    );
    const volumeButton: ReactNode = (
        <button
            type="button"
            className="audio__button"
            aria-label={resolvedLabels.volume}
            aria-expanded={volumeOpen}
            aria-controls={volumePanelId}
            onClick={toggleVolume}
            onPointerDown={ripple.onPointerDown}
            onPointerEnter={ripple.onPointerEnter}
            onKeyDown={ripple.onKeyDown}
        >
            <Icon name={volumeOpen ? "ChevronDown" : "ChevronUp"} size={18} />
        </button>
    );
    const rateButton: ReactNode = showRate ? (
        <button
            type="button"
            className="audio__button audio__rate"
            aria-label={`${resolvedLabels.speed} ${formatRate(rate)}`}
            onClick={cycleRate}
            onPointerDown={ripple.onPointerDown}
            onPointerEnter={ripple.onPointerEnter}
            onKeyDown={ripple.onKeyDown}
        >
            <span className="audio__rate-label">{formatRate(rate)}</span>
        </button>
    ) : null;
    const seekbar: ReactNode = (
        <SeekBar
            className="audio__seekbar"
            size="sm"
            value={Math.min(time, maxTime)}
            max={maxTime}
            step={SeekStep}
            secondaryValue={Math.min(buffered, maxTime)}
            format={(): string => clock}
            aria-label={resolvedLabels.seek}
            disabled={maxTime === 0}
            onChange={handleSeek}
        />
    );
    const volumePanel: ReactNode = volumeOpen ? (
        <div className="audio__volume" id={volumePanelId}>
            <SeekBar
                className="audio__volume-bar"
                direction="vertical"
                length={VolumeTrackLength}
                size="sm"
                value={muted ? 0 : Math.round(volume * FullPercent)}
                min={0}
                max={FullPercent}
                step={1}
                format={(value: number): string => `${value}%`}
                aria-label={resolvedLabels.volume}
                onChange={handleVolume}
            />
        </div>
    ) : null;
    const transport: ReactNode = (
        <div className="audio__transport">
            {playButton}
            {seekbar}
            <span className="audio__time" aria-hidden="true">
                {clock}
            </span>
            <span className="audio__volume-control">
                {muteButton}
                {volumeButton}
                {volumePanel}
            </span>
            {rateButton}
        </div>
    );
    const statusNode: ReactNode = failed ? (
        <div className="audio__status audio__status--error" role="alert">
            <Icon name="Warning" size={18} />
            <span className="audio__message">{resolvedLabels.error}</span>
            <button
                type="button"
                className="audio__retry"
                onClick={handleRetry}
                onPointerDown={ripple.onPointerDown}
                onPointerEnter={ripple.onPointerEnter}
                onKeyDown={ripple.onKeyDown}
            >
                <span className="audio__retry-label">{resolvedLabels.retry}</span>
            </button>
        </div>
    ) : !hasSource ? (
        <div className="audio__status audio__status--empty">
            <Icon name="Audio" size={18} />
            <span className="audio__message">{resolvedLabels.noSource}</span>
        </div>
    ) : null;
    const renderControls: ((context: AudioControlsContext) => ReactNode) | undefined = slots?.controls;
    const renderActions: ((context: AudioControlsContext) => ReactNode) | undefined = slots?.actions;
    let transportNode: ReactNode = transport;

    if (renderControls !== (void 0)) {
        // The slot is a render prop: it only builds elements here, and the actions it receives mutate
        // the media element from event handlers, never while rendering.
        // eslint-disable-next-line react-hooks/refs
        const slotContent: ReactNode = renderControls(controlsContext);

        transportNode = <div className="audio__slot">{slotContent}</div>;
    }

    let actionsNode: ReactNode = null;

    if (renderActions !== (void 0)) {
        // The slot is a render prop: it only builds elements here, and the actions it receives mutate
        // the media element from event handlers, never while rendering.
        // eslint-disable-next-line react-hooks/refs
        const slotContent: ReactNode = renderActions(controlsContext);

        actionsNode = <span className="audio__actions">{slotContent}</span>;
    }

    const headNode: ReactNode =
        !hasTitle && !hasSubtitle && actionsNode === null ? null : (
            <div className="audio__head">
                {hasTitle || hasSubtitle ? (
                    <span className="audio__meta">
                        {hasTitle ? <span className="audio__title">{title}</span> : null}
                        {hasSubtitle ? <span className="audio__subtitle">{subtitle}</span> : null}
                    </span>
                ) : null}
                {actionsNode}
            </div>
        );
    return (
        <figure
            className={cx("audio", className)}
            style={style}
            data-controls={controls}
            data-empty={hasSource ? "false" : "true"}
        >
            <div className="audio__shell">
                <span className="audio__artwork" aria-hidden="true">
                    {artworkNode}
                </span>

                <div className="audio__body">
                    {headNode}

                    <audio
                        {...rest}
                        ref={mergedRef}
                        className="audio__media"
                        src={src}
                        controls={controls === "native"}
                        muted={muted}
                        preload={preload}
                        aria-label={resolvedLabel}
                        onPlay={composeHandler(handlePlay, onPlay)}
                        onPause={composeHandler(handlePause, onPause)}
                        onEnded={composeHandler(handleEnded, onEnded)}
                        onTimeUpdate={composeHandler(handleTimeUpdate, onTimeUpdate)}
                        onDurationChange={composeHandler(handleDurationChange, onDurationChange)}
                        onLoadedMetadata={composeHandler(handleLoadedMetadata, onLoadedMetadata)}
                        onVolumeChange={composeHandler(handleVolumeChange, onVolumeChange)}
                        onRateChange={composeHandler(handleRateChange, onRateChange)}
                        onWaiting={composeHandler(handleWaiting, onWaiting)}
                        onStalled={composeHandler(handleStalled, onStalled)}
                        onCanPlay={composeHandler(handleCanPlay, onCanPlay)}
                        onPlaying={composeHandler(handlePlaying, onPlaying)}
                        onProgress={composeHandler(handleProgress, onProgress)}
                        onError={composeHandler(handleError, onError)}
                    >
                        {sourceNodes}
                    </audio>

                    {statusNode}
                    {showCustomControls && hasSource && !failed ? transportNode : null}
                </div>
            </div>

            {hasContent(caption) ? <figcaption className="audio__caption">{caption}</figcaption> : null}
        </figure>
    );
};

export default Audio;
