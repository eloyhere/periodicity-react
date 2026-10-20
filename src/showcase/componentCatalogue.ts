/**
 * Public UI component catalogue for the showcase sidebar.
 *
 * How the inventory was built
 * ---------------------------
 * The only source of truth is the public barrel `src/component/index.ts`.
 * A TypeScript program that reads that barrel reports 439 exported symbols:
 * 257 are type-only exports (interfaces, type aliases, and props), so they
 * cannot be rendered and are excluded automatically. The remaining 178 are
 * runtime values. Every runtime value was inspected and classified:
 *
 * - 118 are renderable UI components: function components, layout
 *   primitives, and providers whose public usage is JSX (`<Name />`).
 * - `useLoad` is a hook, but it owns the full-screen loading surface and the
 *   loading entry point, so it keeps its own entry (the task asks for it).
 * - 61 are hooks, adapters, parsers, validators, constants, fixture data, or
 *   React context objects. They are listed in `nonUiExportGroups` with the
 *   reason they were filtered out.
 * - 2 are duplicate aliases of components that already have an entry:
 *   `TabLayout` (alias of `Tabs`) and `Animate` (alias of `Animated`). They
 *   are listed in `duplicateAliasExports` and documented inside the entry of
 *   the component they alias.
 *
 * That gives 119 sidebar entries for 118 UI components plus `useLoad`.
 * `Icon` is used by the showcase but is intentionally absent: it is not
 * exported from the public barrel and is documented by the Icons foundation
 * entry instead.
 *
 * Each record names the existing family page and the exact `Demo` title that
 * documents the component, so a sidebar entry can scroll straight to live
 * coverage instead of duplicating demo JSX. Components without existing
 * coverage point at one of the dedicated pages added next to the family
 * pages (`providers`, `primitives`, `list-variants`, `message-menus`).
 *
 * Type: module.
 * Fields: component seeds, component records, sections, and filter metadata.
 * @example
 * const names: readonly string[] = uiComponents.map((component) => component.name);
 */

/**
 * One public UI component before its hash id is derived.
 * Type: interface.
 * Fields: name, family, demo, description.
 * @example
 * const seed: ComponentSeed = {
 *     name: "Tag",
 *     family: "feedback",
 *     demo: "Chips and identity",
 *     description: "Small removable label for categories, states, and filters.",
 * };
 */
export interface ComponentSeed {
    name: string;
    family: string;
    demo: string;
    description: string;
}

/**
 * A public UI component with the hash id derived from its export name.
 * Type: interface.
 * Fields: name, family, demo, description, id.
 * @example
 * const record: ComponentRecord = {
 *     name: "TextInput",
 *     id: "text-input",
 *     family: "text-fields",
 *     demo: "Field variants",
 *     description: "Material outlined, filled, and standard text field.",
 * };
 */
export interface ComponentRecord extends ComponentSeed {
    id: string;
}

/**
 * One navigable section of the Components group.
 * Type: interface.
 * Fields: id, label, components.
 * @example
 * const section: ComponentSection = { id: "inputs", label: "Inputs", components: [] };
 */
export interface ComponentSection {
    id: string;
    label: string;
    components: readonly ComponentRecord[];
}

/**
 * A group of runtime exports that are not UI components.
 * Type: interface.
 * Fields: kind, reason, names.
 * @example
 * const group: NonUiExportGroup = { kind: "Hooks", reason: "Called, not rendered.", names: [] };
 */
export interface NonUiExportGroup {
    kind: string;
    reason: string;
    names: readonly string[];
}

/**
 * Derives the stable hash id from a public export name.
 * Acronym boundaries are split before the lower-case conversion, so
 * `DateTimePicker` becomes `date-time-picker` and `useLoad` becomes `use-load`.
 * @param name - Public export name from the component barrel.
 * @example
 * const id: string = componentId("TextInput");
 * @returns The kebab-case hash id.
 */
export const componentId: (name: string) => string = (name: string): string =>
    name
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase();

/**
 * Adds the derived id to a component seed.
 * @param seed - Public name, family page, demo title, and description.
 * @example
 * const record: ComponentRecord = toRecord(seed);
 * @returns The component record with its hash id.
 */
