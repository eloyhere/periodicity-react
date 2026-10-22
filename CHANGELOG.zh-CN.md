# 更新日志

本文件记录 Periodicity React 的重要变更。格式参考 Keep a Changelog。

## [Unreleased]

### 新增

- `Markdown` 把只读 Markdown 文档渲染为经过清理的语义化 HTML，支持标题、嵌套列表、表格、引用、代码块、任务列表、链接和图片；原始 HTML 会被转义，链接与图片只接受安全的 URL 协议。
- `Tex` 把 TeX 数学公式渲染为原生 MathML，公式保持可选中、可缩放，并能被辅助技术读取。
- `Tex` 现在可以把完整 LaTeX 文档（`\begin{document}`）渲染为 HTML 文章，包含标题、作者、摘要、带编号的章节与附录、列表、表格、图片、脚注、引用、交叉引用和内嵌 MathML；前导区中的 `\newcommand`、`\renewcommand`、`\def`、`\DeclareMathOperator` 定义会被展开。

### 修复

- 加固文件预览的 HTML 清理器：`svg`、`math`、`marquee`、`details` 等容器被解包前会先清理其后代。此前精心构造的 HTML 文件可能借助这类容器保留 `javascript:` URL 或事件处理属性。
- `Markdown`、`Tex` 与文件预览现在会拒绝 URL 中的控制字符。

## [0.1.10] - 2026-10-22

### 新增

- 新增 `HighFlyer`（幻方量化）公司图标，并重绘 Agent 分类的 `DeepSeek` 鲸鱼标。
- 20 个重绘的动物图标（`AnimalLion` … `AnimalDolphin`）并入 `Animal` 分类，该分类现在共 30 个图标；`AnimalExtra` 分类已删除。
- 图标目录页现在即使系统开启“减少动态”，也会播放 `Dynamic` 分类的 SVG 动画。
- `Avatar` 的 `src` 除图片 URL 与 base64 data URI 外，还可以接受内联 SVG（或任意 React 节点）；自定义内容会填满圆形头像框，并保留头像的无障碍名称。

### 变更

- 重绘了目录中绘制质量较差的图标：`Copilot`、`Llama`、`Ernie`、`Yi`、`Alphabet`、`Dog`、`Horse`、`Notebook`、`Telescope`、`Stethoscope`、`Hammer`、`Screwdriver`、`Cup`、`Nervous`、`Countdown`；`Piano`、`Guitar` 改用 Lucide 造型。
- 修复跨分类重名导致的静默覆盖：`Pulse` → `HeartRate`（Health）、`Notebook` → `NotebookDevice`（Computer）、`Chip` → `Microchip`（Computer）。
- 图标目录现在为 38 个分类、695 个图标。

### 修复

- Dropdown/Select 面板、Popover 与 Tooltip 现在会在锚点因布局变化（例如 `Coordinator` 响应滚轮折叠 Hero）而移动时持续跟随，不再停留在旧的固定视口位置。
- Dropdown/Select 面板、Popover 和右键菜单等浮层现在会在窗口失去焦点或文档隐藏时自动关闭，切换到其他窗口或隐藏应用后不再残留。
- 新增目录级测试，确保所有图标名称唯一，避免同名图标互相覆盖后显示错误的字形。

## [0.1.9] - 2026-10-22

### 修复

- Dropdown 与 Popover 弹层显式设置 `-webkit-app-region: no-drag`：当菜单覆盖在 Electron 的
  `-webkit-app-region: drag` 应用栏或折叠 Hero 上时，整个弹层仍能接收 hover、点击和键盘事件。

## [0.1.8] - 2026-10-22

### 新增

