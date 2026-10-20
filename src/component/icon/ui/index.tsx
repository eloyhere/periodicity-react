import { createIcon, type Icon } from "../types";

export type UiIconName =
    | "Search"
    | "Filter"
    | "Sort"
    | "Grid"
    | "List"
    | "Expand"
    | "Collapse"
    | "Drag"
    | "Pin"
    | "Help"
    | "Info"
    | "Error"
    | "Success"
    | "Loading"
    | "Dots";

export const uiIcons: Record<UiIconName, Icon> = {
    Search: createIcon(
        "Search",
        <>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
        </>,
    ),
    Filter: createIcon(
        "Filter",
        <>
            <path d="M3.5 5h17l-6.5 7.5V20l-4 2v-9.5L3.5 5Z" />
        </>,
    ),
    Sort: createIcon(
        "Sort",
        <>
            <path d="M3.5 6h8M3.5 12h5.5M3.5 18h3" />
            <path d="M18 20V4M14.5 7.5 18 4l3.5 3.5" />
        </>,
    ),
    Grid: createIcon(
        "Grid",
        <>
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </>,
    ),
    List: createIcon(
        "List",
        <>
            <path d="M9 6h11M9 12h11M9 18h11" />
            <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
            <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
        </>,
    ),
    Expand: createIcon(
        "Expand",
        <>
            <path d="M14 4h6v6M20 4l-6 6" />
            <path d="M10 4H4v6M4 4l6 6" />
            <path d="M14 20h6v-6M20 20l-6-6" />
            <path d="M10 20H4v-6M4 20l6-6" />
        </>,
    ),
    Collapse: createIcon(
        "Collapse",
        <>
            <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
        </>,
    ),
    Drag: createIcon(
        "Drag",
        <>
            <circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none" />
        </>,
    ),
    Pin: createIcon(
        "Pin",
        <>
            <path d="M9 3.5h6M10 3.5v5.2L7 12v2h10v-2l-3-3.3V3.5" />
            <path d="M12 14v6.5" />
        </>,
    ),
    Help: createIcon(
        "Help",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.2 9.2a3.1 3.1 0 0 1 6 1.1c0 2.1-3 2.6-3 4.5" />
            <circle cx="12.2" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    Info: createIcon(
        "Info",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5.5" />
            <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    Error: createIcon(
        "Error",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
        </>,
    ),
    Success: createIcon(
        "Success",
        <>
            <circle cx="12" cy="12" r="9" />
            <polyline points="7.5 12.5 10.5 15.5 16.5 9" />
        </>,
    ),
    Loading: createIcon(
        "Loading",
        <>
            <path d="M21 12a9 9 0 1 1-6.2-8.6" />
        </>,
    ),
    Dots: createIcon(
        "Dots",
        <>
            <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </>,
    ),
};
