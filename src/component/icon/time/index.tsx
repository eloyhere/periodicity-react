import { createIcon, type Icon } from "../types";

export type TimeIconName =
    | "Clock"
    | "Alarm"
    | "Timer"
    | "Hourglass"
    | "History"
    | "Schedule"
    | "TimeZone"
    | "Stopwatch"
    | "Countdown";

export const timeIcons: Record<TimeIconName, Icon> = {
    Clock: createIcon(
        "Clock",
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.2v5.3l3.4 2" />
        </>,
    ),
    Alarm: createIcon(
        "Alarm",
        <>
            <circle cx="12" cy="13.2" r="6.7" />
            <path d="M12 9.6v4l2.6 1.6" />
            <path d="M5.2 4.5 3.4 6.3M18.8 4.5l1.8 1.8" />
            <path d="M6 19.4 4.6 20.9M18 19.4l1.4 1.5" />
        </>,
    ),
    Timer: createIcon(
        "Timer",
        <>
            <rect x="4" y="6.5" width="16" height="14.5" rx="4" />
            <path d="M12 10.5v4l2.4 1.4" />
            <path d="M9.5 3h5" />
            <path d="M12 3v3.5" />
        </>,
    ),
    Hourglass: createIcon(
        "Hourglass",
        <>
            <path d="M7 3h10M7 21h10" />
            <path d="M8 3v3.4c0 2 4 3.4 4 5.6s-4 3.6-4 5.6V21" />
            <path d="M16 3v3.4c0 2-4 3.4-4 5.6s4 3.6 4 5.6V21" />
        </>,
    ),
    History: createIcon(
        "History",
        <>
            <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
            <path d="M3.5 4.2v4h4" />
            <path d="M12 7.6V12l3 1.8" />
        </>,
    ),
    Schedule: createIcon(
        "Schedule",
        <>
            <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
            <path d="M8 2.5v4M16 2.5v4M3.5 9.5h17" />
            <path d="M12 12.8v2.7l2 1.2" />
        </>,
    ),
    TimeZone: createIcon(
        "TimeZone",
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M3.5 12h17" />
            <path d="M12 3.5c2.3 2.3 3.5 5.3 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.3-3.5-8.5S9.7 5.8 12 3.5Z" />
        </>,
    ),
    Stopwatch: createIcon(
        "Stopwatch",
        <>
            <circle cx="12" cy="13.5" r="6.8" />
            <path d="M12 10v3.7l2.4 1.4" />
            <path d="M9.5 2.5h5" />
            <path d="M12 2.5v3.4" />
            <path d="m18.4 7.6 1.5-1.5" />
        </>,
    ),
    Countdown: createIcon(
        "Countdown",
        <>
            <circle cx="12" cy="11" r="7" />
            <path d="M12 7.6v3.5l2.4 1.4" />
            <path d="M12 18.5v3M9.7 19.5 12 21.8l2.3-2.3" />
        </>,
    ),
};
