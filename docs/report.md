# Periodicity UI 组件库扩充研究报告

| 项目 | 内容                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| 版本 | v1.0（2026-10-20）                                                                                         |
| 范围 | `src/component/**`（不含 `src/component/icon/**`，该目录由他人维护）、`src/adapter/**`、`src/structure/**` |
| 目标 | 以 Material 设计模型为参照，扩充一套「深色编辑风」的可访问组件库，并给出数据适配器、工程契约与实施顺序     |
| 方法 | 6 路并行资料研究 + 现状代码审计 + 对比度实算 + 构建/lint 基线                                              |
| 结论 | 抄 Material 的「模型」（状态层、角色词表、类型比例、形状/动效 token、触控），不抄它的「皮肤」与默认值      |

---

## 1. 执行摘要

现有组件库只有 8 个可用组件（Surface、Button、Card、Badge、Dialog、TextInput、Select、Switch、ProgressRing 中的 9 个），视觉语言已经成立，但工程层缺四块地基：

1. **token 分层缺失**：颜色直接引用品牌变量，没有间距、字号、动效、状态层、海拔、层级 token；现有 `--faint`、placeholder、输入框边框、浅色 accent 均未达 WCAG AA。
2. **交互基础设施缺失**：没有 Portal / Popover / Tooltip / Menu / Toast / FocusScope，Dialog 内一旦出现自定义下拉就会重演 `shadcn#9712`（可见但点不中）。
3. **数据层缺失**：组件直接吃 `items` 数组，无法接远程分页、树、虚拟化、选择/勾选状态。
4. **质量门禁缺失**：没有对比度脚本、axe、键盘 E2E；构建通过不等于可访问。

本报告给出的方案是三句话：

- **视觉**：以亮度阶梯（surface ladder）而不是阴影建立层级；三档描边；正文对比降到 13–14:1；accent 是「光」不是「底色」。
- **工程**：所有排版编译为 flex；所有数据 UI 走 adapter；所有组件遵守「foreground → component → background」三层与受控/非受控契约。
- **体验**：完成反馈、快速捕获、撤销、键盘流优先；拒绝 streak 惩罚、模态嵌套、通知轰炸、假精确。

---

## 2. 研究方法与证据

### 2.1 研究文档

| 主题       | 文件                                                        | 关键产出                                                       |
| ---------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| Material 3 | [material-foundation.md](research/material-foundation.md)   | token 编译产物、50 个颜色角色、组件 anatomy、M3 批评与迁移建议 |
| 组件库痛点 | [pain-points.md](research/pain-points.md)                   | 32 条痛点、159 条证据、API/主题/性能对策                       |
| 用户需求   | [user-needs.md](research/user-needs.md)                     | 需求分层、留存/流失因子、喜欢/不喜欢清单、组件机会             |
| 无障碍     | [accessibility.md](research/accessibility.md)               | 32 个组件 a11y 契约、对比度实算、CI 清单、真实 issue 案例      |
| 视觉语言   | [visual-language.md](research/visual-language.md)           | 12 个标杆拆解、深色科学、编辑排版、完整 token 与组件视觉规范   |
| 数据适配器 | [adapter-architecture.md](research/adapter-architecture.md) | ListAdapter / TreeAdapter、虚拟化数学、选择/勾选模型、基准     |

### 2.2 代码基线

- `npm run build`：通过（2026-10-20 03:33，69 modules，CSS 38.77 kB / JS 348.28 kB gzip 100.58 kB）。
- `npm run lint`：通过；`tsc --noEmit`：通过。
- 现状快照：组件 9 个；`Surface` 已实现三层 + ripple；`Dialog` 使用原生 `<dialog>.showModal()`；`TextInput`/`Select`/`Switch` 仅满足基础用法。

### 2.3 证据限制

- 没有真实用户测试与埋点，用户偏好结论来自公开评论、HN/少数派、NN/g 等二手证据，报告中均标注「推断」。
- Reddit / Trustpilot / App Store 评论正文无法抓取（连接失败或 403），研究文档已声明替代来源。
- 图标目录由他人维护，本报告不审计、不修改；M3 研究未能直连 m3.material.io，数值来自官方 `@material/web` token 编译产物。

---

## 3. 现状审计

### 3.1 组件能力

