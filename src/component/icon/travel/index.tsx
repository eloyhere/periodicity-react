import { createIcon, type Icon } from "../types";

export type TravelIconName =
    | "Plane"
    | "Hotel"
    | "Trip"
    | "Map"
    | "Compass"
    | "Luggage"
    | "Train"
    | "Bus"
    | "Car"
    | "Ship"
    | "Beach"
    | "Gate"
    | "Passport"
    | "Landmark";

export const travelIcons: Record<TravelIconName, Icon> = {
    Plane: createIcon(
        "Plane",
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />,
    ),
    Hotel: createIcon(
        "Hotel",
        <>
            <path d="M3 20.5v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
            <path d="M3 15.5h18" />
            <path d="M5.5 11.5h5v4h-5Z" />
            <path d="M5 20.5v1.5M19 20.5v1.5" />
        </>,
    ),
    Trip: createIcon(
        "Trip",
        <>
            <path d="M4 20c4 0 3-4.5 7-4.5s3.5-3 4.5-6.5" strokeDasharray="2.5 2.5" />
            <circle cx="4" cy="20" r="1.5" fill="currentColor" stroke="none" />
            <path d="M18.5 3a3.5 3.5 0 0 0-3.5 3.5c0 3 3.5 6 3.5 6s3.5-3 3.5-6A3.5 3.5 0 0 0 18.5 3Z" />
            <circle cx="18.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </>,
    ),
    Map: createIcon(
        "Map",
        <>
            <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
            <path d="M9 3v15M15 6v15" />
        </>,
    ),
    Compass: createIcon(
        "Compass",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </>,
    ),
    Luggage: createIcon(
        "Luggage",
        <>
            <rect x="4" y="7" width="16" height="14" rx="2.5" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            <path d="M9 11v6M15 11v6" />
        </>,
    ),
    Train: createIcon(
        "Train",
        <>
            <rect x="5" y="3.5" width="14" height="14" rx="4" />
            <path d="M5 11h14" />
            <circle cx="8.5" cy="14" r="1" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="14" r="1" fill="currentColor" stroke="none" />
            <path d="M8 17.5 6 21M16 17.5 18 21" />
            <path d="M4 21h16" />
        </>,
    ),
    Bus: createIcon(
        "Bus",
        <>
            <rect x="3" y="4" width="18" height="13" rx="3" />
            <path d="M3 11h18" />
            <path d="M7 4v7M12 4v7M17 4v7" />
            <circle cx="7" cy="18.5" r="1.5" />
            <circle cx="17" cy="18.5" r="1.5" />
        </>,
    ),
    Car: createIcon(
        "Car",
        <>
            <path d="M5 17H3v-5l3.5-1L9 7.5a2 2 0 0 1 1.8-1.2h3.4a2 2 0 0 1 1.8 1.2L18 12l3 1v4h-2" />
            <path d="M9 17h6" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
        </>,
    ),
    Ship: createIcon(
        "Ship",
        <>
            <path d="M3 16h18l-2.5 4h-13L3 16Z" />
            <path d="M12 16V3.5" />
            <path d="M12 5 18.5 14H12V5Z" />
            <path d="M11 8 6 14h5V8Z" />
        </>,
    ),
    Beach: createIcon(
        "Beach",
        <>
            <path d="M3 12a9 9 0 0 1 18 0H3Z" />
            <path d="M12 12v5a2.5 2.5 0 0 0 5 0" />
            <path d="M3 21c2.25 0 2.25-1.5 4.5-1.5s2.25 1.5 4.5 1.5 2.25-1.5 4.5-1.5 2.25 1.5 4.5 1.5" />
        </>,
    ),
    Gate: createIcon(
        "Gate",
        <>
            <path d="M4 21V10a8 8 0 0 1 16 0v11" />
            <path d="M2 21h20" />
            <path d="M9 14h6" />
            <path d="m13 11 3 3-3 3" />
        </>,
    ),
    Passport: createIcon(
        "Passport",
        <>
            <rect x="5" y="3" width="14" height="18" rx="2.5" />
            <circle cx="12" cy="13" r="3.5" />
            <path d="M8.5 13h7M12 9.5c-1.3 2-1.3 5 0 7M12 9.5c1.3 2 1.3 5 0 7" />
        </>,
    ),
    Landmark: createIcon(
        "Landmark",
        <>
            <path d="M3 9 12 4l9 5H3Z" />
            <path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9" />
            <path d="M3 18h18M2 21h20" />
        </>,
    ),
};
