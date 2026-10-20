# 数据适配器层架构研究报告（Adapter Architecture）

> 项目：`periodicity-react`（React 19 · TypeScript 6 · Vite 8 · 自建深色编辑风组件库）
> 范围：`src/adapter/{list,tree}/**`、`src/structure/{hash,map,set}` 的设计与实现规范
> 日期：2026-10-20 ｜ 版本：v1（研究 + 可落地规范）
> 约束：本报告只新增 `docs/research/adapter-architecture.md`，**未修改 `src` 下任何文件**（含 `src/component/icon/**`）。

**证据等级标记**（全文统一）：

| 标记 | 含义                                                 |
| ---- | ---------------------------------------------------- |
| ✔    | 已抓取官方文档 / `.d.ts` 原文并逐字核对              |
| ◐    | 引用官方文档页面，但页面为客户端渲染，未逐字抓取正文 |
| ⚠    | 推断 / 经验值，**需要在本项目实测后定稿**            |

代码块说明：第 4、5、6、7 章的 **TypeScript** 代码块（不含 JSX 示意与第 2.3 节引用的库类型）已合并为单模块，在 `tsc --strict --noUnusedLocals --noUnusedParameters --erasableSyntaxOnly --verbatimModuleSyntax`（与项目 `tsconfig.app.json` 的 `erasableSyntaxOnly`/`verbatimModuleSyntax` 一致）下编译通过，并对**从本文档抽取的代码**跑了 17 条运行时断言（flatten 前序、`posInSet/setSize`、级联勾选、半选、shift 区间、虚拟窗口数学、`ensureVisibleKey`），另有一套 33 条断言的完整测试覆盖 `withExpanded/normalize/path` 等。性能数字来自同机 Node 24 单进程基准（见 8.1），仅作数量级参考。

> **并行工作提示**：本仓库的 `src/structure/**` 与 `src/component/foundation/**` 正由其他同学并行实现（已存在 `structure/hash/hash.ts`、`structure/map/{ordered,unordered}.ts`、`structure/set/{ordered,unordered}.ts`、`component/foundation/useControllableState.ts` 等）。本报告的**接口与算法**是新增内容，**文件划分**建议按 10.6 与现有实现合并，不要覆盖已有文件。

---

## 0. TL;DR：10 条结论

1. **适配器 = 只读索引 + 派生视图**，不是"数据的另一种写法"。组件永远只拿 `ListAdapter` / `TreeAdapter` 接口，`items: T[]` 一律不进入组件 props。
2. **三种业界路径**：TanStack "table instance 即适配器"（状态 + 惰性 row model）、React Aria "Collection 每次构建 + 接口消费"、AG Grid/MUI "row id + row model + 受控选择模型"。**借第 2、3 条的接口与 key 契约，不借第 1 条的状态内聚**。
3. **key 是唯一真值**：选择、展开、勾选、焦点全部以 `Key` 存储；`index` 只是位置，永远不能作为状态标识。
4. **`flatten` 返回可见序列**，`TreeAdapter` 的 `ListAdapter` 侧索引域就是"当前展开下的可见序列"，从而树可以直接接虚拟化与 `posInSet/setSize`。
5. **可变与不可变分离**：核心 adapter 是纯函数 + 不可变快照；需要增量（远程分页、异步子树、测量缓存）时用 `subscribe` + `version` 走 `useSyncExternalStore`。
6. **`checkedKeys` 只存"全选"节点，半选是派生状态**。这一条约定消灭了绝大多数级联勾选 bug。
7. **受控优先**：`selectedKeys` / `expandedKeys` 受控时只上报不回写；`anchorIndex`（shift 区间锚点）必须留在组件内部，不能塞进受控 prop。
8. **虚拟化阈值 100 行**：`<100` 直接渲染；`>100` 固定高度虚拟；动态高度必须"测量写回 + 前缀和重算"，且测量时**不得**同步重算偏移（本报告基准里这一条把 10k 次测量从 1886ms 降到 0.87ms）。
9. **无障碍属性全部由 adapter 派生**：`aria-setsize/posinset/level/expanded/selected/checked`、虚拟网格 `aria-rowcount/aria-rowindex`；焦点行必须强制留在渲染窗口内。
10. **依赖方向单向**：`structure → adapter → component`，`adapter` 不 import `component`，核心 adapter 不 import `react`（只有同目录的 `use*.ts` 可以）。

---

## 1. 背景与约束

### 1.1 现状

脚手架目录已存在：

```
src/adapter/list/{adapter,level,list,virtual}/   # 本报告负责（当前为空）
src/adapter/tree/{adapter,check,select,virtual}/ # 本报告负责（当前为空）
src/structure/{hash,map,set}/                     # 并行工作已产出 hash.ts / ordered.ts / unordered.ts
```

现有组件是"直接吃数组"的形态，例如 `Select` 接收 `options: SelectOption[]` 并 `options.map(...)`（`src/component/picker/select/Select.tsx:11-53`，60 行，至今未变）。它的问题是**结构不可替换**：一旦要接远程分页、分组、树形或虚拟化，组件必须改内部实现，而不是换一个数据源。项目方要求"凡是需要数组/树结构数据的 UI，都必须通过 adapter"，本质就是把"数据结构假设"从组件里剥离出来。

### 1.2 硬性约束

| 约束                                     | 影响                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| 不碰 `src/component/icon/**`             | 组件改造从 `picker/select`、`input/*` 等开始，icon 只作为渲染子节点           |
| `erasableSyntaxOnly: true`               | **禁止 `enum`、`namespace`、构造函数参数属性**；用 `as const` 对象 + 联合类型 |
| `verbatimModuleSyntax: true`             | 类型导入必须 `import type`                                                    |
| React 19 + `babel-plugin-react-compiler` | 不能依赖"编译器帮忙 memo"来保证 adapter 身份稳定（见 7.2）                    |
| 无第三方依赖                             | 虚拟化/树/选择全部自研，因此接口必须自己定义清楚                              |

### 1.3 设计目标（对齐 React Aria 的公开目标清单）