| 组件         | 已有能力                                | 主要缺口                                                                  |
| ------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| Surface      | 三层、ripple、tone/elevation/shape 初版 | 状态层未接入；`overflow:hidden` 裁焦点环；缺少 `disabled` 语义            |
| Button       | 4 变体、3 尺寸、图标、焦点环            | 无 loading / icon-only 强制可访问名 / tone / ref 透传                     |
| Card         | eyebrow/title/action/tone               | 标题固定 `h3`；整卡可点击时无单主链接方案                                 |
| Badge        | 5 tone                                  | 颜色即语义；数字徽标无上下文；变化不播报                                  |
| Dialog       | 原生模态、Esc、焦点陷阱                 | 无 `aria-modal`、初始焦点只找输入框、backdrop 用 click 判定、关闭标签英文 |
| TextInput    | label/hint 关联、focus-within 边框      | 无 error/`aria-invalid`、无 prefix/suffix/clear/count；对比度不足         |
| Select       | 原生 `<select>`、label 关联             | 仅受控；无 hint/error/required/disabled/分组；下拉不可定制                |
| Switch       | `role="switch"`、受控                   | 无可见 label、无 error/hint、无尺寸                                       |
| ProgressRing | `role="progressbar"`、数值              | 无 `aria-valuetext`；四舍五入造成假精确                                   |
| Arrange      | Stack / Inline / Columns（flex）        | 无 Container、AutoGrid、Masonry；间距硬编码                               |

### 3.2 设计 token 实测

暗色主题（WCAG 2.x 相对亮度公式）：

| 用途             | 实测对比度  | 判定                    |
| ---------------- | ----------- | ----------------------- |
| 正文 / 页面      | 17.86:1     | 通过，但长文有过亮风险  |
| 次要正文 / 面板  | 12.10:1     | 通过                    |
| 辅助文字 / 面板  | 6.23:1      | 通过                    |
| `--faint` / 面板 | 3.27:1      | 仅大字/非文本可用       |
| placeholder 实际 | 2.80:1      | 不通过                  |
| 输入框边框       | 1.63–1.73:1 | 不通过（UI 边界需 3:1） |
| 浅色 `--muted`   | 4.05:1      | 不通过（正文）          |
| 浅色 accent 文字 | 4.19:1      | 不通过（正文）          |

结论：**必须先把 token 修到 AA，再扩组件**；否则每个新组件都会继承同一批缺陷。建议新增 `--control-border: #616b64`、`--text-placeholder: #84938a`、disabled 专用 surface/text，并把正文降到 `#d4dcd5`（约 14:1）减少 halation。

### 3.3 结构性问题

1. token 没有分层（语义色与原始色并列，Badge/Card 把颜色名写进 API）。
2. 没有 z-index scale / Portal / layer 管理，浮层只能各自为战。
3. 没有状态契约（`data-state` / `data-invalid`），CSS 与测试都缺稳定钩子。
4. 没有 adapter，组件内部假设 `T[]`。
5. 排版仍有 4 处 CSS Grid（Surface/Card/Dialog/ProgressRing），与「flex-only」要求冲突。
6. 注释风格不统一，缺少固定的函数/类型文档结构。

---

## 4. 研究结论

### 4.1 Material 3：吸收模型，拒绝皮肤

**应吸收**

- **状态层（state layer）**：hover / focus / press / drag 用统一透明度（建议 0.08 / 0.10 / 0.10 / 0.16），颜色 `currentColor`；状态层放在 background 层，避免文字被染色。
- **颜色角色词表**：primary / secondary / surface-container / outline / error 等角色，映射到现有品牌 token，而不是生成 tonal palette（青柠过 HCT 会掉饱和）。
- **类型比例**：display / headline / title / body / label 五类，配合本项目的「衬线标题 + 无衬线正文 + 等宽元数据」三声部。
- **形状与动效 token**：radius 6/10/14/22/32 + pill；duration 140/220/320 ms；曲线 standard / decelerate / accelerate。
- **触控与焦点**：视觉 32–40 px，命中区 ≥44 px（coarse 48）；焦点环 2–3 px + 外置 offset，暗色下加 halo。
- **组件 anatomy**：button / text field / chip / segmented button / switch / slider / progress / tabs / menu / dialog / snackbar / tooltip / card / list / navigation / FAB 的分层与状态。

**应拒绝**

