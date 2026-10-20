# periodicity-react 无障碍（a11y）与交互模式规范研究报告

| 项目     | 内容                                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 版本     | v1.0（2026-10-20）                                                                                                                                              |
| 适用范围 | `src/component/**` 组件库层（**不含** `src/component/icon/**`，该目录由他人负责）                                                                               |
| 目标     | 为现有 8 个组件与计划新增的 20+ 组件提供可落地的 a11y 契约、token 方案、全局规则、CI 清单与实施顺序                                                             |
| 方法     | W3C APG 26 个 pattern 原文 + WCAG 2.2 Understanding Docs + APCA 官方文档 + MDN/WHATWG + 主流组件库真实 issue；本项目 token 用 sRGB 相对亮度公式本地实算         |
| 证据等级 | **[规范]** W3C/WHATWG/MDN 原文；**[实现]** 浏览器或开源库的可复现行为/issue；**[推断]** 本项目尚未实测、需验证的推论（文中逐条标注）                            |
| 约束     | 本报告只读代码，未修改 `src/` 下任何文件；所有代码片段为建议草案                                                                                                |
| 代码快照 | `src` 观测于 2026-10-20 03:31–03:45；期间 `src/component/foundation/**` 由并行任务落地（新增 14 个文件），行号可能漂移，定位以选择器/函数名为准；最新状态见 1.4 |

---

## 目录

0. 结论先行：8 条必须立即执行
1. 现状快照（基于本地代码与 token 实算）
2. 标准与证据地图（APG / WCAG 2.2 / APCA / 平台）
3. 组件 a11y 契约表（32 个组件/模式）
4. 对比度取值方案（含实测数值与暗色取色策略）
5. 焦点管理规范
6. 动效与 `prefers-reduced-motion`
7. 表单无障碍（含中文 IME）
8. 触屏与指针
9. 暗色模式专属 a11y 问题
10. React 19 实现细节
11. 必做的 12 条全局规则
12. CI 与评审检查清单
13. 反模式与真实错误案例
14. 实施优先级：先建基础设施
15. 附录（链接、脚本、验收用例、术语）

---

## 0. 结论先行：8 条必须立即执行

1. **先修 token 再写组件**：`--line-strong` 叠加后仅 **1.67:1**（输入框边界），`--faint` 仅 **3.27:1**，disabled 用 `opacity:.45` 后按钮文字仅 **3.50:1**。这三项会让所有新组件继承同一个缺陷。先引入 `--control-border: #616b64`（≥3.0）、`--text-placeholder: #84938a`（5.7）、`--disabled-surface/-text`（5.96）。
2. **基础设施已起步，但还差 5 个缺口**：`foundation/` 已有 `VisuallyHidden`、`Portal`、`Field/useField`、`useControllableState`、`useMergedRef`、`useRovingTabIndex`、`useFocusTrap`、`useDismiss`、`useAnchoredPosition`（2026-10-20 03:37–03:41 并行落地；除 `cx` 被 `Surface/Backdrop/StateLayer` 引用外，其余尚未接线，`tokens.css` 也未 import）；仍缺 **Announcer（live region）、Layer 管理器（栈/Esc/滚动锁）、Slot 多态、`useReducedMotion`、可访问文案表**，且现有 `Field` 有 3 个必须先修的缺陷（见 7.1）。
3. **Dialog 立即补齐 6 项**：`aria-modal="true"`、`aria-describedby`（短描述）、初始焦点策略（`data-autofocus` → 标题 `tabindex=-1` → 首个可聚焦）、backdrop 点击用 pointerdown 起点判定、body 滚动锁、关闭按钮中文 `aria-label`（现在硬编码英文，影响读屏发音与 3.1.2 语言片段）。
4. **`Button` 必须支持 `ref` 与 icon-only 命名**：React 19 用 ref as prop 直接透传到内层 `<button>`；无 children 时强制 `label`（否则 `<span class="button__label">` 为空，可访问名为空）。同时把焦点双环从纯 `box-shadow` 改为 `outline + box-shadow`，以兼容 `forced-colors`。
5. **统一焦点可见规范**：`:focus-visible` + 双环（内 `--focus-halo` = 所在 surface，外 `--focus-ring` 2px）+ `outline-offset: 2px`；全站禁止裸 `outline:none`（当前 TextInput/Select 已用 `outline:none` 依赖 `:focus-within` 边框，1px 太细且非 `:focus-visible`）。
6. **颜色不得单独承载状态**：lime `#c9f36d`、mint `#8fe0c8`、amber `#f0c97d` 在红绿色弱模拟下两两亮度比仅 **1.21–1.30**，必须叠加图标/文本/形状；状态 Badge、表单错误、图表序列全部按此改造。
7. **新增组件一律"原生优先"**：`<button>/<input type=checkbox|radio>/<select>/<dialog>/<table>` 能满足就不写 ARIA；ARIA 只补原生缺口。每个交互组件必须过 5 项门禁：可访问名、键盘全路径、`Esc` 退出、焦点归还、24×24 目标。
8. **CI 必须有对比度单测 + axe 门禁 + 键盘 E2E**：token 比值脚本化（本报告附录 B 可直接用），axe `serious/critical` 归零，Playwright 断言 `document.activeElement`。组件评审没有这三项不放行。

---

## 1. 现状快照（基于本地代码与 token 实算）

### 1.1 已有组件逐项体检

> 行号取自 03:31–03:45 快照；`Button.css` 在 03:38 被并行任务改动过（167→174 行），若行号对不上以选择器为准。

| 组件         | 现状（文件:行）                                                                                      | 风险                                                                                           | 等级 |
| ------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---- |
| Button       | 内层 `<button>` 接收 `...rest`，但**没有 `ref` 透传**；外层 `Surface` 是 `div`（`Button.tsx:30-42`） | Dialog/Menu/Tooltip 无法拿触发器 ref，关闭后只能靠 `document.activeElement`，焦点归还不可靠    | P0   |
| Button       | `.button__label:empty { display:none }`（`Button.css:51-53`）                                        | icon-only 时按钮无文本、无可访问名，除非调用方记得传 `aria-label`；类型层不强制                | P0   |
| Button       | 焦点双环仅 `box-shadow`（`Button.css:152-156`）                                                      | `forced-colors: active` 下 `box-shadow` 被丢弃，Windows 高对比度模式焦点不可见                 | P1   |
| Button       | disabled 用 `opacity:.45`（`Button.css:158-163`）                                                    | accent 上叠 45% 后 `#5f7336`，`accent-ink` 文字对比 **3.50:1**（13.5px 正文需 4.5）            | P1   |
| Dialog       | 无 `aria-modal`（`Dialog.tsx:91-98`）                                                                | 部分 AT 不把背景当 inert；APG 要求显式 `aria-modal="true"`                                     | P0   |
| Dialog       | 初始焦点只找 `input/select/textarea`（`Dialog.tsx:52-55`）                                           | 纯文本/确认型对话框无焦点落点；长内容不会聚焦标题，SR 用户从中间开始读                         | P1   |
| Dialog       | backdrop 关闭用 `click` + `target===currentTarget`（`Dialog.tsx:78-84`）                             | 面板内按下、面板外松开（拖选文字）会误关；应记录 pointerdown 起点                              | P1   |
| Dialog       | 关闭按钮 `aria-label="Close dialog"`（`Dialog.tsx:116`）                                             | 中文产品里英文标签；影响 3.1.2（Language of Parts）与读屏发音                                  | P1   |
| Dialog       | 标题固定 `<h2>`（`Dialog.tsx:109`）                                                                  | 页面标题层级可能冲突（2.4.6 建议），需 `headingLevel`                                          | P2   |
| TextInput    | 输入框边界 = `--line-strong` 叠在 `--panel-muted` 上 → 实测 **1.67–1.73:1**（`TextInput.css:25`）    | 1.4.11 要求识别控件边界 3:1；低视力用户看不到输入框范围                                        | P0   |
| TextInput    | `::placeholder` 用 `--faint` 再乘 `opacity:.85`（`TextInput.css:62-65`）                             | 实测约 **2.8:1**，占位符是文本，需 4.5:1（1.4.3）                                              | P0   |
| TextInput    | 无 `error`/`aria-invalid`/错误关联；`hint` 关联正确（`TextInput.tsx:22-25`）                         | 3.3.1/3.3.3 无法满足；错误只能靠颜色/位置                                                      | P0   |
| TextInput    | `outline:none`，焦点靠 `:focus-within` 1px 边框（`TextInput.css:67-69,84-86`）                       | 1px 且非 `:focus-visible`；2.4.13（AAA）要求 ≥2px 周长                                         | P1   |
| Select       | 原生 `<select>` + `label htmlFor`（`Select.tsx:33-54`），语义正确                                    | 缺 `required`/`disabled`/`hint`/`error` 扩展；自定义下拉时必须换 combobox 模式                 | P2   |
| Switch       | `role="switch"` + `aria-checked` + `aria-label`（`Switch.tsx:20-29`），语义正确                      | 只有 `aria-label`，无可见 label、无 `aria-describedby`、无 `groupId`；Enter 未支持（可选）     | P1   |
| Switch       | 无组件级 `:focus-visible`（`Switch.css` 全文无 focus）                                               | 依赖全局 `:focus-visible`，`outline-offset:3px` 在紧凑布局可能被 `overflow:hidden` 裁掉        | P1   |
| ProgressRing | `role="progressbar"` + `aria-valuemin/max/now` + `aria-label`（`ProgressRing.tsx:35-39`）            | 缺 `aria-valuetext`（如 "42%，已完成"）；`label` 同时渲染可见文本与 `aria-label`，可能重复播报 | P2   |
| Badge        | 仅视觉（`Badge.tsx` 41 行）                                                                          | 数字徽标无上下文（"3" 读作 "三"）；变化不播报                                                  | P2   |
| Card         | 容器组件                                                                                             | 若整卡可点击，不能用 `role=button` 包整卡；需单主链接 + `::after` 覆盖                         | P2   |
| 全局         | 已有 `prefers-reduced-motion` 兜底（`index.css:166-175`）                                            | 兜底用 `animation-duration:1ms !important`，对 transform 类动画会"瞬移"，需改为按组件降级      | P2   |
| 全局         | `:focus-visible` 全局 2px accent、`outline-offset:3px`（`index.css:145-148`）                        | 方向正确；缺 forced-colors 分支、缺 halo、offset 固定 3px 不适合贴边控件                       | P1   |

### 1.2 token 实算结果（暗色主题，sRGB 相对亮度公式）

> 计算式：`L = 0.2126R + 0.7152G + 0.0722B`，通道先做 sRGB 反伽马；`ratio = (L1+0.05)/(L2+0.05)`。下表为本地脚本输出，可复现（见附录 B）。

| 前景                   | 背景                      | 对比度    | 判定                                      |
| ---------------------- | ------------------------- | --------- | ----------------------------------------- |
| `--text` #eff5ee       | `--panel` #0f1612         | **16.58** | 通过（偏高，暗色下有过亮/晕影风险）       |
| `--text` #eff5ee       | `--bg` #080b09            | 17.86     | 通过                                      |
| `--text-soft` #c8d5cb  | `--panel`                 | 12.10     | 通过                                      |
| `--text-soft` #c8d5cb  | `--panel-strong` #141f18  | 11.17     | 通过                                      |
| `--muted` #8b9a90      | `--panel`                 | **6.23**  | 通过（可作正文次级）                      |
| `--muted` #8b9a90      | `--bg`                    | 6.71      | 通过                                      |
| `--faint` #5d6b61      | `--panel`                 | **3.27**  | 仅大字（≥18.66px bold）或非文本；正文失败 |
| `--faint` #5d6b61      | `--bg`                    | 3.52      | 同上                                      |
| `--accent` #c9f36d     | `--panel`                 | 14.45     | 通过                                      |
| `--accent` #c9f36d     | `--bg`                    | 15.56     | 通过                                      |
| `--accent-ink` #101607 | `--accent`                | 14.50     | 通过                                      |
| `--accent-ink` #101607 | `--accent-strong` #ddff94 | 16.50     | 通过                                      |
| `--mint` #8fe0c8       | `--panel`                 | 11.95     | 通过                                      |
| `--violet` #b8a6ff     | `--panel`                 | 8.69      | 通过                                      |
| `--amber` #f0c97d      | `--panel`                 | 11.68     | 通过                                      |
| `--danger` #ff9a8d     | `--panel`                 | 8.97      | 通过                                      |

**合成色（alpha 叠加后）实测：**

| 变量                                             | 合成结果 | 对比          | 判定                                                   |
| ------------------------------------------------ | -------- | ------------- | ------------------------------------------------------ |
| `--line` rgba(231,244,234,.10) over panel        | #252c28  | **1.28**      | 仅装饰分隔线，可接受                                   |
| `--line-strong` rgba(231,244,234,.18) over panel | #363e39  | **1.67**      | 作为控件边界 **失败**（需 3.0）                        |
| `--accent-soft` rgba(201,243,109,.14) over panel | #29351f  | **1.42**      | 选中态仅靠此底色 **不足**（需叠加 3:1 指示条/边框）    |
| `--muted` on `--accent-soft`                     | —        | **4.39**      | 选中行上次级文字跌破 4.5                               |
| `--faint` on `--accent-soft`                     | —        | **2.30**      | 失败                                                   |
| accent@45% over `--bg`（disabled solid）         | #5f7336  | 文字 **3.50** | 正文失败（1.4.3 对 inactive 组件有豁免，但可感知性差） |
| `--text`@45% over panel（disabled ghost）        | —        | **4.18**      | 临界失败                                               |
| `--muted`@45% over panel（disabled quiet）       | —        | **2.23**      | 失败                                                   |

**亮色主题抽检：** `--muted` #6c786d on `--panel` #fffdf6 = **4.54**（刚过线，字号 <14px 时风险高）；`--faint` #8c978d = **2.98**（正文失败）。亮色主题同样需要 `--text-placeholder` 与 `--control-border`。

### 1.3 结构性问题（比单点 bug 更贵）

1. **没有 primitive 层**：所有组件直接写 DOM + CSS，缺少 `VisuallyHidden / FocusScope / Layer / Field / RovingTabIndex`，导致同类逻辑（焦点归还、`aria-describedby` 拼接、Esc 关闭）在每个组件里重复且不一致。
2. **没有"表面（surface）感知"的焦点环**：内环写死 `var(--bg)`，但按钮可能位于 `--panel` / `--panel-strong` / `--accent-soft` 上，内环与背景不匹配时双环出现"脏边"。
3. **状态表达混用**：`Switch` 用 `aria-checked`，`Button` 无 toggle 支持；`Select` 原生；计划中的 Chip/Segmented 若无统一约定，会出现 `aria-pressed`、`aria-selected`、`aria-checked` 三种并存。
4. **i18n 与 a11y 耦合**：`aria-label="Close dialog"`、`aria-label="Progress"` 硬编码英文，说明无统一"可访问文案"入口。

### 1.4 并行进展快照（2026-10-20 03:45）与缺口

> **结论：不要重复造。** 报告成稿期间，`src/component/foundation/` 已由并行任务落地 14 个文件；其中只有 `cx` 被 `Surface/Backdrop/StateLayer` 实际引用，`Field/useField/VisuallyHidden/Portal` 与 4 个 hook 尚未接线，`tokens.css` 也没有被 import——属于"脚手架就绪、尚未接线"。

