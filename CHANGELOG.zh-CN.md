# 更新日志

本文件记录 Periodicity React 的重要变更。格式参考 Keep a Changelog。

## [Unreleased]

### 新增

- 用例页面新增组件搜索：筛选栏中的 `CompleteInput` 会列出所有组件，选中后打开对应条目。
- `TextInput` 新增 `rootRef`，复合输入框无需额外包裹节点即可把浮层锚定到字段根节点。

### 变更

- `PeriodicityCompleteInput` 与 `PeriodicityMention` 现在和 `TextInput` 使用同一个 `InputLayout` 字段壳，共用 `prefix`、`hint`、`message`、`limitation`、`error`、`suffix` 六个插槽。Mention 原来的下方说明文字从 `hint` 改为 `message`；`hint` 现在表示浮动提示，`leading`/`trailing` 仍作为 `prefix`/`suffix` 的别名。Complete 不再额外包裹一层容器。

### 修复

- `PeriodicityCompleteInput` 打开建议面板时焦点保持在输入框，聚焦边框持续显示，输入也会继续过滤建议。
- `PeriodicityCompleteInput` 选中建议后关闭下拉框并移除输入框焦点，不再因焦点恢复而重新打开面板。
- 强制颜色模式下覆盖共享的 `InputLayout` 字段壳，所有六槽输入框都保留系统焦点环。
- 主内容无法滚动且没有子元素消费滚轮事件时，`PeriodicityCoordinator` 会消费垂直滚轮并收缩折叠区域，短内容不再让折叠区域一直展开。

## [0.1.7] - 2026-10-22

### 修复

- 已聚焦输入框内部点击不再让输入框失焦并重新播放边框动画。

## [0.1.6] - 2026-10-22

### 修复

- 重新将生成的 TypeScript 声明文件包含进发布包。

## [0.1.5] - 2026-10-22

### 修复

- 输入框四条边分别从指针位置扩散，动画时长调整为 1 秒。

## [0.1.4] - 2026-10-22

### 修复

- 输入框整个区域使用编辑光标，内部按钮和链接保持自己的光标。

## [0.1.3] - 2026-10-22

### 新增

- 六槽输入框：prefix、浮动 hint、message、limitation、error、suffix，并支持从点击位置展开的边框动画。
- 紧凑的 Button prefix/content/suffix 三槽布局和 Toolbar 槽位模式。

### 修复

- 点击输入框任意区域（含 prefix/suffix 图标）都会聚焦输入控件。
- 数字步进按钮支持 ripple，颜色选择器支持整组点击。
- 修复 Contact 行布局、CJK 头像首字母和 presence 本地化。

## [0.1.2] - 2026-10-22

### 修复

- 将 PeriodicityCalendarDaySlots 类型别名与其他日历类型一起导出。

## [0.1.1] - 2026-10-22

### 修复

- 发布生成的 TypeScript 声明（dist/types）和 CSS 模块声明 shim，使 	ypes 与 exports.types 能被消费者解析。

## [0.1.0] - 2026-10-20

`periodicity-react` 首个 npm 公开版本。

### 亮点

- 130 个带 `Periodicity` 前缀的 React 组件，覆盖表单、选择器、集合、浮层、导航、消息、文件工具、主题、国际化和动效。
- 可发布的 ES Module、TypeScript 声明文件和独立 `styles.css`。
- 全组件范围支持原生属性、事件、ARIA、`data-*` 和 `ref` 透传。
- 支持受控/非受控状态，以及 disabled、read-only、loading、empty 等完整状态和语义化回调。
- 以 Flex 为基础的布局组件，不使用 CSS Grid。

### 新增

