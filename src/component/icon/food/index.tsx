import { createIcon, type Icon } from "../types";

export type FoodIconName =
    | "Coffee"
    | "Tea"
    | "Cup"
    | "Fork"
    | "Knife"
    | "Plate"
    | "Pizza"
    | "Burger"
    | "Cake"
    | "Apple"
    | "Wine"
    | "Bread";

export const foodIcons: Record<FoodIconName, Icon> = {
    Coffee: createIcon(
        "Coffee",
        <>
            <path d="M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z" />
            <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
            <path d="M3 21h14" />
            <path d="M8 3c-.8 1.2-.8 2.3 0 3.5M12 3c-.8 1.2-.8 2.3 0 3.5" />
        </>,
    ),
    Tea: createIcon(
        "Tea",
        <>
            <path d="M4 10h12v4.5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V10Z" />
            <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
            <path d="M3 21h14" />
            <path d="M10 10V6" />
            <rect x="8.6" y="3" width="2.8" height="2.5" rx="0.6" />
        </>,
    ),
    Cup: createIcon(
        "Cup",
        <>
            <path d="m6 8l1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8M5 8h14" />
            <path d="M7 15a6.47 6.47 0 0 1 5 0a6.47 6.47 0 0 0 5 0m-5-7l1-6h2" />
        </>,
    ),
    Fork: createIcon(
        "Fork",
        <>
            <path d="M6 3v5a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V3" />
            <path d="M9 3v4.5M15 3v4.5M12 3v9" />
            <path d="M12 12v9" />
        </>,
    ),
    Knife: createIcon(
        "Knife",
        <>
            <path d="M15.5 2c-2.5 3-4 6.5-4 11h4V2Z" />
            <rect x="13.4" y="13" width="4.2" height="8" rx="1.2" />
        </>,
    ),
    Plate: createIcon(
        "Plate",
        <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5.5" />
        </>,
    ),
    Pizza: createIcon(
        "Pizza",
        <>
            <path d="M4 7a16 16 0 0 1 16 0L12 21 4 7Z" />
            <path d="M6.6 8.3a12 12 0 0 1 10.8 0" />
            <circle cx="9.3" cy="11" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="14.6" cy="10.3" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="11.9" cy="14.3" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    Burger: createIcon(
        "Burger",
        <>
            <path d="M4 11a8 8 0 0 1 16 0H4Z" />
            <circle cx="8.2" cy="8.2" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="12" cy="7.1" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="15.8" cy="8.2" r="0.7" fill="currentColor" stroke="none" />
            <path d="M4 13.5c1.3.9 2.5-.7 3.8 0s2.5.7 3.8 0 2.5-.7 3.8 0 2.5.7 3.6 0" />
            <path d="M4.5 16h15" />
            <path d="M4 17h16c0 2.2-1.7 3.5-4.2 3.5H8.2C5.7 20.5 4 19.2 4 17Z" />
        </>,
    ),
    Cake: createIcon(
        "Cake",
        <>
            <path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7H4Z" />
            <path d="M4 17.5h16" />
            <path d="M12 12V7" />
            <path d="M12 7c-1-1-.7-2.6.3-3.3.6.9.9 2.1-.3 3.3Z" />
        </>,
    ),
    Apple: createIcon(
        "Apple",
        <>
            <path d="M12 8c1.4-1.8 3.7-2.3 5.6-1 2.4 1.8 2.6 6.2.2 9.7-1.7 2.5-4 3.8-5.8 3.8s-4.1-1.3-5.8-3.8C3.8 13.2 4 8.8 6.4 7c1.9-1.3 4.2-.8 5.6 1Z" />
            <path d="M12 8V5" />
            <path d="M12 5c1.4-1.7 3.2-2.2 5-1.6-.7 1.9-2.5 3-5 2.6" />
        </>,
    ),
    Wine: createIcon(
        "Wine",
        <>
            <path d="M8 3h8l-.6 6.2A4 4 0 0 1 12 13a4 4 0 0 1-3.4-3.8L8 3Z" />
            <path d="M8.3 7h7.4" />
            <path d="M12 13v7" />
            <path d="M8 21h8" />
        </>,
    ),
    Bread: createIcon(
        "Bread",
        <>
            <path d="M4 11.5C4 8 7 5.5 12 5.5s8 2.5 8 6V17a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5.5Z" />
            <path d="M7.5 11.5 10.5 8.5M10.5 12 13.5 9M13.5 12 16.5 9" />
        </>,
    ),
};
