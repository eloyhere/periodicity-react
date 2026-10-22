import type { ReactNode } from "react";
import { Badge } from "../component";
import {
    topLevelComponents,
    type ComponentRecord,
} from "./componentCatalogue";
import type {
    AccordionItem,
    AgentMessageItem,
    AgentProfile,
    AgentSession,
    BreadcrumbItem,
    ChatConversation,
    ChatMessage,
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

export const chatConversations: ChatConversation[] = [
    {
        id: "mira",
        name: "Mira Chen",
        description: "Product",
        presence: "online",
        preview: "Focus on the empty state and the weekly comparison.",
        timestamp: "09:36",
        unread: 2,
    },
    {
        id: "jonah",
        name: "Jonah Reed",
        description: "Engineering",
        presence: "busy",
        preview: "The deploy finished; logs are in the thread.",
        timestamp: "Yesterday",
    },
    {
        id: "ada",
        name: "Ada Lin",
        description: "Design",
        presence: "away",
        preview: "Updated the tokens and spacing scale.",
        timestamp: "Yesterday",
    },
    {
        id: "sam",
        name: "Sam Park",
        description: "Research",
        presence: "offline",
        preview: "Notes are in the shared doc.",
        timestamp: "Monday",
        pinned: true,
    },
];

export const chatMessages: ChatMessage[] = [
    {
        id: "message-1",
        conversationId: "mira",
        author: "Mira Chen",
        content: "The new cycle view is ready for a first look.",
        timestamp: "09:32",
    },
    {
        id: "message-2",
        conversationId: "mira",
        author: "You",
        content: "Great — I will review the rhythm summary this morning.",
        timestamp: "09:34",
        self: true,
        status: "read",
    },
    {
        id: "message-3",
        conversationId: "mira",
        author: "Mira Chen",
        content: "Focus on the empty state and the weekly comparison.",
        timestamp: "09:36",
    },
    {
        id: "message-4",
        conversationId: "mira",
        author: "You",
        content: "On it. I will leave notes in the discussion thread.",
        timestamp: "09:38",
        self: true,
        status: "sent",
    },
    {
        id: "message-jonah-1",
        conversationId: "jonah",
        author: "Jonah Reed",
        content: "The deploy finished; logs are in the thread.",
        timestamp: "Yesterday",
    },
    {
        id: "message-ada-1",
        conversationId: "ada",
        author: "Ada Lin",
        content: "Updated the tokens and spacing scale.",
        timestamp: "Yesterday",
    },
    {
        id: "message-sam-1",
        conversationId: "sam",
        author: "Sam Park",
        content: "Notes are in the shared doc.",
        timestamp: "Monday",
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

export const agentProfile: AgentProfile = {
    name: "Periodicity Agent",
    model: "DeepSeek V3",
    description: "Product reasoning assistant",
    presence: "online",
};

export const agentSessions: AgentSession[] = [
    {
        id: "agent-session-1",
        title: "Cycle view brief",
        preview: "Turn the notes into a short brief",
        timestamp: "Today",
        unread: 2,
    },
    {
        id: "agent-session-2",
        title: "Release checklist",
        preview: "Draft the rollout steps",
        timestamp: "Yesterday",
    },
    {
        id: "agent-session-3",
        title: "Research synthesis",
        preview: "Summarise the interview findings",
        timestamp: "Monday",
        pinned: true,
    },
];

export const agentMessages: AgentMessageItem[] = [
    {
        id: "agent-message-1",
        sessionId: "agent-session-1",
        author: "You",
        content: "Turn the notes into a short brief for the cycle view.",
        timestamp: "09:40",
        self: true,
        role: "user",
        status: "read",
    },
    {
        id: "agent-message-2",
        sessionId: "agent-session-1",
        author: "Periodicity Agent",
        content: `## Cycle view brief

The view should make the **weekly rhythm** obvious:

- Keep the empty state calm.
- Put the comparison next to the chart.
- Link the notes from the thread.

| Area | Decision |
| --- | --- |
| Empty state | Calm illustration |
| Comparison | Inline sparkline |

> Ship the first pass, then review usage after a week.`,
        timestamp: "09:41",
        thinking: `The user wants a short, decision-ready brief. I will keep three bullets, one small table, and a single takeaway.`,
        thinkingDuration: "6s",
    },
    {
        id: "agent-message-3",
        sessionId: "agent-session-1",
        author: "You",
        content: "Can you add a rollout note?",
        timestamp: "09:42",
        self: true,
        role: "user",
        status: "read",
    },
    {
        id: "agent-message-4",
        sessionId: "agent-session-1",
        author: "Periodicity Agent",
        content: `**Rollout note**

Start with the internal cycle, then enable the comparison for **10%** of workspaces. Keep the empty-state copy unchanged until the second pass.`,
        timestamp: "09:42",
        thinking: `A staged rollout keeps the first release small. I will mention the ten-percent cohort and preserve the empty-state copy.`,
        thinkingDuration: "4s",
        thinkingStreaming: true,
        streaming: true,
    },
    {
        id: "agent-message-5",
        sessionId: "agent-session-2",
        author: "You",
        content: "Draft the release checklist for 0.2.",
        timestamp: "Yesterday",
        self: true,
        role: "user",
        status: "read",
    },
    {
        id: "agent-message-6",
        sessionId: "agent-session-2",
        author: "Periodicity Agent",
        content: `## Release checklist

1. Freeze the component catalogue.
2. Run **type-check**, lint, and the full test suite.
3. Publish the package and verify the tarball.
4. Deploy the showcase and smoke-test the new pages.

The package is ready when every step is green.`,
        timestamp: "Yesterday",
        thinking: "A short ordered checklist is easier to scan than prose. I will include validation and publication steps.",
        thinkingDuration: "5s",
    },
    {
        id: "agent-message-7",
        sessionId: "agent-session-3",
        author: "Periodicity Agent",
        content: `### Interview themes

- Teams want fewer, clearer cycle controls.
- Empty states should explain the next action.
- Comparison is useful only when it is one click away.`,
        timestamp: "Monday",
        thinking: "The interviews cluster around clarity and proximity. I will summarise three themes and avoid quoting individuals.",
        thinkingDuration: "7s",
    },
];

export const virtualAgentSessions: AgentSession[] = Array.from(
    { length: 24 },
    (value: unknown, index: number): AgentSession => {
        void value;
        return {
            id: `agent-session-${index}`,
            title: index === 0 ? "Cycle view brief" : `History session ${index + 1}`,
            preview:
                index === 0
                    ? "Turn the notes into a short brief"
                    : `Earlier conversation ${index + 1}`,
            timestamp: index < 2 ? "Today" : "Earlier",
            unread: index === 0 ? 2 : 0,
        };
    },
);

export const virtualAgentMessages: AgentMessageItem[] = Array.from(
    { length: 80 },
    (value: unknown, index: number): AgentMessageItem => {
        void value;
        const self: boolean = index % 2 === 1;
        const sessionId: string =
            index < 60 ? "agent-session-0" : `agent-session-${index - 59}`;

        return {
            id: `virtual-agent-message-${index}`,
            sessionId,
            author: self ? "You" : "Periodicity Agent",
            content: self
                ? `Can you expand point ${index + 1}?`
                : `### Update ${index + 1}

Keeping the **stream** compact and readable:

- Markdown answer
- Separate reasoning view`,
            timestamp: `11:${`${index % 60}`.padStart(2, "0")}`,
            self,
            role: self ? "user" : "agent",
            status: self ? "read" : (void 0),
            thinking:
                !self && index % 3 === 0
                    ? "I will keep the answer short, preserve the previous context, and render the update as Markdown."
                    : (void 0),
            thinkingStreaming: index === 56,
            streaming: index === 58,
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
