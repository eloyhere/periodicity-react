# Periodicity React

一套 Material 风格的 React 组件库与设计系统展示项目，核心包括五向抽屉布局、以 Flex 为基础的排版体系、
适配器驱动的数据组件，以及一组可选的数据结构工具。

> **状态：** 本仓库目前是 Periodicity 设计系统的源码，尚未发布到 npm，也没有正式的包入口。
> 请直接从仓库中引用源码。

## 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [在项目中使用](#在项目中使用)
- [布局](#布局)
- [组件](#组件)
- [数据组件与适配器](#数据组件与适配器)
- [Contact、MessageList 与 Chat](#contactmessagelist-与-chat)
- [项目管理器](#项目管理器)
- [加载](#加载)
- [主题](#主题)
- [动效与 ripple](#动效与-ripple)
- [数据结构](#数据结构)
- [无障碍](#无障碍)
- [项目结构](#项目结构)
- [代码约定](#代码约定)
- [验证](#验证)
- [更新日志](#更新日志)

## 环境要求

- Node.js 20 或更高版本
- npm 10 或更高版本
- 支持原生 `<dialog>`、CSS 自定义属性和 `input.showPicker()` 的现代浏览器

项目使用 React 19、TypeScript 6、Vite 8，并启用 React Compiler。

## 快速开始

```bash
npm install
npm run dev
```

开发服务器会打开组件展示页。仪表盘示例位于 `#dashboard`。

```bash
npm run build       # 类型检查与生产构建
npm run lint        # ESLint，包括 React hooks 与编译器规则
npm run format      # 使用 Prettier 处理非 TypeScript 资源
npm run preview     # 预览生产构建
```

## 在项目中使用

每个组件都有 `Periodicity` 前缀的公共导出，例如 `PeriodicityButton`、`PeriodicityTable`、`PeriodicityDialog`。不带前缀的名称继续作为兼容别名保留。从源码统一入口导入组件：

```tsx
import { PeriodicityButton, PeriodicityTextInput } from "./component";
import { Stack } from "./arrange/layout";
import "./index.css";
```

`src/index.css` 会加载 Material 调色板和基础 token。组件自身也会导入各自的样式，因此直接使用源码时，
只需要在应用入口引入一次全局样式。

```tsx
import { useState } from "react";
import { PeriodicityButton, PeriodicityTextInput } from "./component";
import { Stack } from "./arrange/layout";

export const SignIn = () => {
    const [email, setEmail] = useState("");

    return (
        <Stack gap="md">
            <PeriodicityTextInput
                label="邮箱"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
            />
            <PeriodicityButton onClick={() => console.log(email)}>继续</PeriodicityButton>
        </Stack>
    );
};
```

## 布局

`src/layout` 提供结构性布局组件。所有布局以 Flex 为基础，不使用 CSS Grid。

| 组件                              | 用途                                       |
| --------------------------------- | ------------------------------------------ |
| `Stack` / `Inline` / `Columns`    | 垂直、水平、等宽多列排列                   |
| `LinearLayout`                    | 方向、重力、对齐、间距、换行与权重         |
| `GridLayout`                      | 基于 Flex 的响应式卡片列                   |
| `WaterfallLayout`                 | 轮询分配的瀑布流列                         |
| `ConstraintLayout` / `Constraint` | 锚点定位与偏移                             |
| `DrawerLayout`                    | 五向推入布局                               |
| `Drawer`                          | 模态侧边抽屉                               |
| `Tabs` / `TabPanel`               | 标签导航与面板                             |
| `Menu` / `MenuItem`               | 弹出式或内联菜单                           |
| `NavigationView`                  | 侧边栏、窄栏与底部导航                     |
| `Pager` / `PagerPage`             | 可滑动、滚动吸附的分页                     |
| `Table`                           | 语义化数据表格                             |
| `List`                            | 适配器驱动的列表与虚拟列表                 |
| `Tree`                            | 适配器驱动的可展开树与虚拟树               |
| `Contact`                         | 适配器驱动、带在线状态的联系人列表         |
| `MessageList`                     | 适配器驱动的聊天消息列表                   |
| `Chat`                            | 联系人、消息记录与输入框组合的聊天布局     |
| `ProjectManager`                  | 文件树、依赖图、预览、编辑器与项目导入导出 |

### DrawerLayout

`DrawerLayout` 包含五个插槽：`left`、`top`、`centre`、`right`、`bottom`，同一时间只允许一侧打开。
打开一侧会把 `centre` 推开，而不是覆盖它。`center` 仍作为 `centre` 的兼容别名保留。

```tsx
import { DrawerLayout } from "./component";

<DrawerLayout
    left={<Navigation />}
    top={<SearchBar />}
    centre={<MainPage />}
    right={<Inspector />}
    bottom={<StatusBar />}
    leftOpen={leftOpen}
    topOpen={topOpen}
    bottomOpen={bottomOpen}
    rightOpen={rightOpen}
    onLeftOpenChange={setLeftOpen}
    onTopOpenChange={setTopOpen}
    onBottomOpenChange={setBottomOpen}
    onRightOpenChange={setRightOpen}
    topHeight={112}
    bottomHeight={88}
/>;
```

五个方向都有宽度或高度动画，当前打开的一侧由遮罩和外部指针拦截保护。通过 ref 暴露的命令式方法包括：
`open`、`close`、`toggle`、`openLeft`、`openTop`、`closeBottom`、`isOpen`。

## 组件

组件统一入口包含以下分组。

### 操作与状态

`Button`、`Badge`、`Chip`、`Avatar`、`AvatarGroup`、`Alert`、`Banner`、`EmptyState`、`Progress`、
`CircularProgress`、`Spinner`、`ProgressRing`、`Skeleton`、`Timeline`。

### 输入

`TextInput`、`TextArea`、`NumberInput`、`Mention`、`CompleteInput`、`EmailInput`、`TelephoneInput`、`Checkbox`、
`Radio`、`RadioGroup`、`Switch`、`Range`、`Rate`。

### Timeline

`Timeline` 以垂直时间线渲染事件，支持色调标记和 item slot：

```tsx
<Timeline
    items={[
        { id: "draft", title: "Draft saved", time: "09:30", tone: "accent" },
        { id: "review", title: "Review started", time: "10:15" },
    ]}
/>
```

文本输入支持 outline、fill、standard 三种外观，以及尺寸、标签、提示、错误信息、前后图标和禁用状态。

### 选择器

`Select`、`VirtualSelect`、`Combobox`、`TimePicker`、`DateTimePicker`、`NumberPicker`、`ColourPicker`、
`VariantPicker`。

`TimePicker` 点击输入框任意位置都会打开原生时间选择器，不再只响应时钟图标。
`DateTimePicker` 使用自定义面板，年份和月份可直接输入，同时提供日期网格、小时和分钟输入。
`Select` 位于 `input/select`，拆分为 `normal` 与 `virtual` 两个入口，并共享 `SelectAdapter`；
`VirtualSelect` 用于窗口化超长选项列表。`NumberPicker` 是 Android 风格的居中数字滚轮，带加减按钮与键盘支持。

```tsx
<DateTimePicker label="开始时间" value={startsAt} onChange={setStartsAt} />
```

### Mention

`Mention` 在输入 `@` 时打开建议列表。加载行为完全由调用方控制：`onSearch` 接收当前查询和 `AbortSignal`，
可以同步或异步返回建议。

```tsx
<Mention
    label="回复"
    value={draft}
    onChange={setDraft}
    onSearch={async (query, { signal }) => {
        const response = await fetch(`/api/people?q=${encodeURIComponent(query)}`, { signal });
        return response.json();
    }}
    onMention={(person) => console.log(person)}
/>
```

`CommentThread` 已在回复编辑器中内嵌 `Mention`。通过 `mentionSearch`、`mentionSuggestions` 和 `onMention`
控制每个评论父级的加载与选中回调。

### 表面与展开内容

`Surface`、`Card`、`Accordion`、`Divider`、`CommentThread`、`Transfer`。

### 浮层与反馈

`Dialog`、`ConfirmDialog`、`MessageDialog`、`InputDialog`、`Drawer`、`Dropdown`、`Popover`、`Tooltip`、
`Menu`、`Snackbar`、`ToastProvider`、`useToast`、`Pagination`、`Breadcrumbs`、`Stepper`。

`Surface` 提供色调背景、阴影、形状、键盘处理和跟随指针的 ripple。嵌套 `Surface` 会阻止 ripple 事件冒泡，
因此卡片中的按钮不会让整张卡片一起出现水波纹。

## 数据组件与适配器

数据组件通过一层轻量适配器，让数组、虚拟窗口和未来的数据源共享同一套接口。

- `ListAdapter<T>` 与 `createListAdapter(items, options)` 位于
  [`src/layout/list/adapter`](src/layout/list/adapter/index.ts)。
- `TreeAdapter<T>` 与 `createTreeAdapter(roots, options)` 位于
  [`src/layout/tree/adapter`](src/layout/tree/adapter/index.ts)。

### List

```tsx
import { List, createListAdapter } from "./component";

const adapter = createListAdapter(people, {
    getKey: (person) => person.id,
});

<List
    adapter={adapter}
    selectionMode="multiple"
    defaultSelectedKeys={["mira"]}
    onSelectionChange={(keys, items) => console.log(keys, items)}
/>;
```

可用预设：

- `List`：默认不选择
- `SelectList`：单选
- `MultipleList`：多选
- `CheckList`：带复选框的多选
- `VirtualList`：固定行高虚拟窗口

标准列表节点为 `{ index, label, value }`：

```tsx
import { List, type ListOption } from "./component";

const options: ListOption<string>[] = [
    { index: 0, label: "Morning pages", value: "morning" },
    { index: 1, label: "Deep work", value: "deep-work" },
];

<List
    items={options}
    getKey={(option) => option.value}
    slots={{ item: (option) => <strong>{option.label}</strong> }}
/>;
```

`slots.item` 会收到节点和 `{ index, selected, disabled }`。简单自定义仍可使用 `renderItem`。

### Tree

```tsx
import { CheckTree } from "./component";

<CheckTree
    items={nodes}
    getKey={(node) => node.id}
    getChildren={(node) => node.children ?? []}
    defaultExpandedKeys={new Set(["practice"])}
    defaultCheckedKeys={["breath"]}
/>;
```

可用预设：

- `Tree`：可展开树，可选择
- `SelectTree`：单选
- `CheckTree`：复选，并支持子树联动
- `VirtualTree`：固定行高虚拟窗口

标准树节点在列表节点基础上增加 `depth`：

```tsx
import { Tree, type TreeOption } from "./component";

const nodes: TreeOption<string>[] = [
    {
        depth: 0,
        index: 0,
        label: "Practice",
        value: "practice",
        children: [{ depth: 1, index: 0, label: "Breathwork", value: "breath" }],
    },
];

<Tree items={nodes} slots={{ item: (node, state) => <span>{node.label}</span> }} />;
```

`slots.item` 会收到 `{ index, level, expanded, selected, checked }`。节点提供 `depth` 时，树会用它计算缩进和
`aria-level`。

### Table

```tsx
import { Table, type TableColumn } from "./component";

interface Person {
    id: string;
    name: string;
    role: string;
}

const columns: TableColumn<Person>[] = [
    { id: "name", header: "姓名", cell: (person) => person.name },
    { id: "role", header: "角色", cell: (person) => person.role },
];

<Table
    columns={columns}
    rows={people}
    rowKey={(person) => person.id}
    selectedKeys={selected}
    onSelectionChange={setSelected}
    density="compact"
    striped
/>;
```

`Table` 也可以用 `adapter` 代替 `rows`。它支持行选择、全选、indeterminate 状态、吸顶表头、紧凑密度、
斑马纹、悬浮、加载、空状态、标题和行点击。设置 `virtual`、`height`、`rowHeight` 可以在保留语义化表格结构的
同时窗口化大数据集。

### Transfer 与评论

`Transfer` 内部使用列表适配器，支持多选；通过 `virtual`、`listHeight`、`itemHeight` 可启用固定行高虚拟窗格。
`CommentThread` 使用树适配器管理嵌套回复。

### Contact、MessageList 与 Chat

消息界面拆分为三个适配器驱动的组件。每个组件都按 `adapter`、`normal`、`virtual` 模块组织。

```tsx
import { Chat, Contact, MessageList, VirtualChat } from "./component";

<Contact contacts={contacts} defaultValue="mira" />

<MessageList messages={messages} currentUser="You" />

<Chat
    contacts={contacts}
    messages={messages}
    defaultValue="mira"
    currentUser="You"
    onSend={(body, contact) => send(body, contact)}
/>

<VirtualChat contacts={contacts} messages={messages} />
```

- `Contact`：搜索联系人、在线状态圆点、选中状态。
- `MessageList`：自己/对方消息气泡、时间、送达状态、自动滚动。气泡使用 `Surface` ripple；已读消息显示双勾，
  已发送消息显示单勾。
- 消息支持右键与长按，通过共享 `ContextMenu` 的 slot 展示复制、转发、收藏、多选、引用、删除；自己的消息额外
  提供撤回。
- `Chat`：联系人列表、消息记录、输入框组合布局。
- `VirtualContact`、`VirtualMessageList`、`VirtualChat`：固定行高窗口版本。
- `createContactAdapter`、`createMessageAdapter`、`createChatAdapter`：构建对应适配器。

### 项目管理器

`ProjectManager` 是通用项目工作区。它持有一个 `Pager` 和一个 `NavigationView`，提供七个视图：
文件、预览、编辑、架构、依赖、导入、导出。项目文件树放在文件页与架构页内部，不再占用固定的中间目录栏，
从而把空间留给当前视图。

```tsx
import { ProjectManager } from "./component";

<ProjectManager
    project={project}
    dependencies={dependencies}
    onFileChange={(file, content) => saveFile(file, content)}
    onProjectImport={(imported) => loadProject(imported)}
    onProjectExport={(exported) => downloadProject(exported)}
/>;
```

文件对象是以 `FileNode` 表示的树，包含 `id`、`path`、`kind`、可选 `content`、语言、扩展名与子节点。
`parseImports` 与 `parseExports` 支持 JavaScript/TypeScript、Python、C/C++、Rust、TeX、Markdown 与
参考文献文件。

架构页把项目节点树与所选文件的结构大纲放在一起：

- HTML 解析为标签树，属性作为子节点。
- Markdown 与散文解析为章节、段落与句子。
- TypeScript 等代码解析为类、方法、函数、属性、常量、类型、接口与注释。
- TeX 解析为章节结构。

预览通过 `renderFile` 按扩展名渲染：

- HTML 经 `DOMParser` 解析，移除脚本、表单、危险标签、事件属性和不安全 URL，再作为安全标记渲染。
- Markdown 转换为标题、列表、引用、段落和行内格式。
- TXT 按文章分析，转换为段落与换行。
- 源码文件转换为带关键字、字符串、注释、数字和函数调用高亮的代码。

结构解析使用 [`src/layout/file/structure.ts`](src/layout/file/structure.ts) 中的 `StructureNode` 与
`parseStructure`，渲染逻辑位于 [`src/layout/file/render.ts`](src/layout/file/render.ts)。

`dependencies` 表示项目级依赖，而不仅是内部文件边：

- `package.json`、`requirements.txt`、`Cargo.toml` 或显式数据中的程序包依赖；
- `.bib` 文件或 `ProjectDependency` 条目中的参考文献；
- 相对导入解析出的内部文件边。

`Language = "Literature"` 表示书籍、文章等文学作品。Markdown 标题与 TeX 章节会识别为导出，`.bib`
条目与引用会识别为参考文献。工具栏支持 JSON 项目导入与导出。

`Pager` 使用切换闸门：路由变化与滚动停稳都带防抖，程序化滚动保留目标锁，由路由驱动的切换不会回写控制器。
`NavigationView` 与 `Tabs` 的选项回调也加了防抖，避免受控值与页面导航互相触发。

## 加载

提供两种加载组件：

```tsx
import { ElementLoading, FullscreenLoading } from "./component";

<ElementLoading loading={saving} target={panelRef} label="正在保存" />
<FullscreenLoading open={preparing} label="正在准备工作区" description="正在加载你的日程。" />
```

- `ElementLoading`：测量指定元素或 CSS 选择器，在其上方挂载固定定位的遮罩和不限循环的圆形进度。
  会跟随元素尺寸变化与页面滚动。
- `FullscreenLoading`：使用原生 `<dialog>` 与 `showModal()`，全屏模糊遮罩，并显示不确定进度。
  加载期间会主动阻止 `Escape` 关闭。

## 主题

默认采用 Material 浅色调色板，通过 Android 风格的自定义属性暴露：

```css
:root {
    --colourPrimary: #1976d2;
    --colourPrimaryDark: #0d47a1;
    --colourAccent: #dc004e;
    --colourTextPrimary: rgba(0, 0, 0, 0.87);
    --colourTextSecond: rgba(0, 0, 0, 0.6);
    --colourTextDisabled: rgba(0, 0, 0, 0.38);
    --colourBackground: #fafafa;
    --colourSurface: #ffffff;
    --colourDivider: rgba(0, 0, 0, 0.12);
}
```

可在 `:root` 或某个容器上覆盖这些变量，实现局部换肤。间距、字体、圆角、阴影和动效等基础 token 位于
[`src/component/foundation/tokens.css`](src/component/foundation/tokens.css)。

## 动效与 ripple

`Surface` 默认同时启用 hover 与点击 ripple。ripple 从指针位置扩散，并根据表面亮度自动选择对比色；
键盘激活时使用居中的 ripple。

```tsx
<Surface ripple={{ layer: "foreground", trigger: ["hover", "click"] }} elevation={2} shape="md">
    内容
</Surface>
```

下拉层有淡入淡出与位移动画，抽屉有推入尺寸动画。当前环境会有意保留这些动效，即使操作系统请求减少动效。

## 数据结构

`src/structure` 提供一组可选的数据结构工具：

- 线性结构：`Deque`、`Queue`、`Stack`
- 映射：`OrderedMap`、`UnorderedMap`、`OrderedSkipMap`、`ConcurrentUnorderedSkipMap`、
  `ConcurrentOrderedMap`、`ConcurrentUnorderedMap`
- 集合：`OrderedSet`、`UnorderedSet`、`OrderedSkipSet`、`ConcurrentUnorderedSkipSet`、
  `ConcurrentOrderedSet`、`ConcurrentUnorderedSet`
- 树：`BinarySearchTree`、`RedBlackTree`、`BPlusTree`、`BalanceTree`、`LinearTree`、`SkipTree`、
  `Trie`、`Heap`、`SegmentTree`
- 辅助：各节点实现、`Mutex`、`Optional`、同步/异步 Stream、哈希与最近最少使用容器

```tsx
import { Optional, OrderedMap, RedBlackTree } from "./structure";

const map = new OrderedMap<string, number>();
map.set("focus", 25);

const tree = new RedBlackTree<number, string>();
tree.set(1, "one");

const value = Optional.ofNullable(map.get("focus")).orElse(0);
```

## 无障碍

交互组件提供语义角色和标签。List 使用 `listbox` / `option`，Tree 使用 `tree` / `treeitem`，Table 使用原生
表格语义，Drawer 使用带标签的侧边区域，全屏加载使用带 `aria-busy` 的对话框。选择和展开状态会同步到 ARIA
属性。使用数据组件时请始终提供有意义的 `label`、`ariaLabel` 或可见标题。

## 项目结构

| 路径                         | 内容                                        |
| ---------------------------- | ------------------------------------------- |
| `src/component`              | 组件、输入、选择器、浮层与反馈              |
| `src/component/input/select` | 普通/虚拟 Select 入口与共享选择适配器       |
| `src/layout`                 | 布局原语与数据组件                          |
| `src/layout/contact`         | 联系人适配器、普通列表与虚拟列表            |
| `src/layout/message`         | 消息适配器、普通消息记录与虚拟消息记录      |
| `src/layout/chat`            | 聊天适配器与普通/虚拟聊天布局               |
| `src/layout/file`            | 项目管理器、文件节点、依赖图、导入/导出解析 |
| `src/layout/list/adapter`    | 列表适配器接口                              |
| `src/layout/tree/adapter`    | 树适配器接口                                |
| `src/structure`              | 数据结构工具                                |
| `src/showcase`               | 组件展示与文档示例                          |
| `src/arrange`                | `Stack`、`Inline`、`Columns`                |

## 代码约定

- 注释和文档使用英式英语。
- 公共 API 使用明确的 TypeScript 类型和 JSDoc。
- 标识符使用 camelCase，不使用前导下划线。
- 按项目风格使用 `(void 0)` 代替 `undefined`。
- 布局使用 Flexbox，不使用 CSS Grid。
- 源文件使用 CRLF 换行，目标行宽 120 列。

## 验证

当前基线通过：

```bash
npx tsc -p tsconfig.app.json --noEmit
npx eslint src --max-warnings 0
npm run build
```

## 更新日志

英文更新日志见 [CHANGELOG.md](CHANGELOG.md)，简体中文更新日志见 [CHANGELOG.zh-CN.md](CHANGELOG.zh-CN.md)。
