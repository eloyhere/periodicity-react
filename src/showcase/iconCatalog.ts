import type { IconName } from "../component/icon/Icon";
import { actionIcons } from "../component/icon/action";
import { agentIcons } from "../component/icon/agent";
import { animalIcons } from "../component/icon/animal";
import { businessIcons } from "../component/icon/business";
import { celebrationIcons } from "../component/icon/celebration";
import { communicationIcons } from "../component/icon/communication";
import { companyIcons } from "../component/icon/company";
import { deviceIcons } from "../component/icon/device";
import { educationIcons } from "../component/icon/education";
import { emotionIcons } from "../component/icon/emotion";
import { fileIcons } from "../component/icon/file";
import { financeIcons } from "../component/icon/finance";
import { foodIcons } from "../component/icon/food";
import { healthIcons } from "../component/icon/health";
import { interactionIcons } from "../component/icon/interaction";
import { mediaIcons } from "../component/icon/media";
import { musicIcons } from "../component/icon/music";
import { natureIcons } from "../component/icon/nature";
import { securityIcons } from "../component/icon/security";
import { socialIcons } from "../component/icon/social";
import { sportIcons } from "../component/icon/sport";
import { timeIcons } from "../component/icon/time";
import { toolIcons } from "../component/icon/tool";
import { transportIcons } from "../component/icon/transport";
import { travelIcons } from "../component/icon/travel";
import { uiIcons } from "../component/icon/ui";
import { weatherIcons } from "../component/icon/weather";
import { motionIcons } from "../component/icon/motion";
import { mathIcons } from "../component/icon/math";
import { liveIcons } from "../component/icon/live";
import { dynamicIcons } from "../component/icon/dynamic";
import { motionExtraIcons } from "../component/icon/motion-extra";
import { liveExtraIcons } from "../component/icon/live-extra";
import { dynamicExtraIcons } from "../component/icon/dynamic-extra";
import { computerIcons } from "../component/icon/computer";
import { programmingIcons } from "../component/icon/programming";
import { electronicsIcons } from "../component/icon/electronics";
import { plantIcons } from "../component/icon/plant";
/**
 * One searchable entry in the icon catalogue.
 * Type: interface.
 * Fields: name, category.
 * @example
 * const entry: IconCatalogEntry = { name: "Close", category: "Action" };
 */
export interface IconCatalogEntry {
    name: IconName;
    category: string;
}

/**
 * Every icon exposed by the library, grouped by category.
 * Type: constant.
 * Fields: name, category.
 * @example
 * const count: number = iconCatalog.length;
 */
export const iconCatalog: IconCatalogEntry[] = [
    ...Object.keys(actionIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Action" })),
    ...Object.keys(agentIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Agent" })),
    ...Object.keys(animalIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Animal" })),
    ...Object.keys(businessIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Business" })),
    ...Object.keys(celebrationIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Celebration" })),
    ...Object.keys(communicationIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Communication" })),
    ...Object.keys(companyIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Company" })),
    ...Object.keys(deviceIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Device" })),
    ...Object.keys(educationIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Education" })),
    ...Object.keys(emotionIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Emotion" })),
    ...Object.keys(fileIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "File" })),
    ...Object.keys(financeIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Finance" })),
    ...Object.keys(foodIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Food" })),
    ...Object.keys(healthIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Health" })),
    ...Object.keys(interactionIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Interaction" })),
    ...Object.keys(mediaIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Media" })),
    ...Object.keys(musicIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Music" })),
    ...Object.keys(natureIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Nature" })),
    ...Object.keys(securityIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Security" })),
    ...Object.keys(socialIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Social" })),
    ...Object.keys(sportIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Sport" })),
    ...Object.keys(timeIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Time" })),
    ...Object.keys(toolIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Tool" })),
    ...Object.keys(transportIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Transport" })),
    ...Object.keys(travelIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Travel" })),
    ...Object.keys(uiIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Ui" })),
    ...Object.keys(weatherIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Weather" })),
    ...Object.keys(motionIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Motion" })),
    ...Object.keys(mathIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Math" })),
    ...Object.keys(liveIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Live" })),
    ...Object.keys(dynamicIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Dynamic" })),
    ...Object.keys(motionExtraIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "MotionExtra" })),
    ...Object.keys(liveExtraIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "LiveExtra" })),
    ...Object.keys(dynamicExtraIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "DynamicExtra" })),
    ...Object.keys(computerIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Computer" })),
    ...Object.keys(programmingIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Programming" })),
    ...Object.keys(electronicsIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Electronics" })),
    ...Object.keys(plantIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Plant" })),
];

/**
 * Category names in display order.
 * Type: constant.
 * Fields: none.
 * @example
 * const categories: string[] = iconCategories;
 */
export const iconCategories: string[] = Array.from(
    new Set<string>(iconCatalog.map((entry: IconCatalogEntry): string => entry.category)),
);

/**
 * One broad icon group shown in the Icon component page.
 * Type: interface.
 * Fields: id, label, categories, entries.
 * @example
 * const group: IconGroup = iconGroups[0];
 */
export interface IconGroup {
    readonly id: string;
    readonly label: string;
    readonly categories: readonly string[];
    readonly entries: IconCatalogEntry[];
}

/**
 * Broad groups that combine the internal categories into task-oriented sets.
 * Every internal category belongs to exactly one group.
 * Type: constant.
 * Fields: id, label, categories, entries.
 * @example
 * const math: IconGroup = iconGroups.find((group) => group.id === "math");
 */
export const iconGroups: readonly IconGroup[] = [
    {
        id: "company",
        label: "Company",
        categories: ["Business", "Finance", "File", "Tool"],
    },
    {
        id: "brand",
        label: "Brand",
        categories: ["Company"],
    },
    {
        id: "life",
        label: "Life",
        categories: [
            "Celebration",
            "Education",
            "Emotion",
            "Food",
            "Health",
            "Music",
            "Nature",
            "Sport",
            "Travel",
            "Weather",
        ],
    },
    {
        id: "animal",
        label: "Animal",
        categories: ["Animal"],
    },
    {
        id: "plant",
        label: "Plant",
        categories: ["Plant"],
    },
    {
        id: "interaction",
        label: "Interaction",
        categories: [
            "Action",
            "Communication",
            "Device",
            "Interaction",
            "Media",
            "Security",
            "Social",
            "Time",
            "Transport",
            "Ui",
        ],
    },
    {
        id: "agent",
        label: "Agent",
        categories: ["Agent"],
    },
    {
        id: "motion",
        label: "Motion",
        categories: ["Motion", "MotionExtra"],
    },
    {
        id: "live",
        label: "Live",
        categories: ["Live", "LiveExtra"],
    },
    {
        id: "dynamic",
        label: "Dynamic",
        categories: ["Dynamic", "DynamicExtra"],
    },
    {
        id: "programming",
        label: "Programming",
        categories: ["Programming"],
    },
    {
        id: "computer",
        label: "Computer",
        categories: ["Computer"],
    },
    {
        id: "electronics",
        label: "Electronics",
        categories: ["Electronics"],
    },
    {
        id: "math",
        label: "Math",
        categories: ["Math"],
    },
].map(
    (group: Omit<IconGroup, "entries">): IconGroup => ({
        ...group,
        entries: iconCatalog.filter(
            (entry: IconCatalogEntry): boolean => group.categories.includes(entry.category),
        ),
    }),
);
