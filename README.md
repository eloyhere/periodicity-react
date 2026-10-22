# Periodicity React

A Material-inspired React 19 component library for product interfaces, admin tools, and data-heavy applications.

`periodicity-react` ships **140 `Periodicity*` components**, four chart types, file and image pickers, scoped
typography, design-system providers, and **12 built-in locales**. The API is TypeScript-first, flex-first, and close
to the browser: native attributes, events, ARIA, and refs pass through wherever they make sense.

- **npm:** [`periodicity-react`](https://www.npmjs.com/package/periodicity-react)
- **Version:** `0.1.12`
- **Showcase:** run `npm run dev`; source in [`src/showcase`](src/showcase)
- **Source:** [github.com/eloyhere/periodicity-react](https://github.com/eloyhere/periodicity-react)
- **Requirements:** React 19 and React DOM 19
- **License:** Apache 2.0

## Contents

- [What is in 0.1.9](#what-is-in-019)
- [Design principles](#design-principles)
- [Requirements and installation](#requirements-and-installation)
- [Quick start](#quick-start)
- [Public surface](#public-surface)
- [Theming](#theming)
- [Internationalisation](#internationalisation)
- [Charts](#charts)
- [File and image pickers](#file-and-image-pickers)
- [Forms and inputs](#forms-and-inputs)
- [Pickers and calendar](#pickers-and-calendar)
- [Collections and data](#collections-and-data)
- [Overlays and feedback](#overlays-and-feedback)
- [Navigation and layout](#navigation-and-layout)
- [Messaging and comments](#messaging-and-comments)
- [Typography and Font](#typography-and-font)
- [Motion and standard events](#motion-and-standard-events)
- [Accessibility](#accessibility)
- [Styling and tokens](#styling-and-tokens)
- [API conventions](#api-conventions)
- [Component index](#component-index)
- [Development](#development)
- [Changelog](#changelog)

## What is in 0.1.9

- **Canvas and WebGL charts.** `BarChart`, `PieChart`, `LineChart`, and `ScatterChart` share a responsive frame
  with a WebGL series layer, a canvas renderer fallback, device-pixel-ratio sizing, legends, screen-reader data
  tables, and redraws scheduled through the library's priority task queue.
- **Native file and image pickers.** `useFilePick` drives the hidden native file input rendered by `FilePicker`,
  `PhotoPicker`, and `AvatarPicker`. Photo and avatar selections get a Base64 preview and an in-dialog cropper with
  confirm, cancel, and close semantics.
- **A complete internationalisation pass.** Charts, pickers, comments, transfer, date-time, mention, rating,
  progress, radio, scrollbar, context menu, combobox, loading, and email/telephone validation copy now read from
  the active dictionary in all 12 built-in locales.
- **Scoped typography.** `Font` and `useFont` expose type-scale levels, families, weights, line heights, letter
  spacing, transforms, and alignment through a nested font context.
- **Electron-safe overlays.** Dropdown and popover panels opt out of window dragging with
  `-webkit-app-region: no-drag`, so menus that cross a drag region in an Electron app bar remain fully clickable.

## Design principles

Periodicity is built around six rules:

- **Semantic before decorative.** Components consume tokens such as `--color-primary`, `--color-on-surface`, and
  `--space-4`; they do not hard-code a house palette. Themes and colour-vision palettes therefore change every
  component at once.
- **Flex-first layout.** The library composes with flexbox and does not rely on CSS Grid, so it embeds safely in
  host layouts, virtualisers, and scrolling panes.
- **Native behaviour first.** Forms submit, anchors navigate, inputs validate, dialogs trap focus, and refs point
  at real DOM nodes. ARIA and data attributes are additions, not replacements for browser semantics.
- **Composable surfaces.** `Surface`, `StateLayer`, `Ripple`, `Icon`, `Text`, `Font`, and the layout primitives are
  shared building blocks. High-level components stay thin and remain styleable through tokens.
- **Accessible and international by default.** Focus rings, keyboard paths, reduced-motion handling,
  contrast-audited palettes, forced-colours styles, and 12 locale dictionaries are part of the public API.
- **Scheduled work, not layout thrash.** Collections virtualise, charts defer drawing to the task scheduler, and
  stale frames are cancelled when inputs change.

## Requirements and installation

```bash
npm install periodicity-react
```

`react` and `react-dom` are peer dependencies; install React 19 in the host application. The package ships an ES
module, TypeScript declarations, and a single extracted stylesheet. Import the stylesheet once at the application
entry:

```tsx
import "periodicity-react/styles.css";
```

The package works with Vite, Next.js, webpack, and other ESM-aware bundlers. Node.js 20 or newer is required for
the development scripts.

## Quick start

Wrap the application in the theme, internationalisation, and toast providers, then use the prefixed components.

```tsx
import { useState } from "react";
import {
    PeriodicityButton,
    PeriodicityInternational,
    PeriodicityTextInput,
    PeriodicityTheme,
    PeriodicityToastProvider,
} from "periodicity-react";
import "periodicity-react/styles.css";

export function SignIn() {
    const [email, setEmail] = useState("");

    return (
        <PeriodicityTheme theme="milk" mode="system">
            <PeriodicityInternational locale="en-GB">
                <PeriodicityToastProvider>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            console.log(email);
                        }}
                    >
                        <PeriodicityTextInput
                            label="Email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            hint="We only use this address for sign-in."
                        />
                        <PeriodicityButton type="submit">Continue</PeriodicityButton>
                    </form>
                </PeriodicityToastProvider>
            </PeriodicityInternational>
        </PeriodicityTheme>
    );
}
```

## Public surface

Component exports use the `Periodicity*` prefix only. The package root also exposes two hooks and the standard event
utilities. The full component inventory is in the [component index](#component-index).

| Export group    | Names                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- |
| Components      | Every `Periodicity*` component, plus exported prop types where provided                   |
| Hooks           | `useFilePick`, `useFont`                                                                  |
| Standard events | `createStandardEvent`, `useStandardEvents`, `withStandardEvents`                          |
| Types           | Shared prop types, `PeriodicityStandardEventProps`, chart, picker, font, and locale types |

Import from the single package entry:

```tsx
import { PeriodicityButton, PeriodicityDialog, useFilePick } from "periodicity-react";
```

The published package intentionally exposes the prefixed component surface only.

## Theming

Wrap the application in `PeriodicityTheme` and choose a preset, mode, density, radius, and token overrides.

```tsx
import { useState, type ComponentProps } from "react";
import { PeriodicityTheme } from "periodicity-react";

type ThemeId = NonNullable<ComponentProps<typeof PeriodicityTheme>["theme"]>;

export function Shell() {
    const [theme, setTheme] = useState<ThemeId>("milk");

    return (
        <PeriodicityTheme
            theme={theme}
            mode="system"
            density="regular"
            radius="default"
            onThemeChange={(next) => setTheme(next)}
        >
            <App />
        </PeriodicityTheme>
    );
}
```

`theme` is controlled; `defaultTheme` is the uncontrolled equivalent. `mode` is `light`, `dark`, or `system` and
overrides the preset's own appearance. `density` is `compact`, `regular`, or `comfortable`; `radius` is `sharp`,
`default`, `rounded`, or `pill`. `tokens` and `defaultTokens` accept CSS custom properties that win over preset
values.

```tsx
<PeriodicityTheme
    theme="dark"
    tokens={{
        "--color-primary": "#f48fb1",
        "--color-secondary": "#80cbc4",
        "--space-4": "18px",
    }}
>
    <App />
</PeriodicityTheme>
```

### Presets

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

The accessibility presets raise text, border, focus, and disabled contrast. `prefers-contrast` and
`forced-colors` provide an additional system-level layer. Theme tokens are documented in
[`src/component/foundation/tokens.css`](src/component/foundation/tokens.css); the most common groups are colour
(`--color-*`), spacing (`--space-*`), radius (`--radius-*`), typography (`--type-*`, `--weight-*`, `--leading-*`),
and elevation (`--elevation-*`).

## Internationalisation

Wrap the application in `PeriodicityInternational` and set `locale`. All built-in component copy — labels, empty
states, chart legends and table headers, picker copy, validation messages, and comment actions — reads from the
active dictionary.

```tsx
import { useState, type ComponentProps } from "react";
import { PeriodicityInternational } from "periodicity-react";

type LocaleId = NonNullable<ComponentProps<typeof PeriodicityInternational>["locale"]>;

export function LocalisedApp() {
    const [locale, setLocale] = useState<LocaleId>("zh-CN");

    return (
        <>
            <LocaleSwitcher value={locale} onChange={setLocale} />
            <PeriodicityInternational locale={locale}>
                <App />
            </PeriodicityInternational>
        </>
    );
}
```

`locale` is controlled; `defaultLocale` is the uncontrolled equivalent. `fallbackLocale` defaults to `en-GB`.
Custom messages deep-merge over the built-in dictionary:

```tsx
<PeriodicityInternational
    locale="zh-CN"
    messages={{
        save: "保存",
        cancel: "取消",
        noData: "暂无数据",
        legend: "图例",
        chooseFile: "选择文件",
    }}
>
    <App />
</PeriodicityInternational>
```

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

Custom locale tags such as `fr-CA` are accepted; missing keys fall through the fallback locale to `en-GB`.
Components with visible labels also accept label props for product-specific copy. The showcase language picker
shows each locale as “native name · English name” and opts out of browser auto-translation so the authored
language remains visible.

## Charts

The chart family shares one canvas/WebGL frame:

- **Two renderer layers.** A WebGL series layer sits below a 2D canvas overlay used for axes and labels. `renderer`
  accepts `"auto"` (WebGL when available), `"webgl"`, or `"canvas"`; an unavailable or failed WebGL context falls
  back to the 2D canvas renderer.
- **Responsive and crisp.** A `ResizeObserver` tracks the plot, the device pixel ratio sizes both canvases, and
  redraws are scheduled through the library's priority task queue. `renderPriority` accepts `"high"`, `"medium"`,
  or `"low"`; a newer render cancels the queued frame.
- **Accessible by construction.** The plot exposes `role="img"` with `ariaLabel`, and a visually hidden data table
  mirrors every value for screen readers.
- **Theme-aware.** Series colours come from `series.color`, the `palette` prop, or the active theme. Aliased CSS
  custom properties are resolved through computed styles before they reach canvas or WebGL.

Every chart accepts `ariaLabel`, `height` (default `320`), `renderer`, `renderPriority`, `palette`, `showLegend`,
`showGrid` where relevant, `emptyLabel`, `valueFormatter`, `onError`, `className`, `ref`, and native `div`
attributes.

### Bar chart

```tsx
import { PeriodicityBarChart } from "periodicity-react";

<PeriodicityBarChart
    ariaLabel="Quarterly revenue and costs"
    categories={["Q1", "Q2", "Q3", "Q4"]}
    series={[
        { id: "revenue", label: "Revenue", values: [42, 58, 64, 81] },
        { id: "costs", label: "Costs", values: [28, 34, 39, 47] },
    ]}
    stacked={false}
    showValues
    renderer="auto"
    height={320}
/>;
```

`BarChart` supports grouped and stacked bars, negative values around a zero baseline, optional value labels, and
category labels along the x axis.

### Pie chart

```tsx
import { PeriodicityPieChart } from "periodicity-react";

<PeriodicityPieChart
    ariaLabel="Revenue by segment"
    data={[
        { id: "product", label: "Product", value: 44 },
        { id: "services", label: "Services", value: 28 },
        { id: "support", label: "Support", value: 18 },
        { id: "other", label: "Other", value: 10 },
    ]}
    innerRadius={0.52}
    showPercentages
    height={320}
/>;
```

`innerRadius` is a ratio of the outer radius and is clamped to `0..0.85`; omit it for a full pie. Positive finite
values are included in the total, the legend, and the accessible table.

### Line chart

```tsx
import { PeriodicityLineChart } from "periodicity-react";

<PeriodicityLineChart
    ariaLabel="Monthly sessions by device"
    series={[
        {
            id: "desktop",
            label: "Desktop",
            points: [
                { x: 1, y: 22 },
                { x: 2, y: 28 },
                { x: 3, y: 25 },
                { x: 4, y: 36 },
            ],
        },
        {
            id: "mobile",
            label: "Mobile",
            points: [
                { x: 1, y: 12 },
                { x: 2, y: 16 },
                { x: 3, y: 21 },
                { x: 4, y: 24 },
            ],
        },
    ]}
    area
    showPoints
    xFormatter={(value) => `M${value}`}
    yFormatter={(value) => `${value}k`}
    height={320}
/>;
```

`area` fills each series to the plot baseline with a translucent tint; `showPoints` adds markers. Numeric x and y
domains are padded automatically when all values are equal.

### Scatter chart

```tsx
import { PeriodicityScatterChart } from "periodicity-react";

<PeriodicityScatterChart
    ariaLabel="Conversion by cohort"
    series={[
        {
            id: "control",
            label: "Control",
            points: [
                { x: 12, y: 18 },
                { x: 18, y: 24 },
                { x: 24, y: 21 },
            ],
        },
        {
            id: "variant",
            label: "Variant",
            points: [
                { x: 14, y: 28 },
                { x: 20, y: 35 },
                { x: 26, y: 33 },
            ],
        },
    ]}
    pointRadius={4}
    height={320}
/>;
```

`xFormatter` and `yFormatter` control axis labels and the accessible table; `valueFormatter` remains the general
fallback for numeric values.

## File and image pickers

All three pickers render their own hidden native `<input type="file">`. `useFilePick` drives that input and returns
a stable `pick()` function that resolves with the selected files.

### useFilePick

```tsx
import { useFilePick } from "periodicity-react";

export function ImportButton() {
    const pick = useFilePick(["image/png", ".jpg"], { multiple: true });

    const handleClick = async () => {
        const files = await pick();
        if (files.length > 0) {
            await upload(files);
        }
    };

    return <button onClick={handleClick}>Import images</button>;
}
```

The hook accepts an `accept` string or list and an options object with `multiple`, `capture`, `disabled`, and
`inputRef`. Without an `inputRef` it creates, mounts, and removes a temporary native input, so it also works
standalone. Cancelling resolves with `[]`; a newer pick cancels the previous unresolved promise, and unmounting
settles a pending promise with `[]`.

### FilePicker

```tsx
import { PeriodicityFilePicker } from "periodicity-react";

<PeriodicityFilePicker
    label="Attachment"
    accept={[".pdf", ".png", ".jpg"]}
    multiple
    hint="PDF or image files"
    onChange={(files) => console.log(files.map((file) => file.name))}
/>;
```

`FilePicker` emits `onChange(files)` immediately after the native selection. Its default slot replaces the trigger
contents; pass a function to receive `{ open, disabled, files, summary }`. Keep the slot content presentational
because it renders inside the trigger button.

### PhotoPicker

```tsx
import { PeriodicityPhotoPicker } from "periodicity-react";

<PeriodicityPhotoPicker
    label="Cover photo"
    aspect={16 / 9}
    outputWidth={1600}
    onChange={(selection) => {
        console.log(selection.file, selection.dataUrl, selection.cropped);
    }}
/>;
```

### AvatarPicker

```tsx
import { PeriodicityAvatarPicker } from "periodicity-react";

<PeriodicityAvatarPicker
    label="Profile photo"
    name="Mira Chen"
    size="lg"
    onChange={(selection) => saveAvatar(selection.file)}
/>;
```

Photo and avatar selections open a crop dialog. The change contract is:

| Action                                | Result                                                   |
| ------------------------------------- | -------------------------------------------------------- |
| Confirm in the crop dialog            | One `change` with `{ file, dataUrl, cropped: true }`     |
| Cancel in the crop dialog             | One `change` with the original image and `cropped` false |
| Close button, Escape, or the backdrop | No `change`                                              |

`PhotoPicker` slots are `pick`, `preview`, and `crop`; `AvatarPicker` slots are `avatar` and `crop`. The crop slot
is rendered as the body of the library `Dialog`, not a native dialog. `labels` accepts per-field copy overrides,
and `ImageSelection` is exported as `PeriodicityImageSelection`.

## Forms and inputs

### Text fields

`TextInput`, `TextArea`, `EmailInput`, `TelephoneInput`, `NumberInput`, `CompleteInput`, and `Mention` share the
six-slot `InputLayout` shell: `prefix`, `hint`, `message`, `limitation`, `error`, and `suffix`.

```tsx
import { PeriodicityTextInput } from "periodicity-react";

<PeriodicityTextInput
    label="Workspace name"
    value={name}
    onChange={(event) => setName(event.target.value)}
    prefix="Folder"
    hint="Visible to everyone in the workspace."
    message="Lowercase letters, numbers, and hyphens."
    limitation={`${name.length}/40`}
    suffix="Check"
    required
/>;
```

Email and telephone fields sanitise input, preserve the caret, use native pattern attributes, and surface
localised validation messages from the active dictionary. `PeriodicityForm`, `PeriodicityFormField`, and
`PeriodicityFormActions` wrap a native `<form>` and generate `label htmlFor`, `aria-describedby`, and
`aria-invalid` wiring for native controls.

### Buttons

`PeriodicityButton` supports the compact `prefix`, `content`, and `suffix` slots in addition to icons, variants, and
sizes.

```tsx
<PeriodicityButton
    variant="outline"
    prefix="Plus"
    content="New project"
    suffix="ChevronRight"
    onClick={createProject}
/>
```

### Other controls

`PeriodicityCheckbox`, `PeriodicityRadio` / `PeriodicityRadioGroup`, `PeriodicitySwitch`, `PeriodicityRange`,
`PeriodicityField`, `PeriodicityFieldGroup`, `PeriodicitySelect`, `PeriodicityVirtualSelect`,
`PeriodicityTreeSelect`, and `PeriodicityCombobox` cover standard form and filter layouts. Controlled and
uncontrolled values, disabled/read-only states, and native props are supported throughout.

## Pickers and calendar

| Component                   | Behaviour                                                               |
| --------------------------- | ----------------------------------------------------------------------- |
| `PeriodicityTimePicker`     | Wheel-style 24-hour time selection with typed input.                    |
| `PeriodicityDateTimePicker` | Combined date and time panel with Year, Month, Hour, and Minute fields. |
| `PeriodicityNumberPicker`   | Android-style number wheel with typed suggestions and min/max/step.     |
| `PeriodicityColourPicker`   | Native colour input with preset swatches and an optional value label.   |
| `PeriodicityCyclePicker`    | Looping wheel picker with autocomplete and custom item types.           |
| `PeriodicityVariantPicker`  | Radio-style variant chips.                                              |
| `PeriodicityCalendar`       | Locale-aware month grid with ISO values and full keyboard navigation.   |

```tsx
<PeriodicityCalendar
    label="Delivery date"
    value={date}
    onChange={setDate}
    min="2026-01-01"
    max="2026-12-31"
    firstDayOfWeek={1}
/>
```

Calendar values are ISO `YYYY-MM-DD` strings. Arrow keys move by day or week, Home/End move to the week bounds,
PageUp/PageDown change month, Shift+PageUp/PageDown change year, and Enter or Space selects. Day cells expose
`slots.header`, `slots.body`, and `slots.footer`.

## Collections and data

Collections can be backed by plain arrays or adapters, with optional fixed-row virtualisation.

```tsx
import { PeriodicityList, PeriodicityTable, PeriodicityTree } from "periodicity-react";

<PeriodicityList
    items={people}
    getKey={(person) => person.id}
    selectionMode="single"
    renderItem={(person) => `${person.firstName} ${person.lastName}`}
/>;

<PeriodicityTable
    columns={[
        { id: "name", header: "Name", cell: (person) => person.name },
        { id: "role", header: "Role", cell: (person) => person.role },
    ]}
    rows={people}
    rowKey={(person) => person.id}
    caption="Team members"
/>;

<PeriodicityTree items={nodes} getKey={(node) => node.id} renderItem={(node) => node.label} />;
```

The collection family includes `List`, `Tree`, `Table`, `Select`, `Combobox`, and `Transfer`, plus the
`Virtual*` presets and the `NormalList` / `MultipleList` / `SelectList` / `CheckList` / `CheckTree` /
`SelectTree` convenience wrappers. Use `virtual`, `height`, and `itemHeight` / `rowHeight` for fixed-row
virtualisation. Selection, expansion, loading, empty, and disabled states are available across the family.

## Overlays and feedback

```tsx
import {
    PeriodicityAlert,
    PeriodicityDialog,
    PeriodicityDropdown,
    PeriodicityDropdownItem,
    PeriodicityTooltip,
} from "periodicity-react";

<PeriodicityAlert tone="success" title="Saved" description="Your changes are up to date." />;

<PeriodicityDialog open={open} title="Delete project" onClose={() => setOpen(false)}>
    This action cannot be undone.
</PeriodicityDialog>;

<PeriodicityDropdown ariaLabel="Project actions" trigger={(slot) => <button {...slot}>Actions</button>}>
    <PeriodicityDropdownItem onSelect={rename}>Rename</PeriodicityDropdownItem>
    <PeriodicityDropdownItem onSelect={archive}>Archive</PeriodicityDropdownItem>
</PeriodicityDropdown>;

<PeriodicityTooltip content="Copy link">
    <PeriodicityButton aria-label="Copy link" prefix="Link" />
</PeriodicityTooltip>;
```

The overlay set covers dialogs, confirm/message/input dialogs, drawer and drawer layout, context menu, dropdown,
popover, tooltip, snackbar, toast, alert, banner, backdrop, and fullscreen/element loading. Controlled and
uncontrolled open state, close reasons, Escape handling, focus restoration, and native panel attributes are
supported.

Dropdown and popover panels are portalled to `document.body` and marked `-webkit-app-region: no-drag`, so their
entire surface stays interactive when it overlaps an Electron drag region such as a custom app bar or hero.

## Navigation and layout

Navigation components include `PeriodicityNavigationView`, `PeriodicityTabs` / `PeriodicityTabPanel`,
`PeriodicityPager` / `PeriodicityPage`, the `PeriodicityMenu` family, `PeriodicityStepper`, and
`PeriodicityAccordion`.

Layout is flex-first and does not use CSS Grid. Structural components include:

- `PeriodicityGridLayout`
- `PeriodicityLinearLayout` and `PeriodicityLinearLayoutItem`
- `PeriodicityConstraintLayout` and `PeriodicityConstraint`
- `PeriodicityWaterfallLayout`
- `PeriodicityDrawerLayout`
- `PeriodicityCoordinator`, `PeriodicityAppBar`, `PeriodicityCollapse`, and `PeriodicityToolbar`
- `PeriodicityScrollbar` and `PeriodicityScroll`
- `PeriodicityDrag`

`PeriodicityCoordinator` has exactly three slots: `collapse`, `header`, and `main`. The collapse slot shrinks from
`collapseHeight` to zero as `main` scrolls; `header` is the fixed app bar; `main` is the scroll viewport. When
`main` cannot scroll, vertical wheel input that no child consumes collapses or restores the slot instead of
scrolling the page; nested scrollers keep priority.

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

`PeriodicityToolbar` also accepts `prefix`, `content`, and `suffix` slots. The three slots share the row equally;
with one slot it fills the row, and with two they are split evenly. String values in `prefix` and `suffix` are icon
names.

`PeriodicityDrag` reorders the direct children of a single slotted container and renders a pointer-following drag
ghost while sorting.

## Messaging and comments

The messaging family includes `PeriodicityContact` / `PeriodicityVirtualContact`, `PeriodicityMessageList` /
`PeriodicityVirtualMessageList`, `PeriodicityChat` / `PeriodicityVirtualChat`,
`PeriodicityAgentChat` / `PeriodicityVirtualAgentChat`, and the contact and message context menus.

- `PeriodicityContact` supports search, virtualisation, selection, and a contact context menu.
- `PeriodicityMessageList` supports selection, copy, quote, forward, delete, recall, retry, and a message context
  menu. Pass `reactions` (for example `defaultMessageReactions`) to add Telegram-style emoji reactions to the
  footer beside the timestamp: six quick choices form one native radio group, and the trailing more button opens
  the remaining emoji packs in a popover. `PeriodicityVirtualMessageList` defaults to a 136px row so the footer
  stays visible.
- `PeriodicityChat` combines the contact list, conversation, composer, and message actions.
- `PeriodicityAgentChat` and `PeriodicityVirtualAgentChat` reuse that layout for an agent workspace: the left pane is
  session history, agent answers render Markdown, and reasoning appears in its own collapsible view with a stable
  width and an animated height transition. Messages marked `streaming` reveal through a typewriter with a caret, and
  `typingSpeed` controls the cadence.
- `PeriodicityCommentThread` supports replies, mentions, references, resolving, and deletion; the new
  `PeriodicityVirtualCommentThread` virtualises the flattened thread at a fixed row height.

Both comment threads accept a `comment` slot for whole-item rendering. The contact, message, and chat components
expose `contact`, `context`, `message`, `messageContext`, and `avatar` slots that receive the rendered index and the
item.

## Typography and Font

`PeriodicityText` renders the type scale with semantic tones. `PeriodicityFont` creates a scoped typography context
and `useFont` reads the computed family, size, colour, weight, line height, letter spacing, and transform of a
referenced element.

```tsx
import { PeriodicityFont, useFont } from "periodicity-react";

<PeriodicityFont level="h3" family="display" weight="semibold" letterSpacing="tight">
    Expedition notes
</PeriodicityFont>;

const font = useFont(triggerRef);
```

`Font` levels are `display`, `h1`, `h2`, `h3`, `h4`, `body`, `body-sm`, `label`, and `mono`; families are `sans`,
`display`, `mono`, or a raw CSS family stack. `useFont` falls back to the nearest `Font` scope before the ref
mounts, which makes it useful for portalled overlays that should match their trigger.

## Documents

`PeriodicityMarkdown` renders a read-only Markdown document as sanitised, semantic HTML: headings, paragraphs,
nested lists, tables, quotes, fenced code, task lists, links, and images. Raw HTML is escaped rather than executed,
and links and images are limited to safe URL schemes.

`PeriodicityTex` renders TeX as native MathML. A source containing `\begin{document}` is treated as a complete LaTeX
document and becomes an HTML article: title, authors, abstract, numbered sections and appendix, lists, tables,
figures, footnotes, citations, cross-references, and embedded formulas. Preamble `\newcommand`, `\renewcommand`,
`\def`, and `\DeclareMathOperator` definitions are expanded, and `\includegraphics`, `\href`, and `\url` are limited
to safe URL schemes.

```tsx
import { PeriodicityMarkdown, PeriodicityTex } from "periodicity-react";

<PeriodicityMarkdown source={"# Notes\n\nRead **only**."} />;

<PeriodicityTex source="E = mc^2" />;
<PeriodicityTex display={false} source="a^2 + b^2 = c^2" />;
<PeriodicityTex source={paper} />;
```

`Markdown` accepts `source` and an optional `breaks` flag. `Tex` accepts `source` and a `display` flag that chooses
between block and inline maths; `display` is ignored for complete documents. External files referenced with
`\input` or `\bibliography` are not loaded, packages are not executed, custom environments fall back to their
rendered content, and rows inside `align` are not individually numbered.

## Motion and standard events

`PeriodicityAnimation` and `PeriodicityAnimated` provide motion configuration, reduced-motion handling, and
element-polymorphic animation wrappers. Ripple layers are shared by interactive surfaces and stop when motion is
disabled.

Every public `Periodicity*` component accepts native React props and the standard event layer without replacing
each other:

```tsx
<PeriodicityButton
    onClick={save}
    onStandardClick={(event) => console.log(event.count, event.source)}
    standardEvents={{
        press: start,
        drag: reorder,
        continuous: zoom,
    }}
/>
```

Named listeners are available for `over`, `enter`, `leave`, `wheel`, `click`, `press`, `input`, `continuous`, and
`drag`. Use `onStandardEvent` for one catch-all listener, or `standardEvents` for per-event handlers and
thresholds. Native `onClick`, `onWheel`, `onInput`, and `onDrag` remain untouched.

## Accessibility

- Semantic roles and labels are supplied by default and can be overridden with native `aria-*` attributes.
- Dialog, drawer, menu, dropdown, listbox, tree, and table keyboard interactions are implemented.
- Focus restoration and Escape handling are supported by overlays.
- Selection colours are scoped so selected text remains readable.
- Reduced-motion preferences are respected by the animation and ripple layers.
- `PeriodicityDrag` supports Alt+ArrowUp/Alt+ArrowDown keyboard sorting with live-region announcements.
- `PeriodicityScrollbar` supports Arrow, Page, Home/End, and Space keyboard scrolling with scrollbar ARIA.
- `PeriodicityCalendar` and `PeriodicityDateTimePicker` expose full calendar-grid keyboard navigation and roving
  focus.
- Table and Tree expose row headers, sort-neutral headers, tree levels, checked/selected states, and virtual set
  positions.
- Charts expose the plot as an image with an accessible label and mirror every value in a visually hidden table.
- A skip link, landmark structure, reduced-motion handling, forced-colours support, and `prefers-contrast` styles
  are built in.

If a component wraps a native control, prefer its native props and events over duplicating ARIA by hand.

## Styling and tokens

Import `periodicity-react/styles.css` once. Components expose stable class names for consumer overrides, and theming
is designed to happen through CSS custom properties rather than forking component styles. The design-system tokens
cover colour roles, surfaces, outlines, spacing, radii, typography, state layers, elevation, and z-index layers.

```css
:root {
    --color-primary: #1976d2;
    --color-on-primary: #ffffff;
    --color-surface: #fbf9f6;
    --space-4: 16px;
    --radius-md: 12px;
}
```

The library is flex-first and does not use CSS Grid. Host applications may use Grid freely around the components;
the structural components themselves remain flex containers.

## API conventions

- **Controlled and uncontrolled state.** Components generally accept `value` / `defaultValue` plus a change
  callback, or `open` / `defaultOpen` plus an open-change callback. Passing the controlled prop wins.
- **Native attributes and events.** Public components extend their native element props; explicit native handlers
  are composed with internal handlers rather than replaced.
- **Refs.** Most components accept `ref` for the root element, and some accept a dedicated `rootRef` or internal
  input ref for composite fields.
- **Slots.** Slot props accept either a node or a render function receiving a typed context. Slot content is
  presentational; the component keeps ownership of behaviour and ARIA.
- **Change events.** File selections emit immediately. Image pickers emit only after the crop dialog closes with
  Confirm or Cancel. Charts are read-only visualisations and expose no value change event.
- **Prefix only.** The published entry point exposes `Periodicity*` components, `useFilePick`, `useFont`, and the
  standard event utilities.

## Component index

The published package contains 140 `Periodicity*` components. The prefix is omitted below for readability.

| Family                    | Components                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Providers and foundations | Theme, International, Animation, Animated, Portal, Surface, StateLayer, VisuallyHidden, Font, Text, Icon, Divider                                                                                                                                                                                                                                                                                                                                                              |
| Actions and fields        | Button, TextInput, TextArea, EmailInput, TelephoneInput, NumberInput, CompleteInput, Mention, Select, VirtualSelect, TreeSelect, Combobox, Checkbox, Radio, RadioGroup, Switch, Range, Field, FieldGroup, Form, FormField, FormActions, Link, Anchor                                                                                                                                                                                                                           |
| Pickers and calendar      | FilePicker, PhotoPicker, AvatarPicker, TimePicker, DateTimePicker, NumberPicker, ColourPicker, CyclePicker, VariantPicker, Calendar                                                                                                                                                                                                                                                                                                                                            |
| Charts                    | BarChart, PieChart, LineChart, ScatterChart                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Collections and data      | List, VirtualList, NormalList, MultipleList, SelectList, CheckList, Tree, VirtualTree, CheckTree, SelectTree, Table, VirtualTable, Transfer, Pagination, Scrollbar, Scroll, Drag, Timeline, Card                                                                                                                                                                                                                                                                               |
| Overlays and feedback     | Dialog, ConfirmDialog, MessageDialog, InputDialog, Drawer, DrawerLayout, Popover, Dropdown, DropdownItem, DropdownGroup, DropdownSeparator, ContextMenu, ContextMenuItem, ContextMenuGroup, ContextMenuSeparator, Menu, MenuItem, MenuGroup, MenuSeparator, Tooltip, ToastProvider, Snackbar, Alert, Banner, Backdrop, FullscreenLoading, ElementLoading, Progress, CircularProgress, ProgressRing, Spinner, Skeleton, Rate, Badge, Tag, Chip, Avatar, AvatarGroup, EmptyState |
| Navigation and layout     | Coordinator, AppBar, Collapse, Toolbar, Tabs, TabPanel, Pager, Page, NavigationView, Stepper, Accordion, Breadcrumbs, LinearLayout, LinearLayoutItem, ConstraintLayout, Constraint, GridLayout, WaterfallLayout                                                                                                                                                                                                                                                                |
| Messaging and comments    | Contact, VirtualContact, ContactContextMenu, MessageList, VirtualMessageList, MessageContextMenu, Chat, VirtualChat, AgentChat, VirtualAgentChat, CommentThread, VirtualCommentThread                                                                                                                                                                                                                                                                                          |
| Documents                 | Markdown, Tex                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Development

```bash
npm install
npm run dev           # component showcase with Vite
npm run build:lib     # publishable ES module, CSS, and TypeScript declarations
npm run build:app     # static showcase build
npm run lint
npm run format:check
npm run test:a11y     # accessibility audit
npx vitest run        # full unit and component test suite
npm run preview       # preview the static showcase
```

`npm run build` is an alias for `npm run build:lib`. The library build writes `dist/periodicity-react.js`,
`dist/periodicity-react.css`, and declarations under `dist/types`. `publish.ps1` runs `npm publish`, which triggers
`prepublishOnly` and rebuilds the library first.

### Project structure

- `src/component` — component families, shared primitives, and the public barrel.
- `src/layout` — Coordinator, AppBar, Drawer, Table, List, Tree, and other layout collections.
- `src/theme` — theme provider, presets, and token contracts.
- `src/international` — locale resolution, built-in dictionaries, and message handling.
- `src/animation` and `src/gesture` — motion, ripple, and standard event layers.
- `src/task` — the priority scheduler used by chart and collection work.
- `src/showcase` — the documentation application and live demos.
- `tests` — Vitest, Testing Library, and axe-based accessibility checks.

### Verification

The repository is checked with:

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run lint
npm run format:check
npx vitest run
npm run audit:contrast
npm run audit:locales
npm run test:a11y
npm run build:lib
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the English release history and
[CHANGELOG.zh-CN.md](CHANGELOG.zh-CN.md) for the Chinese version.
