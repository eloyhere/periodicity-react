/* eslint-disable @typescript-eslint/typedef -- Literal icon specs are intentionally concise. */
import { createIcon, type Icon } from "../types";

const specs = [
    ["PlantSeedling", "M12 20v-8M12 12c-4 0-6-3-6-6 4 0 6 2 6 6ZM12 12c4 0 6-3 6-6-4 0-6 2-6 6Z"],
    ["PlantTree", "M12 3l7 9h-4l4 5H5l4-5H5l7-9ZM12 17v4"],
    ["PlantPine", "M12 3l5 6h-3l4 5H6l4-5H7l5-6ZM12 14v6"],
    ["PlantPalm", "M12 21V9M12 9c-4-2-7-1-9 2M12 9c4-2 7-1 9 2M12 9c-1-4 0-6 2-8"],
    ["PlantCactus", "M12 21V8M12 12H7V9M12 15h5v-3M10 4h4v4h-4z"],
    ["PlantFern", "M12 21V5M12 9c-4 0-6-2-6-5M12 9c4 0 6-2 6-5M12 14c-4 0-6-2-6-5M12 14c4 0 6-2 6-5"],
    ["PlantMoss", "M4 19h16M7 19c0-4 3-6 6-6s6 2 6 6M9 13c-2-3-1-6 1-8M15 13c2-3 1-6-1-8"],
    ["PlantGrass", "M4 20c2-8 4-12 8-12s6 4 8 12M8 20c0-4 1-7 4-9M16 20c0-4-1-7-4-9"],
    ["PlantFlower", "M12 20v-6M12 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"],
    ["PlantRose", "M12 21v-6M12 15c-4 0-6-3-6-6 4 0 6 3 6 6ZM12 15c4 0 6-3 6-6-4 0-6 3-6 6Z"],
    ["PlantTulip", "M12 21V9M8 9c0-4 2-6 4-6s4 2 4 6M8 9h8M9 13h6"],
    ["PlantSunflower", "M12 21v-8M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 5l2-3M12 5l-2-3M7 8 4 6M17 8l3-2M7 12H4M17 12h3"],
    ["PlantLotus", "M12 21c-5 0-8-3-8-6 3 0 5 1 8 4 3-3 5-4 8-4 0 3-3 6-8 6ZM12 19c-3-3-3-8 0-11 3 3 3 8 0 11Z"],
    ["PlantBamboo", "M8 21V4M12 21V7M16 21V10M8 8h4M12 12h4M8 15h4M12 18h4"],
    ["PlantVine", "M5 20c0-8 4-16 14-16M9 20c0-6 2-10 8-12M13 20c0-3 1-5 4-6"],
    ["PlantLeaf", "M4 20c8 0 16-8 16-16C12 4 4 12 4 20ZM8 16c2-4 5-7 9-9"],
    ["PlantMapleLeaf", "M12 3l2 4 4-1-2 4 4 2-4 2 2 4-4-1-2 4-2-4-4 1 2-4-4-2 4-2-2-4 4 1 2-4ZM12 8v12"],
    ["PlantClover", "M12 12c-4-4-8-4-8 0s4 4 8 0c4-4 8-4 8 0s-4 4-8 0ZM12 12c-4 4-4 8 0 8s4-4 0-8c4 4 8 4 8 0s-4-4-8 0Z"],
    ["PlantMushroom", "M4 12a8 8 0 0 1 16 0H4ZM9 12v6a3 3 0 0 0 6 0v-6"],
    ["PlantBerry", "M12 21c-5 0-8-4-8-9s3-8 8-8 8 3 8 8-3 9-8 9ZM9 9h.01M15 9h.01M12 13h.01"],
    ["PlantFruit", "M12 21c-5 0-8-4-8-9s3-8 8-8 8 3 8 8-3 9-8 9ZM12 4c0-2 2-3 4-2"],
    ["PlantApple", "M12 8c-5 0-7 4-7 8s3 6 7 6 7-2 7-6-2-8-7-8ZM12 8c0-2 1-4 3-5M12 8c0-2-1-4-3-5"],
    ["PlantCherry", "M12 21c-3-6-3-12 0-16M12 21c3-6 3-12 0-16M9 21a3 3 0 1 0 0 .01M15 21a3 3 0 1 0 0 .01"],
    ["PlantGrape", "M12 7a2 2 0 1 0 0 .01M9 10a2 2 0 1 0 0 .01M15 10a2 2 0 1 0 0 .01M12 13a2 2 0 1 0 0 .01M9 16a2 2 0 1 0 0 .01M15 16a2 2 0 1 0 0 .01M12 19a2 2 0 1 0 0 .01M13 6c1-2 3-3 5-3"],
    ["PlantOrange", "M12 8a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM12 8c0-2 1-4 3-5"],
    ["PlantLemon", "M8 10a6 6 0 1 0 8 8 6 6 0 0 0-8-8ZM8 10 5 7M16 18l3 3"],
    ["PlantWatermelon", "M4 20a12 12 0 0 1 16-16 12 12 0 0 1-16 16ZM8 16c1-4 4-7 8-8"],
    ["PlantCarrot", "M12 21 6 15c0-6 4-12 10-12 0 6-4 12-4 18ZM9 9l4 4M12 6l3 3"],
    ["PlantPotato", "M12 6c-5 0-8 3-8 7s3 7 8 7 8-3 8-7-3-7-8-7ZM8 11h.01M15 14h.01M12 17h.01"],
    ["PlantWheat", "M12 21V5M12 9c-3 0-4-2-4-4 3 0 4 2 4 4ZM12 9c3 0 4-2 4-4-3 0-4 2-4 4ZM12 14c-3 0-4-2-4-4 3 0 4 2 4 4ZM12 14c3 0 4-2 4-4-3 0-4 2-4 4Z"],
] as const;

/**
 * Plant icon names.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: PlantIconName = "PlantTree";
 */
export type PlantIconName = (typeof specs)[number][0];

export const plantIcons: Record<PlantIconName, Icon> = Object.fromEntries(
    specs.map(
        ([name, d]: (typeof specs)[number]): [PlantIconName, Icon] => [
            name,
            createIcon(name, <path d={d} />),
        ],
    ),
) as Record<PlantIconName, Icon>;
