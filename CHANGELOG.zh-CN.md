# 更新日志

本文件记录 Periodicity React 的重要变更。格式参考 Keep a Changelog。

## [Unreleased]

暂无变更。

## [0.1.0] - 2026-10-20

`periodicity-react` 首个 npm 公开版本。

### 亮点

- 124 个带 `Periodicity` 前缀的 React 组件，覆盖表单、选择器、集合、浮层、导航、消息、文件工具、主题、国际化和动效。
- 可发布的 ES Module、TypeScript 声明文件和独立 `styles.css`。
- 全组件范围支持原生属性、事件、ARIA、`data-*` 和 `ref` 透传。
- 支持受控/非受控状态，以及 disabled、read-only、loading、empty 等完整状态和语义化回调。
- 以 Flex 为基础的布局组件，不使用 CSS Grid。

### 新增

- 所有公共组件提供 `Periodicity` 前缀导出，包括布局和 Provider；不带前缀的名称保留为兼容别名。
- `PeriodicityForm`、`PeriodicityFormField`、`PeriodicityFormActions`：封装原生 `<form>`，保留原生校验、提交和重置行为，并为原生控件自动生成 `label htmlFor`、`aria-describedby` 和 `aria-invalid` 关联。
- `PeriodicityCalendar`：支持 locale 的月历网格，使用 roving tabindex、ISO 日期值、范围限制、Intl 星期/月份标签和方向键/Home/End/PageUp/PageDown 选择。
- 18 套全局主题预设：`accessible`、`default`、`dark`、`milk`、`space-gray`、`gray`、`light-gray`、`sky-blue`、`pale-blue`、`deep-blue`、`orange`、`yellow`、`lemon`、`red`、`rose`、`green`、`deep-green`、`light-green`，通过 `theme`/`defaultTheme`/`setTheme` 切换。
- 12 个内置 locale 和常用设计系统文案：`en-GB`、`en-US`、`zh-CN`、`zh-SG`、`zh-HK`、`zh-TW`、`ja-JP`、`ko-KR`、`es-ES`、`es-MX`、`pt-PT`、`pt-BR`，并提供 `localeOptions`、`builtInMessages`、`resolveLocaleMessages` 和方向信息。
- `Page` 取代 `PagerPage` 作为分页路由组件。
- 无障碍改进：表单 `aria-errormessage`/`aria-required`/组合描述、Drag 键盘排序、Scrollbar 键盘支持、完整日历键盘导航、Table/Tree ARIA、浮层焦点陷阱、skip link/landmarks，以及高对比度/强制颜色样式。
- 表单控件：Button、TextInput、TextArea、Email、Telephone、Number、CompleteInput、Checkbox、RadioGroup、Range、Switch、Select、Combobox、Mention、Transfer。
- 选择器：Colour、Time、DateTime、Number、Cycle、Variant。
- 集合：List、Tree、Table、Select、Combobox、Transfer 的普通版和虚拟化版本，支持 Adapter 数据源和固定行高虚拟化。
- 浮层：Dialog、Confirm/Message/Input Dialog、Drawer、DrawerLayout、ContextMenu、Dropdown、Popover、Tooltip、Snackbar、Toast、Alert、Banner、Backdrop、全屏/局部 Loading。
- 导航：NavigationView、Tabs、TabPanel、Pager、Menu 系列、Stepper、Scrollbar、Drag。
- 消息：Contact、ContactContextMenu、MessageList、MessageContextMenu、Chat、CommentThread。
- 文件工具：Markdown/HTML 预览、代码结构预览、CodeMirror 编辑器和项目管理器。
- 设计系统 Provider：Theme、International、Animation、Animated。
- 展示组件：Badge、Chip、Card、Tag、Avatar、AvatarGroup、Breadcrumbs、Accordion、Divider、EmptyState、Pagination、Progress、CircularProgress、ProgressRing、Spinner、Rate、Skeleton、Surface、Text、Thumb、Timeline。
- 组件 API 补齐原生属性、事件、`ref`、`aria-*`、`data-*`，并组合调用方与内部事件处理器。
- 值、选择、展开、打开状态和 Provider 配置支持受控/非受控模式。
- 浮层和集合补充关闭原因、焦点恢复、Escape 处理、加载标签、空状态和禁用状态。
- 新的 SVG 图表 favicon，用于开发服务器和静态预览。

### 变更

- `PagerPage` 重命名为 `Page`，`PeriodicityPagerPage` 改为 `PeriodicityPage`。Pager 路由用法和展示页已同步更新；这是旧导出名消费者的破坏性变更。

- package 元信息更新为 `periodicity-react@0.1.0`，使用 React 19 peer dependencies，配置公开 npm 发布、ES Module、声明入口和 `periodicity-react/styles.css`。
- 库入口导出完整组件 barrel，库构建将样式提取为 `dist/periodicity-react.css`。
- 展示站侧边栏改用库内 `Scrollbar`，不再使用浏览器原生滚动条样式。
- Mention 浮动标签改为与 TextField 一致的显式 focused/filled/floating 状态，包括 Outline 缺口和延迟 Placeholder。
- Drag 排序增加跟随指针的 Ghost，保留六像素激活阈值和原有排序回调。

### 修复

- 编辑器选区颜色不再遮挡文字；单行、首行和末行选区均可正常显示。
- 移除补全后，编辑器内容闪烁和补全窗口错位问题一并消失。
- Table 非受控选择状态现在从 `defaultSelectedKeys` 正确初始化。
- List 行内 Checkbox 触发的键盘事件不再导致重复切换。
- 若干原本会覆盖调用方回调的事件处理器改为组合调用。

### 移除

- 代码补全、N-gram 补全和自定义补全浮层。补全交由 LSP 或专用编辑器扩展处理。
- 未使用的 `@codemirror/autocomplete` 直接依赖。

### 兼容性

- 需要 React 19 和 React DOM 19。
- 不带前缀的组件名继续作为别名可用，但新代码应使用 `Periodicity` 前缀。
- 集合 Adapter、虚拟化配置和现有受控 API 保持源码兼容。
- Markdown 和 HTML 渲染由 Preview 组件负责；CodeMirror 仍然只是编辑器，不是渲染器。

[Unreleased]: https://github.com/eloyhere/periodicity-react/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/eloyhere/periodicity-react/releases/tag/v0.1.0
