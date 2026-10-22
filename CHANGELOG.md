# Changelog

All notable changes to Periodicity React are recorded here. The format follows the spirit of Keep a Changelog,
and this project uses British English in its English documentation.

## [0.1.10] - 2026-10-22

### Added

- `HighFlyer` company icon for 幻方量化, and a redrawn `DeepSeek` whale mark for the agent set.
- Twenty redrawn animal glyphs (`AnimalLion` … `AnimalDolphin`) now live in the `Animal` category, which holds
  30 icons; the `AnimalExtra` category is gone.
- The Foundations icon catalogue plays `Dynamic` SVG animations even when the operating system requests reduced
  motion.
- `Avatar` accepts an inline SVG (or any React node) as `src` alongside image URLs and base64 data URIs; custom
  content fills the circular frame and keeps the avatar's accessible name.

### Changed

- Redrew the weakest catalogue glyphs: `Copilot`, `Llama`, `Ernie`, `Yi`, `Alphabet`, `Dog`, `Horse`, `Notebook`,
  `Telescope`, `Stethoscope`, `Hammer`, `Screwdriver`, `Cup`, `Nervous`, and `Countdown`; `Piano` and `Guitar` now
  follow their Lucide shapes.
- Renamed icons whose names collided across categories, where the later definition silently replaced the earlier
  glyph: `Pulse` → `HeartRate` (Health), `Notebook` → `NotebookDevice` (Computer), and `Chip` → `Microchip`
  (Computer).
- The icon catalogue now lists 695 icons across 38 categories.

### Fixed

- Anchored dropdown/select panels, popovers, and tooltips now follow their trigger when layout changes outside
  scrolling or resizing, such as a `Coordinator` collapsing its hero under wheel input, instead of remaining at the
  old fixed viewport position.
- Dropdown/Select panels, popovers, and context menus now also dismiss when the browser window loses focus or the
  document becomes hidden, so a floating layer no longer stays open after switching to another window or hiding the
  app.
- A catalogue test now asserts that every icon name is unique, so two categories can no longer define the same name
  and render the wrong glyph.

## [0.1.9] - 2026-10-22

### Fixed

- Dropdown and popover panels now opt out of Electron window dragging with
  `-webkit-app-region: no-drag`, so a menu that overlaps a `-webkit-app-region: drag` app bar or
  collapsing hero still receives hover, click, and keyboard input across its whole surface.

## [0.1.8] - 2026-10-22

### Added

- Showcase component search: a `CompleteInput` in the filter bar suggests every documented component and opens the
  selected entry.
- `TextInput` accepts `rootRef` for its field root, which lets composite fields anchor overlays without an extra
  wrapper element.
- Pointer-origin focus border ripple on the shared input shell: a radial wave from the pointer (or keyboard caret)
  reveals the nearest edge first, and every edge grows outward from its projection point; empty fields start from
  the centre and the wave eases out over one second.
- Per-item render slots for the messaging family: `Contact`/`VirtualContact` expose `contact` and `context`,
  `MessageList`/`VirtualMessageList` expose `message`, `messageContext`, and `avatar`, and `Chat`/`VirtualChat`
  forward all five. Each slot receives the rendered index and the item.
- `CommentThread` accepts a `comment` slot that replaces one whole comment item, and the new
  `VirtualCommentThread` virtualises the flattened thread at a fixed row height.
- `useFilePick` plus `FilePicker`, `PhotoPicker`, and `AvatarPicker`: native hidden file inputs, Base64 previews,
  an in-dialog cropper, pick/preview/avatar/crop slots, hover and click ripples, and one `change` event per
  completed selection. Photo and avatar edits emit on Confirm or Cancel, while closing the dialog aborts silently.
- `BarChart`, `PieChart`, `LineChart`, and `ScatterChart`: a responsive canvas and WebGL chart family with a
  WebGL-to-canvas fallback, device-pixel-ratio rendering, legends, screen-reader data tables, configurable
  palettes, and redraws scheduled through the shared task priority queue.
- `Font` and `useFont`: scoped typography levels, families, weights, line heights, letter spacing, transforms, and
  alignment, exposed through a nested font context.

### Changed

