import type { ReactNode } from "react";
import { Badge } from "../component";
import {
    topLevelComponents,
    type ComponentRecord,
} from "./componentCatalogue";
import type {
    AccordionItem,
    BreadcrumbItem,
    ComboboxOption,
    CommentData,
    ContactItem,
    ListOption,
    MentionItem,
    MessageItem,
    NavigationItem,
    SelectOption,
    StepItem,
    TabItem,
    TableColumn,
    TimelineItem,
    TransferItem,
    TreeOption,
    VariantOption,
} from "../component";

/**
 * Sample data shared by more than one documentation entry.
 * Keeping the fixtures here means a new page can reuse the same rhythms,
 * people, and projects without copying literal values into another file.
 */

export const selectOptions: SelectOption[] = [
    { value: "daily", label: "Daily", icon: "Refresh" },
    { value: "weekdays", label: "Weekdays", icon: "Calendar" },
    { value: "weekly", label: "Weekly", icon: "Plan" },
    { value: "monthly", label: "Monthly", icon: "History" },
];

export const comboboxOptions: ComboboxOption[] = [
    { value: "design", label: "Design review" },
    { value: "deep", label: "Deep work" },
    { value: "walk", label: "Long walk" },
    { value: "review", label: "Evening review" },
];

export const tabItems: TabItem[] = [
    { value: "today", label: "Today", icon: "Calendar" },
    { value: "week", label: "Week", icon: "Chart" },
    { value: "month", label: "Month", icon: "Plan" },
];

export const accordionItems: AccordionItem[] = [
    {
        value: "rhythm",
        title: "What is a ritual?",
        content: "A small loop you repeat with care: capture it, see it, finish it, feel it.",
    },
    {
        value: "focus",
        title: "How does focus work?",
        content: "One deep block at a time, with a gentle pause before the next.",
    },
    {
        value: "quiet",
        title: "Why so quiet?",
        content: "The interface should disappear behind the work.",
    },
];

export const stepItems: StepItem[] = [
    { value: "capture", label: "Capture", description: "Write it down" },
    { value: "shape", label: "Shape", description: "Give it a time" },
    { value: "tend", label: "Tend", description: "Repeat with care" },
    { value: "review", label: "Review", description: "Close the loop", optional: true },
];

export const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Personal", href: "#navigation" },
    { label: "Components", href: "#navigation" },
    { label: "Breadcrumbs" },
];

export const commentData: CommentData[] = [
    {
        id: "comment-1",
        author: "Mira Chen",
        timestamp: "09:12",
        content: "The evening review keeps slipping. Could we move it fifteen minutes earlier?",
        replies: [
            {
                id: "comment-2",
                author: "Jonah Reed",
                timestamp: "09:18",
                content: "Earlier works for me. I would keep the same three prompts, though.",
                references: ["comment-1"],
                replies: [
                    {
                        id: "comment-3",
                        author: "Ada Lin",
                        timestamp: "09:24",
                        content: "Agreed. The prompts are the part that makes it feel like a ritual.",
                        references: ["comment-1", "comment-2"],
                    },
                ],
            },
            {
                id: "comment-4",
                author: "Sam Park",
                timestamp: "09:31",
                content: "I can move the reminder, but the calendar block will still end at nine.",
                resolved: true,
            },
        ],
    },
    {
        id: "comment-5",
        author: "Mira Chen",
        timestamp: "10:04",
        content: "Let us try 20:45 for two weeks, then review the consistency chart.",
    },
];

export const transferItems: TransferItem[] = [
    { key: "mira", label: "Mira Chen", description: "Product", icon: "Plan" },
    { key: "jonah", label: "Jonah Reed", description: "Engineering", icon: "Setting" },
    { key: "ada", label: "Ada Lin", description: "Design", icon: "Calendar" },
    { key: "sam", label: "Sam Park", description: "Research", icon: "Search" },
    { key: "noor", label: "Noor Haddad", description: "Operations", icon: "Mail", disabled: true },
];