React Spectrum 在 [Collection components](https://react-spectrum.adobe.com/v3/collections.html) ✔ 中列出的目标，可直接作为本项目的验收清单：静态数据、动态数据、异步加载、同一来源的分组、多来源的分组、单选/多选（受控与非受控）、树与手风琴的受控展开、"在数据从服务器加载**之前**就能标记 selected/expanded/disabled"、虚拟化、无限滚动。这九项里，本项目的 adapter 至少要覆盖到"加载前可标记"和"虚拟化不侵入组件"。

---

## 2. 业界方案横向对比

### 2.1 TanStack Table：table instance 即适配器

**它的模型**（已核实）：`table` 实例持有一切状态，行数据通过一串 **row model** 变换得到。执行顺序是固定的：

```
getCoreRowModel → getFilteredRowModel → getGroupedRowModel → getSortedRowModel
→ getExpandedRowModel → getPaginatedRowModel → getRowModel
```

当某个能力被关掉或使用 `manual*` 选项（服务端分页/排序）时，该步改用对应的 `getPre*RowModel`（[Row Models Guide](https://tanstack.com/table/latest/docs/guide/row-models.md) ✔）。每个 row model 输出三种形态：`rows`（当前层）、`flatRows`（全部拍平）、`rowsById`（按 id 的字典，官方明确说"用于按 id 快速查找，性能更好"）✔。

行对象的约定（[Rows Guide](https://tanstack.com/table/latest/docs/guide/rows.md) ✔）：

- `row.id` 默认等于 `row.index`，可用 `getRowId: (originalRow) => originalRow.uuid` 覆盖；
- **分组/展开等特性会给 `row.id` 追加后缀**（原文："the `row.id` will have an additional string appended to it"）；
- `row.index` 是"创建时的位置"，**不会**跟随过滤/排序变化；要显示行号必须用 `row.getDisplayIndex()`；
- 子行：`row.subRows`、`row.depth`、`row.parentId`、`row.getParentRow()`。

**可借鉴的三点**：

1. **管线（pipeline）思维**：过滤 → 分组 → 排序 → 展开 → 分页，每一步是纯函数、可单测、可 `manual` 交给服务端。我们的 `flatten(expandedKeys)` 就是管线里"展开"这一步的显式化。
2. **`rowsById` 必须存在**：官方把它当性能特性写进文档，说明 O(1) 按 key 查是刚需，而不是优化项。
3. **`getRowId` 把"业务 key"注入"框架 key"**：这正是 `ListAdapter.getKey(index)` 的职责。

**不借鉴的一点：状态内聚到实例。** `table` 同时持有数据、排序、过滤、选择、分页、展开状态，组件通过 `table.getRowModel()` 拿结果。对本项目的代价：

- 状态不可序列化、不可受控（受控要写 `state` + `onStateChange` 的桥接层）；
- 一个组件树里两个视图共享数据时，只能共享 instance，容易耦合；
- React 19 并发渲染下，实例内部缓存与渲染的时序更难推理（⚠ 推断）。

**结论**：借"管线 + `rowsById` + `getRowId`"，不借"instance 持有全部状态"。我们把它拆成**不可变索引（adapter）+ 受控状态（组件/调用方）**。

> 版本提示：`latest` 文档已是 v9 形态（`tableFeatures()` + `createSortedRowModel()`，core row model 自动包含）；v8 里需要显式传 `getCoreRowModel()`。两代 API 的管线顺序一致。✔

### 2.2 TanStack Virtual：把"测量"与"渲染窗口"分离

核心接口（[Virtualizer API](https://tanstack.com/virtual/latest/docs/api/virtualizer.md) ✔）：

| 能力                                         | 关键点                                                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `count` / `estimateSize(index)`              | 必填；**动态测量时估算值应取"较大的合理值"**，否则初始总高偏小、滚动位置会跳                       |
| `overscan`                                   | 视口上下各多渲染几项，默认 `1`，增大减少空白但增加渲染量                                           |
| `getItemKey`                                 | 默认返回 index；官方要求"尽量改成全局唯一 id"，并建议 memo 化                                      |
| `measureElement(el)`                         | 必须配合 `data-index={virtualRow.index}` 与 `ref`，内部用 `getBoundingClientRect` + ResizeObserver |
| `getVirtualItems()`                          | 返回 `{index, start, size, key}`，是渲染的唯一来源                                                 |
| `scrollToIndex(i, {align})`                  | `align: start/center/end/auto`，平滑滚动时会跳过远处测量以免目标漂移                               |
| `horizontal`                                 | 水平虚拟化开关                                                                                     |
| `lanes`                                      | 多列/瀑布流：`lanes = 列数`，每项进入"当前总高最短"的 lane                                         |
| `anchorTo: 'end'` + `followOnAppend`         | 聊天/日志场景的滚动锚定（新内容追加时保持视口）                                                    |
| `scrollMargin`                               | 列表上方有 header 时校正偏移                                                                       |
| `useCachedMeasurements`                      | 列表被 `display:none` 隐藏时避免 ResizeObserver 把尺寸全部测成 0                                   |
| `shouldAdjustScrollPositionOnItemSizeChange` | 默认只在"非向上滚动"时做补偿，规避"往上滚时行乱跳"的经典问题                                       |

**可借鉴**：`count + estimateSize + 测量写回 + 窗口计算 + scrollToIndex 纯数学` 这一套完全可以在不碰 DOM 的前提下实现（本报告第 5.5 节就是这么做的），DOM 相关（`ResizeObserver`、`scroll` 事件、`scrollTo`）留在组件层。这样虚拟化数学可以在 Node 里单测——本报告的 `getWindow` 断言就是这么跑的。

**不借鉴**：`lanes` 的自动分配、`anchorTo` 的聊天语义属于场景特性，不进核心接口，作为 `VirtualAdapter` 的可选扩展（见 10.5）。

### 2.3 React Aria / React Spectrum Collections：最佳范例

这是"组件只依赖 collection 接口"的教科书。已核实的类型（`@react-stately/collections` 的 `.d.ts`）✔：

```ts
export class CollectionBuilder<T extends object> {
    build(props: Partial<CollectionBase<T>>, context?: unknown): Iterable<Node<T>>;
}
export function useCollection<T extends object, C extends Collection<Node<T>>>(
    props: CollectionOptions<T, C>,
    factory: CollectionFactory<T, C>,
    context?: unknown,
): C;
export function getItemCount<T>(collection: Collection<Node<T>>): number;
export function getChildNodes<T>(node: Node<T>, collection: Collection<Node<T>>): Iterable<Node<T>>;
export let Item: <T>(props: ItemProps<T>) => JSX.Element;
export let Section: <T>(props: SectionProps<T>) => JSX.Element;
```

要点：

- **`Collection<T>` 是一个只读接口**（`size` / `getKeys()` / `getItem(key)` / `at(idx)` / `getChildren(key)` / `getKeyBefore|After` / 可迭代），`Node<T>` 是元素（`key`、`value`、`type`、`parentKey`、`index`、`hasChildNodes`、`childNodes` 等）◐。**组件（ListBox/Tree/Table/Select/ComboBox/Menu）只认这个接口**，不认"数组"。
- **静态集合 vs 动态集合** ✔：`<Item>` 子元素是静态；`items={data}` + 渲染函数是动态。动态集合会按 item 的对象身份**缓存渲染结果**，官方明确说这比 `data.map()` 性能好得多（[Collections](https://react-spectrum.adobe.com/v3/collections.html) ✔）。
- **`dependencies` prop**：当单项渲染依赖外部状态时，用它使缓存失效；否则整表不失效、单表乱渲染（[Collections（S2）](https://reactspectrum.blob.core.windows.net/reactspectrum/378ff35030687cb1502fd7026d083d4119bf17f8/s2-docs/react-aria/collections.html?component=ListBox) ✔）。
- **key 类型陷阱**：显式写 `key={item.dataId}` 时 React 会把它转成字符串，`selectedKey` 必须给 `"2"` 而不是 `2`；只有把 id 放在 `items` 数组对象里才保留原始类型（[Selection](https://react-spectrum.adobe.com/v3/selection.html) ✔）。这条直接决定了我们 `KeyIndex` 的"数值兜底"设计（5.1）。
- **不可变要求**：官方原文"所有传给 collection 组件的 item 必须不可变，`array.push()` 之类不会按预期工作" ✔。
- **数据变更后的选择修剪**：`useListData` / `useTreeData` 会在删除 item 时自动把它从选中集合移除 ✔。我们的 `normalize` / `normalizeExpanded` 对应这个职责。
- **全选语义 `'all'`**：`selectedKeys` 可为 `Set` 或字符串 `'all'`，表示"全部（含尚未从网络加载的）"；`'all'` 时 `onSelectionChange` 也回传 `'all'`，应用需要自己区分批量操作范围 ✔。这是本报告 `SelectionValue = ReadonlySet<Key> | "all"` 的来源。
- **`CollectionBuilder` / `useCollection`** ✔：集合在 hook 内按依赖重建，`Item`/`Section` 只是"带类型的标记组件"（只描述数据，不描述渲染）。

**差距与取舍**：React Aria 把集合构建放在 `useCollection` 里，每次依赖变化重建 `Node` 树；我们把"建索引"下沉成纯函数 `createTreeAdapter`，把"展开视图"做成 `withExpanded` 派生。区别是**失效粒度可控**：只改展开时不必重建索引（O(visible) 而非 O(n)），这点在 10 万节点树上差异明显（实测：索引 26ms vs 派生 0.77ms/次）。

### 2.4 AG Grid / MUI X / Ant Design：数据模型与受控状态

| 维度     | AG Grid                                                 | MUI X DataGrid                                                              | Ant Design                                                 |
| -------- | ------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 行标识   | `getRowId`（v27.1 起取代 `getRowNodeId`）◐              | `getRowId` ◐                                                                | `rowKey` ◐                                                 |
| 树形数据 | `treeData` + `getDataPath`（路径数组描述层级）◐         | `treeData` + `getTreeDataPath` ◐                                            | `treeData` / `childrenColumnName`，或 Tree 的 `treeData` ✔ |
| 懒加载   | Server-Side Row Model（`getRows({startRow, endRow})`）◐ | server-side data source（分页/无限）◐                                       | Tree 的 `loadData` + 受控 `loadedKeys` ✔                   |
| 选择模型 | 受控 `selectedRows`（返回行对象）◐                      | `rowSelectionModel`，v7 起为 `{ type: 'include' \| 'exclude', ids: Set }` ◐ | `selectedRowKeys` + `onChange` ◐                           |
| 数据刷新 | 保留 row id 即保留状态 ◐                                | `keepNonExistentRowsSelected` 控制"已选但数据不存在"的行是否保留 ◐          | `preserveSelectedRowKeys` ◐                                |
| 虚拟化   | 内建行虚拟化（DOM 行数 = 视口量）◐                      | 内建 ◐                                                                      | `virtual`（默认开）+ `scroll.y` ◐                          |

三条对本项目最有价值的结论：

1. **`include` / `exclude` 双模型**（MUI v7）与 React Aria 的 `'all'` 是同一个洞察：**"全选"不能用"遍历所有 key 加进 Set"来表达**，否则 10 万行要 10 万次插入、跨页全选语义也会错◐。我们的 `SelectionValue` 因此保留 `'all'`，并在需要显式集合时才 `materialize`（O(n)，罕见路径）。
2. **懒加载必须是"受控 + 已加载集合"**：Ant Tree 的 `loadData` 配 `loadedKeys`（受控）✔，AG/MUI 用 row model 的 `startRow/endRow`（分页窗口）◐。这直接推出 `ensureRange(start, end)` 这个"唯一允许有副作用"的接口方法（4.2）。
3. **Ant Tree 的级联语义是官方明确定义过的**（难得有中文团队熟悉的权威表述）✔：
    - `checkedKeys` 受控时，**给父 key 会联动勾选全部子节点，给子 key 会联动勾选父节点**；
    - `checkStrictly` 关闭联动，此时 `checkedKeys` 可写成 `{checked, halfChecked}`；
    - `onCheck(checkedKeys, { halfCheckedKeys })` 把半选单独返回；
    - **`disabled` 节点会阻断传导**：勾父节点只勾"其余非 disabled 子节点"；子节点被勾时 disabled 父节点状态不被改；
    - `virtual` 默认 `true`，且**虚拟滚动下不支持自适应宽度**（长标题无法横向滚动）；
    - `Tree.useTree(treeData).getPath(key)` 返回根到目标的节点链，用于受控模式下展开祖先；文档特别提示 `getPath` 身份稳定但内部读最新 `treeData`，memo 时必须把 `treeData` 放进依赖。

    这几条几乎可以直接抄成我们的验收用例（见 12 章反模式与第 9 章）。

### 2.5 选型结论

| 决策点     | 选择                                               | 依据                                          |
| ---------- | -------------------------------------------------- | --------------------------------------------- |
| 适配器形态 | 不可变对象 + 纯函数工厂                            | TanStack 的管线可测性 + React Aria 的接口消费 |
| 状态归属   | 组件/调用方受控，adapter 无状态                    | 受控优先；避免 table instance 式耦合          |
| key 契约   | 业务 key 必须显式提供（`getKey`），禁止 index 兜底 | TanStack `getRowId`、`row.index` ≠ 显示序     |
| 树         | 索引 + 展开派生视图（`withExpanded`）              | 10 万节点下重建索引 26ms，派生仅 0.77ms       |
| 选择       | `Set \| 'all'` + `anchorIndex`                     | React Aria `'all'`、MUI include/exclude       |
| 勾选       | `checked` 只存全选，半选派生                       | Ant `checkStrictly`/`halfCheckedKeys` 语义    |
| 虚拟化     | adapter 只做数学，DOM 留组件                       | TanStack Virtual 的职责切分                   |

---

## 3. 目标架构

### 3.1 分层与依赖方向

```
┌──────────────────────────────────────────────────────────────┐
│ component/  (Select, Listbox, Tree, Table, Menu, Navigation) │
│  - 只依赖 ListAdapter / TreeAdapter 接口                      │
│  - 拥有 DOM、键盘、aria、虚拟化 DOM 结构                       │
└───────────────▲──────────────────────────────────────────────┘
                │ import（单向）
┌───────────────┴──────────────────────────────────────────────┐
│ adapter/                                                     │
│  list/adapter  : 接口 + useAdapterVersion/useControlledSet    │
│  list/list     : createListAdapter                           │
│  list/level    : createLevelAdapter                          │
│  list/virtual  : createVirtualAdapter（纯数学）                │
│  tree/adapter  : TreeAdapter + createTreeAdapter + flatten    │
│  tree/select   : createSelection + useSelection               │
│  tree/check    : createCheckState（级联/半选）                 │
│  tree/virtual  : createVisibleAdapter（树 → 列表窗口）         │
└───────────────▲──────────────────────────────────────────────┘
                │ import（单向）
┌───────────────┴──────────────────────────────────────────────┐
│ structure/                                                   │
│  map  : createKeyIndex（key → index，O(1) + 数值兜底）         │
│  set  : KeySet 运算、'all' 物化                                │
│  hash : keyToText / keyFromText（DOM 边界归一化）              │
└──────────────────────────────────────────────────────────────┘
```

**三条铁律**：

1. `adapter/**` 不得 import `component/**`（用 ESLint `no-restricted-imports` 兜住）。
2. 核心文件（`types.ts`、`create*.ts`）不得 import `react`；只有 `use*.ts` 可以。这样 adapter 能在 Node/Vitest 里直接单测，也能被非 React 场景复用。
3. `structure/**` 不依赖上层任何东西，只依赖语言内建类型。

### 3.2 为什么"组件只认接口"

- **可替换**：同一棵树，今天来自内存、明天来自远程分页，组件零改动。
- **可测试**：组件测试注入 3 个节点的 mock adapter，不需要构造真实数据。
- **可组合**：`createVirtualAdapter(createListAdapter(...))`、`withExpanded`、`createLevelAdapter` 都是"适配器套适配器"，不改变组件契约。
- **可优化**：`getRange` 可以返回缓存切片，组件不需要知道。

## 4. 推荐接口（TypeScript）

> 以下代码块按文件组织，可直接落盘。第 5–7 章是实现，与接口一一对应。

### 4.1 `src/adapter/list/adapter/types.ts`：最小公共接口

```ts
/** 集合元素的稳定标识。同一 adapter 域内必须唯一。 */
export type Key = string | number;

/** 滚动/对齐方式。 */
export type Alignment = "start" | "center" | "end" | "auto";

/**
 * 集合型组件的「最小公共接口」。
 * Select / Combobox / Listbox / Menu / Navigation / Table / List / Tree 只依赖这一组方法。
 */
export interface CollectionAdapter<T> {
    /** 当前可见元素数量（远程分页时会增长）。 */
    getCount(): number;
    /** 第 index 个元素的稳定 key。 */
    getKey(index: number): Key;
    /** 第 index 个元素的数据。 */
    getItem(index: number): T | undefined;
    /** 按 key 直取数据（O(1)）；缺省时组件用 indexOf + getItem 降级。 */
    getItemByKey?(key: Key): T | undefined;
    /** 层级（0 基）。扁平列表恒为 0。 */
    getLevel?(index: number): number;
    /** 父节点 key；根为 null。 */
    getParentKey?(index: number): Key | null;
    /** 是否可展开（由结构决定，与当前是否展开无关）。 */
    isExpandable?(index: number): boolean;
}

/** 可索引列表适配器：列表型组件面向的全部能力。 */
export interface ListAdapter<T> extends CollectionAdapter<T> {
    /** 变更版本号；不可变适配器恒为 0。 */
    readonly version: number;
    /** 按 key 求可见索引，缺失返回 -1。 */
    indexOf(key: Key): number;
    /** 半开区间 [start, end) 的数据切片。 */
    getRange(start: number, end: number): readonly T[];
    /** 远程适配器：确保区间已加载（唯一允许有副作用的方法，只在 effect 中调用）。 */
    ensureRange?(start: number, end: number): void;
    /** 订阅变更（配合 useSyncExternalStore）。 */
    subscribe?(listener: () => void): () => void;
}
```

**为什么是这几个方法？**

| 方法                                     | 服务对象                                              | 缺了会怎样                                                             |
| ---------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `getCount`                               | 虚拟化 `count`、`aria-setsize`、全选判断              | 组件只能自己 `items.length`，远程分页必然错                            |
| `getKey`                                 | React `key`、选择/展开/勾选、`getItemKey`             | 退回 index 作 key，插入/删除后状态错位                                 |
| `getItem`                                | 渲染                                                  | —                                                                      |
| `indexOf`                                | 键盘 Home/End/`scrollToIndex`、shift 区间、`getState` | 每次 `items.findIndex` → O(n)，10k 行每次按键数十毫秒                  |
| `getRange`                               | 渲染窗口切片                                          | 组件必须知道"怎么切"，远程适配器无法拦截                               |
| `getLevel`/`getParentKey`/`isExpandable` | 扁平化树、`aria-level`、缩进、展开箭头                | 组件只能读 item 上的 `children` 字段，接不了懒加载树                   |
| `ensureRange`                            | 无限滚动/服务端分页                                   | 只能在 `getItem` 里做副作用（render 期间请求，React 严格模式会双请求） |
| `subscribe`+`version`                    | 外部可变数据源                                        | 数据变了组件不重渲染                                                   |

> **与 React Aria 的对照**：`Collection.getItem(key)` ↔ `ListItemAdapter.getItemByKey`；`Collection.size` ↔ `getCount()`；`Collection.getChildren(key)` ↔ `TreeAdapter.getChildren`；`Node.key` ↔ `getKey(index)`。差别在于 React Aria 用 `Node` 包装数据，我们让 `T` 保持原样（更贴 TS、少一层对象）。

### 4.2 `src/adapter/tree/adapter/types.ts`：树适配器

```ts
import type { Key, KeySet, ListAdapter } from "../list/adapter/types";

/** 结构节点（不随展开变化），用于 O(1) 的父子/路径查询。 */
export interface TreeNodeEntry<T> {
    readonly key: Key;
    readonly item: T;
    readonly parentKey: Key | null;
    /** 结构层级（不随展开变化），0 基。 */
    readonly level: number;
    readonly childKeys: readonly Key[];
    readonly disabled: boolean;
    /** 是否为「结构上的可展开节点」（有子或声明为异步父）。 */
    readonly expandable: boolean;
}

/** 展开态下的一行（供渲染与 a11y 使用）。 */
export interface VisibleNode<T> {
    readonly key: Key;
    readonly item: T;
    readonly index: number;
    readonly level: number;
    readonly parentKey: Key | null;
    readonly expandable: boolean;
    readonly expanded: boolean;
    /** 同级序号（1 基），对应 aria-posinset。 */
    readonly posInSet: number;
    /** 同级总数，对应 aria-setsize。 */
    readonly setSize: number;
}

/**
 * 树适配器：在 ListAdapter 基础上加树能力。
 * 注意：ListAdapter 侧的索引域 = 「当前展开集合下的可见序列」，
 * 所以树可以直接喂给虚拟化与列表型渲染器。
 */
export interface TreeAdapter<T> extends ListAdapter<T> {
    /** 适配器绑定的展开集合。 */
    readonly expandedKeys: KeySet;
    /** 树适配器必然知道层级与父子关系，这里收紧为必选。 */
    getLevel(index: number): number;
    getParentKey(index: number): Key | null;
    isExpandable(index: number): boolean;
    getChildren(key: Key): readonly Key[];
    getParent(key: Key): Key | null;
    /** 根 -> key（含自身）。 */
    getPath(key: Key): readonly Key[];
    getNode(key: Key): TreeNodeEntry<T> | undefined;
    /** 展开态扁平化；缺省用绑定的 expandedKeys。 */
    flatten(expandedKeys?: KeySet): readonly VisibleNode<T>[];
    getVisibleCount(expandedKeys?: KeySet): number;
    /** 以同一份结构索引派生新的展开视图（O(visible)，不重建索引）。 */
    withExpanded(expandedKeys: KeySet): TreeAdapter<T>;
    /** 剔除不存在的 key；无变化时返回原对象（保持引用稳定）。 */
    normalizeExpanded(expandedKeys: KeySet): KeySet;
}

export interface TreeAdapterOptions<T> {
    getKey: (item: T) => Key;
    getChildren: (item: T) => readonly T[] | undefined;
    isExpandable?: (item: T) => boolean;
    isDisabled?: (item: T) => boolean;
    expandedKeys?: KeySet;
    onDuplicateKey?: (key: Key, message: string) => void;
}
```

**三个关键设计决定（附理由）**

1. **`flatten` 返回 `VisibleNode[]` 而不是 `ListAdapter`**：渲染需要 `level/posInSet/setSize/expandable` 这些"每行元数据"，返回裸数据数组还得再查一次；而给虚拟化用的窗口化视图另走 `createTreeWindowAdapter`（10.5），两者职责不同。
2. **`withExpanded` 派生而不是"传 expandedKeys 给每个方法"**：`getCount/getKey/getItem/getLevel` 必须共享同一个展开快照，否则同一帧内可能出现"count 按 A 算、key 按 B 算"的撕裂（⚠ 推断，但受控展开 + 并发渲染下可复现）。派生视图把一致性钉死在一个对象上。
3. **`getVisibleCount(expandedKeys?)` 带可选参数**：任务书里写作 `getVisibleCount()`；因为 adapter 不持有展开状态（受控原则），必须能传入待计算的集合；不传时用绑定的集合，兼顾两种用法。

### 4.3 选择与勾选的类型

```ts
/** 全选语义：'all' 表示「全部（含尚未加载的）」。 */
export type SelectionValue = ReadonlySet<Key> | "all";

export type SelectionMode = "none" | "single" | "multiple";

export interface SelectionState {
    readonly keys: SelectionValue;
    /** shift 区间选择的锚点（可见索引）。 */
    readonly anchorIndex: number | null;
}

/** 三态：半选是「派生状态」，永远不写进 checkedKeys。 */
export type CheckState = "checked" | "unchecked" | "indeterminate";
```

> 注意：`KeySet` 由 5.1 的 `src/structure/set/keySetOps.ts` 导出（这里为阅读顺序提前使用）；`SelectionValue` 只在此处声明一次。

### 4.4 虚拟化接口

```ts
export interface VirtualAdapterOptions {
    /** 估算行高；动态测量时建议取「较大值」，避免初始总高偏小导致滚动跳动。 */
    estimateSize: number | ((index: number) => number);
    /** 视口外多渲染的行数，默认 4。 */
    overscan?: number;
    paddingStart?: number;
    paddingEnd?: number;
}

export interface VirtualWindow {
    /** 渲染区间 [start, end)。 */
    readonly start: number;
    readonly end: number;
    /** start 之前的累计高度（用于 translate/占位）。 */
    readonly offsetTop: number;
    readonly totalSize: number;
}

export type VirtualAdapter<T> = ListAdapter<T> & {
    getTotalSize(): number;
    getWindow(scrollOffset: number, viewportSize: number): VirtualWindow;
    getItemOffset(index: number): number;
    setMeasuredSize(index: number, size: number): void;
    clearMeasurements(): void;
    scrollOffsetForIndex(index: number, options?: { align?: Alignment; viewportSize?: number }): number;
};
```

---

## 5. 工厂函数与核心实现

> 下面每块代码都已通过编译与行为断言。省略了部分注释与空行以压缩篇幅，逻辑与 8.1 的基准完全一致。

### 5.1 `src/structure/hash/hashKey.ts` + `src/structure/map/keyIndex.ts`

两个函数解决"**DOM 边界把 number 变 string**"这个高频 bug（React Aria 也专门写过这段 ✔）：

```ts
export function keyToText(key: Key): string {
    return String(key);
}

/**
 * 文本 -> Key（仅整数字面量）。用于「数据里是 number、事件里是 string」的兜底，
 * 通过 String(Number(text)) === text 排除 "01" / "1e3" 这类歧义写法。
 */
export function keyFromText(text: string): Key | null {
    if (text === "" || !/^-?\d+$/.test(text)) {
        return null;
    }
    const value = Number(text);
    if (!Number.isSafeInteger(value) || String(value) !== text) {
        return null;
    }
    return value;
}

export interface KeyIndex {
    readonly size: number;
    set(key: Key, index: number): void;
    get(key: Key): number;
    has(key: Key): boolean;
    clear(): void;
}

export function createKeyIndex(): KeyIndex {
    const byKey = new Map<Key, number>();

    return {
        get size(): number {
            return byKey.size;
        },
        set(key: Key, index: number): void {
            byKey.set(key, index);
        },
        get(key: Key): number {
            const direct = byKey.get(key);
            if (direct !== undefined) {
                return direct;
            }
            if (typeof key === "number") {
                return byKey.get(String(key)) ?? -1;
            }
            const numeric = keyFromText(key);
            return numeric === null ? -1 : (byKey.get(numeric) ?? -1);
        },
        has(key: Key): boolean {
            return this.get(key) !== -1;
        },
        clear(): void {
            byKey.clear();
        },
    };
}
```

> **性能备注**：最初实现同时维护 `Map<Key, number>` 与 `Map<string, number>` 两张表。基准显示 10 万行构建 40ms、内存翻倍；改成"精确匹配优先 + 单次数值兜底"后构建降到 **11ms**，`indexOf` 仍是 **0.05µs/次**。这是一个"用一次函数调用换一张表"的典型取舍。

配套的集合运算（`src/structure/set/keySetOps.ts`）：

```ts
export type KeySet = ReadonlySet<Key>;

export function addKey(set: KeySet, key: Key): Set<Key> {
    const next = new Set(set);
    next.add(key);
    return next;
}

export function removeKey(set: KeySet, key: Key): Set<Key> {
    if (!set.has(key)) {
        return set as Set<Key>;
    }
    const next = new Set(set);
    next.delete(key);
    return next;
}

export function toggleKey(set: KeySet, key: Key, force?: boolean): Set<Key> {
    const shouldAdd = force ?? !set.has(key);
    if (shouldAdd === set.has(key)) {
        return set as Set<Key>;
    }
    const next = new Set(set);
    if (shouldAdd) {
        next.add(key);
    } else {
        next.delete(key);
    }
    return next;
}

/** 把 'all' 物化为显式 key 集合（罕见路径，O(count)）。 */
export function materialize(value: KeySet | "all", getKey: (index: number) => Key, count: number): Set<Key> {
    if (value !== "all") {
        return new Set(value);
    }
    const all = new Set<Key>();
    for (let index = 0; index < count; index += 1) {
        all.add(getKey(index));
    }
    return all;
}
```

> 注意：`KeySet` 由 5.1 的 `src/structure/set/keySetOps.ts` 导出（这里为阅读顺序提前使用），落地时用 `import type` 引入；`SelectionValue` 只在此处声明一次。

### 5.2 `src/adapter/list/list/createListAdapter.ts`

```ts
export interface ListAdapterOptions<T> {
    /** 稳定 key 提取器。必须是纯函数且身份稳定（useCallback / 模块级）。 */
    getKey: (item: T, index: number) => Key;
    /** 开发期重复 key 告警回调（适配器不依赖 import.meta.env）。 */
    onDuplicateKey?: (key: Key, firstIndex: number, duplicateIndex: number) => void;
}

/**
 * 为「已经全量在内存里的数组」建适配器。
 * 复杂度：构建 O(n)，getCount/getKey/getItem/getItemByKey/indexOf 均 O(1)，getRange O(k)。
 */
export function createListAdapter<T>(items: readonly T[], options: ListAdapterOptions<T>): ListAdapter<T> {
    const { getKey, onDuplicateKey } = options;
    const keys: Key[] = new Array<Key>(items.length);
    const index = createKeyIndex();

    for (let i = 0; i < items.length; i += 1) {
        const item = items[i] as T;
        const key = getKey(item, i);
        keys[i] = key;
        index.set(key, i);
        if (onDuplicateKey !== undefined) {
            const existing = index.get(key);
            if (existing !== i && existing !== -1) {
                onDuplicateKey(key, existing, i);
            }
        }
    }

    return {
        version: 0,
        getCount: (): number => items.length,
        getKey: (i: number): Key => keys[i] as Key,
        getItem: (i: number): T | undefined => items[i],
        getItemByKey: (key: Key): T | undefined => {
            const at = index.get(key);
            return at === -1 ? undefined : items[at];
        },
        indexOf: (key: Key): number => index.get(key),
        getRange: (start: number, end: number): readonly T[] => items.slice(start, end),
        getLevel: (): number => 0,
        getParentKey: (): Key | null => null,
        isExpandable: (): boolean => false,
    };
}
```

**要点**

- `keys` 数组与 `items` 同长，`getKey(i)` 不做 Map 查询（省一次哈希），实测 0.01µs 级。
- `version: 0`：静态适配器永不"变更"，`useSyncExternalStore` 的 `getSnapshot` 恒定 → 不触发重渲染。
- `getKey` 的第二个参数 `index` 是"逃生口"（数据无 id 时用 `String(index)`），但**不推荐**：一旦顺序变化，选择态就错位（见 12.3）。

### 5.3 `src/adapter/list/level/createLevelAdapter.ts`（单层分组）

```ts
export interface LevelGroup<T> {
    key?: Key;
    /** 分组头数据（不参与元素索引）。 */
    header?: unknown;
    items: readonly T[];
}

export interface LevelAdapter<T> extends ListAdapter<T> {
    getGroupCount(): number;
    /** 元素 index -> 分组序号（0 基）；越界返回 -1。 */
    getGroupIndex(itemIndex: number): number;
    /** 分组序号 -> 元素区间 [start, end)。 */
    getGroupRange(groupIndex: number): readonly [number, number];
    getGroupHeader(groupIndex: number): unknown;
    getGroupKey(groupIndex: number): Key;
}

export function createLevelAdapter<T>(
    groups: readonly LevelGroup<T>[],
    options: ListAdapterOptions<T>,
): LevelAdapter<T> {
    const keys: Key[] = [];
    const items: T[] = [];
    const groupOf: number[] = [];
    const ranges: Array<[number, number]> = [];
    const headers: unknown[] = [];
    const groupKeys: Key[] = [];
    const index = createKeyIndex();

    for (let g = 0; g < groups.length; g += 1) {
        const group = groups[g] as LevelGroup<T>;
        const start = items.length;
        for (let i = 0; i < group.items.length; i += 1) {
            const item = group.items[i] as T;
            const key = options.getKey(item, items.length);
            keys.push(key);
            items.push(item);
            groupOf.push(g);
            index.set(key, items.length - 1);
        }
        ranges.push([start, items.length]);
        headers.push(group.header);
        groupKeys.push(group.key ?? `group-${g}`);
    }

    return {
        version: 0,
        getCount: (): number => items.length,
        getKey: (i: number): Key => keys[i] as Key,
        getItem: (i: number): T | undefined => items[i],
        getItemByKey: (key: Key): T | undefined => {
            const at = index.get(key);
            return at === -1 ? undefined : items[at];
        },
        indexOf: (key: Key): number => index.get(key),
        getRange: (start: number, end: number): readonly T[] => items.slice(start, end),
        getLevel: (): number => 0,
        getParentKey: (): Key | null => null,
        isExpandable: (): boolean => false,
        getGroupCount: (): number => ranges.length,
        getGroupIndex: (itemIndex: number): number => groupOf[itemIndex] ?? -1,
        getGroupRange: (groupIndex: number): readonly [number, number] => ranges[groupIndex] ?? [0, 0],
        getGroupHeader: (groupIndex: number): unknown => headers[groupIndex],
        getGroupKey: (groupIndex: number): Key => groupKeys[groupIndex] as Key,
    };
}
```

**为什么分组单独一层**：分组头是"行"但不是"元素"（不参与选择、不参与 `posInSet`、不被虚拟化当作数据行）。把 header 排除在 `getCount()` 之外，组件用 `getGroupIndex(i)` 判断"这一行上方要不要渲染色头"，粘性头（sticky header）也就有了 O(1) 的分组定位。这也是 `level` 与 `tree` 的分界：`level` 是**一层**分组，`tree` 是**任意层**且可展开。

### 5.4 `src/adapter/tree/adapter/createTreeAdapter.ts`

三段式：**建索引 → 扁平化 → 绑定展开集合**。

```ts
interface TreeIndex<T> {
    readonly entries: Map<Key, TreeNodeEntry<T>>;
    readonly roots: readonly Key[];
}

const EMPTY_KEYS: KeySet = new Set<Key>();

interface MutableEntry<T> {
    key: Key;
    item: T;
    parentKey: Key | null;
    level: number;
    childKeys: Key[];
    disabled: boolean;
    expandable: boolean;
}

/** DFS 建索引。O(n)。同时完成：父子关系、层级、重复 key 检测、环检测（重复即跳过）。 */
function buildTreeIndex<T>(roots: readonly T[], options: TreeAdapterOptions<T>): TreeIndex<T> {
    const entries = new Map<Key, TreeNodeEntry<T>>();
    const rootKeys: Key[] = [];
    const { getKey, getChildren, isExpandable, isDisabled, onDuplicateKey } = options;

    interface Frame {
        item: T;
        parentKey: Key | null;
        level: number;
    }

    const stack: Frame[] = [];
    for (let i = roots.length - 1; i >= 0; i -= 1) {
        stack.push({ item: roots[i] as T, parentKey: null, level: 0 });
    }

    while (stack.length > 0) {
        const frame = stack.pop() as Frame;
        const key = getKey(frame.item);
        if (entries.has(key)) {
            onDuplicateKey?.(key, "duplicate key, subtree skipped");
            continue;
        }
        const children = getChildren(frame.item) ?? [];
        const entry: MutableEntry<T> = {
            key,
            item: frame.item,
            parentKey: frame.parentKey,
            level: frame.level,
            childKeys: [],
            disabled: isDisabled?.(frame.item) ?? false,
            expandable: isExpandable?.(frame.item) ?? children.length > 0,
        };
        entries.set(key, entry as TreeNodeEntry<T>);
        if (frame.parentKey === null) {
            rootKeys.push(key);
        } else {
            const parent = entries.get(frame.parentKey) as MutableEntry<T> | undefined;
            parent?.childKeys.push(key);
        }
        for (let i = children.length - 1; i >= 0; i -= 1) {
            stack.push({ item: children[i] as T, parentKey: key, level: frame.level + 1 });
        }
    }

    return { entries, roots: rootKeys };
}

/** 展开态扁平化：显式栈 DFS 前序，O(visible)。逆序入栈 => 正序出栈。 */
function flattenIndex<T>(index: TreeIndex<T>, expandedKeys: KeySet): readonly VisibleNode<T>[] {
    const visible: VisibleNode<T>[] = [];

    interface Frame {
        key: Key;
        posInSet: number;
        setSize: number;
    }

    const stack: Frame[] = [];
    const rootKeys = index.roots;
    for (let i = rootKeys.length - 1; i >= 0; i -= 1) {
        stack.push({ key: rootKeys[i] as Key, posInSet: i + 1, setSize: rootKeys.length });
    }

    while (stack.length > 0) {
        const frame = stack.pop() as Frame;
        const entry = index.entries.get(frame.key);
        if (entry === undefined) {
            continue;
        }
        visible.push({
            key: frame.key,
            item: entry.item,
            index: visible.length,
            level: entry.level,
            parentKey: entry.parentKey,
            expandable: entry.expandable,
            expanded: expandedKeys.has(frame.key),
            posInSet: frame.posInSet,
            setSize: frame.setSize,
        });
        if (!expandedKeys.has(frame.key)) {
            continue;
        }
        for (let i = entry.childKeys.length - 1; i >= 0; i -= 1) {
            stack.push({ key: entry.childKeys[i] as Key, posInSet: i + 1, setSize: entry.childKeys.length });
        }
    }

    return visible;
}
```

绑定展开集合（`fromIndex`）的骨架：

```ts
function fromIndex<T>(index: TreeIndex<T>, expandedKeys: KeySet): TreeAdapter<T> {
    const visible = flattenIndex(index, expandedKeys);
    const keys: Key[] = new Array<Key>(visible.length);
    const items: T[] = new Array<T>(visible.length);
    const indexByKey = createKeyIndex();

    for (let i = 0; i < visible.length; i += 1) {
        const node = visible[i] as VisibleNode<T>;
        keys[i] = node.key;
        items[i] = node.item;
        indexByKey.set(node.key, i);
    }

    return {
        version: 0,
        expandedKeys,
        getCount: (): number => visible.length,
        getKey: (i: number): Key => keys[i] as Key,
        getItem: (i: number): T | undefined => items[i],
        getItemByKey: (key: Key): T | undefined => {
            const at = indexByKey.get(key);
            return at === -1 ? undefined : items[at];
        },
        indexOf: (key: Key): number => indexByKey.get(key),
        getRange: (start: number, end: number): readonly T[] => items.slice(start, end),
        getLevel: (i: number): number => visible[i]?.level ?? 0,
        getParentKey: (i: number): Key | null => visible[i]?.parentKey ?? null,
        isExpandable: (i: number): boolean => visible[i]?.expandable ?? false,
        getChildren: (key: Key): readonly Key[] => index.entries.get(key)?.childKeys ?? [],
        getParent: (key: Key): Key | null => index.entries.get(key)?.parentKey ?? null,
        getNode: (key: Key): TreeNodeEntry<T> | undefined => index.entries.get(key),
        getPath: (key: Key): readonly Key[] => {
            const path: Key[] = [];
            let current: Key | null = key;
            let guard = 0;
            while (current !== null && guard < 10_000) {
                path.push(current);
                current = index.entries.get(current)?.parentKey ?? null;
                guard += 1;
            }
            return path.reverse();
        },
        flatten: (next?: KeySet): readonly VisibleNode<T>[] =>
            next === undefined || next === expandedKeys ? visible : flattenIndex(index, next),
        getVisibleCount: (next?: KeySet): number =>
            next === undefined || next === expandedKeys ? visible.length : flattenIndex(index, next).length,
        withExpanded: (next: KeySet): TreeAdapter<T> => fromIndex(index, next),
        normalizeExpanded: (next: KeySet): KeySet => {
            let changed = false;
            const kept = new Set<Key>();
            for (const key of next) {
                if (index.entries.has(key)) {
                    kept.add(key);
                } else {
                    changed = true;
                }
            }
            return changed ? kept : next;
        },
    };
}

/** 由嵌套数据建树索引，并绑定一个展开集合。复杂度：建索引 O(n)，flatten O(visible)。 */
export function createTreeAdapter<T>(roots: readonly T[], options: TreeAdapterOptions<T>): TreeAdapter<T> {
    return fromIndex(buildTreeIndex(roots, options), options.expandedKeys ?? EMPTY_KEYS);
}
```

**必须知道的实现细节**

| 细节                                   | 原因                                                            |
| -------------------------------------- | --------------------------------------------------------------- |
| 全用**显式栈**，不用递归               | 10 万节点的退化链（深度 1 万）会爆调用栈；显式栈 + `guard` 兜底 |
| 建索引时 `entries.has(key)` 即跳过     | 同时解决**重复 key**与**数据成环**两件事，避免无限循环          |
| `visible` 里的 `index` 就是数组下标    | 渲染时不需要再算，`getKey(i)` 直接读                            |
| `withExpanded` 只重跑 `flattenIndex`   | 索引（父子、层级）复用；实测 1 万可见的重新扁平化 **0.77ms/次** |
| `normalizeExpanded` 无变化时返回原对象 | 引用稳定 → `useMemo`/`memo` 不失效                              |
| `getPath` 有 `guard` 上限              | 数据成环时也不会死循环                                          |

**已知代价（必须写进验收）**：`flatten` 每次展开/折叠是 O(visible) 的全量重建。10 万节点**全部展开**时每次 2.85ms（实测）。因此：

- 展开态变化不频繁（用户点击）时完全可接受；
- 若要做"全部展开 10 万节点 + 逐项勾选"这种场景，应改用**增量扁平化**（记录每个节点的可见区间，展开时只 splice 一段）——本报告不给增量实现，列为 10.5 的后续项（⚠ 推断收益：从 O(visible) 降到 O(插入子树)）。

### 5.5 `src/adapter/list/virtual/createVirtualAdapter.ts`

纯数学，不碰 DOM：

```ts
export function createVirtualAdapter<T>(base: ListAdapter<T>, options: VirtualAdapterOptions): VirtualAdapter<T> {
    const estimate: (index: number) => number =
        typeof options.estimateSize === "function" ? options.estimateSize : () => options.estimateSize as number;
    const overscan = Math.max(0, options.overscan ?? 4);
    const paddingStart = Math.max(0, options.paddingStart ?? 0);
    const paddingEnd = Math.max(0, options.paddingEnd ?? 0);

    let count = -1;
    let sizes = new Float64Array(0);
    let starts = new Float64Array(1);
    let dirtyFrom = 0;

    /** 只在 count 变化时重建数组，不做前缀和计算。O(1) 摊还。 */
    const syncCount = (): void => {
        const next = base.getCount();
        if (next === count) {
            return;
        }
        const nextSizes = new Float64Array(next);
        for (let i = 0; i < next; i += 1) {
            nextSizes[i] = i < sizes.length ? (sizes[i] as number) : estimate(i);
        }
        sizes = nextSizes;
        starts = new Float64Array(next + 1);
        count = next;
        dirtyFrom = 0;
    };

    /** 从 dirtyFrom 起重算前缀和；一次批量测量只付一次 O(n)。 */
    const ensureOffsets = (): void => {
        syncCount();
        if (dirtyFrom === 0) {
            starts[0] = paddingStart;
        }
        for (let i = dirtyFrom; i < count; i += 1) {
            starts[i + 1] = (starts[i] as number) + (sizes[i] as number);
        }
        dirtyFrom = count;
    };

    const getItemOffset = (index: number): number => {
        ensureOffsets();
        if (count === 0) {
            return paddingStart;
        }
        const clamped = Math.min(Math.max(index, 0), count - 1);
        return starts[clamped] as number;
    };

    const getWindow = (scrollOffset: number, viewportSize: number): VirtualWindow => {
        ensureOffsets();
        if (count === 0) {
            return { start: 0, end: 0, offsetTop: paddingStart, totalSize: paddingStart + paddingEnd };
        }
        // 二分：最后一个 starts[i] <= top
        const top = Math.max(0, scrollOffset - paddingStart);
        let low = 0;
        let high = count - 1;
        while (low < high) {
            const mid = (low + high + 1) >> 1;
            if ((starts[mid] as number) <= top) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }
        const bottom = top + Math.max(0, viewportSize);
        let last = low;
        while (last < count && (starts[last] as number) < bottom) {
            last += 1;
        }
        const start = Math.max(0, low - overscan);
        const end = Math.min(count, last + overscan);
        return { start, end, offsetTop: starts[start] as number, totalSize: (starts[count] as number) + paddingEnd };
    };

    return {
        ...base,
        get version(): number {
            return base.version;
        },
        getTotalSize: (): number => {
            ensureOffsets();
            return (starts[count] as number) + paddingEnd;
        },
        getWindow,
        getItemOffset,
        setMeasuredSize: (index: number, size: number): void => {
            // 关键：只登记 dirty，不在每次测量时重算前缀和（否则 n 次测量 = O(n²)）
            syncCount();
            if (index < 0 || index >= count) {
                return;
            }
            const next = Math.max(0, size);
            if (sizes[index] === next) {
                return;
            }
            sizes[index] = next;
            dirtyFrom = Math.min(dirtyFrom, index);
        },
        clearMeasurements: (): void => {
            sizes = new Float64Array(0);
            starts = new Float64Array(1);
            count = -1;
            dirtyFrom = 0;
        },
        scrollOffsetForIndex: (index: number, scrollOptions?: { align?: Alignment; viewportSize?: number }): number => {
            ensureOffsets();
            if (count === 0) {
                return 0;
            }
            const clamped = Math.min(Math.max(index, 0), count - 1);
            const itemStart = (starts[clamped] as number) - paddingStart;
            const itemSize = sizes[clamped] as number;
            const viewport = Math.max(0, scrollOptions?.viewportSize ?? 0);
            const align = scrollOptions?.align ?? "start";
            let offset = itemStart;
            if (viewport > 0) {
                if (align === "center") {
                    offset = itemStart - (viewport - itemSize) / 2;
                } else if (align === "end") {
                    offset = itemStart + itemSize - viewport;
                }
            }
            return Math.max(0, offset);
        },
    };
}
```

**这份实现里有两个"如果用错就会慢 1000 倍"的点**（都是基准实测出来的）：

1. `setMeasuredSize` **不能**先 `ensureOffsets()`。第一版这么写，1 万次测量 = 1886ms（每次 O(n) 重算）；改成"只标脏 + 下次取窗口时一次性重算"后 → **0.87ms**。
2. `getWindow` 用**二分找起点**，不要线性扫描。1e6 次 `getWindow` 实测 114ms（0.11µs/次），线性版在 10 万行、滚动到尾部时单次就要 10 万次迭代。

**与 TanStack Virtual 的对应关系**：`estimateSize` ↔ 同名；`overscan` ↔ 同名（默认我们取 4，它取 1）；`getItemKey` ↔ `base.getKey`；`measureElement` ↔ 组件的 `ResizeObserver` 调 `setMeasuredSize`；`scrollToIndex` ↔ `scrollOffsetForIndex`（我们只算偏移，真正 `scrollTo` 在组件里）。见 [Virtualizer API](https://tanstack.com/virtual/latest/docs/api/virtualizer.md) ✔。

## 6. 选择与勾选策略

### 6.1 `src/adapter/tree/select/createSelection.ts`（选择是纯函数）

```ts
export interface SelectionOptions {
    mode: SelectionMode;
    getKey(index: number): Key;
    getCount?(): number;
    disallowEmpty?: boolean;
}

export interface SelectIntent {
    /** 点击/空格切换；否则为替换选择。 */
    toggle?: boolean;
    /** shift 区间选择。 */
    range?: boolean;
}

export interface SelectionController {
    isSelected(state: SelectionState, key: Key): boolean;
    getSelectedCount(state: SelectionState): number;
    /** 用于表头复选框的三态判定。 */
    getSelectionState(state: SelectionState, start: number, end: number): "all" | "some" | "none";
    select(state: SelectionState, index: number, intent?: SelectIntent): SelectionState;
    selectAll(state: SelectionState): SelectionState;
    clear(state: SelectionState): SelectionState;
    /** 数据刷新后修剪悬空 key。 */
    normalize(state: SelectionState, exists: (key: Key) => boolean): SelectionState;
}

/**
 * 选择策略（纯函数，不持有状态）。
 * 约定：keys 为 'all' 时表示全量（含未加载），getSelectedCount 依赖 getCount 才可精确。
 */
export function createSelection(options: SelectionOptions): SelectionController {
    const { mode, getKey, getCount, disallowEmpty = false } = options;

    const materializeLocal = (value: SelectionValue): Set<Key> => {
        if (value !== "all") {
            return new Set(value);
        }
        const total = getCount?.() ?? 0;
        const all = new Set<Key>();
        for (let i = 0; i < total; i += 1) {
            all.add(getKey(i));
        }
        return all;
    };

    const isSelected = (state: SelectionState, key: Key): boolean =>
        state.keys === "all" ? true : state.keys.has(key);

    const select = (state: SelectionState, index: number, intent?: SelectIntent): SelectionState => {
        if (mode === "none") {
            return state;
        }
        const key = getKey(index);
        const toggle = intent?.toggle ?? false;
        const range = intent?.range ?? false;

        if (mode === "single") {
            const already = isSelected(state, key);
            if (toggle && already) {
                return disallowEmpty ? state : { keys: new Set<Key>(), anchorIndex: index };
            }
            return { keys: new Set<Key>([key]), anchorIndex: index };
        }

        // shift 区间：从锚点到目标闭区间，锚点不移动（这样连续 shift 可以扩/缩范围）
        if (range && state.anchorIndex !== null) {
            const from = Math.min(state.anchorIndex, index);
            const to = Math.max(state.anchorIndex, index);
            const next = materializeLocal(state.keys);
            for (let i = from; i <= to; i += 1) {
                next.add(getKey(i));
            }
            return { keys: next, anchorIndex: state.anchorIndex };
        }

        const current = materializeLocal(state.keys);
        if (toggle) {
            if (current.has(key)) {
                current.delete(key);
            } else {
                current.add(key);
            }
        } else {
            current.clear();
            current.add(key);
        }
        if (current.size === 0 && disallowEmpty) {
            return state;
        }
        return { keys: current, anchorIndex: index };
    };

    return {
        isSelected,
        getSelectedCount: (state: SelectionState): number =>
            state.keys === "all" ? (getCount?.() ?? Number.POSITIVE_INFINITY) : state.keys.size,
        getSelectionState: (state: SelectionState, start: number, end: number): "all" | "some" | "none" => {
            if (mode === "none" || end <= start) {
                return "none";
            }
            if (state.keys === "all") {
                return "all";
            }
            let selected = 0;
            let total = 0;
            for (let i = start; i < end; i += 1) {
                total += 1;
                if (state.keys.has(getKey(i))) {
                    selected += 1;
                }
            }
            if (selected === 0) {
                return "none";
            }
            return selected === total ? "all" : "some";
        },
        select,
        selectAll: (state: SelectionState): SelectionState =>
            mode === "multiple" ? { keys: "all", anchorIndex: state.anchorIndex } : state,
        clear: (state: SelectionState): SelectionState =>
            disallowEmpty ? state : { keys: new Set<Key>(), anchorIndex: state.anchorIndex },
        normalize: (state: SelectionState, exists: (key: Key) => boolean): SelectionState => {
            if (state.keys === "all") {
                return state;
            }
            let changed = false;
            const kept = new Set<Key>();
            for (const key of state.keys) {
                if (exists(key)) {
                    kept.add(key);
                } else {
                    changed = true;
                }
            }
            return changed ? { keys: kept, anchorIndex: state.anchorIndex } : state;
        },
    };
}
```

### 6.2 选择模型的 8 个决策

| #   | 决策                             | 理由 / 代价                                                                                                                            |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Set` 而不是 `Map<Key, true>`    | 选择只需要"在不在"，Set 语义即所需；Map 的 value 会诱使大家塞数据（数据应在 adapter 里）                                               |
| 2   | `Set \| 'all'` 双形态            | 全选若用遍历物化，10 万行要 10 万次插入；跨页全选在远程分页下**根本无法物化**（React Aria ✔、MUI include/exclude ◐ 同一洞察）          |
| 3   | `anchorIndex` 存**索引**不是 key | shift 区间本质是"可见序列上的区间"；存 key 还要再 `indexOf` 一次。代价：数据插入/折叠后锚点可能失效，需在数据变更时置 `null`（见 7.6） |
| 4   | 返回新 Set（不可变）             | 便于 `memo`/`useSyncExternalStore` 比较引用；代价是每次 O(n) 复制（8.2 有实测）                                                        |
| 5   | 区间选择 O(k)（k=区间长度）      | 连续 shift 会反复扩区间，最坏 O(n²)（⚠ 推断）；可加"只保留最近一次区间"的优化，但会破坏"多次 shift 累积"的直觉，暂不做                 |
| 6   | 受控只上报不回写                 | 与 React Aria 一致；双写会导致父子状态漂移（12.7）                                                                                     |
| 7   | `normalize` 负责剪枝，组件不负责 | 数据变更点（fetch 完成、删除、过滤）比渲染点更适合做一次 O(n) 剪枝；渲染期剪枝是副作用                                                 |
| 8   | 三态判定按**当前可见窗口**       | 表头复选框应显示"当前页/当前筛选结果"的全选态；若要跨页全选，需同时展示 `all` 语义的提示（否则用户以为只选了本页）                     |

### 6.3 `src/adapter/tree/check/createCheckState.ts`（级联勾选）

```ts
export interface CheckOptions {
    getChildren(key: Key): readonly Key[];
    getParent(key: Key): Key | null;
    isDisabled?(key: Key): boolean;
    /** 父子不联动（等价 antd 的 checkStrictly）。 */
    strict?: boolean;
    /** 根集合，供 selectAll / normalize 使用。 */
    getRoots?(): readonly Key[];
}

export interface CheckController {
    getState(key: Key, checked: KeySet): CheckState;
    setChecked(key: Key, checked: KeySet, next?: boolean): Set<Key>;
    selectAll(checked: KeySet, next: boolean): Set<Key>;
    /** 受控入口规范化：父被勾选则补全整棵子树、子全选则补父、剔除悬空 key。 */
    normalize(checked: KeySet): Set<Key>;
}

export function createCheckState(options: CheckOptions): CheckController {
    const { getChildren, getParent, isDisabled, strict = false, getRoots } = options;
    const disabledOf = (key: Key): boolean => isDisabled?.(key) ?? false;
    const checkableChildren = (key: Key): readonly Key[] => getChildren(key).filter((child) => !disabledOf(child));

    // 以 checked 集合对象为弱引用键做缓存：集合变了缓存自然失效
    const stateCache = new WeakMap<KeySet, Map<Key, CheckState>>();

    const cacheFor = (checked: KeySet): Map<Key, CheckState> => {
        let cache = stateCache.get(checked);
        if (cache === undefined) {
            cache = new Map<Key, CheckState>();
            stateCache.set(checked, cache);
        }
        return cache;
    };

    /** 迭代后序遍历子树，O(subtree)；遍历过的节点全部进缓存，后续调用 O(1)。 */
    const computeState = (root: Key, checked: KeySet): CheckState => {
        const cache = cacheFor(checked);
        const cached = cache.get(root);
        if (cached !== undefined) {
            return cached;
        }

        interface Frame {
            key: Key;
            childIndex: number;
            children: readonly Key[];
            childStates: CheckState[];
        }

        const stack: Frame[] = [{ key: root, childIndex: 0, children: checkableChildren(root), childStates: [] }];

        while (stack.length > 0) {
            const frame = stack[stack.length - 1] as Frame;
            // 已勾选节点按不变式其子树全选，直接短路
            if (checked.has(frame.key) || frame.children.length === 0) {
                const state: CheckState = checked.has(frame.key) ? "checked" : "unchecked";
                cache.set(frame.key, state);
                stack.pop();
                const parent = stack[stack.length - 1];
                if (parent !== undefined) {
                    parent.childStates.push(state);
                }
                continue;
            }
            if (frame.childIndex < frame.children.length) {
                const childKey = frame.children[frame.childIndex] as Key;
                frame.childIndex += 1;
                const childCached = cache.get(childKey);
                if (childCached !== undefined) {
                    frame.childStates.push(childCached);
                } else {
                    stack.push({
                        key: childKey,
                        childIndex: 0,
                        children: checkableChildren(childKey),
                        childStates: [],
                    });
                }
                continue;
            }
            let state: CheckState = "unchecked";
            if (frame.childStates.every((child) => child === "checked")) {
                state = "checked";
            } else if (frame.childStates.some((child) => child !== "unchecked")) {
                state = "indeterminate";
            }
            cache.set(frame.key, state);
            stack.pop();
            const parent = stack[stack.length - 1];
            if (parent !== undefined) {
                parent.childStates.push(state);
            }
        }

        return cache.get(root) ?? "unchecked";
    };

    const getState = (key: Key, checked: KeySet): CheckState => {
        if (strict) {
            return checked.has(key) ? "checked" : "unchecked";
        }
        return computeState(key, checked);
    };

    const setChecked = (key: Key, checked: KeySet, next?: boolean): Set<Key> => {
        const target = next ?? !checked.has(key);
        const result = new Set<Key>(checked);

        // 1) 向下：整棵子树（跳过 disabled 子孙）
        const stack: Key[] = [key];
        while (stack.length > 0) {
            const current = stack.pop() as Key;
            if (current !== key && disabledOf(current)) {
                continue;
            }
            if (target) {
                result.add(current);
            } else {
                result.delete(current);
            }
            for (const child of getChildren(current)) {
                stack.push(child);
            }
        }
        if (strict) {
            return result;
        }

        // 2) 向上：按「可勾选直接子节点」归纳；disabled 父节点阻断传导
        let parent = getParent(key);
        while (parent !== null && !disabledOf(parent)) {
            const siblings = checkableChildren(parent);
            if (siblings.length === 0) {
                break;
            }
            // 提前退出：一旦同时出现勾选与未勾选即为半选，无需扫完整个分组
            let checkedCount = 0;
            let uncheckedCount = 0;
            for (const sibling of siblings) {
                if (result.has(sibling)) {
                    checkedCount += 1;
                    if (uncheckedCount > 0) {
                        break;
                    }
                } else {
                    uncheckedCount += 1;
                    if (checkedCount > 0) {
                        break;
                    }
                }
            }
            if (uncheckedCount === 0) {
                result.add(parent);
            } else {
                result.delete(parent);
            }
            parent = getParent(parent);
        }
        return result;
    };

    const normalize = (checked: KeySet): Set<Key> => {
        if (getRoots === undefined) {
            return new Set<Key>(checked);
        }
        // 1) 结构序（父先于子）：DFS 前序
        const order: Key[] = [];
        const stack: Key[] = [];
        for (const root of getRoots()) {
            stack.push(root);
        }
        while (stack.length > 0) {
            const key = stack.pop() as Key;
            order.push(key);
            for (const child of getChildren(key)) {
                stack.push(child);
            }
        }
        // 2) 向下补全：父被勾选 => 子树全部勾选
        const result = new Set<Key>();
        const forced = new Set<Key>();
        for (const key of order) {
            const parent = getParent(key);
            const inherited = parent !== null && forced.has(parent);
            if (!checked.has(key) && !inherited) {
                continue;
            }
            result.add(key);
            forced.add(key);
        }
        // 3) 向上归纳：可勾选子节点全选 => 父节点全选
        for (let i = order.length - 1; i >= 0; i -= 1) {
            const key = order[i] as Key;
            if (disabledOf(key)) {
                continue;
            }
            const children = checkableChildren(key);
            if (children.length === 0) {
                continue;
            }
            if (children.every((child) => result.has(child))) {
                result.add(key);
            }
        }
        return result;
    };

    return {
        getState,
        setChecked,
        selectAll: (checked: KeySet, next: boolean): Set<Key> => {
            const result = new Set<Key>(next ? checked : []);
            if (!next) {
                return result;
            }
            const stack: Key[] = [...(getRoots?.() ?? [])];
            while (stack.length > 0) {
                const key = stack.pop() as Key;
                if (disabledOf(key)) {
                    continue;
                }
                result.add(key);
                for (const child of getChildren(key)) {
                    stack.push(child);
                }
            }
            return result;
        },
        normalize,
    };
}
```

### 6.4 级联规则（写进组件文档的"合同"）

| 规则             | 行为                                                                  | 来源                                 |
| ---------------- | --------------------------------------------------------------------- | ------------------------------------ |
| R1 向下强制      | 勾选父 → 全部**非 disabled** 子孙进入 `checked`                       | Ant `checkedKeys` 说明 ✔             |
| R2 向上归纳      | 可勾选子节点**全选** → 父进入 `checked`；否则父移出                   | Ant ✔                                |
| R3 半选派生      | 父不在 `checked` 但存在已勾选后代 → `indeterminate`；**永不写入集合** | Ant `halfCheckedKeys` ✔              |
| R4 disabled 阻断 | 勾父不影响 disabled 子；disabled 父不被子节点改写                     | Ant FAQ ✔                            |
| R5 checkStrictly | `strict: true` 时父子完全独立，`getState` 退化为二态                  | Ant `checkStrictly` ✔                |
| R6 边界规范化    | 外部传入的 `checked` 先过 `normalize`（补全 + 归纳 + 剪枝）           | 本项目约定，防止"父被写入但子未写入" |
| R7 全选          | `selectAll` 只加"非 disabled"节点                                     | 与 R1 一致                           |

**`normalize` 为什么必要**：受控使用方常常只传 `["parent-1"]` 表示"整组选中"（Ant 允许这种写法 ✔）。如果直接拿它算 `getState`，`getState("parent-1")` 因为 `checked.has` 短路返回 `checked`，但子节点全显示未勾选——UI 自相矛盾。`normalize` 在入口把语义补全，后续所有计算都基于"祖先闭合"的集合。

### 6.5 五个高频 bug（都能用上面的接口规避）

| #   | 症状                                             | 根因                                 | 对策                                                                                                    |
| --- | ------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| B1  | 折叠父节点后，子节点勾选状态"消失"               | 用**可见节点**做传导/判断            | 传导一律走 `getChildren`（结构全集），与展开态无关                                                      |
| B2  | 过滤搜索后父节点显示半选/全选错乱                | 同上：拿过滤后的集合当子树           | 同上；过滤只影响渲染，不影响 `check` 的图                                                               |
| B3  | 数字 id 数据，勾选后 `checked.has("1")` 为 false | DOM 回传 string，数据里是 number     | `KeyIndex` 数值兜底（5.1）；事件层统一 `String(key)` 再交给 adapter                                     |
| B4  | 异步加载子节点后，父节点从"全选"变"半选"         | 父被提前写成 checked，新子节点未纳入 | 子节点加载完成后调用 `normalize(checked)`；或加载前把父标为 `expandable` 但**不**可勾选（`isDisabled`） |
| B5  | 删除一行后，祖先永远半选                         | `checked` 里残留悬空 key             | 数据变更时 `normalize` / `selection.normalize`（React Aria 的 `useListData` 就是这个职责 ✔）            |

---

## 7. 受控/非受控与 React 集成

### 7.1 要不要 `useSyncExternalStore`？

| 数据源形态                  | 需要？                              | 用法                                                                              |
| --------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| 内存数组，父组件 state 驱动 | **不需要**                          | `useMemo(() => createListAdapter(items, { getKey }), [items])`                    |
| 内存树，展开态在组件里      | **不需要**（但需要 `withExpanded`） | `useMemo(() => tree.withExpanded(expandedKeys), [tree, expandedKeys])`            |
| 远程分页 / 无限滚动         | **需要**                            | adapter 内部维护 `version`，`ensureRange` 拉取后 `version++` 并 `notify()`        |
| 异步子树（tree lazy load）  | **需要**                            | 同上；加载完成后对 `checked`/`expanded` 做 `normalize`                            |
| 虚拟化测量缓存              | 通常**不需要**                      | 测量写回后由组件本地 state 触发重渲染即可；只有"测量结果要跨组件共享"才需要 store |

判据：**数据是否可能在 React 的渲染周期之外变化**。是 → store + `useSyncExternalStore`；否 → 纯函数 + `useMemo`。

⚠ 注意 `useSyncExternalStore` 的两个硬性要求（[React 文档](https://react.dev/reference/react/useSyncExternalStore) ◐）：`subscribe` 必须稳定（否则每次渲染重订阅）；`getSnapshot` 必须返回**缓存值**（每次返回新对象会无限重渲染）。这也是我们让 `getSnapshot` 返回 `number` 而不是 adapter 的原因。

### 7.2 adapter 的稳定性：三条规则

1. **在"数据所有者"那里创建 adapter**，不要在叶子组件里创建。父组件 `useMemo` 一次，子组件通过 props 收到同一个引用。
2. **`getKey`/`getChildren` 必须模块级或 `useCallback`**。它们是 adapter 工厂的依赖；内联箭头函数会让 `useMemo` 每次失效。
3. **不要依赖 React Compiler 修正身份**。项目装了 `babel-plugin-react-compiler`，但编译器的 memo 是**性能优化而非语义保证**（React 对 `useMemo` 的定位同理 ◐）；adapter 身份不稳定时，`memo` 子组件与 `useSyncExternalStore` 的行为都不可预期。显式 `useMemo` 更可预测。

反面教材（每次渲染都新建，导致整棵子树 memo 失效）：

```tsx
// ❌ 每次渲染新对象 + 新函数
<Listbox adapter={createListAdapter(items, { getKey: (item) => item.id })} />;

// ✅ 工厂与 getter 都稳定
const getKey = useCallback((item: Item) => item.id, []);
const adapter = useMemo(() => createListAdapter(items, { getKey }), [items, getKey]);
<Listbox adapter={adapter} />;
```

### 7.3 `src/adapter/list/adapter/useAdapterVersion.ts`

```ts
export interface AdapterStore {
    readonly version?: number;
    subscribe?(listener: () => void): () => void;
}

const noop = (): void => {
    /* 不需要订阅的静态 adapter */
};

export function useAdapterVersion(adapter: AdapterStore): number {
    const subscribe = useCallback(
        (onStoreChange: () => void): (() => void) => adapter.subscribe?.(onStoreChange) ?? noop,
        [adapter],
    );
    const getSnapshot = useCallback((): number => adapter.version ?? 0, [adapter]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

组件里这样用：`const version = useAdapterVersion(adapter);` 然后把 `version` 放进渲染依赖（或用它触发一次 `useState` 自增）。**只返回 number** 是为了满足"快照必须稳定"的约束。

### 7.4 受控集合与展开

```ts
interface ControlledSetResult {
    value: KeySet;
    setValue: (next: KeySet) => void;
}

/**
 * 受控集合的最小实现。
 * 若 `src/component/foundation/useControllableState.ts` 已存在（当前仓库已有，且支持
 * 值/函数式更新 `Updater<T>`），请基于它实现本函数，不要重复造受控逻辑：
 *   const [value, setValue] = useControllableState<KeySet>({ value: controlled, defaultValue, onChange });
 */
function useControlledSet(
    controlled: KeySet | undefined,
    defaultValue: KeySet,
    onChange?: (next: Set<Key>) => void,
): ControlledSetResult {
    const [internal, setInternal] = useState<KeySet>(defaultValue);
    const isControlled = controlled !== undefined;
    const value = isControlled ? controlled : internal;

    const setValue = useCallback(
        (next: KeySet): void => {
            if (!isControlled) {
                setInternal(next);
            }
            onChange?.(new Set(next));
        },
        [isControlled, onChange],
    );

    return { value, setValue };
}

export interface UseExpandedKeysOptions {
    expandedKeys?: KeySet;
    defaultExpandedKeys?: KeySet;
    onExpandedChange?: (next: Set<Key>) => void;
}

export interface UseExpandedKeysResult {
    expandedKeys: KeySet;
    setExpandedKeys: (next: KeySet) => void;
    expand: (key: Key) => void;
    collapse: (key: Key) => void;
    toggle: (key: Key) => void;
    /** 展开某个 key 的所有祖先（受控选择定位、搜索命中时用）。 */
    expandPath: (path: readonly Key[]) => void;
}

const EMPTY_EXPANDED: KeySet = new Set<Key>();

export function useExpandedKeys(options: UseExpandedKeysOptions): UseExpandedKeysResult {
    const { value, setValue } = useControlledSet(
        options.expandedKeys,
        options.defaultExpandedKeys ?? EMPTY_EXPANDED,
        options.onExpandedChange,
    );

    const toggle = useCallback(
        (key: Key): void => {
            const next = new Set(value);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            setValue(next);
        },
        [value, setValue],
    );

    return {
        expandedKeys: value,
        setExpandedKeys: setValue,
        expand: (key: Key): void => {
            if (value.has(key)) {
                return;
            }
            const next = new Set(value);
            next.add(key);
            setValue(next);
        },
        collapse: (key: Key): void => {
            if (!value.has(key)) {
                return;
            }
            const next = new Set(value);
            next.delete(key);
            setValue(next);
        },
        toggle,
        expandPath: (path: readonly Key[]): void => {
            let changed = false;
            const next = new Set(value);
            for (const key of path) {
                if (!next.has(key)) {
                    next.add(key);
                    changed = true;
                }
            }
            if (changed) {
                setValue(next);
            }
        },
    };
}
```

> 完整实现见本报告配套代码块（`expand/collapse/toggle/expandPath` 都是"复制 Set + 增删 + setValue"的薄封装）。`expandPath` 的价值：树里"选中某个深层节点"时，受控方通常只给 `selectedKey`，组件必须自己把祖先展开——这正是 Ant `Tree.useTree().getPath(key)` 的用途 ✔。

### 7.5 `useSelection`：锚点必须留在内部

```ts
export interface UseSelectionOptions {
    mode: SelectionMode;
    getCount: () => number;
    getKey: (index: number) => Key;
    selectedKeys?: SelectionValue;
    defaultSelectedKeys?: SelectionValue;
    onSelectionChange?: (next: SelectionValue) => void;
    disallowEmpty?: boolean;
}

export interface UseSelectionResult {
    state: SelectionState;
    controller: SelectionController;
    select: (index: number, intent?: { toggle?: boolean; range?: boolean }) => void;
    selectAll: () => void;
    clear: () => void;
    isSelected: (key: Key) => boolean;
}

export function useSelection(options: UseSelectionOptions): UseSelectionResult {
    const { mode, getKey, getCount, disallowEmpty = false, onSelectionChange } = options;
    const controller = useMemo(
        () => createSelection({ mode, getKey, getCount, disallowEmpty }),
        [mode, getKey, getCount, disallowEmpty],
    );

    const [internalKeys, setInternalKeys] = useState<SelectionValue>(options.defaultSelectedKeys ?? new Set<Key>());
    const [anchorIndex, setAnchorIndex] = useState<number | null>(null);
    const isControlled = options.selectedKeys !== undefined;
    const keys = isControlled ? (options.selectedKeys as SelectionValue) : internalKeys;
    const state: SelectionState = { keys, anchorIndex };

    const commit = useCallback(
        (next: SelectionState): void => {
            setAnchorIndex(next.anchorIndex);
            if (next.keys === keys) {
                return;
            }
            if (!isControlled) {
                setInternalKeys(next.keys);
            }
            onSelectionChange?.(next.keys);
        },
        [isControlled, keys, onSelectionChange],
    );

    return {
        state,
        controller,
        select: (index: number, intent?: { toggle?: boolean; range?: boolean }): void => {
            commit(controller.select(state, index, intent));
        },
        selectAll: (): void => {
            commit(controller.selectAll(state));
        },
        clear: (): void => {
            commit(controller.clear(state));
        },
        isSelected: (key: Key): boolean => controller.isSelected(state, key),
    };
}
```

**为什么 `anchorIndex` 不进受控 prop**：受控方通常只关心"选了哪些"，如果把锚点也做成受控，调用方每次 shift 都要回写两个值，而 `anchorIndex` 是**交互中间态**，泄露到受控 API 只会增加使用成本。代价：受控模式下父组件重置 `selectedKeys` 时锚点仍在，可能产生"重置后 shift 从旧锚点开始"的意外（⚠ 推断）。缓解：检测到 `selectedKeys` 在非本组件操作下变化时把锚点置 `null`（可用 `usePrevious` 比较）。

### 7.6 数据刷新时的 key 保持与状态修剪

| 场景                       | 必须做                                                                      | 不能做                                        |
| -------------------------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| 列表重排（排序/过滤）      | 选择/展开按 `Key` 自动跟随；`getKey` 不变                                   | 用 index 作 key（状态会"跟着位置走"）         |
| 删除行                     | `selection.normalize(state, exists)`；`expandedKeys` 用 `normalizeExpanded` | 在 render 里过滤（副作用 + 每次新 Set）       |
| 远程追加                   | adapter `version++`；`anchorIndex` 保持（同一次会话内的 shift 仍有效）      | 重建 adapter 时丢掉 `version`                 |
| 切换数据源（如换筛选条件） | 重置 selection 与 expanded（或至少重置 anchor）                             | 保留旧 key 隐式匹配新数据（会出现"幽灵选中"） |
| 树 lazy load 完成          | 对 `checked` 调 `normalize`；对新子树展开状态按需设置                       | 假设父节点状态自动正确                        |

### 7.7 组件侧接入示意（Listbox + 虚拟化 + a11y）

```tsx
function Listbox<T>({ adapter, label }: { adapter: VirtualAdapter<T>; label: string }) {
    const version = useAdapterVersion(adapter);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [viewport, setViewport] = useState({ height: 0, scrollTop: 0 });

    // DOM 相关全部留在组件：ResizeObserver 负责"测窗口"，scroll 负责"测偏移"
    useEffect(() => {
        const element = scrollRef.current;
        if (element === null) {
            return;
        }
        const observer = new ResizeObserver(() => {
            setViewport((prev) => ({ ...prev, height: element.clientHeight }));
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const window = adapter.getWindow(viewport.scrollTop, viewport.height);
    const count = adapter.getCount();

    return (
        <div
            ref={scrollRef}
            role="listbox"
            aria-label={label}
            tabIndex={0}
            onScroll={(event) => setViewport((prev) => ({ ...prev, scrollTop: event.currentTarget.scrollTop }))}
            style={{ overflowY: "auto", height: 320, position: "relative" }}
        >
            <div style={{ height: window.totalSize, position: "relative" }}>
                <div style={{ transform: `translateY(${window.offsetTop}px)` }}>
                    {Array.from({ length: window.end - window.start }, (_, offset) => {
                        const index = window.start + offset;
                        return (
                            <div
                                key={adapter.getKey(index)}
                                role="option"
                                aria-selected={false}
                                aria-posinset={index + 1}
                                aria-setsize={count}
                                data-index={index}
                            >
                                {String(adapter.getItem(index))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
```

> 注意 `aria-posinset` / `aria-setsize` 是虚拟列表的**必需项**（见 9.2）；`data-index` 是给 `ResizeObserver` 回写测量用的锚点（TanStack Virtual 同样要求 ✔）。

## 8. 性能预算

### 8.1 基准方法与实测（Node 24，单进程，本机，单次运行）

> 目的：给出**数量级**，不是 SLA。浏览器里还要叠加 React 渲染与布局，通常比这里慢 2–5 倍（⚠ 推断）。

| 操作                        | 规模      | 实测          | 每次操作     |
| --------------------------- | --------- | ------------- | ------------ |
| `createListAdapter` 构建    | 1k        | 0.18ms        | 0.18µs/行    |
| `createListAdapter` 构建    | 100k      | 11.2ms        | 0.11µs/行    |
| `createTreeAdapter` 建索引  | 100k 节点 | 25.7ms        | 0.26µs/节点  |
| `flatten`（全展开后重算）   | 10k 可见  | 0.77ms        | —            |
| `flatten`（全展开后重算）   | 100k 可见 | 2.85ms        | 0.03µs/行    |
| `getItem`                   | 100k      | 1e6 次 6.1ms  | **0.01µs**   |
| `indexOf`                   | 100k      | 1e6 次 46.9ms | **0.05µs**   |
| `getRange(20)`              | 100k      | 1e5 次 4.9ms  | 0.05µs       |
| 虚拟 `getWindow`            | 100k      | 1e6 次 114ms  | **0.11µs**   |
| `setMeasuredSize`           | 100k      | 1e4 次 0.87ms | 0.09µs       |
| 一次前缀和全量重算          | 100k      | 0.34ms        | —            |
| 级联勾选（分支 99）         | 10k 节点  | 1000 次 8.8ms | **8.8µs/次** |
| 选择 toggle（复制整个 Set） | 已选 1k   | 200 次        | 6.2µs        |
| 选择 toggle                 | 已选 10k  | 200 次        | 149µs        |
| 选择 toggle                 | 已选 100k | 200 次        | 275µs        |

**基准里暴露并修掉的三个问题**（保留作为反面教材）：

| 问题                                   | 症状                       | 修复                       | 效果                                              |
| -------------------------------------- | -------------------------- | -------------------------- | ------------------------------------------------- |
| `KeyIndex` 建双表                      | 100k 构建 40ms、内存翻倍   | 精确匹配 + 数值兜底        | 40ms → **11.2ms**                                 |
| `setMeasuredSize` 里调 `ensureOffsets` | 1 万次测量 1886ms（O(n²)） | 只标脏，取窗口时批量重算   | 1886ms → **0.87ms**                               |
| 勾选向上归纳全量扫描兄弟               | 分支大时 O(branching)      | 出现"一勾一未勾"即提前退出 | 极端场景 3.1s → 2.2s（剩余成本是 Set 复制，见下） |

### 8.2 复杂度目标（写进 code review checklist）

| 操作                              | 目标复杂度              | 1k                       | 10k      | 100k   |
| --------------------------------- | ----------------------- | ------------------------ | -------- | ------ |
| 建 list adapter                   | O(n)                    | 0.18ms                   | ~1.5ms ⚠ | 11ms   |
| 建 tree 索引                      | O(n)                    | —                        | ~2.6ms ⚠ | 26ms   |
| `getCount/getKey/getItem/indexOf` | **O(1)**                | 0.01–0.05µs（与 n 无关） | 同       | 同     |
| `getRange(k)`                     | O(k)                    | —                        | —        | —      |
| `flatten`                         | **O(visible)**          | —                        | 0.77ms   | 2.85ms |
| `getParent/getChildren/getPath`   | O(1) / O(depth)         | —                        | —        | —      |
| 单选/多选 toggle                  | O(selected)（Set 复制） | 6µs                      | 149µs    | 275µs  |
| 级联勾选                          | O(subtree + depth)      | —                        | 8.8µs    | —      |
| 虚拟 `getWindow`                  | O(log n + window)       | 0.11µs                   | 同       | 同     |
| 组件渲染                          | **O(window)**，≤ 60 行  | —                        | —        | —      |

**两条硬预算**：

1. 单次交互（点击/按键）里 adapter 部分 ≤ **2ms**——上表所有 O(1)/O(log n) 操作都远低于此；只有 `flatten`（展开切换）和 `toggle`（大选择集）会逼近。
2. 首屏 10k 行：`createListAdapter` + 首次 `flatten` ≤ **5ms**（实测 ~2ms），剩余预算留给 React 渲染。

**超标时的处方**：

- `toggle` 超过 100µs → 选择集 > 5k，改用"可变 Set + `version` 自增"（`useSyncExternalStore`），或改用 `{ type: 'exclude', ids }` 排除模型（MUI v7 的做法 ◐）。
- `flatten` 超过 2ms → 树全展开规模 > 5 万，改用增量扁平化（记录可见区间）或"只渲染当前展开分支"。
- 建索引超过 30ms → 移到 `requestIdleCallback` / Web Worker，UI 先显示骨架。

### 8.3 虚拟化阈值与测量策略

| 行数                 | 策略                                                     | 说明                                                                  |
| -------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| < 100                | **不虚拟**                                               | DOM 100 行 ~ 几 ms，虚拟化带来的 a11y/测试成本不划算                  |
| 100 – 1k             | 虚拟 + 固定行高 + `overscan: 4`                          | 必须同时输出 `aria-setsize/posinset`                                  |
| 1k – 10k             | 虚拟 + 固定行高 + `overscan: 4–8`                        | 禁用 `scrollIntoView` 之外的逐帧测量                                  |
| > 10k                | 虚拟 + **动态测量的批量写回** + `overscan: 6–10`         | 测量回调要合并到一帧（`requestAnimationFrame`），一帧只重算一次前缀和 |
| 动态高度（任意规模） | `estimateSize` 取**较大值** + `setMeasuredSize` 批量写回 | 估算偏小会导致总高偏小、滚动条跳（TanStack 文档明确建议 ✔）           |

**测量（Measure）策略三条**：

1. **能定高就不要测量**。定高时 `getItemOffset(i) = paddingStart + i * estimate`，可退化成乘法；前缀和数组都不需要。
2. **测量结果只写回，不立即重排**。`setMeasuredSize` 只标脏；下一次 `getWindow` 统一重算（这是 8.1 里 1886ms → 0.87ms 的原因）。
3. **滚动中不纠正上方行高**。用户向上滚动时，上方行高变化会引起内容跳动（TanStack 的 `shouldAdjustScrollPositionOnItemSizeChange` 默认只在非向上滚动时补偿 ✔）。我们的 adapter 不碰滚动位置，这条约束落在组件层：**滚动期间只允许"向下扩展测量"，不允许回写上方尺寸**。

### 8.4 内存

| 结构                       | 100k 行的量级 | 备注                                                                      |
| -------------------------- | ------------- | ------------------------------------------------------------------------- |
| `keys: Key[]`              | ~0.8MB        | 数组本身                                                                  |
| `Map<Key, number>`         | ~5–8MB ⚠      | V8 Map 每项约 50–80B；**若 id 是 0..n-1 连续整数，可跳过 Map 直接用下标** |
| `Float64Array` 尺寸/前缀和 | 1.6MB         | 两个 100k 的 Float64Array                                                 |
| `VisibleNode[]`            | ~7MB ⚠        | 每项 8 个字段；10 万全展开时才有                                          |
| DOM 行                     | 与窗口成正比  | 虚拟化后 40 行                                                            |

**结论**：`keys` + `Map` 在 10 万行时约 6–9MB，可接受；但**如果 id 就是连续整数**（很多 mock/本地数据是），`createListAdapter` 可以走"零 Map"快路径：`indexOf(key) = typeof key === 'number' && key >= 0 && key < n ? key : -1`。这属于 10.5 的优化项，不进 v1 接口（避免特化泄漏）。

---

## 9. 无障碍（a11y）配合

### 9.1 role 与必填属性

| 组件              | 容器 role                                  | 行 role                                           | 必填 / 关键属性                                                                                                                                 | 来源                                                            |
| ----------------- | ------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| List / Listbox    | `listbox`（多选加 `aria-multiselectable`） | `option`                                          | `aria-selected`、`aria-posinset`、`aria-setsize`、`aria-disabled`                                                                               | MDN `aria-setsize` ✔                                            |
| Tree / TreeSelect | `tree`                                     | `treeitem`                                        | `aria-level`（**1 基**）、`aria-expanded`、`aria-selected`、`aria-checked`（可 `mixed`）、`aria-setsize`/`aria-posinset`、`aria-busy`（加载中） | MDN `aria-setsize` ✔（明确列了 tree 的 level/setsize/posinset） |
| Table / DataGrid  | `grid` 或 `table`                          | `row` / `gridcell`                                | `aria-rowcount`、`aria-rowindex`（**1 基，表头算第 1 行**）、`aria-colcount`、`aria-selected`                                                   | MDN `aria-rowcount` ✔                                           |
| Menu              | `menu`                                     | `menuitem` / `menuitemcheckbox` / `menuitemradio` | `aria-checked`、`aria-haspopup`、`aria-expanded`                                                                                                | MDN `aria-setsize` ✔                                            |
| Combobox          | `combobox` + 弹出 `listbox`                | `option`                                          | `aria-expanded`、`aria-controls`、`aria-activedescendant`                                                                                       | APG ◐                                                           |

### 9.2 属性 ↔ adapter 方法映射

| ARIA                   | 来源                                             | 备注                                                                             |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `aria-setsize`         | `getCount()` 或 `VisibleNode.setSize`            | **虚拟化时必须显式给**，否则浏览器只数 DOM 里的行（MDN 原文 ✔）；总数未知用 `-1` |
| `aria-posinset`        | `index + 1` 或 `VisibleNode.posInSet`            | 1 基；树里是"同级序号"，不是全局序号                                             |
| `aria-level`           | `getLevel(index) + 1`                            | **ARIA 是 1 基，adapter 是 0 基**，这一处转换是最常见的 off-by-one               |
| `aria-expanded`        | `VisibleNode.expanded`（仅 `expandable` 时输出） | 叶子节点不要输出该属性                                                           |
| `aria-selected`        | `selection.isSelected(key)`                      | 单选也用它（不要用 `aria-checked` 表达列表选择）                                 |
| `aria-checked="mixed"` | `check.getState(key) === "indeterminate"`        | 半选**只能**通过 `mixed` 表达，不能用 `aria-selected=false` 糊弄                 |
| `aria-rowcount`        | 数据总行数（不是渲染行数）                       | 虚拟网格必须给；未知 `-1`                                                        |
| `aria-rowindex`        | 行在**完整数据集**中的位置                       | 与 `aria-rowcount` 配套；跨页时要加偏移                                          |
| `aria-busy`            | 异步子树加载中                                   | 与 `expandable` 的"懒加载父节点"配合                                             |

### 9.3 虚拟化下的三个坑

1. **`aria-setsize` 缺失**：屏幕阅读器会报"第 3 项，共 3 项"，而实际有 1 万项。MDN 明确要求部分渲染时手工设置 ✔。
2. **`aria-activedescendant` 指向已卸载的行**：焦点行走在虚拟窗口外时，`aria-activedescendant` 的 id 不在 DOM 里，屏幕阅读器直接失声。对策：**把焦点行强制并入渲染窗口**（TanStack Virtual 的 `rangeExtractor` 就是为此存在，文档示例即"手工增删渲染项" ✔）。
3. **行高变化导致 `aria-rowindex` 与视觉错位**：虚拟化后视觉顺序不变，但"第几行"必须按数据顺序算，不能按 DOM 顺序。

### 9.4 键盘导航（组件层实现，adapter 提供定位能力）

| 键                | Listbox / List                      | Tree                         | Grid                                         |
| ----------------- | ----------------------------------- | ---------------------------- | -------------------------------------------- |
| `ArrowDown/Up`    | 下一/上一项                         | 下一个**可见**节点           | 下/上一行                                    |
| `Home` / `End`    | 首/尾项                             | 首个/最后一个可见节点        | 行首/行尾单元格（`Ctrl+Home/End` 到表首/尾） |
| `PageUp/PageDown` | 一屏（约 10 项或可视项数）◐         | 一屏                         | 一屏行                                       |
| `ArrowRight/Left` | —                                   | 展开/折叠；叶子则移动到父/子 | 右/左单元格                                  |
| `*`               | —                                   | 展开同级全部                 | —                                            |
| `Enter` / `Space` | 选择/勾选                           | 选择/勾选/展开               | 进入编辑/选择                                |
| `Shift+Arrow`     | 扩展选择（需锚点）                  | 扩展选择                     | 扩展选区                                     |
| `Ctrl/Cmd+A`      | 全选（`'all'`）                     | 全选（含未加载，需提示）     | 全选                                         |
| 可打印字符        | typeahead：跳到以该字符开头的下一项 | 同                           | 进入编辑或 typeahead                         |

**adapter 需要提供的支撑**：`indexOf(key)`（Home/End/typeahead 命中后定位）、`getKey(index)`（移动后算下一个）、`getLevel/getParent`（左右键的父/子跳转）、`ensureRange`（PageDown 跨页时预取）。a11y 的键盘状态机属于组件，**不进 adapter**。

### 9.5 焦点保持与 `scrollIntoView`

- **焦点用 key 记录，不用 index**：重排后 index 失效，key 仍有效。
- **滚动用 `scrollOffsetForIndex(index, { align })` 算偏移**，由组件 `scrollTo({ top })`；不要直接 `element.scrollIntoView()`——它会连带滚动外层容器（页面级滚动），在弹层/抽屉里是灾难。
- **展开/折叠后恢复焦点**：折叠一个包含焦点的父节点时，焦点应回到该父节点（而不是丢失到 body）。
- **`scrollToIndex` 前先确保目标可见**：目标在折叠子树里时，先 `ensureVisibleKey` 展开祖先（见 10.5），再算偏移。

---

## 10. 目录与文件拆分（对应现有脚手架）

### 10.1 文件清单与导出

| 文件                                                                          | 导出                                                                                            | 依赖                        |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------- |
| `src/structure/hash/hashKey.ts`（新增，与已有 `hash.ts` 并存）                | `keyToText`、`keyFromText`                                                                      | 无                          |
| `src/structure/map/keyIndex.ts`（新增，与 `ordered.ts`/`unordered.ts` 并存）  | `KeyIndex`、`createKeyIndex`                                                                    | hash                        |
| `src/structure/set/keySetOps.ts`（新增，与 `ordered.ts`/`unordered.ts` 并存） | `KeySet`、`SelectionValue`、`addKey`、`removeKey`、`toggleKey`、`materialize`                   | hash                        |
| `src/adapter/list/adapter/types.ts`                                           | `Key`、`Alignment`、`CollectionAdapter`、`ListAdapter`、`ListAdapterOptions`                    | structure/set（类型）       |
| `src/adapter/list/adapter/useAdapterVersion.ts`                               | `AdapterStore`、`useAdapterVersion`                                                             | react                       |
| `src/adapter/list/adapter/useControlledSet.ts`                                | `useControlledSet`（内部）、`useControlledKeys`（对外薄封装）                                   | react                       |
| `src/adapter/list/adapter/index.ts`                                           | 以上 re-export                                                                                  | —                           |
| `src/adapter/list/list/createListAdapter.ts`                                  | `createListAdapter`                                                                             | list/adapter, structure/map |
| `src/adapter/list/level/createLevelAdapter.ts`                                | `LevelGroup`、`LevelAdapter`、`createLevelAdapter`                                              | list/adapter, structure/map |
| `src/adapter/list/virtual/createVirtualAdapter.ts`                            | `VirtualAdapterOptions`、`VirtualWindow`、`VirtualAdapter`、`createVirtualAdapter`              | list/adapter                |
| `src/adapter/tree/adapter/types.ts`                                           | `TreeNodeEntry`、`VisibleNode`、`TreeAdapter`、`TreeAdapterOptions`                             | list/adapter, structure/set |
| `src/adapter/tree/adapter/createTreeAdapter.ts`                               | `createTreeAdapter`（内部 `buildTreeIndex`/`flattenIndex` 不导出）                              | tree/adapter, structure/map |
| `src/adapter/tree/adapter/useExpandedKeys.ts`                                 | `useExpandedKeys`                                                                               | list/adapter, react         |
| `src/adapter/tree/select/createSelection.ts`                                  | `SelectionMode`、`SelectionState`、`SelectionOptions`、`SelectionController`、`createSelection` | list/adapter, structure/set |
| `src/adapter/tree/select/useSelection.ts`                                     | `useSelection`                                                                                  | createSelection, react      |
| `src/adapter/tree/check/createCheckState.ts`                                  | `CheckState`、`CheckOptions`、`CheckController`、`createCheckState`                             | structure/set               |
| `src/adapter/tree/virtual/ensureVisibleKey.ts`                                | `ensureVisibleKey`、`createTreeWindowAdapter`                                                   | tree/adapter, list/virtual  |
| 各目录 `index.ts`                                                             | 目录级 barrel（**只做 re-export，不放实现**）                                                   | —                           |
| `src/adapter/**/__tests__/*.test.ts`                                          | 行为断言（本报告 33 条可直接搬）                                                                | vitest（后续引入）          |

### 10.2 依赖图（单向，禁止回边）

```
structure/hash  ←  structure/map  ←  adapter/list/adapter  ←  adapter/list/{list,level,virtual}
                                                          ←  adapter/tree/adapter  ←  tree/{select,check,virtual}
                                                                                  ←  component/**
```

### 10.3 用 ESLint 钉死依赖方向

```js
// eslint.config.js 追加（示意）
{
    files: ["src/adapter/**/*.ts"],
    rules: {
        "no-restricted-imports": [
            "error",
            {
                patterns: [
                    { group: ["**/component/**"], message: "adapter 不得依赖 component（依赖方向：structure → adapter → component）" },
                ],
            },
        ],
    },
},
{
    // 核心实现禁止依赖 react；只有 use*.ts 例外
    files: ["src/adapter/**/*.ts"],
    ignores: ["src/adapter/**/use*.ts"],
    rules: {
        "no-restricted-imports": [
            "error",
            { paths: [{ name: "react", message: "核心 adapter 必须与 React 解耦，放到 use*.ts 里" }] },
        ],
    },
},
```

> 注：ESLint 的 `ignores` 与 `files` 组合在不同版本行为有差异，落地时建议用 `files: ["src/adapter/**/*.ts", "!src/adapter/**/use*.ts"]`（◐ 需按项目 eslint 10 验证）。

### 10.4 为什么不把 `structure/*` 做成通用数据结构库

`structure/{hash,map,set}` 只服务于 adapter 层的三个具体需求：key 归一化、key→index、key 集合运算。**不要**在这里造 LRU、跳表、持久化集合——除非 profiler 证明 `Map` 是瓶颈（8.4 已说明：连续整数 id 可以完全跳过 Map）。这是"反过度抽象"的一部分（12.10）。

### 10.5 两个预留扩展（不进 v1）

```ts
/** 树 → 虚拟化：TreeAdapter 本身就是 ListAdapter，所以只是一行包装。 */
export function createTreeWindowAdapter<T>(tree: TreeAdapter<T>, options: VirtualAdapterOptions): VirtualAdapter<T> {
    return createVirtualAdapter(tree, options);
}

/** 定位到某个 key 前，确保其祖先都已展开（scrollToIndex 到隐藏节点的必备前置）。 */
export function ensureVisibleKey<T>(tree: TreeAdapter<T>, key: Key): KeySet {
    const path = tree.getPath(key);
    let next: Set<Key> | null = null;
    for (const ancestor of path.slice(0, -1)) {
        if (!tree.expandedKeys.has(ancestor)) {
            next ??= new Set(tree.expandedKeys);
            next.add(ancestor);
        }
    }
    return next ?? tree.expandedKeys;
}
```

后续项（明确不做，避免范围蔓延）：增量扁平化、`lanes` 多列、`anchorTo: 'end'` 聊天锚定、`include/exclude` 排除模型、列模型（列是静态结构，不进 adapter）。

### 10.6 与并行实现的合并方式

仓库里 `src/structure/**` 与 `src/component/foundation/**` 已有并行产出。合并原则：**adapter 只消费结构层的容器与组件的受控/焦点基础，不另造第二套**。

| 已有文件（并行实现）                                                        | 与本报告的关系                                     | 合并建议                                                                                                              |
| --------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/structure/hash/hash.ts`（`UseHash`，返回 `bigint`）                    | 通用哈希函数，支持 null/number/bigint/object/array | v1 **不需要**（`Map` 已足够，8.4）；作为"自建开放寻址表"的后续优化基础，或在需要"对象身份哈希"时使用                  |
| `src/structure/map/ordered.ts` / `unordered.ts`                             | 通用有序/无序映射容器                              | `createKeyIndex` 可基于 `unordered` 封装；若其 API 已覆盖 `get/set/has`，则**删除**本报告的 `keyIndex.ts`，改为薄适配 |
| `src/structure/set/ordered.ts` / `unordered.ts`                             | 通用有序/无序集合                                  | `keySetOps` 的并/差/切换可复用其容器；`KeySet`（`ReadonlySet<Key>`）仍作为 adapter 的领域类型保留                     |
| `src/component/foundation/useControllableState.ts`                          | 已存在的受控/非受控 hook                           | 7.4 的 `useControlledSet` **基于它实现**，不要重复；`useSelection` 的受控分支同理                                     |
| `src/component/foundation/useRovingTabIndex.ts`                             | 键盘焦点管理                                       | 9.4 的键盘导航表由它承载；adapter 只提供 `indexOf/getKey/getLevel` 支撑                                               |
| `src/component/foundation/{useAnchoredPosition,useDismiss,useFocusTrap}.ts` | 弹层基础设施                                       | TreeSelect/Combobox 复用；与 adapter 无直接关系                                                                       |
| `src/structure/validation.ts`（`Nullable` 等）                              | 工具类型                                           | `getItem` 返回 `T \| undefined` 的场景可直接用                                                                        |

**冲突处理优先级**：① 已有通用实现 > ② 本报告的专用实现 > ③ 新建。若 `structure/map` 已能满足 `KeyIndex` 语义（含数值兜底），就删掉本报告的 `keyIndex.ts`，只保留 adapter 层的调用点。

**命名冲突检查**：本报告新增文件名（`hashKey.ts`、`keyIndex.ts`、`keySetOps.ts`、`types.ts`、`create*.ts`、`use*.ts`）与已有的 `hash.ts`、`ordered.ts`、`unordered.ts`、`validation.ts`、`foundation/*` **均不重名**，可安全共存。

## 11. 组件接入 adapter 的 10 条规范

> 这 10 条是 code review 的硬门槛。每条都给出"怎么检查"，便于直接落到 PR 模板。

| #   | 规范                                                                                                                                                                                                                         | 为什么                                                                          | 怎么检查                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | **组件 props 只接受 `adapter`，不接受 `items: T[]`**（对外便捷 API 由调用方 `createListAdapter` 完成，或提供 `items` → adapter 的**兼容适配器**，但组件内部只认 adapter）                                                    | 否则结构假设回到组件里，远程/树/虚拟永远接不进来                                | `grep -n "items\s*:" src/component/**(列表类)`；props 类型里不允许出现 `T[]`                                      |
| 2   | **组件内零线性查找**：禁止 `items.find/findIndex/filter/indexOf`、禁止 `Array.from(adapter).find`                                                                                                                            | 10k 行时每次渲染 O(n) 就是几十毫秒；这类代码在 profiler 里表现为"每次输入都卡"  | review 时搜 `find(`/`indexOf(`；需要按 key 取数据时只能 `adapter.indexOf` + `adapter.getItem`（O(1)）             |
| 3   | **adapter 由调用方创建并保持身份稳定**；组件不得内部克隆/包装 adapter，也不得把 `getCount()` 结果存进 state 当缓存                                                                                                           | 包装 = 新身份 = 下游 `memo` 全失效；缓存 count = 远程追加后不更新               | 组件里搜 `createListAdapter(`/`createTreeAdapter(`（应只出现在调用方或测试里）；搜 `useState(adapter.getCount())` |
| 4   | **状态只存 `Key`**：`selectedKeys`/`expandedKeys`/`focusedKey`/`checkedKeys`；**任何 `index`、对象引用都不进 state**                                                                                                         | index 会随排序/插入/过滤失效；对象引用会随刷新失效                              | state 类型审查；出现 `selectedIndex` 一律要求改成 `selectedKey`                                                   |
| 5   | **受控优先**：受控时只上报不回写；`anchorIndex`、hover、typeahead buffer 等交互中间态留在组件内部                                                                                                                            | 双写会造成父子状态漂移（父不更新时 UI "假选中"）                                | 受控分支里搜 `setState`；`useControlledSet`/`useSelection` 之外不应有受控判断                                     |
| 6   | **悬空 key 只在"数据变更点"修剪**（fetch 完成、删除、过滤条件变化），不在 render 里修剪                                                                                                                                      | render 期修剪 = 副作用 + 每帧新建 Set，必然破坏 memo                            | render 函数里搜 `new Set(` + `filter`；应有 `normalize`/`normalizeExpanded` 调用点在事件/effect 中                |
| 7   | **adapter 层禁止 DOM API 与副作用**；`ensureRange` 只能在 `useEffect` 里调用                                                                                                                                                 | render 期间发请求在 StrictMode 下会双发；DOM 依赖让 adapter 无法在 Node 单测    | `grep -n "document\|window\|IntersectionObserver" src/adapter`；`ensureRange(` 必须出现在 effect 内               |
| 8   | **结构信息只能来自 adapter**（`getChildren`/`getLevel`/`isExpandable`/`getParent`），禁止读 `item.children` 之类的业务字段                                                                                                   | 懒加载树、扁平化树（Ant 的 `treeData` 扁平写法）根本没有 `children` 字段        | 组件里搜 `.children`；允许的只有 React 的 children                                                                |
| 9   | **所有 ARIA 由 adapter 派生**：`aria-level = getLevel + 1`、`aria-setsize/posinset`、`aria-expanded`、`aria-selected`、`aria-checked="mixed"`；虚拟化必须给 `aria-rowcount`/`aria-setsize`，且**焦点行必须强制在渲染窗口内** | 缺 setsize 时屏幕阅读器只数 DOM 行；焦点行被卸载则 `aria-activedescendant` 失效 | Storybook/axe 审计；键盘走一遍 Home/End/PageDown 后读屏应报正确"第 X 项，共 N 项"                                 |
| 10  | **可测试性**：组件必须能用"3 个节点的 mock adapter"跑通全部交互（选择、展开、勾选、键盘），不需要真实数据与网络                                                                                                              | 测试成本决定这套架构能否长期维护；mock adapter 只有 ~10 行                      | 每个列表类组件至少一个 mock-adapter 测试文件                                                                      |

---

## 12. 反模式与对策（11 条，附来源）

### 12.1 组件直接吃 `items` 数组

- **症状**：`<List items={rows} />`；后来要加分组/远程分页，组件内部大改。
- **根因**：把"数据从哪来、怎么索引"固化进组件。
- **对策**：组件只收 adapter；数组场景用 `createListAdapter` 一行包掉。
- **来源**：React Spectrum 把"静态/动态/异步/分组/虚拟化/无限滚动"列为**同一个** Collection API 的设计目标（[Collections](https://react-spectrum.adobe.com/v3/collections.html) ✔）；Ant Tree 的 `treeData` 与 `loadData` 也是同一套 props 承载（[Tree](https://ant.design/components/tree) ✔）。

### 12.2 每次渲染重建 adapter / 内联 `getKey`

- **症状**：`<List adapter={createListAdapter(items, { getKey: (x) => x.id })} />`，列表滚动或父级输入时整表重渲染。
- **根因**：adapter 身份每帧变化 → 下游 `memo`/`useMemo` 全部失效。
- **对策**：`getKey` 模块级或 `useCallback`；adapter `useMemo`；在数据所有者处创建。
- **来源**：TanStack Virtual 明确要求 `getItemKey`"尽量 memo 化，避免不必要的重算"（[Virtualizer](https://tanstack.com/virtual/latest/docs/api/virtualizer.md) ✔）；React Aria 的 `dependencies` 也是为"渲染缓存什么时候失效"服务（[Collections](https://reactspectrum.blob.core.windows.net/reactspectrum/378ff35030687cb1502fd7026d083d4119bf17f8/s2-docs/react-aria/collections.html?component=ListBox) ✔）。

### 12.3 用数组下标当 key / 把 index 存进状态

- **症状**：排序后选中项"跳到"别的行；插入一行后展开状态错位。
- **根因**：index 是位置不是身份。
- **对策**：`getKey` 必须来自数据；状态只存 `Key`。
- **来源**：TanStack Table 专门区分 `row.index`（创建位置）与 `row.getDisplayIndex()`（当前显示序），并提供 `getRowId` 覆盖 id（[Rows Guide](https://tanstack.com/table/latest/docs/guide/rows.md) ✔）；TanStack Virtual 说 index key "无法区分 prepend 与 append"（[Virtualizer](https://tanstack.com/virtual/latest/docs/api/virtualizer.md) ✔）。

### 12.4 每次渲染 O(n) 查找

- **症状**：`rows.find(r => r.id === selectedId)`、`items.filter(...)` 在 render 里；输入时延迟随行数线性上升。
- **根因**：把"按 key 查"当成数组操作。
- **对策**：`adapter.indexOf` / `getItemByKey`（实测 0.05µs）。
- **来源**：TanStack 把 `rowsById` 作为 row model 的标准产物，理由是"按 id 快速查找，性能更好"（[Row Models](https://tanstack.com/table/latest/docs/guide/row-models.md) ✔）。

### 12.5 在组件里硬编码父子关系

- **症状**：`item.children?.length` 判断展开箭头；接懒加载树时无处下手。
- **根因**：结构信息耦合在数据结构上。
- **对策**：`isExpandable(index)`（结构可展开）与 `expanded`（当前展开）分离；子节点通过 `getChildren` 拉取。
- **来源**：Ant Tree 的 `isLeaf` 注释就是"配合 `loadData` 使用，`false` 强制当作父节点"（[Tree](https://ant.design/components/tree) ✔）；AG Grid/MUI 的 server-side row model 也是"父节点存在但子节点按需拉取"（[AG SSRM API](https://www.ag-grid.com/react-data-grid/server-side-model-api-reference/) ◐）。

### 12.6 用"可见节点"做勾选传导

- **症状**：折叠父节点后，全选变半选；搜索过滤后父节点状态乱跳。
- **根因**：把渲染集合当成结构集合。
- **对策**：传导只走 `getChildren`（结构全集）；可见性只影响渲染。
- **来源**：Ant Tree 的传导规则与 `checkStrictly` 选项明确以**结构**为准，且 `disabled` 会阻断传导（[Tree](https://ant.design/components/tree) ✔，FAQ 原文）。

### 12.7 受控 + 内部双写

- **症状**：受控传入 `selectedKeys`，点击后 UI 先选中再弹回；或父组件不更新时 UI "假选中"。
- **根因**：同时维护两份真值。
- **对策**：受控只 `onChange`，非受控才 `setState`（7.4 的 `useControlledSet`）。
- **来源**：React Spectrum 的受控/非受控成对 API（`selectedKeys` / `defaultSelectedKeys`）与 `'all'` 语义（[Selection](https://react-spectrum.adobe.com/v3/selection.html) ✔）；MUI 的 `rowSelectionModel` 受控模型（[Row selection](https://mui.com/x/react-data-grid/row-selection/) ◐）。

### 12.8 虚拟列表不输出 `aria-rowcount` / `aria-setsize`

- **症状**：读屏报"第 3 项，共 3 项"，实际 1 万项。
- **根因**：浏览器只数 DOM 里的行。
- **对策**：虚拟化时逐行输出 `aria-setsize`/`aria-posinset`；网格输出 `aria-rowcount`/`aria-rowindex`。
- **来源**：MDN 明确"DOM 不完整时浏览器计数会错，必须手工设置"（[aria-setsize](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-setsize) ✔、[aria-rowcount](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-rowcount) ✔）。

### 12.9 滚动中逐项测量并同步纠正滚动位置

- **症状**：向上滚动时列表"抖"，行高变化导致内容跳动。
- **根因**：测量与滚动位置校正耦合在同一帧。
- **对策**：测量只标脏、批量重算；滚动期间不回写上方行高（8.3）。
- **来源**：TanStack Virtual 的 `shouldAdjustScrollPositionOnItemSizeChange` 默认"只在用户非向上滚动时补偿"，正是为规避此问题（[Virtualizer](https://tanstack.com/virtual/latest/docs/api/virtualizer.md) ✔）。

### 12.10 过度抽象：为三个组件造一套 query/filter/sort DSL

- **症状**：adapter 接口膨胀到 30 个方法，带 `where/orderBy/aggregate`，最后没人会用。
- **根因**：把"数据管道"当成"适配器"。
- **对策**：adapter 只做**索引与视图**；排序/过滤是"派生视图"，用组合实现（`createListAdapter(sorted)`），不塞进接口。
- **来源**：TanStack Table 的 row model 是**按需引入**的（v9 里 core 自动包含，其余要显式注册），并明确"可以复制源码改"，即"功能可选、可替换"（[Row Models](https://tanstack.com/table/latest/docs/guide/row-models.md) ✔）。

### 12.11 数据刷新后不修剪选择/展开

- **症状**：删掉一行后"已选 3 项"但只看到 2 行；祖先永远半选。
- **根因**：状态集合里残留悬空 key。
- **对策**：`normalize` / `normalizeExpanded` 在数据变更点执行（7.6）。
- **来源**：React Aria 的 `useListData` 会在删除时自动把该项移出选择（[Selection](https://react-spectrum.adobe.com/v3/selection.html) ✔）；MUI 用 `keepNonExistentRowsSelected` 显式控制该行为（[Row selection](https://mui.com/x/react-data-grid/row-selection/) ◐）。

---

## 13. 落地路线（建议 4 个 PR）

| 阶段           | 内容                                                                              | 验收                                                                                 |
| -------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **P0**（1 天） | `structure/{hash,map,set}` + `list/adapter/types.ts` + `createListAdapter` + 单测 | 33 条断言里的 list 部分通过；`tsc -b` 通过；ESLint 依赖规则生效                      |
| **P1**（2 天） | `tree/adapter/*`（含 flatten/path/normalize）+ `tree/check` + 单测                | flatten 前序 / posInSet / 半选 / disabled 阻断 / 循环数据 全部有断言                 |
| **P2**（2 天） | `select/*` + `virtual/*` + `use*` hooks + 组件示例                                | shift 区间、`'all'`、锚点、虚拟窗口数学通过；1 万行 Listbox demo 可跑                |
| **P3**（3 天） | 迁移组件：`Select` → `Listbox` → `TreeSelect` → `Table`；a11y 审计                | 每个组件有 mock-adapter 测试；键盘 Home/End/PageDown/typeahead 走查；axe 无 critical |

**迁移顺序的理由**：`Select` 现在就是原生 `<select>` + 数组（`src/component/picker/select/Select.tsx:43-54`），改成"adapter → 渲染 option"是最小改动、最快验证接口是否够用；`TreeSelect` 会第一次逼出 `flatten` + `getPath`；`Table` 才会逼出列模型（列不进 adapter，另立 `columnModel`）。

**风险**：

- 组件迁移会改动 `onChange(value: string)` 这类现有 API → 需要**兼容层**（旧 `options` prop 内部转成 adapter），并标 `@deprecated`。
- 引入 hooks 后组件不再是纯受控 → 需要同步更新现有 Story/docs。
- `src/component/icon/**` 不参与本次改动，但列表行会用到图标 → 只做"渲染插槽"（`renderIcon?: (node) => ReactNode`），**不 import 具体图标**，避免与图标负责人冲突。

---

## 14. 附录

### 14.1 证据表

| 来源                                                                                                                                                                                             | 用途                                                                                                                                 | 等级          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| [TanStack Table · Row Models Guide](https://tanstack.com/table/latest/docs/guide/row-models.md)                                                                                                  | pipeline 顺序、`manual*`、`rows/flatRows/rowsById`、按需注册 row model                                                               | ✔             |
| [TanStack Table · Rows Guide](https://tanstack.com/table/latest/docs/guide/rows.md)                                                                                                              | `row.id`/`getRowId`/`row.index` vs `getDisplayIndex`/`subRows`/`depth`/`parentId`                                                    | ✔             |
| [TanStack Virtual · Virtualizer API](https://tanstack.com/virtual/latest/docs/api/virtualizer)                                                                                                   | `count`/`estimateSize`/`overscan`/`getItemKey`/`measureElement`/`scrollToIndex`/`lanes`/`anchorTo`/`rangeExtractor`                  | ✔             |
| [React Spectrum · Collection components](https://react-spectrum.adobe.com/v3/collections.html)                                                                                                   | 设计目标清单、静态 vs 动态、unique key、不可变要求、`useListData` 修剪                                                               | ✔             |
| [React Spectrum · Selection](https://react-spectrum.adobe.com/v3/selection.html)                                                                                                                 | `Set`/`'all'`、受控/非受控、key 类型转换、全选语义                                                                                   | ✔             |
| [React Stately collections types](https://cdn.jsdelivr.net/npm/@react-stately/collections/dist/types.d.ts)                                                                                       | `CollectionBuilder`/`useCollection`/`getItemCount`/`getChildNodes`/`Item`/`Section`                                                  | ✔             |
| [React Aria · Collections](https://react-aria.adobe.com/collections.html)                                                                                                                        | 动态集合、`dependencies`、唯一 id                                                                                                    | ✔（正文部分） |
| [React Aria · Collections (S2 mirror)](https://reactspectrum.blob.core.windows.net/reactspectrum/378ff35030687cb1502fd7026d083d4119bf17f8/s2-docs/react-aria/collections.html?component=ListBox) | 静态/动态集合、`dependencies`、渲染缓存                                                                                              | ✔             |
| [Ant Design · Tree](https://ant.design/components/tree)                                                                                                                                          | `checkedKeys` 传导、`checkStrictly`、`halfCheckedKeys`、`virtual`、`loadData`/`loadedKeys`、`disabled` 阻断、`getPath`、虚拟滚动限制 | ✔             |
| [MDN · aria-setsize](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-setsize)                                                                          | 部分渲染时的 setsize/posinset、tree 的 level/setsize/posinset、`-1`                                                                  | ✔             |
| [MDN · aria-rowcount](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-rowcount)                                                                        | 虚拟网格行数、`aria-rowindex`、`-1`                                                                                                  | ✔             |
| [React · useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)                                                                                                           | 外部 store 订阅、快照稳定性                                                                                                          | ◐             |
| [AG Grid · Row IDs](https://www.ag-grid.com/react-data-grid/row-ids/)                                                                                                                            | `getRowId`                                                                                                                           | ◐             |
| [AG Grid · SSRM API](https://www.ag-grid.com/react-data-grid/server-side-model-api-reference/)                                                                                                   | 服务端 row model / `startRow`/`endRow`                                                                                               | ◐             |
| [MUI X · Row selection](https://mui.com/x/react-data-grid/row-selection/)                                                                                                                        | 受控选择模型、`keepNonExistentRowsSelected`                                                                                          | ◐             |
| [MUI X · Rows](https://mui.com/x/react-data-grid/rows/)                                                                                                                                          | `getRowId`、tree data                                                                                                                | ◐             |
| [Ant Design · Table](https://ant.design/components/table)                                                                                                                                        | `rowKey`、`treeData`、`expandedRowKeys`、`virtual`                                                                                   | ◐             |
| [WAI-ARIA APG · Treeview](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)                                                                                                                    | 键盘（Home/End/`*`/typeahead）、`aria-level`                                                                                         | ◐             |
| [WAI-ARIA APG · Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)                                                                                                                            | 网格键盘、`aria-rowcount`/`aria-rowindex`                                                                                            | ◐             |
| [MDN · aria-checked](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-checked)                                                                          | `mixed` 三态                                                                                                                         | ◐             |

> 说明：◐ 表示页面为客户端渲染，抓取到的是导航/标题而非正文；相关 API 名称与语义来自公开文档与生态共识，落地前建议按链接人工复核一次。

### 14.2 术语表

| 术语                         | 含义                                                             |
| ---------------------------- | ---------------------------------------------------------------- |
| adapter（适配器）            | 只读的索引视图：把任意数据源映射成 `getCount/getKey/getItem/...` |
| visible sequence（可见序列） | 展开集合作用后的行序列，是 `TreeAdapter` 的 `ListAdapter` 索引域 |
| key / Key                    | 元素的稳定业务标识，`string \| number`                           |
| anchor（锚点）               | shift 区间选择的起点（可见索引）                                 |
| half-check / indeterminate   | 部分子节点选中的派生状态，只读不写                               |
| row model                    | TanStack 的术语：对原始数据做一次变换（过滤/排序/展开/分页）     |
| overscan                     | 视口外额外渲染的行数                                             |
| dirty 标记                   | 测量后只标记"从这里开始要重算"，延后到取窗口时统一重算           |

### 14.3 开放问题（需要项目方拍板）

1. **`Key` 是否允许 `bigint`？** 当前 `string | number`；若要支持 `bigint`，`keyFromText` 的数字兜底需改写（`Number` 会丢精度）。
2. **服务端分页的接口形态**：`ensureRange` 是"只取数"还是"全权负责 loading/error 状态"？建议 adapter 只管数据，loading/error 由组件 state 承载（避免 adapter 变成 store）。
3. **树的勾选是否允许"父节点不可勾选"**（`isDisabled` 只作用于 checkbox 而非整行）？Ant 用 `disableCheckbox`，我们目前只有 `isDisabled`，建议加 `isCheckboxDisabled`。
4. **是否需要 `Table` 的列模型**：列是静态结构，建议独立 `columnModel`，不进 `ListAdapter`（避免接口污染）。
5. **是否引入 `include/exclude` 选择模型**：当选择集常态 > 5 万时值得；当前 `'all'` 只能表达"全选"，不能表达"全选除了这几行"。
6. **虚拟化的测量时机**：是否允许 `ResizeObserver` + `requestAnimationFrame` 双缓冲（本报告建议允许，但需要真机验证 iOS 滚动）。

### 14.4 复现基准

本报告的编译校验与基准都在独立临时目录完成（未写入项目 `src`），方法：

```bash
# 1) 合并为单模块（core.ts / react.ts / test.ts / bench.ts）
# 2) 类型校验（与项目 tsconfig 关键开关一致）
tsc --noEmit --strict --noUnusedLocals --noUnusedParameters \
    --erasableSyntaxOnly --verbatimModuleSyntax \
    --target es2023 --lib es2023,dom --module esnext --moduleResolution bundler \
    core.ts react.ts test.ts
# 3) 行为断言
tsc --strict --target es2023 --module esnext --moduleResolution bundler --outDir out core.ts test.ts
node out/test.js     # 33 条断言全绿
# 4) 基准
tsc ... --outDir out bench2.ts && node out/bench2.js
```
