import {
    useEffect,
    useId,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type KeyboardEventHandler,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEventHandler,
    type MouseEvent as ReactMouseEvent,
    type ReactEventHandler,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
    type SetStateAction,
    type SyntheticEvent,
    type VideoHTMLAttributes,
} from "react";
import cx from "../foundation/cx";
import useMergedRef from "../foundation/useMergedRef";
import { useRipple, type RippleHandlers } from "../foundation/useRipple";
import Icon from "../icon/Icon";
import Spinner from "../progress/Spinner";
import SeekBar from "../input/seekbar/SeekBar";
import "./VideoPlayer.css";

/**
 * Control surface rendered for the video.
 * Type: type alias.
 * Fields: none.
 * @example
 * const controls: VideoControls = "native";
 */
export type VideoControls = "custom" | "native" | "none";

/**
 * Arrangement of the custom chrome; the public components pick one each.
 * Type: type alias.
 * Fields: none.
 * @example
 * const layout: VideoLayout = "vertical";
 */
export type VideoLayout = "horizontal" | "vertical";

/**
 * One encoded rendition offered to the browser.
 * Type: interface.
 * @param src - URL of the encoded file.
 * @param type - MIME type such as `video/webm`, used by the browser to skip unsupported renditions.
 * @param media - Media query that scopes a rendition, such as `(min-width: 800px)`.
 * @example
 * const source: VideoSource = { src: "/demo.webm", type: "video/webm" };
 */
export interface VideoSource {
    readonly src: string;
    readonly type?: string;
    readonly media?: string;
}

/**
 * Text track rendered with the video.
 * Type: interface.
 * @param src - URL of the WebVTT file.
 * @param kind - Track purpose; defaults to `captions` when omitted.
 * @param srcLang - Language of the track, such as `en-GB`.
 * @param label - Human-readable title shown in the browser's track menu.
 * @param default - Makes this track the one the browser enables first.
 * @example
 * const track: VideoTrack = { src: "/demo.en.vtt", kind: "captions", srcLang: "en-GB", label: "English" };
 */
export interface VideoTrack {
    readonly src: string;
    readonly kind?: "captions" | "subtitles" | "descriptions" | "chapters" | "metadata";
    readonly srcLang?: string;
    readonly label?: string;
    readonly default?: boolean;
}

/**
 * User-facing copy used by the custom controls.
 * Type: interface.
 * Fields: play, pause, mute, unmute, seek, fullscreen, exitFullscreen, loading, error, retry, noSource.
 * @example
 * const labels: VideoLabels = { play: "播放", pause: "暂停", seek: "进度" };
 */
export interface VideoLabels {
    /** Accessible name of the play action and of the centred play button. */
    play: string;
    /** Accessible name of the pause action. */
    pause: string;
    /** Accessible name of the entry that opens the vertical volume rail. */
    volume: string;
    /** Accessible name of the mute action. */
    mute: string;
    /** Accessible name of the unmute action. */
    unmute: string;
    /** Accessible name of the seek slider. */
    seek: string;
    /** Accessible name of the full-screen action. */
    fullscreen: string;
    /** Accessible name of the exit-full-screen action. */
    exitFullscreen: string;
    /** Busy announcement while the video buffers. */
    loading: string;
    /** Message shown when the browser cannot load the media. */
    error: string;
    /** Action that reloads the media after a failure. */
    retry: string;
    /** Message shown when no source was supplied. */
    noSource: string;
}

/**
 * State and actions handed to the control-bar slot.
 * Type: interface.
 * Fields: playing, muted, volume, currentTime, duration, buffered, fullscreen, canFullscreen, labels,
 * togglePlayback, seek, setVolume, toggleMute, toggleFullscreen, toggleControls, toggleVolume.
 * @example
 * const controls: VideoControlsContext = context;
 * controls.seek(30);
 */
