import type { FC } from "react";
import ColourPage from "./pages/foundations/ColourPage";
import ElevationPage from "./pages/foundations/ElevationPage";
import IconsPage from "./pages/foundations/IconsPage";
import MotionPage from "./pages/foundations/MotionPage";
import ShapePage from "./pages/foundations/ShapePage";
import SpacingPage from "./pages/foundations/SpacingPage";
import TypographyPage from "./pages/foundations/TypographyPage";
import ButtonsPage from "./pages/components/ButtonsPage";
import CardsPage from "./pages/components/CardsPage";
import ChoicesPage from "./pages/components/ChoicesPage";
import DialogsPage from "./pages/components/DialogsPage";
import DiscussionPage from "./pages/components/DiscussionPage";
import FeedbackPage from "./pages/components/FeedbackPage";
import FileToolsPage from "./pages/components/FileToolsPage";
import LayoutPage from "./pages/components/LayoutPage";
import MessagingPage from "./pages/components/MessagingPage";
import NavigationPage from "./pages/components/NavigationPage";
import OverlaysPage from "./pages/components/OverlaysPage";
import OverviewPage from "./pages/components/OverviewPage";
import PickersPage from "./pages/components/PickersPage";
import ProjectPage from "./pages/components/ProjectPage";
import TextFieldsPage from "./pages/components/TextFieldsPage";
import TextPage from "./pages/components/TextPage";
import TransferPage from "./pages/components/TransferPage";

/**
 * One selectable documentation entry.
 * Type: interface.
 * Fields: id, label, title, description, page.
 * @example
 * const entry: ShowcaseEntry = {
 *     id: "tag",
 *     label: "Tag",
 *     title: "Tag",
 *     description: "Compact labels for categories and states.",
 *     page: TagPage,
 * };
 */
export interface ShowcaseEntry {
    id: string;
    label: string;
    title: string;
    description: string;
    page: FC;
}

/**
 * A named group of entries in the sidebar.
 * Type: interface.
 * Fields: id, label, entries.
 * @example
 * const group: ShowcaseGroup = { id: "components", label: "Components", entries: [] };
 */
export interface ShowcaseGroup {
    id: string;
    label: string;
    entries: readonly ShowcaseEntry[];
}

/**
 * Foundation entries: the tokens and primitives underneath every component.
 * Type: constant.
 * Fields: id, label, title, description, page.
 * @example
 * const first: string = foundationEntries[0].id;
 */
export const foundationEntries: readonly ShowcaseEntry[] = [
    {
        id: "colours",
        label: "Colour",
        title: "Colour",
        description:
            "Material colour roles, their token names, and the palette behind every surface.",
        page: ColourPage,
    },
    {
        id: "typography",
        label: "Typography",
        title: "Typography",
        description: "One type scale from display to mono, with stable line heights.",
        page: TypographyPage,
    },
    {
        id: "spacing",
        label: "Spacing",
        title: "Spacing",
        description: "A 4px base rhythm exposed as space tokens.",
        page: SpacingPage,
    },
    {
        id: "shape",
        label: "Shape",
        title: "Shape",
        description: "Small radii for controls, larger radii for sheets and surfaces.",
        page: ShapePage,
    },
    {
        id: "elevation",
        label: "Elevation",
        title: "Elevation",
        description: "Three soft heights for menus, cards, and dialogs.",
        page: ElevationPage,
    },
    {
        id: "motion",
        label: "Motion",
        title: "Motion",
        description: "Short, decelerating transitions with the same rhythm everywhere.",
        page: MotionPage,
    },
    {
        id: "icons",
        label: "Icons",
        title: "Icons",
        description: "The complete icon set, with search, categories, and copyable names.",
        page: IconsPage,
    },
];

/**
 * Component entries: one page per implemented component family.
 * Type: constant.
 * Fields: id, label, title, description, page.
 * @example
 * const overviewId: string = componentEntries[0].id;
 */