- `surface-tint` 已废弃：层级用 surface-container 阶梯，不用阴影堆叠（暗色黑色 30% 叠在卡片上实测 1.04:1）。
- 大面积 tonal 色块与紫粉渐变，会破坏深色编辑风。
- 5 档按钮尺寸、spring、shape morph、wavy progress 等 Expressive 花活。
- 把 Material 的视觉指纹直接搬过来（阴影、圆角、字体、动效过密）。

**组件优先级（M3 研究的评分结果）**：StateLayer、List(adapter)、Field+TextInput、Chip、Checkbox、Radio、IconButton、Menu/Popover、Tooltip 为 P0；Tabs、Toast、Spinner、Badge 扩展、Segmented、Slider、NavRail 为 P1；Combobox、DatePicker、DataTable、BottomSheet 为 P2。

### 4.2 组件库的真实痛点

| 痛点                           | 证据要点                                                                                          | 对策                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 主题闪烁（FOUC）               | Josh Comeau 复盘、Bootstrap#28449、AntD#45567                                                     | `index.html` 首屏阻塞脚本写 `data-theme`，跟随系统偏好        |
| 浮层层级/点击穿透              | shadcn#9712：Dialog 内下拉可见但点不中                                                            | Portal + z-index scale + `useDismiss` + `useAnchoredPosition` |
| 半受控 API                     | Select/Switch 目前仅受控，状态管理强加给调用方                                                    | `value`/`defaultValue`/`onValueChange` 统一                   |
| 主题定制困难 / CSS-in-JS 开销  | MUI `sx` 基准 296 ms vs 100 ms；Emotion 首开 300 ms–3 s；bundle gzip MUI 149.4 KB / antd 453.7 KB | 纯 CSS + token，不引入运行时样式方案                          |
| a11y 后补代价高                | AntD a11y 总 issue 6 年未关（26👍）；Bootstrap 暗色返工 76 条评论                                 | 每个组件先写 APG 契约，再写实现                               |
| 对比度不足                     | WebAIM 2026：低对比 83.9%、缺表单标签 51%                                                         | token 实算 + CI 门禁                                          |
| 数字输入/IME                   | React IME #8683；GOV.UK 数字输入研究                                                              | 组合事件守卫、`inputmode`、精度/范围/格式化明确               |
| 组件 API 布尔爆炸 / 组合能力弱 | 32 条痛点中的 API 组                                                                              | 联合类型 + 组合式子组件（Menu.Item / Tabs.List / Table.Row）  |

**十条可检查的硬约束**（节选）：先修 token 再加组件；禁止半受控；浮层必须 Portal；禁止裸 `outline:none`；所有交互组件过五项门禁（可访问名、键盘全路径、Esc、焦点归还、≥24×24）；禁用色不得单独表意；暗色/亮色都要过 AA；动画尊重 reduced-motion；表单错误必须关联；每个交互组件必须有可访问名。

### 4.3 用户需求：低摩擦回路

用户留下来不是因为功能多，而是因为「捕获 → 看见 → 完成 → 反馈」这条回路足够顺：

- **快速捕获**：Things Quick Entry 用 `Ctrl+Space` 全局唤起，`Esc` 丢弃、`Cmd+Enter` 保存；「可放弃」与「可保存」同等重要。
- **完成反馈**：完成任务的「叮」声、打勾带来的「我做了很多事」的满足感，是本品类 ROI 最高的微交互；但必须可关闭、不过度。
- **Streak 是双刃剑**：7 天是损失厌恶临界点，断签清零会造成弃用；必须提供 freeze / 补记 / 暂停。
- **计划可信度 > 精美度**：日程（承诺）与待办（意愿）需要不同视觉语言；把一切塞进日历会放大预估错误。
- **通知是负资产**：NN/g 记录用户日均 56 条通知；限 1–2 条/天，锚定用户自己的时刻。
- **中文工程需求**：周一开始（CLDR/ISO 8601）、`YYYY年M月D日`、节气按太阳黄经 15°、IME 组合期不得提交、clreq 的 1/4 em 中西文间距。

**用户喜欢**：即时反馈、乐观更新、撤销、键盘优先、密度可选、清晰焦点、克制动效、可预测交互、良好空状态。
**用户不喜欢**：过多动效、低对比灰字、模态嵌套、层级过深、状态不明确、点击目标过小、假精确、破坏性操作无撤销、表单报错不清、加载闪烁。