export interface VideoControlsContext {
    readonly playing: boolean;
    readonly muted: boolean;
    readonly volume: number;
    readonly currentTime: number;
    readonly duration: number;
    readonly buffered: number;
    readonly fullscreen: boolean;
    readonly canFullscreen: boolean;
    readonly labels: VideoLabels;
    togglePlayback: () => void;
    seek: (seconds: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    toggleFullscreen: () => void;
    toggleControls: () => void;
    toggleVolume: () => void;
}

/**
 * Replacement regions of the player.
 * Type: interface.
 * @param controls - Replaces the built-in bottom bar; the vertical variant swaps only its slim rail.
 * @param aboveControls - Extra chrome rendered directly above the bottom bar and hidden together with it. Its
 * offset follows `--video-controls-height`; override that variable when replacing the bar with a different height.
 * @example
 * const slots: VideoSlots = { controls: (context) => <MyBar {...context} /> };
 */
export interface VideoSlots {
    controls?: (context: VideoControlsContext) => ReactNode;
    aboveControls?: (context: VideoControlsContext) => ReactNode;
}

/**
 * Props shared by the horizontal and vertical video players.
 * Type: interface.
 * Extends the native `video` attributes, so `poster`, `preload`, `loop`, `autoPlay`, `muted`, `playsInline`,
 * `crossOrigin`, `width`, `height`, `aria-*`, `data-*`, and every media, mouse, keyboard, and focus handler
 * are forwarded to the `<video>` element. `className` styles the surrounding figure instead.
 * @param src - Single media URL.
 * @param sources - Encoded renditions rendered as `<source>` children; use instead of, or with, `src`.
 * @param tracks - Text tracks rendered as `<track>` children.
 * @param controls - Control surface: `custom` (default), `native`, or `none`.
 * @param label - Accessible name of the video; an explicit `aria-label` wins.
 * @param caption - Visible caption rendered under the frame as a `<figcaption>`.
 * @param aspectRatio - Frame ratio as a number or CSS value; each variant passes its own default.
 * @param labels - Overrides for the custom-control copy.
 * @param slots - Control-bar and above-controls slots for custom chrome.
 * @param className - Extra class names applied to the root figure.
 * @param ref - Ref forwarded to the `<video>` element.
 * @example
 * const props: VideoProps = { src: "/launch.mp4", label: "Launch film" };
 */
export interface VideoProps
    extends Omit<VideoHTMLAttributes<HTMLVideoElement>, "children" | "className" | "controls" | "src"> {
    src?: string;
    sources?: readonly VideoSource[];
    tracks?: readonly VideoTrack[];
    controls?: VideoControls;
    label?: string;
    caption?: ReactNode;
    aspectRatio?: number | string;
    labels?: Partial<VideoLabels>;
    slots?: VideoSlots;
    className?: string;
    ref?: Ref<HTMLVideoElement>;
}

/**
 * Internal props of the shared player.
 * Type: interface.
 * @param layout - Chrome arrangement selected by the public component.
 * @example
 * const props: VideoPlayerProps = { layout: "horizontal", src: "/launch.mp4" };
 */
export interface VideoPlayerProps extends VideoProps {
    layout: VideoLayout;
}

/**
 * Style object that carries the frame ratio next to native declarations.
 * Type: interface.
 * @param --video-aspect - Read by the stage as its `aspect-ratio`.
 * @example
 * const style: VideoStyle = { "--video-aspect": "1.777" };
 */
interface VideoStyle extends CSSProperties {
    "--video-aspect"?: string;
}

/**
 * Event type delivered to the composed media handlers.
 * Type: type alias.
 * Fields: none.
 * @example
 * const handler: ReactEventHandler<HTMLVideoElement> = (event) => event.currentTarget.pause();
 */
type VideoEvent = SyntheticEvent<HTMLVideoElement>;

/**
 * Copy used when the caller overrides nothing.
 * Type: constant.
 * Fields: play, pause, mute, unmute, seek, fullscreen, exitFullscreen, loading, error, retry, noSource.
 * @example
 * const play: string = DefaultVideoLabels.play;
 */
const DefaultVideoLabels: VideoLabels = {
    play: "Play video",
    pause: "Pause video",
    volume: "Volume",
    mute: "Mute",
    unmute: "Unmute",
    seek: "Seek",
    fullscreen: "Full screen",
    exitFullscreen: "Exit full screen",
    loading: "Loading video",
    error: "The video could not be loaded.",
    retry: "Retry",
    noSource: "No video source",
};

const emptySources: readonly VideoSource[] = [];
const emptyTracks: readonly VideoTrack[] = [];
const SecondsPerMinute: number = 60;
const SecondsPerHour: number = 3600;
const DigitPadBoundary: number = 10;
const SeekStep: number = 0.1;
const FullPercent: number = 100;
const VolumeTrackLength: number = 96;
const FlashDuration: number = 900;

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
 * Wraps an internal media handler and the caller's handler in one listener.
 * @param internal - Handler that updates component state.
 * @param external - Handler supplied by the caller through the native prop.
 * @example
 * onPlay={composeHandler(handlePlay, onPlay)}
 * @returns A handler that runs both, internal first.
 */
const composeHandler: (
    internal: ReactEventHandler<HTMLVideoElement>,
    external: ReactEventHandler<HTMLVideoElement> | undefined,
) => ReactEventHandler<HTMLVideoElement> = (
    internal: ReactEventHandler<HTMLVideoElement>,
    external: ReactEventHandler<HTMLVideoElement> | undefined,
): ReactEventHandler<HTMLVideoElement> => (event: VideoEvent): void => {
    internal(event);
    external?.(event);
};

/**
 * Renders the shared themed player behind both video variants.
 *
 * The frame, stage, chrome, buttons, and overlays are painted with the page's semantic surface and accent
 * roles, so the player follows the active preset exactly like the surrounding page. Seeking is delegated to
 * `SeekBar`, whose track, buffer, fill, and thumb use the same accent roles. Clicking the video area toggles
 * the chrome and flashes a centred play or pause affordance, `slots.controls` replaces the bottom bar, and
 * `slots.aboveControls` adds extra chrome directly above it.
 * Every native media attribute and event is preserved, and the component calls the caller's handler after its
 * own.
 * @param props - Layout, sources, tracks, control style, labels, slots, frame ratio, caption, class names, and
 * native video attributes or events.
 * @example
 * <VideoPlayer layout="horizontal" src="/launch.mp4" label="Launch film" />
 * @returns A figure containing the video, its chrome, and an optional caption.
 */
const VideoPlayer: FC<VideoPlayerProps> = ({
    layout,
    src,
    sources = emptySources,
    tracks = emptyTracks,
    controls = "custom",
    label,
    caption,
    aspectRatio,
    labels,
    slots,
    className = "",
    style,
    muted: mutedProp,
    playsInline = true,
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
    onError,
    "aria-label": ariaLabel,
    ref,
    ...rest
}: VideoPlayerProps) => {
    const mediaRef: RefObject<HTMLVideoElement | null> = useRef<HTMLVideoElement | null>(null);
    const mergedRef: RefCallback<HTMLVideoElement> = useMergedRef<HTMLVideoElement>(ref, mediaRef);
    const [playing, setPlaying]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [muted, setMuted]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(mutedProp === true);
    const [time, setTime]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
    const [buffered, setBuffered]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
    const [duration, setDuration]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
    const [buffering, setBuffering]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [failed, setFailed]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [expanded, setExpanded]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [canExpand, setCanExpand]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [volume, setVolume]: [number, Dispatch<SetStateAction<number>>] = useState<number>(1);
    const [volumeOpen, setVolumeOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [controlsVisible, setControlsVisible]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    const [flash, setFlash]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const flashTimer: RefObject<number | null> = useRef<number | null>(null);
    const volumePanelId: string = useId();

    const resolvedLabels: VideoLabels = {
        play: labels?.play ?? DefaultVideoLabels.play,
        pause: labels?.pause ?? DefaultVideoLabels.pause,
        volume: labels?.volume ?? DefaultVideoLabels.volume,
        mute: labels?.mute ?? DefaultVideoLabels.mute,
        unmute: labels?.unmute ?? DefaultVideoLabels.unmute,
        seek: labels?.seek ?? DefaultVideoLabels.seek,
        fullscreen: labels?.fullscreen ?? DefaultVideoLabels.fullscreen,
        exitFullscreen: labels?.exitFullscreen ?? DefaultVideoLabels.exitFullscreen,
        loading: labels?.loading ?? DefaultVideoLabels.loading,
        error: labels?.error ?? DefaultVideoLabels.error,
        retry: labels?.retry ?? DefaultVideoLabels.retry,
        noSource: labels?.noSource ?? DefaultVideoLabels.noSource,
    };

    const sourceNodes: ReactNode[] = sources.map(
        (source: VideoSource, index: number): ReactNode => (
            <source
                key={`${source.src}-${index}`}
                src={source.src}
                type={source.type}
                media={source.media}
            />
        ),
    );
    const trackNodes: ReactNode[] = tracks.map(
        (track: VideoTrack, index: number): ReactNode => (
            <track
                key={`${track.src}-${index}`}
                src={track.src}
                kind={track.kind}
                srcLang={track.srcLang}
                label={track.label}
                default={track.default}
            />
        ),
    );
    const hasSource: boolean = src !== (void 0) || sourceNodes.length > 0;
    const maxTime: number = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const ratio: string | undefined =
        aspectRatio === (void 0)
            ? (void 0)
            : typeof aspectRatio === "number"
              ? `${aspectRatio}`
              : aspectRatio;
    const stageStyle: VideoStyle = ratio === (void 0) ? {} : { "--video-aspect": ratio };
    const resolvedLabel: string | undefined =
        ariaLabel ?? (label !== (void 0) && label.length > 0 ? label : (void 0));
    const clock: string = `${formatTime(time)} / ${formatTime(maxTime)}`;

    useEffect((): void => {
        const node: HTMLVideoElement | null = mediaRef.current;

        setCanExpand(node !== null && typeof node.requestFullscreen === "function");
    }, []);

    useEffect((): void => {
        const node: HTMLVideoElement | null = mediaRef.current;

        if (node === null) {
            return;
        }

        node.muted = mutedProp === true;
        setMuted(mutedProp === true);
    }, [mutedProp]);

    useEffect((): (() => void) | void => {
        if (typeof document === "undefined") {
            return;
        }

        const handleChange: () => void = (): void => {
            setExpanded(document.fullscreenElement === mediaRef.current);
        };

        document.addEventListener("fullscreenchange", handleChange);

        return (): void => {
            document.removeEventListener("fullscreenchange", handleChange);
        };
    }, []);

    useEffect((): (() => void) => {
        return (): void => {
            if (flashTimer.current !== null) {
                window.clearTimeout(flashTimer.current);
            }
        };
    }, []);

    const setDurationFrom: (node: HTMLVideoElement) => void = (node: HTMLVideoElement): void => {
        setDuration(Number.isFinite(node.duration) ? node.duration : 0);
    };

    const togglePlayback: () => void = (): void => {
        const node: HTMLVideoElement | null = mediaRef.current;

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
        const node: HTMLVideoElement | null = mediaRef.current;

        if (node === null) {
            return;
        }

        node.muted = !node.muted;
        setMuted(node.muted);
    };

    const toggleExpanded: () => void = (): void => {
        const node: HTMLVideoElement | null = mediaRef.current;

        if (node === null) {
            return;
        }

        if (typeof document !== "undefined" && document.fullscreenElement === node) {
            void document.exitFullscreen();

            return;
        }

        void node.requestFullscreen();
    };

    const handleRetry: () => void = (): void => {
        const node: HTMLVideoElement | null = mediaRef.current;

        setFailed(false);
        node?.load();
    };

    const handleRetryClick: MouseEventHandler<HTMLButtonElement> = (
        event: ReactMouseEvent<HTMLButtonElement>,
    ): void => {
        event.stopPropagation();
        handleRetry();
    };

    /** Applies an absolute volume between 0 and 1 and mutes at zero. */
    const applyVolume: (level: number) => void = (level: number): void => {
        const node: HTMLVideoElement | null = mediaRef.current;
        const next: number = Math.min(1, Math.max(0, level));

        if (node !== null) {
            node.volume = next;
            node.muted = next === 0;
        }

        setVolume(next);
        setMuted(next === 0);
    };

    const handleVolume: (percent: number) => void = (percent: number): void => {
        applyVolume(percent / FullPercent);
    };

    const toggleVolume: () => void = (): void => {
        setVolumeOpen((open: boolean): boolean => !open);
    };

    const toggleControls: () => void = (): void => {
        const next: boolean = !controlsVisible;

        setControlsVisible(next);

        if (!next) {
            setVolumeOpen(false);
        }
    };

    const flashPlayPause: () => void = (): void => {
        setFlash(true);

        if (flashTimer.current !== null) {
            window.clearTimeout(flashTimer.current);
        }

        flashTimer.current = window.setTimeout((): void => {
            flashTimer.current = null;
            setFlash(false);
        }, FlashDuration);
    };

    const handleStageClick: () => void = (): void => {
        if (!showCustomControls || !hasSource) {
            return;
        }

        setVolumeOpen(false);
        toggleControls();
        flashPlayPause();
    };

    const handleStageKeyDown: KeyboardEventHandler<HTMLDivElement> = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        if (event.target !== event.currentTarget) {
            return;
        }

        if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") {
            return;
        }

        event.preventDefault();
        handleStageClick();
    };