| 文件                                                    | 现状                                                                                                                  | 评价 / 缺口                                                                                                                                                                                                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens.css`                                            | 已有 spacing/type/control/focus/motion/z-index/elevation/tone/`--touch-target: 44px`/`.visually-hidden`               | **未被 import**；缺 `--control-border`、`--text-placeholder`、`--disabled-surface/-text`、`--focus-halo`；仍保留 `--state-disabled-opacity: 0.45`（即本报告 C3 反模式）；`--duration-slower: 480ms` 超过 UI 动画 400ms 上限                     |
| `VisuallyHidden.tsx` + `.visually-hidden`               | 可用（`as: span/div`）                                                                                                | 建议补 `as` 支持 `label`/`legend` 场景；与 utility class 二选一，避免双份实现                                                                                                                                                                   |
| `Portal.tsx`                                            | `createPortal` 到 `container ?? document.body`                                                                        | **无 layer 栈、无滚动锁、无 `inert` 隔离、无 Esc 栈**；默认 `document.body` 会与"批量 aria-hidden body 子节点"的写法冲突（见 13.1 #1）                                                                                                          |
| `Field.tsx` / `useField.ts`                             | label/hint/error/counter/required 结构齐全，`describedBy` 拼接                                                        | 3 个必修：① hint 与 error **互斥渲染**，但 `describedBy` 同时包含两个 id → 悬空引用；② required 的 `*` 是 `aria-hidden`，无 sr-only"必填"；③ `Optional` 硬编码英文。另：`useField` 直接用 `useId()` 当 DOM id，含 `:`/`«»`，对 CSS 选择器不安全 |
| `FieldGroup.tsx`                                        | 组合容器                                                                                                              | 需确认是否输出 `fieldset/legend` 或 `role=group`；仅视觉分组不满足 1.3.1                                                                                                                                                                        |
| `useFocusTrap.ts`                                       | 自建 trap                                                                                                             | **不要用在原生 `<dialog>`**（双 trap）；用于 Popover/Menu/命令面板                                                                                                                                                                              |
| `useRovingTabIndex.ts`                                  | 方向键 + tabindex 管理                                                                                                | 需补 `scrollIntoView({block:"nearest"})`、disabled 跳过、typeahead 扩展点                                                                                                                                                                       |
| `useDismiss.ts` / `useAnchoredPosition.ts`              | 外点/Esc 关闭、定位                                                                                                   | 需补嵌套层"只关最上层"；定位需 `flip/shift` 与视口边界                                                                                                                                                                                          |
| `useControllableState.ts` / `useMergedRef.ts` / `cx.ts` | 受控/非受控、ref 合并、类名                                                                                           | 可直接复用；补单测                                                                                                                                                                                                                              |
| **仍缺失**                                              | `Announcer`（常驻 live region）、`Layer` 管理器、`Slot`/多态 `as`、`useReducedMotion`、`a11yMessages`、对比度 CI 门禁 | 这些是 Toast/Popover/Menu/Combobox 的前置依赖                                                                                                                                                                                                   |
| `src/structure/validation.ts`                           | **0 字节空文件**                                                                                                      | 若为占位请删除或补实现，避免 CI/lint 误判                                                                                                                                                                                                       |

**接线顺序建议**：`tokens.css` → `index.css`（或 App 入口）→ 组件逐步替换 raw hex/px → 补 `Announcer` 与 `Layer` → 再把 Dialog/Button 迁移到 foundation。

---

## 2. 标准与证据地图

### 2.1 APG（WAI-ARIA Authoring Practices Guide）

APG 是"模式 + 键盘 + ARIA 属性"的事实标准，但**不是规范**（normative 是 WAI-ARIA / HTML）。本项目所有复合组件以 APG 为验收基线：

- 模式总览：<https://www.w3.org/WAI/ARIA/apg/patterns/>
- 键盘接口通用实践（roving tabindex、`aria-activedescendant`、selection follows focus）：<https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/>
- 网格/表格属性实践（`aria-sort`、`aria-rowcount` 等）：<https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties/>
- 地标区域实践：<https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/>

26 个 pattern 的直达链接见附录 A。**重要缺口**：APG 没有 toast/snackbar、pagination、skeleton、avatar、chip、segmented button 的独立 pattern；这些需要组合既有模式（详见第 3 节与第 13 节）。

### 2.2 WCAG 2.2 关键成功准则（本项目必须覆盖）

| SC                                  | 级别 | 一句话要求                     | 对本项目的落地含义                                      |
| ----------------------------------- | ---- | ------------------------------ | ------------------------------------------------------- |
| 1.3.1 Info and Relationships        | A    | 结构与视觉一致                 | 用原生 heading/table/list/fieldset，不滥用 `div`        |
| 1.3.5 Identify Input Purpose        | AA   | 输入目的可程序化识别           | `autocomplete` 令牌（name/email/tel/one-time-code…）    |
| 1.4.1 Use of Color                  | A    | 颜色不是唯一手段               | 错误/状态/图表必须加图标或文本                          |
| 1.4.3 Contrast (Minimum)            | AA   | 正文 4.5:1，大字 3:1           | 见第 4 节 token 方案                                    |
| 1.4.11 Non-text Contrast            | AA   | 控件边界/状态/图形 3:1         | 输入框、switch 轨道、focus ring 均需 ≥3                 |
| 1.4.13 Content on Hover or Focus    | AA   | 可关闭、可悬停、持久           | Tooltip/Popover/菜单必须支持 Esc 且可移入               |
| 2.1.1 Keyboard                      | A    | 全部功能键盘可达               | 拖拽排序、滑块、颜色选择都要键盘路径                    |
| 2.1.2 No Keyboard Trap              | A    | 焦点可离开                     | 自建 focus trap 必须有退出路径                          |
| 2.1.4 Character Key Shortcuts       | A    | 单字符快捷键可关闭/重映射      | 列表 typeahead 不算全局快捷键，但 `?`、`/` 等需可关闭   |
| 2.2.2 Pause, Stop, Hide             | A    | >5s 的动效/自动更新可暂停      | Carousel、Toast、自动刷新、骨架屏闪烁                   |
| 2.3.1 Three Flashes                 | A    | ≤3 次/秒闪烁                   | Skeleton shimmer、加载动画、视频                        |
| 2.4.3 Focus Order                   | A    | 焦点顺序合理                   | Portal 追加到 body 末尾会破坏顺序，需 trap/管理         |
| 2.4.7 Focus Visible                 | AA   | 焦点可见                       | 禁止裸 `outline:none`                                   |
| 2.4.11 Focus Not Obscured (Minimum) | AA   | 聚焦元素不被作者内容完全遮挡   | sticky header/footer、toast、浮层；`scroll-padding-top` |
| 2.4.13 Focus Appearance             | AAA  | 焦点指示 ≥2px 周长、3:1        | 双环 2px 的目标线                                       |
| 2.5.5 Target Size (Enhanced)        | AAA  | 44×44                          | 触屏/主操作目标线                                       |
| 2.5.7 Dragging Movements            | AA   | 拖拽必须有单指针替代           | Slider 轨道点击、列表上移/下移按钮                      |
| 2.5.8 Target Size (Minimum)         | AA   | 24×24 或足够间距               | 图标按钮、关闭按钮、Chip 删除                           |
| 3.1.1 Language of Page              | A    | 页面语言                       | `<html lang="zh-CN">`；组件内英文标签需语言标记或翻译   |
| 3.3.1 Error Identification          | A    | 错误以文本指出                 | 错误消息 + `aria-invalid` + `aria-describedby`          |
| 3.3.2 Labels or Instructions        | A    | 提供标签/说明                  | 永久可见 label，placeholder 不算                        |
| 3.3.3 Error Suggestion              | AA   | 给出修正建议                   | "密码至少 8 位，含数字"而非"格式错误"                   |
| 4.1.2 Name, Role, Value             | A    | 名称/角色/值/状态              | 所有自定义控件                                          |
| 4.1.3 Status Messages               | AA   | 状态消息可程序化播报且不抢焦点 | Toast、保存提示、搜索结果数、错误汇总                   |

链接：WCAG 2.2 规范 <https://www.w3.org/TR/WCAG22/>；Understanding 文档 <https://www.w3.org/WAI/WCAG22/Understanding/>；2.4.11 <https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html>；2.5.8 <https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>；2.5.7 <https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html>；1.4.13 <https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html>；4.1.3 <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>。

### 2.3 APCA 与 WCAG 3 的定位

- APCA（Accessible Perceptual Contrast Algorithm）是 **WCAG 3 的候选方法，不是 WCAG 2.2 的合规依据**；对客户/法务仍以 WCAG 2.2 的 4.5:1 / 3:1 为准，APCA 作为**暗色模式设计复核工具**。
- APCA 的核心价值：感知均匀的 `Lc` 值，能解释"为什么 4.5:1 在近黑背景上依然难读"。官方原文明确指出 WCAG 2 对比度"far overstates contrast for dark colors"，并专门给出 dark mode 对比图：<https://git.apcacontrast.com/documentation/APCAeasyIntro>。
- APCA 参考阈值（官方 Easy Intro，负值表示浅色文字/深色背景）：

| 用途                                  | 目标 `Lc`               | 说明                                 |
| ------------------------------------- | ----------------------- | ------------------------------------ |
| 正文栏（column/body）                 | **−90 优选 / −75 最低** | 14px/400 起                          |
| 内容文本（非成栏）                    | **−60**                 | 24px/400 或 16px/700 起              |
| 大标题、细线图标                      | **−45**                 | 36px/400 或 24px/700；精细 pictogram |
| 绝对下限文本（placeholder、disabled） | **−30**                 | 低于此值视为不可见                   |
| 非文本可辨元素（≥5px）                | **−15**                 | disabled 大按钮等                    |
| 暗色大字上限（初步）                  | **−90**                 | 更亮会产生晕影（halation）           |

> **[推断]** 本项目 `--muted` on `--panel` 的 WCAG 6.23 在 APCA 下大致相当于 `Lc −60 ~ −70`，仍可用于正文次级；`--faint` 的 3.27 可能只到 `Lc −40` 左右，仅够大字。具体数值请用 <https://apcacontrast.com/> 实测，不要引用本推断作为合规结论。

### 2.4 平台与实现文档

- `:focus-visible`：<https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible>（caniuse 基线：<https://caniuse.com/focus-visible>）
- `inert`：<https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert>
- `<dialog>`：<https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog>
- `prefers-reduced-motion`：<https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
- `autocomplete`：<https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete>；WHATWG autofill 令牌表：<https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill>
- `inputmode`：<https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode>
- CompositionEvent（IME）：<https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent>
- `scroll-padding`（SC 2.4.11 的 C43 技术）：<https://www.w3.org/WAI/WCAG22/Techniques/css/C43>
- 固定头遮挡的失败案例 F110：<https://www.w3.org/WAI/WCAG22/Techniques/failures/F110>

---

## 3. 组件 a11y 契约表

### 3.0 阅读方式与验收代号

每个组件给出 7 列：**role/结构、必需属性、键盘交互、焦点管理、常见错误、验收标准**。验收标准用以下代号，评审时逐项打勾：

| 代号 | 含义（可自动化部分见第 12 节）                       |
| ---- | ---------------------------------------------------- |
| `AX` | axe-core 0 个 serious/critical                       |
| `NM` | 可访问名非空，且包含可见文本（2.5.3 Label in Name）  |
| `KB` | 键盘全路径用例通过（进入/操作/退出）                 |
| `FV` | focus visible ≥3:1，双环，`forced-colors` 下仍可见   |
| `TS` | 目标 ≥24×24；触屏主操作 ≥44×44                       |
| `RF` | 关闭/删除/确认后焦点归还到触发器或逻辑落点           |
| `SR` | NVDA + VoiceOver 至少各 1 次人工通过（新增组件必做） |
| `RM` | `prefers-reduced-motion` 下无位移/缩放动画           |

### 3.1 已有组件（8 个）

| 组件             | role / 结构                                                                               | 必需属性                                                                                                                                                          | 键盘交互                                               | 焦点管理                                                                                                       | 常见错误                                                                                                 | 验收标准                                             |
| ---------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Button**       | 原生 `<button type="button">` 或 `<button type="submit">`；禁止 `div role=button`         | 可访问名（文本或 `aria-label`）；toggle 用 `aria-pressed`；菜单触发器用 `aria-haspopup="menu"` + `aria-expanded`；不可用优先 `aria-disabled="true"`（需可发现时） | `Enter` / `Space` 激活一次；不响应长按重复             | 激活后不移动焦点；若打开 dialog/menu，焦点进入浮层，关闭后归还                                                 | `div` 无键盘处理；icon-only 无 label；toggle 时改 label（应保持 label 不变）；disabled 用原生使 Tab 跳过 | `AX+NM+KB+FV+TS`；icon-only 必须 `label` 必填        |
| **Card**         | 语义容器 `<article>` / `<section aria-labelledby>`；整卡可点用"单主链接 + `::after` 铺满" | 标题元素（h2–h4）；可点击时唯一主链接的可访问名                                                                                                                   | `Tab` 只到主链接一次；卡内次要操作独立可聚焦           | 焦点落在链接上时整卡显示 focus ring（`:focus-within`）                                                         | 整卡 `role=button` 包住内部链接；卡片标题不是 heading；hover 才显示的"更多"按钮                          | `AX+NM+KB+FV`；卡内可聚焦元素 ≤ 3                    |
| **Badge**        | 装饰性 `aria-hidden="true"`；有语义时作为文本一部分                                       | 数值 + 单位/上下文；动态变化用 `role="status"` 或 `aria-live="polite"` 容器                                                                                       | 不可聚焦                                               | 无                                                                                                             | 只读数字"3"；用颜色区分"成功/失败"；变化不播报                                                           | `AX+NM`；颜色对比 ≥4.5；变化可播报一次               |
| **Dialog**       | 原生 `<dialog>` + `showModal()`；`role=dialog`（隐式）                                    | `aria-modal="true"`；`aria-labelledby`→标题；短描述用 `aria-describedby`；关闭按钮可访问名                                                                        | `Tab`/`Shift+Tab` 在内部循环；`Esc` 关闭；初始焦点见右 | 打开移到内部（`data-autofocus` → 标题 `tabindex=-1` → 首个可聚焦）；关闭归还触发器；触发器不存在则落到逻辑位置 | 无 `aria-modal`；焦点不进；`Esc` 不关；背景可滚动；backdrop 拖选误关；`aria-hidden` 祖先包住 dialog      | `AX+NM+KB+FV+RF+SR`；背景 `inert` 且不可滚动         |
| **TextInput**    | `<label>` + `<input>`（显式 `for/id` 或包裹）                                             | 可见 label；`aria-describedby`=hint+error；`aria-invalid`；`required`/`aria-required`；`autocomplete`；`inputmode`                                                | 原生文本编辑；`Enter` 提交表单（除非多行）             | 焦点在 input；错误出现后不抢焦点（除非 summary）                                                               | placeholder 当 label；错误只有红边；`outline:none`；`aria-describedby` 覆盖调用方传入值                  | `AX+NM+KB+FV`；对比 ≥4.5；错误可被 SR 读出           |
| **Select**       | 优先原生 `<select>`；自定义则 combobox + listbox                                          | `label`；`required`；`aria-describedby`；禁用项 `disabled`                                                                                                        | 原生：方向键/首字母/`Enter`；自定义按 combobox         | 焦点在触发器；展开后 `aria-activedescendant` 或移入 listbox                                                    | `div` 下拉无角色；选项不可键盘；`size` 误用                                                              | `AX+NM+KB+FV+TS`；选项文本不重复前缀                 |
| **Switch**       | `<button role="switch" aria-checked>` 或 `<input type=checkbox role=switch>`              | 可访问名（可见 label 最佳）；`aria-checked`；组用 `fieldset/legend` 或 `role=group` + `aria-labelledby`                                                           | `Space` 切换；`Enter` 可选                             | 焦点留在 switch；切换不移动焦点                                                                                | label 随状态变化（"开/关"）；用 `aria-pressed`；无可见 label；轨道状态只靠颜色                           | `AX+NM+KB+FV+TS`；开/关均有非颜色线索（位移 + 图标） |
| **ProgressRing** | `role="progressbar"` 容器 + `aria-hidden` 的 SVG                                          | `aria-valuemin/max/now`；`aria-valuetext`（含单位/语义）；可访问名；不确定进度时省略 `aria-valuenow`                                                              | 不可聚焦                                               | 无                                                                                                             | 有 `aria-valuenow` 却做无限动画；无 label；每次渲染都播报                                                | `AX+NM`；数值变化不触发 assertive 播报               |

### 3.2 表单与选择类（8 个）

| 组件                | role / 结构                                                                                           | 必需属性                                                                                                                   | 键盘交互                                                                                                   | 焦点管理                                                                          | 常见错误                                                                                       | 验收标准                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Checkbox**        | 原生 `<input type=checkbox>` + `<label>`；三态用 `indeterminate` + `aria-checked="mixed"`（自定义时） | 可访问名；`aria-checked`（false/true/mixed）；组用 `fieldset/legend` 或 `role=group`+`aria-labelledby`；`aria-describedby` | `Space` 切换；`Tab` 逐个进入组内                                                                           | 焦点留在 checkbox                                                                 | `div role=checkbox`；mixed 未表达；点击文字不切换；组无名称                                    | `AX+NM+KB+FV+TS`；点击 label 可切换                  |
| **Radio**           | `role="radiogroup"` + `role="radio"`；或原生 `input[type=radio]` 同 `name`                            | 组名（`aria-labelledby`/`fieldset legend`）；每个 `aria-checked`；`aria-describedby`                                       | `Tab` 进入组（落在选中项，未选则第一项）；方向键移动并选中；`Space` 选中；`Home/End` 可选                  | roving tabindex：仅选中项 `tabindex=0`，其余 `-1`                                 | 所有 radio 都可 Tab；方向键只移动不选中；组无 label；用 button 模拟                            | `AX+NM+KB+FV+TS`；组内仅 1 个 tab stop               |
| **Range / Slider**  | `role="slider"` 的 thumb（可聚焦）+ 轨道；原生 `input[type=range]` 优先                               | `aria-valuenow/min/max`；`aria-valuetext`；`aria-orientation`；可访问名；`aria-describedby`                                | 方向键 ±step；`Home/End` 首尾；`PageUp/PageDown` 大步（可选）                                              | 焦点在 thumb；拖动不改变焦点                                                      | 只能拖拽（违反 2.5.7）；无 `aria-valuetext`；数值无单位；thumb <24px；键盘方向键被页面滚动抢走 | `AX+NM+KB+FV+TS`；轨道点击可设值；触屏 ≥44           |
| **NumberInput**     | `role="spinbutton"` + `<input inputmode="numeric">`                                                   | `aria-valuenow/min/max`；`aria-valuetext`；`aria-invalid`；可访问名；`autocomplete`（如 `quantity`）                       | `Up/Down` ±1；`Home/End`；`PageUp/Down` ±10；允许直接键入                                                  | 焦点保持在文本框                                                                  | 用 `type=number` 导致滚轮误改、无法格式化；拦截所有按键；越界不报错；spinner 按钮 <24px        | `AX+NM+KB+FV+TS`；非法值有 `aria-invalid` + 文本错误 |
| **Chip**            | 静态：文本；可删除：`<button aria-label="移除 标签名">`；筛选型：`role=checkbox` 或 `aria-pressed`    | 可访问名含完整上下文；删除按钮独立可聚焦                                                                                   | `Tab` 到 chip 本体，再 `Tab` 到删除按钮；`Delete/Backspace` 可选删除                                       | 删除后焦点落到相邻 chip 或容器                                                    | `×` 图标无名称；chip 是 `div`；删除后焦点丢到 body；颜色区分选中                               | `AX+NM+KB+FV+TS+RF`                                  |
| **SegmentedButton** | 单选：`role="radiogroup"` + `role="radio"`；多选：`role="toolbar"` + `aria-pressed`                   | 组名；选中态；`aria-orientation`（视布局）                                                                                 | 单选：方向键移动并选中；多选：`Tab` 进组，方向键在组内移动，`Space` 切换                                   | roving tabindex，组内 1 个 tab stop                                               | 用 tabs 语义做筛选器；组无名称；选中只靠底色                                                   | `AX+NM+KB+FV+TS`；组内 1 个 tab stop                 |
| **Combobox**        | `role="combobox"` 的 input + `role="listbox"` 弹层                                                    | `aria-expanded`；`aria-controls`；`aria-autocomplete`（none/list/both）；`aria-activedescendant`；选项 `aria-selected`     | `Tab` 进入；`Down/Up` 打开并移动；`Enter` 接受；`Esc` 关闭（可选清空）；`Alt+Down/Up` 可选；可打印字符过滤 | DOM 焦点始终在 input，用 `aria-activedescendant` 指向选项；`Esc` 后焦点仍在 input | 用 `aria-owns`；焦点移进 listbox；`aria-expanded` 不更新；弹层无名称；输入法组合期过滤         | `AX+NM+KB+FV+SR`；中文输入不打断                     |
| **DatePicker**      | 文本输入（`aria-describedby` 提示格式）+ `dialog` + `role="grid"` 日历                                | 输入框：格式提示 + `aria-invalid`；grid：`aria-labelledby` 月份标题；日期格 `aria-selected`、今天 `aria-current="date"`    | 输入框键入；`Alt+Down`/按钮打开；日历内方向键移日、`PageUp/Down` 换月、`Home/End` 周首尾、`Esc` 关闭       | 打开时聚焦选中日期或今天；关闭归还输入框                                          | 只能点选；格式只写在 placeholder；月份标题未关联；跨年不播报                                   | `AX+NM+KB+FV+RF+SR`；纯键盘可完成选日期              |

### 3.3 浮层与反馈类（5 个）

| 组件                 | role / 结构                                                                                      | 必需属性                                                                                | 键盘交互                                                                                                                           | 焦点管理                                                          | 常见错误                                                                                                                      | 验收标准                                            |
| -------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Menu**             | `role="menu"` + `menuitem` / `menuitemcheckbox` / `menuitemradio`；触发器 `aria-haspopup="menu"` | `aria-expanded`；`aria-controls`（可选）；menu 的 `aria-labelledby`；分组用 `separator` | 触发器：`Enter/Space` 打开到首项，`Down/Up` 可选；菜单内：`Up/Down` 循环、`Home/End`、`Esc` 关闭、`Tab` 关闭并离开、字符 typeahead | 打开聚焦首项；`Esc`/选择后归还触发器                              | `Tab` 在菜单项间移动；菜单项是链接却无 `role`；禁用项从 Tab 序列消失（应 `aria-disabled` 且可聚焦）；子菜单无 `aria-expanded` | `AX+NM+KB+FV+RF`；`Esc` 后焦点回到触发器            |
| **Tooltip**          | `role="tooltip"` + 触发器 `aria-describedby`                                                     | 触发器可访问名（tooltip 不能替代名称）；tooltip 有 id                                   | `Esc` 关闭；`focus`/`blur` 触发；`hover` 触发                                                                                      | 焦点始终留在触发器                                                | 用 tooltip 当唯一 label；tooltip 内有可聚焦内容（应改非模态 dialog）；无 `Esc`；用 `title` 属性                               | `AX+NM+KB+FV`；可悬停、可关闭、持久（1.4.13）       |
| **Toast / Snackbar** | `role="status"`（polite，默认）+ `aria-atomic="true"`；紧急错误用 `role="alert"`                 | 文本完整；可关闭按钮名称；不自动消失或可暂停                                            | `Tab` 可到关闭按钮（若在流内）；`Esc` 关闭（推荐）                                                                                 | 不抢焦点；出现与消失都不移动焦点                                  | 抢焦点；3s 消失无法阅读（2.2.2）；重复播报；同时多条互相打断；关闭按钮无名称                                                  | `AX+NM+KB+TS`；屏幕阅读器只播一次；可暂停/关闭      |
| **Popover**          | 非模态：`role="dialog"` + `aria-labelledby`（或 `role="region"`）；模态：原生 dialog             | 名称；`aria-expanded`（触发器）；`aria-controls`                                        | `Esc` 关闭；`Tab` 可离开（非模态）或在内部循环（模态）；触发器 `Enter/Space` 打开                                                  | 非模态：打开聚焦首个可交互元素，关闭归还；模态：trap + inert 背景 | 非模态却用 `aria-modal`；背景未 inert 却 trap；关闭后焦点丢失；点外部关闭但键盘无路径                                         | `AX+NM+KB+FV+RF`；层级栈正确（嵌套 Esc 只关最上层） |
| **Progress**         | `role="progressbar"`（线性/圆形同）                                                              | `aria-valuemin/max/now`；`aria-valuetext`；可访问名；不确定态省略 `aria-valuenow`       | 不可聚焦                                                                                                                           | 无                                                                | 无限动画无 reduced-motion；无 label；每次更新都 assertive 播报                                                                | `AX+NM+RM`；不确定态不谎报数值                      |

### 3.4 导航与结构类（5 个）

| 组件           | role / 结构                                                                             | 必需属性                                                                                                             | 键盘交互                                                                                                                                  | 焦点管理                                           | 常见错误                                                                       | 验收标准                                      |
| -------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------- |
| **Tabs**       | `role="tablist"` > `role="tab"`；面板 `role="tabpanel"`                                 | tablist 名称；每个 tab `aria-selected`；`aria-controls`；panel `aria-labelledby`；纵向 `aria-orientation="vertical"` | 进入 tablist 落在选中 tab；左右方向键切换（自动激活）或 `Space/Enter`（手动激活）；`Home/End` 可选；横向 tablist 不监听上下键（保留滚动） | roving tabindex；panel 无聚焦元素时 `tabindex="0"` | 所有 tab 都可 Tab；panel 无名称；方向键被页面滚动抢走；tab 用链接但无 `role`   | `AX+NM+KB+FV`；组内 1 个 tab stop；panel 可读 |
| **Accordion**  | 标题内 `<button aria-expanded aria-controls>`（heading 包裹）                           | heading 层级合理；`aria-expanded`；`aria-controls`；panel 可选 `role=region` + `aria-labelledby`                     | `Enter/Space` 展开/收起；`Tab` 在标题与面板内正常移动                                                                                     | 焦点留在标题按钮                                   | `aria-expanded` 放在 panel 上；div 当标题；全部展开时 region 泛滥（>6 个慎用） | `AX+NM+KB+FV`；读屏播报"已展开/已折叠"        |
| **List**       | `<ul>/<ol>`；可选列表用 `role="listbox"` + `option`；虚拟列表补 `aria-setsize/posinset` | 列表名称（可选）；可选项 `aria-selected`；`aria-multiselectable`                                                     | 静态列表：`Tab` 到内部链接/按钮；可选列表：方向键 + `Space`                                                                               | 可选列表 roving tabindex                           | `div` 列表；可选列表里塞按钮（应改 grid）；虚拟滚动不设 `posinset`             | `AX+NM+KB+FV`；项数可被 SR 感知               |
| **Navigation** | `<nav aria-label>` + `<ul>` + 链接；当前页 `aria-current="page"`                        | 每个 nav 唯一名称；当前项标记；跳转链接（skip link）                                                                 | `Tab` 顺序 = 视觉顺序；skip link 首次 `Tab` 可见                                                                                          | 路由切换后聚焦主标题（`tabindex=-1`）              | 多个 nav 无名称；当前页只靠样式；移动端抽屉无 focus trap 且背景可滚动          | `AX+NM+KB+FV`；skip link 可用                 |
| **Pagination** | `<nav aria-label="分页">` + `<ul>` + 链接/按钮；当前页 `aria-current="page"`            | 当前页、总页数；上一页/下一页可访问名                                                                                | `Tab` 到每个页码；`Enter` 触发                                                                                                            | 翻页后聚焦结果区标题或列表首项（SPA 场景）         | 用 `div` + `onClick`；当前页无标记；只有图标无 label；页码过多无省略说明       | `AX+NM+KB+FV+TS`                              |

> **Pagination 说明**：APG 没有 pagination pattern（26 个 pattern 中不含）。上表是"nav + list + `aria-current`"的社区惯例组合，属 **[推断/惯例]**，需以 1.3.1、2.4.4、4.1.2 验收。

### 3.5 数据展示类（4 个）

| 组件                 | role / 结构                                                                           | 必需属性                                                                                              | 键盘交互                                                                                                | 焦点管理                                                                   | 常见错误                                                                             | 验收标准                                 |
| -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------- |
| **Table（静态）**    | 原生 `<table>` + `<caption>` + `<th scope>`                                           | `caption` 或 `aria-label`；表头 `scope="col/row"`；排序按钮在 th 内                                   | `Tab` 到表内链接/排序按钮；不拦截方向键                                                                 | 排序后焦点留在排序按钮，`aria-sort` 更新                                   | `div` 表格；无 caption；`aria-sort` 放在按钮而非 th；嵌套表格无标题                  | `AX+NM+KB+FV`；SR 可读出"第 3 行第 2 列" |
| **DataGrid（grid）** | `role="grid"` > `row` > `gridcell/columnheader/rowheader`；或原生 table + `role=grid` | 名称；`aria-rowcount/colcount`（虚拟化）；`aria-sort`；选择用 `aria-selected`；可编辑 `aria-readonly` | 方向键移格；`PageUp/Down`；`Home/End` 行首尾；`Ctrl+Home/End` 全表；`Enter/F2` 进入编辑；`Esc` 退出编辑 | 单一 tab stop（roving 或 `aria-activedescendant`）；编辑态与导航态切换明确 | 每个单元格都可 Tab；cell 内按钮但焦点落在 cell（SR 不报按钮）；虚拟化不设 `rowindex` | `AX+NM+KB+FV`；100 行内键盘可达任意格    |
| **TreeGrid**         | `role="treegrid"`；行可展开 `aria-expanded`（放在 row 或首格）                        | 名称；`aria-expanded` 仅父行；`aria-level`（可选）；多选 `aria-multiselectable` + `aria-selected`     | `Up/Down` 行；`Right` 展开/进首格；`Left` 收起/回行；`Home/End`；`Ctrl+Home/End`                        | 行焦点与单元格焦点二选一，需在文档中固定；选中与焦点视觉可区分             | 给叶子行也加 `aria-expanded`；行/格焦点模型混用；层级靠缩进不靠 `aria-level`         | `AX+NM+KB+FV`；展开状态可播报            |
| **Feed**             | `role="feed"` > `article`                                                             | feed 名称；每篇 `aria-labelledby`；`aria-posinset`；`aria-setsize`（未知用 -1）；更新时 `aria-busy`   | `PageDown/PageUp` 上下篇；`Ctrl+End/Home` 跳出 feed                                                     | 焦点随文章移动；加载新文章时保持当前焦点                                   | 无限滚动不播报"已加载 10 条"；`aria-busy` 忘了置 false；article 无标题               | `AX+NM+KB+SR`；SR 阅读模式可逐篇跳转     |

### 3.6 装饰与占位（2 个）

| 组件         | role / 结构                                                              | 必需属性                                                              | 键盘交互              | 焦点管理   | 常见错误                                                           | 验收标准                         |
| ------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------- | --------------------- | ---------- | ------------------------------------------------------------------ | -------------------------------- |
| **Skeleton** | 纯装饰 `aria-hidden="true"`；容器 `aria-busy="true"`                     | 加载状态文本（`role="status"`，如"正在加载"）；完成后移除 `aria-busy` | 不可聚焦              | 无         | 骨架被 SR 读成空内容；骨架内有可聚焦占位按钮；闪烁 >3Hz            | `AX+NM+RM`；加载完成有一次性播报 |
| **Avatar**   | `<img alt="姓名">`；纯装饰 `alt=""`；首字母头像 `aria-hidden` + 旁边文本 | `alt`=人名；有相邻姓名时 `alt=""`；可点击时外层按钮有名称             | 可点击时 `Tab` 到按钮 | 与按钮一致 | `alt="avatar"`；姓名重复播报两次；首字母无文本替代；状态点只靠颜色 | `AX+NM+TS`；SR 只读一次姓名      |

### 3.7 跨组件状态语义约定（避免三种 checked 混用）

| 场景                      | 用                                             | 不用            | 说明                               |
| ------------------------- | ---------------------------------------------- | --------------- | ---------------------------------- |
| 开/关（即时生效）         | `role="switch"` + `aria-checked`               | `aria-pressed`  | 开关语义                           |
| 按下/未按下（工具栏按钮） | `aria-pressed`                                 | `aria-checked`  | toggle button                      |
| 列表/标签页选中           | `aria-selected`                                | `aria-checked`  | listbox/tab/grid                   |
| 复选/单选                 | `aria-checked`（含 `mixed`）                   | `aria-selected` | checkbox/radio/menuitemcheckbox    |
| 当前页/当前步骤           | `aria-current`（`page` / `step` / `location`） | `aria-selected` | 导航                               |
| 展开/折叠                 | `aria-expanded`                                | `aria-checked`  | disclosure/menu/combobox/accordion |
| 无效                      | `aria-invalid`                                 | 仅红框          | 表单                               |
| 忙碌                      | `aria-busy`                                    | 仅 spinner      | 区域加载                           |

---

## 4. 对比度取值方案

### 4.1 计算方式与工具

- **WCAG 2.x 公式（合规基线）**：相对亮度 `L = 0.2126R + 0.7152G + 0.0722B`，通道 `c/255` 后 `c ≤ 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`；比值 `(Llight+0.05)/(Ldark+0.05)`。
- **工具链接**：
    - WebAIM Contrast Checker：<https://webaim.org/resources/contrastchecker/>
    - APCA 官方计算器：<https://apcacontrast.com/>
    - Contrast Ratio（含透明度叠加）：<https://contrast-ratio.com/>
    - Chrome DevTools → Elements → 颜色选择器自带 contrast 读数
    - 色弱模拟：<https://www.myndex.com/CVD/>（APCA 推荐的 Brettel 模型）、<https://www.color-blindness.com/coblis-color-blindness-simulator/>
    - axe DevTools / Storybook a11y addon：批量回归
- **注意**：所有"半透明 token"必须先合成到实际背景再算。`--line-strong` 的 18% 白在 `--panel` 上只有 1.67:1，就是合成后才发现的问题。

### 4.2 问题定位（实测）

| #   | 问题                        | 实测                           | 影响                                           | 修复方向                                                                               |
| --- | --------------------------- | ------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| C1  | 控件边界 `--line-strong`    | 1.67:1（panel）                | 1.4.11：输入框/开关边界不可辨                  | 新增 `--control-border: #616b64`（3.32 panel / 3.06 panel-strong）                     |
| C2  | placeholder `--faint × .85` | ≈2.8:1                         | 1.4.3：占位文本不可读                          | `--text-placeholder: #84938a`（5.70 panel / 5.92 panel-muted），`opacity:1`            |
| C3  | disabled `opacity:.45`      | 3.50:1；ghost 4.18；quiet 2.23 | 低视力无法确认控件存在；状态不可辨             | 用 token 替代 opacity：`--disabled-surface:#1b241e`、`--disabled-text:#93a297`（5.96） |
| C4  | 选中底色 `--accent-soft`    | 1.42:1                         | 仅靠底色无法表达选中（1.4.11 状态需 3:1）      | 选中项加 2–3px `--accent` 指示条/边框（10.18 对 tint）或勾选图标                       |
| C5  | tint 上的次级文字           | `--muted` on tint = 4.39       | 选中行描述文字跌破 4.5                         | tint 上正文用 `--text-soft`（11.68 on tint）                                           |
| C6  | 全局 `--text` 过亮          | 16.58（panel）                 | 暗色下晕影、阅读疲劳（APCA 建议大字 ≤ Lc −90） | 正文可降到 `#e3ece4`（15.20）或 `#dbe6dc`（14.31），标题保留高亮                       |
| C7  | 亮色 `--faint`              | 2.98                           | 亮色主题同类问题                               | 亮色 `--text-placeholder` 用 `#6c786d`（4.54）以上                                     |

