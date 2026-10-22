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
        <path d="M10 13v4m4-4v4m4-4v4M2 13h20m0-1.5A3.5 3.5 0 0 0 18.5 8a3.52 3.52 0 0 1-3.173-2A7 7 0 0 0 2 9v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2zM6 13v4" />,
    ),
    Guitar: createIcon(
        "Guitar",
        <path d="m11.9 12.1l4.514-4.514M20.1 2.3a1 1 0 0 0-1.4 0l-1.114 1.114A2 2 0 0 0 17 4.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 17.828 7h1.344a2 2 0 0 0 1.414-.586L21.7 5.3a1 1 0 0 0 0-1.4zM6 16l2 2m.23-8.15A3 3 0 0 1 11 8a5 5 0 0 1 5 5a3 3 0 0 1-1.85 2.77l-.92.38A2 2 0 0 0 12 18a4 4 0 0 1-4 4a6 6 0 0 1-6-6a4 4 0 0 1 4-4a2 2 0 0 0 1.85-1.23z" />,
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