- `PeriodicityCompleteInput` and `PeriodicityMention` now render the same `InputLayout` field shell as `TextInput`,
  with the shared `prefix`, `hint`, `message`, `limitation`, `error`, and `suffix` slots. Mention's former
  below-field `hint` moved to `message`; `hint` is now the floating hint, and `leading`/`trailing` remain aliases
  for `prefix`/`suffix`. Complete no longer adds a wrapper element around the field.
- The input focus-border wave now plays even when the browser reports `prefers-reduced-motion: reduce`; the hint
  and background transitions still honour the preference.
- `PeriodicityNavigationView`'s bottom variant now measures its own width: it stays horizontal and scrolls sideways
  while at least two destinations fit, and switches to a vertical, scrollable list once only one fits. No manual
  variant switch is needed for narrow layouts.
- `PeriodicityCoordinator` now takes vertical wheel gestures over from content that cannot scroll, in the capture
  phase, so an inner component no longer swallows the gesture. Scrollable main content keeps native scrolling and
  still syncs the collapse area, header, and app bar; horizontal, Shift, and modified wheel gestures are ignored.
- Remaining hard-coded component copy now reads from `useInternational().t()`. A new typed `extraMessages` catalogue
  covers charts, pickers, comments, transfer, date-time, mention, rate, progress, radio, scrollbar, context menu,
  combobox, loading, and email/telephone validation copy for all 12 built-in locales.
- The showcase drops its left sidebar in favour of the top category filters and component search, adds a Charts
  page, keeps native + English labels in the language picker, and opts out of browser auto-translation so the
  authored language remains visible.

### Fixed

- `PeriodicityDrawerLayout` no longer consumes pointer events outside its root, so an external AppBar/Toolbar
  toggle can close and reopen the drawer; the scrim remains the dismiss surface. The layout is now positioned so
  the scrim stays inside it.
- Keep focus in `PeriodicityCompleteInput` while its suggestion panel is open, so the focused border stays
  visible and typing keeps filtering the suggestions.
- Close the `PeriodicityCompleteInput` suggestion panel and blur the field after a selection, instead of letting
  focus restoration reopen the panel.
- Cover the shared `InputLayout` shell in forced-colors mode, so every six-slot field keeps a system focus ring.
- `useFilePick` no longer treats a returning window focus as an immediate cancellation. It keeps listening for the
  native change event, polls the input files briefly, and only settles an empty selection after a short delay, so
  choosing an image reliably opens the crop dialog even when focus arrives before `change`.
- Canvas and WebGL chart colours resolve aliased CSS custom properties (`--color-primary: var(--accent)`) through
  computed styles, so theme palettes render correctly instead of falling back to black.
- Email and telephone fields pass localised validation messages into `validateEmail` and `validateTelephone`; both
  validators accept message overrides for callers that validate outside React.

## [0.1.7] - 2026-10-22

### Fixed

- Keep input focus when clicking inside an already focused field, so the border animation is not replayed.

## [0.1.6] - 2026-10-22

### Fixed

- Include generated TypeScript declarations in the published package again.

## [0.1.5] - 2026-10-22

### Fixed

- Animate all four input border edges independently from the pointer position over one second.

## [0.1.4] - 2026-10-22

### Fixed

- Use an editing cursor across the whole input field, while buttons and links keep their own cursor.

## [0.1.3] - 2026-10-22

### Added

- Six-slot text fields: prefix, floating hint, message, limitation, error, and suffix, with click-origin border animation.
- Compact prefix/content/suffix Button slots and the slot-based Toolbar mode.

### Fixed

- Focus the active input from anywhere in the field, including prefix and suffix icons.
- Ripple support on number steppers and whole-field colour picker activation.
- Contact row layout, CJK avatar initials, and localized presence labels.

## [0.1.2] - 2026-10-22

### Fixed

- Export the PeriodicityCalendarDaySlots type alias with the other calendar types.

## [0.1.1] - 2026-10-22

### Fixed

- Publish generated TypeScript declarations (dist/types) and a CSS module shim, so ypes and exports.types resolve for consumers.

## [0.1.0] - 2026-10-20

The first public npm release of `periodicity-react`.

### Highlights

- 130 prefixed React components covering forms, pickers, collections, overlays, navigation, messaging, file tools,
  theming, internationalisation, and motion.