### 4.3 建议 token 方案（暗色为准，亮色给对应值）

> `foundation/tokens.css` 已定义 `--focus-ring-width/offset/color`、duration、z-index、elevation、tone 体系；下列新增应**追加到该文件并确保被入口 import**，不要散落在组件 CSS。同时把 `--state-disabled-opacity: 0.45` 标记为 deprecated（它是 C3 的根因）。

```css
:root {
    /* 保留：装饰线，不承担控件边界 */
    --line: rgba(231, 244, 234, 0.1); /* 1.28 : 仅分隔 */
    --line-strong: rgba(231, 244, 234, 0.18); /* 1.67 : 仅装饰强调 */

    /* 新增：控件边界（1.4.11 ≥3:1） */
    --control-border: #616b64; /* panel 3.32 / panel-strong 3.06 / panel-muted 3.45 */
    --control-border-hover: #737d76; /* 4.30 / 3.97 / 4.47 */
    --control-border-disabled: #3a463d; /* 1.61：disabled 豁免，但仍可见 */

    /* 新增：文本层级（暗色不要纯白） */
    --text-body: #e3ece4; /* 15.20，替代大面积 #eff5ee */
    --text-placeholder: #84938a; /* 5.70，替代 --faint */
    --text-disabled: #93a297; /* 5.96 on --disabled-surface */

    /* 新增：disabled 表面，替代 opacity */
    --disabled-surface: #1b241e;
    --disabled-border: #3a463d;

    /* 焦点：双环 */
    --focus-ring: #c9f36d; /* 14.45 on panel */
    --focus-halo: var(--panel); /* 必须 = 组件所在 surface */
    --focus-ring-on-accent: #101607; /* 实心 accent 上 14.50 */

    /* 状态色（保持，但不得单独使用） */
    --success: #8fe0c8; /* 11.95 */
    --warning: #f0c97d; /* 11.68 */
    --danger: #ff9a8d; /* 8.97 */
    --info: #b8a6ff; /* 8.69 */
}

:root[data-theme="light"] {
    --control-border: #8c978d; /* 对 #fffdf6 ≈ 2.98 → 建议再深一档 #7d887e */
    --control-border-hover: #6c786d;
    --text-body: #223026;
    --text-placeholder: #6c786d; /* 4.54 */
    --text-disabled: #7d887e;
    --disabled-surface: #ece8dc;
    --focus-halo: var(--panel);
}
```