**组件机会（S 级）**：Checkbox（完成动效 + 撤销）、QuickAdd、CommandPalette、Progress、StreakBadge、TimelineDay、EmptyState、UndoBar。

### 4.4 无障碍：先把地基打对

- **对比度**：`--line-strong` 合成后仅 1.67:1，`--faint` 3.27，disabled 按钮文字 3.50，`--accent-soft` 选中底 1.42；建议改用 `--control-border #616b64`、`--text-placeholder #84938a`、disabled 专用 surface/text。
- **Dialog 六项必修**：`aria-modal`、`aria-describedby`、初始焦点策略、backdrop pointerdown 起点判定、body 滚动锁、关闭按钮本地化标签。
- **Button**：ref 透传；icon-only 必须有可访问名；焦点环改 `outline + halo` 兼容 forced-colors。
- **焦点**：统一 `:focus-visible` 双环；禁止裸 `outline:none`；`scroll-padding` 防固定头遮挡。
- **颜色不单独表意**：lime / mint / amber 在红绿色弱模拟下亮度比仅 1.21–1.30，状态必须加图标/文本/形状。
- **原生优先**：能用 `<button>/<input>/<select>/<dialog>` 就不写 ARIA；每个交互组件过五道门禁。
- **CI**：对比度单测 + axe serious/critical 归零 + Playwright 键盘断言。

### 4.5 视觉语言：深色高级感的 80%

1. **层级用亮度阶梯**：`#080b09 → #0e1411 → #141b18 → #18221e → #1d2824`（ΔL\*≈3）；阴影只用于浮层分离。
2. **三档描边**：白 8% / 12% / 18%，配顶边 1px 白 6% 内高光；3:1 的控件边界交给 focus ring 与高对比主题。
3. **正文降对比**：17.6:1 只给标题；正文 `#d4dcd5`（14.1:1）；`#7e8b81`（5.55:1）为绝对下限；字号下限 13px、等宽全大写 11px。
4. **accent 是强光不是底色**：`#c9f36d` 对 `#080b09` 15.56:1；面积 ≤12%，每屏 glow ≤1，删掉 Button 的 135° 渐变。
5. **圆角同心公式**：内 = 外 − padding，下限 6px；5 档 6/10/14/22/32 + pill。
6. **动效收敛**：5 档时长（常用 80–280 ms）+ 3 条曲线；交互反馈 ≤160 ms，进场 ≤280 ms；替换现有 37 处裸 `ease`。
7. **反 AI 感**：删紫蓝渐变、玻璃堆叠、无意义 glow、每块都发光、全大写长句；每屏只留一个视觉焦点。
8. **主题切换**：暗色默认，亮色修 AA（`--muted #55625a` 5.62、accent `#4f6b12` 5.35、`--faint #5f6b61` 4.90）。

### 4.6 数据适配器：组件只认接口

**原则**：`items: T[]` 不应进入组件 props；组件永远只拿 `ListAdapter` / `TreeAdapter`。

```ts
interface ListAdapter<T> {
    readonly size: number;
    getKey(index: number): string;
    getItem(index: number): T;
    getEntry(index: number): ListEntry<T>;
    indexOf(key: string): number; // O(1)，未找到返回 -1
    getRange(start: number, end: number): readonly ListEntry<T>[];
    readonly keys: readonly string[];
}

interface TreeAdapter<T> {
    readonly size: number;
    readonly roots: readonly string[];
    getItem(key: string): T;
    getParentKey(key: string): string | null;
    getChildren(key: string | null): readonly string[];
    getPath(key: string): readonly string[];
    getLevel(key: string): number;
    isExpandable(key: string): boolean;
    flatten(expandedKeys: ReadonlySet<string>): ListAdapter<T>; // 可见序列
}
```

配套：

- `createListAdapter(items, options)` / `createTreeAdapter(roots, options)` / `createLevelAdapter(rows)` / `createVirtualAdapter(base, options)`。
- 选择：`toggleSelection(mode, keys, key)`、`selectRange(adapter, keys, anchor, target)`、`selectOnly`；锚点留在组件内部。
- 勾选：`checkedKeys` 只存全选节点，半选派生；`getCheckState` / `toggleCheck` 级联，disabled 阻断传导。
- 虚拟化：`getWindow(scrollTop, viewport)` 纯数学，DOM/测量留在组件；阈值 100 行。
- 依赖方向：`structure → adapter → component`；adapter 不 import React。
- 组件接入：`<Table adapter={...} columns={...} />`、`<TreeView adapter={...} />`；`options` 糖衣内部立刻转 adapter。

