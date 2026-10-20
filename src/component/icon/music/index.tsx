import { createIcon, type Icon } from "../types";

export type MusicIconName =
    | "Note"
    | "Vinyl"
    | "Drum"
    | "Piano"
    | "Guitar"
    | "Saxophone"
    | "TuningFork"
    | "Playlist"
    | "Beat";

export const musicIcons: Record<MusicIconName, Icon> = {
    Note: createIcon(
        "Note",
        <>
            <path d="M10.5 17.5V4.2" />
            <path d="M10.5 4.2c2.9.2 4.9 2 5.2 4.7" />
            <circle cx="8.2" cy="17.8" r="2.3" />
        </>,
    ),
    Vinyl: createIcon(
        "Vinyl",
        <>
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="12" r="2.2" />
            <circle cx="12" cy="12" r="0.55" fill="currentColor" stroke="none" />
            <path d="M6.3 11.2a6 6 0 0 1 1.9-3.9" />
            <path d="M17.7 12.8a6 6 0 0 1-1.9 3.9" />
        </>,
    ),
    Drum: createIcon(
        "Drum",
        <>
            <path d="M3.5 8.5a8.5 3.5 0 0 1 17 0a8.5 3.5 0 0 1 -17 0Z" />
            <path d="M3.5 8.5v7c0 2 3.8 3.5 8.5 3.5s8.5-1.5 8.5-3.5v-7" />
            <path d="M8 11.5v7M16 11.5v7" />
            <path d="M12.5 9 20.5 3" />
        </>,
    ),
    Piano: createIcon(
        "Piano",
        <>
            <rect x="2.5" y="6" width="19" height="12" rx="1.5" />
            <path d="M7.5 6v12M12 6v12M16.5 6v12" />
            <rect x="8.9" y="6" width="2.2" height="6" rx="0.3" fill="currentColor" stroke="none" />
            <rect
                x="13.4"
                y="6"
                width="2.2"
                height="6"
                rx="0.3"
                fill="currentColor"
                stroke="none"
            />
            <rect
                x="17.9"
                y="6"
                width="2.2"
                height="6"
                rx="0.3"
                fill="currentColor"
                stroke="none"
            />
        </>,
    ),
    Guitar: createIcon(
        "Guitar",
        <>
            <path d="M8.4 18.2c0 2.3 1.6 4.1 3.6 4.1s3.6-1.8 3.6-4.1c0-1.5-.9-2.7-2.2-3.3.9-.7 1.5-1.8 1.5-3 0-2-1.3-3.6-2.9-3.6s-2.9 1.6-2.9 3.6c0 1.2.6 2.3 1.5 3-1.3.6-2.2 1.8-2.2 3.3Z" />
            <path d="M10.7 8.8V3h2.6v5.8" />
            <rect x="10.3" y="1.2" width="3.4" height="1.8" rx="0.4" />
            <path d="M10.3 2.1H8.6M13.7 2.1h1.7" />
            <circle cx="12" cy="16.4" r="1.6" />
            <path d="M9.6 19.9h4.8" />
        </>,
    ),
    Saxophone: createIcon(
        "Saxophone",
        <>
            <path d="M4 2a1 1 0 0 0-1 1a1 1 0 0 0 1 1a3 3 0 0 1 3 3v8.5c0 3.6 2.9 6.5 6.5 6.5s6.5-2.9 6.5-6.5V13a1 1 0 0 0 1-1a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1a1 1 0 0 0 1 1v2a1 1 0 0 1-1 1a1 1 0 0 1-1-1v-4a1 1 0 0 0 1-1a1 1 0 0 0-1-1V8a1 1 0 0 0 1-1a1 1 0 0 0-1-1v-.5A3.5 3.5 0 0 0 8.5 2z" />
        </>,
    ),
    TuningFork: createIcon(
        "TuningFork",
        <>
            <path d="M6.5 2.5v7.5a5.5 5.5 0 0 0 11 0V2.5" />
            <path d="M12 15.5v6" />
            <path d="M9.5 21.5h5" />
        </>,
    ),
    Playlist: createIcon(
        "Playlist",
        <>
            <path d="M3 6.5h10M3 11h10M3 15.5h6" />
            <path d="M17 20V6.5h4" />
            <circle cx="14.5" cy="20" r="2.5" />
        </>,
    ),
    Beat: createIcon(
        "Beat",
        <>
            <path d="M3 10.5v3M6.5 7.5v9M10 4v16M13.5 8.5v7M17 6v12M20.5 10.5v3" />
        </>,
    ),
};
