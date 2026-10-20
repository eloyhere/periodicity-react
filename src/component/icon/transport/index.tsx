import { createIcon, type Icon } from "../types";

export type TransportIconName =
    | "Motorcycle"
    | "Rocket"
    | "Truck"
    | "Boat"
    | "Helicopter"
    | "Bicycle"
    | "Scooter"
    | "Subway"
    | "Traffic"
    | "Road";

export const transportIcons: Record<TransportIconName, Icon> = {
    Motorcycle: createIcon(
        "Motorcycle",
        <>
            <circle cx="5" cy="17.5" r="3" />
            <circle cx="19" cy="17.5" r="3" />
            <path d="M8 17.5 9.5 11.5h5l4.5 6" />
            <path d="M10.5 11.5c0-1.4 1.1-2.5 2.5-2.5h1.5c1.4 0 2.5 1.1 2.5 2.5" />
            <rect x="10.8" y="13.2" width="4.4" height="2.8" rx="1" />
            <path d="M8 10.2h3.4M9.5 11.5v-1.3" />
            <path d="M15.8 7.8h4.2M18 7.8l1 9.7" />
        </>,
    ),
    Rocket: createIcon(
        "Rocket",
        <>
            <path d="M12 2.5c2.8 2.5 4.3 5.9 4.3 9.5 0 2.4-.7 4.7-2 6.7H9.7c-1.3-2-2-4.3-2-6.7 0-3.6 1.5-7 4.3-9.5Z" />
            <circle cx="12" cy="10" r="1.7" />
            <path d="M9.7 13.5 6.5 16.8v3l3.2-2.2M14.3 13.5l3.2 3.3v3l-3.2-2.2" />
            <path d="M10.4 18.7 9.2 22M12 18.7V22M13.6 18.7 14.8 22" />
        </>,
    ),
    Truck: createIcon(
        "Truck",
        <>
            <rect x="2.5" y="6.5" width="10" height="9.5" rx="1" />
            <path d="M12.5 9.5H16l3 3.5v3h-6.5" />
            <circle cx="7" cy="17.5" r="1.8" />
            <circle cx="17" cy="17.5" r="1.8" />
        </>,
    ),
    Boat: createIcon(
        "Boat",
        <>
            <path d="M3.5 15.5h17l-2.2 3.8H5.7L3.5 15.5Z" />
            <path d="M12 3.5v12" />
            <path d="M12 5.5 6.5 14H12V5.5Z" />
            <path d="M13.5 8.5 17.5 14h-4V8.5Z" />
        </>,
    ),
    Helicopter: createIcon(
        "Helicopter",
        <>
            <path d="M3.5 4.5h17M11.5 4.5V9.5" />
            <path d="M5 14c0-2.5 2-4.5 4.5-4.5h4c2.5 0 4.5 1.8 4.5 4.2V15H6.5Z" />
            <path d="M18 12.5h3.5l1 2.5" />
            <path d="M4.5 17.5h11M6 17.5V16M13.5 17.5V16" />
            <path d="M8.5 11h3.5v2.5H7" />
        </>,
    ),
    Bicycle: createIcon(
        "Bicycle",
        <>
            <circle cx="5.5" cy="16.5" r="3.2" />
            <circle cx="18.5" cy="16.5" r="3.2" />
            <path d="M5.5 16.5 9.5 9.5h6l3 7" />
            <path d="M9.5 9.5 12.5 16.5H5.5" />
            <path d="M8 7.5h3M9.5 9.5 8.5 7.5M15.5 7.5h3M15.5 9.5 16.5 7.5" />
            <circle cx="12.5" cy="16.5" r="1" />
        </>,
    ),
    Scooter: createIcon(
        "Scooter",
        <>
            <circle cx="5" cy="18" r="2.2" />
            <circle cx="19" cy="18" r="2.2" />
            <path d="M7.2 18h9.6" />
            <path d="M16.8 18 13 5.5" />
            <path d="M10.5 5.5h5" />
        </>,
    ),
    Subway: createIcon(
        "Subway",
        <>
            <rect x="3.5" y="5.5" width="17" height="12" rx="3" />
            <path d="M6.5 9.5h3.5M11.5 9.5h3.5M16 9.5h2" />
            <circle cx="7.5" cy="18.5" r="1.8" />
            <circle cx="16.5" cy="18.5" r="1.8" />
            <path d="M2.5 21.5h19" />
            <path d="M9.5 5.5 12 3.2l2.5 2.3M12 3.2v2.3" />
        </>,
    ),
    Traffic: createIcon(
        "Traffic",
        <>
            <rect x="8" y="2.5" width="8" height="14" rx="2.5" />
            <circle cx="12" cy="6.5" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="12" cy="9.5" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12.5" r="1.3" fill="currentColor" stroke="none" />
            <path d="M12 16.5V21M9 21h6" />
        </>,
    ),
    Road: createIcon(
        "Road",
        <>
            <path d="M9 3.5h6l4.5 17H4.5L9 3.5Z" />
            <path d="M12 18.5v-2.8M12 13v-2.8M12 7.5V5" />
        </>,
    ),
};