### 4.7 排版与代码规范

- **flex-only**：禁止 `display: grid` / `grid-template` / `grid-area` / `place-items`；一维用 flex，等分用 `flex: 1 1 0`，重叠用 absolute；表格/日历/瀑布流都拆成一维 flex。
- **标识符禁止下划线**：常量 PascalCase（`NullHash`），变量/函数 camelCase；ESLint `naming-convention` 强制。
- **`(void 0)` 必须带括号**：自定义规则 `periodicity/void-zero-parens` 强制，可自动修复。
- **注释**：英式英语、简明；函数/方法 = 简介 + `@param` + `@example` + `@returns`；interface/type/class = 简介 + `Type:` + 字段/构造参数 + `@example`。
- **Prettier 不处理 TS/TSX**：Prettier 会删除 `(void 0)` 的括号，与项目标准冲突；ESLint 是唯一风格标准。

### 4.8 数据结构层：node → tree → map / set

`src/structure/` 已经按「节点 → 树 → 容器」三层落地，全部使用委托、禁止 `class extends`：

- **hash**：`bigint` 带标签哈希（null/boolean/number/string/bigint/symbol/object/tuple）。四个私有 LRU 容器（`LeastRareUsageList`、`LeastRareUsageSet`、`WeakLeastRareUsageList`、`WeakLeastRareUsageSet`）由 `useHash` 维护注册；`unregisterHash(target)` 负责卸载，重新哈希会得到新的身份。symbol 注册上限 4096，对象/函数走弱引用、不阻止 GC。
- **node**：`Node<K,V>`（key/value/缓存 hash）与 `LinearNode`、`BinaryNode`、`RedAndBlackNode`、`BPlusNode`、`TrieNode`、`SegmentNode` 七类节点，均为独立类，通过组合被树使用。
- **tree**：`LinearTree`（双向链表 + 自建桶哈希索引）、`BinarySearchTree`、`RedBlackTree`、`BPlusTree`（叶子 `next` 链、分裂/借位/合并）、`Trie`、`SegmentTree`。比较器统一来自 `src/structure/compare.ts`。
- **map**：`OrderedMap` 委托 `LinearTree`（插入顺序）；`UnorderedMap` 自建 2 的幂桶 + `LinearNode` 链（不使用原生 Map/Set）；`OrderedSkipMap` 委托 `BPlusTree`（有序 + `slice`）；`ConcurrentOrderedMap` / `ConcurrentUnorderedMap` 委托对应 map 并提供独立 `snapshot()`。
- **set**：`OrderedSet` / `UnorderedSet` 委托对应 map（值为 `true`）；`OrderedSkipSet` / `ConcurrentUnorderedSkipSet` 委托 skip map；并发版本提供 `snapshot()`。
- `src/structure/index.ts` 统一导出；`map`、`set`、`tree` 各自有桶文件。节点与树均通过运行时随机增删/结构校验测试，map/set 通过快照独立性与排序/去重测试。

---

## 5. 设计原则（可验收）

1. **内容优先**：背景/装饰不得压过内容；每屏一个视觉焦点。
2. **七态齐全**：default / hover / focus-visible / active / selected / disabled / loading / invalid。
3. **单一模态**：一次只开一个模态；浮层 Esc/点外关闭并归还焦点。
4. **数据走 adapter**：集合类组件不接受裸数组作为唯一入口。
5. **排版走 flex**：无 Grid；重叠用 absolute。
6. **动效服务因果**：140–320 ms；尊重 `prefers-reduced-motion`。
7. **无障碍默认值**：可访问名、键盘全路径、焦点可见、对比度 AA。
8. **密度与触控**：视觉紧凑，命中区 ≥44 px；移动端 hover-only 不可用。
9. **可撤销**：破坏性操作有确认或 undo；错误可修正。
10. **不发明新视觉语言**：一切复用 token 与 Surface 三层。

---

## 6. 架构设计

### 6.1 目录

