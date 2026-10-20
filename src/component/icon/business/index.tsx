import { createIcon, type Icon } from "../types";

export type BusinessIconName =
    | "Work"
    | "Profession"
    | "Office"
    | "Goal"
    | "Mission"
    | "Plan"
    | "Deadline"
    | "Flow"
    | "Calendar"
    | "Date"
    | "DateTime"
    | "Article"
    | "Book"
    | "Ticket";

export const businessIcons: Record<BusinessIconName, Icon> = {
    Work: createIcon(
        "Work",
        <>
            <rect x="3" y="7" width="18" height="14" rx="2.5" />
            <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
            <path d="M3 12h18" />
            <path d="M10 12v2h4v-2" />
        </>,
    ),
    Profession: createIcon(
        "Profession",
        <>
            <path d="M9 5V2.5h6V5" />
            <rect x="5" y="5" width="14" height="16" rx="2.5" />
            <circle cx="12" cy="10.5" r="2.2" />
            <path d="M8.5 16.5a3.5 3.5 0 0 1 7 0" />
        </>,
    ),
    Office: createIcon(
        "Office",
        <>
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
            <path d="M10 21v-3h4v3" />
        </>,
    ),
    Goal: createIcon(
        "Goal",
        <>
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="12" r="4.5" />
            <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </>,
    ),
    Mission: createIcon(
        "Mission",
        <>
            <path d="M5 21V4" />
            <path d="M5 5h11l-2.5 3L16 11H5Z" />
            <path d="M3 21h7" />
        </>,
    ),
    Plan: createIcon(
        "Plan",
        <>
            <rect x="5" y="4" width="14" height="17" rx="2.5" />
            <rect x="9" y="2" width="6" height="4" rx="1.5" />
            <path d="m8 10.5 1.5 1.5L13 8.5" />
            <path d="M15 10h2.5" />
            <path d="m8 16 1.5 1.5L13 14" />
            <path d="M15 15.5h2.5" />
        </>,
    ),
    Deadline: createIcon(
        "Deadline",
        <>
            <path d="M6 3h12M6 21h12" />
            <path d="M7 3c0 3.5 5 5.5 5 9s-5 5.5-5 9" />
            <path d="M17 3c0 3.5-5 5.5-5 9s5 5.5 5 9" />
        </>,
    ),
    Flow: createIcon(
        "Flow",
        <>
            <rect x="3" y="3" width="6" height="5" rx="1.5" />
            <rect x="15" y="3" width="6" height="5" rx="1.5" />
            <rect x="9" y="16" width="6" height="5" rx="1.5" />
            <path d="M6 8v4h12V8M12 12v4" />
        </>,
    ),
    Calendar: createIcon(
        "Calendar",
        <>
            <rect x="3" y="5" width="18" height="16" rx="2.5" />
            <path d="M8 3v4M16 3v4M3 10h18" />
            <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
            <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
            <circle cx="8" cy="17.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="16" cy="17.5" r="1" fill="currentColor" stroke="none" />
        </>,
    ),
    Date: createIcon(
        "Date",
        <>
            <rect x="3" y="5" width="18" height="16" rx="2.5" />
            <path d="M8 3v4M16 3v4M3 10h18" />
            <circle cx="12" cy="15.5" r="2.5" fill="currentColor" stroke="none" />
        </>,
    ),
    DateTime: createIcon(
        "DateTime",
        <>
            <rect x="3" y="5" width="18" height="16" rx="2.5" />
            <path d="M8 3v4M16 3v4M3 10h18" />
            <circle cx="12" cy="15.5" r="3.5" />
            <path d="M12 13.5v2l1.5 1" />
        </>,
    ),
    Article: createIcon(
        "Article",
        <>
            <path d="M6 3h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M15 3v5h5" />
            <path d="M8 8h4M8 12h8M8 15.5h8M8 19h5" />
        </>,
    ),
    Book: createIcon(
        "Book",
        <>
            <path d="M12 6.5C10.2 5.2 7.7 4.5 5 4.5H3v13h2c2.7 0 5.2.7 7 2 1.8-1.3 4.3-2 7-2h2v-13h-2c-2.7 0-5.2.7-7 2Z" />
            <path d="M12 6.5v13" />
        </>,
    ),
    Ticket: createIcon(
        "Ticket",
        <>
            <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a2.5 2.5 0 0 0 0-5V8Z" />
            <path d="M14 6v12" strokeDasharray="2 2.5" />
        </>,
    ),
};