export const virtualTransferItems: TransferItem[] = Array.from(
    { length: 120 },
    (value: unknown, index: number): TransferItem => {
        void value;
        return {
            key: `person-${index}`,
            label: `Person ${index + 1}`,
            description: index % 2 === 0 ? "Product" : "Engineering",
        };
    },
);

export const navigationItems: NavigationItem[] = [
    { value: "today", label: "Today", icon: "Calendar" },
    { value: "cycles", label: "Cycles", icon: "Plan" },
    { value: "search", label: "Search", icon: "Search" },
    { value: "settings", label: "Settings", icon: "Setting", badge: "3" },
];

export const mentionPeople: MentionItem[] = [
    { id: "mira", label: "Mira Chen", description: "Product" },
    { id: "jonah", label: "Jonah Reed", description: "Engineering" },
    { id: "ada", label: "Ada Lin", description: "Design" },
    { id: "sam", label: "Sam Park", description: "Research" },
    { id: "noor", label: "Noor Haddad", description: "Operations" },
];

export const chatContacts: ContactItem[] = [
    { id: "mira", name: "Mira Chen", description: "Product · online", presence: "online" },
    { id: "jonah", name: "Jonah Reed", description: "Engineering", presence: "busy" },
    { id: "ada", name: "Ada Lin", description: "Design", presence: "away" },
    { id: "sam", name: "Sam Park", description: "Research", presence: "offline" },
];

export const chatMessages: MessageItem[] = [
    {
        id: "message-1",
        author: "Mira Chen",
        content: "The new cycle view is ready for a first look.",
        timestamp: "09:32",
        contactId: "mira",
    },
    {
        id: "message-2",
        author: "You",
        content: "Great — I will review the rhythm summary this morning.",
        timestamp: "09:34",
        self: true,
        contactId: "mira",
        status: "read",
    },
    {
        id: "message-3",
        author: "Mira Chen",
        content: "Focus on the empty state and the weekly comparison.",
        timestamp: "09:36",
        contactId: "mira",
    },
    {
        id: "message-4",
        author: "You",
        content: "On it. I will leave notes in the discussion thread.",
        timestamp: "09:38",
        self: true,
        contactId: "mira",
        status: "sent",
    },
];

export const virtualChatContacts: ContactItem[] = Array.from(
    { length: 48 },
    (value: unknown, index: number): ContactItem => {
        void value;
        return {
            id: `person-${index}`,
            name: `Person ${index + 1}`,
            description: index % 2 === 0 ? "Product" : "Engineering",
            presence: index % 3 === 0 ? "online" : index % 3 === 1 ? "away" : "offline",
        };
    },
);

export const virtualChatMessages: MessageItem[] = Array.from(
    { length: 80 },
    (value: unknown, index: number): MessageItem => {
        void value;
        const self: boolean = index % 2 === 1;
        return {
            id: `virtual-message-${index}`,
            author: self ? "You" : "Person 1",
            content: `Virtual message ${index + 1}: keeping the transcript compact and scrollable.`,
            timestamp: `10:${`${index % 60}`.padStart(2, "0")}`,
            self,
            contactId: "person-0",
            status: self ? "read" : (void 0),
        };
    },
);

export const completeOptions: readonly string[] = [
    "Morning pages",
    "Design review",
    "Deep work",
    "Long walk",
    "Evening review",
];

export const listOptions: readonly ListOption<string>[] = completeOptions.map(
    (label: string, index: number): ListOption<string> => ({
        index,
        label,
        value: label.toLowerCase().replace(/\s+/g, "-"),
    }),
);

export const timelineItems: readonly TimelineItem[] = [
    {
        id: "draft",
        title: "Draft started",
        time: "08:15",
        description: "The first outline is ready for review.",
        icon: "Pencil",
        tone: "neutral",
    },
    {
        id: "review",
        title: "Design review",
        time: "09:30",
        description: "Comments are open on the rhythm summary.",
        icon: "View",
        tone: "accent",
        active: true,
    },
    {
        id: "approved",
        title: "Approved",
        time: "11:05",
        description: "The cycle view is ready to ship.",
        icon: "Check",
        tone: "success",
    },
];