const toRecord: (seed: ComponentSeed) => ComponentRecord = (seed: ComponentSeed): ComponentRecord => ({
    ...seed,
    id: componentId(seed.name),
});

/**
 * Builds one sidebar section from component seeds.
 * @param id - Section id.
 * @param label - Section label shown above its entries.
 * @param components - Component seeds in sidebar order.
 * @example
 * const inputs: ComponentSection = createSection("inputs", "Inputs", seeds);
 * @returns The section with derived component records.
 */
const createSection: (
    id: string,
    label: string,
    components: readonly ComponentSeed[],
) => ComponentSection = (
    id: string,
    label: string,
    components: readonly ComponentSeed[],
): ComponentSection => ({
    id,
    label,
    components: components.map(toRecord),
});

/**
 * Every UI component, grouped into the sidebar sections that keep a 119-item
 * list navigable. The order is deliberate: everyday controls come first and
 * infrastructure comes last.
 * Type: constant.
 * Fields: id, label, components.
 * @example
 * const firstSection: string = uiComponentSections[0].id;
 */
export const uiComponentSections: readonly ComponentSection[] = [
    createSection("actions", "Actions", [
        {
            name: "Button",
            family: "buttons",
            demo: "Buttons and ripple",
            description: "Solid, outline, ghost, and quiet actions with icon slots and a foreground ripple.",
        },
    ]),
    createSection("inputs", "Inputs", [
        {
            name: "TextInput",
            family: "text-fields",
            demo: "Field variants",
            description: "Outlined, filled, and standard text field with floating labels and helper slots.",
        },
        {
            name: "TextArea",
            family: "text-fields",
            demo: "Notes and selects",
            description: "Multi-line field with counter support in outline, fill, and standard variants.",
        },
        {
            name: "EmailInput",
            family: "text-fields",
            demo: "Autocomplete and contact fields",
            description: "Email field with a mail keyboard hint and shared email sanitising rules.",
        },
        {
            name: "TelephoneInput",
            family: "text-fields",
            demo: "Autocomplete and contact fields",
            description: "Telephone field with a tel keyboard hint and shared number sanitising rules.",
        },
        {
            name: "NumberInput",
            family: "choices",
            demo: "Radio, range, and number",
            description: "Numeric field with arrow-key stepping, bounds, and a nullable value.",
        },
        {
            name: "CompleteInput",
            family: "text-fields",
            demo: "Autocomplete and contact fields",
            description: "Free-text field that suggests matching options while the caller keeps the value.",
        },
        {
            name: "Mention",
            family: "discussion",
            demo: "Mention input",
            description: "Text field that opens a searchable mention list when the user types at-sign.",
        },
        {
            name: "Select",
            family: "text-fields",
            demo: "Notes and selects",
            description: "Single-choice listbox with outline, fill, and standard field variants.",
        },
        {
            name: "VirtualSelect",
            family: "text-fields",
            demo: "Virtual selects",
            description: "Windowed select for long option lists, rendering only the visible rows.",
        },
        {
            name: "Combobox",
            family: "text-fields",
            demo: "Notes and selects",
            description: "Filterable text and listbox hybrid with an optional virtual option list.",
        },
    ]),
    createSection("selection", "Selection", [
        {
            name: "Checkbox",
            family: "choices",
            demo: "Checkbox and switch",
            description: "Tri-state checkbox with label, description, error, and size options.",
        },
        {
            name: "Radio",
            family: "choices",
            demo: "Radio, range, and number",
            description: "Single radio option designed to sit inside a RadioGroup.",
        },
        {
            name: "RadioGroup",
            family: "choices",
            demo: "Radio, range, and number",
            description: "Grouped single-choice control with a fieldset label and orientation.",
        },
        {
            name: "Switch",
            family: "choices",
            demo: "Checkbox and switch",
            description: "On and off switch with a visible track, label, description, and sizes.",
        },
        {
            name: "Range",
            family: "choices",
            demo: "Radio, range, and number",
            description: "Stepped slider with bounds, custom formatting, and disabled or error states.",
        },
        {
            name: "Field",
            family: "choices",
            demo: "Field wrappers",
            description: "Label, hint, error, and counter chrome that wraps any native control.",
        },
        {
            name: "FieldGroup",
            family: "choices",
            demo: "Field wrappers",
            description: "Fieldset wrapper that groups related choices under one legend and hint.",
        },
    ]),
    createSection("pickers", "Pickers", [
        {
            name: "TimePicker",
            family: "pickers",
            demo: "Pickers",
            description: "24-hour time entry with a picker affordance and field chrome.",
        },
        {
            name: "DateTimePicker",
            family: "pickers",
            demo: "Pickers",
            description: "Combined date and time entry returning an ISO-like local value.",
        },
        {
            name: "NumberPicker",
            family: "pickers",
            demo: "Pickers",
            description: "Wheel-style numeric picker with bounded stepping and typed input.",
        },
        {
            name: "CyclePicker",
            family: "pickers",
            demo: "Pickers",
            description: "Looping option picker with typed autocomplete for a short cycle.",
        },
        {
            name: "ColourPicker",
            family: "pickers",
            demo: "Pickers",
            description: "Native colour input paired with a row of preset swatches.",
        },
        {
            name: "VariantPicker",
            family: "pickers",
            demo: "Pickers",
            description: "Radio-style chips for picking a variant swatch by name.",
        },
        {
            name: "Calendar",
            family: "pickers",
            demo: "Calendar",
            description: "Month grid with keyboard navigation, range limits, locale-aware labels, and native selection.",
        },
    ]),
    createSection("display", "Display", [
        {
            name: "Text",
            family: "text",
            demo: "Type scale",
            description: "The typographic scale rendered through one polymorphic component.",
        },
        {
            name: "Card",
            family: "cards",
            demo: "Cards and surfaces",
            description: "Editorial surface with eyebrow, media, footer, tone, and interactivity.",
        },
        {
            name: "Surface",
            family: "cards",
            demo: "Cards and surfaces",
            description: "The layered Material surface: background, component, and foreground.",
        },
        {
            name: "StateLayer",
            family: "primitives",
            demo: "State layer",
            description: "Hover, press, and focus tint painted above a surface background.",
        },
        {
            name: "Badge",
            family: "feedback",
            demo: "Badge tones",
            description: "Compact status label or count bubble with semantic tones.",
        },
        {
            name: "Tag",
            family: "feedback",
            demo: "Chips and identity",
            description: "Small removable label for categories, states, and filters.",
        },
        {
            name: "Chip",
            family: "feedback",
            demo: "Chips and identity",
            description: "Assist, filter, and input chips with icons and removal.",
        },
        {
            name: "Avatar",
            family: "feedback",
            demo: "Avatar sizes and statuses",
            description: "Identity mark with initials or image, size, tone, and presence.",
        },
        {
            name: "AvatarGroup",
            family: "feedback",
            demo: "Chips and identity",
            description: "Overlapping avatar stack with an overflow count.",
        },
        {
            name: "Divider",
            family: "feedback",
            demo: "Dividers",
            description: "Thin rule with optional inset and label variants.",
        },
        {
            name: "Timeline",
            family: "feedback",
            demo: "Rating and timeline",
            description: "Chronological record with item states, icons, and tones.",
        },
        {
            name: "Rate",
            family: "feedback",
            demo: "Rating and timeline",
            description: "Star rating with half values, read-only mode, and small or large sizes.",
        },
        {
            name: "EmptyState",
            family: "feedback",
            demo: "Empty state with an icon",
            description: "Centred empty message with icon, description, and action slots.",
        },
    ]),
    createSection("feedback", "Feedback", [
        {
            name: "Alert",
            family: "feedback",
            demo: "Alert tones",
            description: "Inline message with a title, description, icon, and semantic tone.",
        },
        {
            name: "Banner",
            family: "feedback",
            demo: "Alerts and banners",
            description: "Page-level announcement with an action and a dismissible state.",
        },
        {
            name: "Progress",
            family: "feedback",
            demo: "Progress tones and sizes",
            description: "Linear determinate or indeterminate progress with tone and size.",
        },
        {
            name: "CircularProgress",
            family: "feedback",
            demo: "Progress, spinners, and empty states",
            description: "Circular determinate or indeterminate progress with a label.",
        },
        {
            name: "ProgressRing",
            family: "feedback",
            demo: "Progress, spinners, and empty states",
            description: "Compact circular gauge for a single bounded value.",
        },
        {
            name: "Spinner",
            family: "feedback",
            demo: "Spinner sizes and skeletons",
            description: "Small rotating busy indicator in three sizes.",
        },
        {
            name: "Skeleton",
            family: "feedback",
            demo: "Spinner sizes and skeletons",
            description: "Placeholder shapes for text, rectangles, and circles while loading.",
        },
        {
            name: "ElementLoading",
            family: "feedback",
            demo: "Element and fullscreen loading",
            description: "Overlay that binds a spinner to one referenced element.",
        },
        {
            name: "FullscreenLoading",
            family: "feedback",
            demo: "Element and fullscreen loading",
            description: "Native-dialog loader that covers the viewport and accepts a duration.",
        },
        {
            name: "useLoad",
            family: "feedback",
            demo: "Element and fullscreen loading",
            description: "Imperative loader service with element, delay, and promise overloads.",
        },
    ]),
    createSection("overlays", "Overlays", [
        {
            name: "Dialog",
            family: "dialogs",
            demo: "Dialog",
            description: "Modal layer with focus management, sizes, headings, and footer slots.",
        },
        {
            name: "ConfirmDialog",
            family: "dialogs",
            demo: "Confirm, message, and input dialogs",
            description: "Confirmation modal with tone, confirm label, and an async-safe close.",
        },
        {
            name: "MessageDialog",
            family: "dialogs",
            demo: "Confirm, message, and input dialogs",
            description: "Announcement modal with one action and a close callback.",
        },
        {
            name: "InputDialog",
            family: "dialogs",
            demo: "Confirm, message, and input dialogs",
            description: "Single-line input modal with validation and submit handling.",
        },
        {
            name: "Drawer",
            family: "dialogs",
            demo: "Drawer",
            description: "Side or bottom sheet with placement, size, and slot content.",
        },
        {
            name: "Snackbar",
            family: "dialogs",
            demo: "Snackbar and toasts",
            description: "Transient bottom message with an optional action.",
        },
        {
            name: "ToastProvider",
            family: "providers",
            demo: "Toast provider",
            description: "Queue provider that renders toasts and exposes the useToast controller.",
        },
        {
            name: "Backdrop",
            family: "primitives",
            demo: "Backdrop",
            description: "Full-screen scrim with neutral or accent tone and optional blur.",
        },
    ]),
    createSection("menus", "Menus", [
        {
            name: "Dropdown",
            family: "overlays",
            demo: "Dropdown, menu, and popover",
            description: "Anchored dropdown panel with header, footer, empty, and item slots.",
        },
        {
            name: "DropdownItem",
            family: "overlays",
            demo: "Dropdown, menu, and popover",
            description: "One selectable row inside a dropdown, with icon and shortcut.",
        },
        {
            name: "DropdownGroup",
            family: "overlays",
            demo: "Dropdown, menu, and popover",
            description: "Labelled group of related dropdown items.",
        },
        {
            name: "DropdownSeparator",
            family: "overlays",
            demo: "Dropdown, menu, and popover",
            description: "Rule between dropdown groups.",
        },
        {
            name: "Menu",
            family: "overlays",
            demo: "Dropdown, menu, and popover",
            description: "Anchored menu with item groups, shortcuts, and Escape dismissal.",
        },
        {
            name: "MenuItem",
            family: "overlays",
            demo: "Dropdown, menu, and popover",
            description: "One action row inside a menu, with icon, shortcut, and disabled state.",
        },
        {
            name: "MenuGroup",
            family: "overlays",
            demo: "Dropdown, menu, and popover",
            description: "Labelled group of related menu items.",
        },
        {
            name: "MenuSeparator",
            family: "overlays",
            demo: "Dropdown, menu, and popover",
            description: "Rule between menu groups.",
        },
        {
            name: "ContextMenu",
            family: "overlays",
            demo: "Context menu",
            description: "Right-click and long-press menu with a heading and empty slot.",
        },
        {
            name: "ContextMenuGroup",
            family: "overlays",
            demo: "Context menu",
            description: "Labelled group inside a context menu.",
        },
        {
            name: "ContextMenuItem",
            family: "overlays",
            demo: "Context menu",
            description: "One action row inside a context menu, with icon and danger tone.",
        },
        {
            name: "ContextMenuSeparator",
            family: "overlays",
            demo: "Context menu",
            description: "Rule between context-menu groups.",
        },
        {
            name: "Popover",
            family: "overlays",
            demo: "Dropdown, menu, and popover",
            description: "Anchored dismissible panel for a small amount of content.",
        },
        {
            name: "Tooltip",
            family: "overlays",
            demo: "Tooltip placements",
            description: "Hover and focus hint positioned on any side of its child.",
        },
    ]),
    createSection("navigation", "Navigation", [
        {
            name: "Tabs",
            family: "navigation",
            demo: "Breadcrumbs and tabs",
            description: "Pill, line, and enclosed tab strip with controlled or default value.",
        },
        {
            name: "TabPanel",
            family: "navigation",
            demo: "Breadcrumbs and tabs",
            description: "Panel that shows only while its tab value is active.",
        },
        {
            name: "Accordion",
            family: "navigation",
            demo: "Accordion",
            description: "Expandable panels in single, multiple, or contained mode.",
        },
        {
            name: "Breadcrumbs",
            family: "navigation",
            demo: "Truncated breadcrumbs",
            description: "Trail of route links with truncation for long paths.",
        },
        {
            name: "Pagination",
            family: "navigation",
            demo: "Pagination and stepper",
            description: "Page controls with previous, next, and a bounded page count.",
        },
        {
            name: "Stepper",
            family: "navigation",
            demo: "Pagination and stepper",
            description: "Horizontal or vertical step indicator with clickable steps.",
        },
        {
            name: "NavigationView",
            family: "navigation",
            demo: "Navigation rail and bottom bar",
            description: "Rail or bottom navigation driven by items and a ref API.",
        },
    ]),
    createSection("layout", "Layout", [
        {
            name: "LinearLayout",
            family: "layout",
            demo: "Linear layout",
            description: "Flex row or column with gravity, alignment, and gap options.",
        },
        {
            name: "LinearLayoutItem",
            family: "layout",
            demo: "Linear layout",
            description: "Weighted child inside a LinearLayout.",
        },
        {
            name: "GridLayout",
            family: "layout",
            demo: "Grid and waterfall",
            description: "Flex-based column grid with responsive wrapping.",
        },
        {
            name: "WaterfallLayout",
            family: "layout",
            demo: "Grid and waterfall",
            description: "Masonry columns built from flex, without CSS Grid.",
        },
        {
            name: "ConstraintLayout",
            family: "layout",
            demo: "Constraint layout and navigation",
            description: "Anchored children positioned on both axes.",
        },
        {
            name: "Constraint",
            family: "layout",
            demo: "Constraint layout and navigation",
            description: "One child anchored inside a ConstraintLayout.",
        },
        {
            name: "DrawerLayout",
            family: "layout",
            demo: "Drawer layout",
            description: "Push drawers on all four edges around a centre slot.",
        },
        {
            name: "Pager",
            family: "layout",
            demo: "Pager",
            description: "Scroll-snapped horizontal pager with imperative navigation.",
        },
        {
            name: "Page",
            family: "layout",
            demo: "Pager",
            description: "One route-aware page inside a Pager.",
        },
        {
            name: "Scrollbar",
            family: "layout",
            demo: "Scrollbar",
            description: "Native scrolling with Material overlay thumbs, drag, and auto-hide.",
        },
        {
            name: "Scroll",
            family: "layout",
            demo: "Scroll slot",
            description: "Scrollbar with a replaceable scrollbar UI slot and configurable direction and size.",
        },
        {
            name: "Drag",
            family: "layout",
            demo: "Drag",
            description: "Single-slot drag sorter for the direct children of one container.",
        },
        {
            name: "Form",
            family: "layout",
            demo: "Form",
            description: "Native form wrapper with browser validation, submission, and field context.",
        },
        {
            name: "FormField",
            family: "layout",
            demo: "Form",
            description: "Accessible label, hint, error, and ARIA binding for a native form control.",
        },
        {
            name: "FormActions",
            family: "layout",
            demo: "Form",
            description: "Flex action row for submit and cancel controls.",
        },
    ]),
    createSection("data", "Data display", [
        {
            name: "List",
            family: "layout",
            demo: "Lists and trees",
            description: "Adapter-backed list with selection modes and virtual windowing.",
        },
        {
            name: "NormalList",
            family: "list-variants",
            demo: "Normal list",
            description: "List preset without selection.",
        },
        {
            name: "MultipleList",
            family: "list-variants",
            demo: "Multiple list",
            description: "List preset with toggleable multi-selection.",
        },
        {
            name: "SelectList",
            family: "list-variants",
            demo: "Select list",
            description: "List preset with one active row.",
        },
        {
            name: "CheckList",
            family: "layout",
            demo: "Lists and trees",
            description: "Checkable list with a checkbox per row.",
        },
        {
            name: "VirtualList",
            family: "layout",
            demo: "Lists and trees",
            description: "Windowed list for long collections, rendering only visible rows.",
        },
        {
            name: "Tree",
            family: "layout",
            demo: "Lists and trees",
            description: "Expandable tree with selection modes and optional virtualisation.",
        },
        {
            name: "CheckTree",
            family: "layout",
            demo: "Lists and trees",
            description: "Tree preset with a checkbox per node.",
        },
        {
            name: "SelectTree",
            family: "list-variants",
            demo: "Select tree",
            description: "Tree preset with single-node selection.",
        },
        {
            name: "VirtualTree",
            family: "layout",
            demo: "Lists and trees",
            description: "Windowed tree for large hierarchies.",
        },
        {
            name: "Table",
            family: "layout",
            demo: "Table",
            description: "Column-driven table with selection, row clicks, and virtual rows.",
        },
        {
            name: "Transfer",
            family: "transfer",
            demo: "Transfer",
            description: "Two-pane transfer list with search and a virtual mode.",
        },
    ]),
    createSection("messaging", "Messaging", [
        {
            name: "Contact",
            family: "messaging",
            demo: "Contacts",
            description: "Presence-aware contact list with avatars and selection.",
        },
        {
            name: "VirtualContact",
            family: "messaging",
            demo: "Contacts",
            description: "Windowed contact list for long rosters.",
        },
        {
            name: "MessageList",
            family: "messaging",
            demo: "Message transcripts",
            description: "Message transcript with self and other bubbles and status.",
        },
        {
            name: "VirtualMessageList",
            family: "messaging",
            demo: "Message transcripts",
            description: "Windowed message transcript for long conversations.",
        },
        {
            name: "Chat",
            family: "messaging",
            demo: "Chat",
            description: "Conversation layout combining contacts, transcript, and composer.",
        },
        {
            name: "VirtualChat",
            family: "messaging",
            demo: "Chat",
            description: "Windowed conversation layout for long threads.",
        },
        {
            name: "CommentThread",
            family: "discussion",
            demo: "Threaded comments",
            description: "Threaded comments with replies, references, and mentions.",
        },
        {
            name: "ContactContextMenu",
            family: "message-menus",
            demo: "Contact context menu",
            description: "Contact row wrapped in the shared context menu.",
        },
        {
            name: "MessageContextMenu",
            family: "message-menus",
            demo: "Message context menu",
            description: "Message row wrapped in the shared context menu.",
        },
    ]),
    createSection("files", "Files", [
        {
            name: "ProjectManager",
            family: "project",
            demo: "Project manager",
            description: "File tree, preview, dependency graph, and imports in one manager.",
        },
        {
            name: "Preview",
            family: "file-tools",
            demo: "Preview",
            description: "Tokenised read-only file preview with line numbers.",
        },
        {
            name: "Editor",
            family: "file-tools",
            demo: "Editor",
            description: "Debounced N-gram completion editor with an explicit save callback.",
        },
    ]),
    createSection("providers", "Providers", [
        {
            name: "Theme",
            family: "providers",
            demo: "Theme provider",
            description: "Scoped mode, density, radius, and token overrides for a subtree.",
        },
        {
            name: "International",
            family: "providers",
            demo: "International provider",
            description: "Scoped locale, messages, number formatting, and date formatting.",
        },
        {
            name: "Animation",
            family: "providers",
            demo: "Animation provider",
            description: "Scoped animation enablement, preset, timing, and reduced motion.",
        },
        {
            name: "Animated",
            family: "providers",
            demo: "Animated wrapper",
            description: "Polymorphic wrapper that applies an animation preset to one element.",
        },
    ]),
    createSection("primitives", "Primitives", [
        {
            name: "Portal",
            family: "primitives",
            demo: "Portal",
            description: "Renders children into document body or a supplied container.",
        },
        {
            name: "VisuallyHidden",
            family: "primitives",
            demo: "Visually hidden",
            description: "Content that stays available to assistive technology only.",
        },
    ]),
];