> 亮色 `--control-border` 需要 ≥3.0；`#8c978d` 只有 2.98，建议 `#7d887e`（需实测确认 ≥3.0 后再入库）。**[推断]** 该值未逐项实算，落地前用附录 B 脚本跑一遍。

### 4.4 焦点环的"双环 + surface 感知"方案

单环在 accent 实心按钮上会与按钮同色（对比 1.0），必须"内 halo + 外 ring"：

```css
/* 所有可聚焦元素的基础规则 */
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
    box-shadow: 0 0 0 2px var(--focus-halo); /* halo 填满 offset 间隙，形成双环 */
    border-radius: inherit;
}

/* 实心 accent 按钮：ring 用深色，halo 用 surface */
.button--solid:has(.button__control:focus-visible) {
    box-shadow:
        0 0 0 2px var(--focus-halo),
        0 0 0 4px var(--focus-ring-on-accent);
}

/* 高对比度模式：outline 是唯一可靠通道 */
@media (forced-colors: active) {
    :where(a, button, input, select, textarea, [tabindex]):focus-visible {
        outline: 3px solid CanvasText;
        outline-offset: 2px;
    }
    .button,
    .switch,
    .field__background {
        border: 1px solid ButtonBorder;
    }
}
```

要点：

1. `--focus-halo` **不能写死** `--bg`，要跟随组件所在 surface（panel / panel-strong / tint / image）。实现上用 `data-surface` 或 CSS 变量继承。
2. `outline` 必须保留（`forced-colors` 会丢弃 `box-shadow`）。
3. 若组件自身已有 `box-shadow`（如 Button solid），焦点态要用**逗号合并**而不是整条覆盖，否则会丢掉原有阴影/内高光。
4. `outline-offset` 贴边控件用 2px，紧凑 toolbar 可用 -2px 内嵌，但内嵌环不能小于 2px 宽。
5. 2.4.13（AAA）要求焦点指示"周长 ≥2px 且与未聚焦态 3:1"，本方案满足；AA 的 2.4.11 还要保证不被 sticky header/toast 遮挡（见 5.5）。

### 4.5 暗色模式实际取色策略（不只给 4.5:1）

1. **极性反转算法**：暗色不是把亮色取反。保持色相，降低明度对比跨度：背景 `#080b09 → #0f1612` 是"近黑 + 微绿"，前景不要用 `#fff`，用 `#e3ece4`（15.2:1），避免 halation。
2. **用 APCA 复核 WCAG 的"假通过"**：近黑背景上 WCAG 4.5:1 可能只有 `Lc 45–55`。凡是大面积正文，目标 `|Lc| ≥ 75`；小字（12–13px）建议 `|Lc| ≥ 90`，更小字号需配更高字重或更高 Lc；不要只盯 4.5。
3. **亮度阶梯而非色相阶梯**：定义 5 级表面 `bg-deep → bg → panel-muted → panel → panel-strong`，但相邻比值只有 1.04–1.15（实测 panel vs panel-muted = 1.04），**不能靠表面明度表达层级**；必须加 1px `--control-border` 或阴影。
4. **tint 是"状态底"不是"状态本身"**：`--accent-soft` 只有 1.42:1，选中/悬停必须叠加 ≥3:1 的边框、指示条或图标。
5. **限制 accent 的使用面积**：lime 亮度极高（14.45:1），大面积使用会"发光"；用于 ≤10% 面积（按钮、指示条、focus ring），正文不用 accent。
6. **暗色阴影无效，用边框代替**：`--shadow-lg` 在近黑背景几乎不可见；卡片层级用 `--control-border` 或 1px 亮边 + 轻微外发光。
7. **状态色降饱和、提亮度**：`--danger #ff9a8d` 比 `#ff0000` 更可读；暗色下不要用纯饱和红/绿，易产生色差振动。
8. **大字号上限**：APCA 初步建议暗色大字不超过 `Lc −90`；标题不要用纯白 + 700 字重。

### 4.6 色弱风险（lime / mint / amber / danger）

| 语义        | 当前色    | 亮度比（两两）     | 红绿色弱风险                                   | 建议                                      |
| ----------- | --------- | ------------------ | ---------------------------------------------- | ----------------------------------------- |
| 主色 accent | `#c9f36d` | vs mint **1.21**   | 与 mint 几乎同亮度，deuteranopia 下都呈黄绿    | 主色只做交互强调，不做状态区分            |
| 成功 mint   | `#8fe0c8` | vs accent 1.21     | 与 accent 难区分                               | 成功必须加 ✓ 图标 + 文本"成功"            |
| 警告 amber  | `#f0c97d` | vs danger **1.30** | 与 danger 亮度接近，色相在 protanopia 下也接近 | 警告用"!"三角 + 文本，danger 用"✕" + 文本 |
| 危险 danger | `#ff9a8d` | vs amber 1.30      | 同上                                           | 不要用红/绿对比表达"对/错"                |
| 信息 violet | `#b8a6ff` | 8.69               | 相对安全                                       | 仍建议图标                                |

落地规则：

- **状态三重编码**：颜色 + 图标形状 + 文本（1.4.1）。
- **链接**：非导航区域链接必须常驻下划线（不能只靠 accent 色）；`text-decoration-thickness: 1px; text-underline-offset: 2px`。
- **图表**：分类色板同时改变**亮度与图案**（实线/虚线/点纹），并提供直接标注；不要用红绿序列。
- **表单错误**：红色边框 + 图标 + 文本 + `aria-invalid`，四者齐备。
- **色弱验收**：每个含状态的 Story 必须过 deuteranopia/protanopia 模拟截图（人工）。

### 4.7 非文本对比（1.4.11）清单

| 元素                  | 最低 | 本项目现状                            | 动作                                                           |
| --------------------- | ---- | ------------------------------------- | -------------------------------------------------------------- |
| 输入框/选择器边界     | 3.0  | 1.67                                  | 用 `--control-border`                                          |
| Switch 轨道（开/关）  | 3.0  | 关态轨道 = panel-muted vs panel ≈1.04 | 轨道加 `--control-border`；开态用 accent 边框（10.18 on tint） |
| Checkbox/Radio 勾选框 | 3.0  | 未实现                                | 边框 `--control-border`，选中用 accent 填充 + 深色勾           |
| Slider 轨道/thumb     | 3.0  | 未实现                                | 轨道 3:1，thumb 加 2px 边                                      |
| Focus ring            | 3.0  | accent 14.45 ✓；实心按钮上 1.0 ✗      | 双环                                                           |
| 图表数据线            | 3.0  | 未实现                                | 线宽 ≥2px，色板分级                                            |
| 图标按钮图形          | 3.0  | 继承文字色                            | 使用 `--text-soft` 以上                                        |
| 禁用控件              | 豁免 | —                                     | 仍建议 ≥3.0 以保持"存在感"                                     |

### 4.8 建议加入 CI 的 token 断言（示例）

```ts
// scripts/contrast.test.ts（示意，可直接落地）
const TOKENS = {
    panel: "#0f1612",
    bg: "#080b09",
    textBody: "#e3ece4",
    muted: "#8b9a90",
    placeholder: "#84938a",
    controlBorder: "#616b64",
    accent: "#c9f36d",
    accentInk: "#101607",
    danger: "#ff9a8d",
} as const;

const srgb = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex: string) => {
    const n = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => srgb(parseInt(n.slice(i, i + 2), 16) / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
};

test.each([
    ["textBody", TOKENS.textBody, TOKENS.panel, 4.5],
    ["muted", TOKENS.muted, TOKENS.panel, 4.5],
    ["placeholder", TOKENS.placeholder, TOKENS.panel, 4.5],
    ["controlBorder", TOKENS.controlBorder, TOKENS.panel, 3.0],
    ["accentInkOnAccent", TOKENS.accentInk, TOKENS.accent, 4.5],
])("%s meets %.1f:1", (_name, fg, bg, min) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
});
```

---

## 5. 焦点管理规范

### 5.1 focus visible 与 focus ring 不是一回事

- **Focus visible（2.4.7）** 是"键盘焦点必须看得见"的**结果要求**；**focus ring** 只是实现手段之一（还可以是边框、背景、下划线、光标）。
- `:focus` 在鼠标点击时也会命中；`:focus-visible` 是 UA 的启发式：键盘/AT 操作时为真，鼠标点击通常为假。**规则：视觉环用 `:focus-visible`，输入类控件可用 `:focus`/`:focus-within`（因为点击后也需要明确落点）。**
- 绝对禁止全局 `:focus { outline: none }`；若必须去掉 UA 环，必须在同一选择器内提供 ≥3:1、≥2px 的替代指示。

| 实现方式     | 是否占布局     | 圆角跟随                              | `forced-colors` | 建议                                  |
| ------------ | -------------- | ------------------------------------- | --------------- | ------------------------------------- |
| `outline`    | 否             | 否（方角，可用 `border-radius` 无效） | **保留**        | 主方案，配 `outline-offset`           |
| `box-shadow` | 否             | 是                                    | **丢失**        | 只做 halo/装饰，不能作为唯一指示      |
| `border`     | 是（可能抖动） | 是                                    | 保留            | 用 `box-shadow: inset` 或预留透明边框 |
| 背景/下划线  | 否             | 是                                    | 部分            | 仅作补充                              |

**推荐组合**：`outline`（外环，2px，`offset 2px`）+ `box-shadow`（内 halo，填 offset 间隙）+ 必要的 `background` 变化。三者叠加可同时满足暗色、图片背景、forced-colors。

**焦点环被裁剪的四个来源**：`overflow: hidden` 的父级、`transform` 创建的 containing block、sticky 容器、`border-radius` + 负 offset。对策：给容器留 `padding: 4px`、把 ring 画在 `::after` 绝对定位层、或用 `outline-offset: -2px` 内嵌（内嵌环仍要 ≥2px）。

### 5.2 roving tabindex vs `aria-activedescendant`

| 维度       | roving tabindex                                                                          | `aria-activedescendant`                                                                      |
| ---------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| DOM 焦点   | 在选项之间移动                                                                           | 始终留在容器/输入框                                                                          |
| 适用       | Tabs、Menu、Radio、Toolbar、Segmented、Grid                                              | Combobox、Listbox、部分 Grid                                                                 |
| 屏幕阅读器 | 支持最稳                                                                                 | 依赖容器 role 与属性更新时机，差异较大                                                       |
| 实现要点   | 选中项 `tabindex=0`，其余 `-1`；方向键后 `.focus()`；`scrollIntoView({block:"nearest"})` | 容器 `tabindex=0`；`aria-activedescendant` 指向**存在于可访问性树**的元素 id；弹层关闭时清空 |
| 常见 bug   | 多个 `tabindex=0`；方向键后不聚焦；焦点跳回 body                                         | id 指向 `display:none`/`aria-hidden` 元素；未同步更新；选项无 `id`                           |

**选择原则**：需要"容器保持输入焦点"（combobox 打字）用 activedescendant；其余一律 roving tabindex。**不要混用**：同一个组件里一半 roving 一半 activedescendant 会让 SR 播报错乱。

```tsx
// useRovingTabIndex 的核心约定（草案）
type RovingOptions = {
    orientation?: "horizontal" | "vertical" | "both";
    loop?: boolean;
    getItems: () => HTMLElement[];
};
// - 容器 onKeyDown 处理 Arrow/Home/End
// - 当前索引 state，effect 中同步 tabIndex 属性
// - 焦点移动后调用 item.focus({ preventScroll: true }) + scrollIntoView({ block: "nearest" })
// - 若容器获得焦点但无 active 项，聚焦第一个非 disabled 项
```

### 5.3 focus trap、`inert` 与焦点归还

**原生 `<dialog>.showModal()` 已经提供**：top layer、背景 inert、Tab 循环、`Esc` 触发 `cancel`。**不要再套一层手写 trap**（重复 trap 会造成 Tab 卡死或双焦点）。参考：<https://css-tricks.com/there-is-no-need-to-trap-focus-on-a-dialog-element/>。