- A publishable ES module build with TypeScript declarations and an extracted `styles.css`.
- Native attribute, event, ARIA, data-attribute, and ref pass-through across the component surface.
- Controlled and uncontrolled state, disabled/read-only/loading/empty states, and semantic callbacks throughout.
- Flex-first layout primitives; CSS Grid is not used.

### Added

- `Periodicity`-prefixed exports for every public component, including layouts and providers. The unprefixed names
  remain as compatibility aliases.
- `PeriodicityForm`, `PeriodicityFormField`, and `PeriodicityFormActions`: a native `<form>` wrapper with native
  validation/submission/reset behaviour, generated `label htmlFor` binding, `aria-describedby`, and `aria-invalid`
  wiring for native controls.
- `PeriodicityCoordinator`, `PeriodicityAppBar`, `PeriodicityCollapse`, and `PeriodicityToolbar`: a coordinated
  collapsing-hero app bar with exactly two Coordinator slots (`header` and `main`), a pinned toolbar, and
  scroll-driven progress.
- `PeriodicityCalendar`: locale-aware month grid with roving tabindex, ISO date values, range limits, Intl
  weekday/month labels, and arrow/Home/End/PageUp/PageDown selection.
- 23 global theme presets: `accessible`, `accessible-dark`, `protanopia`, `deuteranopia`,
  `tritanopia`, `achromatopsia`, `default`, `dark`, `milk`, `space-gray`, `gray`, `light-gray`,
  `sky-blue`, `pale-blue`, `deep-blue`, `orange`, `yellow`, `lemon`, `red`, `rose`, `green`,
  `deep-green`, and `light-green`, controlled through `theme`/`defaultTheme`/`setTheme`.
- `accessible-dark`: a dark high-contrast companion to `accessible` with white focus, strong borders, and a
  3px ring.
- Four colour-vision themes: `protanopia`, `deuteranopia`, `tritanopia`, and `achromatopsia`, using
  hue-independent or confusion-safe palettes.
- 12 built-in locales with common design-system messages, `localeOptions`, `builtInMessages`,
  `resolveLocaleMessages`, and locale direction: `en-GB`, `en-US`, `zh-CN`, `zh-SG`, `zh-HK`, `zh-TW`, `ja-JP`,
  `ko-KR`, `es-ES`, `es-MX`, `pt-PT`, and `pt-BR`.
- `Page` replaces `PagerPage` as the paged-route component.
- Accessibility improvements: form `aria-errormessage`/`aria-required`/combined descriptions, keyboard drag
  sorting, Scrollbar keyboard support, full calendar keyboard navigation, table/tree ARIA, overlay focus traps,
  skip link/landmarks, and high-contrast/forced-colors styles.
- Form controls: button, text input, text area, email, telephone, number, complete input, checkbox, radio group,
  range, switch, select, combobox, mention, and transfer.
- Pickers: colour, time, date-time, number, cycle, and variant.
- Collections: list, tree, table, select, combobox, and transfer variants, with adapter-backed data and optional
  fixed-row virtualisation.
- Overlays: dialog, confirm/message/input dialogs, drawer and drawer layout, context menu, dropdown, popover,
  tooltip, snackbar, toast, alert, banner, backdrop, and fullscreen/element loading.
- Navigation: navigation view, tabs and tab panels, pager, menu family, stepper, scrollbar, and drag sorting.
- Messaging: contact list, contact context menu, message list, message context menu, chat, and comment thread.
- File tooling: Markdown/HTML preview, code-structure preview, CodeMirror editor, and project manager.
- Design-system providers: theme, internationalisation, animation, and animated element wrappers.
- Display components: badge, chip, card, tag, avatar, avatar group, breadcrumbs, accordion, divider, empty state,
  pagination, progress, circular progress, progress ring, spinner, rate, skeleton, surface, text, thumb, and
  timeline.
- Native props and events, `ref` forwarding, `aria-*` and `data-*` support, and caller/internal handler composition
  across the component API.
- Controlled and uncontrolled variants for values, selection, expansion, open state, and provider configuration.
- Close reasons, focus restoration, escape handling, loading labels, empty states, and disabled states for the
  relevant overlays and collections.
- A custom SVG chart favicon used by the development server and static preview.