/**
 * Every UI component in sidebar order, flattened out of its section.
 * Type: constant.
 * Fields: name, family, demo, description, id.
 * @example
 * const count: number = uiComponentCount;
 */
export const uiComponents: readonly ComponentRecord[] = uiComponentSections.flatMap(
    (section: ComponentSection): readonly ComponentRecord[] => section.components,
);

/**
 * Number of component entries generated from the inventory.
 * Type: constant.
 * @example
 * const total: number = uiComponentCount + 1;
 */
export const uiComponentCount: number = uiComponents.length;

/**
 * Runtime exports that are deliberately not UI components, grouped by kind.
 * These are values, not type-only exports, so each one was inspected before
 * being filtered out of the sidebar.
 * Type: constant.
 * Fields: kind, reason, names.
 * @example
 * const hookCount: number = nonUiExportGroups[0].names.length;
 */
export const nonUiExportGroups: readonly NonUiExportGroup[] = [
    {
        kind: "Hooks",
        reason: "Called from a component, never rendered as JSX. useLoad is the exception and keeps an entry.",
        names: ["useTheme", "useInternational", "useAnimation", "usePrefersReducedMotion", "useToast"],
    },
    {
        kind: "Factories and adapters",
        reason: "Return data adapters or graph objects rather than React elements.",
        names: [
            "createChatAdapter",
            "createContactAdapter",
            "createMessageAdapter",
            "createListAdapter",
            "createArrayAdapter",
            "createTreeAdapter",
            "createSelectAdapter",
            "createNumberPickerAdapter",
            "createDependencyGraph",
        ],
    },
    {
        kind: "Parsers, resolvers, and guards",
        reason: "Pure functions that transform file, import, option, or form values.",
        names: [
            "parseExports",
            "parseImports",
            "resolveImport",
            "parseManifest",
            "parseStructure",
            "renderFile",
            "updateFileContent",
            "inferLayer",
            "directoryKeys",
            "findFile",
            "flattenFiles",
            "dependenciesFromFiles",
            "extensionOf",
            "languageForExtension",
            "categoryOf",
            "isLiterature",
            "isListOption",
            "isTreeOption",
            "optionLabel",
            "optionKey",
            "validateEmail",
            "sanitiseEmailInput",
            "validateTelephone",
            "sanitiseTelephoneInput",
            "normaliseWheelDelta",
            "resolveWheelNotch",
        ],
    },
    {
        kind: "Constants and fixture data",
        reason: "Plain values and sample fixtures consumed by components and demos.",
        names: [
            "extensionValues",
            "packageManagerInfo",
            "conversationMessages",
            "WheelDiscretePixels",
            "WheelGestureGap",
            "WheelLineHeight",
            "WheelNotchPixels",
            "AnimationPresetClass",
            "AnimationPresets",
            "DefaultAnimation",
        ],
    },
    {
        kind: "Imperative and utility functions",
        reason: "Called directly; they either mutate the DOM or return primitive values.",
        names: [
            "showFullscreenLoading",
            "measureCenteredRipple",
            "measureRipple",
            "rippleColour",
            "isReducedMotion",
            "resolveAnimation",
            "animationClassName",
            "animationPresetClass",
            "animationStyle",
        ],
    },
    {
        kind: "React context objects",
        reason: "Context values are read with hooks and are never rendered directly.",
        names: ["AnimationContext", "DefaultAnimationContext"],
    },
];

/**
 * Exports that duplicate a component already documented by its canonical name.
 * Type: constant.
 * Fields: name, aliasOf.
 * @example
 * const alias: string = duplicateAliasExports[0].aliasOf;
 */
export const duplicateAliasExports: ReadonlyArray<{ name: string; aliasOf: string }> = [
    { name: "TabLayout", aliasOf: "Tabs" },
    { name: "Animate", aliasOf: "Animated" },
];
