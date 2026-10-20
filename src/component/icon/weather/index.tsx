import { createIcon, type Icon } from "../types";

export type WeatherIconName =
    | "Sun"
    | "Moon"
    | "Cloud"
    | "CloudSun"
    | "CloudMoon"
    | "Rain"
    | "HeavyRain"
    | "Snow"
    | "Storm"
    | "Thunder"
    | "Wind"
    | "Fog"
    | "Rainbow"
    | "Sunrise"
    | "Sunset"
    | "Umbrella"
    | "Thermometer"
    | "Tornado";

export const weatherIcons: Record<WeatherIconName, Icon> = {
    Sun: createIcon(
        "Sun",
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </>,
    ),
    Moon: createIcon("Moon", <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />),
    Cloud: createIcon("Cloud", <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />),
    CloudSun: createIcon(
        "CloudSun",
        <>
            <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" />
            <path d="M15.95 12.65a4 4 0 0 0-5.93-4.13" />
            <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
        </>,
    ),
    CloudMoon: createIcon(
        "CloudMoon",
        <>
            <path d="M16.5 2.5a4.5 4.5 0 0 0 4.5 4.5 4.5 4.5 0 1 1-4.5-4.5Z" />
            <path d="M14.6 19.7H8.5a5 5 0 1 1 4.8-6.5h1.3a3.2 3.2 0 1 1 0 6.5Z" />
        </>,
    ),
    Rain: createIcon(
        "Rain",
        <>
            <path d="M14.6 13.7H8.5a5 5 0 1 1 4.8-6.5h1.3a3.2 3.2 0 1 1 0 6.5Z" />
            <path d="M8 16.5 7 20M12 16.5 11 21M16 16.5 15 20" />
        </>,
    ),
    HeavyRain: createIcon(
        "HeavyRain",
        <>
            <path d="M14.6 13.7H8.5a5 5 0 1 1 4.8-6.5h1.3a3.2 3.2 0 1 1 0 6.5Z" />
            <path d="M6 16 4.8 21M9.5 16 8.3 21M13 16 11.8 21M16.5 16 15.3 21" />
        </>,
    ),
    Snow: createIcon(
        "Snow",
        <>
            <path d="M12 2v20M3.34 7l17.32 10M20.66 7 3.34 17" />
            <path d="m9.5 4.5 2.5 2.5 2.5-2.5M9.5 19.5l2.5-2.5 2.5 2.5" />
        </>,
    ),
    Storm: createIcon(
        "Storm",
        <>
            <path d="M14.6 13.7H8.5a5 5 0 1 1 4.8-6.5h1.3a3.2 3.2 0 1 1 0 6.5Z" />
            <path d="m13.5 14.5-3.5 5h3L12 22l4-4.5h-3l1.5-3Z" />
        </>,
    ),
    Thunder: createIcon("Thunder", <path d="M13 2 5 13.5h5.5L10.5 22 19 10.5h-5.5L13 2Z" />),
    Wind: createIcon(
        "Wind",
        <>
            <path d="M3 8h9a2.5 2.5 0 1 0-2.5-2.5" />
            <path d="M3 12h13a3 3 0 1 1-3 3" />
            <path d="M3 16h7a2 2 0 1 1-2 2" />
        </>,
    ),
    Fog: createIcon(
        "Fog",
        <>
            <path d="M14.6 13.7H8.5a5 5 0 1 1 4.8-6.5h1.3a3.2 3.2 0 1 1 0 6.5Z" />
            <path d="M5 17.5h14M7 21h10" />
        </>,
    ),
    Rainbow: createIcon(
        "Rainbow",
        <>
            <path d="M3.5 19a8.5 8.5 0 0 1 17 0" />
            <path d="M7 19a5 5 0 0 1 10 0" />
            <path d="M10.5 19a1.5 1.5 0 0 1 3 0" />
        </>,
    ),
    Sunrise: createIcon(
        "Sunrise",
        <>
            <path d="M3 21h18" />
            <path d="M6.5 21a5.5 5.5 0 0 1 11 0" />
            <path d="M12 3v5" />
            <path d="m9 6 3-3 3 3" />
        </>,
    ),
    Sunset: createIcon(
        "Sunset",
        <>
            <path d="M3 21h18" />
            <path d="M6.5 21a5.5 5.5 0 0 1 11 0" />
            <path d="M12 3v5" />
            <path d="m9 5 3 3 3-3" />
        </>,
    ),
    Umbrella: createIcon(
        "Umbrella",
        <>
            <path d="M12 2v1.5" />
            <path d="M3 12a9 9 0 0 1 18 0H3Z" />
            <path d="M12 12v7a2 2 0 0 0 4 0" />
        </>,
    ),
    Thermometer: createIcon(
        "Thermometer",
        <>
            <path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z" />
            <path d="M12 9h2M12 12h2" />
            <circle cx="12" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
        </>,
    ),
    Tornado: createIcon(
        "Tornado",
        <>
            <path d="M21 4H3M18 8H6M19 12H9M16 16h-6M11 20H9" />
        </>,
    ),
};
