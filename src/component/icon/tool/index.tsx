import { createIcon, type Icon } from "../types";

export type ToolIconName =
    | "Setting"
    | "Pen"
    | "Pencil"
    | "Draw"
    | "Mark"
    | "Markdown"
    | "Permission"
    | "Lock"
    | "Unlock"
    | "Security"
    | "Ruler"
    | "Scissors"
    | "Wrench"
    | "Hammer"
    | "Screwdriver"
    | "Eraser"
    | "Crop"
    | "Brush"
    | "Palette"
    | "Magnet";

export const toolIcons: Record<ToolIconName, Icon> = {
    Setting: createIcon(
        "Setting",
        <>
            <circle cx="12" cy="12" r="6.2" />
            <circle cx="12" cy="12" r="3" />
            <rect x="10.7" y="2.4" width="2.6" height="3.8" rx="0.6" />
            <rect x="10.7" y="2.4" width="2.6" height="3.8" rx="0.6" transform="rotate(45 12 12)" />
            <rect x="10.7" y="2.4" width="2.6" height="3.8" rx="0.6" transform="rotate(90 12 12)" />
            <rect
                x="10.7"
                y="2.4"
                width="2.6"
                height="3.8"
                rx="0.6"
                transform="rotate(135 12 12)"
            />
            <rect
                x="10.7"
                y="2.4"
                width="2.6"
                height="3.8"
                rx="0.6"
                transform="rotate(180 12 12)"
            />
            <rect
                x="10.7"
                y="2.4"
                width="2.6"
                height="3.8"
                rx="0.6"
                transform="rotate(225 12 12)"
            />
            <rect
                x="10.7"
                y="2.4"
                width="2.6"
                height="3.8"
                rx="0.6"
                transform="rotate(270 12 12)"
            />
            <rect
                x="10.7"
                y="2.4"
                width="2.6"
                height="3.8"
                rx="0.6"
                transform="rotate(315 12 12)"
            />
        </>,
    ),
    Pen: createIcon(
        "Pen",
        <>
            <path d="M4 20l1.5-5L15.5 5a2.1 2.1 0 0 1 3 3L8.5 18z" />
            <path d="M13 6.5l4.5 4.5" />
            <path d="M5.5 15l3.5 3.5" />
        </>,
    ),
    Pencil: createIcon(
        "Pencil",
        <>
            <path d="M8 4h8v11l-4 5-4-5z" />
            <path d="M8 8h8" />
            <path d="M10 15l2 5 2-5" />
        </>,
    ),
    Draw: createIcon(
        "Draw",
        <>
            <path d="M9 14.5l1-3.5 8-8a1.8 1.8 0 0 1 2.5 2.5l-8 8z" />
            <path d="M15.5 5.5L18 8" />
            <path d="M4 21c2.5 0 3-2.5 5.5-2.5S12 21 14.5 21s3-1.5 4-3" />
        </>,
    ),
    Mark: createIcon(
        "Mark",
        <>
            <path d="M15 3.5l5.5 5.5-7 6-4-4z" />
            <path d="M9.5 11l4 4" />
            <path d="M8.5 13.5 4 18v3h3l4.5-4.5" />
            <path d="M3 21h18" />
        </>,
    ),
    Markdown: createIcon(
        "Markdown",
        <>
            <rect x="2.5" y="6" width="19" height="12" rx="2" />
            <path d="M5.5 15.5V8.5l3 3.5 3-3.5v7" />
            <path d="M16.5 8.5v7M14 13l2.5 2.5L19 13" />
        </>,
    ),
    Permission: createIcon(
        "Permission",
        <>
            <circle cx="8" cy="8" r="4" />
            <path d="M11 11l9 9" />
            <path d="M16.5 16.5l2-2M19 19l2-2" />
        </>,
    ),
    Lock: createIcon(
        "Lock",
        <>
            <rect x="4.5" y="10" width="15" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            <circle cx="12" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
            <path d="M12 15.5v2" />
        </>,
    ),
    Unlock: createIcon(
        "Unlock",
        <>
            <rect x="4.5" y="10" width="15" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 7.5-2" />
            <circle cx="12" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
            <path d="M12 15.5v2" />
        </>,
    ),
    Security: createIcon(
        "Security",
        <>
            <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
            <polyline points="8.5 12 10.5 14 15.5 9" />
        </>,
    ),
    Ruler: createIcon(
        "Ruler",
        <>
            <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
            <path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2" />
        </>,
    ),
    Scissors: createIcon(
        "Scissors",
        <>
            <circle cx="6" cy="6" r="3" />
            <path d="M8.12 8.12 12 12" />
            <path d="M20 4 8.12 15.88" />
            <circle cx="6" cy="18" r="3" />
            <path d="M14.8 14.8 20 20" />
        </>,
    ),
    Wrench: createIcon(
        "Wrench",
        <>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </>,
    ),
    Hammer: createIcon(
        "Hammer",
        <>
            <rect x="3.5" y="3.5" width="12" height="5.5" rx="1.5" />
            <path d="M10 9l4.5 11.5" />
        </>,
    ),
    Screwdriver: createIcon(
        "Screwdriver",
        <>
            <rect x="9" y="3" width="6" height="5" rx="1.5" />
            <path d="M10 8h4" />
            <line x1="12" y1="8" x2="12" y2="18" />
            <path d="M9.5 18h5v3h-5z" />
        </>,
    ),
    Eraser: createIcon(
        "Eraser",
        <>
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m5 11 9 9" />
        </>,
    ),
    Crop: createIcon(
        "Crop",
        <>
            <path d="M6 2v14a2 2 0 0 0 2 2h14" />
            <path d="M18 22V8a2 2 0 0 0-2-2H2" />
        </>,
    ),
    Brush: createIcon(
        "Brush",
        <>
            <path d="M3 21v-4a4 4 0 1 1 4 4H3" />
            <path d="M21 3a16 16 0 0 0-12.8 10.2" />
            <path d="M21 3a16 16 0 0 1-10.2 12.8" />
            <path d="M10.6 9a9 9 0 0 1 4.4 4.4" />
        </>,
    ),
    Palette: createIcon(
        "Palette",
        <>
            <circle cx="13.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="17.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="8.5" cy="7.5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="6.5" cy="12.5" r="0.8" fill="currentColor" stroke="none" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </>,
    ),
    Magnet: createIcon(
        "Magnet",
        <>
            <path d="m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15" />
            <path d="m5 8 4 4" />
            <path d="m12 15 4 4" />
        </>,
    ),
};
