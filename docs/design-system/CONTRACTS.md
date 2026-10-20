# Periodicity UI — 组件实现契约 v1

> 所有实现子代理必须先读完本文件，再读 `docs/report.md` 中对应模块章节。
> 本文件是硬约束；与个人偏好冲突时以本文件为准。

---

## 0. 绝对边界（违反即返工）

| 规则           | 说明                                                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 不碰图标       | `src/component/icon/**` 由其他人并行修改。只允许 `import Icon, { type IconName } from "../icon/Icon"` 只读使用。禁止新增/修改/删除图标文件。                                  |
| 不碰共享文件   | `src/index.css`、`src/App.tsx`、`src/App.css`、`src/main.tsx`、`src/component/index.ts`、`docs/**`、`vite.config.ts`、`package.json` 由主代理维护。只写自己模块目录内的文件。 |
| 不加依赖       | 不执行 `npm/pnpm install`，不引入第三方包。只用 React 19 + 原生 DOM。                                                                                                         |
| 不跑构建       | 不执行 `npm run build` / `vite build`（会写 dist 与 tsbuildinfo，和并行代理冲突）。校验用 `npx tsc -p tsconfig.app.json --noEmit` 与 `npx eslint <自己文件>`。                |
| 不改别人的模块 | 每个文件只有一个所有者。需要共享能力时，在报告里说明，不要直接改 foundation。                                                                                                 |
| 不用 CSS Grid  | 见 §1。                                                                                                                                                                       |
| 不留 TODO      | 不提交半成品、注释掉的代码、`console.log`、未使用变量。                                                                                                                       |

---

## 1. 排版：一律 flex 表达（硬约束）

项目要求「所有排版属性编译为 flex 表达」。因此：

1. **禁止** `display: grid` / `inline-grid`、`grid-template-*`、`grid-area`、`place-items`、`place-content`、`grid-auto-*`、`float`、`display: table*`。
2. 一维排列用 `display: flex` / `inline-flex`；换行用 `flex-wrap`；等分用 `flex: 1 1 0` + `min-width: 0`；比例用 `flex: <grow> 1 <basis>`。
3. 重叠/覆盖层用 `position: absolute; inset: 0`（父级 `position: relative`），不要用 grid 叠层。
4. 二维视觉（表格、日历、瀑布流）也拆成一维 flex：表格 = 若干 flex row；日历 = `flex-wrap` 的 7 列（`flex: 1 1 calc(100% / 7)`，`min-width: 0`）；瀑布流 = N 个 flex column 容器。
5. 语义化的 `<table>` 不使用 `display: table` 系列；数据表格用 `role="table"/"row"/"columnheader"/"cell"` + flex 布局，键盘与读屏契约见 §6。
6. 现有 `Surface`、`Card`、`Dialog`、`ProgressRing` 的 grid 写法由主代理统一改为 flex；子代理不要复制 grid 写法。
7. 提交前自检：`npx eslint <files>` 通过，且 `Select-String -Pattern "display:\s*(inline-)?grid|grid-template|grid-area|place-items" <files>` 无结果。

---

## 2. 分层模型：foreground → component → background

每个可视组件都建立在一个 `Surface` 上（不要求每个原子组件都包 Surface，但凡有容器背景/状态层的都必须）：

```
.surface
├── .surface__background   z-index 0，pointer-events:none
│   ├── {background}       静态视觉：wash / gradient / grid lines / texture / hero orbit
│   └── .state-layer       hover / press / focus 状态层（Material state layer）
├── .surface__component    z-index 1，真实内容与可交互元素
└── .surface__foreground   z-index 2，pointer-events:none
    ├── {foreground}       描边高光 / 装饰线条 / 角标
    └── .surface__ripple   repple 波纹（由 Surface 管理）
```

使用规则：

- **background**：只放纯装饰、不可交互、`aria-hidden`。渐变、噪点、光晕、网格、progress 轨道、图片底衬。
- **component**：可聚焦、可点击、可被读屏读取的内容。所有事件处理绑定在这一层。
- **foreground**：状态反馈（hover/press/focus 叠色、ripple）、边缘高光、悬浮装饰。必须 `pointer-events: none`，不得承载交互。
- 状态层颜色用 `--state-layer-color`（默认 `currentColor`），透明度用 token（`--state-hover-opacity` 等），不要每处写死。
- 不允许把文本放进 background/foreground；装饰元素必须 `aria-hidden="true"`。

