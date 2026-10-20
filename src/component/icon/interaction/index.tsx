import { createIcon, type Icon } from "../types";

export type InteractionIconName =
    | "Speak"
    | "Shanke"
    | "HandShake"
    | "Buddy"
    | "Person"
    | "Agent"
    | "HandWave"
    | "Nod"
    | "Point"
    | "Shrug";

export const interactionIcons: Record<InteractionIconName, Icon> = {
    Speak: createIcon(
        "Speak",
        <>
            <circle cx="9.5" cy="12" r="6" />
            <circle cx="7" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="9.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
            <path d="M17.5 9.5a4.5 4.5 0 0 1 0 5" />
            <path d="M20 7.5a8 8 0 0 1 0 9" />
        </>,
    ),
    Shanke: createIcon(
        "Shanke",
        <>
            <path d="M2.5 10h5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5h-5z" />
            <path d="M21.5 10h-5a3.5 3.5 0 0 0-3.5 3.5 3.5 3.5 0 0 0 3.5 3.5h5z" />
            <path d="M5.5 12.2h2.2M5.5 14.8h2.2M18.5 12.2h-2.2M18.5 14.8h-2.2" />
            <path d="M12 4v2M7.5 5.5l1.2 1.7M16.5 5.5l-1.2 1.7" />
        </>,
    ),
    HandShake: createIcon(
        "HandShake",
        <>
            <path d="m11 17 2 2a1 1 0 1 0 3-3" />
            <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
            <path d="m21 3 1 11h-2" />
            <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
            <path d="M3 4h8" />
        </>,
    ),
    Buddy: createIcon(
        "Buddy",
        <>
            <circle cx="8" cy="8.5" r="3" />
            <path d="M2.5 20a5.5 5.5 0 0 1 11 0" />
            <circle cx="17.5" cy="8.5" r="2.3" />
            <path d="M14.5 20a4.5 4.5 0 0 1 7 0" />
        </>,
    ),
    Person: createIcon(
        "Person",
        <>
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20a7 7 0 0 1 14 0" />
        </>,
    ),
    Agent: createIcon(
        "Agent",
        <>
            <rect x="5" y="7" width="14" height="11" rx="3" />
            <line x1="12" y1="4" x2="12" y2="7" />
            <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
            <path d="M3 11v3M21 11v3" />
            <circle cx="9.5" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
            <path d="M9.5 15.5h5" />
        </>,
    ),
    HandWave: createIcon(
        "HandWave",
        <>
            <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11" />
            <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" />
            <path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V12" />
            <path d="M17 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-4.5-2L4 14.5a1.5 1.5 0 0 1 2.2-2L8 14" />
            <path d="M18.5 4c1 .7 1.8 1.7 2.3 2.9" />
            <path d="M20.5 2c1.3.8 2.3 1.9 3 3.3" />
        </>,
    ),
    Nod: createIcon(
        "Nod",
        <>
            <circle cx="9.5" cy="12" r="6" />
            <circle cx="7.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="11.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <path d="M7.5 15h4" />
            <line x1="19.5" y1="4" x2="19.5" y2="12.5" />
            <polyline points="16.5 9.5 19.5 12.5 22.5 9.5" />
        </>,
    ),
    Point: createIcon(
        "Point",
        <>
            <path d="M4 3l7 17 2.5-7 7-2.5z" />
        </>,
    ),
    Shrug: createIcon(
        "Shrug",
        <>
            <circle cx="12" cy="6" r="2.5" />
            <path d="M12 8.5v6" />
            <path d="M12 11H5.5M12 11h5" />
            <path d="M4 11V9.5a1.5 1.5 0 0 1 3 0V11" />
            <path d="M17 11V9.5a1.5 1.5 0 0 1 3 0V11" />
            <path d="M8.5 20l3.5-5 3.5 5" />
        </>,
    ),
};
