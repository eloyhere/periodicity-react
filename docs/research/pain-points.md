# 组件库痛点研究：开发者与终端用户的真实代价

> 目标：在 Periodicity 组件库从 9 个组件扩张之前，用一手证据确定「哪些坑必须现在填、用什么 API/CSS/目录结构填」。
> 范围：`src/component/**`（`src/component/icon/**` 由他人负责，本文只把它当作外部依赖边界，未审计、未修改）、`src/arrange/**`、`src/index.css`、`index.html`、`package.json`。
> 数据快照：2026-10-20。npm 下载量为 2026-10-12 ~ 2026-10-18。本文**未修改 `src` 下任何文件**，只在 `docs/research/` 写入本文件。
> 检索限制：State of CSS / State of JS 官方结果为客户端渲染，抓取只能拿到标题，**未能取得可引用的具体百分比**；因此调查数据改用 WebAIM（百万站点 + 屏幕阅读器调查）、NN/g、Zenodo 论文与厂商审计。凡属机制推理而非直接证据，均标注「推断」。
> 快照边界：代码审计时间为 2026-10-20 03:31；此后 `src` 下可能有其他并行改动（如 `src/structure/**`），本文结论只对上述 9 个组件、`src/arrange`、`src/index.css`、`index.html`、`package.json` 负责。

## 证据等级

| 标记     | 含义                                             | 例子                                                          |
| -------- | ------------------------------------------------ | ------------------------------------------------------------- |
| 〔A〕    | 规范 / 官方文档 / 可复现数据                     | WCAG、WAI-APG、MDN、React 文档、bundlephobia API              |
| 〔B〕    | 具体 issue / PR / discussion（含反应数、评论数） | MUI #29645、Radix #3593、shadcn #9712                         |
| 〔C〕    | 研究、调查、厂商审计、公开复盘                   | WebAIM Million、WebAIM SR Survey #10、NN/g、Zenodo、OverlayQA |
| 〔推断〕 | 由机制或代码推导，尚无直接测量                   | 我们的 overflow 裁剪风险、IME 边界情况                        |

---

## 0. 八条最重要的结论（先看这个）

1. **我们的组件库目前不是「可访问的暗色主题」，而是「视觉上成立、AA 不成立」**：实测 `--faint` 在暗色下 3.40:1、浅色下 2.47:1，placeholder 实际 2.80:1，浅色 `--accent` 文本 4.19:1，输入框边框 1.63:1 —— 全部低于 WCAG AA 门槛。先修 token，再谈加组件。
2. **主题闪烁（FOUC）不是样式问题，是渲染顺序问题**：必须在 `<head>` 里、首屏绘制前用阻塞脚本写入 `data-theme`；`index.html` 目前没有任何引导脚本，也没有 `prefers-color-scheme` 分支，一旦加主题切换必闪。
3. **纯黑 + 高饱和青柠是 OLED 拖影的高危组合**：厂商官方承认暗色下快速滚动会出现文字拖影；`#c9f36d` 相对亮度 0.776，在 `#080b09` 上 15.56:1，属于「亮到会晕开」的一端。
4. **浮层必须现在建 Portal/层级层，否则 Dialog 内出现第一个自定义下拉就会踩 shadcn #9712 的坑**（下拉可见但点不中），而且修复要动 Dialog、Select、未来的 Combobox 三处。
5. **无障碍不能事后补**：Ant Design 的 a11y 总 issue 从 2020 开到现在仍有 26 个 👍 未关；Bootstrap 暗色模式因 SCSS 硬编码变量返工 76 条评论；Radix 自己的 focus guard 也被 axe 判为「aria-hidden 容器内有可聚焦元素」。
6. **组件 API 的第一原则是「状态所有权唯一」**：`value` / `defaultValue` 二选一 + `onValueChange`，禁止半受控；`Select`、`Switch` 目前只支持受控，等于把状态管理强加给使用者。
7. **`asChild` 比 polymorphic `as` 更适合我们**：它只改渲染元素、不引入泛型地狱，且强制子组件 spread props + 转发 ref —— 这恰好是 React 19「ref as prop」时代的正确写法。
8. **先建能力，后建组件**：T0 = token 三层 + 对比度脚本 + 主题引导 + focus + Dialog 修复 + Field 错误态。这六件事做完之前，每多一个组件就多一份返工债（token 漂移在 375 个站点上的实测平均覆盖率只有 40.4%）。

---

## 1. 现状审计：Periodicity 有什么、缺什么

### 1.1 组件清单与契约

| 组件                                                      | 现行 API                                                     | 状态所有权                            | 已有 a11y                                         | 主要缺口                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [Button](../../src/component/button/Button.tsx)           | `variant` / `size` / `icon` / `trailingIcon` + 原生属性      | 无状态                                | 原生 `<button>`，`:focus-visible` 双环            | 无 `loading`；icon-only 无 `aria-label` 强制；不接收 `ref`；`disabled` 仅 CSS 变淡                          |
| [Card](../../src/component/card/Card.tsx)                 | `eyebrow` / `title` / `action` / `tone`                      | 无状态                                | 无                                                | `title` 固定 `h3`；`tone` 用颜色命名；无 `as`                                                               |
| [Badge](../../src/component/badge/Badge.tsx)              | `tone: neutral\|lime\|mint\|violet\|amber`                   | 无状态                                | 无                                                | 颜色即语义；无 `role`/`sr-only` 文本策略                                                                    |
| [Dialog](../../src/component/dialog/Dialog.tsx)           | `open` / `onClose` / `title` / `eyebrow` / `footer` / `size` | 受控                                  | 原生 `<dialog>.showModal()`：焦点陷阱、Esc、inert | 初始焦点只找 input；backdrop 点击即关；`onClose` 无原因；关闭按钮英文硬编码；无 `aria-describedby`          |
| [TextInput](../../src/component/input/text/TextInput.tsx) | `label` / `hint` + 原生属性                                  | 半受控（透传 `value`/`defaultValue`） | 包裹式 `<label>`、`aria-describedby` 拼 hint      | 无 error/`aria-invalid`/`aria-errormessage`；无 required 标记；placeholder 对比度 2.80:1                    |
| [Select](../../src/component/picker/select/Select.tsx)    | `label` / `value` / `options` / `onChange(value)`            | **仅受控**                            | `htmlFor` 关联、原生 `<select>`                   | 无 `name` / `disabled` / `required` / `defaultValue` / 空选项 / 分组；无 hint/error 关联；弹出层不可样式化  |
| [Switch](../../src/component/input/switch/Switch.tsx)     | `checked` / `onChange` / `label` / `disabled`                | **仅受控**                            | `role="switch"` + `aria-checked` + `aria-label`   | 46×26 px；label 不可点击；无 `name` / `aria-describedby`                                                    |
| [ProgressRing](../../src/component/ring/ProgressRing.tsx) | `value` / `size` / `stroke` / `label`                        | 受控                                  | `role="progressbar"` + `aria-valuenow`            | 默认名 "Progress" 英文；可见 label 在 `aria-hidden` SVG 内；四舍五入造成假精确；无 `aria-valuetext`         |
| [Surface](../../src/component/surface/Surface.tsx)        | `background` / `foreground` / `ripple` / `onPointerDown`     | 内部 ripple 状态                      | `aria-hidden` 装饰层                              | `foreground` 可放交互内容却被 `aria-hidden`；`overflow:hidden` 裁焦点环；`crypto.randomUUID()` 需安全上下文 |
| [Arrange](../../src/arrange/layout.tsx)                   | `Stack` / `Inline` / `Columns` + `gap`                       | 无状态                                | 无                                                | 仅 `div`；间距 4/8/16/24/40 硬编码在 CSS，未走 token                                                        |

`package.json` 里已启用 `babel-plugin-react-compiler@1.0.0`（[package.json](../../package.json)），这意味着**手动 `useMemo` / `useCallback` / `React.memo` 不再是主要优化手段**，组件作者应把精力放在状态结构与渲染边界上（见 P29）。

### 1.2 token 对比度实测

测量方法：WCAG 2.x 相对亮度公式 + sRGB 线性化；半透明色按 `over(bg)` 合成后再算。复现脚本见附录 B。

| 用途                                 | 前景 / 背景           | 对比度      | 判定                    |
| ------------------------------------ | --------------------- | ----------- | ----------------------- |
| 正文                                 | `#eff5ee` / `#080b09` | **17.86:1** | 通过                    |
| 次要正文                             | `#c8d5cb` / `#0f1612` | **12.10:1** | 通过                    |
| 辅助文字                             | `#8b9a90` / `#0f1612` | **6.23:1**  | 通过                    |
| 辅助文字（暗底）                     | `#8b9a90` / `#0b110e` | **6.47:1**  | 通过                    |
| 占位/极弱文字                        | `#5d6b61` / `#0b110e` | **3.40:1**  | 不通过（<4.5）          |
| 占位符（实际，85% 不透明度）         | `#515e55` / `#0b110e` | **2.80:1**  | 不通过                  |
| 主色文字                             | `#c9f36d` / `#080b09` | **15.56:1** | 通过                    |
| 主色按钮文字                         | `#101607` / `#c9f36d` | **14.50:1** | 通过                    |
| 危险色                               | `#ff9a8d` / `#0f1612` | **8.97:1**  | 通过                    |
| 浅色正文                             | `#182019` / `#f3f0e7` | **14.63:1** | 通过                    |
| 浅色辅助文字                         | `#6c786d` / `#fffdf6` | **4.54:1**  | 临界通过                |
| 浅色极弱文字                         | `#8c978d` / `#ece8dc` | **2.47:1**  | 不通过                  |
| 浅色主色文字                         | `#5c7d16` / `#f3f0e7` | **4.19:1**  | 不通过（正文）          |
| 浅色主色按钮文字                     | `#f8ffe9` / `#5c7d16` | **4.65:1**  | 通过                    |
| 暗色边框 `--line`（10% 合成）        | `#252c28` / `#0f1612` | **1.28:1**  | 不通过（UI 边界需 3:1） |
| 暗色强边框 `--line-strong`（18%）    | `#363e39` / `#0f1612` | **1.67:1**  | 不通过                  |
| 暗色强边框（合成到 `--panel-muted`） | `#333a36` / `#0b110e` | **1.63:1**  | 不通过                  |
| 浅色强边框（20%）                    | `#d1d1ca` / `#fffdf6` | **1.51:1**  | 不通过                  |
| 焦点色 vs 面板                       | `#c9f36d` / `#141f18` | **13.34:1** | 通过                    |

结论：

- **文字层大体合格**，但「最弱的那一档」（`--faint`、placeholder、浅色 accent）是系统性失败，且恰好是最常出现在空表单、未填写状态的那一档。
- **输入框边界不合格**。WCAG 1.4.11 要求「识别控件所需的视觉信息」≥3:1；输入框空值时背景 `#0b110e` 与页面 `#080b09` 几乎同色，1px 边框是唯一可见边界，而它是 1.63:1〔A：[WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)〕。
- 这不是「再加一个组件」能解决的问题，必须先动 token。

### 1.3 结构性观察