`Surface` 扩展后的 API（由 foundation 提供，子代理直接使用）：

```tsx
<Surface
    tone="accent"            // neutral | accent | mint | violet | amber | danger
    elevation={1}            // 0 | 1 | 2 | 3
    shape="md"               // xs | sm | md | lg | pill
    stateLayer               // 在 background 层挂 .state-layer
    ripple="foreground"      // background | foreground | false
    background={<span className="foo__wash" />}
    foreground={<span className="foo__edge" />}
    className="foo"
    contentClassName="foo__content"
    ref={ref}                // React 19：ref 作为普通 prop
    onPointerDown={...}
>
    {children}
</Surface>
```

---

## 3. 工程规范

### 3.1 TypeScript / React

- 全部函数组件写成 `const X: FC<XProps> = (props: XProps) => ...`；**所有**变量、参数、解构、返回值显式标注类型（ESLint `@typescript-eslint/typedef` 为 error）。
- 箭头函数 only；禁止 `function` 声明/表达式。
- 禁止字面量 `undefined`，必须写 `(void 0)`（带括号，自定义 ESLint 规则 `periodicity/void-zero-parens` 强制）；禁止 `String()` / `.toString()`，用模板字符串。
- 标识符禁止下划线（`@typescript-eslint/naming-convention`）：常量用 PascalCase（如 `NullHash`），变量/函数用 camelCase；不使用 `UPPER_SNAKE_CASE`。
- 双引号、分号、4 空格；行宽标准 120。Prettier 不负责 TS/TSX（它会删掉 `(void 0)` 的括号），ESLint 是唯一风格标准。
- `verbatimModuleSyntax`：类型导入必须 `import type { ... }`。
- `erasableSyntaxOnly`：禁止 `enum`、`namespace`、参数属性；用 `as const` 对象 + 联合类型。
- React 19：不写 `forwardRef`；`ref?: Ref<HTMLDivElement>` 作为 props 透传。`useId` 生成 id。
- 每个组件默认导出组件；类型命名导出。模块目录加 `index.ts` 桶文件：
    ```ts
    export { default as Checkbox } from "./Checkbox";
    export type { CheckboxProps } from "./Checkbox";
    ```
- 组件文件只 import 自己的 CSS 与 foundation / adapter；不要 import 其它业务模块的 CSS。

### 3.4 注释规范（强制）

英文（英式拼写），简明扼要，不写中文 JSDoc。

**函数 / 方法 / 组件：**

```ts
/**
 * Reads the value for `key` and marks it as most recently used.
 * @param key - Key to look up.
 * @example
 * const value = instance.get(key);
 * @returns The stored value, or (void 0) when absent.
 */
```

- 第一行：一句话说明做什么，句号结尾。
- 每个参数一个 `@param name - description.`。
- 必须有 `@example` 与可复制的调用示例（方法与组件用 `instance.method(...)` / `<Component />`）。
- 必须有 `@returns`；无返回值写 `Nothing.`。
- 私有方法同样适用。

**interface / type / class：**

```ts
/**
 * Internal entry for the strong least-recently-used registry.
 * Type: interface.
 * @param key - Key of the entry.
 * @example
 * const entry: UsageEntry<string, number> = { key: "a", value: 1, usedAt: 1n };
 */
```

- 第一行简介；第二行 `Type: interface | type | class.`。
- 类型字段或类构造参数用 `@param` 逐项说明；必须有 `@example`。
- 不复述显而易见的代码，不写空话。

### 3.2 CSS

- BEM，块名 = 组件 kebab-case：`.chip`、`.chip__label`、`.chip--selected`。
- 只使用 token（§4）+ 以下允许的字面量：`rgba(255,255,255,α)` 高光、`rgba(0,0,0,α)` 阴影、`0`、`100%`、`1px`、`999px`、`currentColor`、`transparent`、`inherit`。
- 禁止组件内新增 `:root` 变量；需要新 token 在交付说明里列出，由主代理加入 `tokens.css`。
- 过渡/动画必须用 motion token；每个动画都要有 `@media (prefers-reduced-motion: reduce)` 降级。
- 不写 `!important`；不使用 `*` 选择器；不覆盖全局元素样式。
- 交互态齐全：`:hover`、`:focus-visible`、`:active`、`:disabled`/`[aria-disabled="true"]`、`[data-invalid="true"]`。
- 暗色/亮色都成立：只用语义 token，不假设背景是黑的。
- 移动端：触控目标 ≥ 44×44（可用伪元素扩大命中区），`@media (pointer: coarse)` 处理 hover-only 问题。