```
src/
├── adapter/
│   ├── list/{adapter,list,level,virtual}/
│   └── tree/{adapter,check,select,virtual}/
├── structure/
│   ├── hash/{hash.ts,index.ts}
│   └── validation.ts
├── arrange/                 # Stack / Inline / Columns（flex）
└── component/
    ├── foundation/          # tokens, cx, Portal, Field, hooks
    ├── background/          # Backdrop
    ├── foreground/          # StateLayer
    ├── surface/             # Surface
    ├── button/              # Button + IconButton
    ├── input/{text,check,radio,switch,range,number,email,telephone}/
    ├── picker/{select,color,datetime,time,variant}/
    ├── dialog/{confirm,message,input}/
    ├── {popover,tooltip,menu,toast,tabs,list,table,tree,chip,...}/
    └── index.ts             # 统一导出
```

### 6.2 分层模型

```
.surface
├── background（装饰 + state layer，pointer-events:none）
├── component（真实内容与交互）
└── foreground（边缘高光 + ripple，pointer-events:none）
```

- **state layer 放 background**：不污染文字；整卡选中/强调态用 foreground 的 `state-layer--active`。
- Surface 必须支持 `tone / elevation / shape / stateLayer / disabled / ref`。
- 组件不得把文本放进 background/foreground；装饰必须 `aria-hidden`。

### 6.3 Token 分层

```
品牌原语（index.css） → 语义 token（tokens.css） → 组件 token（组件 CSS 局部变量）
```

- 语义：`--surface-0..4`、`--control-border`、`--text-placeholder`、`--state-*`、`--elevation-*`、`--duration-*`、`--z-*`、`--focus-ring-*`。
- 组件只消费语义 token；tone 通过 `.tone-accent` 等类注入 `--tone / --tone-soft / --tone-ink`。
- 主题：`:root[data-theme="light"]` 覆盖语义层；`index.html` 首屏脚本防闪烁。

### 6.4 组件 API 契约

- 受控/非受控：`value` / `defaultValue` / `onValueChange`；布尔用 `checked` / `defaultChecked` / `onCheckedChange`。
- `size?: "sm" | "md" | "lg"`；`tone?: "neutral" | "accent" | "mint" | "violet" | "amber" | "danger"`。
- React 19：`ref` 作为普通 prop，不写 `forwardRef`；`useId` 生成 id。
- `className` 用 `cx` 合并；不覆盖调用方类名。
- 组合优先：`Menu.Item`、`Tabs.List`、`Table.Row`；避免布尔爆炸。
- 事件：`onValueChange` / `onCheckedChange` / `onOpenChange` / `onSelect`；原生事件保持原名。

### 6.5 无障碍基础设施

- `VisuallyHidden`、`Portal`、`useFocusTrap`、`useDismiss`、`useAnchoredPosition`、`useRovingTabIndex`、`useControllableState`、`useField`。
- Dialog 必须补 `aria-modal`、描述、初始焦点、滚动锁；Toast 用 `role="status"`；确认用 `role="alertdialog"`。
- 颜色不得单独表意；焦点环双环；触控 ≥44 px。

### 6.6 质量门禁

| 门禁   | 命令/方式                               | 阈值                              |
| ------ | --------------------------------------- | --------------------------------- |
| 类型   | `npx tsc -p tsconfig.app.json --noEmit` | 0 error                           |
| Lint   | `npm run lint`                          | 0 error（含自定义风格规则）       |
| 格式   | `npx prettier --check .`                | 通过（TS 由 ESLint 负责）         |
| 构建   | `npm run build`                         | 通过                              |
| 排版   | grep `display: grid` 等                 | 0 命中                            |
| 对比度 | token 脚本（待补）                      | 正文 ≥4.5、控件边界 ≥3            |
| a11y   | axe serious/critical（待补）            | 0                                 |
| 键盘   | Playwright（待补）                      | Tab/Esc/方向键/焦点归还全路径通过 |

---

## 7. 组件矩阵

### 7.1 P0（地基与高频）