1. **token 没有分层**：`--mint` / `--violet` / `--amber` 是原始色，`--danger` 是语义色，两者并列在 `:root`，组件直接引用；`Badge` 的 `tone="lime"`、`Card` 的 `tone="violet"` 把「颜色名」写进了公开 API。
2. **主题只有一个入口**：`:root[data-theme="light"]` 覆盖变量，但 `index.html` 没有在首屏前设置 `data-theme` 的脚本，也没有 `@media (prefers-color-scheme)` 分支。
3. **没有层级系统**：z-index 散落在组件 CSS（如 `.dialog` 的 `position:fixed`），未来 Toast/Tooltip/Popover 无统一 z-index scale。
4. **没有状态契约**：组件用 BEM 修饰类（`button--solid`）表达变体，但没有 `data-state` / `data-invalid` 这类可被测试和 CSS 稳定选择的钩子。
5. **没有质量门禁**：`eslint.config.js` 只有 `react-hooks`、`react-refresh`、`prettier`；没有 `eslint-plugin-jsx-a11y`、没有 Storybook、没有 axe、没有视觉回归、没有体积预算。
6. **语言标注与本地化未定**：`index.html` 是 `lang="en"`，当前 UI 文案为英文，暂时正确；但若产品面向中文用户，`<html lang>` 必须同步为 `zh-CN`（混合语言区块另加 `lang`）。WebAIM 2026 显示中文页面的平均可检测错误为 **136.2**（比总体平均高 **142.8%**），且 13.5% 的页面完全没有文档语言标注〔C：[WebAIM Million](https://webaim.org/projects/million/)〕。语言标注是中文产品最容易漏、修复成本最低的一环。

---

## 2. 痛点清单

每条格式：**现象 → 证据 → 影响（开发者 / 用户）→ 对策（API / CSS / 目录）**。
「证据」中的数字均来自链接页面；「推断」表示由代码或机制推导。

### A. 主题与 token

#### P1 首屏主题闪烁（FOUC）：主题切换一旦上线必闪

**现象**：主题存在 `localStorage` 时，首帧仍按默认主题绘制，React 水合后才改 `data-theme`，用户看到「白闪一下」或「深色闪一下」。SSR/SSG 下更严重，因为服务端根本不知道用户偏好。

**证据**：

- Josh Comeau 的经典复盘把「不闪烁」列为 Dark Mode 五个需求中最难的两个之一，解决方案是在**所有内容之前**注入阻塞 `<script>`，在绘制前读取 `localStorage` + `matchMedia` 并改写 CSS 变量；他还实测 `localStorage` 读取约 **12 微秒**，阻塞成本可忽略〔C：[The Quest for the Perfect Dark Mode](https://www.joshwcomeau.com/react/dark-mode/)〕。
- Bootstrap 的暗色模式 PR 待办里明确写着「Move JS toggle code into the head to prevent flashing」〔B：[twbs/bootstrap#28449](https://github.com/twbs/bootstrap/pull/28449)〕。
- Ant Design 在 Next.js 14 下即使使用 `@ant-design/cssinjs` 仍出现首屏 UI 闪烁，issue 有 22 条评论〔B：[ant-design#45567](https://github.com/ant-design/ant-design/issues/45567)〕。

**影响**：

- 开发者：一旦接入主题持久化，就要处理「服务端不知道、客户端才知道」的时序；如果先做主题切换 UI、后补引导脚本，要改 `index.html` + 主题 Provider + 所有依赖 `data-theme` 的 CSS。
- 用户：暗色应用闪白屏在夜间尤其刺眼；闪烁会被感知为「应用坏了」。

**对策**：

- 在 `index.html` 的 `<head>` 末尾、`<body>` 之前加内联阻塞脚本（约 15 行）：读 `localStorage.theme` → 否则 `matchMedia('(prefers-color-scheme: light)')` → `document.documentElement.dataset.theme = ...`，并同时设置 `color-scheme`。
- 默认值改为「跟随系统」：`:root` 保持 dark 作为无 JS 兜底，增加 `@media (prefers-color-scheme: light)` 分支，`[data-theme]` 优先级更高。
- 目录：新增 `src/theme/bootstrap.ts`（导出脚本文本，供 `index.html` 内联或 Vite 注入），禁止在 React 组件里做首次主题判定。
- 验收：DevTools 关缓存 + 4x CPU 降速，连续刷新 10 次，首帧不得出现非目标主题；`document.documentElement.dataset.theme` 在 `DOMContentLoaded` 前已正确。

#### P2 纯黑 + 高饱和亮色：OLED 拖影与光晕

**现象**：`--bg: #080b09` 接近纯黑，`--accent: #c9f36d`（相对亮度 0.776）在其上 15.56:1，滚动/切换时亮色边缘会「拖尾」，在 OLED 高刷屏上尤其明显。

**证据**：

- 小米官方支持文档承认：暗色模式下滚动或刷新时会出现轻微文字拖影/拖尾，原因是 OLED 像素级控光在高刷（如 120Hz）下首帧未达全亮〔C：[Why does text appear smeared in Dark mode](https://www.mi.com/global/support/faq/details/KA-612125/)〕。
- MUI 的 `sx` 性能对照表显示：1,000 个 `Box sx` 渲染约 **296ms**，而 1,000 个普通 `div` 约 **100ms**〔B：[mui/material-ui#43309](https://github.com/mui/material-ui/issues/43309)〕——说明「每个组件都带一点视觉效果」会累积成可测成本。

**影响**：

- 开发者：所有大面积亮色块（主按钮、进度环、选中态）都要考虑亮度与面积，不能只按品牌色取值。
- 用户：暗色下长时间阅读出现残影、眼睛疲劳；低亮度环境下亮块刺眼。

**对策**：

- 暗色背景不要用 `#000`；保持 `#080b09` 可以，但**大面积填充**改用 `--accent-soft`（14% 透明）或 `--panel-strong`，纯 `--accent` 只用于小面积（图标、1px 描边、小徽标、进度弧）。
- 新增 `--accent-surface`（低亮度、低饱和的可用填充色）与 `--glow-strength` token，禁止组件内写 `box-shadow: ... rgba(201,243,109,0.35)` 这种字面量（`Switch.css` 目前有）。
- 提供 `data-contrast="soft"`（或 `prefers-contrast` 媒体查询）降级：关闭 glow、降低亮色面积。
- 验收：暗色下截图检查「大面积亮块」清单；低亮度设备（或模拟 OLED 拖影的滤镜）滚动测试。

#### P3 原始色被当作语义色：`tone="lime"` 会锁死主题

**现象**：`Badge` 的 `tone` 是 `neutral | lime | mint | violet | amber`，`Card` 的 `tone` 是 `default | accent | mint | violet`。调用方按颜色选，而不是按意图选。

**证据**：

- Bootstrap 5.3 的暗色模式返工，直接原因就是组件用了 SCSS 原始色而不是 CSS 变量：`text-bg-primary` 编译成 `rgba(13,110,253,...)`，导致 `_variables-dark` 里的覆盖「根本不起作用」〔B：[twbs/bootstrap#37976](https://github.com/twbs/bootstrap/issues/37976)〕。
- 同一 PR 的待办里还有「lighten `text-muted` so that its contrast ratio is >= 4.5」〔B：[twbs/bootstrap#28449](https://github.com/twbs/bootstrap/pull/28449)〕——颜色名一旦进入 API，对比度修复就变成 breaking change。
- Zenodo 对 5 个主流设计系统的 4,376 个 token 做结构化审计，发现 token 架构「正式化」与无障碍 token 覆盖**基本脱钩**：5 个系统里 4 个在重大 token 重构后无障碍覆盖零变化〔C：[Design Token Evolution and Accessibility Drift](https://zenodo.org/records/21567692)〕。

**影响**：

- 开发者：换肤/换主题时要改调用方代码；新增「成功/警告/危险」语义时无处安放。
- 用户：同一语义在不同页面颜色不一致；浅色主题下 `lime` 可能变成不可读的亮绿。

**对策**：

- 公开 API 改成意图：`tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info"`；颜色映射放进 `semantic.css`。
- 原始色只允许出现在 `src/token/primitive.css`，组件 CSS 禁止直接引用 `--mint` / `--violet` / `--amber`。
- 保留旧值一个 minor 周期：`lime → accent`、`mint → success`、`violet → info`、`amber → warning`，用 codemod 或 deprecation warning。
- 验收：`grep -r "\-\-mint\|\-\-violet\|\-\-amber" src/component` 必须为 0。

#### P4 token 与实现脱节（design token drift）

**现象**：token 定义在 `index.css`，但组件 CSS 里仍有大量字面量（`rgba(255,255,255,0.025)`、`rgba(0,0,0,0.08)`、`#101607` 混在 token 外），且没有机制阻止新增字面量。

**证据**：

- OverlayQA 扫描 375 个有专职设计团队的生产站点：平均 token 覆盖率 **40.4%**、中位数 38%，只有 **7.5%** 达到 90%+；共发现 **17,731** 个硬编码值，平均每站 47 个；颜色 token 覆盖率 51.5%（4,691 个唯一颜色中只有 1,618 个被 token 覆盖）〔C：[Design Token Drift: We Audited 375 Sites](https://overlayqa.com/blog/design-token-drift-study/)〕。该方法论由厂商发布，样本选择未必随机，但量级可参考。
- 同一研究引用 zeroheight 2026 报告：只有 **8%** 的团队认为自己的系统「非常稳定」〔C：同上，转引 [report.zeroheight.com](https://report.zeroheight.com/)〕。
- NN/g 对精益设计系统团队的研究指出：小团队的优势来自「被迫优先级排序」，只造真正需要的组件，而不是铺量〔C：[Small by Design](https://www.nngroup.com/articles/lean-design-system-teams/)〕。

**影响**：

- 开发者：改一个 token 预期全局生效，实际只改了一半；排查「为什么这个卡片颜色不对」要翻三层 CSS。
- 用户：同一产品内出现细微色差、圆角不一致，削弱信任。

**对策**：

- token 三层：`primitive.css`（原始色阶，唯一允许 hex 的文件）→ `semantic.css`（`--color-bg`、`--color-text-muted`、`--color-border`…）→ `component.css`（`--button-bg`、`--field-border`…）。
- CI 脚本 `scripts/check-tokens.mjs`：解析 `src/component/**/*.css`，除 `token/` 外出现 `#[0-9a-f]{3,8}` 或 `rgba(` 即失败（允许 `transparent`、`currentColor`）。
- 每个组件文件头写「允许引用的 token 白名单」注释，评审时对照。

#### P5 对比度不足：我们从第一天就在积累 AA 债务

**现象**：见 1.2 实测。最弱一档文字与输入框边界系统性不达标。

**证据**：

- WebAIM Million 2026：100 万个首页平均 **56.1** 个可检测错误；**83.9%** 的页面存在低对比度文本（比 2025 的 79.1% 上升）；**51%** 的页面存在表单标签缺失；**33.1%** 的输入框没有正确标签〔C：[The WebAIM Million](https://webaim.org/projects/million/)〕。
- Bootstrap 5.3 暗色主题上线后收到「Dark mode colors have low contrast」issue，用户要求把 `$body-color-dark` 提亮到 `#eee`〔B：[twbs/bootstrap#38525](https://github.com/twbs/bootstrap/issues/38525)〕。
- WCAG 1.4.11 明确：用于识别控件及其状态的视觉信息需 ≥3:1；边框只有在「没有其他可见方式识别控件」时才被要求，而我们的空输入框恰好只有边框〔A：[Understanding SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)〕。

**影响**：

- 开发者：等到有人投诉再改，就要同时改 token、组件、截图和文档；暗色/浅色两套都要回归。
- 用户：低视力用户在暗色下读不清 placeholder 和 hint，直接放弃填写。

**对策**：

- 立即调整：`--faint` 暗色提到 ≥4.5:1（约 `#7d8c82`）；浅色 `--faint` 提到 ≥4.5:1；浅色 `--accent` 作为文字时改用更深的 `--accent-text`（≥4.5:1）。
- 输入框边界：`--line-strong` 提升到 ≥3:1（暗色约需 `rgba(231,244,234,0.42)` 以上），或给输入框加 `--panel-strong` 填充差（背景与页面 ≥3:1）。
- 新增 `scripts/check-contrast.mjs`：从 CSS 解析 token 对，跑 WCAG 公式，低于阈值即 CI 失败（附录 B 给了可用的 PowerShell 原型）。
- 验收：所有「文字/背景」「边框/相邻色」「焦点/背景」组合进入一张 `tokens.contrast.json` 快照，PR 改 token 必须更新快照。

#### P6 系统偏好不同步、主题持久化语义不清

**现象**：`:root` 固定 dark，`[data-theme="light"]` 只能手动设置；没有 `prefers-color-scheme` 分支，也没有「跟随系统 / 强制亮 / 强制暗」三态。

**证据**：

- Josh Comeau 的需求清单把「默认跟随 OS、持久化用户选择、且切换按钮状态永不错误」列为三条独立要求，并给出 localStorage → matchMedia → 默认值的决策顺序〔C：[The Quest for the Perfect Dark Mode](https://www.joshwcomeau.com/react/dark-mode/)〕。
- `color-scheme` 决定 UA 原生控件（滚动条、`select` 弹层、日期选择器）的配色；只改 CSS 变量而不改 `color-scheme`，原生弹层仍会是亮色〔A：[MDN color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)〕。我们的 `Select.css` 已写 `color-scheme: inherit`，但 `:root` 需要正确设置。

**影响**：

- 开发者：主题逻辑散落在组件与 `index.html`，新增「跟随系统」要改多处。
- 用户：系统是浅色但应用强制深色；或者切到浅色后原生下拉仍是深色。

**对策**：

- 三态 `theme: "system" | "light" | "dark"`，持久化只存用户显式选择；`system` 用 `matchMedia` 监听变化。
- `ThemeProvider` 只负责「读 / 写 / 订阅」，不负责首帧（首帧交给 P1 的阻塞脚本）。
- 所有主题切换必须同时更新 `document.documentElement.style.colorScheme`。
- 验收：系统主题切换（不刷新页面）后 100ms 内应用跟随；`select` 弹层、滚动条颜色正确。

### B. 无障碍与焦点

#### P7 Dialog 的焦点进入 / 归还 / 关闭语义不可控

**现象**：`Dialog` 用原生 `showModal()`，焦点陷阱和 Esc 由浏览器保证，但初始焦点只查 `input/select/textarea`；没有 `initialFocus`、没有「关闭后焦点归还给触发元素」的显式保证、`onClose` 不告诉调用方是 Esc、backdrop 还是关闭按钮。

**证据**：

- WAI-ARIA APG 的 Modal Dialog 模式要求：打开时焦点移入对话框；关闭时焦点**返回触发元素**；对不可逆操作，初始焦点应放在「最不具破坏性」的动作上；`aria-modal` 只有在「代码确实阻止了外部交互且视觉上遮蔽」时才可标记〔A：[Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)〕。
- 我们的实现只覆盖了「有输入框」的场景；纯文本确认框会把焦点留在 `body`，屏幕阅读器可能不播报标题（〔推断〕，基于 `focusTarget?.focus()` 为空时无兜底）。

**影响**：

- 开发者：每个使用 Dialog 的页面都要自己写 `autoFocus` / `ref` 兜底；销毁性操作的初始焦点无法控制。
- 用户：键盘用户关闭弹窗后焦点回到页面顶部，需要重新 Tab 十几次；屏幕阅读器用户不知道弹窗已打开。

**对策**：

- API：`initialFocusRef?: RefObject<HTMLElement>`、`onOpenAutoFocus?: (e) => void`、`onCloseAutoFocus?: (e) => void`、`onClose: (reason: "escape" | "backdrop" | "close-button" | "action") => void`。
- 默认初始焦点顺序：`initialFocusRef` → `[autofocus]` → 第一个可聚焦元素 → 标题（`tabIndex={-1}`）。
- 关闭时记录 `document.activeElement`（打开前），关闭后 `focus()` 回去；触发元素已卸载则退回 `main`。
- 把 `<dialog>` 的 `title` 从必填字符串改为可选，允许 `<Dialog.Title>` 子组件；`aria-describedby` 指向 `<Dialog.Description>`。
- 验收：键盘完整走一遍「打开 → 填表 → Esc → 焦点回到触发按钮」；axe 无 `aria-dialog-name` 类错误。

#### P8 `aria-hidden` 容器里放了可聚焦元素

**现象**：`Surface` 的 `background` / `foreground` 层固定 `aria-hidden="true"`，但 API 允许传任意 `ReactNode`；一旦调用方在 `foreground` 放按钮/链接，就制造了「对 AT 隐藏但可聚焦」的元素。

**证据**：

- Radix 自己的 focus guard（`<span data-radix-focus-guard tabindex="0" aria-hidden="true">`）被 jest-axe 与 Level Access 扩展判为 **Focusable element with aria-hidden true**，WCAG 2.2 2.1.1；issue 5 个 👍，最终以 `not_planned` 关闭〔B：[radix-ui/primitives#3593](https://github.com/radix-ui/primitives/issues/3593)〕。
- WebAIM Million 2026 指出：使用 ARIA 的页面平均错误更多（59.1 vs 42），且 ARIA 属性数量与错误数正相关〔C：[The WebAIM Million](https://webaim.org/projects/million/)〕。

**影响**：

- 开发者：Surface 的视觉分层很好用，但会诱导把交互内容放进去；错误在 axe 扫描时才暴露。
- 用户：屏幕阅读器读不到按钮，键盘却能 Tab 到，形成「幽灵焦点」。

**对策**：

- 类型层面拆分：`Surface` 只接受装饰性 `background` / `foreground`（类型标注为 `DecorativeNode`，文档写明「不要放交互元素」）。
- 需要交互前景时，用 `Surface` 的 `children` 层（`.surface__component`），它没有 `aria-hidden`。
- 增加 `inert` 透传：`Surface` 支持 `inert?: boolean`，用于关闭态浮层。
- 验收：`eslint-plugin-jsx-a11y` 的 `no-noninteractive-tabindex` + 自定义 lint 禁止 `<Surface foreground={<Button…>}>`。

#### P9 状态只靠颜色表达

**现象**：`Badge` 的 `tone` 直接映射颜色；未来错误态如果只把边框变红，色觉障碍用户无法区分。

**证据**：

- WCAG 1.4.1 要求不能只靠颜色传达信息；1.4.11 要求状态指示（选中、焦点）也要有对比度〔A：[Understanding SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)〕。
- NN/g 表单错误指南第 4、5 条：颜色之外要加图标或轻微动画，且图标有助于色盲用户〔C：[10 Design Guidelines for Reporting Errors in Forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/)〕。
- WebAIM SR Survey #10 把「Links or buttons that do not make sense」列为第 3 大问题〔C：[Screen Reader User Survey #10](https://webaim.org/projects/screenreadersurvey10/)〕。

**影响**：

- 开发者：每个使用 Badge 表示状态的地方都要额外塞图标，API 不提供就会被忽略。
- 用户：色盲用户分不清「成功/警告」。

**对策**：

- `Badge` 增加 `icon?: IconName` 与 `srLabel?: string`；无 icon 时默认渲染一个 `aria-hidden` 形状差异（点/三角/方块），不依赖色相。
- 错误态统一 `Field.Error` 组件：`role="alert"` + 图标 + 文本，颜色只是辅助。
- 验收：灰度截图下仍能区分所有状态。

#### P10 label / hint / error 的关联不完整

**现象**：`TextInput` 只把 `hint` 拼进 `aria-describedby`；没有 error、没有 `aria-invalid`、没有 required 标记；`Select` 完全没有 hint/error 通道；`Switch` 只有 `aria-label`，没有可见文本关联。

**证据**：

- WebAIM Million 2026：51% 的页面有表单标签缺失，**33.1%** 的输入框没有正确标签〔C：[The WebAIM Million](https://webaim.org/projects/million/)〕。
- NN/g：错误信息应紧邻字段、显式、可操作；不要把校验摘要当作唯一提示；不要用 tooltip 报错〔C：[10 Design Guidelines](https://www.nngroup.com/articles/errors-forms-design-guidelines/)〕。
- WebAIM SR Survey #10 把「Complex or difficult forms」列为第 7 大问题〔C：[SR Survey #10](https://webaim.org/projects/screenreadersurvey10/)〕。

**影响**：

- 开发者：每个表单都要手写 `id` / `aria-describedby` / `aria-invalid`，重复且易错。
- 用户：屏幕阅读器只读「编辑框」，不读「这是必填」「刚才错了」。

**对策**：

- 新增 `Field` 组合组件（见 7.5），由 context 提供 `id`、`describedBy`、`invalid`、`required`、`disabled`，子组件自动消费。
- `TextInput` / `Select` / `Switch` 全部改为 `Field` 的内部实现，保留现有 props 作为语法糖。
- 错误必须在 `onBlur` 或 submit 后出现，输入过程中不报错（NN/g 第 7 条）。
- 验收：axe `label`、`aria-describedby` 规则 0 错误；屏幕阅读器播报「邮箱，必填，输入格式不正确」。

#### P11 目标尺寸与密度

**现象**：`Switch` 46×26，`Button` 的 `sm` 最小高度 32px；都没有提供「舒适/紧凑」密度切换。

**证据**：

- WCAG 2.2 SC 2.5.8（AA）：指针目标至少 **24×24 CSS px**，否则需满足间距例外；并明确建议「提供控制布局密度的机制，从而改变目标尺寸或间距」〔A：[Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)〕。
- SC 2.5.5（AAA）要求 44×44，移动端行业惯例也接近 44〔A：同上页面引用 2.5.5〕。
- Zenodo 的 5 系统审计发现：**0/5** 的系统在任一版本中定义了最小点击目标 token，尽管 2.5.8 自 2023-10 起就是 AA〔C：[Zenodo 21567692](https://zenodo.org/records/21567692)〕。

**影响**：

- 开发者：想调大点击区域只能改组件 CSS 或用 padding hack。
- 用户：手抖、单手操作、地铁上使用时误触；Switch 尤其难按。

**对策**：

- 新增尺寸 token：`--control-h-sm: 32px`、`--control-h-md: 42px`、`--control-h-lg: 52px`、`--tap-min: 44px`；Switch 外层加透明 `::before` 扩大命中区到 44×44（视觉仍是 46×26）。
- 提供 `data-density="comfortable | compact"` 挂在根节点，组件读 `--control-h-*` 覆盖。
- 验收：所有交互元素 `getBoundingClientRect()` ≥24×24；触摸设备 ≥44×44 或间距例外成立。

#### P12 图标按钮没有可访问名、按钮没有 loading 状态

**现象**：`Button` 永远渲染 `<span className="button__label">{children}</span>`，icon-only 时 `:empty` 被 `display:none`，按钮的可访问名为空；也没有 `loading` / `pending` 状态。

**证据**：

- WebAIM Million 2026：**30.6%** 的页面存在空按钮（empty buttons），比 2025 的 29.6% 上升〔C：[The WebAIM Million](https://webaim.org/projects/million/)〕。
- WebAIM SR Survey #10 把「Links or buttons that do not make sense」列为第 3 大问题〔C：[SR Survey #10](https://webaim.org/projects/screenreadersurvey10/)〕。
- React 19 的 `useFormStatus` 明确为「设计系统里的提交按钮」提供 pending 状态，说明这是组件库级需求〔A：[React v19](https://react.dev/blog/2024/12/05/react-19)〕。

**影响**：

- 开发者：每个 icon-only 按钮都要记得写 `aria-label`，忘了就是线上事故。
- 用户：屏幕阅读器读「按钮」；提交时没有反馈，重复点击。

**对策**：

- `Button` 增加 `loading?: boolean`（自动 `disabled` + `aria-busy` + 保留宽度 + spinner）。
- 类型约束：`icon` 存在且无 `children` 时，`aria-label` 必填（用联合类型实现，TS 编译期报错）。
- `children` 为空时不要渲染空 `<span>`，直接不渲染。
- 验收：axe `button-name` 0 错误；提交中按钮有 `aria-busy="true"` 且不可重复提交。

#### P13 焦点指示被抑制或被容器裁剪

**现象**：`TextInput` / `Select` 都写了 `:focus-visible { outline: none }`，改用 `:focus-within` 的边框/内发光；`Surface` 的 `overflow: hidden` 可能裁掉子元素的 `outline-offset: 3px` 焦点环。

**证据**：

- WCAG 1.4.11 明确：焦点指示器必须与相邻背景有足够对比；「特别细的线条和形状」在抗锯齿下实际对比度会低于标称值，建议避免过细线条或使用更高对比〔A：[Understanding SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)〕。
- shadcn 的 focus 样式绑定 CSS `:focus-visible`，导致程序化恢复焦点后鼠标用户也看到键盘焦点环；修复方式是改用组件自己的 `data-focus-visible`〔B：[shadcn-ui/ui#11258](https://github.com/shadcn-ui/ui/issues/11258)〕。
- `:focus-within` 不区分鼠标与键盘：我们的输入框用鼠标点击也会出现「焦点态」，与键盘态无法区分（〔推断〕，基于 CSS 选择器语义）。

**影响**：

- 开发者：每个新组件都要重复实现焦点样式，容易漏。
- 用户：键盘用户看不清当前焦点；鼠标用户被「焦点环」干扰。

**对策**：

- 统一焦点 token：`--focus-ring-width: 2px`、`--focus-ring-offset: 2px`、`--focus-ring-color`；组件只能引用，不能自造。
- 用 `:focus-visible` 而非 `:focus-within` 驱动「键盘焦点」；鼠标点击用 `:focus` 的弱提示。
- `Surface` 默认 `overflow: clip` 改为按需；或给 `.surface` 增加 `--surface-overflow`，交互容器用 `visible`。
- 验收：Tab 走查每个组件，焦点环完整可见、不被裁切；截图对比键盘/鼠标两种路径。

#### P14 复杂组件的语义与键盘行为

**现象**：我们现在只有原生 `<select>` 和 `<dialog>`，暂时安全；一旦自建 Combobox / Tabs / Menu，就会进入「ARIA 手写陷阱」。

**证据**：

- WebAIM SR Survey #10 的问题排行：第 2 名是「Interactive elements like menus, tabs, and dialogs do not behave as expected」，第 5 名是「Lack of keyboard accessibility」〔C：[SR Survey #10](https://webaim.org/projects/screenreadersurvey10/)〕。
- Ant Design 的 Tabs 被第三方无障碍机构测试出「切换 tab 时屏幕阅读器不读当前 tab、tabpanel 里有两个无意义的 `tabindex=0` span」，issue 里附了完整修复清单〔B：[ant-design#18798](https://github.com/ant-design/ant-design/issues/18798)〕。
- Ant Design 的 Collapse 至今不符合 APG Accordion：缺 `aria-controls`、无法设置 heading level、panel 不能设 `role="region"`〔B：[ant-design#53203](https://github.com/ant-design/ant-design/issues/53203)〕。

**影响**：

- 开发者：自建一个「看起来能用」的 Combobox 要 300+ 行键盘/ARIA 代码，且很难测全。
- 用户：Tab 键跳进一个无法退出的组件；屏幕阅读器读到错误角色。

**对策**：

- 短期：能用原生就用原生（`<select>`、`<dialog>`、`<input type="checkbox">`），并在文档里明确「不要自建 Combobox，除非接受 APG 全套测试」。
- 中期：引入 headless 原语（Radix/Ark）或按 APG 自建，但必须先建 `FocusScope`、`DismissableLayer`、`Portal` 三个底层（见 P24）。
- 验收：每个复杂组件必须有「键盘操作矩阵」测试（Tab/Shift+Tab/方向键/Home/End/Esc/Enter/Space）。

### C. 组件 API 与组合

#### P15 半受控与状态所有权不清

**现象**：`Select` 只接受 `value` + `onChange(value)`，没有 `defaultValue`；`Switch` 同理；`TextInput` 透传原生 `value`/`defaultValue`，但错误/hint 状态不参与。调用方被迫把所有状态提升到父组件。

**证据**：

- Radix 的每个可交互原语都提供 `open` / `defaultOpen` / `onOpenChange` 三件套，并在文档中区分「受控」与「非受控」〔A：[Radix Composition](https://www.radix-ui.com/primitives/docs/guides/composition)、[Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)〕。
- Chakra v3 迁移中，`Icon` 从「包裹 svg」改成「不包裹、需要 `asChild`」，迁移指南没写，直接破坏存量自定义图标〔B：[chakra-ui#10685](https://github.com/chakra-ui/chakra-ui/issues/10685)〕——状态/结构契约一旦后补就是 breaking change。

**影响**：

- 开发者：简单开关也要写 `useState`；多个字段时状态爆炸。
- 用户：非受控场景（如原生表单提交）无法使用我们的组件。

**对策**：

- 统一契约：`value?: T` + `defaultValue?: T` + `onValueChange?: (v: T) => void`；原生事件 `onChange` 保留给需要 `event` 的场景。
- 内部用 `useControllableState`（约 40 行）：受控时以 prop 为准，非受控时内部 state；两者同时传时开发环境警告。
- `name` / `required` / `disabled` / `readOnly` 透传到真实表单元素，保证原生表单可用。
- 验收：同一组件在受控/非受控两个 story 下行为一致；切换模式不丢值。

#### P16 缺少 `asChild` / 多态，导致「语义」和「样式」绑死

**现象**：`Button` 永远渲染 `<button>`，`Card` 永远 `<div>`，`Stack`/`Inline` 永远 `<div>`。想在按钮上包一个链接、在卡片上加 `role="article"`、在布局上用 `<section>`，都做不到。

**证据**：

- Radix 的 `asChild` 通过克隆子元素把行为/无障碍属性注入到任意元素或自定义组件；代价是子组件必须 spread props 且转发 ref〔A：[Composition](https://www.radix-ui.com/primitives/docs/guides/composition)〕。
- shadcn 大量组件依赖 `asChild` 组合 Trigger，生态事实标准〔B：[shadcn-ui/ui#9712](https://github.com/shadcn-ui/ui/issues/9712) 中的 Combobox/Dialog 组合〕。
- Chakra v3 把 `asChild` 作为核心迁移点，说明「渲染元素可替换」是长期需求〔B：[chakra-ui#10685](https://github.com/chakra-ui/chakra-ui/issues/10685)〕。

**影响**：

- 开发者：要么放弃语义（用 div + onClick），要么复制组件样式手写 `<a>`。
- 用户：链接不能用 Cmd+Click 新开标签；SEO/屏幕阅读器语义错误。

**对策**：

- 交互组件（Button、Link、Trigger）用 `asChild?: boolean`，内部 `Slot` 克隆子元素并合并 props/ref/handlers。
- 布局组件（Stack/Inline/Columns/Surface）用受限的 `as?: "div" | "section" | "article" | "ul" | "li"`，不做完整泛型多态（TS 复杂度不值得）。
- 文档明确 `asChild` 子元素必须：单个元素、spread props、转发 ref。
- 验收：`<Button asChild><a href="…">…</a></Button>` 渲染出 `<a>` 且保留按钮样式与键盘行为。

#### P17 布尔爆炸与状态枚举

**现象**：当前 `Button` 只有 `variant`/`size` 两个枚举，还算干净；但 `Dialog` 已有 `size`，`Card` 有 `tone`，一旦加入 `danger`、`loading`、`iconOnly`、`block`、`pill` 等布尔值，组合数会爆炸。

**证据**：

- Bootstrap 的暗色模式 issue 显示：组件用「原始色 + 修饰类」表达状态，导致主题覆盖必须逐个组件打补丁〔B：[twbs/bootstrap#37976](https://github.com/twbs/bootstrap/issues/37976)〕。
- Radix 的做法是「每个 part 一个组件 + `data-state` 属性」，CSS 用 `[data-state="open"]` 选择，而不是给每个状态加一个布尔 prop〔A：[Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)〕。
- Ant Design Collapse 的 a11y 提案里，新能力以 `headingLevel`、`panelsRole` 两个可选 prop 出现，而不是布尔开关〔B：[ant-design#53203](https://github.com/ant-design/ant-design/issues/53203)〕。

**影响**：

- 开发者：`<Button danger ghost loading block>` 这种组合无法从类型上排除非法组合。
- 用户：样式组合出现「危险色 + ghost + disabled」这类不可读状态。

**对策**：

- 规则：一个组件最多 1 个布尔 prop（通常是 `disabled` 或 `loading`），其余一律枚举或组合子组件。
- 视觉状态用 `data-*`：`data-variant`、`data-size`、`data-tone`、`data-state="open|closed|loading"`、`data-invalid`。
- 禁止 `isX && isY` 的样式分支；用 token 组合表达。
- 验收：`ButtonProps` 中布尔 prop 数量 ≤2；每个 `data-*` 都有对应 story。

#### P18 结构不可配置：`Card` 固定 `h3`，标题层级无法适配页面

**现象**：`Card` 的 `title` 永远渲染 `<h3>`。如果页面只有 `h1`，就会出现 `h1 → h3` 跳级；如果卡片在 `h2` 区块里，层级又不对。

**证据**：

- WebAIM Million 2026：**41.8%** 的页面存在标题层级跳跃；屏幕阅读器用户中 **71.6%** 靠标题导航，**88.8%** 认为标题层级「非常/有些有用」〔C：[The WebAIM Million](https://webaim.org/projects/million/)、[SR Survey #10](https://webaim.org/projects/screenreadersurvey10/)〕。
- Ant Design Collapse 的 a11y 提案第一项就是新增 `headingLevel?: h1…h6`，理由正是「默认 heading 无法适配页面结构」〔B：[ant-design#53203](https://github.com/ant-design/ant-design/issues/53203)〕。

**影响**：

- 开发者：要么接受跳级，要么不用 `Card.title` 自己写标题。
- 用户：屏幕阅读器按标题跳转时结构混乱。

**对策**：

- `Card` 增加 `headingLevel?: 1 | 2 | 3 | 4 | 5 | 6`（默认 3），内部 `const Heading = \`h${headingLevel}\``。
- 或者提供 `<Card.Title asChild><h2>…</h2></Card.Title>`，把选择权交给调用方。
- 验收：story 中 `h1 > h2 > Card(h3)` 与 `h1 > Card(h2)` 两种结构都通过 axe `heading-order`。

#### P19 className 合并与样式覆盖顺序不可预测

**现象**：所有组件用模板字符串拼 `className`：`` `button button--${variant} button--${size} ${className}` ``。调用方传 `className="button--ghost"` 时，最终效果取决于 CSS 文件加载顺序与选择器特异性，而不是「后传的赢」。

**证据**：

- CSS 级联规则决定：同等特异性下后声明者胜，与 className 在字符串中的顺序无关〔A：[MDN Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade)〕。
- 这也是 `tailwind-merge`、`clsx` 这类库存在的原因：className 冲突需要显式合并策略，而不是字符串拼接〔C：[tailwind-merge](https://github.com/dcastil/tailwind-merge)〕。

**影响**：

- 开发者：覆盖样式要靠 `!important` 或更高特异性，越写越脏。
- 用户：同一组件在不同页面外观不一致。

**对策**：

- 提供 `cx(...)`（约 10 行，无依赖）合并条件类；调用方 `className` 永远追加在最后。
- 组件根节点输出 `data-slot="button"`、`data-variant`、`data-size`，消费者用属性选择器覆盖，特异性可预期。
- 文档写清「覆盖顺序」：`base < variant < size < consumer className`。
- 验收：story 中给每个组件传 `className="test-override"`，断言最终计算样式被覆盖。

#### P20 ref 转发缺失（React 19 已不需要 `forwardRef`）

**现象**：`Button` / `TextInput` / `Select` / `Switch` 都没有声明 `ref`，调用方无法拿到 DOM 节点做聚焦、测量、动画。

**证据**：

- React 19 起 `ref` 作为普通 prop 传给函数组件，`forwardRef` 不再是必需〔A：[React v19](https://react.dev/blog/2024/12/05/react-19)〕。
- Radix 的 `asChild` 明确要求子组件转发 ref，否则测量/聚焦会坏〔A：[Composition](https://www.radix-ui.com/primitives/docs/guides/composition)〕。
- `useId` 用于生成稳定的 `id` 给 `aria-describedby`，我们已在 `TextInput` 使用〔A：[useId](https://react.dev/reference/react/useId)〕。

**影响**：

- 开发者：Dialog 打开后聚焦某个输入框、表单提交后聚焦第一个错误字段，都做不到。
- 用户：错误提交后焦点不跳到错误字段，键盘用户要自己找。

**对策**：

- 每个组件 `Props` 增加 `ref?: Ref<HTMLButtonElement | HTMLInputElement | …>`，直接透传；不再写 `forwardRef`。
- 组合组件（`Field.Control`）把 ref 合并到真实控件；需要同时保留内部 ref 时用 `useComposedRefs`。
- 验收：`<TextInput ref={r} />` 在 TS 与运行时都能拿到 `HTMLInputElement`。

### D. 表单与输入

#### P21 IME 组合输入：中文/日文输入法下受控组件会丢字或误触发

**现象**：受控输入在拼音组合阶段就触发 `onChange`，如果上层做「过滤/格式化/搜索」，会出现候选词被截断、光标跳动、组合被取消。

**证据**：

- React 官方 issue 详细记录了该问题：受控组件在 IME 组合期间 `change` 事件与 `composition` 事件顺序因浏览器/OS 而异（Chrome 53 后还变过），受控组件因为 `setState` 异步，很难在不丢字的前提下拦截；issue 19 个 👍〔B：[react#8683](https://github.com/react/react/issues/8683)〕。
- `compositionend` 在组合会话完成或取消时触发，MDN 明确以拼音输入中文为例〔A：[MDN compositionend](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionend_event)〕。
- Ant Design 的 Input 在受控场景下也需要内部维护 composition 状态，属于同类问题的工程化处理〔推断，基于其 `rc-input` 实现惯例〕。

**影响**：

- 开发者：搜索框、标签输入、金额输入都要各自处理 composition，重复且容易漏。
- 用户：中文输入时字被吞、候选词消失，属于「不可用」级别。

**对策**：

- 所有文本输入组件内部维护 `isComposingRef`：`onCompositionStart` 置 true，`onCompositionEnd` 置 false 并在结束后补发一次 `onValueChange`。
- 组合期间**不**做格式化/过滤/校验；组合结束再处理。
- 受控组件的 `value` 在组合期间不强制回写 DOM（避免打断 IME）。
- 验收：用系统拼音输入法在搜索框连续输入「nihao」，候选词正常、无丢字；`onValueChange` 只在组合结束后触发一次业务回调（原始 `onChange` 仍逐字触发）。

#### P22 数字输入与日期时区

**现象**：`TextInput` 透传 `type="number"`，但没有约束；未来做金额/时长输入时会遇到空字符串、科学计数法、min/max 可绕过、浏览器行为不一致。日期输入则缺少时区约定。

**证据**：

- Stack Overflow 博文列出 `input[type=number]` 的四个硬伤：非法值时 `.value` 返回空字符串；允许 `e`/科学计数法；`min`/`max` 可被粘贴绕过；不同浏览器接受的字符不同；并引用 GOV.UK 设计系统因此改用 `inputmode="numeric"` + `pattern`〔C：[Why the number input is the worst input](https://stackoverflow.blog/2022/12/26/why-the-number-input-is-the-worst-input/)、[GOV.UK 原文](https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers)〕。
- 原生 `date` 输入的值是 `YYYY-MM-DD` 字符串，不含时区；`new Date("2026-10-20")` 按 UTC 解析，而 `new Date(2026, 9, 20)` 按本地时区，二者可能差一天〔A：[MDN Date.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)〕。

**影响**：

- 开发者：金额/工时输入要自己写解析与校验；日期在跨时区用户那里偏移一天。
- 用户：输入 `1e3` 被当成 1000；生日显示成前一天。

**对策**：

- 数字输入统一用 `type="text"` + `inputMode="decimal"` + `pattern`，内部保存字符串，提交时用 `Number()` 校验；`NumberInput` 组件显式提供 `min`/`max`/`step`/`precision`，越界在 blur 时纠正。
- 日期组件明确「日期是本地日历日，不转 UTC」；内部用 `YYYY-MM-DD` 字符串或 `Temporal.PlainDate`，禁止用 `Date` 承载日期。
- 时区相关展示统一走 `Intl.DateTimeFormat` 并显式传 `timeZone`。
- 验收：输入 `1e3`、`12abc`、`--5`、粘贴 `999999` 的行为有测试覆盖；跨时区（UTC / Asia/Shanghai / America/Los_Angeles）快照一致。

#### P23 错误展示时机与错误信息质量

**现象**：组件层没有错误状态，调用方各自实现；容易出现「一开始输入就报红」「错误在顶部汇总但字段旁边没有」「用 tooltip 报错」。

**证据**：

- NN/g 10 条表单错误指南：尽量内联校验；错误信息紧邻字段；颜色之外加图标；**不要在输入完成前校验**；校验摘要不能是唯一提示；不要用 tooltip 报错；模态窗口要少用〔C：[10 Design Guidelines](https://www.nngroup.com/articles/errors-forms-design-guidelines/)〕。
- WebAIM SR Survey #10 把「Complex or difficult forms」列为第 7 大问题〔C：[SR Survey #10](https://webaim.org/projects/screenreadersurvey10/)〕。

**影响**：

- 开发者：每个表单重复实现时机逻辑，行为不一致。
- 用户：刚输入第一个字符就红；错误提示在屏幕外；不知道哪个字段错了。

**对策**：

- `Field` 维护 `touched` / `submitted` 状态：`error` 只在 blur 或 submit 后展示；`forceShowError` 用于服务端返回。
- `Field.Error` 渲染在控件之后、同一 DOM 子树内，`id` 自动加入 `aria-describedby`；同时 `aria-invalid="true"`。
- 提交失败时聚焦第一个错误字段（依赖 P20 的 ref）。
- 验收：空表单直接提交 → 所有错误可见且焦点在第一个错误；输入过程中不出现错误。

### E. 浮层与层级

#### P24 Dialog 内嵌浮层：可见但点不中

**现象**：一旦在 Dialog 里放自定义下拉/日期选择器/Combobox，浮层可能被焦点陷阱或 `overflow:hidden` 拦截，表现为「列表看得见，点击没反应，键盘方向键可能仍可用」。

**证据**：

- shadcn 的 Combobox 放在 Dialog 内时下拉项不可点击，root cause 被定位为 Radix Dialog 与 Popover 的焦点陷阱冲突；issue 10 条评论、8 个反应，仍未关闭〔B：[shadcn-ui/ui#9712](https://github.com/shadcn-ui/ui/issues/9712)〕。
- 我们的 `Surface` 固定 `overflow: hidden`，任何放进 Surface 的 popover 都会被裁剪〔推断，基于 [Surface.css](../../src/component/surface/Surface.css)〕。

**影响**：

- 开发者：每个「弹窗里放选择器」的页面都要 debug 焦点与层级。
- 用户：功能直接不可用，且看起来像「卡住了」。

**对策**：

- T0 就建 `Portal` + `Layer`：所有浮层渲染到 `document.body` 下的层级容器，`z-index` 走 `--z-dropdown: 1000`、`--z-modal: 1100`、`--z-toast: 1200`。
- `Dialog` 内部提供 `Dialog.LayerContext`，浮层知道自己在第几层，焦点陷阱只作用于最上层。
- `Surface` 的 `overflow` 改为可配置，浮层触发器所在容器用 `overflow: visible`。
- 验收：Dialog 内打开 Select/DatePicker，鼠标点击、键盘方向键、Esc 逐层关闭都正确。

#### P25 关闭语义与数据丢失

**现象**：`Dialog` 点击 backdrop 直接 `onClose()`，用户在表单里填了半小时，误点空白处就全没了；`onClose` 也不告诉调用方原因，无法做「有未保存修改时二次确认」。

**证据**：

- APG 要求：对不可逆操作，初始焦点应放在最不具破坏性的动作上；关闭后焦点归还触发元素〔A：[Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)〕。
- NN/g：模态会打断工作流、让用户忘记上下文，应该少用；用于错误时，模态要求用户先关闭再修复，增加认知负担〔C：[Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/)〕。
- Nielsen 启发式 #3「用户控制与自由」：支持 Undo/Redo、提供清晰的取消出口〔C：[10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)〕。
- React 19 的 `useOptimistic` 为「立即反馈 + 失败回滚」提供了语言级支持，说明「可撤销」是主流预期〔A：[React v19](https://react.dev/blog/2024/12/05/react-19)〕。

**影响**：

- 开发者：只能自己包一层 `confirm`，或者在 `onClose` 里猜原因。
- 用户：误触丢数据，属于最不可原谅的体验之一。

**对策**：

- `onClose(reason)`；`dismissible?: boolean`（默认 true）；`confirmOnDismiss?: boolean | (() => boolean)`。
- 表单型 Dialog 用 `Dialog.Root` 的 `dirty` 状态拦截 backdrop/Esc，改为「放弃修改？」二次确认。
- 提供 `Dialog.Footer` 的标准动作顺序：主操作在右、取消在左；危险操作不放在默认焦点。
- 验收：填写后点 backdrop 不直接关闭；未填写时点 backdrop 正常关闭。

### F. 性能

#### P26 运行时 CSS-in-JS 的真实成本

**现象**：我们目前是纯 CSS 文件 + BEM，没有运行时开销——这是优势，**不要为了「主题方便」引入运行时 CSS-in-JS**。

**证据**：

- MUI 官方性能对照：1,000 个元素，普通 `div` 100ms、组件 112ms、`styled` 181ms、`Box sx` **296ms**〔B：[mui/material-ui#43309](https://github.com/mui/material-ui/issues/43309)〕。
- MUI 用户报告升级 v5（Emotion）后首次打开 Dialog 有 **300ms–3000ms** 延迟，后续恢复正常，定位为 Emotion 首次样式注入〔B：[mui/material-ui#29645](https://github.com/mui/material-ui/issues/29645)〕。
- MUI 自己合入「预序列化并缓存样式」PR，把基准从 **101.6ms 降到 82.2ms**（N=100），改动 16 个文件、718 行新增〔B：[mui/material-ui#43412](https://github.com/mui/material-ui/pull/43412)〕。
- 之后 MUI 推出零运行时的 Pigment CSS，定位为「下一代 CSS-in-JS」〔B：[Introducing Pigment CSS](https://mui.com/blog/introducing-pigment-css/)〕。
- Ant Design 的 CSS-in-JS 在 Next.js 14 下出现首屏闪烁，22 条评论〔B：[ant-design#45567](https://github.com/ant-design/ant-design/issues/45567)〕。

**影响**：

- 开发者：运行时样式让 SSR、首屏、主题切换都变复杂；调试时样式在 `<style>` 里动态生成。
- 用户：首次交互卡顿、首屏闪烁。

**对策**：

- 继续用静态 CSS + CSS 变量；主题切换只改变量，不重新生成样式。
- 禁止在组件里用 `style={{...}}` 传设计值（除了 `ProgressRing` 这种尺寸计算的必要场景）；布局/颜色走 class + `data-*`。
- 体积预算：单组件 CSS ≤3KB（gzip），全库 CSS ≤40KB（gzip，不含图标）。
- 验收：Lighthouse 无「避免巨大的网络载荷」警告；首屏 CSS 请求数 ≤2。

#### P27 包体积与 tree-shaking

**现象**：我们只依赖 React，体积天然小；但一旦引入图标全集、日期库、headless 库，很容易回到「一个 import 变大几百 KB」。

**证据**：

- bundlephobia（min / gzip）：`@mui/material@5.15.20` **518.5KB / 149.4KB**；`antd@5.21.0` **1.47MB / 453.7KB**；`@chakra-ui/react@2.10.4` **352.3KB / 111.1KB**；`@radix-ui/react-dialog@1.1.2` **25.4KB / 8.7KB**〔A：bundlephobia API〕。
- Ant Design 的依赖估算里，`@ant-design/icons-svg` 约 **722KB**、`@ant-design/icons` 约 **364KB**（未 gzip），是体积大头〔A：[bundlephobia antd](https://bundlephobia.com/package/antd@5.21.0)〕。
- Ant Design 官方专门写了 tree-shaking 优化博客，说明「按需引入」在实践中经常失效〔C：[Bundle Size Optimization](https://ant.design/docs/blog/tree-shaking)〕。
- npm 周下载量：`@mui/material` **5,470,738**（2026-10-12~18），说明这些痛点影响面极大〔A：[npm downloads API](https://api.npmjs.org/downloads/point/last-week/@mui/material)〕。

**影响**：

- 开发者：以为「只 import 一个 Button」，实际打包进整套主题/图标。
- 用户：首屏多几百 KB，移动网络下明显变慢。

**对策**：

- 图标保持「按名导入 + 单文件」现状，禁止 `import * as Icons`；新增 `IconName` 联合类型时同步体积检查。
- 每个组件目录 `index.ts` 只导出该组件；禁止在 `src/component/index.ts` 做 barrel（barrel 会破坏 tree-shaking）。
- 引入 `rollup-plugin-visualizer` 或 `vite-bundle-visualizer`，CI 记录 baseline，超 5% 失败。
- 验收：新增组件后 `dist/assets/*.js` 增量 ≤15KB（gzip）。

#### P28 ripple 的定时器、DOM 与安全上下文

**现象**：`Surface` 每次 `pointerdown` 都 `setRipples([...current, next])`，并起一个 720ms 的 `setTimeout`；没有清理；`crypto.randomUUID()` 在非安全上下文不可用。

**证据**：

- `crypto.randomUUID()` 只在安全上下文（HTTPS 或 localhost）可用〔A：[MDN randomUUID](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)〕；用局域网 IP + http 在手机上调试时调用会抛错，而它发生在 `onPointerDown` 里，会连带影响点击（〔推断〕）。
- 每个 ripple 都是一个绝对定位 `<span>` + 700ms 动画；快速连点会累积节点与定时器，且每次 `setState` 都重渲染整个 `Surface` 子树〔推断，基于 [Surface.tsx](../../src/component/surface/Surface.tsx)〕。
- `prefers-reduced-motion` 在 CSS 里把动画降到 1ms，但 JS 仍然创建节点、启动定时器，属于无效工作〔推断〕。

**影响**：

- 开发者：手机真机调试时点击直接报错，难以定位。
- 用户：低端设备连点卡顿；开启减少动效后仍有闪烁。

**对策**：

- `id` 改用递增计数器或 `Math.random().toString(36)`，去掉安全上下文依赖。
- `useEffect` 清理所有 timer；或改用 CSS 动画 + `animationend` 移除节点，避免 JS 定时器。
- 用 `matchMedia('(prefers-reduced-motion: reduce)')` 在 JS 侧直接跳过 ripple。
- 限制同时存在的 ripple 数量（如 3 个），超出丢弃最早的。
- 验收：手机上用 http + LAN IP 连点 20 次无报错；Performance 面板无长任务。

#### P29 Context 重渲染与 React Compiler 下的 memo 策略

**现象**：`ThemeProvider`、未来的 `FieldContext`、`DialogContext` 如果 value 每次渲染都新建对象，会带动整棵子树重渲染。

**证据**：

- React 官方文档明确：`useContext` 的消费者在 context value 变化时重渲染；传对象/函数时要 memo 化〔A：[useContext](https://react.dev/reference/react/useContext)〕。
- React Compiler 自动处理 `useMemo` / `useCallback` / `React.memo`，官方定位就是「消除手动 memo」〔A：[React Compiler](https://react.dev/learn/react-compiler)〕；我们已启用该插件。
- MUI 的 context 拆分（`@mui/private-theming`、`@mui/system`）也是为了限制主题变化的重渲染范围〔推断，基于其包结构〕。

**影响**：

- 开发者：主题切换或输入时整页重渲染，输入卡顿。
- 用户：打字掉帧。

**对策**：

- Context 按「变化频率」拆分：主题（低频）、字段状态（高频）、Dialog 层级（中频）不要混在一个 Provider。
- 依赖 React Compiler，但**不要**写违反 Rules of React 的代码（条件调用 hook、直接改 props）；Compiler 会跳过无法证明安全的组件。
- 对高频输入组件，用 `useDeferredValue` 或把「显示值」与「提交值」分离。
- 验收：React DevTools Profiler 中，输入一个字符的重渲染组件数 ≤3。

### G. 治理与演进

#### P30 设计系统死于「没人用」，不是「没做完」

**现象**：我们只有 9 个组件，风险不在数量，而在「做出来的东西没人用/不敢用」。

**证据**：

- 一个 2.5 年的设计系统复盘：选 Web Components + Lit 做框架无关组件，发布到 v2.0 RC，最终**只有一个团队采用**，没有任何产品接入，负责组织被解散；作者总结原因是缺少产品级治理、成功指标与持续布道〔C：[The Story of My Failed Design System](https://dev.to/hsskey/the-story-of-my-failed-design-system-a85)（[摘要](https://semanticed.online/developer-tools/the-story-of-my-failed-design-system-44cc6d5f)）〕。
- NN/g 引用 zeroheight 五年报告：多数设计系统团队只有 **2–5 人**，5,000+ 员工的公司平均 9–11 人，很少超过 20–25 人；小团队的优势是「被迫只做真正需要的组件」〔C：[Small by Design](https://www.nngroup.com/articles/lean-design-system-teams/)〕。
- zeroheight 文章标题即结论：「抽象会掏空质量」——组件越多，越容易变成「薄薄一层包装」〔C：[The design system paradox](https://zeroheight.com/blog/the-design-system-paradox-how-abstraction-can-hollow-out-quality/)〕。

**影响**：

- 开发者：组件 API 不好用就绕过，最后出现三套按钮。
- 用户：同一产品里交互不一致。

**对策**：

- 每个组件上线前必须有 2 个真实页面在用（dogfooding），否则不进库。
- 采纳度量：`grep` 组件导入次数 + 每季度「绕过率」（直接用 `<button>` 的次数 / 总按钮数）。
- 组件准入清单（Definition of Ready）：有 story、有 axe 测试、有键盘矩阵、有错误/空/加载态、有迁移说明。

#### P31 文档滞后与迁移指南缺失，会把小改动放大成事故

**现象**：组件改一个 prop 的语义，如果没有 changelog 与 codemod，调用方只能靠运行时排错。

**证据**：

- Chakra v3 迁移指南漏写 `Icon` 的结构变化（不再包裹 `<svg>`、需要 `asChild`），直接破坏存量自定义图标〔B：[chakra-ui#10685](https://github.com/chakra-ui/chakra-ui/issues/10685)〕。
- Chakra v3 升级后首次渲染时间翻倍，官方 discussion 讨论该问题〔B：[chakra-ui#9488](https://github.com/chakra-ui/chakra-ui/discussions/9488)〕。
- Ant Design 在 Next.js 14 下的样式闪烁 issue 有 22 条评论，属于「升级即回归」的典型〔B：[ant-design#45567](https://github.com/ant-design/ant-design/issues/45567)〕。

**影响**：

- 开发者：升级一次要读源码、试错、回滚。
- 用户：升级当天界面错乱。

**对策**：

- 每个组件目录下 `CHANGELOG.md`（或统一 `docs/components/<name>.mdx`），记录 props 变更与迁移片段。
- 公开 props 只增不改；破坏性变更走 major + 提供 codemod（jscodeshift 脚本）。
- 发布前跑 `pnpm build && pnpm lint && node scripts/check-contrast.mjs && node scripts/check-tokens.mjs`。

#### P32 无障碍事后补救的代价：Ant Design 的 6 年

**现象**：a11y 一旦不是默认行为，就会变成长期债务：issue 越积越多，修复一个组件要动 DOM 结构，进而影响样式与测试。

**证据**：

- Ant Design 的「Improve the accessibility」总 issue 创建于 2020-03，到 2026-08 仍有更新、**26 个 👍**、状态 open；正文直接引用第三方评测「AntD have poor accessibility」，并列出 focus indicator 与 WAI-ARIA 合规两项优先〔B：[ant-design#22343](https://github.com/ant-design/ant-design/issues/22343)〕。
- 搜索 `repo:ant-design/ant-design accessibility in:title` 返回 **128** 条 issue/PR〔B：GitHub Search API，2026-10-20〕。
- Ant Design Tabs 的无障碍缺陷由第三方机构在真实项目中测出，修复清单包括移除无意义 `tabindex`、补 `aria-controls`/`aria-labelledby`〔B：[ant-design#18798](https://github.com/ant-design/ant-design/issues/18798)〕。
- WebAIM 2026 的结论：首页元素数 7 年翻倍、ARIA 用量是 2019 年的 6 倍，而错误率没有下降；「更简单的系统」反而更容易可访问〔C：[The WebAIM Million](https://webaim.org/projects/million/)〕。

**影响**：

- 开发者：修 a11y 要改 DOM，DOM 一变样式和测试全崩。
- 用户：残障用户被长期排除。

**对策**：

- a11y 写进组件模板（新建组件时自带 `Field`/`FocusScope`/`VisuallyHidden`），而不是评审时补。
- CI 跑 axe（Storybook addon 或 Playwright + `@axe-core/playwright`），`critical`/`serious` 直接失败。
- 每季度做一次键盘 + 屏幕阅读器（NVDA/VoiceOver）走查，记录在 `docs/a11y/audit-YYYY-QN.md`。

---

## 3. 用户不喜欢 UI 的具体表现

| #   | 表现                                     | 证据                                                                                                                                                                                                                                                                                               | 对应到我们的组件/决策                                                                                     |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | **过多动效、循环动画**                   | NN/g：动效会强制吸引注意力，无关动效显著降低体验；同时出现多个动画会互相削弱〔C：[The Role of Animation and Motion in UX](https://www.nngroup.com/articles/animation-purpose-ux/)〕；`prefers-reduced-motion` 是 WCAG 认可的规避手段〔A：[C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39)〕 | Surface ripple 目前 700ms、每次点击新建；Switch 180ms 过渡；应统一 ≤240ms，并提供「减少动效」下无动画路径 |
| 2   | **低对比度文字**                         | WebAIM 2026：83.9% 页面有低对比文本，平均每页 34 处〔C：[WebAIM Million](https://webaim.org/projects/million/)〕；Bootstrap 暗色被投诉对比度低〔B：[#38525](https://github.com/twbs/bootstrap/issues/38525)〕                                                                                      | `--faint` / placeholder / 浅色 accent 实测不达标（1.2 节）                                                |
| 3   | **模态滥用**                             | NN/g 列出模态五大缺点：强制立即响应、打断工作流、让用户忘记上下文、制造额外「关闭」目标、遮挡背景信息〔C：[Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/)〕                                                                                                    | Dialog 只有一种形态；缺少 inline alert / toast / popover，容易什么都用 Dialog                             |
| 4   | **层级过深、弹层套弹层**                 | shadcn：Dialog 内 Combobox 可见但点不中〔B：[#9712](https://github.com/shadcn-ui/ui/issues/9712)〕；Radix focus guard 被 axe 判违规〔B：[#3593](https://github.com/radix-ui/primitives/issues/3593)〕                                                                                              | 无 Portal/Layer 系统；Surface `overflow:hidden` 会裁剪                                                    |
| 5   | **状态不明确（无 loading/empty/error）** | NN/g：完全空的状态让用户不知道是「没有数据」「还在加载」还是「出错了」；先用「No records」再变成有数据，会严重损害信任〔C：[Designing Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)〕                                                                              | 组件没有空态/加载态/错误态 API；ProgressRing 只能表示确定进度                                             |
| 6   | **点击目标过小**                         | WCAG 2.5.8 要求 24×24；并建议提供密度选项〔A：[Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)〕；5 个主流系统 0/5 定义目标尺寸 token〔C：[Zenodo](https://zenodo.org/records/21567692)〕                                                            | Switch 46×26、Button sm 32px；无密度切换                                                                  |
| 7   | **假精确数据**                           | `ProgressRing` 用 `Math.round(value)`，0.4% 会显示 0%、99.6% 显示 100%；进度语义失真（〔推断〕，基于 [ProgressRing.tsx](../../src/component/ring/ProgressRing.tsx)）                                                                                                                               | 需要 `precision`、`aria-valuetext`、不确定态（indeterminate）                                             |
| 8   | **破坏性操作无撤销、误关闭丢数据**       | Nielsen #3：用户需要「紧急出口」，支持 Undo/Redo〔C：[10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)〕；APG：不可逆操作初始焦点放最不破坏的选项〔A：[Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)〕                               | Dialog 点 backdrop 即关，无 `dirty` 拦截、无 `reason`                                                     |
| 9   | **表单报错不清/过早校验**                | NN/g：错误要内联、显式、紧邻字段；不要输入未完成就校验；不要用 tooltip 报错〔C：[10 Design Guidelines](https://www.nngroup.com/articles/errors-forms-design-guidelines/)〕                                                                                                                         | TextInput 无 error API；校验时机由调用方各自实现                                                          |
| 10  | **加载闪烁**                             | NN/g：<1 秒的加载不要用 skeleton/spinner，快速闪烁会让人跟不上；2–10 秒用 spinner，<10 秒可用 skeleton，>10 秒用进度条〔C：[Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)〕                                                                                            | 没有 Skeleton/Spinner 组件，容易随手加 spinner 造成闪烁                                                   |
| 11  | **焦点丢失或焦点环误导**                 | shadcn：程序化恢复焦点后，鼠标用户看到键盘焦点环〔B：[#11258](https://github.com/shadcn-ui/ui/issues/11258)〕；WCAG 1.4.11 要求焦点指示对比度〔A：[1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)〕                                                                   | TextInput/Select 用 `:focus-within` 不区分输入方式；Dialog 关闭不保证焦点归还                             |
| 12  | **不可预测的交互**                       | Nielsen #4：一致性；用户大部分时间在用别的产品，期望由别人设定〔C：[10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)〕；SR 调查第 2 大问题是「菜单/tab/对话框行为不符合预期」〔C：[SR Survey #10](https://webaim.org/projects/screenreadersurvey10/)〕         | 组件 API 命名不统一（`onChange(value)` vs 原生 `onChange(event)`）、关闭语义不一致                        |

---

## 4. 用户喜欢 UI 的具体表现

| #   | 表现                   | 证据                                                                                                                                                                                                                                                                                                                      | 我们要怎么支持                                                                              |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | **即时反馈（<100ms）** | NN/g 三个时间阈值：0.1s 感觉「立即」、1s 保持思路、10s 保持注意力〔C：[Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)〕；Nielsen #1「系统状态可见」要求尽可能快〔C：[10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)〕 | 按钮/开关的视觉反馈走 CSS transform/颜色，不依赖网络；异步操作立刻进入 loading              |
| 2   | **乐观更新**           | React 19 `useOptimistic`：请求进行中先渲染最终状态，失败自动回滚〔A：[React v19](https://react.dev/blog/2024/12/05/react-19)〕                                                                                                                                                                                            | 提供 `useOptimisticMutation` 或至少文档示例；Toast 支持「已保存/失败重试」                  |
| 3   | **撤销优于确认**       | Nielsen #3 明确「Support Undo and Redo」；NN/g 也建议少用确认模态〔C：[Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)、[Modal](https://www.nngroup.com/articles/modal-nonmodal-dialog/)〕                                                                                                        | Toast 带 `Undo` 动作；删除先标记后提交；Dialog 的 `confirmOnDismiss`                        |
| 4   | **键盘优先**           | APG 为每个模式定义完整键盘交互〔A：[Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)〕；SR 调查第 5 大问题是「缺键盘可达性」〔C：[SR Survey #10](https://webaim.org/projects/screenreadersurvey10/)〕                                                                                              | 所有组件有键盘矩阵测试；提供 `Cmd+K` 命令面板作为后续能力                                   |
| 5   | **密度可选**           | WCAG 2.5.8 的 Note 明确建议提供密度机制，因为不同低视力用户偏好不同〔A：[Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)〕                                                                                                                                                  | `data-density` + 尺寸 token；表格/列表提供紧凑模式                                          |
| 6   | **清晰焦点**           | WCAG 1.4.11 要求焦点指示 ≥3:1，且细线在抗锯齿下会变淡〔A：[1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)〕；shadcn 专门修 focus 绑定〔B：[#11258](https://github.com/shadcn-ui/ui/issues/11258)〕                                                                                           | 统一 `--focus-ring-*` token；`:focus-visible` 区分输入方式                                  |
| 7   | **克制动效**           | NN/g：动效应「unobtrusive, brief, subtle」，用于反馈与状态变化，而非装饰〔C：[Animation](https://www.nngroup.com/articles/animation-purpose-ux/)〕；WCAG 提供 reduced-motion 技术〔A：[C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39)〕                                                                           | 动效时长 120–240ms、`ease-out`；禁止装饰性循环；`prefers-reduced-motion` 全局兜底           |
| 8   | **可预测交互**         | Nielsen #4 一致性；SR 调查第 2 大问题就是「行为不符合预期」〔C：[Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)、[SR Survey](https://webaim.org/projects/screenreadersurvey10/)〕                                                                                                                | 统一 `value/defaultValue/onValueChange`、`open/defaultOpen/onOpenChange`、`onClose(reason)` |
| 9   | **良好空状态**         | NN/g：空状态应说明系统状态、提供学习线索、给出下一步入口；「No records」后又出现内容是反例〔C：[Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)〕                                                                                                                                           | `EmptyState` 组件：icon + 标题 + 一句解释 + 主操作；`loading` 与 `empty` 严格互斥           |
| 10  | **真实/可解释的进度**  | NN/g：>10s 需要百分比进度与中断入口；不确定时用「已完成工作量」而非假百分比〔C：[Response Times](https://www.nngroup.com/articles/response-times-3-important-limits/)〕                                                                                                                                                   | `ProgressRing` 支持 `indeterminate`、`precision`、`aria-valuetext`；长任务显示阶段名        |

---

## 5. 十条硬性设计约束（可检查、可 lint / 评审）

| 编号    | 约束                                           | 判定标准                                                                                                                    | 检查方式                                                                                        | 现状                                                                      |
| ------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **C1**  | **token 三层，组件禁止字面量**                 | 组件 CSS 只能引用 `--color-*` / `--space-*` / `--radius-*` / `--control-*`；hex/rgba 只允许出现在 `src/token/primitive.css` | `scripts/check-tokens.mjs` 正则扫描 + stylelint `color-no-hex`（对 `src/component/**` 生效）    | 不通过：`--mint`/`--violet`/`--amber` 被直接引用，组件内有 `rgba(...)`    |
| **C2**  | **对比度门禁**                                 | 正文 ≥4.5:1；大字（≥24px 或 ≥18.66px bold）≥3:1；UI 边界/焦点/图标 ≥3:1                                                     | `scripts/check-contrast.mjs` 对 token 组合跑 WCAG 公式，CI 失败阻断                             | 不通过：`--faint` 3.40 / 2.47，placeholder 2.80，边框 1.63                |
| **C3**  | **焦点可见且不被裁剪**                         | 每个可交互元素 `:focus-visible` 有 ≥2px、≥3:1 的指示；容器不得裁剪焦点环                                                    | 手动键盘走查 + Playwright 截图比对；`overflow:hidden` 容器需 `padding` 或 `outline-offset` 调整 | 部分：全局有 2px 焦点环，但 input/select 抑制了 outline，Surface 可能裁剪 |
| **C4**  | **目标尺寸**                                   | 指针目标 ≥24×24（AA 底线），触屏场景 ≥44×44 或满足间距例外；提供密度开关                                                    | 脚本遍历交互元素 `getBoundingClientRect()`；story 中加 `min-target` 检查                        | 部分：Switch 26px 高、Button sm 32px                                      |
| **C5**  | **表单字段三件套**                             | 每个字段必须有 label；hint/error 必须进 `aria-describedby`；错误必须 `aria-invalid` + 文本 + 图标，且不在输入完成前出现     | axe `label`/`aria-describedby` 规则；`Field` 组件单元测试                                       | 不通过：无 error API，Select 无 hint 关联                                 |
| **C6**  | **受控/非受控二选一**                          | `value` 与 `defaultValue` 不得同时生效；受控时必须有 `onValueChange`；开发环境对「半受控」警告                              | `useControllableState` 单元测试                                                                 | 不通过：Select/Switch 仅受控                                              |
| **C7**  | **浮层必须 Portal + z-index token + 焦点归还** | 所有浮层渲染到 `#layer-root`；`z-index` 只引用 `--z-*`；关闭后焦点回到触发元素                                              | eslint 自定义规则禁止 `z-index` 字面量；Dialog/Select story 的焦点断言                          | 不通过：无 Portal、无 z-index scale                                       |
| **C8**  | **动效约束**                                   | 时长 120–240ms、`ease-out`；禁止装饰性循环动画；必须提供 `prefers-reduced-motion` 路径（CSS 或 JS）                         | 评审 + stylelint `declaration-property-value-disallowed-list`（禁 `animation: infinite`）       | 部分：CSS 有 reduced-motion，JS ripple 未跳过                             |
| **C9**  | **数据组件五态齐全**                           | `loading` / `empty` / `error` / `disabled` / `readOnly` 都有明确视觉与 ARIA；empty 与 loading 不得同时出现                  | 组件 story 必须覆盖五态；评审 checklist                                                         | 不通过：现有组件只有 disabled                                             |
| **C10** | **API 稳定 + 质量门禁**                        | 公开 props 只增不改；破坏性变更走 major + codemod；每个组件有 story、axe、视觉回归                                          | CI：`build + lint + check-tokens + check-contrast + axe`；PR 模板勾选                           | 不通过：无 Storybook、无 axe、无视觉回归                                  |

**落地建议**：

- `eslint-plugin-jsx-a11y` 开启推荐规则集，额外加 `label-has-associated-control`、`no-noninteractive-tabindex`、`click-events-have-key-events`。
- `stylelint` 加 `color-no-hex`（排除 `src/token/**`）、`declaration-property-value-disallowed-list` 禁 `z-index` 字面量与 `outline: none`。
- `scripts/check-contrast.mjs` 从 `src/token/*.css` 解析变量，跑附录 B 的公式；输出 `tokens.contrast.json`，CI diff。
- PR 模板三问：新增了什么状态？键盘怎么走？对比度多少？

---

## 6. 组件 API 设计建议

### 6.1 受控 / 非受控契约

```ts
// 统一命名：值与开关都用 value/defaultValue/onValueChange
interface ValueProps<T> {
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    disabled?: boolean;
    readOnly?: boolean;
    name?: string;
    required?: boolean;
}

// 浮层统一：open/defaultOpen/onOpenChange + 关闭原因
interface OpenProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, reason: "trigger" | "escape" | "outside" | "close-button") => void;
}
```

实现要点：

- `useControllableState({ value, defaultValue, onChange })`：受控判断用 `value !== undefined`；非受控内部 `useState`；两者同时存在时 `console.warn`。
- 原生 `onChange(event)` 仍透传，供需要 `event.target` 的场景；但设计值走 `onValueChange`，避免调用方处理 `ChangeEvent` 类型。
- 表单集成：真实控件带 `name`，受控组件也渲染 `<input type="hidden">` 或不阻止原生提交。

### 6.2 `asChild` vs `as` vs 泛型多态

| 方案                               | 适用                            | 优点                                                | 代价                                        |
| ---------------------------------- | ------------------------------- | --------------------------------------------------- | ------------------------------------------- |
| `asChild`（Slot）                  | 交互组件：Button、Trigger、Link | 不引入泛型；强制子组件 spread props + ref；组合自然 | 子组件必须配合；调试时 DOM 结构不直观       |
| `as`（受限联合）                   | 布局/容器：Stack、Surface、Card | 简单、类型安全、可读                                | 只能选预设标签                              |
| 泛型多态 `<T extends ElementType>` | 极少数组件                      | 类型最强                                            | TS 复杂、编译慢、易出 `any`；团队维护成本高 |

建议：**交互用 `asChild`，布局用受限 `as`，不做泛型多态**。理由：Radix 已验证 `asChild` 是可行标准〔A：[Composition](https://www.radix-ui.com/primitives/docs/guides/composition)〕，而我们的团队规模（NN/g：2–5 人为常态〔C：[Lean teams](https://www.nngroup.com/articles/lean-design-system-teams/)〕）不适合维护复杂泛型。

`Slot` 实现要点（约 60 行）：

- `Children.only` 校验单子元素；
- 合并 `className`、`style`、事件处理器（先子后父，`event.defaultPrevented` 时跳过）；
- 合并 ref（`useComposedRefs`）；
- 保留子元素原有 props，父组件 props 覆盖同名（除事件）。

### 6.3 className 合并

```ts
// src/component/_internal/cx.ts
export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");
```

- 组件根节点：`className={cx("button", `button--${variant}`, `button--${size}`, className)}`，消费者类永远最后。
- 同时输出 `data-slot="button"`、`data-variant`、`data-size`，消费者优先用属性选择器覆盖：`[data-slot="button"] { … }`，特异性稳定。
- 禁止在组件内部用 `!important`；消费者需要覆盖时用 `data-*` + 变量。

### 6.4 ref 转发（React 19）

```tsx
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    ref?: Ref<HTMLButtonElement>; // React 19：ref 是普通 prop
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export function Button({ ref, variant = "solid", size = "md", ...rest }: ButtonProps) {
    return <button ref={ref} data-variant={variant} data-size={size} {...rest} />;
}
```

- 不再写 `forwardRef`；`ref` 直接进 props 类型。
- 组合组件（`Field.Control`）用 `useComposedRefs(internalRef, props.ref)`。
- `asChild` 时把 ref 合并到克隆的子元素上。

### 6.5 组合式组件（Root / Trigger / Content）

以 Dialog 为例：

```tsx
<Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild>
        <Button>新建周期</Button>
    </Dialog.Trigger>
    <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
            <Dialog.Title>新建周期</Dialog.Title>
            <Dialog.Description>设置起止日期与重复规则。</Dialog.Description>
            <Dialog.Close asChild>
                <Button variant="ghost">取消</Button>
            </Dialog.Close>
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>
```

- `Root` 持有状态与 context；`Trigger` 负责 `aria-haspopup`/`aria-expanded`；`Portal` 负责层级；`Content` 负责焦点陷阱与 `role="dialog"`。
- 每个 part 都是独立文件，便于 tree-shaking：`dialog/DialogRoot.tsx`、`DialogTrigger.tsx`、`DialogContent.tsx`…
- 保留 `Dialog` 语法糖（现有 API），内部用组合组件实现，避免 breaking change。

### 6.6 避免布尔爆炸

规则：

1. 一个组件最多 1–2 个布尔 prop（`disabled`、`loading`）。
2. 视觉差异用枚举：`variant`、`size`、`tone`、`align`。
3. 状态用 `data-state`，不用 `isOpen`/`isActive`/`isSelected` 三个布尔。
4. 组合用子组件（`Card.Header`、`Card.Body`），不用 `hasHeader`/`hasFooter`。
5. 禁止 `danger` + `ghost` 这种需要额外规则的组合；用 `tone="danger" variant="ghost"` 两个正交枚举。

### 6.7 事件与回调

- `onOpenChange(open, reason)`、`onClose(reason)`：让调用方能区分 Esc / backdrop / 按钮。
- `composeEventHandlers(theirHandler, ourHandler)`：先执行消费者回调，`defaultPrevented` 时跳过内部逻辑。
- 异步动作：`onAction` 返回 Promise 时组件自动进入 pending，失败回滚（配合 `useOptimistic`）。

### 6.8 i18n 与默认文案

- 禁止硬编码英文：`Dialog` 的 `aria-label="Close dialog"`、`ProgressRing` 的 `"Progress"` 都必须是可覆盖的默认值。
- 提供 `LocaleProvider`（或 `ConfigProvider`）注入 `closeLabel`、`progressLabel`、`loadingLabel`。
- 默认值用中文还是英文由产品决定，但**必须可覆盖**，且 `aria-label` 与可见文本一致。

### 6.9 尺寸 / 密度 / 状态属性

```tsx
<div data-slot="button" data-variant="solid" data-size="md" data-state="idle" data-loading={loading || undefined} />
```

- CSS 用属性选择器：`[data-loading] { … }`、`[data-state="open"] { … }`。
- 测试用同一套属性断言，不依赖 class 名。
- 密度：根节点 `data-density="comfortable|compact"`，组件读 `--control-h-*`。

### 6.10 推荐目录结构

```
src/
  token/
    primitive.css      # 原始色阶（唯一允许 hex 的地方）
    semantic.css       # 语义映射：dark 默认 + [data-theme] + prefers-color-scheme
    component.css      # 组件级 token（--button-bg、--field-border…）
  component/
    _internal/
      cx.ts
      useControllableState.ts
      composeEventHandlers.ts
      useComposedRefs.ts
      Slot.tsx
      Portal.tsx
      FocusScope.tsx
      DismissableLayer.tsx
      VisuallyHidden.tsx
    button/
    dialog/
    field/             # Field.Root / Label / Control / Description / Error
    ...
  theme/
    bootstrap.ts       # 首屏阻塞脚本（供 index.html 内联）
    ThemeProvider.tsx
```

`_internal` 不对外导出；每个组件目录 `index.ts` 只导出自己；不做全局 barrel。

---

## 7. 优先级：哪些能力必须先建

判断标准：**如果不先建，后面每加一个组件就要返工几次**。

| 优先级 | 能力                                        | 为什么必须现在                                                   | 返工成本（如果不做）                                | 验收标准                                                                     |
| ------ | ------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| **T0** | token 三层 + 对比度脚本                     | 所有组件的颜色/间距/圆角都依赖它；现在只有 9 个组件，改动面最小  | 每加一个组件就多一处硬编码；后期改 token 要全库回归 | `check-tokens` / `check-contrast` 在 CI 通过；`--faint`/placeholder/边框达标 |
| **T0** | 主题引导脚本 + `prefers-color-scheme`       | 一旦有主题切换，FOUC 就是必现 bug；`index.html` 现在没有任何引导 | 要改 `index.html` + Provider + 所有 CSS 分支        | 刷新 10 次无闪烁；系统主题切换即时生效                                       |
| **T0** | focus token + `:focus-visible` 规范         | 所有交互组件共用；现在 input/select 各自抑制 outline             | 每个新组件重复实现，且不一致                        | 键盘走查全部可见；焦点环不被裁剪                                             |
| **T0** | Dialog 修复（初始焦点/归还/reason/dirty）   | 已有组件且在真实页面使用；误关丢数据是最高优先级缺陷             | 调用方各自包一层，形成多套行为                      | APG 键盘矩阵通过；误点 backdrop 不丢数据                                     |
| **T0** | Field 错误层（label/hint/error/required）   | 表单是最常用场景；TextInput/Select/Switch 都要接入               | 每个表单重复实现，a11y 不一致                       | axe 0 错误；错误时机符合 NN/g                                                |
| **T1** | Portal / Layer / z-index scale              | Dialog 内第一个自定义下拉就会踩坑                                | 要同时改 Dialog、Select、未来 Combobox              | Dialog 内 Select 可点击；Esc 逐层关闭                                        |
| **T1** | Button loading / icon-only 约束             | 提交场景高频；空按钮是 WebAIM 统计里的常见错误                   | 每个调用方自己写 spinner + disabled                 | `aria-busy` 正确；icon-only 编译期强制 label                                 |
| **T1** | 受控/非受控统一 hook                        | Select/Switch 目前只受控                                         | 每加一个表单组件就多一套状态逻辑                    | 同一 story 双模式行为一致                                                    |
| **T1** | 尺寸/密度 token                             | Switch/Button 已偏小；密度是 WCAG 建议                           | 后期调尺寸要改所有组件                              | 目标 ≥24；触屏 ≥44 或间距例外                                                |
| **T2** | Toast / InlineAlert / EmptyState / Skeleton | 反馈与状态层；没有它们就会滥用 Dialog                            | 每个页面自己写，风格不一                            | 五态 story 齐全；空态有下一步入口                                            |
| **T2** | Combobox / DatePicker / Table               | 复杂组件，依赖 T1 的 Portal/FocusScope                           | 自建必踩 ARIA/键盘坑                                | APG 模式测试通过                                                             |
| **T2** | RTL / 逻辑属性                              | 现在全是 `left/right`，以后改成本高                              | 全库 CSS 重写                                       | `dir="rtl"` 下布局正确                                                       |
| **T3** | Storybook + axe + 视觉回归 + 发布流程       | 质量门禁；越晚建越难补                                           | 组件越多，补测试成本越高                            | CI 全绿；每个组件有 story                                                    |

**关键判断**：T0 的五件事（token、主题引导、focus、Dialog、Field）**相互耦合**——token 决定 focus 颜色，Field 依赖 Dialog 的焦点管理，主题引导决定 token 的切换方式。先做其中任意一件而不做其余，都会在两周内返工。建议按「token → 主题引导 → focus → Dialog → Field」的顺序，一次性做完再开新组件。

---

## 8. 附录

### A. 证据索引

**组件库 / 体积 / 性能**

- MUI `sx` 性能对照（100/112/181/296ms）：<https://github.com/mui/material-ui/issues/43309>
- MUI Emotion 首开延迟 300ms–3000ms：<https://github.com/mui/material-ui/issues/29645>
- MUI 预序列化样式 PR（101.6→82.2ms）：<https://github.com/mui/material-ui/pull/43412>
- MUI Pigment CSS（零运行时）：<https://mui.com/blog/introducing-pigment-css/>
- MUI 体积：<https://bundlephobia.com/package/@mui/material@5.15.20>
- MUI 周下载量：<https://api.npmjs.org/downloads/point/last-week/@mui/material>
- Ant Design 体积：<https://bundlephobia.com/package/antd@5.21.0>
- Ant Design tree-shaking 博客：<https://ant.design/docs/blog/tree-shaking>
- Ant Design Next.js 14 样式闪烁：<https://github.com/ant-design/ant-design/issues/45567>
- Chakra 体积：<https://bundlephobia.com/package/@chakra-ui/react@2.10.4>
- Chakra v3 首渲染翻倍：<https://github.com/chakra-ui/chakra-ui/discussions/9488>
- Chakra v3 迁移漏项：<https://github.com/chakra-ui/chakra-ui/issues/10685>
- Radix Dialog 体积：<https://bundlephobia.com/package/@radix-ui/react-dialog@1.1.2>
- Radix focus guard a11y：<https://github.com/radix-ui/primitives/issues/3593>
- Radix 组合（asChild）：<https://www.radix-ui.com/primitives/docs/guides/composition>
- shadcn Dialog 内 Combobox：<https://github.com/shadcn-ui/ui/issues/9712>
- shadcn focus ring：<https://github.com/shadcn-ui/ui/issues/11258>

**暗色模式 / 主题**

- Josh Comeau 完美暗色模式：<https://www.joshwcomeau.com/react/dark-mode/>
- Bootstrap 暗色模式 PR（含「脚本放 head 防闪」）：<https://github.com/twbs/bootstrap/pull/28449>
- Bootstrap 组件不尊重主题变量：<https://github.com/twbs/bootstrap/issues/37976>
- Bootstrap 暗色对比度：<https://github.com/twbs/bootstrap/issues/38525>
- 小米 OLED 暗色拖影：<https://www.mi.com/global/support/faq/details/KA-612125/>
- MDN `color-scheme`：<https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme>

**无障碍**

- WebAIM Million 2026：<https://webaim.org/projects/million/>
- WebAIM 屏幕阅读器调查 #10：<https://webaim.org/projects/screenreadersurvey10/>
- WCAG 2.2 SC 2.5.8：<https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>
- WCAG 2.2 SC 1.4.11：<https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html>
- WAI-ARIA APG Modal Dialog：<https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>
- WCAG C39（reduced motion）：<https://www.w3.org/WAI/WCAG22/Techniques/css/C39>
- Ant Design a11y 总 issue：<https://github.com/ant-design/ant-design/issues/22343>
- Ant Design Tabs a11y：<https://github.com/ant-design/ant-design/issues/18798>
- Ant Design Collapse headingLevel：<https://github.com/ant-design/ant-design/issues/53203>
- Zenodo token / a11y 漂移论文：<https://zenodo.org/records/21567692>

**表单 / IME / 数字**

- React IME 受控组件 issue：<https://github.com/react/react/issues/8683>
- MDN compositionend：<https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionend_event>
- 数字输入四宗罪：<https://stackoverflow.blog/2022/12/26/why-the-number-input-is-the-worst-input/>
- GOV.UK 改 input type：<https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers>
- MDN Date.parse（date-only 按 UTC）：<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse>

**UX / 设计系统治理**

- NN/g 响应时间三阈值：<https://www.nngroup.com/articles/response-times-3-important-limits/>
- NN/g Skeleton Screens：<https://www.nngroup.com/articles/skeleton-screens/>
- NN/g 表单错误 10 条：<https://www.nngroup.com/articles/errors-forms-design-guidelines/>
- NN/g 动效角色：<https://www.nngroup.com/articles/animation-purpose-ux/>
- NN/g 模态 vs 非模态：<https://www.nngroup.com/articles/modal-nonmodal-dialog/>
- NN/g 空状态：<https://www.nngroup.com/articles/empty-state-interface-design/>
- NN/g 10 条启发式：<https://www.nngroup.com/articles/ten-usability-heuristics/>
- NN/g 精益设计系统团队：<https://www.nngroup.com/articles/lean-design-system-teams/>
- 失败的设计系统复盘：<https://dev.to/hsskey/the-story-of-my-failed-design-system-a85>
- OverlayQA token 漂移审计：<https://overlayqa.com/blog/design-token-drift-study/>
- zeroheight 设计系统悖论：<https://zeroheight.com/blog/the-design-system-paradox-how-abstraction-can-hollow-out-quality/>

**React**

- React 19（ref as prop / Actions / useOptimistic）：<https://react.dev/blog/2024/12/05/react-19>
- React Compiler：<https://react.dev/learn/react-compiler>
- `useId`：<https://react.dev/reference/react/useId>
- `useContext` 性能：<https://react.dev/reference/react/useContext>
- MDN `crypto.randomUUID`（安全上下文）：<https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID>

### B. 对比度复现脚本（PowerShell 原型）

```powershell
function Lin([double]$c) {
  if ($c -le 0.04045) { $c / 12.92 } else { [math]::Pow((($c + 0.055) / 1.055), 2.4) }
}
function Lum([string]$hex) {
  $h = $hex.TrimStart('#')
  $r = [Convert]::ToInt32($h.Substring(0,2),16) / 255
  $g = [Convert]::ToInt32($h.Substring(2,2),16) / 255
  $b = [Convert]::ToInt32($h.Substring(4,2),16) / 255
  0.2126 * (Lin $r) + 0.7152 * (Lin $g) + 0.0722 * (Lin $b)
}
function Ratio([string]$fg, [string]$bg) {
  $a = Lum $fg; $b = Lum $bg
  $hi = [math]::Max($a,$b); $lo = [math]::Min($a,$b)
  ($hi + 0.05) / ($lo + 0.05)
}
Ratio '#5d6b61' '#0b110e'   # 3.40
Ratio '#c9f36d' '#080b09'   # 15.56
```

生产版建议用 Node + `postcss` 解析 `src/token/*.css`，把每对「前景/背景」写进 `tokens.contrast.json`，CI 对比基线。

### C. 本文未覆盖 / 检索限制

- **State of CSS 2024 / State of JS 2024**：官方站点为客户端渲染，抓取仅得到标题，未取得可引用的百分比；因此未在正文引用其「最想要/最讨厌」数据。
- **Stack Overflow Developer Survey**：公开结果侧重语言/框架/工具，未直接覆盖组件库痛点，未强行引用。
- **Design Systems Survey（Sparkbox）**：站点返回 404，未取得数据；改用 zeroheight（经 NN/g 转引）与 OverlayQA。
- **未运行 axe / 浏览器实测**：对比度是静态计算；焦点裁剪、IME、OLED 拖影属于机制推断或厂商描述，需要真机/浏览器验证。
- **`src/component/icon/**` 未审计**：按任务要求不改动、不评价其内部实现；本文只把 `IconName` 当作外部类型边界。

### D. 术语

- **FOUC**：Flash of Unstyled Content，首屏样式/主题闪烁。
- **IME**：Input Method Editor，输入法；组合输入期间会触发 `compositionstart/update/end`。
- **token 漂移**：设计 token 与实现中的硬编码值逐渐脱节。
- **半受控**：同时接受 `value` 与 `defaultValue`，但行为未定义或依赖内部状态的组件。
- **`asChild`**：不渲染自身 DOM，而是把行为/属性注入唯一子元素的组合模式（Radix Slot）。
- **焦点归还**：浮层关闭后把焦点移回打开它的元素。
- **AA / AAA**：WCAG 一致性等级；AA 是多数产品的目标底线。
