/* eslint-disable @typescript-eslint/typedef -- Literal icon specs are intentionally concise. */
import { createIcon, type Icon } from "../types";

const specs = [
    ["AnimalLion", "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM8 12h.01M16 12h.01M10 16c1 1 3 1 4 0"],
    ["AnimalTiger", "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM6 8l2 2M18 8l-2 2M8 15h.01M16 15h.01"],
    ["AnimalBear", "M7 7a2 2 0 1 0 0 .01M17 7a2 2 0 1 0 0 .01M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM9 12h.01M15 12h.01M10 15c1 1 3 1 4 0"],
    ["AnimalElephant", "M5 10a6 6 0 0 1 12 0v5H7v-5ZM9 15v4M15 15v4M17 10c2 0 3 2 3 5"],
    ["AnimalMonkey", "M6 8a2 2 0 1 0 0 .01M18 8a2 2 0 1 0 0 .01M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM10 11h.01M14 11h.01M10 14c1 1 3 1 4 0"],
    ["AnimalDeer", "M8 4l2 4M16 4l-2 4M8 8a5 5 0 1 0 8 0M12 13v4M10 17h4"],
    ["AnimalFox", "M4 6l4 4M20 6l-4 4M7 8a5 5 0 0 0 10 0L12 20 7 8Z"],
    ["AnimalWolf", "M5 6l3 4M19 6l-3 4M7 9a5 5 0 0 0 10 0L12 20 7 9Z"],
    ["AnimalPig", "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM8 11h.01M16 11h.01M9 15h6M12 15v2"],
    ["AnimalCow", "M6 6l2 3M18 6l-2 3M8 9a5 5 0 0 0 8 0M9 13h.01M15 13h.01M9 16h6"],
    ["AnimalSheep", "M7 8a3 3 0 0 1 5-2 3 3 0 0 1 5 2 3 3 0 0 1 1 5H6a3 3 0 0 1 1-5ZM9 13h.01M15 13h.01"],
    ["AnimalGoat", "M8 5l2 4M16 5l-2 4M8 10a4 4 0 0 0 8 0M12 14v5M10 19h4"],
    ["AnimalChicken", "M9 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 4l1 2M5 14l4 4M13 14l-4 4M7 18h4"],
    ["AnimalDuck", "M5 14a5 5 0 0 1 8-4 4 4 0 1 1 4 4H7M7 18h8M14 10l3-2"],
    ["AnimalPenguin", "M9 4a4 4 0 0 0-4 4v8a4 4 0 0 0 8 0V8a4 4 0 0 0-4-4ZM7 12h4M9 16v2"],
    ["AnimalOwl", "M6 6l2 3M18 6l-2 3M8 9a4 4 0 0 0 8 0v5a4 4 0 0 1-8 0V9ZM9 11h.01M15 11h.01"],
    ["AnimalEagle", "M4 8l5 4-3 6 6-4 6 4-3-6 5-4-6 2-4-6-4 6-6-2Z"],
    ["AnimalSnake", "M5 6c4 0 3 5 7 5s3-5 7-5M7 18c3 0 5-2 5-5s2-5 5-5M7 18h.01"],
    ["AnimalFrog", "M7 8a2 2 0 1 0 0 .01M17 8a2 2 0 1 0 0 .01M12 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM9 13h.01M15 13h.01M9 16c1 1 5 1 6 0"],
    ["AnimalDolphin", "M4 12c4-5 10-5 14 0-2 5-8 7-12 4 2-1 3-3 4-4M14 8l2-3 2 3"],
] as const;

/**
 * Extra animal icon names.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: AnimalExtraIconName = "AnimalLion";
 */
export type AnimalExtraIconName = (typeof specs)[number][0];

export const animalExtraIcons: Record<AnimalExtraIconName, Icon> = Object.fromEntries(
    specs.map(
        ([name, d]: (typeof specs)[number]): [AnimalExtraIconName, Icon] => [
            name,
            createIcon(name, <path d={d} />),
        ],
    ),
) as Record<AnimalExtraIconName, Icon>;
