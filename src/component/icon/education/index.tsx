import { createIcon, type Icon } from "../types";

export type EducationIconName =
    | "Graduation"
    | "School"
    | "Notebook"
    | "Calculator"
    | "Microscope"
    | "Flask"
    | "Backpack"
    | "Diploma"
    | "Chalkboard"
    | "Telescope";

export const educationIcons: Record<EducationIconName, Icon> = {
    Graduation: createIcon(
        "Graduation",
        <>
            <path d="M12 3.5 2.5 8.2 12 13l9.5-4.8L12 3.5Z" />
            <path d="M6.5 10.4v4.6c0 1.8 2.5 3.2 5.5 3.2s5.5-1.4 5.5-3.2v-4.6" />
            <path d="M21.5 8.2v5.3" />
            <circle cx="21.5" cy="14.2" r="1" fill="currentColor" stroke="none" />
        </>,
    ),
    School: createIcon(
        "School",
        <>
            <path d="M2.5 9.5 12 3l9.5 6.5" />
            <path d="M5 9.5V20h14V9.5" />
            <path d="M3 20h18" />
            <path d="M9.5 20v-5.5h5V20" />
            <path d="M7.5 12.5h2M14.5 12.5h2" />
            <circle cx="12" cy="7.5" r="1" />
        </>,
    ),
    Notebook: createIcon(
        "Notebook",
        <>
            <rect x="5.5" y="3" width="14" height="18" rx="2" />
            <path d="M2.5 7.5h3M2.5 12h3M2.5 16.5h3" />
            <path d="M10 8h6M10 12h6M10 16h4" />
        </>,
    ),
    Calculator: createIcon(
        "Calculator",
        <>
            <rect x="5" y="2.5" width="14" height="19" rx="2" />
            <rect x="8" y="5.5" width="8" height="3.5" rx="0.6" />
            <circle cx="8.8" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="15.2" cy="12.5" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="8.8" cy="16" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="12" cy="16" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="15.2" cy="16" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="8.8" cy="19.5" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="12" cy="19.5" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="15.2" cy="19.5" r="0.7" fill="currentColor" stroke="none" />
        </>,
    ),
    Microscope: createIcon(
        "Microscope",
        <>
            <path d="M6 18h8" />
            <path d="M3 22h18" />
            <path d="M14 22a7 7 0 1 0 0-14h-1" />
            <path d="M9 14h2" />
            <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
            <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
        </>,
    ),
    Flask: createIcon(
        "Flask",
        <>
            <path d="M9.5 2.5h5" />
            <path d="M10 2.5v6L5.2 18.2a2 2 0 0 0 1.8 2.8h10a2 2 0 0 0 1.8-2.8L14 8.5v-6" />
            <path d="M7.8 13.5h8.4" />
            <circle cx="10.8" cy="16.6" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="13.6" cy="18.2" r="0.5" fill="currentColor" stroke="none" />
        </>,
    ),
    Backpack: createIcon(
        "Backpack",
        <>
            <path d="M5 10a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v9.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5V10Z" />
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            <path d="M9 10.5h6" />
            <rect x="9" y="13" width="6" height="6.5" rx="1" />
        </>,
    ),
    Diploma: createIcon(
        "Diploma",
        <>
            <rect x="3" y="4" width="13" height="11" rx="1.5" />
            <path d="M6 7.5h7M6 10.5h7M6 13.5h4" />
            <circle cx="17.5" cy="16.5" r="2.5" />
            <path d="M15.8 18.6 15.5 22l2-1.2 2 1.2-.3-3.4" />
        </>,
    ),
    Chalkboard: createIcon(
        "Chalkboard",
        <>
            <rect x="2.5" y="4.5" width="19" height="12" rx="1.5" />
            <path d="M7 16.5 5 21M17 16.5l2 4.5" />
            <path d="M6 8.5h5M6 11.5h7.5" />
        </>,
    ),
    Telescope: createIcon(
        "Telescope",
        <>
            <path d="M3.2 13.6 17.2 3.6 19.8 7.4 5.8 17.4Z" />
            <path d="M16.4 4.6 18.7 7.8" />
            <path d="M11.8 13.1v3.4" />
            <path d="M11.8 16.5 8 21M11.8 16.5l3.8 4.5M11.8 16.5V21" />
        </>,
    ),
};
