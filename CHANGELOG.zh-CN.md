# 更新日志

本文件记录 Periodicity React 的重要变更。英文文档遵循 Keep a Changelog 的组织方式，并使用英式英语。

## [未发布]

### 新增

- 五向 `DrawerLayout`：支持 `left`、`top`、`centre`、`right`、`bottom` 五个插槽，互斥打开、推入动画、
  遮罩、外部指针拦截、开关回调以及命令式句柄。`center` 作为 `centre` 的兼容别名保留。
- 适配器驱动的 `List`，包含单选、多选、复选和固定行高虚拟版本：`SelectList`、`MultipleList`、
  `CheckList`、`VirtualList`。
- 适配器驱动的 `Tree`，包含展开、选择、复选子树联动和固定行高虚拟化：`SelectTree`、`CheckTree`、
  `VirtualTree`。
- 语义化 Material `Table`：支持适配器或数组输入、行选择、全选、indeterminate、吸顶表头、紧凑密度、
  斑马纹、悬浮、加载、空状态、标题、行点击，并通过 `virtual`、`height`、`rowHeight` 提供固定行高虚拟化。
- `Select` 与 `Combobox` 通过 `virtual`、`listHeight`、`itemHeight` 支持固定行高虚拟选项窗口，包含键盘导航
  与活动行滚动。
- `Transfer` 通过 `virtual`、`listHeight`、`itemHeight` 支持固定行高虚拟窗格。
- `Select` 拆分到 `src/component/input/select`，包含 `adapter`、`normal`、`virtual` 三个模块，并由
  `SelectAdapter` 与 `createSelectAdapter` 驱动。
- `Mention` 输入组件：通过 `onSearch` 由调用方控制异步建议加载，支持 AbortSignal、键盘选择和插入
  `@显示名称`。
- `CommentThread` 回复编辑器内嵌 `Mention`，新增 `mentionSearch`、`mentionSuggestions` 与 `onMention`。
- `NumberPicker`：Android 风格的居中数字滚轮，支持边界、步长、格式化、加减按钮与键盘。
- `Contact`：拆分为 `adapter`、`normal`、`virtual` 模块，支持联系人搜索、在线状态与选中。
- `MessageList`：拆分为 `adapter`、`normal`、`virtual` 模块，支持自己/对方气泡、时间、送达状态与自动滚动。
- `Chat`：拆分为 `adapter`、`normal`、`virtual` 模块，组合联系人、消息记录、输入框与发送回调。
- `ProjectManager`：文件树节点、程序包与参考文献依赖、架构分层、预览、编辑器、导入、导出，以及 JSON 项目
  导入/导出。
- `StructureNode` 与 `parseStructure`：支持 HTML 标签树、Markdown 章节/段落/句子、源码类/方法/函数/属性/
  注释，以及 TeX 章节。
- 按扩展名渲染的 `renderFile`：安全 HTML、Markdown/TXT 文章 HTML，以及使用 `Queue`、`Stack`、`OrderedMap`
  生成的语法高亮代码。
- 标准 `ListOption`（`index`、`label`、`value`）与 `TreeOption`（`depth`、`index`、`label`、`value`）节点，
  并为 List/Tree 增加 `slots.item` 自定义渲染。
- `Timeline`：垂直事件时间线，支持色调标记、item slot 与连接线。
- 支持 JavaScript/TypeScript、Python、C/C++、Rust、TeX、Markdown 与参考文献文件的导入/导出解析。
- 新增 `Language = "Literature"` 的书籍/文章支持：标题识别为导出，参考文献条目识别为依赖。
- `ElementLoading`：绑定到指定元素或 CSS 选择器的加载遮罩，会跟随元素尺寸与滚动变化。
- `FullscreenLoading`：基于原生 `<dialog>` 与 `showModal()` 的全屏加载层，带模糊遮罩和不确定进度。
- `Rate` 评分组件：支持半星、重复点击清零、只读、禁用、键盘、尺寸与校验文案。
- `DateTimePicker` 自定义面板：年份和月份可直接输入，提供日期网格、小时/分钟输入以及 Clear/Apply。
- `Snackbar`：支持受控显示、色调、操作按钮、关闭按钮与自动隐藏。
- 列表与树适配器契约：`src/layout/list/adapter`、`src/layout/tree/adapter`。
- `src/layout/list`、`src/layout/tree` 与 `src/layout/index.ts` 的公共入口。

### 变更

- `ProjectManager` 不再保留固定的中间目录栏。项目树移入文件页与架构页，架构页同时展示所选文件的解析结构。
- 文学项目与代码项目使用同一套项目模型，没有特殊的文学模式或独立展示分类。
- `Select` 从 `src/component/picker/select` 迁移到 `src/component/input/select`，拆分为 `adapter`、
  `normal`、`virtual` 模块，旧 picker 目录已移除。
- 数据组件统一从重构后的 `layout/list/adapter` 与 `layout/tree/adapter` 导入适配器。
- `List` 与 `Tree` 的虚拟行严格遵循固定的 `itemHeight`，并移除了基础 `min-height` 的覆盖。
- `TimePicker` 现在点击整个输入框都会打开原生选择器，不再只响应右侧图标。
- `Rate`、`Table` 与布局数据组件已加入组件展示页。

### 修复

- Tree 行点击现在会展开/收起，不再只响应箭头图标。
- 消息气泡复用 `ContextMenu` 的 slot，支持右键与 500ms 长按菜单：复制、转发、收藏、多选、引用、删除；
  自己的消息额外提供撤回。
- Pager 与 Navigation、Tabs 之间不再来回闪烁：路由变化增加防抖，滚动更新延迟 80ms，程序化滚动保留目标锁，
  由 `route` 驱动的切换不再回写 `onRouteChange`。
- Navigation 与 Tabs 的选项切换在通知 `onValueChange` 前增加 80ms 防抖，避免受控值与页面导航互相反馈。
- 消息气泡改为使用 `Surface` ripple；已读消息显示双勾，已发送消息保留单勾。

- `Columns` 使用父级独立的 gap 变量，避免子元素继承的 gap 破坏等宽列并导致整列换行。
- Checkbox 错误态显示完整的四边红色边框，不再出现被裁切的 L 形。
- TextInput、Select、Checkbox、Switch 的禁用态保留可见边界，不再随整个控件一起淡出。
- Dropdown 面板增加打开与关闭动画，关闭时保留一段存在时间以完成退出动画。
- Combobox 加载图标持续旋转，移除了 reduced-motion 禁用规则和不可靠的时长计算。
- Snackbar 与 Toast 的操作/关闭按钮不再在深色表面上绘制浅色悬浮底板或深色 ripple。
- 按钮文字不再因行高与 overflow 设置而裁切字母下伸部。
- Select 各变体的最小高度已统一，standard 变体不再带额外上边距。

### 已知缺口

- `CommentThread` 使用树适配器，但还没有虚拟树或复选树版本。
- `Deque.size()` 返回 `bigint`，而 Map、Set、Tree 使用 `number`，该 API 尚不一致。
- 目前没有正式自动化测试套件；验证依赖 TypeScript、ESLint、生产构建以及针对性的运行时冒烟检查。