自定义浮层（Popover、Menu、Toast 交互、命令面板）需要 `FocusScope`：

```tsx
// FocusScope 草案：只做三件事——移入、循环、归还
function FocusScope({ children, restore = true }: { children: ReactNode; restore?: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    const opener = useRef<HTMLElement | null>(null);

    useEffect(() => {
        opener.current = document.activeElement as HTMLElement | null;
        const root = ref.current;
        if (!root) return;
        const first = root.querySelector<HTMLElement>(
            "[data-autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        );
        (first ?? root).focus({ preventScroll: true });

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab" || !root) return;
            const items = Array.from(
                root.querySelectorAll<HTMLElement>(
                    "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
                ),
            ).filter((el) => el.offsetParent !== null);
            if (items.length === 0) {
                e.preventDefault();
                return;
            }
            const firstEl = items[0];
            const lastEl = items[items.length - 1];
            if (e.shiftKey && document.activeElement === firstEl) {
                e.preventDefault();
                lastEl.focus();
            } else if (!e.shiftKey && document.activeElement === lastEl) {
                e.preventDefault();
                firstEl.focus();
            }
        };

        root.addEventListener("keydown", onKeyDown);
        return () => {
            root.removeEventListener("keydown", onKeyDown);
            if (restore && opener.current?.isConnected) opener.current.focus({ preventScroll: true });
        };
    }, [restore]);

    return <div ref={ref}>{children}</div>;
}
```

**`inert` 优于 `aria-hidden`**：

|                | `inert`              | `aria-hidden="true"` |
| -------------- | -------------------- | -------------------- |
| 移出 Tab 序列  | 是                   | 否                   |
| 移出可访问性树 | 是                   | 是                   |
| 鼠标交互       | 阻断                 | 不阻断               |
| 适用           | 背景内容、非活动面板 | 纯装饰图标、重复文本 |

**禁止**：`aria-hidden="true"` 的元素内部存在焦点（浏览器会打印 "Blocked aria-hidden on an element because its descendant retained focus"，且焦点会"丢失"到 body）。React 19 中 `inert` 作为布尔属性透传（**[推断]** 需在项目内实测确认类型定义），不要写 `inert="false"`（字符串 "false" 仍为真值）。

**焦点归还的 5 条规则**：

1. 打开前记录 `document.activeElement`；关闭时若 `isConnected` 则归还。
2. 触发器已被删除 → 落到逻辑邻居（列表下一项、父级菜单项）或页面主标题。
3. 关闭动画期间不要立即卸载焦点元素；先 `focus()` 再卸载，或在 `transitionend` 后归还。
4. 删除操作：焦点落到"下一个同级项"，没有则"上一个"，再没有则容器/标题。
5. 路由切换：聚焦 `<h1 tabindex="-1">` 或 `<main tabindex="-1">`，并用 live region 播报新页面标题。

### 5.4 skip link、`scroll-padding` 与固定头部

```html
<a class="skip-link" href="#main">跳到主内容</a>
<header class="app-header">…</header>
<main id="main" tabindex="-1">…</main>
```

```css
.skip-link {
    position: fixed;
    inset-inline-start: 12px;
    inset-block-start: -48px;
    z-index: 100;
    padding: 10px 14px;
    border-radius: 8px;
    background: var(--accent);
    color: var(--accent-ink);
    transition: inset-block-start 120ms ease;
}
.skip-link:focus-visible {
    inset-block-start: 12px;
}

html {
    /* 固定头高度 + 安全余量；C43 推荐做法 */
    scroll-padding-top: calc(var(--header-height, 64px) + 12px);
    scroll-padding-bottom: calc(var(--toast-safe, 0px) + 12px);
}
:where(main, section, [id]) {
    scroll-margin-top: calc(var(--header-height, 64px) + 12px);
}
```

要点：

- 2.4.11 允许"部分遮挡"，但不允许"完全遮挡"；F110 就是 sticky header/footer 完全盖住焦点元素。
- Toast/浮动工具条也会遮挡：容器整体 `pointer-events: none`，只有按钮恢复 `pointer-events: auto`；位置避开页面主操作区，并提供 `Esc`。
- `scrollIntoView` 在列表/网格内用 `{ block: "nearest" }`，避免整页跳动；不要用 `behavior: "smooth"` 除非 `prefers-reduced-motion: no-preference`。

### 5.5 Portal 与焦点顺序

- **DOM 顺序决定 Tab 顺序**。Portal 追加到 `body` 末尾意味着浮层在 Tab 顺序上"最后"，若不 trap，用户会先走完整个页面。
- **Layer 管理器**需保证：同一时刻只有一个"活动层"；`Esc` 只关最上层；每层记录自己的 opener；嵌套层关闭后焦点回到上一层而非页面。
- 不要在浮层打开时给 `#root` 直接设 `aria-hidden` 而不处理 portal 容器——浮层若 portal 到 `#root` 之外就会被一起隐藏（见 13.1 Radix #3701）。
- 推荐结构：

```html
<div id="root">…页面…</div>
<div id="layer-root">
    <!-- 浮层按打开顺序追加；每个容器 data-layer-id -->
</div>
```

打开浮层时对 `#root` 设 `inert`（而非 `aria-hidden`），关闭时移除；浮层内部滚动锁只作用于 body 计数。

---

## 6. 动效与 `prefers-reduced-motion`

### 6.1 时长与缓动 token

| Token              | 值    | 用途                    |
| ------------------ | ----- | ----------------------- |
| `--motion-instant` | 0ms   | reduced-motion 下的替代 |
| `--motion-micro`   | 120ms | hover、颜色、图标切换   |
| `--motion-fast`    | 160ms | 小浮层、tooltip 淡入    |
| `--motion-base`    | 200ms | 按钮、卡片、tab 指示条  |
| `--motion-slow`    | 240ms | dialog、drawer          |
| `--motion-complex` | 320ms | 页面级转场（尽量少用）  |
| `--motion-max`     | 400ms | 任何 UI 动画上限        |

缓动：进入 `cubic-bezier(0.22, 0.8, 0.32, 1)`；退出 `cubic-bezier(0.4, 0, 1, 1)`；不要用 `linear` 做位移动画（机械感），spinner 除外。

### 6.2 reduced-motion 策略

现有全局兜底（`index.css:166-175`）把所有动画压到 1ms，会导致**位移类动画瞬移**（视觉上像"闪一下"）。更细的策略：

| 动效类型                           | 默认            | `prefers-reduced-motion: reduce`                      |
| ---------------------------------- | --------------- | ----------------------------------------------------- |
| 颜色/透明度                        | 160–200ms       | 可保留 100ms 或直接切换                               |
| 位移/缩放（dialog、drawer、toast） | 240ms transform | **去掉 transform**，只做 opacity 或直接出现           |
| 视差/滚动联动                      | 允许            | **完全禁用**                                          |
| 自动轮播                           | 允许（需控制）  | **禁止自动播放**                                      |
| Skeleton shimmer                   | 1.2s 循环       | 静态底色 + "加载中"文本                               |
| Spinner 旋转                       | 循环            | 降速或静态 + 文本（旋转是状态指示，可保留但不要闪烁） |
| 列表重排（FLIP）                   | 200ms           | 直接重排                                              |

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
    .dialog[open] {
        animation: none;
        transform: none;
    }
    .skeleton {
        animation: none;
        background: var(--panel-strong);
    }
}
```

**不要**用 `display: none` 或 `visibility: hidden` 来"关闭动效"——会同时移除内容。也不要在 reduced-motion 下移除状态反馈（例如 focus ring 的过渡），只移除位移/缩放/视差。

### 6.3 闪烁、自动播放与视差

- **2.3.1**：任何内容不得每秒闪烁超过 3 次，或低于 general flash / red flash 阈值。Skeleton 的 shimmer 频率应 ≥1s/周期；避免高频"呼吸灯"。
- **2.2.2**：自动滚动/自动更新/动画持续 **>5 秒** 时，必须提供暂停/停止/隐藏。Carousel 必须：焦点进入即停、hover 即停、提供"停止轮播"按钮且它是 Tab 序列第一个控件（APG Carousel）。
- **视差（parallax）**：前庭功能障碍用户可能眩晕/恶心；默认关闭，或仅在 `prefers-reduced-motion: no-preference` 且非触摸设备启用；禁止 scroll-jacking。
- **自动播放视频**：必须静音、提供暂停、不超过 5 秒循环无控制（1.4.2 音频控制、2.2.2）。

### 6.4 验收

- `RM`：在 DevTools 模拟 `prefers-reduced-motion: reduce` 下，所有组件无位移/缩放/视差，内容仍完整。
- 录屏检查：无 >3Hz 闪烁；无持续 >5s 且不可暂停的动画。
- `prefers-reduced-transparency`（实验性）可作为增强，不作为基线。

---

## 7. 表单无障碍（含中文 IME）

### 7.1 表单结构契约

```tsx
<div className="field" data-invalid={invalid || undefined}>
    <label className="field__label" htmlFor={ids.input}>
        邮箱 <span aria-hidden="true">*</span>
        <span className="sr-only">（必填）</span>
    </label>
    <input
        id={ids.input}
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        aria-required="true"
        aria-invalid={invalid || undefined}
        aria-describedby={[ids.hint, ids.error].filter(Boolean).join(" ") || undefined}
    />
    <p id={ids.hint} className="field__hint">
        用于接收登录验证码
    </p>
    {invalid && (
        <p id={ids.error} className="field__error" role="alert">
            请输入有效邮箱，例如 name@example.com
        </p>
    )}
</div>
```

规则：

1. **label 永久可见**，placeholder 只做示例；placeholder 不能替代 label（3.3.2、1.3.1）。
2. 必填用原生 `required`；自定义控件用 `aria-required="true"`；视觉上不要只用红色星号，需 sr-only 文本"（必填）"。
3. hint 与 error 都进 `aria-describedby`，**顺序：hint 在前、error 在后**（读屏按顺序播报）。
4. `aria-invalid` 只在**提交后或失焦校验后**设置，不要在用户输入第一个字符时就标红。
5. 错误文案包含"哪里错 + 怎么改"（3.3.3），不要"格式错误"。
6. `aria-errormessage` 的 AT 支持仍不稳定（**[推断]** 2026 年主流组合可用但不一致），优先 `aria-describedby`。

**与现有 `Field`/`useField` 的对接（必须先修）**：

| 缺陷                | 现状                                                                                   | 修法                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| hint/error 互斥渲染 | `Field.tsx` 用三元只渲染 error 或 hint，但 `useField` 的 `describedBy` 同时拼了两个 id | 要么两者都保持挂载（error 为空时 `hidden`），要么 `describedBy` 只拼实际渲染的 id；axe 的 `aria-valid-attr-value` 会抓 idref 不存在 |
| required 不可感知   | `*` 加了 `aria-hidden`，没有 sr-only 文本                                              | `<span aria-hidden>*</span><span class="visually-hidden">（必填）</span>`；同时控件加 `required`/`aria-required`                    |
| i18n                | `Optional` 硬编码英文                                                                  | 走 `a11yMessages`/i18n；中文用"（选填）"                                                                                            |
| error 播报时机      | error span 条件渲染 + `aria-live="polite"`                                             | 新建的 live region 可能不播报（见 13 #13）；改用常驻 `Announcer`，或让 error 容器常驻、只换文本                                     |
| DOM id 不安全       | `useField` 直接 `useId()` 当 id                                                        | sanitize：`id.replace(/[^a-zA-Z0-9_-]/g, "")`，否则 `querySelector('#...')` 会抛错                                                  |

### 7.2 错误汇总（error summary）

提交失败时：

1. 在表单顶部渲染 summary（`role="alert"` 或 `tabindex="-1"` + `focus()`），列出"共 N 个错误"，每条是锚点链接到对应字段。
2. 焦点移到 summary（`tabindex="-1"`），SR 会朗读整个错误列表。
3. 点击链接跳到字段，字段本身 `aria-invalid` + 行内错误。
4. 不要同时用 `role="alert"` 和 `aria-live="assertive"` 包两层，会重复播报。

### 7.3 `autocomplete` 令牌（1.3.5）

| 字段              | `autocomplete`                                                                          |
| ----------------- | --------------------------------------------------------------------------------------- |
| 姓名（全名）      | `name`                                                                                  |
| 名 / 姓           | `given-name` / `family-name`                                                            |
| 邮箱              | `email`                                                                                 |
| 电话              | `tel`（可加 `tel-national`）                                                            |
| 公司              | `organization`                                                                          |
| 地址              | `street-address`、`address-line1/2`、`address-level2`（城市）、`postal-code`、`country` |
| 用户名            | `username`                                                                              |
| 当前密码 / 新密码 | `current-password` / `new-password`                                                     |
| 一次性验证码      | `one-time-code`                                                                         |
| 信用卡            | `cc-number`、`cc-exp`、`cc-csc`、`cc-name`                                              |
| 生日              | `bday`（或 `bday-day/month/year`）                                                      |
| 数量              | `quantity`（配合 spinbutton）                                                           |

令牌表以 WHATWG 为准：<https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill>。**密码管理器依赖它**，也是 3.3.8 Accessible Authentication 的基础。

### 7.4 `type` 与 `inputmode`

| 场景     | 推荐                                                                      | 避免                                       |
| -------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| 邮箱     | `type="email"` + `inputmode="email"` + `autocomplete="email"`             | 只用 `type="text"`                         |
| 电话     | `type="tel"` + `inputmode="tel"`                                          | `type="number"`（会丢前导 0、允许 e/+）    |
| 整数数量 | `type="text"` + `inputmode="numeric"` + `pattern="[0-9]*"`，或 spinbutton | `type="number"` 做金额/编号                |
| 小数金额 | `type="text"` + `inputmode="decimal"`                                     | `type="number"`（locale 小数点、滚轮误改） |
| 搜索     | `type="search"` + `inputmode="search"`                                    | 无                                         |
| 验证码   | `type="text"` + `inputmode="numeric"` + `autocomplete="one-time-code"`    | `type="number"`                            |
| 网址     | `type="url"` + `inputmode="url"`                                          | 无                                         |

`type="number"` 的四个坑：滚轮聚焦即改值、上下键误触、无法格式化（千分位/货币）、不同 locale 的小数点解析不一致。**结论：金额、编号、验证码一律不用 `type="number"`。**

### 7.5 中文 IME 与组合事件

中文输入（拼音）期间，`input` 事件会在**组合未上屏**时触发。若此时做过滤、格式化、长度截断、远程搜索，会出现"拼音字母被吞/候选词丢失/光标跳动"。

```tsx
function SearchInput({ onSearch }: { onSearch: (v: string) => void }) {
    const composing = useRef(false);
    const [value, setValue] = useState("");

    return (
        <input
            value={value}
            onChange={(e) => {
                setValue(e.target.value);
                // 组合期间绝不触发远程搜索
                if (!composing.current && !(e.nativeEvent as InputEvent).isComposing) {
                    onSearch(e.target.value);
                }
            }}
            onCompositionStart={() => {
                composing.current = true;
            }}
            onCompositionEnd={(e) => {
                composing.current = false;
                onSearch((e.target as HTMLInputElement).value);
            }}
            onKeyDown={(e) => {
                // 组合中的 Enter 用于选词，不能提交表单/选中选项
                if (e.key === "Enter" && (composing.current || e.nativeEvent.isComposing)) {
                    e.preventDefault();
                    return;
                }
                // 组合中的 Escape 用于取消候选，不能关闭 Dialog/Popover
                if (e.key === "Escape" && (composing.current || e.nativeEvent.isComposing)) {
                    e.stopPropagation();
                }
            }}
        />
    );
}
```

**5 条硬规则**：

1. 组合期间（`compositionstart` → `compositionend`）不做值变换、不做过滤、不截断、不发请求。
2. `keydown` 中检查 `e.nativeEvent.isComposing || e.keyCode === 229`，避免 Enter/Escape/方向键被业务逻辑抢走。
3. 受控组件的 `value` 不要在 `onChange` 里"纠正"用户输入（如自动去空格、自动大写），否则 IME 候选会错乱；在 `onBlur` 或提交时清洗。
4. `maxLength` 按 UTF-16 计数，emoji/生僻字会误判；用 `Array.from(value).length` 或 `Intl.Segmenter`。
5. `compositionend` 后浏览器可能再触发一次 `input`；用 ref 标记去重，避免重复搜索。

参考：MDN CompositionEvent <https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent>；`isComposing` <https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing>。

### 7.6 required / disabled / readonly

| 状态                   | 语义           | 焦点     | 读屏     | 注意                                                        |
| ---------------------- | -------------- | -------- | -------- | ----------------------------------------------------------- |
| `required`             | 必填           | 可聚焦   | "必填"   | 自定义控件加 `aria-required`                                |
| `disabled`             | 不可用（原生） | 不可聚焦 | 通常跳过 | 表单整体不可用时才用；局部禁用考虑 `aria-disabled` + 可聚焦 |
| `aria-disabled="true"` | 不可用但可发现 | 可聚焦   | "不可用" | 按钮/菜单项推荐；需自行阻断点击                             |
| `readonly`             | 只读           | 可聚焦   | "只读"   | 值需要被复制/朗读时用                                       |
| `aria-readonly`        | 自定义控件只读 | 可聚焦   | "只读"   | grid/自定义输入                                             |

### 7.7 屏幕阅读器播报顺序

理想顺序：**名称 → 角色 → 状态（必填/无效）→ 当前值 → 描述（hint/error）**。
常见破坏方式：

- 用 `aria-label` 覆盖可见 label（违反 2.5.3，语音控制用户无法用可见文字定位）。
- 把 hint 写成 `title`（移动端不播报）。
- 错误用 `role="alert"` 且每次按键都更新（刷屏）。
- 同一段文字既在 `aria-describedby` 又在 `aria-label` 里（重复）。
- 字符计数每次输入都 `aria-live`（改为失焦/接近上限时播报）。

---

## 8. 触屏与指针

### 8.1 目标尺寸

- **2.5.8（AA）**：≥24×24 CSS px，或满足"24px 直径圆不相交"的间距例外；行内链接、UA 控件、必要场景豁免。
- **2.5.5（AAA）**：≥44×44。
- 本项目现有：Button sm 高 32 ✓；Dialog 关闭 34×34 ✓；Switch 46×26（高 26 ✓ 但接近下限）；图标按钮若 20×20 则 ✗。

**扩大命中区而不改变视觉**：

```css
.icon-button {
    position: relative;
    width: 24px;
    height: 24px;
}
.icon-button::after {
    content: "";
    position: absolute;
    inset: -10px; /* 命中区变 44×44 */
    border-radius: 50%;
}
```

注意 `::after` 不得覆盖相邻目标（否则间距例外失效），相邻按钮间距 <8px 时改用真实 padding。

### 8.2 hover-only 内容

触摸设备没有 hover。规则：

1. hover 出现的内容，**focus 也必须出现**（2.1.1）。
2. 必须可关闭（`Esc`）、可悬停（指针可移入）、持久（1.4.13）。
3. `@media (hover: none)` 下改为"点击展开"或"常驻显示"。
4. 不要用 `mouseenter` 才渲染 DOM；用 CSS `:hover/:focus-within` + `aria-expanded` 同步状态。

### 8.3 安全区与视口

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<!-- 禁止 user-scalable=no / maximum-scale=1：会阻止双击缩放，违反 1.4.4 -->
```