- 用例页面新增组件搜索：筛选栏中的 `CompleteInput` 会列出所有组件，选中后打开对应条目。
- `TextInput` 新增 `rootRef`，复合输入框无需额外包裹节点即可把浮层锚定到字段根节点。
- 共享输入框壳新增指针起点聚焦边框波纹：以鼠标位置（键盘聚焦时用文本光标，空输入框用字段中心）为圆心做径向波纹，最近的边先出现，每条边从鼠标在该边上的投影点向两端生长，整体使用 1 秒的先快后慢缓动。
- 消息相关组件新增逐项渲染插槽：`Contact`/`VirtualContact` 提供 `contact` 与 `context`，`MessageList`/`VirtualMessageList` 提供 `message`、`messageContext` 与 `avatar`，`Chat`/`VirtualChat` 透传全部五个；每个插槽都会收到渲染索引与对应数据项。
- `CommentThread` 新增 `comment` 插槽，可替换整条评论；新增 `VirtualCommentThread`，按固定行高对扁平化后的评论线程做虚拟滚动。
- 新增 `useFilePick` 以及 `FilePicker`、`PhotoPicker`、`AvatarPicker`：内部使用原生隐藏 file 输入，支持 Base64 预览、Dialog 内裁剪、pick/preview/avatar/crop 插槽、悬浮与点击 ripple，并在每次完成选择时触发一次 `change`。图片与头像在点击确认或取消时触发，关闭弹窗则不触发。
- 新增 `BarChart`、`PieChart`、`LineChart`、`ScatterChart`：基于 canvas 与 WebGL 的响应式统计图组件，支持 WebGL 回退到 canvas、DPR 渲染、图例、屏幕阅读器数据表、可配置色板，并通过共享 task 优先级队列调度重绘。
- 新增 `Font` 与 `useFont`：提供作用域内的字号层级、字体、字重、行高、字距、大小写转换与对齐设置，并通过嵌套字体上下文共享。

### 变更

- `PeriodicityCompleteInput` 与 `PeriodicityMention` 现在和 `TextInput` 使用同一个 `InputLayout` 字段壳，共用 `prefix`、`hint`、`message`、`limitation`、`error`、`suffix` 六个插槽。Mention 原来的下方说明文字从 `hint` 改为 `message`；`hint` 现在表示浮动提示，`leading`/`trailing` 仍作为 `prefix`/`suffix` 的别名。Complete 不再额外包裹一层容器。
- 浏览器报告 `prefers-reduced-motion: reduce` 时，输入框聚焦边框波纹仍会播放；`hint` 与背景过渡仍遵守该偏好。
- `PeriodicityNavigationView` 的 bottom 变体会测量自身宽度：能放下至少两个导航项时保持水平并支持横向滚动，窄到只放得下一个时自动切换为可纵向滚动的竖排列表，无需手动切换 variant。
- `PeriodicityCoordinator` 现在会在捕获阶段从无法滚动的内容手里接管竖直滚轮手势，内部组件不再吞掉该手势。可滚动的主内容仍走原生滚动，并照常同步折叠区、头部和 AppBar；横向、Shift 和带修饰键的滚轮手势不受影响。
- 组件中剩余的硬编码文案全部改为通过 `useInternational().t()` 读取；新增类型化 `extraMessages` 目录，为 12 个内置 locale 补齐图表、选择器、评论、Transfer、日期时间、Mention、评分、进度、单选、滚动条、右键菜单、Combobox、Loading 以及邮箱/电话校验文案。
- 用例页面移除左侧导航，改用顶部分类筛选和组件搜索；新增 Charts 页面；语言菜单保留“原生名称 · 英文名称”格式；同时禁用浏览器自动翻译，避免页面语言被外部翻译器改写。

### 修复

- `PeriodicityDrawerLayout` 不再拦截根节点之外的指针事件，外部 AppBar/Toolbar 的开关按钮可以正常关闭和重新打开抽屉；scrim 仍是点击关闭区域。布局根节点现在会定位，scrim 保持在布局内部。
- `PeriodicityCompleteInput` 打开建议面板时焦点保持在输入框，聚焦边框持续显示，输入也会继续过滤建议。
- `PeriodicityCompleteInput` 选中建议后关闭下拉框并移除输入框焦点，不再因焦点恢复而重新打开面板。
- 强制颜色模式下覆盖共享的 `InputLayout` 字段壳，所有六槽输入框都保留系统焦点环。
- `useFilePick` 不再把返回的窗口 focus 直接当成取消：继续等待原生 `change`，短暂轮询输入文件，并在延迟后才结算空选择，避免 focus 早于 `change` 时丢掉已选图片、导致裁剪弹窗不出现。
- canvas/WebGL 图表颜色通过计算样式解析 `--color-primary: var(--accent)` 这类 CSS 变量别名，主题色不再回退为黑色。
- 邮箱与电话组件把本地化校验文案传给 `validateEmail` / `validateTelephone`，两个校验函数也接受调用方覆盖文案。

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

- 发布生成的 TypeScript 声明（dist/types）和 CSS 模块声明 shim，使 ypes 与 exports.types 能被消费者解析。

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
