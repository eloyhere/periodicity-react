import { createIcon, type Icon } from "../types";

export type HealthIconName =
    | "Heart"
    | "Pulse"
    | "Medical"
    | "Pill"
    | "Stethoscope"
    | "Hospital"
    | "Fitness"
    | "Run"
    | "Bike"
    | "Nutrition"
    | "FirstAid"
    | "HealthCheck";

export const healthIcons: Record<HealthIconName, Icon> = {
    Heart: createIcon(
        "Heart",
        <path d="M19 13.9c1.4-1.4 2.8-3.1 2.8-5.4A5.3 5.3 0 0 0 16.5 3c-1.7 0-2.9.5-4.5 2.1C10.4 3.5 9.2 3 7.5 3A5.3 5.3 0 0 0 2.2 8.5c0 2.3 1.4 4 2.8 5.4l7 6.8Z" />,
    ),
    Pulse: createIcon("Pulse", <path d="M2.5 12h3.8l2-5.2 3.4 10.4 2.5-5.2h5.3" />),
    Medical: createIcon(
        "Medical",
        <>
            <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
            <path d="M12 8v8M8 12h8" />
        </>,
    ),
    Pill: createIcon(
        "Pill",
        <>
            <path d="m10.4 20.6 10.2-10.2a4.9 4.9 0 0 0-6.9-6.9L3.5 13.7a4.9 4.9 0 0 0 6.9 6.9Z" />
            <path d="m8.4 8.4 7.2 7.2" />
        </>,
    ),
    Stethoscope: createIcon(
        "Stethoscope",
        <>
            <path d="M4.5 3v5.5a4.5 4.5 0 0 0 9 0V3" />
            <path d="M9 13v2.5a4 4 0 0 0 8 0v-1.5" />
            <circle cx="17" cy="11.7" r="2.3" />
        </>,
    ),
    Hospital: createIcon(
        "Hospital",
        <>
            <path d="M4 21V6.8A2.8 2.8 0 0 1 6.8 4h10.4A2.8 2.8 0 0 1 20 6.8V21" />
            <path d="M2.5 21h19" />
            <path d="M12 8.5v6M9 11.5h6" />
            <path d="M10 21v-3.2a2 2 0 0 1 4 0V21" />
        </>,
    ),
    Fitness: createIcon(
        "Fitness",
        <path d="M6.5 6.5v11M3.5 8.5v7M17.5 6.5v11M20.5 8.5v7M6.5 12h11" />,
    ),
    Run: createIcon(
        "Run",
        <>
            <circle cx="15" cy="4.6" r="1.9" />
            <path d="M14 8.2 11.2 12l1.4 3.4" />
            <path d="M13.4 9.4 17 11" />
            <path d="M11.8 10.4 8 12.4" />
            <path d="M12.6 15.4 16.2 18.4" />
            <path d="M12.6 15.4 8.8 19" />
        </>,
    ),
    Bike: createIcon(
        "Bike",
        <>
            <circle cx="5.5" cy="16.5" r="3.6" />
            <circle cx="18.5" cy="16.5" r="3.6" />
            <path d="m5.5 16.5 4-8h4.5l4.5 8" />
            <path d="M8 8.5h4.5" />
            <path d="M16.5 8.5h2" />
        </>,
    ),
    Nutrition: createIcon(
        "Nutrition",
        <>
            <path d="M12 8.3c-1.6-1.5-4.5-1.3-5.7 1.1-1.6 3.2.6 8.5 3.4 10.5 1 .7 2.3.7 3.3 0 2.8-2 5-7.3 3.4-10.5-1.2-2.4-4.1-2.6-5.7-1.1Z" />
            <path d="M12 8.3V5.6" />
            <path d="M12.1 5.9c.4-1.7 2-3 3.9-2.9.2 1.8-1.2 3.4-3 3.5Z" />
        </>,
    ),
    FirstAid: createIcon(
        "FirstAid",
        <>
            <rect x="2.5" y="7" width="19" height="13" rx="2.5" />
            <path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
            <path d="M12 11v5M9.5 13.5h5" />
        </>,
    ),
    HealthCheck: createIcon(
        "HealthCheck",
        <>
            <path d="M19 13.6c1.3-1.3 2.6-2.9 2.6-5A5 5 0 0 0 16.6 3.6c-1.6 0-2.8.5-4.3 2-1.5-1.5-2.7-2-4.3-2a5 5 0 0 0-5 5c0 2.1 1.3 3.7 2.6 5l7 6.8Z" />
            <path d="m9 11.4 2.2 2.2 3.8-3.8" />
        </>,
    ),
};