    const handleCentredPlay: MouseEventHandler<HTMLButtonElement> = (
        event: ReactMouseEvent<HTMLButtonElement>,
    ): void => {
        event.stopPropagation();
        togglePlayback();
        setFlash(false);

        if (flashTimer.current !== null) {
            window.clearTimeout(flashTimer.current);
            flashTimer.current = null;
        }
    };

    const stopClick: MouseEventHandler<HTMLElement> = (event: ReactMouseEvent<HTMLElement>): void => {
        event.stopPropagation();
    };

    const handleSeek: (next: number) => void = (next: number): void => {
        const node: HTMLVideoElement | null = mediaRef.current;

        setTime(next);

        if (node !== null) {
            node.currentTime = next;
        }
    };

    const handlePlay: ReactEventHandler<HTMLVideoElement> = (): void => {
        setPlaying(true);
        setBuffering(false);
    };

    const handlePause: ReactEventHandler<HTMLVideoElement> = (): void => {
        setPlaying(false);
    };

    const handleEnded: ReactEventHandler<HTMLVideoElement> = (): void => {
        setPlaying(false);
    };

    const handleTimeUpdate: ReactEventHandler<HTMLVideoElement> = (event: VideoEvent): void => {
        setTime(event.currentTarget.currentTime);
    };

