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
    ...Object.keys(weatherIcons).map((name: string): IconCatalogEntry => ({ name: name as IconName, category: "Weather" })),];

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
