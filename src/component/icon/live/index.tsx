import { createIcon, type Icon } from "../types";

/**
 * Animated live-status icon names.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: LiveIconName = "Live";
 */
export type LiveIconName =
    | "Live"
    | "Broadcast"
    | "Signal"
    | "Heartbeat"
    | "Waveform"
    | "Connecting"
    | "Recording"
    | "Ping";

export const liveIcons: Record<LiveIconName, Icon> = {
    Live: createIcon(
        "Live",
        <>
            <circle className="icon-live__ring icon-live__ring--1" cx="12" cy="12" r="5" />
            <circle className="icon-live__ring icon-live__ring--2" cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        </>,
    ),
    Broadcast: createIcon(
        "Broadcast",
        <>
            <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
            <path
                className="icon-live__broadcast icon-live__broadcast--1"
                d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7"
            />
            <path
                className="icon-live__broadcast icon-live__broadcast--2"
                d="M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13"
            />
        </>,
    ),
    Signal: createIcon(
        "Signal",
        <>
            <path className="icon-live__signal icon-live__signal--1" d="M5 15v2" />
            <path className="icon-live__signal icon-live__signal--2" d="M9.5 12v5" />
            <path className="icon-live__signal icon-live__signal--3" d="M14.5 9v8" />
            <path className="icon-live__signal icon-live__signal--4" d="M19 5v12" />
        </>,
    ),
    Heartbeat: createIcon(
        "Heartbeat",
        <path
            className="icon-live__heartbeat"
            d="M2.5 12h4L9 6l4 12 3.5-9 2 3H21.5"
            pathLength={100}
        />,
    ),
    Waveform: createIcon(
        "Waveform",
        <>
            <path className="icon-live__wave icon-live__wave--1" d="M4 10v4" />
            <path className="icon-live__wave icon-live__wave--2" d="M8 7v10" />
            <path className="icon-live__wave icon-live__wave--3" d="M12 4v16" />
            <path className="icon-live__wave icon-live__wave--4" d="M16 7v10" />
            <path className="icon-live__wave icon-live__wave--5" d="M20 10v4" />
        </>,
    ),
    Connecting: createIcon(
        "Connecting",
        <>
            <circle cx="5" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
            <path className="icon-live__connecting" d="M8 12h8" />
        </>,
    ),
    Recording: createIcon(
        "Recording",
        <>
            <circle className="icon-live__recording-ring" cx="12" cy="12" r="8.5" />
            <circle
                className="icon-live__recording-dot"
                cx="12"
                cy="12"
                r="3"
                fill="currentColor"
                stroke="none"
            />
        </>,
    ),
    Ping: createIcon(
        "Ping",
        <>
            <circle className="icon-live__ping icon-live__ping--1" cx="12" cy="12" r="3" />
            <circle className="icon-live__ping icon-live__ping--2" cx="12" cy="12" r="6" />
            <circle className="icon-live__ping icon-live__ping--3" cx="12" cy="12" r="9" />
        </>,
    ),
};
