# Changelog

All notable changes to Periodicity React are recorded here. The format follows the spirit of Keep a Changelog,
and this project uses British English in its English documentation.

## [Unreleased]

### Added

- Five-region `DrawerLayout` with `left`, `top`, `centre`, `right`, and `bottom` slots, exclusive opening, push
  animation, a scrim, outside-pointer protection, open/close callbacks, and an imperative handle. `center` is kept as
  a compatibility alias for `centre`.
- Adapter-backed `List` with single, multiple, checkbox, and fixed-row virtual variants: `SelectList`,
  `MultipleList`, `CheckList`, and `VirtualList`.
- Adapter-backed `Tree` with expansion, selection, checkbox subtree propagation, and fixed-row virtualisation:
  `SelectTree`, `CheckTree`, and `VirtualTree`.
- Semantic Material `Table` with adapter or array input, row selection, select-all, indeterminate state, sticky
  header, compact density, striped rows, hover, loading, empty state, captions, row-click handling, and fixed-row
  virtualisation through `virtual`, `height`, and `rowHeight`.
- Fixed-row virtual option windows for `Select` and `Combobox` through `virtual`, `listHeight`, and `itemHeight`,
  including keyboard navigation and active-row scrolling.
- Fixed-row virtual panes for `Transfer` through `virtual`, `listHeight`, and `itemHeight`.
- Normal and virtual Select entry points under `src/component/input/select`, backed by `SelectAdapter` and
  `createSelectAdapter`.
- `Mention` input with caller-owned asynchronous suggestion loading through `onSearch`, abort signals, keyboard
  selection, and insertion of `@displayName`.
- `CommentThread` reply composer now embeds `Mention`, with `mentionSearch`, `mentionSuggestions`, and `onMention`
  props.
- `NumberPicker`, an Android-style centred number wheel with stepper buttons, bounds, step, formatter, and keyboard
  support.
- `Contact` with `adapter`, `normal`, and `virtual` modules; searchable contacts, presence state, and selection.
- `MessageList` with `adapter`, `normal`, and `virtual` modules; self/peer bubbles, timestamps, delivery status, and
  auto-scroll.
- `Chat` with `adapter`, `normal`, and `virtual` modules; contacts, transcript, composer, and send handling.
- `ProjectManager` with file-tree nodes, package and reference dependencies, architecture outlines, preview, editor,
  imports, exports, and JSON project import/export.
- `StructureNode` and `parseStructure` for HTML tag trees, Markdown sections/paragraphs/sentences, source
  classes/methods/functions/properties/comments, and TeX sections.
- Extension-driven `renderFile` output: sanitised HTML markup, Markdown/TXT article HTML, and syntax-highlighted
  code produced with `Queue`, `Stack`, and `OrderedMap`.
- Standard `ListOption` (`index`, `label`, `value`) and `TreeOption` (`depth`, `index`, `label`, `value`) nodes with
  `slots.item` for custom List and Tree rendering.
- `Timeline` with vertical events, tone markers, item slots, and connector lines.
- Import/export parsers for JavaScript/TypeScript, Python, C/C++, Rust, TeX, Markdown, and bibliography files.
- `Language = "Literature"` support for books and articles: headings become exports and bibliography entries become
  references.
- `ElementLoading`, an element-bound overlay that measures a referenced element or CSS selector and tracks resizing
  and scrolling.
- `FullscreenLoading`, a native `<dialog>` loading layer with `showModal()`, a blurred full-viewport surface, and an
  indeterminate spinner.
- `Rate` rating control with half stars, clear-on-repeat, read-only and disabled states, keyboard support, sizes, and
  validation text.
- `DateTimePicker` custom panel with editable year and month inputs, a day grid, editable hour and minute fields, and
  Clear/Apply actions.
- `Snackbar` with controlled visibility, tones, action, close button, and auto-hide.
- Adapter contracts for lists and trees under `src/layout/list/adapter` and `src/layout/tree/adapter`.
- Public barrels for `src/layout/list`, `src/layout/tree`, and `src/layout/index.ts`.

### Changed

- `ProjectManager` no longer keeps a permanent middle explorer column. The project tree now lives in the Files and
  Architecture pages, and the Architecture page pairs it with the selected file's parsed structure.
- Literature projects use the same project model as code projects; there is no special literature mode or separate
  showcase category.
- `Select` moved from `src/component/picker/select` to `src/component/input/select`, with `adapter`, `normal`, and
  `virtual` modules. The old picker directory has been removed.
- Data components now import adapters from the refactored `layout/list/adapter` and `layout/tree/adapter` locations.
- `List` and `Tree` virtual rows respect a fixed `itemHeight`, including removing the base `min-height` override.
- `TimePicker` opens the native picker from the whole field, not only the trailing icon.
- `Rate`, `Table`, and the layout data components are included in the component showcase.

### Fixed

- Pager switching no longer oscillates with Navigation or Tabs. Route changes are debounced, scroll updates are
  debounced after 80ms, programmatic scrolls keep a target lock, and route-driven changes no longer emit
  `onRouteChange` back to the controller.
- Navigation and Tabs option changes use an 80ms debounce before notifying `onValueChange`, preventing rapid feedback
  loops between controlled values and page navigation.
- Message bubbles now use `Surface` ripples, and read messages show a double check while sent messages keep a single
  check.

- `Columns` tracks now use a parent-specific gap variable, preventing children's inherited gap values from breaking
  equal-width columns and forcing full-width wrapping.
- Checkbox invalid state renders a complete four-sided error border instead of a clipped L-shape.
- Disabled TextInput, Select, Checkbox, and Switch boundaries remain visible instead of fading with the whole control.
- Dropdown panels animate on open and close, with a presence delay for the exit animation.
- Combobox loading spinner rotates continuously; the reduced-motion override and fragile duration calculation were
  removed.
- Snackbar and toast action/close buttons no longer paint a light hover plate or dark ripple over dark surfaces.
- Button labels no longer clip descenders after the line-height and overflow changes.
- Select variants have consistent minimum heights, and the standard variant no longer carries an extra top margin.

### Known gaps

- `CommentThread` has a tree adapter but no virtual or checkbox tree variant.
- `Deque.size()` returns `bigint` while maps, sets, and trees use `number`; this inconsistency is not yet resolved.
- There is no formal automated test suite; verification currently combines TypeScript, ESLint, production build, and
  targeted runtime smoke checks.