### 3.3 文件结构

```
src/component/<block>/
├── <Block>.tsx        组件实现
├── <Block>.css        样式
├── <Sub>.tsx          可选的子组件（同模块）
└── index.ts           导出
```

---

## 4. Token（由 `src/component/foundation/tokens.css` 提供）

子代理**只能使用**下列 token（以及既有品牌 token）：

### 4.1 既有品牌 token（`src/index.css`）

```
--bg --bg-deep --panel --panel-strong --panel-muted
--text --text-soft --muted --faint
--line --line-strong
--accent --accent-strong --accent-soft --accent-ink
--mint --mint-soft --violet --violet-soft --amber --amber-soft --danger --danger-soft
--radius-xs --radius-sm --radius-md --radius-lg --radius-pill
--shadow-sm --shadow-lg
--font-sans --font-display --font-mono
```

### 4.2 新增 token

| 组   | token                                                                                                                                                           | 值                                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 间距 | `--space-2xs` … `--space-3xl`                                                                                                                                   | 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px（`xs=4, sm=8, md=16, lg=24, xl=40` 沿用现有语义） |
| 字号 | `--type-display` `--type-h1` `--type-h2` `--type-h3` `--type-h4` `--type-body-lg` `--type-body` `--type-body-sm` `--type-label` `--type-label-sm` `--type-mono` | clamp / rem 阶梯                                                                             |
| 行高 | `--leading-tight` `--leading-snug` `--leading-normal` `--leading-relaxed`                                                                                       | 1.1 / 1.25 / 1.5 / 1.65                                                                      |
| 字距 | `--tracking-tight` `--tracking-normal` `--tracking-wide` `--tracking-widest`                                                                                    | -0.02em / 0 / 0.08em / 0.16em                                                                |
| 控件 | `--control-sm` `--control-md` `--control-lg`                                                                                                                    | 32 / 42 / 52 px 高度                                                                         |
| 触控 | `--touch-target`                                                                                                                                                | 44px                                                                                         |
| 状态 | `--state-hover-opacity` `--state-press-opacity` `--state-focus-opacity` `--state-drag-opacity` `--state-disabled-opacity`                                       | 0.07 / 0.12 / 0.10 / 0.16 / 0.45                                                             |
| 海拔 | `--elevation-1` … `--elevation-3`                                                                                                                               | 边框内高光 + 软阴影                                                                          |
| 焦点 | `--focus-ring-width` `--focus-ring-offset`                                                                                                                      | 2px / 2px                                                                                    |
| 动效 | `--duration-fast` `--duration-medium` `--duration-slow` `--ease-standard` `--ease-decelerate` `--ease-accelerate` `--ease-spring`                               | 140 / 220 / 320ms + 曲线                                                                     |
| 层级 | `--z-dropdown` `--z-overlay` `--z-modal` `--z-toast` `--z-tooltip`                                                                                              | 200 / 300 / 400 / 500 / 600                                                                  |
| 尺寸 | `--measure-prose`                                                                                                                                               | 68ch                                                                                         |

---

## 5. Foundation API（`src/component/foundation/**`，主代理维护，直接 import）

