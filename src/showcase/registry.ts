import type { FC } from "react";
import { demoAnchor } from "./anchors";
import {
    topLevelComponents,
    topLevelComponentSections,
    type ComponentRecord,
    type ComponentSection,
} from "./componentCatalogue";
import ButtonsPage from "./pages/components/ButtonsPage";
import CardsPage from "./pages/components/CardsPage";
import ChoicesPage from "./pages/components/ChoicesPage";
import DialogsPage from "./pages/components/DialogsPage";
import DiscussionPage from "./pages/components/DiscussionPage";
import FeedbackPage from "./pages/components/FeedbackPage";
import LayoutPage from "./pages/components/LayoutPage";
import ListVariantsPage from "./pages/components/ListVariantsPage";
import MessagingPage from "./pages/components/MessagingPage";
import MessageMenusPage from "./pages/components/MessageMenusPage";
import NavigationPage from "./pages/components/NavigationPage";
import OverlaysPage from "./pages/components/OverlaysPage";
import OverviewPage from "./pages/components/OverviewPage";
import PickersPage from "./pages/components/PickersPage";
import PrimitivesPage from "./pages/components/PrimitivesPage";
import ProvidersPage from "./pages/components/ProvidersPage";
import TextFieldsPage from "./pages/components/TextFieldsPage";
import TextPage from "./pages/components/TextPage";
import TransferPage from "./pages/components/TransferPage";
import ColourPage from "./pages/foundations/ColourPage";
import ElevationPage from "./pages/foundations/ElevationPage";
import IconsPage from "./pages/foundations/IconsPage";
import MotionPage from "./pages/foundations/MotionPage";
import ShapePage from "./pages/foundations/ShapePage";
import SpacingPage from "./pages/foundations/SpacingPage";
import TypographyPage from "./pages/foundations/TypographyPage";

/**
 * What an entry documents.
 * Type: type alias.
 * Values: `foundation` (tokens and primitives), `component` (one public UI
 * component), or `family` (a whole family page with every demo).
 * @example
 * const kind: ShowcaseEntryKind = "component";
 */
export type ShowcaseEntryKind = "foundation" | "component" | "family";

/**
 * One selectable documentation entry.
 * Type: interface.
 * Fields: id, label, title, description, page, kind, familyId, anchor, demoTitle.
 * @example
 * const entry: ShowcaseEntry = {
 *     id: "tag",
 *     label: "Tag",
 *     title: "Tag",
 *     description: "Small removable label for categories, states, and filters.",
 *     page: FeedbackPage,
 *     kind: "component",
 *     familyId: "feedback",
 *     anchor: "demo-chips-and-identity",
 *     demoTitle: "Chips and identity",
 * };
 */
export interface ShowcaseEntry {
    id: string;
    label: string;
    title: string;
    description: string;
    page: FC;
    kind: ShowcaseEntryKind;
    familyId?: string;
    anchor?: string;
    demoTitle?: string;
}

/**
 * A named subgroup inside a sidebar group.
 * Sections keep a 100-plus-item Components group navigable while the mobile
 * select still lists every entry.
 * Type: interface.
 * Fields: id, label, entries.
 * @example
 * const section: ShowcaseSection = { id: "inputs", label: "Inputs", entries: [] };
 */
export interface ShowcaseSection {
    id: string;
    label: string;
    entries: readonly ShowcaseEntry[];
}

/**
 * A top-level sidebar group made of labelled sections.
 * Type: interface.
 * Fields: id, label, sections.
 * @example
 * const group: ShowcaseGroup = { id: "components", label: "Components", sections: [] };
 */
export interface ShowcaseGroup {
    id: string;
    label: string;
    sections: readonly ShowcaseSection[];
}

/**
 * Static metadata for a family page.
 * Type: interface.
 * Fields: id, label, title, description, page.
 * @example
 * const family: FamilyRecord = { id: "feedback", label: "Feedback", ... };
 */
interface FamilyRecord {
    id: string;
    label: string;
    title: string;
    description: string;
    page: FC;
}

/**
 * A page that collects demos for a family of components.
 * Every family keeps its historical hash id so existing bookmarks still land
 * on the same content. `text` and `transfer` are families whose page covers a
 * single component, so those ids belong to the component entry itself.
 * Type: constant.
 * Fields: id, label, title, description, page.
 * @example
 * const feedback: string = familyRecords.find((record) => record.id === "feedback")?.label ?? "";
 */