/**
 * One row in the sample team table.
 * Type: interface.
 * Fields: id, name, role, status.
 * @example
 * const row: TeamRow = { id: "mira", name: "Mira Chen", role: "Product", status: "active" };
 */
export interface TeamRow {
    id: string;
    name: string;
    role: string;
    status: "active" | "away";
}

export const teamRows: TeamRow[] = [
    { id: "mira", name: "Mira Chen", role: "Product", status: "active" },
    { id: "jonah", name: "Jonah Reed", role: "Engineering", status: "active" },
    { id: "ada", name: "Ada Lin", role: "Design", status: "away" },
    { id: "sam", name: "Sam Park", role: "Research", status: "active" },
];

export const tableColumns: TableColumn<TeamRow>[] = [
    { id: "name", header: "Name", cell: (row: TeamRow): ReactNode => row.name },
    { id: "role", header: "Role", cell: (row: TeamRow): ReactNode => row.role },
    {
        id: "status",
        header: "Status",
        cell: (row: TeamRow): ReactNode => (
            <Badge tone={row.status === "active" ? "mint" : "neutral"}>{row.status}</Badge>
        ),
    },
];

export const virtualTeamRows: TeamRow[] = Array.from(
    { length: 120 },
    (value: unknown, index: number): TeamRow => {
        void value;
        const source: TeamRow = teamRows[index % teamRows.length];
        return {
            ...source,
            id: `${source.id}-${index}`,
            name: `${source.name} ${index + 1}`,
        };
    },
);

export const virtualSelectOptions: SelectOption[] = Array.from(
    { length: 160 },
    (value: unknown, index: number): SelectOption => {
        void value;
        return {
            value: `option-${index}`,
            label: `Option ${`${index + 1}`.padStart(3, "0")}`,
        };
    },
);

export const virtualComboboxOptions: ComboboxOption[] = virtualSelectOptions.map(
    (option: SelectOption): ComboboxOption => ({
        value: option.value,
        label: option.label,
    }),
);

/**
 * One node in the sample ritual tree.
 * Type: interface.
 * Extends: TreeOption<string>.
 * Fields: children.
 * @example
 * const node: RitualNode = { depth: 0, index: 0, label: "Practice", value: "practice" };
 */
export interface RitualNode extends TreeOption<string> {
    children?: readonly RitualNode[];
}

export const treeItems: RitualNode[] = [
    {
        depth: 0,
        index: 0,
        label: "Practice",
        value: "practice",
        children: [
            { depth: 1, index: 0, label: "Breathwork", value: "breath" },
            { depth: 1, index: 1, label: "Long walk", value: "walk" },
        ],
    },
    {
        depth: 0,
        index: 1,
        label: "Review",
        value: "review",
        children: [
            { depth: 1, index: 0, label: "Daily notes", value: "daily" },
            { depth: 1, index: 1, label: "Weekly reset", value: "weekly" },
        ],
    },
];

export const virtualItems: string[] = Array.from(
    { length: 120 },
    (value: unknown, index: number): string => {
        void value;
        return `Row ${index + 1}`;
    },
);

export const variantOptions: VariantOption[] = [
    { value: "blue", label: "Blue", swatch: "#1976d2" },
    { value: "pink", label: "Pink", swatch: "#dc004e" },
    { value: "teal", label: "Teal", swatch: "#00897b" },
    { value: "violet", label: "Violet", swatch: "#7b1fa2" },
];

/**
 * Every public UI component and the entry that documents it.
 * Derived from the same catalogue as the sidebar, so the overview index can
 * never drift from the component inventory.
 * Type: constant.
 * Fields: component name, entry id.
 * @example
 * const target: string = componentIndex[0][1];
 */
export const componentIndex: ReadonlyArray<readonly [string, string]> = topLevelComponents.map(
    (component: ComponentRecord): readonly [string, string] => [component.name, component.id],
);
