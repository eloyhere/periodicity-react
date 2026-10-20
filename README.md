# Periodicity React

A Material-inspired React component library for product interfaces, admin tools, and data-heavy applications.

`periodicity-react` brings together 120 prefixed components: form controls, overlays, navigation, collections,
messaging, file tooling, and the design-system providers that connect them. The API is TypeScript-first, flex-first,
and deliberately close to the browser: native attributes, events, ARIA, and refs pass through wherever they make
sense.

- **npm:** [`periodicity-react`](https://www.npmjs.com/package/periodicity-react)
- **Version:** `0.1.0`
- **Source:** [github.com/eloyhere/periodicity-react](https://github.com/eloyhere/periodicity-react)
- **Requirements:** React 19, React DOM 19, and a modern browser

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [Component names](#component-names)
- [Forms and pickers](#forms-and-pickers)
- [Collections and data](#collections-and-data)
- [Overlays and feedback](#overlays-and-feedback)
- [Navigation and layout](#navigation-and-layout)
- [Messaging and contacts](#messaging-and-contacts)
- [Files and previews](#files-and-previews)
- [Theming](#theming)
- [Internationalisation](#internationalisation)
- [Motion](#motion)
- [Accessibility](#accessibility)
- [Development](#development)
- [Verification](#verification)
- [Changelog](#changelog)

## Install

```bash
npm install periodicity-react
```

`react` and `react-dom` are peer dependencies. Install React 19 in the host application if it is not already present.

Import the component styles once at the application entry:

```tsx
import "periodicity-react/styles.css";
```

The package ships an ES module build, TypeScript declarations, and the extracted stylesheet. It is intended for
bundlers such as Vite, Next.js, or webpack.

## Quick start

```tsx
import { useState } from "react";
import { PeriodicityButton, PeriodicityTextInput } from "periodicity-react";
import "periodicity-react/styles.css";

export function SignIn() {
    const [email, setEmail] = useState("");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 360 }}>
            <PeriodicityTextInput
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
            />
            <PeriodicityButton onClick={() => console.log(email)}>Continue</PeriodicityButton>
        </div>
    );
}
```

## Component names

Every public component is available with a `Periodicity` prefix:

```tsx
import { PeriodicityButton, PeriodicityDialog, PeriodicityTable, PeriodicityTextInput } from "periodicity-react";
```

The unprefixed names remain as compatibility aliases, so both of these refer to the same component:

```tsx
import { PeriodicityTable } from "periodicity-react";
import { Table } from "periodicity-react";
```

New code should use the prefixed names. They make component boundaries explicit and avoid collisions with host
application components.

## Forms and pickers

Form controls accept native input attributes and forward events, refs, `aria-*`, and `data-*` attributes.

```tsx
import {
    PeriodicityCheckbox,
    PeriodicityNumberInput,
    PeriodicityRange,
    PeriodicitySelect,
    PeriodicitySwitch,
    PeriodicityTextArea,
} from "periodicity-react";

<PeriodicityTextArea label="Notes" rows={4} maxLength={500} />
<PeriodicityCheckbox label="Subscribe" defaultChecked />
<PeriodicitySwitch label="Enabled" defaultChecked onChange={() => {}} />
<PeriodicityRange label="Volume" min={0} max={100} defaultValue={60} onChange={() => {}} />
<PeriodicityNumberInput label="Quantity" min={1} max={99} defaultValue={1} />
<PeriodicitySelect label="Team" options={teams} onChange={(value) => console.log(value)} />
```

Available picker components:

- `PeriodicityColourPicker`
- `PeriodicityTimePicker`
- `PeriodicityDateTimePicker`
- `PeriodicityNumberPicker`
- `PeriodicityCyclePicker`
- `PeriodicityVariantPicker`

Most form and picker components support controlled and uncontrolled values, `disabled`, `readOnly` where relevant,
and caller-composed native handlers. `PeriodicityMention` adds an asynchronous suggestion list and tokenised chips;
the caller supplies the loader.

## Collections and data

Collections can be backed by plain arrays or by adapters, with optional fixed-row virtualisation.

```tsx
import { PeriodicityList, PeriodicityTable, PeriodicityTree } from "periodicity-react";

<PeriodicityList
    items={people}
    getKey={(person) => person.id}
    selectionMode="single"
    renderItem={(person) => `${person.firstName} ${person.lastName}`}
/>

<PeriodicityTable
    columns={[
        { id: "name", header: "Name", cell: (person) => person.name },
        { id: "role", header: "Role", cell: (person) => person.role },
    ]}
    rows={people}
    rowKey={(person) => person.id}
    caption="Team members"
/>

<PeriodicityTree
    items={nodes}
    getKey={(node) => node.id}
    renderItem={(node) => node.label}
/>
```

The collection family includes `List`, `Tree`, `Table`, `Select`, `Combobox`, `Transfer`, and `WaterfallLayout`.
Use `virtual`, `height`, and `itemHeight` / `rowHeight` for fixed-row virtualisation. Selection, expansion, loading,
empty, and disabled states are available across the family.

## Overlays and feedback

```tsx
import {
    PeriodicityAlert,
    PeriodicityDialog,
    PeriodicityToastProvider,
} from "periodicity-react";

<PeriodicityAlert tone="success" title="Saved">
    Your changes are up to date.
</PeriodicityAlert>

<PeriodicityDialog open={open} title="Delete project" onClose={() => setOpen(false)}>
    This action cannot be undone.
</PeriodicityDialog>

<PeriodicityToastProvider>
    <App />
</PeriodicityToastProvider>;
```

The overlay set covers dialogs, confirm/message/input dialogs, drawer and drawer layout, context menu, dropdown,
popover, tooltip, snackbar, toast, alert, banner, backdrop, and fullscreen/element loading. Controlled and
uncontrolled open state, close reasons, escape handling, focus restoration, and native panel attributes are
supported.

## Navigation and layout

Navigation components:

- `PeriodicityNavigationView`
- `PeriodicityTabs` and `PeriodicityTabPanel`
- `PeriodicityPager`
- `PeriodicityMenu`, `PeriodicityMenuItem`, `PeriodicityMenuGroup`, `PeriodicityMenuSeparator`
- `PeriodicityStepper`

Layout is flex-first and does not use CSS Grid. Structural components include:

- `PeriodicityGridLayout`
- `PeriodicityLinearLayout` and `PeriodicityLinearLayoutItem`
- `PeriodicityConstraintLayout` and `PeriodicityConstraint`
- `PeriodicityWaterfallLayout`
- `PeriodicityDrawerLayout`
- `PeriodicityScrollbar`
- `PeriodicityDrag`

`PeriodicityDrag` reorders the direct children of a single slotted container and renders a pointer-following drag
ghost while sorting.

## Messaging and contacts

```tsx
import {
    PeriodicityChat,
    PeriodicityCommentThread,
    PeriodicityContact,
    PeriodicityMessageList,
} from "periodicity-react";
```

`PeriodicityContact` supports search, virtualisation, selection, and a contact context menu. `PeriodicityMessageList`
supports message selection, copy, quote, forward, delete, recall, retry, and a message context menu.
`PeriodicityChat` combines the contact list, conversation, composer, and message actions. `PeriodicityCommentThread`
supports replies, mentions, references, resolving, and deletion.

## Files and previews

```tsx
import { PeriodicityEditor, PeriodicityPreview, PeriodicityProjectManager } from "periodicity-react";
```

- `PeriodicityPreview` renders Markdown and HTML to HTML, renders prose files as articles, and shows code files as a
  structure tree of functions, classes, methods, properties, variables, types, and interfaces.
- `PeriodicityEditor` wraps CodeMirror 6 with syntax highlighting, line numbers, history, search, bracket matching,
  folding, read-only mode, wrapping, and tab-size control.
- `PeriodicityProjectManager` combines a project tree, preview/edit modes, import/export, and file save/change
  callbacks.

Code completion is intentionally not included. Pair the editor with an LSP or a dedicated editor integration when
completion is required.

## Theming

Wrap the application in `PeriodicityTheme`:

```tsx
import { PeriodicityTheme } from "periodicity-react";

<PeriodicityTheme mode="dark">
    <App />
</PeriodicityTheme>;
```

`mode` accepts `"light"`, `"dark"`, or `"system"`. The provider supports controlled and uncontrolled modes, density,
radius, design tokens, and native element attributes. Nested providers inherit unspecified values.

## Internationalisation

```tsx
import { PeriodicityInternational } from "periodicity-react";

<PeriodicityInternational locale="zh-CN">
    <App />
</PeriodicityInternational>;
```

The provider supports locale inheritance, fallback locales, message maps, interpolation, and a native `lang`
override. `PeriodicityAnimation` and `PeriodicityAnimated` provide motion configuration, reduced-motion handling,
and element-polymorphic animation wrappers.

## Motion

Motion is opt-in through `PeriodicityAnimation` and `PeriodicityAnimated`, and respects the system
`prefers-reduced-motion` preference. Ripple layers are shared by interactive surfaces and stop when motion is
disabled.

## Accessibility

- Semantic roles and labels are supplied by default and can be overridden with native `aria-*` attributes.
- Dialog, drawer, menu, dropdown, listbox, tree, and table keyboard interactions are implemented.
- Focus restoration and escape handling are supported by overlays.
- Selection colours are scoped so selected text remains readable.
- Reduced-motion preferences are respected by the animation and ripple layers.

If a component wraps a native control, prefer its native props and events over duplicating ARIA by hand.

## Development

```bash
npm install
npm run dev          # component showcase
npm run build:lib    # publishable ES module, CSS, and declarations
npm run build:app    # static showcase build
npm run lint
npm run format:check
npm run preview      # preview the static showcase build
```

`npm run build` is an alias for `npm run build:lib`. The library build writes `dist/periodicity-react.js`,
`dist/periodicity-react.css`, and declarations under `dist/types`.

## Verification

The repository is checked with:

```bash
npx tsc -p tsconfig.app.json --noEmit
npx eslint src --max-warnings 0
npm run build
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the release history.