```ts
// cx
export const cx: (...parts: readonly (string | false | null | void)[]) => string;

// 容器
export { default as Portal } from "./Portal"; // createPortal(document.body)
export { default as VisuallyHidden } from "./VisuallyHidden";
export { default as Field } from "./Field";
export { default as FieldGroup } from "./FieldGroup";
export { default as StateLayer } from "./StateLayer";
export { default as Backdrop } from "../background/Backdrop";

// hooks
export const useControllableState: <T>(options: {
    value?: T;
    defaultValue: T;
    onChange?: (next: T) => void;
}) => readonly [T, (next: T | ((prev: T) => T)) => void];

export const useField: (options: {
    id?: string;
    hint?: ReactNode;
    error?: ReactNode;
    required?: boolean;
    label?: ReactNode;
}) => {
    controlId: string;
    hintId: string;
    errorId: string;
    describedBy: string; // "hint error" 或 ""
    invalid: boolean;
    fieldProps: FieldProps; // 直接 spread 到 <Field {...field.fieldProps}>
};

export const useDismiss: (options: {
    enabled?: boolean;
    refs: readonly RefObject<HTMLElement | null>[];
    onDismiss: () => void;
    escape?: boolean;
}) => void;

export const useAnchoredPosition: (
    anchorRef: RefObject<HTMLElement | null>,
    floatingRef: RefObject<HTMLElement | null>,
    options?: { placement?: Placement; offset?: number; padding?: number; matchWidth?: boolean },
) => { style: CSSProperties; placement: Placement; update: () => void };

export const useFocusTrap: (
    ref: RefObject<HTMLElement | null>,
    active: boolean,
    options?: { onEscape?: () => void; returnFocus?: boolean },
) => void;

export const useRovingTabIndex: (options: {
    count: number;
    activeIndex: number;
    onChange: (index: number) => void;
    orientation?: "horizontal" | "vertical" | "both";
    loop?: boolean;
}) => {
    tabIndexFor: (index: number) => 0 | -1;
    onKeyDown: KeyboardEventHandler<HTMLElement>;
};

export const useMergedRef: <T>(...refs: readonly (Ref<T> | void)[]) => RefCallback<T>;
```

`FieldProps`：

```ts
export interface FieldProps {
    children: ReactNode;
    label?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    counter?: ReactNode;
    required?: boolean;
    optional?: boolean;
    htmlFor?: string;
    labelAs?: "label" | "span";
    layout?: "stacked" | "inline";
    size?: "sm" | "md" | "lg";
    hideLabel?: boolean;
    invalid?: boolean;
    disabled?: boolean;
    hintId?: string;
    errorId?: string;
    className?: string;
}
```

---

## 6. 无障碍契约（所有组件的最低要求）

1. 语义优先：能用原生元素就用原生元素（`button`、`input`、`select`、`dialog`、`fieldset/legend`、`label`）。
2. 键盘完整：Tab 可达、Enter/Space 激活、Escape 关闭浮层、方向键按 APG 模式工作、Home/End 到首尾；焦点可见且不被遮挡。
3. 焦点管理：浮层打开时焦点进入，关闭时归还触发元素；模态层做焦点陷阱；不可见但可聚焦元素用 `inert`/`aria-hidden` 处理。
4. 命名：图标按钮必须有 `aria-label`；表单控件必须有 label（可用 `VisuallyHidden`）；错误用 `aria-invalid` + `aria-describedby` 关联。
5. 状态播报：`role="status"` / `aria-live="polite"` 用于 toast、加载完成、筛选结果数；破坏性操作确认用 `role="alertdialog"`。
6. 颜色不是唯一信息：状态同时用图标/文字/形状。
7. 对比度：正文 ≥ 4.5:1，大字号/图形 ≥ 3:1，focus ring 与相邻颜色 ≥ 3:1；禁用态可低于对比要求但需可感知（opacity ≥ 0.45）。
8. 动效：尊重 `prefers-reduced-motion`；不自动播放 > 5s 的循环动画；不做闪烁（>3 次/秒）。
9. 触控：命中区 ≥ 44px（视觉可小）；`touch-action: manipulation`；不做 hover-only 的关键操作。
10. 读屏：装饰 `aria-hidden`；集合类组件提供 `aria-setsize`/`aria-posinset` 或正确的列表结构；虚拟滚动提供 `aria-rowcount`/`aria-setsize`。

---

## 7. 数据适配器（硬性要求）

**凡是渲染「数量不定的一批数据」的组件，必须走 adapter，不得直接写 `items.map` 作为唯一接口。**

