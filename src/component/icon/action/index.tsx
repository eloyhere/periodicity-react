import { createIcon, type Icon } from "../types";

export type ActionIconName =
    | "Menu"
    | "ArrowRight"
    | "ArrowLeft"
    | "ArrowDown"
    | "ArrowTop"
    | "ArrowUpRight"
    | "ChevronDown"
    | "ChevronUp"
    | "ChevronLeft"
    | "ChevronRight"
    | "Refresh"
    | "RotateLeft"
    | "RotateRight"
    | "Close"
    | "Open"
    | "More"
    | "Plus"
    | "Subtract"
    | "Check"
    | "Select"
    | "Confirm"
    | "Cancel"
    | "View";

export const actionIcons: Record<ActionIconName, Icon> = {
    Menu: createIcon(
        "Menu",
        <>
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
        </>,
    ),
    ArrowRight: createIcon(
        "ArrowRight",
        <>
            <line x1="4" y1="12" x2="19.5" y2="12" />
            <polyline points="13.5 6 19.5 12 13.5 18" />
        </>,
    ),
    ArrowLeft: createIcon(
        "ArrowLeft",
        <>
            <line x1="20" y1="12" x2="4.5" y2="12" />
            <polyline points="10.5 6 4.5 12 10.5 18" />
        </>,
    ),
    ArrowDown: createIcon(
        "ArrowDown",
        <>
            <line x1="12" y1="4" x2="12" y2="19.5" />
            <polyline points="6 13.5 12 19.5 18 13.5" />
        </>,
    ),
    ArrowTop: createIcon(
        "ArrowTop",
        <>
            <line x1="12" y1="20" x2="12" y2="4.5" />
            <polyline points="6 10.5 12 4.5 18 10.5" />
        </>,
    ),
    ArrowUpRight: createIcon(
        "ArrowUpRight",
        <>
            <line x1="5" y1="19" x2="19" y2="5" />
            <polyline points="9 5 19 5 19 15" />
        </>,
    ),
    ChevronDown: createIcon(
        "ChevronDown",
        <>
            <polyline points="6 9 12 15 18 9" />
        </>,
    ),
    ChevronUp: createIcon(
        "ChevronUp",
        <>
            <polyline points="6 15 12 9 18 15" />
        </>,
    ),
    ChevronLeft: createIcon(
        "ChevronLeft",
        <>
            <polyline points="15 6 9 12 15 18" />
        </>,
    ),
    ChevronRight: createIcon(
        "ChevronRight",
        <>
            <polyline points="9 6 15 12 9 18" />
        </>,
    ),
    Refresh: createIcon(
        "Refresh",
        <>
            <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.6" />
            <polyline points="20 3.5 20 8.6 14.9 8.6" />
            <path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.4" />
            <polyline points="4 20.5 4 15.4 9.1 15.4" />
        </>,
    ),
    RotateLeft: createIcon(
        "RotateLeft",
        <>
            <path d="M4 12a8 8 0 1 0 8-8c-2.2 0-4.2.9-5.7 2.3L4 8.5" />
            <polyline points="4 3.5 4 8.5 9 8.5" />
        </>,
    ),
    RotateRight: createIcon(
        "RotateRight",
        <>
            <path d="M20 12a8 8 0 1 1-8-8c2.2 0 4.2.9 5.7 2.3L20 8.5" />
            <polyline points="20 3.5 20 8.5 15 8.5" />
        </>,
    ),
    Close: createIcon(
        "Close",
        <>
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
        </>,
    ),
    Open: createIcon(
        "Open",
        <>
            <path d="M14 4h6v6" />
            <line x1="20" y1="4" x2="12" y2="12" />
            <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
        </>,
    ),
    More: createIcon(
        "More",
        <>
            <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
        </>,
    ),
    Plus: createIcon(
        "Plus",
        <>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </>,
    ),
    Subtract: createIcon(
        "Subtract",
        <>
            <line x1="5" y1="12" x2="19" y2="12" />
        </>,
    ),
    Check: createIcon(
        "Check",
        <>
            <polyline points="5 12.5 10 17.5 19 7" />
        </>,
    ),
    Select: createIcon(
        "Select",
        <>
            <path d="M5 9V5h4" />
            <path d="M15 5h4v4" />
            <path d="M19 15v4h-4" />
            <path d="M9 19H5v-4" />
        </>,
    ),
    Confirm: createIcon(
        "Confirm",
        <>
            <circle cx="12" cy="12" r="9" />
            <polyline points="7.5 12.5 10.5 15.5 16.5 9" />
        </>,
    ),
    Cancel: createIcon(
        "Cancel",
        <>
            <circle cx="12" cy="12" r="9" />
            <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
            <line x1="15.5" y1="8.5" x2="8.5" y2="15.5" />
        </>,
    ),
    View: createIcon(
        "View",
        <>
            <path d="M2.5 12c2.3-3.8 5.4-5.7 9.5-5.7s7.2 1.9 9.5 5.7c-2.3 3.8-5.4 5.7-9.5 5.7S4.8 15.8 2.5 12z" />
            <circle cx="12" cy="12" r="2.6" />
        </>,
    ),
};
