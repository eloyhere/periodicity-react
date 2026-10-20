# Changelog

All notable changes to Periodicity React are recorded here. The format follows the spirit of Keep a Changelog,
and this project uses British English in its English documentation.

## [Unreleased]

No changes yet.

## [0.1.0] - 2026-10-20

The first public npm release of `periodicity-react`.

### Highlights

- 124 prefixed React components covering forms, pickers, collections, overlays, navigation, messaging, file tools,
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
- `PeriodicityCalendar`: locale-aware month grid with roving tabindex, ISO date values, range limits, Intl
  weekday/month labels, and arrow/Home/End/PageUp/PageDown selection.
- 18 global theme presets: `accessible`, `default`, `dark`, `milk`, `space-gray`, `gray`, `light-gray`,
  `sky-blue`, `pale-blue`, `deep-blue`, `orange`, `yellow`, `lemon`, `red`, `rose`, `green`, `deep-green`, and
  `light-green`, controlled through `theme`/`defaultTheme`/`setTheme`.
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
