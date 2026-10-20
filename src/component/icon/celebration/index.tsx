import { createIcon, type Icon } from "../types";

export type CelebrationIconName =
    "Balloon" | "Confetti" | "Crown" | "Firework" | "Ribbon" | "Party" | "Sparkle" | "Sparkler";

export const celebrationIcons: Record<CelebrationIconName, Icon> = {
    Balloon: createIcon(
        "Balloon",
        <>
            <path d="M12 2.8c3.2 0 5.7 2.6 5.7 6 0 3.5-2.5 6.3-5.7 6.3S6.3 12.3 6.3 8.8c0-3.4 2.5-6 5.7-6Z" />
            <path d="M12 15.1 10.6 17h2.8L12 15.1Z" />
            <path d="M12 17c-1.6 1.6 1.6 2.6 0 4.4" />
        </>,
    ),
    Confetti: createIcon(
        "Confetti",
        <>
            <path d="m3.5 20.5 4.5-10.3 5.8 5.8-10.3 4.5Z" />
            <path d="m8 10.2 5.8 5.8" />
            <path d="M15 3.2v2.3M19.2 5.2l1.5-1.5M20.8 9.6h1.4M13.4 7.9 11.9 6.4" />
            <circle cx="17.5" cy="11.4" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="16.1" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    Crown: createIcon(
        "Crown",
        <>
            <path d="M3.5 8.5 8.9 12 12 4.5 15.1 12l5.4-3.5-1.2 9.5H4.7L3.5 8.5Z" />
        </>,
    ),
    Firework: createIcon(
        "Firework",
        <>
            <circle cx="11" cy="13" r="1.2" fill="currentColor" stroke="none" />
            <path d="M11 5v3M11 18v3M3 13h3M16 13h3M5.3 7.3l2.1 2.1M14.6 16.6l2.1 2.1M16.7 7.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
            <circle cx="19" cy="5" r="0.8" fill="currentColor" stroke="none" />
            <path d="M19 1.5V3M19 7v1.5M15.5 5H17M21 5h1.5" />
        </>,
    ),
    Ribbon: createIcon(
        "Ribbon",
        <>
            <path d="M12 11C10 6.5 4.5 7.5 5.5 10.5c1 3 4 2 6.5.5Z" />
            <path d="M12 11c2-4.5 7.5-3.5 6.5-.5-1 3-4 2-6.5.5Z" />
            <circle cx="12" cy="11" r="1.2" fill="currentColor" stroke="none" />
            <path d="M11.3 12.2 9.5 20M12.7 12.2 14.5 20" />
        </>,
    ),
    Party: createIcon(
        "Party",
        <>
            <path d="M4.5 20.5 9.7 4l9.8 16.5H4.5Z" />
            <circle cx="10.3" cy="3.4" r="1.6" />
            <path d="M7.7 13.2h8.4M6.6 16.8h10.2" />
        </>,
    ),
    Sparkle: createIcon(
        "Sparkle",
        <>
            <path d="M12 3.2c.5 4.6 2.2 6.3 6.8 6.8-4.6.5-6.3 2.2-6.8 6.8-.5-4.6-2.2-6.3-6.8-6.8 4.6-.5 6.3-2.2 6.8-6.8Z" />
            <path d="M18.4 15.4c.2 1.9.9 2.6 2.8 2.8-1.9.2-2.6.9-2.8 2.8-.2-1.9-.9-2.6-2.8-2.8 1.9-.2 2.6-.9 2.8-2.8Z" />
        </>,
    ),
    Sparkler: createIcon(
        "Sparkler",
        <>
            <path d="M12 21.5v-8.8" />
            <circle cx="12" cy="10.6" r="1.5" fill="currentColor" stroke="none" />
            <path d="M12 3v3.4M8.2 6l2.2 2.2M15.8 6l-2.2 2.2M5.5 10.6h3M15.5 10.6h3" />
        </>,
    ),
};