- Badge, Tag, Avatar, Link, and StateLayer now paint the shared ripple on pointer/keyboard activation; disabled badges, tags, avatars, and links suppress it. StateLayer forwards parent interaction when it is not already inside a Surface ripple.
- Common component defaults (dialogs, drawers, snackbars, alerts, pagination, dropdown/select, list/tree/table, file tools, calendar, contact/chat/message) now resolve through `useInternational().t()`, with 25 new common message keys in all 12 built-in locale dictionaries. Explicit caller props still win.

- Added `npm run audit:contrast`, `npm run audit:locales`, and `npm run test:a11y` as repeatable accessibility checks; the contrast audit covers `accessible`, `accessible-dark`, and the four colour-vision themes.
- Badge, Tag, Avatar, Link, and StateLayer ripples now answer both hover and press. Their colour is chosen from the effective surface luminance, and StateLayer measures contrast against its parent background.
- Alert, Tag, and Snackbar add an icon plus visually hidden status text as a second channel beyond colour; Toast keeps its tone icon.
- All 12 built-in dictionaries now carry every common message key (165 keys). Drawer edge labels, Calendar's Intl locale, and CodeBlock copy labels follow the active provider instead of hard-coded English.
- The documentation shell localises navigation, theme/language controls, About, skip link, back-to-top, and CodeBlock labels for all 12 locales.
- README and README.zh-CN are restructured around design philosophy, a function map, and components by function, with theme, accessibility-audit, and locale-audit documentation.

- Theme option labels now use the active locale instead of always showing Chinese · English, and component page titles show the API name plus its localized name (for example `Tag 标签`).
- Additional visible and accessible defaults now resolve through `t()`: breadcrumb expander, comment empty/loading states, context-menu and text-action labels, number stepper controls, time/date-time placeholders, hour/minute labels, comment loading, and toolbar back label.

- Documentation group/section labels and page descriptions now resolve per locale; en-US copy applies American spelling, and non-English descriptions use localized fallbacks instead of English catalogue copy.
- Localized component names are appended to the API name (`Tag 标签`, `Tag タグ`, `Tag Etiqueta`), and the component pickers use the same labels.
- The toolbar Select surfaces now declare their own background, so Surface ripple contrast is measured against the field rather than the blue AppBar.

### Changed

- `PagerPage` was renamed to `Page`; `PeriodicityPagerPage` is now `PeriodicityPage`. Route-based Pager usage and the
  showcase have been updated. This is a breaking rename for consumers that imported the old names.

- Package metadata now targets `periodicity-react@0.1.0`, with React 19 peer dependencies, public npm publishing,
  ES module and declaration entry points, and `periodicity-react/styles.css`.
- The library entry exports the full component barrel, and the library build extracts a single stylesheet under
  `dist/periodicity-react.css`.
- The showcase sidebar uses the library `Scrollbar` component instead of native scrollbar styling.
- Mention's floating label now uses the same explicit focused/filled/floating state model as TextField, including
  the outline notch and delayed placeholder.
- Drag sorting now renders a pointer-following ghost while preserving the existing six-pixel activation threshold
  and reorder callbacks.

### Fixed

- Dropdown and Select now render their option list through `Scrollbar`, with a visible track, stable gutter, and
  extra bottom padding so the final item can scroll fully into view. Dropdown panels no longer spawn a surface
  ripple.

- Editor selection colours no longer hide selected glyphs; native selection painting covers single-line, first-line,
  and last-line selections.
- Completion-related editor flicker and misplaced completion popups were removed together with the completion
  integration.
- Table uncontrolled selection now seeds from `defaultSelectedKeys`.
- Row keydown in List no longer double-toggles when the event originates inside a checkbox.
- Several event handlers that previously overwrote caller callbacks now compose them.

### Removed

- Code completion, N-gram completion, and the custom completion popup. Completion is left to LSP or dedicated editor
  integrations.
- The unused `@codemirror/autocomplete` direct dependency.

### Compatibility

- React 19 and React DOM 19 are required.
- Unprefixed component names continue to work as aliases, but new code should use the `Periodicity` prefix.
- Collection adapters, virtualisation configuration, and existing controlled APIs remain source-compatible.
- Markdown and HTML rendering is handled by the Preview component; CodeMirror remains an editor, not a renderer.

[Unreleased]: https://github.com/eloyhere/periodicity-react/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/eloyhere/periodicity-react/releases/tag/v0.1.0
