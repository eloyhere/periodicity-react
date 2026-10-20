import { createIcon, type Icon } from "../types";

export type SportIconName =
    | "Ball"
    | "Basketball"
    | "Football"
    | "Tennis"
    | "Trophy"
    | "Medal"
    | "Gym"
    | "Swim"
    | "Yoga"
    | "Whistle";

export const sportIcons: Record<SportIconName, Icon> = {
    Ball: createIcon(
        "Ball",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 12a8 8 0 0 0 8 4" />
            <path d="M7.5 13.5a12 12 0 0 0 8.5 6.5" />
            <path d="M12 12a8 8 0 0 0-7.464 4.928" />
            <path d="M12.951 7.353a12 12 0 0 0-9.88 4.111" />
            <path d="M12 12a8 8 0 0 0-.536-8.928" />
            <path d="M15.549 15.147a12 12 0 0 0 1.38-10.611" />
        </>,
    ),
    Basketball: createIcon(
        "Basketball",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3v18" />
            <path d="M5.6 5.6c2.8 3.2 2.8 9.6 0 12.8" />
            <path d="M18.4 5.6c-2.8 3.2-2.8 9.6 0 12.8" />
        </>,
    ),
    Football: createIcon(
        "Football",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 9 14.85 11.09 13.76 14.43 10.24 14.43 9.15 11.09Z" />
            <path d="M12 9V3M14.85 11.09 20.56 9.22M13.76 14.43 17.29 19.28M10.24 14.43 6.71 19.28M9.15 11.09 3.44 9.22" />
        </>,
    ),
    Tennis: createIcon(
        "Tennis",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M6 5.3a9 9 0 0 1 0 13.4" />
            <path d="M18 5.3a9 9 0 0 0 0 13.4" />
        </>,
    ),
    Trophy: createIcon(
        "Trophy",
        <>
            <path d="M7 3h10v5.5a5 5 0 0 1-10 0V3Z" />
            <path d="M7 5H4.5a2.5 2.5 0 0 0 0 5H7" />
            <path d="M17 5h2.5a2.5 2.5 0 0 1 0 5H17" />
            <path d="M12 13.5v5" />
            <path d="M8.5 21h7M9.5 18.5h5" />
        </>,
    ),
    Medal: createIcon(
        "Medal",
        <>
            <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
            <path d="M11 12 5.12 2.2M13 12l5.88-9.8M8 7h8" />
            <circle cx="12" cy="17" r="5" />
            <path d="M12 18v-2h-.5" />
        </>,
    ),
    Gym: createIcon(
        "Gym",
        <>
            <rect x="4.5" y="7" width="3" height="10" rx="1" />
            <rect x="16.5" y="7" width="3" height="10" rx="1" />
            <path d="M7 12h10" />
            <path d="M3 10v4M21 10v4" />
        </>,
    ),
    Swim: createIcon(
        "Swim",
        <>
            <circle cx="8.5" cy="8.5" r="2.8" />
            <circle cx="15.5" cy="8.5" r="2.8" />
            <path d="M11.3 8.5h1.4" />
            <path d="M3 15c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
            <path d="M3 19c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
        </>,
    ),
    Yoga: createIcon(
        "Yoga",
        <>
            <circle cx="12" cy="5" r="2" />
            <path d="M4.25 11.5 8.5 13 12 9.5l3.5 3.5 4.25-1.5" />
            <path d="M12 9.5v6" />
            <path d="M4.25 19.25c0-1.75 3.5-3 7.75-3s7.75 1.25 7.75 3a1.5 1.5 0 0 1-1.5 1.5H5.75a1.5 1.5 0 0 1-1.5-1.5Z" />
        </>,
    ),
    Whistle: createIcon(
        "Whistle",
        <>
            <path d="M10 6v4" />
            <path d="M21 6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.675A7 7 0 1 1 9 6Z" />
        </>,
    ),
};