const familyRecords: readonly FamilyRecord[] = [
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
        description: "Time, date-time, number, colour, cycle, variant, file, and image selection.",
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
        description: "Linear, constraint, grid, waterfall, table, list, tree, pager, and drawer layouts.",
        page: LayoutPage,
    },
    {
        id: "cards",
        label: "Cards",
        title: "Cards and surfaces",
        description: "The three-layer surface and the editorial card.",
        page: CardsPage,
    },
    {
        id: "providers",
        label: "Providers",
        title: "Theme, locale, and animation providers",
        description: "Scoped configuration for theme, internationalisation, animation, and toasts.",
        page: ProvidersPage,
    },
    {
        id: "primitives",
        label: "Primitives",
        title: "Primitives",
        description: "Low-level layers, portals, and visual utilities used by larger components.",
        page: PrimitivesPage,
    },
    {
        id: "list-variants",
        label: "List & tree presets",
        title: "List and tree presets",
        description: "Selection presets that wrap List and Tree in a fixed behaviour.",
        page: ListVariantsPage,
    },
    {
        id: "message-menus",
        label: "Message menus",
        title: "Contact and message menus",
        description: "Context menus specialised for contact rows and message rows.",
        page: MessageMenusPage,
    },
];

/**
 * Finds the metadata for a family page.
 * @param id - Family id.
 * @example
 * const family: FamilyRecord = familyOf("feedback");
 * @returns The matching family record.
 */
const familyOf: (id: string) => FamilyRecord = (id: string): FamilyRecord => {
    const match: FamilyRecord | void = familyRecords.find(
        (record: FamilyRecord): boolean => record.id === id,
    );

    if (match === (void 0)) {
        throw new Error(`Unknown showcase family: ${id}`);
    }

    return match;
};

/**
 * Turns a family record into a routable entry.
 * @param record - Family metadata.
 * @example
 * const entry: ShowcaseEntry = familyEntryOf(familyOf("feedback"));
 * @returns The family entry.
 */
const familyEntryOf: (record: FamilyRecord) => ShowcaseEntry = (record: FamilyRecord): ShowcaseEntry => ({
    id: record.id,
    label: record.label,
    title: record.title,
    description: record.description,
    page: record.page,
    kind: "family",
});

/**
 * Foundation entries: the tokens and primitives underneath every component.
 * Type: constant.
 * Fields: id, label, title, description, page, kind.
 * @example
 * const first: string = foundationEntries[0].id;
 */
export const foundationEntries: readonly ShowcaseEntry[] = [
    {
        id: "colours",
        label: "Colour",
        title: "Colour",
        description: "Material colour roles, their token names, and the palette behind every surface.",
        page: ColourPage,
        kind: "foundation",
    },
    {
        id: "typography",
        label: "Typography",
        title: "Typography",
        description: "One type scale from display to mono, with stable line heights.",
        page: TypographyPage,
        kind: "foundation",
    },
    {
        id: "spacing",
        label: "Spacing",
        title: "Spacing",
        description: "A 4px base rhythm exposed as space tokens.",
        page: SpacingPage,
        kind: "foundation",
    },
    {
        id: "shape",
        label: "Shape",
        title: "Shape",
        description: "Small radii for controls, larger radii for sheets and surfaces.",
        page: ShapePage,
        kind: "foundation",
    },
    {
        id: "elevation",
        label: "Elevation",
        title: "Elevation",
        description: "Three soft heights for menus, cards, and dialogs.",
        page: ElevationPage,
        kind: "foundation",
    },
    {
        id: "motion",
        label: "Motion",
        title: "Motion",
        description: "Short, decelerating transitions with the same rhythm everywhere.",
        page: MotionPage,
        kind: "foundation",
    },
    {
        id: "icons",
        label: "Icons",
        title: "Icons",
        description: "The complete icon set, with search, categories, and copyable names.",
        page: IconsPage,
        kind: "foundation",
    },
];

/**
 * One entry per public UI component, generated from the inventory.
 * The component name is the entry title, so the page header always names the
 * selected component while the shared family page keeps every demo and code
 * sample intact.
 * Type: constant.
 * Fields: id, label, title, description, page, kind, familyId, anchor, demoTitle.
 * @example
 * const tag: ShowcaseEntry | void = componentEntries.find((entry) => entry.id === "tag");
 */
export const componentEntries: readonly ShowcaseEntry[] = topLevelComponents.map(
    (component: ComponentRecord): ShowcaseEntry => {
        const family: FamilyRecord = familyOf(component.family);

        return {
            id: component.id,
            label: component.name,
            title: component.name,
            description: component.description,
            page: family.page,
            kind: "component",
            familyId: family.id,
            anchor: demoAnchor(component.demo),
            demoTitle: component.demo,
        };
    },
);

/**
 * Lookup from a component id to its generated entry.
 * Type: constant.
 * @example
 * const entry: ShowcaseEntry | void = componentEntryById.get("tag");
 */