```css
.toast-region {
    bottom: calc(16px + env(safe-area-inset-bottom));
}
.app-footer {
    padding-bottom: env(safe-area-inset-bottom);
}
```

固定底部操作条 + Toast 同时出现时，用 `--toast-safe` 变量给 `scroll-padding-bottom` 留空间（2.4.11）。

### 8.4 缩放、`touch-action` 与手势

- **不要禁用双击缩放**（1.4.4 Resize Text / 移动端惯例）；`user-scalable=no` 是反模式。
- `touch-action: manipulation` 去掉 300ms 点击延迟，同时保留 pinch-zoom——适合按钮。
- 横向 Carousel/Slider：容器 `touch-action: pan-y`，拖拽把手 `touch-action: none`；必须同时提供按钮/键盘替代。
- 拖拽把手建议 ≥44×44，且拖拽开始有 `aria-grabbed` 的替代（ARIA 1.1 已废弃 `aria-grabbed`，改用 live region 播报"已移动到第 3 位"）。

### 8.5 拖拽的无障碍替代（2.5.7）

| 场景     | 拖拽     | 单指针替代          | 键盘替代                         |
| -------- | -------- | ------------------- | -------------------------------- |
| 列表排序 | 拖动行   | 每行"上移/下移"按钮 | 聚焦把手 + `Alt+Up/Down`（可选） |
| 看板换列 | 拖卡片   | 卡片菜单"移动到…"   | 菜单键盘操作                     |
| Slider   | 拖 thumb | 点击轨道任意位置    | 方向键/Home/End                  |
| Carousel | 滑动     | 上一张/下一张按钮   | 按钮 Tab + Enter                 |
| 图片裁剪 | 拖动选框 | 输入框设坐标/缩放   | 同上                             |
| 颜色选择 | 拖色轮   | 输入 HEX/RGB        | 同上                             |

排序完成后必须播报：`announce("已移动到第 3 位，共 8 项")`（4.1.3 状态消息）。

---

## 9. 暗色模式专属 a11y 问题

### 9.1 对比度反转与晕影（halation）

- 浅色文字在近黑背景上会"变粗、发光"，这叫 halation；纯白 `#fff` + 700 字重最明显。对策：正文用 `#e3ece4`（15.2），字重降一档（600→500 或 500→400），字号 <14px 时提高 `letter-spacing: 0.01em`。
- 暗色下 WCAG 比值**系统性高估**可读性（APCA 原文明确批评）；设计评审同时看 `Lc`。
- 大面积 accent（lime）会产生"荧光"感；限制面积，正文不用。

### 9.2 图片与图表

- **不要用 CSS `filter: invert()` 处理图片**：肤色、品牌色、图表语义全错；提供暗色资源或半透明遮罩。
- 透明 PNG/Logo 在暗色下可能消失：给容器加 `--control-border` 或浅色底板。
- 图表：
    - 网格线可低对比（装饰），但**数据线/柱 ≥3:1**（1.4.11）。
    - 标签文字 ≥4.5:1；不要用 `--faint`。
    - 每条序列**直接标注**，不要只靠图例颜色。
    - 提供"数据表"替代（可展开的 `<table>`），这是最稳的无障碍方案。
    - Tooltip/十字准线要支持键盘（方向键移动数据点）与 `Esc`。

### 9.3 焦点环在媒体/图片上

图片、视频、渐变背景上的 focus ring 必须有 halo：外环 accent + 内环 `rgba(8,11,9,.9)` 或白色双层，确保在任意背景上可见。不要在图片上只用 `outline: 2px accent`（浅色图片上对比不足）。

### 9.4 仅靠颜色传达（暗色下更严重）

| 场景                    | 现风险                        | 修复                                   |
| ----------------------- | ----------------------------- | -------------------------------------- |
| 状态 Badge（成功/失败） | 只有 `--mint`/`--danger` 底色 | 加 ✓/✕ 图标 + 文本                     |
| 表单错误                | 只有红边                      | 图标 + 文本 + `aria-invalid`           |
| 代码高亮                | 注释用 `--faint`（3.27）      | 注释提到 `--muted`（6.23）或专用 token |
| 图表序列                | 只靠 hue                      | 图案 + 直接标注 + 亮度差               |
| 选中行                  | 只有 `--accent-soft`（1.42）  | 3px accent 左边条 + 勾选               |
| diff 视图               | 红/绿底                       | 加 `+`/`-` 前缀与纹理                  |

### 9.5 高对比度 / forced-colors

- Windows 高对比度模式会**丢弃 `box-shadow`、背景图、部分 `background-color`**。
- 所有控件必须有 `border` 或 `outline` 作为形状来源；图标按钮用 `currentColor`。
- 测试：Edge → `forced-colors: active` 模拟；确保焦点环、开关状态、选中态仍可辨。
- 可用 `forced-color-adjust: none` 保护品牌色，但要自行保证对比（谨慎使用）。

### 9.6 半透明与 `backdrop-filter`

`Dialog.css` 的 `::backdrop` 用了 `backdrop-filter: blur()`；其上的文字对比随底层内容变化，**不可预测**。规则：

- 承载文字的浮层必须有不透明底色（≥95%），模糊只做装饰。
- `@supports not (backdrop-filter: blur(1px))` 提供纯色回退。
- 半透明遮罩上的 focus ring 需要 halo，不能假设背景色。

---

## 10. React 19 实现细节

### 10.1 `ref` as prop（不再需要 `forwardRef`）

React 19 起，函数组件可直接把 `ref` 当普通 prop 接收；`forwardRef` 仍可用但已不必要。对本项目的意义：`Button`、`Surface`、`Field`、`Dialog` 都能透传 ref，焦点管理不再依赖 `document.activeElement`。

```tsx
import type { ComponentPropsWithRef } from "react";

type ButtonProps = ComponentPropsWithRef<"button"> & {
    variant?: "solid" | "outline" | "ghost" | "quiet";
};

export function Button({ variant = "solid", className, ...rest }: ButtonProps) {
    // rest.ref 直接落到真实 <button>，调用方无需 forwardRef
    return <button className={cx("button", `button--${variant}`, className)} {...rest} />;
}
```

注意：

- ref cleanup 函数（React 19 支持 `ref={(node) => { ...; return () => {...} }}`）可用于解绑 ResizeObserver/事件。
- 需要同时合并内部 ref 与外部 ref 时，写 `mergeRefs` 工具；不要用 `cloneElement`。
- 多态 `as` 组件（`Button as="a"`）必须保证 role 与键盘行为随元素变化，不要只换标签。

### 10.2 `useId`

- 用途：`label htmlFor`、`aria-labelledby`、`aria-describedby`、`aria-controls`、`aria-activedescendant`。
- 特性：跨 SSR/ hydration 稳定；**不要**用作列表 `key`；**不要**在测试里断言具体格式。
- React 19 改变了 `useId` 的生成格式（前缀/字符集与 18 不同），不要依赖具体字符串；无论哪个版本，都不要把原始 id 直接拼进 CSS 选择器（`querySelector('#:r0:')` 会抛错）。
- 封装：

```tsx
export function useFieldIds(externalId?: string) {
    const uid = useId();
    const base = externalId ?? `f-${uid.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    return { input: base, hint: `${base}-hint`, error: `${base}-error`, label: `${base}-label` };
}
```

> 现有 `foundation/useField.ts` 直接用 `useId()` 作为 DOM id：React 18 的 `:r0:` 与 React 19 的新格式都不是 CSS 选择器安全字符，`document.querySelector('#' + id)` 会抛错，`aria-controls` 在部分工具链里也会断。封装时必须 sanitize（`[^a-zA-Z0-9_-]` 过滤）。

### 10.3 `inert`

- React 19 支持布尔 `inert`（此前需 `inert=""` 或 `ref` 设置）。**[推断]** 需确认 `@types/react` 版本已包含。
- `inert` 会同时移出焦点与可访问性树，是"背景隔离"的首选；`aria-hidden` 只移出可访问性树，若内部有焦点会产生浏览器警告与焦点丢失。
- 浮层场景：对 `#root` 设 `inert`，浮层放在 `#layer-root`；关闭时移除。
- 不要给 `<dialog>` 自身设 `inert`（会连内容一起失效）。

### 10.4 `aria-*` 透传

- React 会把所有 `aria-*` 原样输出；布尔值渲染为 `"true"/"false"`，`undefined/null` 不输出。
- 组件库必须**允许调用方覆盖**内部 `aria-*`，同时保证关键属性（如 `aria-expanded`）由组件控制：

```tsx
const { "aria-describedby": userDescribedBy, ...rest } = props;
const describedBy = [ids.hint, ids.error, userDescribedBy].filter(Boolean).join(" ") || undefined;
```

- 不要用 `aria-label` 覆盖可见文本（2.5.3）；`aria-labelledby` 优先引用可见元素。
- 事件处理器不要 `preventDefault` 掉浏览器原生行为（组合框的文本编辑、方向键滚动），除非有完整替代。

### 10.5 原生 `<dialog>` 的 10 个 a11y 陷阱

| #   | 陷阱                                                         | 说明 / 对策                                                                                 |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1   | 用 `open` 属性代替 `showModal()`                             | `open` 只是显示，无 modal 语义、无 backdrop、无 inert；必须 `showModal()`                   |
| 2   | 忘记 `aria-modal="true"`                                     | 原生 dialog 在部分 AT 组合下仍需显式声明；且只有"真模态"才能加                              |
| 3   | 初始焦点落在关闭按钮                                         | 关闭按钮通常是第一个可聚焦元素，SR 用户先听到"关闭"；应聚焦标题或首个输入                   |
| 4   | 无 `aria-labelledby`                                         | 读屏只报"对话框"；必须关联可见标题                                                          |
| 5   | `aria-describedby` 指向整段内容                              | 长内容会被一次性朗读且无法按结构浏览；仅短描述使用                                          |
| 6   | `Esc` 被 `preventDefault` 后不关闭                           | `cancel` 事件里 `preventDefault()` 必须配合状态同步 `close()`，否则"假死"                   |
| 7   | backdrop 点击误关                                            | 用 `click` + `target===dialog` 会在拖选、触摸滚动时误触；记录 `pointerdown` 起点 + 位移阈值 |
| 8   | 背景仍可滚动                                                 | `showModal()` 不锁 body 滚动；需 `overflow:hidden` + 滚动条补偿，关闭恢复                   |
| 9   | 关闭后焦点不回                                               | 原生会归还到"打开前焦点元素"，但若该元素已卸载则落到 body；需手动 fallback                  |
| 10  | dialog 放在 `aria-hidden` / `inert` 祖先内，或与 portal 混用 | 内容被一起隐藏；dialog 必须挂在未被隔离的容器（通常在 `#layer-root`）                       |

补充：`<dialog>` 内嵌 `<dialog>` 合法，但焦点归还链要自己维护；React StrictMode 下 effect 双执行，`showModal()` 前要判断 `dialog.open`，`close()` 后要重置同步标记（现有 `Dialog.tsx` 已处理 `syncingCloseRef`，可保留）。

参考：Scott O'Hara《Use the dialog element (reasonably)》<https://www.scottohara.me/blog/2023/01/26/use-the-dialog-element.html>（记录了 2023 年 HTML 规范对 dialog 初始焦点算法的修正：按顺序可聚焦元素、`autofocus` 优先、回退到 dialog 自身）；CSS-Tricks <https://css-tricks.com/there-is-no-need-to-trap-focus-on-a-dialog-element/>。

### 10.6 Portal 与层叠

```tsx
const Layer = ({ children }: { children: ReactNode }) => createPortal(children, document.getElementById("layer-root")!);
```

要点：

- React 事件会沿 **React 树**冒泡（不是 DOM 树），所以浮层内的 `onKeyDown` 仍能拿到父级 handler；但 `document` 级监听要看 DOM。
- DOM 顺序决定 Tab 顺序；浮层容器按打开顺序追加，关闭时从末尾移除，保证"最后打开的层在最后"。
- `z-index` 分层：`--z-base: 0; --z-sticky: 100; --z-overlay: 200; --z-modal: 300; --z-toast: 400; --z-tooltip: 500`；原生 dialog/popover 在 top layer，不受 z-index 影响。
- 滚动锁用计数器（嵌套浮层时只锁一次）；关闭时恢复到打开前的 `overflow`。
- `aria-hidden`/`inert` 只作用于页面根，不作用于 `#layer-root`。

### 10.7 StrictMode、SSR 与并发

- StrictMode 会双执行 effect：`showModal`/`close`、`addEventListener`、`focus()` 都要幂等。
- SSR 下不要用 `useLayoutEffect` 做焦点（会警告）；用 `useEffect` 或 `useIsomorphicLayoutEffect`。
- `useId` 是 SSR 安全的唯一 id 来源；不要用 `Math.random()` 生成 id（hydration 不匹配）。
- `startTransition` 更新列表时，焦点元素可能被重渲染；给列表项稳定 `key`，并在更新后检查 `document.activeElement` 是否仍连接。
- React Compiler 可能缓存组件；依赖 `ref`/DOM 的副作用不要写成"纯渲染期"逻辑。

---

## 11. 必做的 12 条全局规则

> 这 12 条写入 `docs/` 与 PR 模板，作为"不可协商"基线；违反任一条需要架构组签字豁免。