| 组件                           | 目录                            | adapter     | 依赖            | 备注                                 |
| ------------------------------ | ------------------------------- | ----------- | --------------- | ------------------------------------ |
| tokens / theme                 | foundation                      | —           | —               | 先修对比度，再扩组件                 |
| Surface + StateLayer           | surface / foreground            | —           | —               | tone/elevation/shape/disabled/ref    |
| Button + IconButton            | button                          | —           | Surface         | loading/icon-only/tone/ref           |
| Field / FieldGroup             | foundation                      | —           | —               | label/hint/error/counter/required    |
| TextInput / TextArea           | input/text                      | —           | Field           | prefix/suffix/clear/count/error/size |
| NumberInput                    | input/number                    | —           | Field           | 精度/范围/step/IME                   |
| EmailInput / TelephoneInput    | input/email, telephone          | —           | Field           | inputmode/校验/格式化                |
| Checkbox                       | input/check                     | —           | Field           | 三态/完成动效/撤销                   |
| RadioGroup                     | input/radio                     | —           | FieldGroup      | roving tabindex                      |
| Range / Slider                 | input/range                     | —           | Field           | 单/双滑块、刻度                      |
| Switch                         | input/switch                    | —           | Field           | 可见 label/size/error                |
| Select                         | picker/select                   | ListAdapter | Field           | 受控/非受控、分组、hint/error        |
| Combobox                       | picker/select 或 input/complete | ListAdapter | Popover         | APG combobox                         |
| SegmentedButton                | picker/variant                  | —           | —               | 单选/多选                            |
| ColorPicker                    | picker/color                    | —           | Popover         | swatch/hex/原生回退                  |
| Chip                           | chip                            | —           | Surface         | filter/input/assist                  |
| Text / Heading                 | text                            | —           | —               | 类型比例、tone、truncate             |
| Divider                        | divider                         | —           | —               | 水平/垂直/带文字                     |
| Avatar / AvatarGroup           | thumb                           | —           | —               | 图片/首字母/状态                     |
| Progress / Spinner             | progress                        | —           | —               | 线性/环形/不确定                     |
| Skeleton                       | skeleton                        | —           | —               | 文本/圆形/矩形                       |
| EmptyState                     | empty                           | —           | —               | 说明 + 学习线索 + 主行动             |
| Card（扩展）                   | card                            | —           | Surface         | interactive/media/headingLevel       |
| Badge（扩展）                  | badge                           | —           | —               | dot/count/role                       |
| Popover                        | popover                         | —           | Portal          | 锚点/翻转/关闭                       |
| Tooltip                        | tooltip                         | —           | popover         | hover/focus、延迟                    |
| Menu                           | menu                            | —           | popover         | 键盘/分组/快捷键                     |
| Toast                          | toast                           | —           | Portal          | live region/队列/撤销                |
| Tabs                           | tabs                            | —           | —               | roving/键盘/溢出                     |
| List                           | list                            | ListAdapter | —               | 选择/虚拟化                          |
| Table                          | table                           | ListAdapter | —               | 排序/选择/粘性表头                   |
| TreeView                       | tree                            | TreeAdapter | —               | 展开/勾选/键盘                       |
| Confirm/Message/Input Dialog   | dialog/*                        | —           | Dialog          | 焦点/描述/危险操作                   |
| Drawer / Sheet                 | layout/drawer                   | —           | Portal/Backdrop | 焦点陷阱/滚动锁                      |
| Alert / Banner                 | alert                           | —           | —               | 语义色 + 图标 + 行动                 |
| DatePicker / TimePicker        | picker/datetime,time            | —           | Popover         | 日历键盘/时区                        |
| CommandPalette                 | command                         | ListAdapter | Dialog/Portal   | 键盘优先                             |
| Container / AutoGrid / Masonry | layout/*                        | —           | —               | flex-only                            |
| Kbd                            | kbd                             | —           | —               | 快捷键提示                           |

### 7.2 P1

Accordion、Breadcrumbs、Pagination、Stepper、NavigationBar/Rail、Toolbar、SplitPane、Timeline、InlineEdit、UndoBar、SearchField、NaturalDateInput、WeekStrip。

### 7.3 P2

VirtualTable/List（默认虚拟化）、DragSort、RichText、Charts、i18n/RTL、Density 切换、ThemeBuilder、Storybook、视觉回归。

---

## 8. 实施计划

| 波次     | 内容           | 产出                                                                                         | 状态                   |
| -------- | -------------- | -------------------------------------------------------------------------------------------- | ---------------------- |
| Wave 0   | 规则与数据结构 | ESLint/Prettier 标准、`hash.ts`、`unregisterHash`、`validation.ts`                           | 已完成                 |
| Wave 0.5 | 设计地基       | tokens 修复、Surface/Button/Field/StateLayer、Portal/hooks、flex 改造                        | 初版已有，待按报告重构 |
| Wave 1   | 表单与内容     | inputs、pickers、Chip、Text、Avatar、Progress、Skeleton、EmptyState                          | 待开始                 |
| Wave 2   | 浮层与导航     | Popover/Tooltip/Menu/Toast、Tabs/Accordion/Breadcrumbs/Pagination、Dialog 家族、Drawer/Alert | 待开始                 |
| Wave 3   | 数据与时间     | List/Table/TreeView + adapter、Date/TimePicker、CommandPalette、Layout                       | 待开始                 |
| Wave 4   | 集成与验收     | 统一导出、演示页、文档、axe/对比度/键盘门禁                                                  | 待开始                 |

**并行约束**：`src/component/icon/**` 只读；每个子代理只写自己的模块目录；不跑 `vite build`（避免 dist/tsbuildinfo 冲突）；用 `tsc --noEmit` + `eslint` 自检。

---

## 9. 验收标准（DoD）

每个组件：

1. 文件：`Component.tsx` + `Component.css` + `index.ts`；只使用 token。
2. API：受控/非受控、size/tone、ref、className 合并、组合子组件。
3. 七态视觉 + `prefers-reduced-motion`。
4. APG 契约：role/属性/键盘/焦点管理/屏幕阅读器文本。
5. 暗色与亮色均通过对比度；不靠颜色单独表意。
6. `tsc` / `eslint` / `prettier --check` / `npm run build` 全绿。
7. 英文 JSDoc：简介 + `@param` + `@example` + `@returns`（类型/类加 `Type:`）。
8. 无 Grid、无下划线标识符、`(void 0)` 带括号。

---

## 10. 风险与不做

| 风险/边界          | 说明                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| 图标目录并行维护   | 只读使用，不修改；`IconName` 变化可能导致构建失败，需重试              |
| 无测试框架         | 目前只有 tsc/lint/build；axe/Playwright 需后续引入                     |
| Prettier 不处理 TS | 因 `(void 0)` 括号无法配置；格式由 ESLint + 人工保证                   |
| symbol 注册淘汰    | 4096 上限，淘汰后重新哈希会变身份；需要稳定哈希的场景应避免 unregister |
| 无 SSR             | Portal 用 `canUseDOM` 守卫；未来 SSR 需重新评估                        |
| 不做               | 图表库、富文本、拖拽排序、i18n/RTL、主题编辑器、Storybook（P2）        |

---

## 11. 参考

**研究文档**

- [Material 3 研究](research/material-foundation.md)
- [组件库痛点研究](research/pain-points.md)
- [用户需求研究](research/user-needs.md)
- [无障碍研究](research/accessibility.md)
- [视觉语言研究](research/visual-language.md)
- [数据适配器研究](research/adapter-architecture.md)

**标准与官方文档**

- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.2 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [Material Design 3](https://m3.material.io/)
- [TanStack Table Row Models](https://tanstack.com/table/latest/docs/guide/row-models)
- [React Aria Collections](https://react-spectrum.adobe.com/v3/collections.html)
- [Linear: How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Vercel Geist Colors](https://vercel.com/geist/colors)
- [WebAIM Million](https://webaim.org/projects/million/)
- [NN/g: Dark Mode Users' Issues](https://www.nngroup.com/articles/dark-mode-users-issues/)
- [NN/g: Empty-State Interface Design](https://www.nngroup.com/articles/empty-state-interface-design/)
- [NN/g: Push Notifications](https://www.nngroup.com/articles/push-notification/)
- [Things Quick Entry](https://culturedcode.com/things/support/articles/2249437/)
- [Josh Comeau: Perfect Dark Mode](https://www.joshwcomeau.com/react/dark-mode/)
- [Bootstrap dark mode PR #28449](https://github.com/twbs/bootstrap/pull/28449)
- [W3C clreq（中文排版需求）](https://www.w3.org/TR/clreq/)

> 说明：本报告中的组件清单与顺序来自上述研究的交叉验证；具体数值（对比度、L\*、耗时、bundle 大小）以研究文档中的实测与来源为准。所有「推断」均在研究文档中显式标注。