    const handleDurationChange: ReactEventHandler<HTMLVideoElement> = (event: VideoEvent): void => {
        setDurationFrom(event.currentTarget);
    };

    const handleLoadedMetadata: ReactEventHandler<HTMLVideoElement> = (event: VideoEvent): void => {
        setDurationFrom(event.currentTarget);
    };

    const handleVolumeChange: ReactEventHandler<HTMLVideoElement> = (event: VideoEvent): void => {
        setMuted(event.currentTarget.muted);
        setVolume(event.currentTarget.volume);
    };

    const handleProgress: ReactEventHandler<HTMLVideoElement> = (event: VideoEvent): void => {
        const ranges: TimeRanges = event.currentTarget.buffered;

        setBuffered(ranges.length === 0 ? 0 : ranges.end(ranges.length - 1));
    };

    const handleWaiting: ReactEventHandler<HTMLVideoElement> = (): void => {
        setBuffering(true);
    };

    const handleStalled: ReactEventHandler<HTMLVideoElement> = (): void => {
        setBuffering(true);
    };

    const handleCanPlay: ReactEventHandler<HTMLVideoElement> = (): void => {
        setBuffering(false);
    };

    const handlePlaying: ReactEventHandler<HTMLVideoElement> = (): void => {
        setPlaying(true);
        setBuffering(false);
    };

