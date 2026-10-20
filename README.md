# Periodicity React

A Material-inspired React component library for product interfaces, admin tools, and data-heavy applications.

`periodicity-react` brings together 130 prefixed components: form controls, overlays, navigation, collections,
messaging, file tooling, and the design-system providers that connect them. The API is TypeScript-first, flex-first,
and deliberately close to the browser: native attributes, events, ARIA, and refs pass through wherever they make
sense.

- **npm:** [`periodicity-react`](https://www.npmjs.com/package/periodicity-react)
- **Version:** `0.1.0`
- **Source:** [github.com/eloyhere/periodicity-react](https://github.com/eloyhere/periodicity-react)
- **Requirements:** React 19, React DOM 19, and a modern browser
- **License:** Apache 2.0

## Design philosophy

Periodicity is built around five rules:

- **Semantic before decorative.** Components consume theme tokens such as `--colourPrimary`, `--surface`, and
  `--state-hover-opacity`; they do not hard-code a house palette. Themes and colour-vision palettes therefore change
  every component at once.
- **Flex-first layout.** The library uses flexbox for composition and never relies on CSS Grid, so it embeds safely in
  host layouts, virtualisers, and scrolling panes.
- **Native behaviour first.** Forms submit, anchors navigate, inputs validate, dialogs trap focus, and refs point at
  real DOM nodes. ARIA and data attributes are additions, not replacements for browser semantics.
- **Composable surfaces.** `Surface`, `StateLayer`, `Ripple`, `Icon`, `Text`, and the layout primitives are shared
  building blocks. High-level components stay thin and remain styleable through tokens.
- **Accessible and international by default.** Focus rings, keyboard paths, reduced-motion handling, contrast-audited
  palettes, and 12 built-in locale dictionaries are part of the public API rather than an afterthought.

## Function map

| Function            | Components                                                                                                                          | Use it for                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Foundations         | `Theme`, `International`, `Surface`, `StateLayer`, `Ripple`, `Text`, `Icon`, `LinearLayout`, `Inline`, `Stack`, `Divider`, `Spacer` | Design tokens, typography, surfaces, and composition.  |
| Inputs              | `Button`, `TextInput`, `TextArea`, `Select`, `Checkbox`, `Switch`, `Range`, `NumberInput`, pickers, `Calendar`                      | Forms, filters, and parameter editing.                 |
| Data                | `List`, `Table`, `Tree`, `Pagination`, `Scrollbar`, `Badge`, `Tag`, `Chip`, `Avatar`                                                | Dense records, virtualised collections, and identity.  |
| Layout              | `Coordinator`, `AppBar`, `Collapse`, `Toolbar`, `Drawer`, `DrawerLayout`, `Tabs`, `Accordion`                                       | Application shells, navigation, and responsive panes.  |
| Overlays            | `Dialog`, `ConfirmDialog`, `InputDialog`, `MessageDialog`, `Dropdown`, `Menu`, `Tooltip`, `Toast`, `Snackbar`                       | Transient feedback, menus, and modal tasks.            |
| Files and messaging | `Editor`, `Preview`, `ProjectManager`, `Chat`, `VirtualChat`, `Contact`, `MessageList`                                              | Code, project structures, conversations, and contacts. |
| Auxiliary           | `Link`, `Anchor`, `Progress`, `Skeleton`, `EmptyState`, `Kbd`, `VisuallyHidden`                                                     | Small, reusable affordances.                           |

## Contents

- [Design philosophy](#design-philosophy)
- [Function map](#function-map)
- [Install](#install)
- [Quick start](#quick-start)
- [Components by function](#components-by-function)
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

Wrap the application in the providers when global theming or locale switching is needed:

```tsx
<PeriodicityTheme theme="accessible">
    <PeriodicityInternational locale="ja-JP">{app}</PeriodicityInternational>
</PeriodicityTheme>
```

## Components by function

- **Foundations and tokens:** `Theme`, `International`, `Surface`, `StateLayer`, `Ripple`, `Text`, `Icon`,
  `LinearLayout`, `Inline`, `Stack`, `Divider`, `Spacer`, `VisuallyHidden`.
- **Inputs and pickers:** `Button`, `TextInput`, `TextArea`, `Select`, `VirtualSelect`, `Checkbox`, `Switch`,
  `Range`, `NumberInput`, `ColourPicker`, `TimePicker`, `DateTimePicker`, `NumberPicker`, `CyclePicker`,
  `VariantPicker`, `Calendar`.
- **Data and identity:** `List`, `VirtualList`, `Table`, `VirtualTable`, `Tree`, `VirtualTree`, `Pagination`,
  `Scrollbar`, `Badge`, `Tag`, `Chip`, `Avatar`, `AvatarGroup`.
- **Navigation and layout:** `Coordinator`, `AppBar`, `Collapse`, `Toolbar`, `Drawer`, `DrawerLayout`, `Tabs`,
  `Accordion`.
- **Overlays and feedback:** `Dialog`, `ConfirmDialog`, `InputDialog`, `MessageDialog`, `Dropdown`, `Menu`,
  `Tooltip`, `Toast`, `Snackbar`, `Progress`, `Skeleton`, `EmptyState`.
- **Files and messaging:** `Editor`, `Preview`, `ProjectManager`, `Chat`, `VirtualChat`, `Contact`,
  `VirtualContact`, `MessageList`, `VirtualMessageList`.
- **Auxiliary:** `Link`, `Anchor`, `Kbd`, `Badge`, `Divider`, `VisuallyHidden`.

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
- `PeriodicityCalendar`

### Colour picker

`PeriodicityColourPicker` combines a native colour input, a visible hex value, and a row of preset swatches. The
native input keeps the platform picker and keyboard behaviour; the label, hint, error, disabled, and read-only states
come from the shared picker field.

```tsx
import { PeriodicityColourPicker } from "periodicity-react";

<PeriodicityColourPicker
    label="Brand colour"
    defaultValue="#1976d2"
    showValue
    onChange={(value) => console.log(value)}
/>;
```

The value is a CSS hex colour. `value` makes it controlled; `defaultValue` keeps it uncontrolled. Preset swatches
use `aria-pressed` and become inert when `readOnly` or `disabled` is set.

### Calendar

`PeriodicityCalendar` is a locale-aware month grid with a single roving tab stop. Values use ISO `YYYY-MM-DD`
strings; `value` makes the selection controlled and `defaultValue` keeps it uncontrolled.

```tsx
import { PeriodicityCalendar } from "periodicity-react";

<PeriodicityCalendar
    label="Delivery date"
    value={date}
    onChange={setDate}
    min="2026-01-01"
    max="2026-12-31"
    locale="en-GB"
    firstDayOfWeek={1}
/>;
```

Keyboard: arrows move by day or week, Home/End move to the week bounds, PageUp/PageDown change month,
Shift+PageUp/PageDown change year, and Enter or Space selects. `showAdjacentDays`, `weekdayLabels`, `monthLabels`,
`renderDay`, `disabled`, and `readOnly` cover the common customisations.

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
- `PeriodicityCoordinator`
- `PeriodicityAppBar`
- `PeriodicityCollapse`
- `PeriodicityToolbar`
- `PeriodicityScrollbar`
- `PeriodicityDrag`

`PeriodicityCoordinator` has exactly three slots: `collapse`, `header`, and `main`. The `collapse` slot shrinks
from `collapseHeight` to zero as `main` scrolls; `header` is the fixed app bar; `main` is the scroll viewport.

```tsx
<PeriodicityCoordinator
    height={520}
    collapseHeight={200}
    collapse={<HeroImage />}
    header={
        <PeriodicityAppBar expandedHeight={64} collapsedHeight={64} scrollBehaviour="none" liftOnScroll={false}>
            <PeriodicityToolbar
                title="Field notes"
                subtitle="Autumn expedition"
                navigationIcon="←"
                actions={
                    <PeriodicityButton size="sm" variant="outline">
                        Share
                    </PeriodicityButton>
                }
            />
        </PeriodicityAppBar>
    }
    main={<Notes />}
/>
```

`PeriodicityCollapse` remains available for an AppBar-owned hero when the older AppBar composition is preferred.

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

Wrap the application in `PeriodicityTheme` and select a global preset with `theme`:

```tsx
import { PeriodicityTheme } from "periodicity-react";

<PeriodicityTheme theme="milk">
    <App />
</PeriodicityTheme>;
```

`theme` is controlled; `defaultTheme` is the uncontrolled equivalent, and `onThemeChange` observes changes.
`useTheme().setTheme(id)` switches the preset at runtime. A bare `<Theme>` keeps the existing system-mode behaviour.
An explicit `mode` prop overrides the preset's light/dark mode; explicit `tokens` override preset tokens.

| Preset            | Chinese      | English                | Mode  |
| ----------------- | ------------ | ---------------------- | ----- |
| `accessible`      | 高对比度     | High contrast          | light |
| `accessible-dark` | 高对比度夜间 | High contrast dark     | dark  |
| `protanopia`      | 红色盲友好   | Protanopia friendly    | light |
| `deuteranopia`    | 绿色盲友好   | Deuteranopia friendly  | light |
| `tritanopia`      | 蓝色盲友好   | Tritanopia friendly    | light |
| `achromatopsia`   | 全色盲友好   | Achromatopsia friendly | light |
| `default`         | 默认         | Default                | light |
| `dark`            | 夜间         | Dark                   | dark  |
| `milk`            | 牛奶白       | Milk white             | light |
| `space-gray`      | 深空灰       | Space grey             | dark  |
| `gray`            | 灰色         | Grey                   | dark  |
| `light-gray`      | 浅灰色       | Light grey             | light |
| `sky-blue`        | 天蓝色       | Sky blue               | light |
| `pale-blue`       | 淡蓝色       | Pale blue              | light |
| `deep-blue`       | 深蓝色       | Deep blue              | dark  |
| `orange`          | 橙色         | Orange                 | light |
| `yellow`          | 黄色         | Yellow                 | light |
| `lemon`           | 柠檬黄       | Lemon yellow           | light |
| `red`             | 红色         | Red                    | light |
| `rose`            | 玫瑰红       | Rose red               | light |
| `green`           | 绿色         | Green                  | light |
| `deep-green`      | 深绿色       | Deep green             | dark  |
| `light-green`     | 浅绿色       | Light green            | light |

`themePresets`, `getThemePreset(id)`, and the `ThemePresetId` type are exported. The accessibility preset raises
text, border, focus, and disabled contrast; the `prefers-contrast` and `forced-colors` media queries provide an
additional system-level layer.

## Internationalisation

```tsx
import { PeriodicityInternational } from "periodicity-react";

<PeriodicityInternational locale="zh-CN">
    <App />
</PeriodicityInternational>;
```

Built-in locales, in order:

| Locale  | Language             |
| ------- | -------------------- |
| `en-GB` | British English      |
| `en-US` | American English     |
| `zh-CN` | 中国大陆简体中文     |
| `zh-SG` | 新加坡简体中文       |
| `zh-HK` | 香港繁体中文         |
| `zh-TW` | 台湾繁体中文         |
| `ja-JP` | 日本語               |
| `ko-KR` | 한국어               |
| `es-ES` | Español (España)     |
| `es-MX` | Español (México)     |
| `pt-PT` | Português (Portugal) |
| `pt-BR` | Português (Brasil)   |

`localeOptions`, `builtInMessages`, `resolveLocaleMessages`, and `useInternational()` are exported. The built-in
dictionaries cover common actions, states, navigation, selection, and relative-date terms; caller messages deep-merge
over them, missing keys fall back to `en-GB`, and custom locale tags remain accepted. `t("save")` resolves a
message, `formatNumber` and `formatDate` follow the active locale, and `dir` is `rtl` for right-to-left custom tags.
Components with visible labels also accept label props for product-specific copy.

`PeriodicityAnimation` and `PeriodicityAnimated` provide motion configuration, reduced-motion handling, and
element-polymorphic animation wrappers.

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
- `PeriodicityDrag` supports Alt+ArrowUp/Alt+ArrowDown keyboard sorting with live-region announcements.
- `PeriodicityScrollbar` supports Arrow, Page, Home/End, and Space keyboard scrolling with scrollbar ARIA.
- `PeriodicityCalendar` and `PeriodicityDateTimePicker` expose full calendar-grid keyboard navigation and roving focus.
- Table and Tree expose row headers, sort-neutral headers, tree levels, checked/selected states, and virtual set positions.
- A skip link, landmark structure, reduced-motion handling, forced-colors support, and `prefers-contrast` styles are built in.

If a component wraps a native control, prefer its native props and events over duplicating ARIA by hand.

## Additional components

The following components are part of the public API. Use the showcase for live examples and the exported prop types for the full API.

| Component              | Purpose                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `EmailInput`           | Email field with a mail keyboard hint and shared email sanitising rules.         |
| `TelephoneInput`       | Telephone field with a tel keyboard hint and shared number sanitising rules.     |
| `CompleteInput`        | Free-text field that suggests matching options while the caller keeps the value. |
| `VirtualSelect`        | Windowed select for long option lists, rendering only the visible rows.          |
| `Radio`                | Single radio option designed to sit inside a RadioGroup.                         |
| `RadioGroup`           | Grouped single-choice control with a fieldset label and orientation.             |
| `Field`                | Label, hint, error, and counter chrome that wraps any native control.            |
| `FieldGroup`           | Fieldset wrapper that groups related choices under one legend and hint.          |
| `Card`                 | Editorial surface with eyebrow, media, footer, tone, and interactivity.          |
| `Surface`              | The layered Material surface: background, component, and foreground.             |
| `StateLayer`           | Hover, press, and focus tint painted above a surface background.                 |
| `Badge`                | Compact status label or count bubble with semantic tones.                        |
| `Tag`                  | Small removable label for categories, states, and filters.                       |
| `TabLayout`            | Compatibility alias for `Tabs`, retained for existing imports.                   |
| `Chip`                 | Assist, filter, and input chips with icons and removal.                          |
| `Avatar`               | Identity mark with initials or image, size, tone, and presence.                  |
| `AvatarGroup`          | Overlapping avatar stack with an overflow count.                                 |
| `Divider`              | Thin rule with optional inset and label variants.                                |
| `Timeline`             | Chronological record with item states, icons, and tones.                         |
| `Rate`                 | Star rating with half values, read-only mode, and small or large sizes.          |
| `EmptyState`           | Centred empty message with icon, description, and action slots.                  |
| `Banner`               | Page-level announcement with an action and a dismissible state.                  |
| `Progress`             | Linear determinate or indeterminate progress with tone and size.                 |
| `CircularProgress`     | Circular determinate or indeterminate progress with a label.                     |
| `ProgressRing`         | Compact circular gauge for a single bounded value.                               |
| `Spinner`              | Small rotating busy indicator in three sizes.                                    |
| `Skeleton`             | Placeholder shapes for text, rectangles, and circles while loading.              |
| `ElementLoading`       | Overlay that binds a spinner to one referenced element.                          |
| `FullscreenLoading`    | Native-dialog loader that covers the viewport and accepts a duration.            |
| `useLoad`              | Imperative loader service with element, delay, and promise overloads.            |
| `ConfirmDialog`        | Confirmation modal with tone, confirm label, and an async-safe close.            |
| `MessageDialog`        | Announcement modal with one action and a close callback.                         |
| `InputDialog`          | Single-line input modal with validation and submit handling.                     |
| `Snackbar`             | Transient bottom message with an optional action.                                |
| `Backdrop`             | Full-screen scrim with neutral or accent tone and optional blur.                 |
| `Dropdown`             | Anchored dropdown panel with header, footer, empty, and item slots.              |
| `DropdownItem`         | One selectable row inside a dropdown, with icon and shortcut.                    |
| `DropdownGroup`        | Labelled group of related dropdown items.                                        |
| `DropdownSeparator`    | Rule between dropdown groups.                                                    |
| `ContextMenu`          | Right-click and long-press menu with a heading and empty slot.                   |
| `ContextMenuGroup`     | Labelled group inside a context menu.                                            |
| `ContextMenuItem`      | One action row inside a context menu, with icon and danger tone.                 |
| `ContextMenuSeparator` | Rule between context-menu groups.                                                |
| `Popover`              | Anchored dismissible panel for a small amount of content.                        |
| `Tooltip`              | Hover and focus hint positioned on any side of its child.                        |
| `Accordion`            | Expandable panels in single, multiple, or contained mode.                        |
| `Breadcrumbs`          | Trail of route links with truncation for long paths.                             |
| `Pagination`           | Page controls with previous, next, and a bounded page count.                     |
| `NormalList`           | List preset without selection.                                                   |
| `MultipleList`         | List preset with toggleable multi-selection.                                     |
| `SelectList`           | List preset with one active row.                                                 |
| `CheckList`            | Checkable list with a checkbox per row.                                          |
| `VirtualList`          | Windowed list for long collections, rendering only visible rows.                 |
| `CheckTree`            | Tree preset with a checkbox per node.                                            |
| `SelectTree`           | Tree preset with single-node selection.                                          |
| `VirtualTree`          | Windowed tree for large hierarchies.                                             |
| `VirtualContact`       | Windowed contact list for long rosters.                                          |
| `VirtualMessageList`   | Windowed message transcript for long conversations.                              |
| `VirtualChat`          | Windowed conversation layout for long threads.                                   |
| `ContactContextMenu`   | Contact row wrapped in the shared context menu.                                  |
| `MessageContextMenu`   | Message row wrapped in the shared context menu.                                  |
| `Portal`               | Renders children into document body or a supplied container.                     |
| `VisuallyHidden`       | Content that stays available to assistive technology only.                       |

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
npm run audit:contrast
npm run audit:locales
npm run test:a11y
npm run build
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the release history.