const componentEntryById: ReadonlyMap<string, ShowcaseEntry> = new Map<string, ShowcaseEntry>(
    componentEntries.map((entry: ShowcaseEntry): [string, ShowcaseEntry] => [entry.id, entry]),
);

/**
 * Component sections in sidebar order, resolved to their generated entries.
 * Type: constant.
 * Fields: id, label, entries.
 * @example
 * const inputs: ShowcaseSection = componentSections[1];
 */
const componentSections: readonly ShowcaseSection[] = topLevelComponentSections.map(
    (section: ComponentSection): ShowcaseSection => ({
        id: section.id,
        label: section.label,
        entries: section.components.map((component: ComponentRecord): ShowcaseEntry => {
            const entry: ShowcaseEntry | void = componentEntryById.get(component.id);

            if (entry === (void 0)) {
                throw new Error(`Missing showcase entry for component: ${component.name}`);
            }

            return entry;
        }),
    }),
);

/**
 * Sidebar groups in display order.
 * Foundations keeps its token pages plus the component overview; Components
 * is split into Actions through Primitives and holds exactly one entry per UI
 * component. The historical family pages remain reachable through the
 * component entries that reuse them and through the hash aliases below.
 * Type: constant.
 * Fields: id, label, sections.
 * @example
 * const label: string = showcaseGroups[0].label;
 */
export const showcaseGroups: readonly ShowcaseGroup[] = [
    {
        id: "foundations",
        label: "Foundations",
        sections: [
            {
                id: "start",
                label: "Start here",
                entries: [familyEntryOf(familyOf("overview"))],
            },
            { id: "tokens", label: "Tokens", entries: foundationEntries },
        ],
    },
    {
        id: "components",
        label: "Components",
        sections: componentSections,
    },
];

/**
 * Every entry, flattened in sidebar order.
 * Type: constant.
 * Fields: id, label, title, description, page, kind, familyId, anchor, demoTitle.
 * @example
 * const count: number = showcaseEntries.length;
 */
export const showcaseEntries: readonly ShowcaseEntry[] = showcaseGroups.flatMap(
    (group: ShowcaseGroup): readonly ShowcaseEntry[] =>
        group.sections.flatMap(
            (section: ShowcaseSection): readonly ShowcaseEntry[] => section.entries,
        ),
);

/**
 * Entry shown when the URL has no hash or an unknown one.
 * @example
 * window.location.hash = `#${defaultEntryId}`;
 */
export const defaultEntryId: string = "overview";

/**
 * Alias pairs: an alternative hash and the entry id it resolves to.
 * Pairs are used instead of an object literal because several aliases contain
 * hyphens, which the house naming convention forbids on object properties.
 * Type: constant.
 * Fields: alias hash, target entry id.
 * @example
 * const target: string = aliasEntries[0][1];
 */
