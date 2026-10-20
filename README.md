# Periodicity React

A Material-inspired React component library and design-system showcase, built around a five-region drawer, a
flex-first layout model, adapter-backed data components, and a small data-structure toolkit.

> **Status:** this repository contains the source for the Periodicity design system. It is not published to npm and
> does not yet expose a package entry point. Consume it directly from the repository.

## Contents

- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Using the library](#using-the-library)
- [Layout](#layout)
- [Components](#components)
- [Data components and adapters](#data-components-and-adapters)
- [Contact, MessageList, and Chat](#contact-messagelist-and-chat)
- [Project manager](#project-manager)
- [Loading](#loading)
- [Theming](#theming)
- [Motion and ripple](#motion-and-ripple)
- [Data structures](#data-structures)
- [Accessibility](#accessibility)
- [Project layout](#project-layout)
- [Conventions](#conventions)
- [Verification](#verification)
- [Changelog](#changelog)

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A modern browser with support for native `<dialog>`, CSS custom properties, and `input.showPicker()`

The project is written with React 19, TypeScript 6, Vite 8, and the React Compiler.

## Getting started

```bash
npm install
npm run dev
```

The development server opens the component showcase. The dashboard example is available at `#dashboard`.

```bash
npm run build       # type-check and production build
npm run lint        # ESLint, including React hooks and compiler rules
npm run format      # Prettier for non-TypeScript assets
npm run preview     # preview the production build
```

## Using the library

Every component has a `Periodicity`-prefixed public export, for example `PeriodicityButton`, `PeriodicityTable`, and `PeriodicityDialog`. The unprefixed names remain available as compatibility aliases. Import components from the source barrel:

```tsx
import { PeriodicityButton, PeriodicityTextInput } from "./component";
import { Stack } from "./arrange/layout";
import "./index.css";
```

`src/index.css` imports the Material palette and foundation tokens. Components also import their own styles, so a
consumer that uses the source directly only needs the global entry once.

```tsx
import { useState } from "react";
import { PeriodicityButton, PeriodicityTextInput } from "./component";
import { Stack } from "./arrange/layout";

export const SignIn = () => {
    const [email, setEmail] = useState("");

    return (
        <Stack gap="md">
            <PeriodicityTextInput
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
            />
            <PeriodicityButton onClick={() => console.log(email)}>Continue</PeriodicityButton>
        </Stack>
    );
};
```

## Layout

`src/layout` contains structural primitives. Layout is flex-first; CSS Grid is not used.

| Component                         | Purpose                                                            |
| --------------------------------- | ------------------------------------------------------------------ |
| `Stack` / `Inline` / `Columns`    | Vertical, horizontal, and equal-width column arrangements          |
| `LinearLayout`                    | Orientation, gravity, alignment, gap, wrapping, and weighted items |
| `GridLayout`                      | Flex-based responsive card columns                                 |
| `WaterfallLayout`                 | Round-robin masonry columns                                        |
| `ConstraintLayout` / `Constraint` | Anchor-based positioning with offsets                              |
| `DrawerLayout`                    | Five-region push layout                                            |
| `Drawer`                          | Modal side sheet                                                   |
| `Tabs` / `TabPanel`               | Tab navigation and panels                                          |
| `Menu` / `MenuItem`               | Popup or inline menus                                              |
| `NavigationView`                  | Sidebar, rail, and bottom navigation                               |
| `Pager` / `PagerPage`             | Swipeable, scroll-snapped pages                                    |
| `Table`                           | Semantic data table                                                |
| `List`                            | Adapter-backed list and virtual list                               |
| `Tree`                            | Adapter-backed expandable tree and virtual tree                    |
| `Contact`                         | Adapter-backed contact list with presence                          |
| `MessageList`                     | Adapter-backed chat transcript                                     |
| `Chat`                            | Contact, transcript, and composer layout                           |
| `ProjectManager`                  | File tree, dependency graph, preview, editor, and project I/O      |

### DrawerLayout

`DrawerLayout` has five slots — `left`, `top`, `centre`, `right`, and `bottom` — and supports one open edge at a
time. Opening an edge pushes the centre rather than covering it. `center` remains available as a compatibility alias
for `centre`.

```tsx
import { DrawerLayout } from "./component";

<DrawerLayout
    left={<Navigation />}
    top={<SearchBar />}
    centre={<MainPage />}
    right={<Inspector />}
    bottom={<StatusBar />}
    leftOpen={leftOpen}
    topOpen={topOpen}
    bottomOpen={bottomOpen}
    rightOpen={rightOpen}
    onLeftOpenChange={setLeftOpen}
    onTopOpenChange={setTopOpen}
    onBottomOpenChange={setBottomOpen}
    onRightOpenChange={setRightOpen}
    topHeight={112}
    bottomHeight={88}
/>;
```

All edges animate their width or height, and the active side is protected by a scrim and an outside-pointer guard.
An imperative handle exposes `open`, `close`, `toggle`, `openLeft`, `openTop`, `closeBottom`, and `isOpen`.

## Components

The component barrel exports the following groups.

### Actions and status

`Button`, `Badge`, `Chip`, `Avatar`, `AvatarGroup`, `Alert`, `Banner`, `EmptyState`, `Progress`, `CircularProgress`,
`Spinner`, `ProgressRing`, `Skeleton`, `Timeline`.

### Inputs

`TextInput`, `TextArea`, `NumberInput`, `Mention`, `CompleteInput`, `EmailInput`, `TelephoneInput`, `Checkbox`,
`Radio`, `RadioGroup`, `Switch`, `Range`, `Rate`.

### Timeline

`Timeline` renders vertical events with tone markers and an optional item slot:

```tsx
<Timeline
    items={[
        { id: "draft", title: "Draft saved", time: "09:30", tone: "accent" },
        { id: "review", title: "Review started", time: "10:15" },
    ]}
/>
```

All text inputs support outline, fill, and standard variants, sizes, labels, hints, error messages, leading and
trailing icons, and disabled states.

### Pickers

`Select`, `VirtualSelect`, `Combobox`, `TimePicker`, `DateTimePicker`, `NumberPicker`, `ColourPicker`,
`VariantPicker`.

`TimePicker` opens the native picker when any part of the field is clicked, not only the clock icon.`DateTimePicker` uses a custom panel with editable year and month fields, a day grid, and editable hour and minute
fields. `Select` lives under `input/select` with separate `normal` and `virtual` entry points and a shared
`SelectAdapter`; `VirtualSelect` windows very long option lists. `NumberPicker` is the Android-style centred number
wheel with stepper buttons and keyboard support.

```tsx
<DateTimePicker label="Starts at" value={startsAt} onChange={setStartsAt} />
```

### Mention

`Mention` opens a suggestion list when `@` is typed. Loading is caller-owned: `onSearch` receives the current query
and an `AbortSignal`, and may return suggestions synchronously or asynchronously.

```tsx
<Mention
    label="Reply"
    value={draft}
    onChange={setDraft}
    onSearch={async (query, { signal }) => {
        const response = await fetch(`/api/people?q=${encodeURIComponent(query)}`, { signal });
        return response.json();
    }}
    onMention={(person) => console.log(person)}
/>
```

`CommentThread` embeds `Mention` in its reply composer. Pass `mentionSearch`, `mentionSuggestions`, and `onMention`
to control loading and selection notifications for each comment parent.

### Surfaces and disclosure

`Surface`, `Card`, `Accordion`, `Divider`, `CommentThread`, `Transfer`.

### Overlays and feedback

`Dialog`, `ConfirmDialog`, `MessageDialog`, `InputDialog`, `Drawer`, `Dropdown`, `Popover`, `Tooltip`, `Menu`,
`Snackbar`, `ToastProvider`, `useToast`, `Pagination`, `Breadcrumbs`, `Stepper`.

`Surface` provides tonal backgrounds, elevation, shape, keyboard handling, and pointer-positioned ripples. Nested
surfaces stop ripple propagation so a button inside a card does not ripple the card.

## Data components and adapters

Data components use a small adapter layer so arrays, virtual windows, and future data sources share one contract.

- `ListAdapter<T>` and `createListAdapter(items, options)` live in
  [`src/layout/list/adapter`](src/layout/list/adapter/index.ts).
- `TreeAdapter<T>` and `createTreeAdapter(roots, options)` live in
  [`src/layout/tree/adapter`](src/layout/tree/adapter/index.ts).

### List

```tsx
import { List, createListAdapter } from "./component";

const adapter = createListAdapter(people, {
    getKey: (person) => person.id,
});

<List
    adapter={adapter}
    selectionMode="multiple"
    defaultSelectedKeys={["mira"]}
    onSelectionChange={(keys, items) => console.log(keys, items)}
/>;
```

Available presets:

- `List` — no selection by default
- `SelectList` — single selection
- `MultipleList` — multiple selection
- `CheckList` — checkboxes with multiple selection
- `VirtualList` — fixed-row virtual window

Standard list nodes are `{ index, label, value }`:

```tsx
import { List, type ListOption } from "./component";

const options: ListOption<string>[] = [
    { index: 0, label: "Morning pages", value: "morning" },
    { index: 1, label: "Deep work", value: "deep-work" },
];

<List
    items={options}
    getKey={(option) => option.value}
    slots={{ item: (option) => <strong>{option.label}</strong> }}
/>;
```

`slots.item` receives the node plus `{ index, selected, disabled }`. `renderItem` remains available for simpler
custom rendering.

### Tree

```tsx
import { CheckTree } from "./component";

<CheckTree
    items={nodes}
    getKey={(node) => node.id}
    getChildren={(node) => node.children ?? []}
    defaultExpandedKeys={new Set(["practice"])}
    defaultCheckedKeys={["breath"]}
/>;
```

Available presets:

- `Tree` — expandable tree with optional selection
- `SelectTree` — single selection
- `CheckTree` — checkbox selection with subtree propagation
- `VirtualTree` — fixed-row virtual window

Standard tree nodes extend the list node with `depth`:

```tsx
import { Tree, type TreeOption } from "./component";

const nodes: TreeOption<string>[] = [
    {
        depth: 0,
        index: 0,
        label: "Practice",
        value: "practice",
        children: [{ depth: 1, index: 0, label: "Breathwork", value: "breath" }],
    },
];

<Tree items={nodes} slots={{ item: (node, state) => <span>{node.label}</span> }} />;
```

`slots.item` receives `{ index, level, expanded, selected, checked }`. If a node provides `depth`, the tree uses it
for indentation and `aria-level`.

### Table

```tsx
import { Table, type TableColumn } from "./component";

interface Person {
    id: string;
    name: string;
    role: string;
}

const columns: TableColumn<Person>[] = [
    { id: "name", header: "Name", cell: (person) => person.name },
    { id: "role", header: "Role", cell: (person) => person.role },
];

<Table
    columns={columns}
    rows={people}
    rowKey={(person) => person.id}
    selectedKeys={selected}
    onSelectionChange={setSelected}
    density="compact"
    striped
/>;
```

`Table` also accepts an `adapter` instead of `rows`. It supports row selection, select-all, indeterminate state,
sticky headers, compact density, striped rows, hover, loading, empty state, captions, and row-click handlers. Set
`virtual`, `height`, and `rowHeight` to window large row sets while keeping the semantic table structure.

### Transfer and comments

`Transfer` uses a list adapter internally and supports multi-selection. It accepts `virtual`, `listHeight`, and
`itemHeight` for fixed-row virtual panes. `CommentThread` uses a tree adapter for nested replies.

### Contact, MessageList, and Chat

The messaging layout is split into three adapter-backed components. Each has `adapter`, `normal`, and `virtual`
modules.

```tsx
import { Chat, Contact, MessageList, VirtualChat } from "./component";

<Contact contacts={contacts} defaultValue="mira" />

<MessageList messages={messages} currentUser="You" />

<Chat
    contacts={contacts}
    messages={messages}
    defaultValue="mira"
    currentUser="You"
    onSend={(body, contact) => send(body, contact)}
/>

<VirtualChat contacts={contacts} messages={messages} />
```

- `Contact` renders searchable contacts, presence dots, and selection.
- `MessageList` renders self and peer bubbles, timestamps, delivery status, and an auto-scroll transcript.
  Bubbles use `Surface` ripples; read messages show a double check, sent messages a single check.
- Right-click and long-press on a message use the shared `ContextMenu` slots: Copy, Forward, Favourite,
  Multi-select, Quote, and Delete. Own messages also expose Recall.
- `Chat` combines contacts, transcript, and composer.
- `VirtualContact`, `VirtualMessageList`, and `VirtualChat` use fixed-row windows.
- `createContactAdapter`, `createMessageAdapter`, and `createChatAdapter` build the corresponding adapters.

### Project manager

`ProjectManager` is a generic project workspace. It holds a `Pager` and a `NavigationView` and exposes seven views:
files, preview, edit, architecture, dependencies, imports, and exports. The project file tree lives inside the Files
and Architecture pages rather than a permanent middle column, leaving the workspace to the active view.

```tsx
import { ProjectManager } from "./component";

<ProjectManager
    project={project}
    dependencies={dependencies}
    onFileChange={(file, content) => saveFile(file, content)}
    onProjectImport={(imported) => loadProject(imported)}
    onProjectExport={(exported) => downloadProject(exported)}
/>;
```

File objects are `FileNode` trees with `id`, `path`, `kind`, optional `content`, language, extension, and children.
`parseImports` and `parseExports` recognise JavaScript/TypeScript, Python, C/C++, Rust, TeX, Markdown, and
bibliography files.

The Architecture page combines the project node tree with a structural outline of the selected file:

- HTML becomes a tag tree, with attributes as child nodes.
- Markdown and prose become sections, paragraphs, and sentences.
- TypeScript and other code become classes, methods, functions, properties, constants, types, interfaces, and
  comments.
- TeX becomes chapter/section structure.

Preview rendering is extension-driven through `renderFile`:

- HTML is parsed by `DOMParser`, stripped of scripts, forms, unsafe tags, event handlers, and unsafe URLs, then
  rendered as safe markup.
- Markdown becomes headings, lists, blockquotes, paragraphs, and inline formatting.
- TXT is analysed as an article with paragraphs and line breaks.
- Source files become syntax-highlighted code using keywords, strings, comments, numbers, and calls.

The parsed structure uses `StructureNode` and `parseStructure` from
[`src/layout/file/structure.ts`](src/layout/file/structure.ts). Rendering lives in
[`src/layout/file/render.ts`](src/layout/file/render.ts).

`dependencies` are project-level packages and references, not only internal edges:

- package dependencies from `package.json`, `requirements.txt`, `Cargo.toml`, or explicit metadata;
- bibliography references from `.bib` files or `ProjectDependency` entries;
- internal file edges resolved from relative imports.

`Language = "Literature"` represents books and articles. Markdown headings and TeX sections become exports; `.bib`
entries and citations become references. The project toolbar supports JSON project import and export.

`Pager` uses a switch gate: route changes and scroll settling are debounced, programmatic scrolling keeps a target
lock, and route-driven changes do not emit back to the controller. `NavigationView` and `Tabs` debounce their option
callbacks so controlled values cannot form a feedback loop with page navigation.

## Loading

Two loaders are available:

```tsx
import { ElementLoading, FullscreenLoading } from "./component";

<ElementLoading loading={saving} target={panelRef} label="Saving" />
<FullscreenLoading open={preparing} label="Preparing workspace" description="Loading your rituals." />
```

- `ElementLoading` measures a referenced element or CSS selector and mounts a fixed overlay with an indeterminate
  circular progress indicator. It tracks resizing and scrolling.
- `FullscreenLoading` uses the native `<dialog>` element with `showModal()`, a blurred full-viewport surface, and an
  indeterminate spinner. `Escape` is intentionally suppressed while loading.

## Theming

The default palette is Material light, exposed through Android-style custom properties:

```css
:root {
    --colourPrimary: #1976d2;
    --colourPrimaryDark: #0d47a1;
    --colourAccent: #dc004e;
    --colourTextPrimary: rgba(0, 0, 0, 0.87);
    --colourTextSecond: rgba(0, 0, 0, 0.6);
    --colourTextDisabled: rgba(0, 0, 0, 0.38);
    --colourBackground: #fafafa;
    --colourSurface: #ffffff;
    --colourDivider: rgba(0, 0, 0, 0.12);
}
```

Override these variables on `:root` or a scoped container to theme a subtree. Foundation tokens such as spacing,
typography, radii, elevation, and motion live in
[`src/component/foundation/tokens.css`](src/component/foundation/tokens.css).

## Motion and ripple

`Surface` enables hover and click ripples by default. The ripple is positioned at the pointer coordinates and chooses
a contrasting colour from the surface luminance. Keyboard activation uses a centred ripple.

```tsx
<Surface ripple={{ layer: "foreground", trigger: ["hover", "click"] }} elevation={2} shape="md">
    Content
</Surface>
```

Dropdowns animate open and close with a short fade and translate. Drawers animate their push width or height. The
project intentionally keeps motion visible in this environment, including when the operating system requests
reduced motion.

## Data structures

`src/structure` contains an optional data-structure toolkit:

- Lists: `Deque`, `Queue`, `Stack`
- Maps: `OrderedMap`, `UnorderedMap`, `OrderedSkipMap`, `ConcurrentUnorderedSkipMap`, `ConcurrentOrderedMap`,
  `ConcurrentUnorderedMap`
- Sets: `OrderedSet`, `UnorderedSet`, `OrderedSkipSet`, `ConcurrentUnorderedSkipSet`, `ConcurrentOrderedSet`,
  `ConcurrentUnorderedSet`
- Trees: `BinarySearchTree`, `RedBlackTree`, `BPlusTree`, `BalanceTree`, `LinearTree`, `SkipTree`, `Trie`, `Heap`,
  `SegmentTree`
- Support classes: node implementations, `Mutex`, `Optional`, synchronous and asynchronous streams, hashing and
  least-recently-used containers

```tsx
import { Optional, OrderedMap, RedBlackTree } from "./structure";

const map = new OrderedMap<string, number>();
map.set("focus", 25);

const tree = new RedBlackTree<number, string>();
tree.set(1, "one");

const value = Optional.ofNullable(map.get("focus")).orElse(0);
```

## Accessibility

Interactive components expose semantic roles and labels. Lists use `listbox`/`option`, trees use
`tree`/`treeitem`, tables use native table semantics, drawers use labelled complementary regions, and fullscreen
loading uses a labelled dialog with `aria-busy`. Selection and expansion states are reflected through ARIA
attributes. Always provide a meaningful `label`, `ariaLabel`, or visible heading for data components.

## Project layout

| Path                         | Contents                                                              |
| ---------------------------- | --------------------------------------------------------------------- |
| `src/component`              | Components, inputs, pickers, overlays, and feedback                   |
| `src/component/input/select` | Normal and virtual select entry points with the shared select adapter |
| `src/layout`                 | Layout primitives and data components                                 |
| `src/layout/contact`         | Contact adapter, normal list, and virtual list                        |
| `src/layout/message`         | Message adapter, normal transcript, and virtual transcript            |
| `src/layout/chat`            | Chat adapter and normal/virtual chat layouts                          |
| `src/layout/file`            | Project manager, file nodes, dependency graph, import/export parsing  |
| `src/layout/list/adapter`    | List adapter contract                                                 |
| `src/layout/tree/adapter`    | Tree adapter contract                                                 |
| `src/structure`              | Data-structure toolkit                                                |
| `src/showcase`               | Component gallery and documentation demos                             |
| `src/arrange`                | `Stack`, `Inline`, and `Columns`                                      |

## Conventions

- Comments and documentation use British English.
- Public APIs use explicit TypeScript types and JSDoc comments.
- Identifiers use camelCase; leading underscores are not used.
- `(void 0)` is used instead of `undefined` in source where required by project style.
- Layout uses flexbox rather than CSS Grid.
- Source files use CRLF line endings and a 120-column target.

## Verification

The current baseline passes:

```bash
npx tsc -p tsconfig.app.json --noEmit
npx eslint src --max-warnings 0
npm run build
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the English changelog and [CHANGELOG.zh-CN.md](CHANGELOG.zh-CN.md) for the
Simplified Chinese changelog.