- 所有公共组件提供 `Periodicity` 前缀导出，包括布局和 Provider；不带前缀的名称保留为兼容别名。
- `PeriodicityForm`、`PeriodicityFormField`、`PeriodicityFormActions`：封装原生 `<form>`，保留原生校验、提交和重置行为，并为原生控件自动生成 `label htmlFor`、`aria-describedby` 和 `aria-invalid` 关联。
- `PeriodicityCoordinator`、`PeriodicityAppBar`、`PeriodicityCollapse`、`PeriodicityToolbar`：协调滚动与折叠布局，Coordinator 只有 `collapse`、`header`、`main` 三个插槽；`collapse` 收缩到 0，AppBar header 固定，`main` 滚动。
- `PeriodicityCalendar`：支持 locale 的月历网格，使用 roving tabindex、ISO 日期值、范围限制、Intl 星期/月份标签和方向键/Home/End/PageUp/PageDown 选择。
- `accessible-dark`：`accessible` 的深色高对比度版本，使用 3px 焦点环和强边框。
- 新增 4 套色盲主题：`protanopia`、`deuteranopia`、`tritanopia`、`achromatopsia`，使用不依赖色相或避免混淆的配色。
- 23 套全局主题预设：`accessible`、`accessible-dark`、`protanopia`、`deuteranopia`、`tritanopia`、`achromatopsia`、`default`、`dark`、`milk`、`space-gray`、`gray`、`light-gray`、`sky-blue`、`pale-blue`、`deep-blue`、`orange`、`yellow`、`lemon`、`red`、`rose`、`green`、`deep-green`、`light-green`，通过 `theme`/`defaultTheme`/`setTheme` 切换。
- `accessible-dark`：`accessible` 的深色高对比度版本，使用白色焦点、强边框和 3px 焦点环。
- 新增 4 套色盲主题：`protanopia`、`deuteranopia`、`tritanopia`、`achromatopsia`，使用不依赖色相或避免混淆的配色。
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

- Badge、Tag、Avatar、Link、StateLayer 现在会在指针/键盘激活时播放统一 Ripple；disabled 的 Badge、Tag、Avatar、Link 不触发。StateLayer 在非 Surface 区域会代理父级交互。
- Dialog、Drawer、Snackbar、Alert、Pagination、Dropdown/Select、List/Tree/Table、文件工具、Calendar、Contact/Chat/Message 的默认文案改为 `useInternational().t()`，12 个内置语言包补齐 25 个通用 key；显式传入的 prop 仍然优先。

- 新增 `npm run audit:contrast`、`npm run audit:locales`、`npm run test:a11y` 三个可重复执行的无障碍检查；对比度脚本覆盖 `accessible`、`accessible-dark` 和 4 套色盲主题。
- Badge、Tag、Avatar、Link、StateLayer 的 ripple 同时响应悬浮和点击；颜色根据实际表面亮度选择黑/白高对比色，StateLayer 使用父级背景计算对比度。
- Alert、Tag、Snackbar 增加图标和隐藏状态文本作为颜色之外的第二通道；Toast 使用 tone 图标。
- 12 个内置语言包各补齐 165 个公共 key；Drawer 方位标签、Calendar 的 Intl locale、CodeBlock 的 Copy/Copied 等剩余默认文案改为跟随 Provider。
- 文档外壳为 12 个语言提供本地化导航、主题/语言选择、About、skip link、返回顶部和 CodeBlock 文案。
- README 与 README.zh-CN 按设计理念、功能地图、组件分类重构；新增主题、无障碍检查与国际化审计说明。

- 主题选项名称改为跟随当前语言，不再始终显示“中文 · English”；组件页面标题显示 API 名与本地名称，例如 `Tag 标签`。
- 面包屑展开、评论空/加载状态、右键菜单与文本操作、数字步进器、时间/日期时间占位符、时分标签、评论加载和 Toolbar 返回标签等剩余默认文案改为 `t()`。

- 文档分组/分区标签和页面描述改为按当前语言解析；en-US 使用美式拼写，非英语描述不再直接显示英文目录文案。
- 组件名称在 API 名后追加本地名称（`Tag 标签`、`Tag タグ`、`Tag Etiqueta`），组件选择器同步使用。
- Toolbar 的 Select 表面声明自己的背景，使 Surface ripple 按输入框背景而非蓝色 AppBar 计算对比色。

### 变更

- `PagerPage` 重命名为 `Page`，`PeriodicityPagerPage` 改为 `PeriodicityPage`。Pager 路由用法和展示页已同步更新；这是旧导出名消费者的破坏性变更。

- package 元信息更新为 `periodicity-react@0.1.0`，使用 React 19 peer dependencies，配置公开 npm 发布、ES Module、声明入口和 `periodicity-react/styles.css`。
- 库入口导出完整组件 barrel，库构建将样式提取为 `dist/periodicity-react.css`。
- 展示站侧边栏改用库内 `Scrollbar`，不再使用浏览器原生滚动条样式。
- Mention 浮动标签改为与 TextField 一致的显式 focused/filled/floating 状态，包括 Outline 缺口和延迟 Placeholder。
- Drag 排序增加跟随指针的 Ghost，保留六像素激活阈值和原有排序回调。

### 修复

- Dropdown 与 Select 的选项列表改用 `Scrollbar`，显示可见轨道、稳定 gutter，并增加底部内边距，最后一项可以完整滚入视图；Dropdown 面板不再触发 Surface Ripple。

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
