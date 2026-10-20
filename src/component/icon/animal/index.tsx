import { createIcon, type Icon } from "../types";

export type AnimalIconName =
    "Dog" | "Cat" | "Bird" | "Fish" | "Paw" | "Rabbit" | "Horse" | "Butterfly" | "Turtle" | "Whale";

export const animalIcons: Record<AnimalIconName, Icon> = {
    Dog: createIcon(
        "Dog",
        <>
            <path d="M6.6 10.2c0-3.4 2.4-6.2 5.4-6.2s5.4 2.8 5.4 6.2v3.1c0 3.9-2.4 6.9-5.4 6.9s-5.4-3-5.4-6.9v-3.1Z" />
            <path d="M7.2 6.8C5 7.1 3.6 9.1 3.7 11.4c.1 2.3 1.2 4.4 2.9 5.7" />
            <path d="M16.8 6.8c2.2.3 3.6 2.3 3.5 4.6-.1 2.3-1.2 4.4-2.9 5.7" />
            <circle cx="9.7" cy="10.4" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="14.3" cy="10.4" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="12" cy="14.6" r="1" fill="currentColor" stroke="none" />
            <path d="M12 15.6v1.1M10.9 17.1c.3.5 1.9.5 2.2 0" />
        </>,
    ),
    Cat: createIcon(
        "Cat",
        <>
            <path d="M5 10.5c0-2 1-3.8 2.4-5L5.6 2.5 10.6 5.2a7 7 0 0 1 2.8 0L18.4 2.5l-1.8 3C18 6.7 19 8.5 19 10.5c0 4.6-3.1 8.5-7 8.5s-7-3.9-7-8.5Z" />
            <path d="M2.5 12h2.6M3 15.2l2.5-.7M21.5 12h-2.6M21 15.2l-2.5-.7" />
            <circle cx="9.6" cy="11" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="14.4" cy="11" r="0.7" fill="currentColor" stroke="none" />
            <path d="M11 13.8h2l-1 1.4-1-1.4Z" />
        </>,
    ),
    Bird: createIcon(
        "Bird",
        <>
            <circle cx="14.8" cy="7.6" r="3.1" />
            <path d="M17.9 7.2 21.4 8.6l-3.5 1.5" />
            <path d="M12.3 10.5C8.5 10.5 5.5 13.5 5.5 17.2c0 2 1.6 3.6 3.6 3.6h3.2c3.6 0 6.5-2.9 6.5-6.5 0-1.4-.4-2.7-1.1-3.8" />
            <path d="M8.6 13.3c1.4 2.2 3.4 3.6 5.8 4" />
            <path d="M5.5 16.8 2.8 15.6l1 3.6 1.7-.4" />
            <path d="M8 20.8v1.4M12.2 20.8v1.4" />
            <circle cx="15.8" cy="7" r="0.7" fill="currentColor" stroke="none" />
        </>,
    ),
    Fish: createIcon(
        "Fish",
        <>
            <path d="M6 12c0-3 3.1-5.4 7-5.4s7 2.4 7 5.4-3.1 5.4-7 5.4-7-2.4-7-5.4Z" />
            <path d="M6 12 2.8 8v8L6 12Z" />
            <path d="M10.5 8.4c-1 2.3-1 4.9 0 7.2" />
            <path d="M11 7.2c1.3-1.8 3-2.8 4.9-3" />
            <circle cx="16.2" cy="11" r="0.8" fill="currentColor" stroke="none" />
        </>,
    ),
    Paw: createIcon(
        "Paw",
        <>
            <path d="M12 13.2c-2.2 0-4 1.8-4 4 0 1.6 1.7 2.8 4 2.8s4-1.2 4-2.8c0-2.2-1.8-4-4-4Z" />
            <circle cx="6.4" cy="10" r="1.9" />
            <circle cx="9.9" cy="6.6" r="1.9" />
            <circle cx="14.1" cy="6.6" r="1.9" />
            <circle cx="17.6" cy="10" r="1.9" />
        </>,
    ),
    Rabbit: createIcon(
        "Rabbit",
        <>
            <path d="M9.2 9C8 5.8 8.4 2.5 10 2.5s2 3.3 1 6.7Z" />
            <path d="M14.8 9C16 5.8 15.6 2.5 14 2.5s-2 3.3-1 6.7Z" />
            <path d="M6.5 14.2c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6c0 3.6-2.5 6.3-5.5 6.3s-5.5-2.7-5.5-6.3Z" />
            <circle cx="9.8" cy="13.4" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="14.2" cy="13.4" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="12" cy="15.4" r="0.8" fill="currentColor" stroke="none" />
            <path d="M11 16.2v1.4M13 16.2v1.4" />
        </>,
    ),
    Horse: createIcon(
        "Horse",
        <>
            <path d="M3 9.4c0 1.7 1.3 3.1 3 3.1l2.5.2V21h9.3V11c0-2.5-1.5-4.7-3.8-5.6L12 2.5l-1.5 3.1-3.5.8C4.8 6.8 3 7.9 3 9.4Z" />
            <path d="M14.3 5.1 15.4 2.7l1 2.8" />
            <path d="M14.8 6.8c1.2 1.4 2 3.1 2.2 5.1M17 13.4v2.2M17 17.6v2.2" />
            <path d="M3.4 11c1 .4 2 .4 3 0M10.8 4.5c-.9 1.4-1.4 3-1.4 4.7" />
            <circle cx="7.9" cy="9.3" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="4.5" cy="10.3" r="0.7" fill="currentColor" stroke="none" />
        </>,
    ),
    Butterfly: createIcon(
        "Butterfly",
        <>
            <path d="M12 7C9.5 3.5 5.5 2.5 4.2 5.2 3 7.7 5.5 10.8 9 11.3 5.5 12.2 3.8 15.8 5.8 18c2 2.2 5.6.2 6.2-4.1Z" />
            <path d="M12 7c2.5-3.5 6.5-4.5 7.8-1.8C21 7.7 18.5 10.8 15 11.3c3.5.9 5.2 4.5 3.2 6.7-2 2.2-5.6.2-6.2-4.1Z" />
            <path d="M12 8v10.5" />
            <path d="M11.4 7.6C10.2 5.4 8.8 4.4 7.6 4.4M12.6 7.6c1.2-2.2 2.6-3.2 3.8-3.2" />
            <circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    Turtle: createIcon(
        "Turtle",
        <>
            <path d="M2.8 17c0-4.7 3.9-8.5 8.7-8.5s8.7 3.8 8.7 8.5" />
            <path d="M2.8 17h17.4" />
            <circle cx="20.4" cy="14.6" r="2.1" />
            <path d="M2.8 17 1.5 19.5M7 17v3M16 17v3" />
            <path d="M12 11.4 14.2 12.7v2.6L12 16.6l-2.2-1.3v-2.6L12 11.4Z" />
            <circle cx="21.2" cy="14.2" r="0.55" fill="currentColor" stroke="none" />
        </>,
    ),
    Whale: createIcon(
        "Whale",
        <>
            <path d="M2.5 14C2.5 10 6 7 10.3 7h2.6c3.2 0 6 1.8 7.2 4.5l1.9-1.4-.6 3.9.6 3.9-1.9-1.4C18.9 19.2 16.1 21 12.9 21h-2.6C6 21 2.5 18 2.5 14Z" />
            <path d="M7.5 7.7c0-2.2 1.1-4 2.8-4.7M7.5 7.7c0-2.2-1.1-4-2.8-4.7M7.5 7.7V3.4" />
            <path d="M3.3 15.3c1.4.9 3.1 1.1 4.8.7M10.5 15.5c1-1.9 2.6-3.1 4.6-3.4" />
            <circle cx="6.7" cy="12.3" r="0.7" fill="currentColor" stroke="none" />
        </>,
    ),
};
