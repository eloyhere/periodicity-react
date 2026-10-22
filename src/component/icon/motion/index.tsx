import { createIcon, type Icon } from "../types";

/**
 * Animated icon names used for loading and activity feedback.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: MotionIconName = "Spinner";
 */
export type MotionIconName =
    | "Spinner"
    | "LoadingDots"
    | "Pulse"
    | "Orbit"
    | "Bars"
    | "Wave"
    | "Radar"
    | "Breathe"
    | "Sync"
    | "BellRing";

export const motionIcons: Record<MotionIconName, Icon> = {
    Spinner: createIcon(
        "Spinner",
        <>
            <circle className="icon-motion-spinner__track" cx="12" cy="12" r="9" opacity="0.24" />
            <circle className="icon-motion-spinner__arc" cx="12" cy="12" r="9" pathLength={100} />
        </>,
        24,
    ),
    LoadingDots: createIcon(
        "LoadingDots",
        <>
            <circle
                className="icon-motion-dot icon-motion-dot--1"
                cx="6"
                cy="12"
                r="1.6"
                fill="currentColor"
                stroke="none"
            />
            <circle
                className="icon-motion-dot icon-motion-dot--2"
                cx="12"
                cy="12"
                r="1.6"
                fill="currentColor"
                stroke="none"
            />
            <circle
                className="icon-motion-dot icon-motion-dot--3"
                cx="18"
                cy="12"
                r="1.6"
                fill="currentColor"
                stroke="none"
            />
        </>,
        24,
    ),
    Pulse: createIcon(
        "Pulse",
        <path
            className="icon-motion-pulse__line"
            d="M2.5 12h4l2.2-5.5 4.1 11 2.9-7.2 1.8 1.7h4"
            pathLength={100}
        />,
        24,
    ),
    Orbit: createIcon(
        "Orbit",
        <>
            <circle className="icon-motion-orbit__track" cx="12" cy="12" r="8" opacity="0.24" />
            <circle
                className="icon-motion-orbit__dot"
                cx="12"
                cy="4"
                r="1.8"
                fill="currentColor"
                stroke="none"
            />
        </>,
        24,
    ),
    Bars: createIcon(
        "Bars",
        <>
            <path className="icon-motion-bars__bar icon-motion-bars__bar--1" d="M6 19v-6" />
            <path className="icon-motion-bars__bar icon-motion-bars__bar--2" d="M12 19V5" />
            <path className="icon-motion-bars__bar icon-motion-bars__bar--3" d="M18 19v-8" />
        </>,
        24,
    ),
    Wave: createIcon(
        "Wave",
        <path
            className="icon-motion-wave__line"
            d="M2 12c2.5-6 5-6 7.5 0s5 6 7.5 0 3-3 5-1"
            pathLength={100}
        />,
        24,
    ),
    Radar: createIcon(
        "Radar",
        <>
            <circle className="icon-motion-radar__track" cx="12" cy="12" r="9" opacity="0.24" />
            <path className="icon-motion-radar__sweep" d="M12 12V3" />
            <circle
                className="icon-motion-radar__dot"
                cx="12"
                cy="4.5"
                r="1.4"
                fill="currentColor"
                stroke="none"
            />
        </>,
        24,
    ),
    Breathe: createIcon(
        "Breathe",
        <>
            <circle
                className="icon-motion-breathe__ring icon-motion-breathe__ring--outer"
                cx="12"
                cy="12"
                r="9"
            />
            <circle
                className="icon-motion-breathe__ring icon-motion-breathe__ring--inner"
                cx="12"
                cy="12"
                r="5"
            />
        </>,
        24,
    ),
    Sync: createIcon(
        "Sync",
        <path
            className="icon-motion-sync__arrows"
            d="M20 12a8 8 0 0 1-13.4 5.9M4 12a8 8 0 0 1 13.4-5.9M17 3.5v4h-4M7 20.5v-4h4"
        />,
        24,
    ),
    BellRing: createIcon(
        "BellRing",
        <>
            <path
                className="icon-motion-bell__body"
                d="M6 16h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v3.5L6 16Z"
            />
            <path className="icon-motion-bell__clapper" d="M10 19a2 2 0 0 0 4 0" />
        </>,
        24,
    ),
};
