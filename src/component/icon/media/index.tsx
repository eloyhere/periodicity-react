import { createIcon, type Icon } from "../types";

export type MediaIconName =
    | "Play"
    | "Pause"
    | "Stop"
    | "Next"
    | "Previous"
    | "Volume"
    | "Mute"
    | "Music"
    | "Mic"
    | "Headphones"
    | "Podcast"
    | "Radio"
    | "Film"
    | "Photo"
    | "Gallery";

export const mediaIcons: Record<MediaIconName, Icon> = {
    Play: createIcon("Play", <path d="M8 5.5 19 12 8 18.5v-13Z" />),
    Pause: createIcon(
        "Pause",
        <>
            <rect x="7" y="5" width="3.5" height="14" rx="1" />
            <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
        </>,
    ),
    Stop: createIcon("Stop", <rect x="6" y="6" width="12" height="12" rx="2.5" />),
    Next: createIcon(
        "Next",
        <>
            <path d="M6 5.5 14 12 6 18.5v-13Z" />
            <line x1="18" x2="18" y1="5" y2="19" />
        </>,
    ),
    Previous: createIcon(
        "Previous",
        <>
            <path d="M18 5.5 10 12l8 6.5v-13Z" />
            <line x1="6" x2="6" y1="5" y2="19" />
        </>,
    ),
    Volume: createIcon(
        "Volume",
        <>
            <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
            <path d="M15 9.5a3.5 3.5 0 0 1 0 5" />
            <path d="M17.5 7a7 7 0 0 1 0 10" />
        </>,
    ),
    Mute: createIcon(
        "Mute",
        <>
            <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
            <line x1="16" x2="21" y1="9" y2="15" />
            <line x1="21" x2="16" y1="9" y2="15" />
        </>,
    ),
    Music: createIcon(
        "Music",
        <>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </>,
    ),
    Mic: createIcon(
        "Mic",
        <>
            <rect x="9" y="2.5" width="6" height="12" rx="3" />
            <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
            <line x1="12" x2="12" y1="18" y2="21" />
            <line x1="8.5" x2="15.5" y1="21" y2="21" />
        </>,
    ),
    Headphones: createIcon(
        "Headphones",
        <>
            <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
            <rect x="3" y="14" width="4" height="6" rx="2" />
            <rect x="17" y="14" width="4" height="6" rx="2" />
        </>,
    ),
    Podcast: createIcon(
        "Podcast",
        <>
            <circle cx="12" cy="12" r="2" />
            <path d="M8.5 15.5a5 5 0 0 1 0-7" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M5.5 18.5a10 10 0 0 1 0-13" />
            <path d="M18.5 5.5a10 10 0 0 1 0 13" />
        </>,
    ),
    Radio: createIcon(
        "Radio",
        <>
            <rect x="3" y="8" width="18" height="12" rx="2.5" />
            <path d="m7 8 10-4.5" />
            <circle cx="8" cy="14" r="2" />
            <path d="M14 12.5h4M14 15.5h4" />
        </>,
    ),
    Film: createIcon(
        "Film",
        <>
            <rect x="3" y="4" width="18" height="16" rx="2.5" />
            <path d="M7.5 4v16M16.5 4v16" />
            <path d="M3 8h4.5M3 12h4.5M3 16h4.5M16.5 8H21M16.5 12H21M16.5 16H21" />
        </>,
    ),
    Photo: createIcon(
        "Photo",
        <>
            <rect x="3" y="4" width="18" height="16" rx="2.5" />
            <circle cx="8.5" cy="9" r="1.5" />
            <path d="m4 18 5.5-5.5 3 3L16 12l4.5 4.5" />
        </>,
    ),
    Gallery: createIcon(
        "Gallery",
        <>
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
        </>,
    ),
};