const aliasEntries: ReadonlyArray<readonly [string, string]> = [
    ["components", "overview"],
    ["top", defaultEntryId],
    ["buttons", "button"],
    ["text-fields", "text-input"],
    ["pickers", "time-picker"],
    ["choices", "checkbox"],
    ["discussion", "comment-thread"],
    ["messaging", "contact"],
    ["overlays", "dropdown"],
    ["navigation", "tabs"],
    ["feedback", "alert"],
    ["dialogs", "dialog"],
    ["layout", "linear-layout"],
    ["cards", "card"],
    ["color", "colours"],
    ["colors", "colours"],
    ["palette", "colours"],
    ["fonts", "typography"],
    ["spaces", "spacing"],
    ["shadows", "elevation"],
    ["animations", "motion"],
    ["textfield", "text-input"],
    ["textfields", "text-input"],
    ["textinput", "text-input"],
    ["textarea", "text-area"],
    ["email", "email-input"],
    ["phone", "telephone-input"],
    ["telephone", "telephone-input"],
    ["numberinput", "number-input"],
    ["numberfield", "number-input"],
    ["autocomplete", "complete-input"],
    ["datetimepicker", "date-time-picker"],
    ["datetime-picker", "date-time-picker"],
    ["datepicker", "date-time-picker"],
    ["timepicker", "time-picker"],
    ["cyclepicker", "cycle-picker"],
    ["colourpicker", "colour-picker"],
    ["color-picker", "colour-picker"],
    ["variantpicker", "variant-picker"],
    ["radios", "radio-group"],
    ["radiogroup", "radio-group"],
    ["toggle", "switch"],
    ["slider", "range"],
    ["fieldgroup", "field-group"],
    ["fullscreenloading", "fullscreen-loading"],
    ["full-screen-loading", "fullscreen-loading"],
    ["loading", "fullscreen-loading"],
    ["useload", "use-load"],
    ["toast", "toast-provider"],
    ["toasts", "toast-provider"],
    ["toastprovider", "toast-provider"],
    ["themeprovider", "theme"],
    ["theme-provider", "theme"],
    ["themes", "theme"],
    ["i18n", "international"],
    ["intl", "international"],
    ["locale", "international"],
    ["internationalization", "international"],
    ["internationalisation", "international"],
    ["animate", "animated"],
    ["animation-provider", "animation"],
    ["tablayout", "tabs"],
    ["tab-layout", "tabs"],
    ["tab", "tabs"],
    ["tabpanel", "tab-panel"],
    ["avatars", "avatar"],
    ["avatargroup", "avatar-group"],
    ["tags", "tag"],
    ["badges", "badge"],
    ["chips", "chip"],
    ["contextmenu", "context-menu"],
    ["context-menus", "context-menu"],
    ["contextmenuitem", "context-menu-item"],
    ["contextmenugroup", "context-menu-group"],
    ["contextmenuseparator", "context-menu-separator"],
    ["menuitem", "menu-item"],
    ["menugroup", "menu-group"],
    ["menuseparator", "menu-separator"],
    ["dropdownitem", "dropdown-item"],
    ["dropdowngroup", "dropdown-group"],
    ["dropdownseparator", "dropdown-separator"],
    ["projectmanager", "project-manager"],
    ["previeweditor", "preview"],
    ["preview-editor", "preview"],
    ["filetools", "preview"],
    ["navigationview", "navigation-view"],
    ["drawerlayout", "drawer-layout"],
    ["linearlayout", "linear-layout"],
    ["linearlayoutitem", "linear-layout-item"],
    ["gridlayout", "grid-layout"],
    ["waterfall", "waterfall-layout"],
    ["waterfalllayout", "waterfall-layout"],
    ["constraintlayout", "constraint-layout"],
    ["pagerpage", "page"],
    ["pager-page", "page"],
    ["progressbar", "progress"],
    ["progressring", "progress-ring"],
    ["circularprogress", "circular-progress"],
    ["elementloading", "element-loading"],
    ["skeletonloader", "skeleton"],
    ["visuallyhidden", "visually-hidden"],
    ["screen-reader-only", "visually-hidden"],
    ["statelayer", "state-layer"],
    ["bottomnavigation", "navigation-view"],
    ["breadcrumb", "breadcrumbs"],
    ["confirmdialog", "confirm-dialog"],
    ["messagedialog", "message-dialog"],
    ["inputdialog", "input-dialog"],
    ["checktree", "check-tree"],
    ["selecttree", "select-tree"],
    ["virtualtree", "virtual-tree"],
    ["virtuallist", "virtual-list"],
    ["virtualselect", "virtual-select"],
    ["virtualchat", "virtual-chat"],
    ["virtualcontact", "virtual-contact"],
    ["virtualmessagelist", "virtual-message-list"],
    ["messagelist", "message-list"],
    ["commentthread", "comment-thread"],
    ["emptystate", "empty-state"],
    ["modal", "dialog"],
];

/**
 * Older, alternative, or friendlier hash values that still resolve to an entry.
 * Existing family hashes (`#buttons`, `#pickers`, `#feedback`, and the rest)
 * are real entry ids and need no alias; these cover the new component ids and
 * the spellings readers are likely to type.
 * @example
 * const target: string = entryAliases.components;
 */
export const entryAliases: Readonly<Record<string, string>> = Object.fromEntries(aliasEntries);

/**
 * Resolves a raw hash into a known entry id.
 * Unknown hashes fall back to the first entry so a stale bookmark still lands
 * on a valid page.
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
 * Finds the sidebar section that owns an entry.
 * @param id - Entry id.
 * @example
 * const section: ShowcaseSection = findSection("buttons");
 * @returns The owning section, or the first section.
 */
export const findSection: (id: string) => ShowcaseSection = (id: string): ShowcaseSection => {
    const sections: readonly ShowcaseSection[] = showcaseGroups.flatMap(
        (group: ShowcaseGroup): readonly ShowcaseSection[] => group.sections,
    );
    const match: ShowcaseSection | null =
        sections.find((section: ShowcaseSection): boolean =>
            section.entries.some((entry: ShowcaseEntry): boolean => entry.id === id),
        ) ?? null;

    return match ?? (sections[0] as ShowcaseSection);
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
            group.sections.some((section: ShowcaseSection): boolean =>
                section.entries.some((entry: ShowcaseEntry): boolean => entry.id === id),
            ),
        ) ?? null;

    return match ?? (showcaseGroups[0] as ShowcaseGroup);
};