1. **原生优先**：能用 `<button>`、`<input type=checkbox|radio>`、`<select>`、`<dialog>`、`<table>`、`<nav>`、`<ul>` 就不写 ARIA；ARIA 只补原生缺口。禁止 `div role="button"`。
2. **每个交互组件必须有可访问名**，且名称包含可见文本（2.5.3）；icon-only 组件把 `label` 设为必填 prop。
3. **键盘全路径**：`Tab` 进入 → 方向键/空格/回车操作 → `Esc` 退出 → 焦点归还；组件内部自成复合控件时只保留 1 个 tab stop（roving tabindex 或 activedescendant）。
4. **焦点永远可见且不被完全遮挡**：`:focus-visible` + 双环 + `outline`；`scroll-padding-top` 抵消 sticky header；浮层不覆盖当前焦点。
5. **焦点管理四件事**：打开移入、关闭归还、删除后就近、路由变化后聚焦标题。任何"焦点丢到 body"都是 bug。
6. **状态用 ARIA 表达**：`aria-expanded/selected/checked/pressed/current/invalid/busy`，不靠 class 或颜色；语义选择按 3.7 表。
7. **颜色不是唯一手段**（1.4.1）：状态 = 颜色 + 图标/形状 + 文本；链接常驻下划线；图表直接标注。
8. **对比度 token 门禁**：正文 4.5、大字 3.0、非文本 3.0、焦点 3.0、disabled ≥3.0（推荐）；暗色另用 APCA `Lc` 复核；新增 token 必须过对比度单测。
9. **目标尺寸**：≥24×24（AA），主操作/触屏 ≥44×44；hover-only 内容必须可聚焦、可关闭、可持久（1.4.13）。
10. **动效可关闭**：尊重 `prefers-reduced-motion`；无 >3Hz 闪烁；自动播放 >5s 必须有暂停；无视差/滚动劫持。
11. **状态消息不抢焦点**：`role="status"`（polite）或 `role="alert"`（真正紧急）；Toast 可关闭/可暂停；避免重复播报。
12. **表单可纠错**：永久 label、hint/error 关联、`aria-invalid`、错误含修正建议、error summary 可聚焦、`autocomplete`/`inputmode` 正确、IME 组合期不打断。

---

## 12. CI 与评审检查清单

### 12.1 自动化门禁（阻断合并）

| #   | 检查                     | 工具/实现                                                                                                                                                                                      | 阈值                       |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| A1  | 静态 a11y lint           | `eslint-plugin-jsx-a11y` 推荐规则集 + `no-static-element-interactions`、`click-events-have-key-events`、`label-has-associated-control`、`role-has-required-aria-props`、`prefer-tag-over-role` | 0 error                    |
| A2  | 组件渲染 axe             | `vitest-axe` 或 Storybook `@storybook/addon-a11y` test-runner，每个 Story 跑一次                                                                                                               | 0 serious / 0 critical     |
| A3  | 对比度 token 单测        | 附录 B 脚本，断言 token 对 ≥ 阈值                                                                                                                                                              | 0 fail                     |
| A4  | 禁用模式 lint            | 自定义 ESLint/Stylelint 规则：`outline: none`（无同规则替代）、`onClick` on `div`、`tabIndex={0}` 于非交互元素、`aria-hidden` 内有 `tabIndex`、`dangerouslySetInnerHTML`                       | 0 命中（白名单需注释理由） |
| A5  | 键盘 E2E                 | Playwright：每个交互组件至少 1 条脚本，断言 `document.activeElement`、`aria-expanded`、`Esc` 后焦点位置                                                                                        | 0 fail                     |
| A6  | 可访问名快照             | 测试中 `getByRole(name)` 断言；禁止 `getByTestId` 跳过名称                                                                                                                                     | 0 fail                     |
| A7  | reduced-motion 截图      | Playwright `emulateMedia({ reducedMotion: "reduce" })` + 视觉回归                                                                                                                              | 无位移差异                 |
| A8  | Storybook a11y checklist | 每个组件 Story 标注 `parameters.a11y.test = "error"`                                                                                                                                           | 0 violation                |

### 12.2 PR 评审检查清单（人工，复制到 PR 模板）

- [ ] 组件有明确的 role/结构，优先使用原生元素。
- [ ] 可访问名非空；icon-only 有 `label`；名称包含可见文本。
- [ ] `Tab` 能进入，`Shift+Tab` 能离开；无键盘陷阱。
- [ ] 方向键/Home/End/Space/Enter 行为符合 APG；横向组件不吞上下键。
- [ ] `Esc` 能关闭浮层，焦点回到触发器。
- [ ] 浮层打开时背景 `inert`，滚动锁定，关闭后恢复。
- [ ] 焦点环在深色/浅色/图片/tint 背景上均可见；`forced-colors` 下可见。
- [ ] 所有状态有 ARIA 表达；读屏能播报展开/选中/无效/忙碌。
- [ ] 无颜色单独承载信息（错误、状态、图表、diff）。
- [ ] 目标 ≥24×24；触屏主操作 ≥44×44；hover-only 内容有 focus/点击替代。
- [ ] `prefers-reduced-motion` 下无位移/缩放/视差。
- [ ] 表单 label/hint/error/`aria-invalid`/`autocomplete`/`inputmode` 正确；IME 组合期无过滤。
- [ ] 中文文案完整；无硬编码英文 `aria-label`。
- [ ] 新增 token 已过对比度单测；暗色/亮色双主题检查。
- [ ] 至少 1 次屏幕阅读器手测（新增组件）或说明豁免理由。

### 12.3 手动测试矩阵（发布前）

| 维度       | 组合                               | 重点                             |
| ---------- | ---------------------------------- | -------------------------------- |
| 屏幕阅读器 | NVDA + Firefox / Chrome（Windows） | 表单、Dialog、Tabs、Menu         |
| 屏幕阅读器 | JAWS + Chrome（Windows）           | 表格、combobox                   |
| 屏幕阅读器 | VoiceOver + Safari（macOS/iOS）    | Dialog、Popover、触摸手势        |
| 屏幕阅读器 | TalkBack + Chrome（Android）       | Dialog 焦点、Switch、Toast       |
| 键盘       | 仅键盘，无鼠标                     | 全流程；skip link；焦点顺序      |
| 缩放       | 200% / 400% / 320px 宽             | 1.4.4、1.4.10 Reflow；固定头遮挡 |
| 高对比度   | Windows 高对比度 / `forced-colors` | 焦点环、边框、状态               |
| 动效       | `prefers-reduced-motion: reduce`   | 无位移/视差/自动播放             |
| 色觉       | deuteranopia / protanopia 模拟     | 状态色、图表、错误               |
| 输入法     | 中文拼音（macOS/Windows）          | 组合期不打断、Enter 不误提交     |
| 触屏       | iOS/Android 真机                   | 24/44 目标、safe-area、双击缩放  |

### 12.4 豁免流程

无法满足时（如品牌色、第三方嵌入）：

1. 在组件目录写 `a11y-exceptions.md`：条款、原因、影响用户、替代方案、复查日期。
2. PR 中标注 `a11y-exception` 标签，架构组审批。
3. 豁免必须有**替代路径**（如颜色不足则加图标/文本），不能"仅记录"。

---

## 13. 反模式与真实错误案例

### 13.1 案例总表