    const handleError: ReactEventHandler<HTMLVideoElement> = (): void => {
        setFailed(true);
        setBuffering(false);
        setPlaying(false);
    };

    const showCustomControls: boolean = controls === "custom";
    const ripple: RippleHandlers = useRipple({ trigger: "both" });
    const playButton: ReactNode = (
        <button
            type="button"
            className="video__button"
            aria-label={playing ? resolvedLabels.pause : resolvedLabels.play}
            onClick={togglePlayback}
            onPointerDown={ripple.onPointerDown}
            onPointerEnter={ripple.onPointerEnter}
            onKeyDown={ripple.onKeyDown}
        >
            <Icon name={playing ? "Pause" : "Play"} size={18} />
        </button>
    );
    const muteButton: ReactNode = (
        <button
            type="button"
            className="video__button"
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
            className="video__button"
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
    const expandButton: ReactNode = canExpand ? (
        <button
            type="button"
            className="video__button"
            aria-label={expanded ? resolvedLabels.exitFullscreen : resolvedLabels.fullscreen}
            onClick={toggleExpanded}
            onPointerDown={ripple.onPointerDown}
            onPointerEnter={ripple.onPointerEnter}
            onKeyDown={ripple.onKeyDown}
        >
            <Icon name={expanded ? "Collapse" : "Expand"} size={18} />
        </button>
    ) : null;
    const seekbar: ReactNode = (
        <SeekBar
            className="video__seekbar"
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
        <div className="video__volume" id={volumePanelId}>
            <SeekBar
                className="video__volume-bar"
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
    const volumeControls: ReactNode = (
        <span className="video__volume-control" onClick={stopClick}>
            {muteButton}
            {volumeButton}
            {volumePanel}
        </span>
    );
    const controlsContext: VideoControlsContext = {
        playing,
        muted,
        volume,
        currentTime: time,
        duration: maxTime,
        buffered,
        fullscreen: expanded,
        canFullscreen: canExpand,
        labels: resolvedLabels,
        togglePlayback,
        seek: handleSeek,
        setVolume: applyVolume,
        toggleMute: toggleMuted,
        toggleFullscreen: toggleExpanded,
        toggleControls,
        toggleVolume,
    };
    const renderControls: ((context: VideoControlsContext) => ReactNode) | undefined = slots?.controls;
    const renderAboveControls: ((context: VideoControlsContext) => ReactNode) | undefined =
        slots?.aboveControls;
    const defaultBar: ReactNode =
        layout === "vertical" ? (
            <div className="video__controls video__controls--slim" onClick={stopClick}>
                {seekbar}
            </div>
        ) : (
            <div className="video__controls" onClick={stopClick}>
                {playButton}
                {seekbar}
                <span className="video__time" aria-hidden="true">
                    {clock}
                </span>
                {volumeControls}
                {expandButton}
            </div>
        );
    let bar: ReactNode = defaultBar;

    if (renderControls !== (void 0)) {
        // The slot is a render prop: it only builds elements here, and the actions it receives mutate
        // the media element from event handlers, never while rendering.
        // eslint-disable-next-line react-hooks/refs
        const slotContent: ReactNode = renderControls(controlsContext);

        bar = (
            <div className="video__slot" onClick={stopClick}>
                {slotContent}
            </div>
        );
    }
    const actions: ReactNode =
        layout === "vertical" ? (
            <div className="video__actions" onClick={stopClick}>
                {playButton}
                {volumeControls}
                {expandButton}
            </div>
        ) : null;
    let aboveControls: ReactNode = null;

    if (controlsVisible && renderAboveControls !== (void 0)) {
        // The slot is a render prop: it only builds elements here, and the actions it receives mutate
        // the media element from event handlers, never while rendering.
        // eslint-disable-next-line react-hooks/refs
        const slotContent: ReactNode = renderAboveControls(controlsContext);

        aboveControls = (
            <div className="video__above-controls" onClick={stopClick}>
                {slotContent}
            </div>
        );
    }
    const badge: ReactNode =
        layout === "vertical" ? (
            <span className="video__badge" aria-hidden="true">
                {clock}
            </span>
        ) : null;
    const centredPlay: ReactNode =
        showCustomControls && hasSource && !failed && !buffering && (!playing || flash) ? (
            <button
                type="button"
                className="video__play"
                aria-label={playing ? resolvedLabels.pause : resolvedLabels.play}
                onClick={handleCentredPlay}
                onPointerDown={ripple.onPointerDown}
                onPointerEnter={ripple.onPointerEnter}
                onKeyDown={ripple.onKeyDown}
            >
                <Icon name={playing ? "Pause" : "Play"} size={26} />
            </button>
        ) : null;
    const chrome: ReactNode = !showCustomControls || !hasSource ? null : (
        <>
            {controlsVisible ? badge : null}
            {controlsVisible ? actions : null}
            {aboveControls}
            {controlsVisible ? bar : null}
        </>
    );

    return (
        <figure
            className={cx("video", className)}
            data-controls={controls}
            data-layout={layout}
            data-controls-visible={controlsVisible ? "true" : "false"}
        >
            <div
                className="video__stage"
                style={stageStyle}
                role={showCustomControls ? "group" : (void 0)}
                aria-label={showCustomControls ? resolvedLabel : (void 0)}
                tabIndex={showCustomControls && hasSource ? 0 : (void 0)}
                onClick={showCustomControls && hasSource ? handleStageClick : (void 0)}
                onKeyDown={showCustomControls && hasSource ? handleStageKeyDown : (void 0)}
            >
                <video
                    {...rest}
                    ref={mergedRef}
                    className="video__media"
                    src={src}
                    controls={controls === "native"}
                    muted={muted}
                    playsInline={playsInline}
                    preload={preload}
                    style={style}
                    aria-label={resolvedLabel}
                    onPlay={composeHandler(handlePlay, onPlay)}
                    onPause={composeHandler(handlePause, onPause)}
                    onEnded={composeHandler(handleEnded, onEnded)}
                    onTimeUpdate={composeHandler(handleTimeUpdate, onTimeUpdate)}
                    onDurationChange={composeHandler(handleDurationChange, onDurationChange)}
                    onLoadedMetadata={composeHandler(handleLoadedMetadata, onLoadedMetadata)}
                    onVolumeChange={composeHandler(handleVolumeChange, onVolumeChange)}
                    onWaiting={composeHandler(handleWaiting, onWaiting)}
                    onStalled={composeHandler(handleStalled, onStalled)}
                    onCanPlay={composeHandler(handleCanPlay, onCanPlay)}
                    onPlaying={composeHandler(handlePlaying, onPlaying)}
                    onProgress={composeHandler(handleProgress, onProgress)}
                    onError={composeHandler(handleError, onError)}
                >
                    {sourceNodes}
                    {trackNodes}
                </video>

                {buffering && !failed && hasSource ? (
                    <div className="video__status video__status--busy">
                        <span className="video__spinner">
                            <Spinner size="sm" label={resolvedLabels.loading} />
                        </span>
                    </div>
                ) : null}

                {failed ? (
                    <div className="video__status video__status--error" role="alert">
                        <Icon name="Warning" size={20} />
                        <span className="video__message">{resolvedLabels.error}</span>
                        <button
                            type="button"
                            className="video__retry"
                            onClick={handleRetryClick}
                            onPointerDown={ripple.onPointerDown}
                            onPointerEnter={ripple.onPointerEnter}
                            onKeyDown={ripple.onKeyDown}
                        >
                            <span className="video__retry-label">{resolvedLabels.retry}</span>
                        </button>
                    </div>
                ) : null}

                {!hasSource && !failed ? (
                    <div className="video__status video__status--empty">
                        <Icon name="Film" size={22} />
                        <span className="video__message">{resolvedLabels.noSource}</span>
                    </div>
                ) : null}

                {centredPlay}
                {chrome}
            </div>

            {caption === (void 0) || caption === null || caption === false || caption === "" ? null : (
                <figcaption className="video__caption">{caption}</figcaption>
            )}
        </figure>
    );
};

export default VideoPlayer;