```ts
// src/adapter/list/adapter/types.ts
export interface ListEntry<T> {
    readonly key: string;
    readonly index: number;
    readonly item: T;
    readonly level: number;
    readonly parentKey: string | null;
    readonly expandable: boolean;
}

export interface ListAdapter<T> {
    readonly size: number;
    getKey(index: number): string;
    getItem(index: number): T;
    getEntry(index: number): ListEntry<T>;
    indexOf(key: string): number; // 未找到返回 -1
    getRange(start: number, end: number): readonly ListEntry<T>[];
    readonly keys: readonly string[];
}

export const createListAdapter: <T>(items: readonly T[], options?: ListAdapterOptions<T>) => ListAdapter<T>;

// src/adapter/tree/adapter/types.ts
export interface TreeAdapter<T> {
    readonly size: number; // 全部节点数（含折叠）
    readonly roots: readonly string[];
    getItem(key: string): T;
    getParentKey(key: string): string | null;
    getChildren(key: string | null): readonly string[];
    getPath(key: string): readonly string[]; // 根 → 自身
    getLevel(key: string): number; // 根为 1
    isExpandable(key: string): boolean;
    indexOf(key: string): number;
    flatten(expandedKeys: ReadonlySet<string>): ListAdapter<T>; // 可见节点
}

export const createTreeAdapter: <T>(roots: readonly T[], options: TreeAdapterOptions<T>) => TreeAdapter<T>;

// src/adapter/tree/check
export type CheckState = "checked" | "unchecked" | "indeterminate";
export const getCheckState: (tree, checkedKeys, key) => CheckState;
export const toggleCheck: (tree, checkedKeys, key, options?) => ReadonlySet<string>;
export const setAllChecked: (tree, keys, checked) => ReadonlySet<string>;

// src/adapter/tree/select
export const toggleSelection: (mode, keys, key) => ReadonlySet<string>;
export const selectOnly: (key) => ReadonlySet<string>;
export const selectRange: (adapter, keys, anchorKey, targetKey) => ReadonlySet<string>;

// src/adapter/list/virtual
export const createVirtualAdapter: <T>(base, options) => VirtualListAdapter<T>;
```

组件接入方式（二选一或并存）：

```tsx
// 方式 A：直接给 adapter（推荐，数据量/来源复杂时）
<List adapter={listAdapter} renderItem={(entry) => <span>{entry.item.title}</span>} />

// 方式 B：糖衣 items（内部立刻转 adapter，禁止绕过）
<Select options={options} ... />
// 组件内部：const adapter = useMemo(() => createListAdapter(options), [options]);
```

规则：

- 组件 props 里出现 `items`/`options` 时，**内部必须** `createListAdapter`；对外也接受 `adapter`。
- 禁止在渲染里 `array.find`/`indexOf` 做 O(n) 查找；用 adapter 的 O(1) `indexOf`。
- 排序/过滤/分组后必须生成新的 adapter（`useMemo`），不要原地 mutate。
- 树形组件必须使用 `TreeAdapter`；勾选/半选用 `check` 策略；不要自己写级联。
- 键盘导航的索引 ↔ key 转换必须经 `flatten()` 得到的 `ListAdapter`。

---

## 8. 组件 API 约定

- **受控/非受控**：同时支持 `value`/`defaultValue`/`onValueChange`（用 `useControllableState`）。布尔用 `checked`/`defaultChecked`/`onCheckedChange`。
- **className 合并**：`cx("block", className)`；不覆盖调用方 class。
- **ref**：根 DOM 节点透传（React 19 ref prop）。
- **尺寸**：`size?: "sm" | "md" | "lg"`，默认 `md`；与 `--control-*` 对应。
- **语气**：`tone?: "neutral" | "accent" | "mint" | "violet" | "amber" | "danger"`。
- **不搞布尔爆炸**：超过 3 个布尔开关时改为联合类型（如 `variant`、`placement`）。
- **组合优先**：复杂组件用子组件（`Menu.Item` / `Tabs.List` / `Table.Row`）或 render prop，不用几十个 props。
- **事件命名**：`onValueChange`、`onCheckedChange`、`onOpenChange`、`onSelect`；DOM 原生事件保持原名。
- **禁用/只读/加载**：`disabled`、`readOnly`、`loading` 三态明确，`aria-disabled` 与视觉一致。
- **文案**：组件内默认文案用英文（与现有 UI 一致），可被 props 覆盖；不要硬编码中文。
- **ID**：`useId`；需要外部关联时暴露 `id` prop。

---

## 9. 交付与自检清单

每个模块交付时必须附：

1. 文件清单（新增/修改）。
2. 组件 API（props 表）+ 1 个最小用法示例。
3. a11y 说明：role/键盘/ARIA 属性。
4. 自检结果：`tsc --noEmit` 通过、`eslint` 通过（粘贴命令与结果）。
5. 未决问题/需要主代理补的 token 或 foundation 能力。

自检命令（在项目根目录）：

```powershell
npx prettier --write src/component/<block>
npx eslint src/component/<block>
npx tsc -p tsconfig.app.json --noEmit
Select-String -Path src/component/<block>/*.css -Pattern "display:\s*(inline-)?grid|grid-template|grid-area|place-items"
```