| #   | 反模式                              | 真实来源                                                                                                                                                   | 机制                                                                                                                     | 本项目风险点                                   | 规避                                                                                         |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | `aria-hidden` 与 portal 浮层冲突    | [radix-ui/primitives#3701](https://github.com/radix-ui/primitives/issues/3701)（React 19: Select inside Dialog causes aria-hidden focus freeze）           | 浮层打开时把 `body` 其他子节点设为 `aria-hidden`；Select 弹层 portal 到 dialog 之外 → 被隐藏但仍有 DOM 焦点 → 焦点"冻结" | Dialog 内放 Select/Combobox/DatePicker 时必现  | 用 `inert` 隔离 `#root`，浮层统一进 `#layer-root`；不要按 `body.children` 批量 `aria-hidden` |
| 2   | 关闭后焦点停在已卸载节点            | [mui/material-ui#46682](https://github.com/mui/material-ui/issues/46682)（Prevent focus from staying on interactive elements after closing Dialog/Drawer） | 关闭动画/卸载顺序导致 `focus()` 落空，焦点回 body                                                                        | 现有 Dialog 依赖原生归还；若触发器条件渲染会丢 | 关闭前记录 opener；`isConnected` 检查；动画结束后再卸载                                      |
| 3   | TalkBack 不进入 Dialog              | [mui/material-ui#44779](https://github.com/mui/material-ui/issues/44779)（Dialog focus not moving into dialog content when TalkBack is on）                | 移动端 SR 的焦点模型与 DOM focus 不同步；`aria-modal` + 初始焦点缺失                                                     | 移动端打开含长内容的 Dialog                    | 显式 `aria-modal`、标题 `tabindex=-1`、打开后 `focus()`；真机 TalkBack 必测                  |
| 4   | Modal 内元素无法聚焦                | [ant-design/ant-design#52916](https://github.com/ant-design/ant-design/issues/52916)（Focusing elements in Modal not working）                             | 容器 `tabindex=-1`/`aria-hidden`/动画 `visibility` 组合导致 `focus()` 无效                                               | 自建 Popover 用 `visibility:hidden` 过渡时     | 关闭态用 `display:none`/条件渲染；打开后再 `focus()`（`requestAnimationFrame`）              |
| 5   | 嵌套 Modal + 销毁策略               | [ant-design/ant-design#56687](https://github.com/ant-design/ant-design/issues/56687)（嵌套 modal，destroyOnHidden 后无法聚焦）                             | 内层销毁后焦点链断裂；外层未重新接管                                                                                     | 未来 Dialog 嵌套（确认框套表单）               | 嵌套层用统一 Layer 栈；关闭内层后显式聚焦外层标题/原字段                                     |
| 6   | 浮层库在 React 19 下行为差异        | [radix-ui/primitives#3495](https://github.com/radix-ui/primitives/issues/3495)（Dropdown > Dialog behavior different in React and Next）                   | SSR/hydration 与事件时序差异，导致打开时机/焦点不同                                                                      | 若引入第三方 primitive                         | 固定 React 19 + 自家 Layer；E2E 覆盖 SSR 水合后首次交互                                      |
| 7   | 把整页塞进 dialog                   | [Scott O'Hara: Use the dialog element (reasonably)](https://www.scottohara.me/blog/2023/01/26/use-the-dialog-element.html)                                 | 长内容、多个 heading/landmark 放进 modal，SR 导航困难                                                                    | "设置"类大面板用 Dialog                        | >1 屏内容改用页面/抽屉；Dialog 只放短任务                                                    |
| 8   | 手写 focus trap 叠加原生 dialog     | [CSS-Tricks: There is No Need to Trap Focus on a Dialog Element](https://css-tricks.com/there-is-no-need-to-trap-focus-on-a-dialog-element/)               | 双重 trap 导致 Tab 卡死或跳过元素                                                                                        | 若给 `<dialog>` 再包 FocusScope                | 原生 dialog 不再手写 trap；只处理初始焦点与归还                                              |
| 9   | Tooltip pattern 未定稿              | [APG Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)（页面顶部 NOTE：work in progress, no consensus）                                  | 社区对 `aria-describedby`/可交互 tooltip 仍有分歧                                                                        | 直接把 APG 当唯一真理                          | 以 WCAG 1.4.13 + `role=tooltip` + `Esc` 为底线；不把交互内容放 tooltip                       |
| 10  | sticky header 完全遮挡焦点          | [F110](https://www.w3.org/WAI/WCAG22/Techniques/failures/F110)                                                                                             | 固定头/脚遮住聚焦元素                                                                                                    | App 有固定侧栏/头部                            | `scroll-padding-top`；`scroll-margin-top`；E2E 断言元素在视口内                              |
| 11  | hover 内容不可悬停                  | [F95](https://www.w3.org/WAI/WCAG22/Techniques/failures/F95)                                                                                               | 鼠标移向浮层时消失                                                                                                       | Tooltip/Popover 用 `mouseleave` 立即关         | 延迟关闭（100–200ms）+ 浮层可 hover + `Esc`                                                  |
| 12  | 状态消息不可程序化识别              | [F103](https://www.w3.org/WAI/WCAG22/Techniques/failures/F103)                                                                                             | Toast 只有视觉动画，无 `role=status`                                                                                     | Toast 计划新增                                 | `role=status` + `aria-atomic` + 可关闭                                                       |
| 13  | live region 与内容同时插入 → 不播报 | [ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22) + 4.1.3                                                                                     | `aria-live` 容器必须先存在于 DOM，之后再改文本；条件渲染整块会丢播报                                                     | `Field` 的 error span 就是"边创建边播报"       | 全局常驻 `Announcer`；或容器常驻、只换文本                                                   |
| 14  | `aria-describedby` 指向未渲染 id    | axe 规则 `aria-valid-attr-value`                                                                                                                           | hint 与 error 互斥渲染，id 列表却同时包含两者                                                                            | `Field`/`useField` 当前实现                    | 只拼实际渲染的 id，或两者都保持挂载                                                          |

### 13.2 三个必须记住的机制

**（1）"隐藏"有两套语义，不能混用。**
`aria-hidden` 只影响可访问性树；`inert` 同时移除焦点、点击与 AT。把 `aria-hidden` 用在"背景仍可 Tab"的场景，会让焦点进入一个"对读屏不存在"的区域，用户会以为页面卡死。

**（2）Portal 改变 DOM 顺序，不改变 React 事件树。**
React 的 `onKeyDown` 仍会沿组件树冒泡，所以浮层内能收到父级 handler；但浏览器 Tab 顺序按 DOM 走。任何"焦点在浮层内、Tab 却跑到页面"的问题，本质都是 DOM 顺序 + 未 trap。

**（3）焦点是"状态"，不是"样式"。**
`focus()` 调用时元素必须已挂载、可见、未 `inert`、未 `display:none`。动画期间调用 `focus()` 经常无效；正确顺序是"先渲染 → 再 focus → 再播放进入动画"。

---

## 14. 实施优先级：先建基础设施

### 14.1 P0 基础设施（写新组件之前必须完成）

> **2026-10-20 03:45 状态**：✅ 已有（需接线/补测）：`VisuallyHidden`、`Portal`、`Field/useField`、`useControllableState`、`useMergedRef`、`useRovingTabIndex`、`useFocusTrap`、`useDismiss`、`useAnchoredPosition`、`cx`；⚠️ 部分：`tokens.css`（缺对比度 token、未 import）、`Portal`（无 layer 栈）；❌ 缺失：`Announcer`、`Layer` 管理器、`Slot`/多态、`useReducedMotion`、`a11yMessages`、对比度 CI 门禁。**表中原有实现不要重写，按缺口补齐。**

| 模块                                    | 解决什么问题                                      | 被谁依赖                                                    | 验收                                      |
| --------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| `VisuallyHidden` / `.sr-only`           | 屏幕阅读器专用文本                                | 所有组件                                                    | 视觉不可见、SR 可读、不被 `display:none`  |
| `Announcer` + `useAnnounce`             | 状态消息统一播报（4.1.3）                         | Toast、排序、保存、搜索结果                                 | polite/assertive 双通道；同文本可重复播报 |
| `useId` 封装 `useFieldIds`              | label/hint/error/panel id 一致                    | 所有表单、Tabs、Menu                                        | 无重复 id；SSR 稳定                       |
| `Field`（Label/Hint/Error/Description） | `aria-describedby` 拼接、`aria-invalid`、必填标记 | TextInput、Select、Checkbox、Radio、NumberInput、DatePicker | 错误可被 SR 读出；顺序正确                |
| `FocusScope` + `useFocusReturn`         | 移入/循环/归还                                    | Dialog、Popover、Menu、Combobox、Toast 交互                 | 关闭后 `activeElement` = opener           |
| `Layer` / `Portal` 管理器               | 层叠、Esc 栈、滚动锁、`inert` 隔离                | 所有浮层                                                    | 嵌套 3 层仍正确；背景不可 Tab             |
| `Slot` / `mergeRefs` / 多态 `as`        | ref 透传、语义随元素变化                          | Button、Card、Chip、Nav                                     | `as="a"` 时 role/键盘正确                 |
| `useRovingTabIndex` + collection        | Tabs/Menu/Radio/Segmented/Toolbar/Listbox 共用    | 6+ 组件                                                     | 组内 1 个 tab stop；方向键循环            |
| `useControllableState`                  | 受控/非受控统一                                   | 所有表单组件                                                | 两种模式行为一致；无 React 警告           |
| `useReducedMotion` + motion tokens      | 动效降级                                          | Dialog、Toast、Carousel、Skeleton                           | reduce 下无位移                           |
| 对比度 token + 单测                     | 颜色门禁                                          | 全部                                                        | CI 通过                                   |

### 14.2 组件实施批次（按依赖排序）

| 批次            | 组件                                                                                                      | 理由                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **B0 基础修复** | 修 Button（ref/命名/焦点环）、Dialog（6 项）、TextInput（border/placeholder/error）、Switch（label/焦点） | 现有组件是"事实标准"，新组件会抄它们                    |
| **B1 表单原子** | Checkbox、Radio、Range/Slider、NumberInput、Chip                                                          | 依赖 `Field` + roving tabindex；先做可复用逻辑          |
| **B2 浮层原子** | Tooltip、Popover、Menu、Toast                                                                             | 依赖 `Layer` + `FocusScope`；Tooltip 最简单，先跑通层叠 |
| **B3 复合控件** | Tabs、Accordion、SegmentedButton、Combobox                                                                | 依赖 roving/activedescendant + Layer                    |
| **B4 数据展示** | Table、List、Navigation、Pagination、Progress、Skeleton、Avatar                                           | 多为原生元素 + 少量 ARIA                                |
| **B5 高复杂**   | DatePicker、DataGrid/TreeGrid、Feed、Carousel                                                             | 依赖 B1–B4 全部能力；最后做                             |

### 14.3 关键 API 草案

```tsx
// 1) VisuallyHidden
export function VisuallyHidden({ children }: { children: ReactNode }) {
    return <span className="sr-only">{children}</span>;
}
// .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px;
//   overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap; border:0; }

// 2) Announcer：全局单例 live region，避免每个组件各建一个
type Politeness = "polite" | "assertive";
const AnnounceContext = createContext<(msg: string, p?: Politeness) => void>(() => {});

export function AnnouncerProvider({ children }: { children: ReactNode }) {
    const [polite, setPolite] = useState("");
    const [assertive, setAssertive] = useState("");
    const announce = useCallback((msg: string, p: Politeness = "polite") => {
        const set = p === "assertive" ? setAssertive : setPolite;
        set(""); // 先清空，保证同一文本可再次播报
        requestAnimationFrame(() => set(msg));
    }, []);
    return (
        <AnnounceContext.Provider value={announce}>
            {children}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {polite}
            </div>
            <div aria-live="assertive" aria-atomic="true" className="sr-only">
                {assertive}
            </div>
        </AnnounceContext.Provider>
    );
}

// 3) useControllableState
export function useControllableState<T>(opts: {
    value?: T;
    defaultValue: T;
    onChange?: (v: T) => void;
}): [T, (v: T) => void] {
    const { value, defaultValue, onChange } = opts;
    const [inner, setInner] = useState(defaultValue);
    const isControlled = value !== undefined;
    const current = isControlled ? value : inner;
    const set = useCallback(
        (v: T) => {
            if (!isControlled) setInner(v);
            onChange?.(v);
        },
        [isControlled, onChange],
    );
    return [current, set];
}

// 4) Field ids + 描述拼接
export function useField(opts: { id?: string; hint?: ReactNode; error?: ReactNode }) {
    const ids = useFieldIds(opts.id);
    const describedBy = [opts.hint && ids.hint, opts.error && ids.error].filter(Boolean).join(" ");
    return {
        ids,
        inputProps: {
            id: ids.input,
            "aria-invalid": opts.error ? true : undefined,
            "aria-describedby": describedBy || undefined,
        },
    };
}

// 5) Slot / mergeRefs（React 19 ref as prop）
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
    return (node) => {
        for (const ref of refs) {
            if (!ref) continue;
            if (typeof ref === "function") ref(node);
            else (ref as MutableRefObject<T | null>).current = node;
        }
    };
}
```

### 14.4 避免返工的三条原则

1. **一个行为只实现一次**：Esc 关闭、外点关闭、焦点归还、滚动锁、`aria-describedby` 拼接，全部下沉到 hook/primitive；组件层只声明"我要什么"。
2. **语义先于样式**：先写 role/属性/键盘表，再写 CSS；任何"先做视觉再补 ARIA"的组件都会在状态同步上出错（`aria-expanded` 与动画状态不同步是最常见的返工点）。
3. **可访问文案集中管理**：`a11yMessages.ts`（关闭、加载中、已选中、第 N 项，共 M 项、移除 X），支持 i18n；禁止在组件里硬编码英文。
4. **不要重复造 foundation**：新组件先查 `src/component/foundation/`；缺能力加到 foundation 并补测试，不要在组件内私建第二套（`VisuallyHidden` 与 `.visually-hidden` 已经是双份，需收敛）。

---

## 15. 附录

### 附录 A：APG pattern 直达链接

基础路径 `https://www.w3.org/WAI/ARIA/apg/patterns/`：

| 模式                 | slug                 | 模式             | slug              |
| -------------------- | -------------------- | ---------------- | ----------------- |
| Accordion            | `accordion/`         | Alert            | `alert/`          |
| Alert Dialog         | `alertdialog/`       | Breadcrumb       | `breadcrumb/`     |
| Button               | `button/`            | Carousel         | `carousel/`       |
| Checkbox             | `checkbox/`          | Combobox         | `combobox/`       |
| Dialog (Modal)       | `dialog-modal/`      | Disclosure       | `disclosure/`     |
| Feed                 | `feed/`              | Grid             | `grid/`           |
| Landmarks            | `landmarks/`         | Link             | `link/`           |
| Listbox              | `listbox/`           | Menu and Menubar | `menubar/`        |
| Menu Button          | `menu-button/`       | Meter            | `meter/`          |
| Radio Group          | `radio/`             | Slider           | `slider/`         |
| Slider (Multi-Thumb) | `slider-multithumb/` | Spinbutton       | `spinbutton/`     |
| Switch               | `switch/`            | Table            | `table/`          |
| Tabs                 | `tabs/`              | Toolbar          | `toolbar/`        |
| Tooltip              | `tooltip/`           | Tree View        | `treeview/`       |
| Treegrid             | `treegrid/`          | Window Splitter  | `windowsplitter/` |

示例（examples）：

- Date Picker Dialog：`https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/`
- Combobox（select-only / autocomplete）：`https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/`
- Data Grid：`https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/`
- Menu Button：`https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/`

### 附录 B：对比度检查脚本（Node，可直接进 CI）

```js
// scripts/check-contrast.mjs
// 用法: node scripts/check-contrast.mjs  → 失败时 exit 1
const srgb = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
    const n = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => srgb(parseInt(n.slice(i, i + 2), 16) / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};
// alpha 合成：把 rgba 前景叠到不透明背景上
const blend = (fg, alpha, bg) => {
    const f = fg.replace("#", ""),
        b = bg.replace("#", "");
    const out = [0, 2, 4].map((i) =>
        Math.round(alpha * parseInt(f.slice(i, i + 2), 16) + (1 - alpha) * parseInt(b.slice(i, i + 2), 16)),
    );
    return "#" + out.map((v) => v.toString(16).padStart(2, "0")).join("");
};

const T = {
    bg: "#080b09",
    panel: "#0f1612",
    panelStrong: "#141f18",
    panelMuted: "#0b110e",
    text: "#eff5ee",
    textSoft: "#c8d5cb",
    muted: "#8b9a90",
    faint: "#5d6b61",
    accent: "#c9f36d",
    accentInk: "#101607",
    mint: "#8fe0c8",
    danger: "#ff9a8d",
};

const checks = [
    // [名称, 前景, 背景, 最低比值]
    ["text/panel", T.text, T.panel, 4.5],
    ["textSoft/panel", T.textSoft, T.panel, 4.5],
    ["muted/panel", T.muted, T.panel, 4.5],
    ["accentInk/accent", T.accentInk, T.accent, 4.5],
    ["focusRing/panel", T.accent, T.panel, 3.0],
    // 半透明必须合成后再算
    ["lineStrong/panel", blend("#e7f4ea", 0.18, T.panel), T.panel, 1.0], // 装饰线，仅记录
    ["controlBorder(建议)/panel", "#616b64", T.panel, 3.0],
    ["placeholder(建议)/panelMuted", "#84938a", T.panelMuted, 4.5],
    ["disabledText(建议)/disabledSurface", "#93a297", "#1b241e", 4.5],
];

let failed = 0;
for (const [name, fg, bg, min] of checks) {
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(34)} ${r.toFixed(2)} (min ${min})`);
}
if (failed) {
    console.error(`\n${failed} contrast check(s) failed`);
    process.exit(1);
}
```

> 建议同时把"建议值"跑一遍再替换 token，避免改了 CSS 却没人复算。工具：WebAIM <https://webaim.org/resources/contrastchecker/>、APCA <https://apcacontrast.com/>。

### 附录 C：验收用例（Given/When/Then 示例）

```gherkin
Scenario: Dialog 键盘闭环
  Given 焦点在"打开设置"按钮上
  When 按下 Enter
  Then 焦点位于对话框内（标题或首个输入）
  And  背景内容不可 Tab（inert）
  When 按下 Escape
  Then 对话框关闭
  And  焦点回到"打开设置"按钮

Scenario: Tabs 单一 tab stop
  Given 页面有 3 个 tab
  When 连续按 Tab 进入 tablist
  Then 只经过 1 次 Tab 就落在当前选中的 tab
  When 按右方向键
  Then 下一个 tab 获得焦点并激活
  And  对应 panel 的 aria-labelledby 指向该 tab

Scenario: Combobox 中文输入
  Given 组合框为空
  When 输入拼音 "zhong"（未上屏）
  Then 不触发远程过滤、不选中候选项
  When 选择"中文"并上屏
  Then 触发一次搜索
  And  aria-expanded="true"，aria-activedescendant 指向存在的选项

Scenario: Slider 键盘与指针替代
  Given 滑块值为 50，min=0 max=100 step=5
  When 按右方向键
  Then 值为 55，aria-valuenow="55"，aria-valuetext="55%"
  When 点击轨道 80% 位置
  Then 值变为 80（满足 2.5.7 单指针替代）

Scenario: 表单错误汇总
  Given 表单有 2 个必填项为空
  When 提交
  Then 焦点移到 error summary，且朗读"共 2 个错误"
  And  每个字段 aria-invalid="true"，aria-describedby 含错误文本
  When 点击 summary 中第 1 条
  Then 焦点移到对应输入框
```

### 附录 D：术语表

| 术语                        | 含义                                                           |
| --------------------------- | -------------------------------------------------------------- |
| accessible name（可访问名） | AT 播报的控件名称；来自内容、`aria-label` 或 `aria-labelledby` |
| role                        | 控件语义；优先由原生元素隐式提供                               |
| roving tabindex             | 复合控件只保留 1 个 tab stop，方向键移动 DOM 焦点              |
| `aria-activedescendant`     | DOM 焦点留在容器，用属性指向"虚拟焦点"元素                     |
| focus trap                  | 把 Tab 限制在浮层内；原生 `<dialog>` 已内置                    |
| `inert`                     | 同时移除焦点、点击与可访问性树                                 |
| portal                      | 把 DOM 渲染到别处；不改变 React 事件树                         |
| live region                 | `aria-live` 区域，内容变化时由 AT 播报                         |
| halation（晕影）            | 亮字在暗底上"发光/变粗"的视觉现象                              |
| APCA / `Lc`                 | 感知对比算法 / 其 lightness contrast 值                        |
| forced-colors               | 系统高对比度模式，会覆盖作者颜色                               |
| IME                         | 输入法编辑器；中文拼音输入依赖 composition 事件                |
| 2.5.8 / 2.5.5               | 目标尺寸 AA（24px）/ AAA（44px）                               |

### 附录 E：一键复核清单（发布前 5 分钟）

1. 键盘走一遍主流程：能否完成？焦点在哪？`Esc` 是否关闭？
2. 打开 DevTools → Rendering → `prefers-reduced-motion: reduce`：是否还有位移？
3. DevTools → `forced-colors: active`：焦点环、边框、开关状态是否还在？
4. axe DevTools 扫描：是否有 serious/critical？
5. 手机真机：目标是否好点？Toast 是否挡住底部操作？双击能否缩放？

---

## 参考来源（按主题）

**APG / WAI-ARIA**

- APG Patterns 总览：<https://www.w3.org/WAI/ARIA/apg/patterns/>
- APG Keyboard Interface Practices：<https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/>
- APG Grid and Table Properties：<https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties/>
- APG Landmark Regions：<https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/>
- WAI-ARIA 1.2：<https://www.w3.org/TR/wai-aria-1.2/>

**WCAG 2.2**

- 规范：<https://www.w3.org/TR/WCAG22/>
- Understanding 总览：<https://www.w3.org/WAI/WCAG22/Understanding/>
- 1.4.3 Contrast Minimum：<https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html>
- 1.4.11 Non-text Contrast：<https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html>
- 1.4.13 Content on Hover or Focus：<https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html>
- 2.2.2 Pause, Stop, Hide：<https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html>
- 2.3.1 Three Flashes：<https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html>
- 2.4.7 Focus Visible：<https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html>
- 2.4.11 Focus Not Obscured (Minimum)：<https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html>
- 2.4.13 Focus Appearance：<https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html>
- 2.5.5 Target Size (Enhanced)：<https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html>
- 2.5.7 Dragging Movements：<https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html>
- 2.5.8 Target Size (Minimum)：<https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>
- 3.3.1 Error Identification：<https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html>
- 3.3.3 Error Suggestion：<https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html>
- 4.1.3 Status Messages：<https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>
- C43 scroll-padding：<https://www.w3.org/WAI/WCAG22/Techniques/css/C43>
- F110 sticky header 遮挡焦点：<https://www.w3.org/WAI/WCAG22/Techniques/failures/F110>
- F95 hover 不可悬停：<https://www.w3.org/WAI/WCAG22/Techniques/failures/F95>
- F103 状态消息不可程序化：<https://www.w3.org/WAI/WCAG22/Techniques/failures/F103>

**对比度与颜色**

- APCA Easy Intro（含 `Lc` 阈值与暗色对比图）：<https://git.apcacontrast.com/documentation/APCAeasyIntro>
- APCA 计算器：<https://apcacontrast.com/>
- WebAIM Contrast Checker：<https://webaim.org/resources/contrastchecker/>
- Contrast Ratio：<https://contrast-ratio.com/>
- WCAG 3 草案（未定稿，不可作合规依据）：<https://www.w3.org/TR/wcag-3.0/>

**平台文档**

- `:focus-visible`：<https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible>
- `inert`：<https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert>
- `<dialog>`：<https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog>
- `prefers-reduced-motion`：<https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
- `autocomplete`：<https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete>
- WHATWG autofill：<https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill>
- `inputmode`：<https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode>
- CompositionEvent：<https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent>
- `KeyboardEvent.isComposing`：<https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing>

**React 19**

- React v19 发布说明（ref as prop、Actions、`useId` 变化）：<https://react.dev/blog/2024/12/05/react-19>
- React 19 升级指南：<https://react.dev/blog/2024/04/25/react-19-upgrade-guide>
- `useId`：<https://react.dev/reference/react/useId>
- `createPortal`：<https://react.dev/reference/react-dom/createPortal>

**真实 issue / 讨论**

- Radix #3701（aria-hidden + portal + React 19）：<https://github.com/radix-ui/primitives/issues/3701>
- Radix #3495（Dropdown > Dialog 在 React/Next 行为差异）：<https://github.com/radix-ui/primitives/issues/3495>
- MUI #46682（关闭后焦点残留）：<https://github.com/mui/material-ui/issues/46682>
- MUI #44779（TalkBack 下 Dialog 焦点不进入）：<https://github.com/mui/material-ui/issues/44779>
- Ant Design #52916（Modal 内元素无法聚焦）：<https://github.com/ant-design/ant-design/issues/52916>
- Ant Design #56687（嵌套 Modal + destroyOnHidden）：<https://github.com/ant-design/ant-design/issues/56687>
- Scott O'Hara：Use the dialog element (reasonably)：<https://www.scottohara.me/blog/2023/01/26/use-the-dialog-element.html>
- CSS-Tricks：There is No Need to Trap Focus on a Dialog Element：<https://css-tricks.com/there-is-no-need-to-trap-focus-on-a-dialog-element/>

---

> 本报告不修改 `src/component/icon/**` 及任何源码文件；所有代码片段为建议草案，落地前需按项目规范（Prettier/ESLint/TS 严格模式）调整，并在真实 AT 组合上复测。
