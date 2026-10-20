import { createIcon, type Icon } from "../types";

export type NatureIconName =
    | "Leaf"
    | "Tree"
    | "Flower"
    | "Star"
    | "Water"
    | "Fire"
    | "Seed"
    | "Mushroom"
    | "Globe"
    | "Planet"
    | "Mountain"
    | "OceanWave";

export const natureIcons: Record<NatureIconName, Icon> = {
    Leaf: createIcon(
        "Leaf",
        <>
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
            <path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12" />
        </>,
    ),
    Tree: createIcon(
        "Tree",
        <>
            <path d="M12 2 5 11h3.5L6 16h12l-2.5-5H19L12 2Z" />
            <path d="M12 16v6" />
            <path d="M9 22h6" />
        </>,
    ),
    Flower: createIcon(
        "Flower",
        <>
            <path d="M8 3v6a4 4 0 0 0 8 0V3l-2.5 2L12 3l-1.5 2L8 3Z" />
            <path d="M12 13v8" />
            <path d="M12 17c-2.5 0-4.5-2-4.5-4.5C10 12.5 12 14.5 12 17Z" />
            <path d="M12 19.5c2 0 3.5-1.5 3.5-3.5-2 0-3.5 1.5-3.5 3.5Z" />
        </>,
    ),
    Star: createIcon(
        "Star",
        <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.3l-5.8 3 1.1-6.4L2.6 9.3l6.5-.9L12 2.5Z" />,
    ),
    Water: createIcon(
        "Water",
        <>
            <path d="M12 2.8s6.5 7 6.5 11.2a6.5 6.5 0 0 1-13 0C5.5 9.8 12 2.8 12 2.8Z" />
            <path d="M9.2 13.5c0 1.5 1.1 2.8 2.6 3" />
        </>,
    ),
    Fire: createIcon(
        "Fire",
        <>
            <path d="M12 21c4 0 6.5-2.7 6.5-6.2 0-3-1.8-5.8-4.1-8.2-.7 2-1.8 3.4-3.4 4 .1-2.8-1-5.3-2.5-7.1-.9 2.8-3 5.2-3 8.9C5.5 18.3 8 21 12 21Z" />
            <path d="M12 21c1.8 0 3-1.3 3-3 0-1.5-1.5-3-2.5-4.2-1 1.5-3.5 2.6-3.5 4.5 0 1.6 1.2 2.7 3 2.7Z" />
        </>,
    ),
    Seed: createIcon(
        "Seed",
        <>
            <path d="M12 21c-3.9 0-7-1.9-7-4.7 0-2.9 3.1-5.3 7-5.3s7 2.4 7 5.3c0 2.8-3.1 4.7-7 4.7Z" />
            <path d="M12 11V6.5" />
            <path d="M12 8.5C9.2 8.5 7.5 6.8 7.5 4 10.3 4 12 5.7 12 8.5Z" />
            <path d="M12 7C14.5 7 16 5.5 16 3 13.5 3 12 4.5 12 7Z" />
        </>,
    ),
    Mushroom: createIcon(
        "Mushroom",
        <>
            <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8H4Z" />
            <path d="M9 12v5a3 3 0 0 0 6 0v-5" />
            <circle cx="9.2" cy="8" r="1" />
            <circle cx="14.4" cy="7.2" r="1.2" />
            <circle cx="12.2" cy="10" r="0.8" />
        </>,
    ),
    Globe: createIcon(
        "Globe",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" />
            <path d="M12 3c3.5 2.5 5.5 5.5 5.5 9s-2 6.5-5.5 9c-3.5-2.5-5.5-5.5-5.5-9s2-6.5 5.5-9Z" />
        </>,
    ),
    Planet: createIcon(
        "Planet",
        <>
            <circle cx="12" cy="10.5" r="5" />
            <path d="M3.07 14.75A9.5 3.6 -20 1 1 20.93 8.25A9.5 3.6 -20 1 1 3.07 14.75Z" />
        </>,
    ),
    Mountain: createIcon(
        "Mountain",
        <>
            <path d="M2.5 20 9 8l4 7 2.5-4 6 9H2.5Z" />
            <path d="m7.7 10.7 1.3 1.2 1.4-1.2" />
        </>,
    ),
    OceanWave: createIcon(
        "OceanWave",
        <>
            <path d="M2.5 7.5c2.2 0 3.3-1.8 5.5-1.8s3.3 1.8 5.5 1.8 3.3-1.8 5.5-1.8 2.5 1.8 2.5 1.8" />
            <path d="M2.5 13.2c2.2 0 3.3-1.8 5.5-1.8s3.3 1.8 5.5 1.8 3.3-1.8 5.5-1.8 2.5 1.8 2.5 1.8" />
            <path d="M2.5 18.9c2.2 0 3.3-1.8 5.5-1.8s3.3 1.8 5.5 1.8 3.3-1.8 5.5-1.8 2.5 1.8 2.5 1.8" />
        </>,
    ),
};