export const componentEntries: readonly ShowcaseEntry[] = [
    {
        id: "overview",
        label: "Overview",
        title: "Components overview",
        description: "Every public building block, grouped by the job it does and linked to its own entry.",
        page: OverviewPage,
    },
    {
        id: "buttons",
        label: "Buttons",
        title: "Buttons",
        description: "Solid, outline, ghost, and quiet actions with a foreground ripple.",
        page: ButtonsPage,
    },
    {
        id: "text",
        label: "Text",
        title: "Text",
        description: "The typographic scale rendered as live text, with semantic tones.",
        page: TextPage,
    },
    {
        id: "text-fields",
        label: "Text fields",
        title: "Text fields",
        description: "Outlined, filled, and standard fields with floating labels and helpers.",
        page: TextFieldsPage,
    },
    {
        id: "pickers",
        label: "Pickers",
        title: "Pickers",
        description: "Time, date-time, number, colour, and variant selection.",
        page: PickersPage,
    },
    {
        id: "choices",
        label: "Choices",
        title: "Choices",
        description: "Checkboxes, radios, ranges, number inputs, and switches.",
        page: ChoicesPage,
    },
    {
        id: "discussion",
        label: "Discussion",
        title: "Discussion",
        description: "Threaded comments with references, mentions, and empty states.",
        page: DiscussionPage,
    },
    {
        id: "transfer",
        label: "Transfer",
        title: "Transfer",
        description: "Two-pane selection backed by list adapters, with a virtual mode.",
        page: TransferPage,
    },
    {
        id: "messaging",
        label: "Messaging",
        title: "Messaging",
        description: "Contacts, transcripts, and full conversation layouts.",
        page: MessagingPage,
    },
    {
        id: "project",
        label: "Project",
        title: "Project manager",
        description: "File trees, dependency graphs, previews, imports, and exports for a project.",
        page: ProjectPage,
    },
    {
        id: "file-tools",
        label: "Preview & editor",
        title: "Preview & editor",
        description: "Tokenised file previews and a debounced N-gram completion editor.",
        page: FileToolsPage,
    },
    {
        id: "overlays",
        label: "Overlays",
        title: "Overlays",
        description: "Dropdowns, menus, popovers, tooltips, and context menus.",
        page: OverlaysPage,
    },
    {
        id: "navigation",
        label: "Navigation",
        title: "Navigation",
        description: "Breadcrumbs, tabs, accordions, pagination, steppers, and navigation views.",
        page: NavigationPage,
    },
    {
        id: "feedback",
        label: "Feedback",
        title: "Content and feedback",
        description: "Chips, avatars, progress, skeletons, alerts, ratings, and empty states.",
        page: FeedbackPage,
    },
    {
        id: "dialogs",
        label: "Dialogs",
        title: "Dialogs, drawers, and toasts",
        description: "Modal layers with focus management, drawers, and live regions.",
        page: DialogsPage,
    },
    {
        id: "layout",
        label: "Layout",
        title: "Layout",
        description:
            "Linear, constraint, grid, waterfall, table, list, tree, pager, and drawer layouts.",
        page: LayoutPage,
    },
    {
        id: "cards",
        label: "Cards",
        title: "Cards and surfaces",
        description: "The three-layer surface and the editorial card.",
        page: CardsPage,
    },
];

/**
 * Sidebar groups in display order.
 * Type: constant.
 * Fields: id, label, entries.
 * @example
 * const label: string = showcaseGroups[0].label;
 */
export const showcaseGroups: readonly ShowcaseGroup[] = [
    { id: "foundations", label: "Foundations", entries: foundationEntries },
    { id: "components", label: "Components", entries: componentEntries },
];

/**
 * Every entry, flattened in sidebar order.
 * Type: constant.
 * Fields: id, label, title, description, page.
 * @example
 * const count: number = showcaseEntries.length;
 */
export const showcaseEntries: readonly ShowcaseEntry[] = showcaseGroups.flatMap(
    (group: ShowcaseGroup): readonly ShowcaseEntry[] => group.entries,
);

/**
 * Entry shown when the URL has no hash or an unknown one.
 * Type: constant.
 * @example
 * window.location.hash = `#${defaultEntryId}`;
 */
export const defaultEntryId: string = "colours";

/**
 * Older hash values that still need to resolve to an entry.
 * Type: constant.
 * Fields: legacy hash, entry id.
 * @example
 * const target: string = entryAliases.components;
 */
export const entryAliases: Readonly<Record<string, string>> = {
    components: "overview",
    top: defaultEntryId,
};

/**
 * Resolves a raw hash into a known entry id.
 * Unknown hashes fall back to the first foundation entry so a stale bookmark
 * still lands on a valid page.
 * @param hash - Raw `window.location.hash`, with or without the leading `#`.
 * @example
 * const id: string = resolveEntryId("#components");
 * @returns A known entry id.
 */
export const resolveEntryId: (hash: string) => string = (hash: string): string => {
    const raw: string = hash.replace(/^#/, "").trim().toLowerCase();

    if (raw.length === 0) {
        return defaultEntryId;
    }

    const alias: string = entryAliases[raw] ?? "";

    if (alias.length > 0) {
        return alias;
    }

    const match: ShowcaseEntry | null =
        showcaseEntries.find((entry: ShowcaseEntry): boolean => entry.id === raw) ?? null;

    return match === null ? defaultEntryId : match.id;
};

/**
 * Looks up an entry by id, falling back to the default entry.
 * @param id - Entry id.
 * @example
 * const entry: ShowcaseEntry = findEntry("buttons");
 * @returns The matching entry, or the default entry.
 */
export const findEntry: (id: string) => ShowcaseEntry = (id: string): ShowcaseEntry => {
    const match: ShowcaseEntry | null =
        showcaseEntries.find((entry: ShowcaseEntry): boolean => entry.id === id) ?? null;

    return match ?? (showcaseEntries[0] as ShowcaseEntry);
};

/**
 * Finds the sidebar group that owns an entry.
 * @param id - Entry id.
 * @example
 * const group: ShowcaseGroup = findGroup("buttons");
 * @returns The owning group, or the first group.
 */
export const findGroup: (id: string) => ShowcaseGroup = (id: string): ShowcaseGroup => {
    const match: ShowcaseGroup | null =
        showcaseGroups.find((group: ShowcaseGroup): boolean =>
            group.entries.some((entry: ShowcaseEntry): boolean => entry.id === id),
        ) ?? null;

    return match ?? (showcaseGroups[0] as ShowcaseGroup);
};
