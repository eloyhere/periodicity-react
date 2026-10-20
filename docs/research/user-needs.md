# Periodicity 用户研究：个人生产力 / 习惯 / 专注类应用的需求、偏好与组件映射

> 版本 v1.0 · 2026-10-20
> 研究对象：Periodicity（React 19 + TS + Vite，自建深色编辑风组件库）
> 目的：为 `src/component/**` 扩充提供**用户视角**依据：用户需求 → 组件能力 → 设计决策
> 边界：本报告**不修改任何 `src/**` 文件**；`src/component/icon/**` 由他人负责，本报告只做引用，不提出改动。

---

## 0. 十条结论（TL;DR）

1. **留下来的不是功能，而是"低摩擦的回路"**：捕获 → 看见 → 完成 → 得到反馈。任何一步多一次点击，习惯类产品就会在两周内被弃用。
2. **完成反馈是本品类最高 ROI 的微交互**：中文用户会明确记住"完成任务后的『叮』声"带来的秩序感；打勾本身提供"我做了很多事"的满足感。
3. **Streak 是双刃剑**：7 天是损失厌恶生效的临界点，但"断签即清零"会直接造成弃用；必须提供 freeze / 补记 / 暂停，而不是惩罚。
4. **计划可信度 > 计划精美度**：用户弃用 Todoist/滴答清单类产品的高频原因是"功能臃肿、心理压力大"和"日程与待办混在一起"，而不是不够漂亮。
5. **快速捕获必须是全局的、键盘优先的、可放弃的**：Things 的 Quick Entry 用 `Ctrl+Space` 全局唤起，`Esc` 丢弃、`Cmd+Enter` 保存——"可放弃"与"可保存"同等重要。
6. **自然语言输入在中文场景是刚需而非彩蛋**：Things 已官方支持中文自然语言；用户期待"明天 9 点 90 分钟"这类输入。
7. **日历不是待办的容器**：把一切塞进时间轴会破坏时间块整体性并放大预估错误；承诺（日程）与意愿（待办/仪式）需要不同的视觉语言。
8. **通知是负资产，除非它正好在用户想被提醒的那一刻**：NN/g 记录用户日均 56 条通知；Duolingo 只发 2 条/天且锚定在"上次练习后 23.5 小时"。
9. **中文特有需求是可验证的工程需求**：周一开始（CLDR/ISO 8601）、`YYYY年M月D日`、节气按太阳黄经 15° 计算、IME 组合输入期间不得触发快捷键、中文排版 1/4 em 中西文间距。
10. **本库的机会不在"再加一个 Button"，而在"补上回路中的空白件"**：Checkbox（带完成动效与撤销）、QuickAdd、CommandPalette、TimelineDay、EmptyState、UndoBar、WeekStrip、StreakBadge、SyncStatus、SolarTermLabel。

---

## 1. 方法与证据边界

### 1.1 证据等级

| 等级  | 含义                                                     | 例子                                                        |
| ----- | -------------------------------------------------------- | ----------------------------------------------------------- |
| **A** | 一手官方文档 / 标准 / 原始研究                           | Things 支持文档、W3C clreq、香港天文台节气说明、Kivetz 论文 |
| **B** | 可定位的用户原声（含链接）                               | Hacker News 评论、少数派长文、新闻报道中的用户引述          |
| **C** | 二手研究 / 媒体分析 / 产品官方营销                       | Duolingo PM 访谈整理、Baymard 研究摘要、产品官网            |
| **D** | 推断（本报告作者基于以上证据的判断，**不可当事实引用**） | "中文用户更需要周一开始"的具体比例                          |

### 1.2 本次检索的实际边界（诚实声明）

- **Reddit 抓取失败**：`reddit.com` / `old.reddit.com` / `r.jina.ai` 代理均返回连接失败；`trustpilot.com` 返回 403（人机校验）。因此**没有直接引用 Reddit 原帖**。
- **App Store / Play Store 评论区**无法直接抓取正文（页面不渲染评论），改以 Hacker News 讨论、少数派长文、新闻报道中的用户引述替代。
- 产品拆解部分：Things / Todoist / Raycast / Structured / Linear 为**逐页核验（A）**；TickTick / Notion / Obsidian / Superhuman / Amie / Rise / Reclaim / Forest 为**官网定位 + 公开常识（C/D）**，未做逐条文档核验，已在表中标注。
- 所有"推断"均以「**推断**」标注，不与证据混写。

### 1.3 与本项目现状的对照（只读检查）

截至 2026-10-20 03:45 的只读快照（库正在快速扩充，若与最新代码不符以代码为准）：

- **已实现**：`Surface`（分层 + ripple）、`Badge`（5 tone）、`Button`、`Card`、`Dialog`（原生 `<dialog>`）、`Switch`、`TextInput`、`Select`、`ProgressRing`、`Backdrop`、`StateLayer`；布局 `Columns/Inline/Stack`。
- **新增 foundation 层（关键）**：`tokens.css`、`Field` / `FieldGroup`、`Portal`、`useFocusTrap`、`useDismiss`、`useAnchoredPosition`、`useRovingTabIndex`、`useControllableState`、`useMergedRef`、`VisuallyHidden`、`cx`。
- **仍缺的"回路空白件"**：Checkbox（完成动效/撤销）、QuickAdd、CommandPalette、ProgressBar、TimelineDay、WeekStrip、EmptyState、UndoBar、SyncStatus、StreakBadge。

→ 结论：**S1–S8 不必从零造轮子**。Overlay 类（QuickAdd / CommandPalette / Popover）直接复用 `Portal + useFocusTrap + useDismiss + useAnchoredPosition`；列表键盘导航复用 `useRovingTabIndex`；表单字段复用 `Field`。这能把"用户导向"落到很低的实现成本上。

---

## 2. 用户需求分层 → 组件能力映射

### 2.1 功能性需求（"我要把事做完"）

| 用户需求                   | 用户原话 / 证据                                                                                                                                            | 组件能力                                 | 现状              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------- |
| 快速捕获，不打断当前事     | Things 的 Quick Entry"不用离开当前 App"，`Ctrl+Space` 唤起 [A](https://culturedcode.com/things/support/articles/2249437/)                                  | `QuickAdd`、`CommandPalette`、全局快捷键 | 缺                |
| 一次输入就带日期/时长/标签 | Things 自然语言：`tues 8am`、`17d`、`3rd wed jul`，且**支持中文** [A](https://culturedcode.com/things/support/articles/9780167/)                           | `NaturalDateInput`（内嵌于 QuickAdd）    | 缺                |
| 键盘完成一切               | Raycast"built to be driven entirely from the keyboard"：`⌘K` 动作面板、`⌘↵` 次要动作 [A](https://manual.raycast.com/keyboard-shortcuts)                    | `CommandPalette` + `Kbd` + 焦点管理      | 缺                |
| 今天做什么一眼可见         | Structured 把任务合并成"single visual timeline"，并提供周/月视图 [A](https://structured.app/)                                                              | `TimelineDay`、`WeekStrip`、`TodayList`  | 缺                |
| 完成后能改、能撤           | NN/g 可用性启发式："User control and freedom — Undo and Redo" [A](https://www.nngroup.com/articles/ten-usability-heuristics/)                              | `UndoBar`、`InlineEdit`、`ConfirmDialog` | 部分（有 Dialog） |
| 离线可用、数据属于自己     | HN 用户选择 Streaks 的理由："all data stored locally and can import/export as csv, no ads, no tracking" [B](https://news.ycombinator.com/item?id=33845360) | `SyncStatus`、`ExportAction`             | 缺                |
| 批量整理                   | 清单/看板用户会一次挪动多个条目（少数派用户以看板分类）[B](https://sspai.com/post/91132)                                                                   | `BatchBar`、`SelectableList`             | 缺                |

### 2.2 情感性需求（"我想继续做下去"）

| 用户需求                 | 证据                                                                                                                                                                                                            | 组件能力                                     | 设计含义                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| 完成要有"落地感"         | 滴答清单用户："我很喜欢在滴答清单里完成任务后的『叮』声，这给我的生活带来了更多秩序感" [B](https://sspai.com/post/91132)                                                                                        | `Checkbox` 完成动效 + 可选音效 + haptic      | 反馈必须**即时且可感知**，但不能每次都放礼花 |
| 打勾带来"我做了很多事"   | "在清单上打钩可以给自己一种『我做了很多事情』的满足感" [B](https://sspai.com/post/77123)                                                                                                                        | `ProgressRing`、`StreakBadge`、当日完成计数  | 进度可视化是情绪资产，不是报表               |
| 不想被 streak 绑架       | "Habit trackers have the potential to be just as destructive as they are constructive… if you have a streak in the hundreds and lose it, it can be crushing" [B](https://news.ycombinator.com/item?id=33843954) | `StreakFreezeSheet`、`BackfillAction`        | streak 要能"修复"，不能清零羞辱              |
| 需要被温和提醒，不被轰炸 | NN/g：推送五大错误，含"首次启动就要权限""突发式连发""难以关闭" [A](https://www.nngroup.com/articles/push-notification/)                                                                                         | `NotificationPrefs`（按仪式粒度）            | 默认关闭营销通知，只开用户自己选的           |
| 暗色是审美也是身份       | NN/g 调研 115 名移动用户：约 1/3 用暗色、1/3 用亮色、1/3 混合；暗色被描述为"more visually appealing""way cooler" [A](https://www.nngroup.com/articles/dark-mode-users-issues/)                                  | 语义色 token、light theme、对比度校验        | 暗色是默认，但必须提供亮色与系统跟随         |
| 空白页不要指责我         | NN/g：全空状态会让用户怀疑"是不是坏了/是不是我错了" [A](https://www.nngroup.com/articles/empty-state-interface-design/)                                                                                         | `EmptyState`（状态说明 + 学习线索 + 主行动） | 空状态文案禁止说教、禁止羞辱                 |

### 2.3 社会性需求（"我想被看见/被陪伴"）

| 用户需求          | 证据                                                                                                                                             | 组件能力                         | 设计含义                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- | --------------------------------------------------------- |
| 社群打卡/同伴监督 | 中文产品"小打卡"定位为"社群互动学习平台" [B](https://sj.qq.com/appdetail/com.zhuihuodong.xiaodaka)                                               | `ShareCard`、`AccountabilityRow` | 社交是**可选层**，不能进入核心回路                        |
| 但隐私优先        | HN："Privacy. These are your personal habits…""No social. Social really just gets in the way" [B](https://news.ycombinator.com/item?id=33842599) | 默认私有、显式分享               | 不做公开排行榜、不做通讯录匹配                            |
| 被理解的仪式感    | 节气/周期是中文语境里的天然叙事（见 §9）                                                                                                         | `SolarTermLabel`、`CycleRing`    | 用"节气/周期"替代"连续天数"作为主叙事，可降低 streak 压力 |

### 2.4 需求 → 组件矩阵（速查）

```
功能层：捕获 → QuickAdd / CommandPalette / NaturalDateInput
        组织 → ListRow / SectionHeader / TagInput / DragSort
        计划 → TimelineDay / WeekStrip / CalendarMonth / TimeBlock
        执行 → FocusTimer / Checkbox / InlineEdit
        收尾 → UndoBar / BatchBar / SyncStatus
情感层：进度 → ProgressRing / ProgressBar / StreakBadge / MonthHeatmap
        奖励 → CompletionBurst（克制）/ SoundToggle
        安全 → EmptyState / ConfirmDialog / RecoveryPrompt
社会层：分享 → ShareCard / AccountabilityRow（默认关闭）
```

---

## 3. 用户真正在用什么：留下来的原因 vs 卸载的原因

### 3.1 Habit tracker

**留下来的原因**

- **零摩擦记录**：作者自述产品原则第一条是"Minimal friction. Habit tracking requires dedication, so it should require almost no effort" [B](https://news.ycombinator.com/item?id=33842599)。
- **本地/可导出/无账号**：用户明确为"local + csv + 无广告无追踪"买单 [B](https://news.ycombinator.com/item?id=33845360)。
- **streak freeze**：用户用 Duolingo 846 天 vs Brilliant 0 天做对比，认为 freeze 是"essential" [B](https://news.ycombinator.com/item?id=33843954)。
- **可暂停**：Show HN 产品把"Pause the app when you need a break or will be away"作为卖点 [B](https://news.ycombinator.com/item?id=40893866)。
- **负向习惯也要能记**："I want to track whether I refrained from doing something bad as frequently as I want to track doing something good." [B](https://news.ycombinator.com/item?id=33844205)

**卸载/不用的原因**

- **手动输入太累**："too lazy to input data manually"；"if I'm too lazy to do the habit, I'm also too lazy to enter that in the tracker, so I end up with skewed data" [B](https://news.ycombinator.com/item?id=33842724) / [B](https://news.ycombinator.com/item?id=33844205)。
- **缺少可视化/分析**：同一楼的直接理由是"lack of analytics / visualization" [B](https://news.ycombinator.com/item?id=33842724)。
- **跳过太麻烦**：用户抱怨"canceling out each of the daily habits with the 2 step skip can be cumbersome. I'd prefer a swipe… or 2 buttons (Done, Skip)" [B](https://news.ycombinator.com/item?id=33847147)。
- **streak 断掉的心理打击**：作者本人承认"Breaking my running streak was crushing and quite discouraging" [B](https://news.ycombinator.com/item?id=33852098)。
- **新鲜感消退**：开发者自己提醒"the first few weeks _may_ still be a honeymoon period… app novelty" [B](https://news.ycombinator.com/item?id=33852195)。

### 3.2 Todo / 任务管理

**留下来的原因**

- **一个清爽列表 + 快速勾完**：少数派用户离开滴答清单的直接原因是"界面设计和功能太臃肿""加了四象限番茄钟打卡时间线 blabla，其中有很多东西我是用不到的""每次打开它时我总会感觉到一点小小的心理压力" [B](https://sspai.com/post/77123)。
- **日程与待办分离**：同一作者的核心论点——"并不是所有事情都需要一个复选框""把所有待办都塞进日历…会破坏时间块的整体性，也可能会出现一些预估时长错误" [B](https://sspai.com/post/77123)。
- **稳定与同步速度**：另一位重度用户肯定滴答清单"使用了 1000 多天都没有遇到过 Bug""功能也很丰富" [B](https://sspai.com/post/91132)。
- **自然语言与全局捕获**：Things 把这两点做成产品级能力 [A](https://culturedcode.com/things/support/articles/9780167/) / [A](https://culturedcode.com/things/support/articles/2249437/)。

**卸载/放弃的原因**

- **功能加法带来的心理负担**（同上，滴答清单案例）。
- **层级/分类本身成为工作**：用户需要先设计"工作/个人/近期/未来"四类才能开始用 [B](https://sspai.com/post/91132)——这既是留存也是门槛。
- **一切皆复选框**：把"和朋友吃饭"也变成待办，会让工具失真 [B](https://sspai.com/post/77123)。

### 3.3 Focus timer

**留下来的原因**

- **专注与任务绑定**："因为它可以把『专注时间』跟『任务』关联起来…等下一次做同样的事情时，就有了一个时间预估"，并且"开启了『专注』…就会不自觉地约束自己不要分心" [B](https://sspai.com/post/91132)。
- **低成本进入**：用户不需要独立番茄钟 App，因为"我的所有待办任务都在滴答清单里" [B](https://sspai.com/post/91132)。
- **姿态友好**：Forest 的核心不是计时器，而是"锁机种树"的隐喻与克制手机使用的意义 [B](https://w.dzwww.com/p/p1nmSzd9x5.html)。

**卸载/反感的原因**

- **商业化侵入核心回路**：Forest 从买断（12–68 元）转 Plus 年费 155 元后，老用户发现"金币可购买的树种不再更新""PLUS 奖励被置顶，一不小心就碰到了""我们成二等用户了" [B](https://w.dzwww.com/p/p1nmSzd9x5.html)。
- **需要额外 App/设备**：用户会为"是否值得再装一个 App"做取舍（HN 上关于手表与番茄钟的讨论）[B](https://news.ycombinator.com/item?id=9914313)。

### 3.4 Calendar / time blocking

**留下来的原因**

- **时间轴即承诺**：Structured 的产品主张是"combines all your tasks and to-dos into a single visual timeline"，并强调"create tasks in seconds"与周/月视图 [A](https://structured.app/)。
- **日历负责提醒、清单负责勾选**：少数派用户把两者拆开使用后，"日历就成为了一个具有精确提醒功能的秘书" [B](https://sspai.com/post/77123)。
- **快、可键盘操作**：Raycast 的 Calendar 作为核心功能之一，用同一套键盘模型访问 [A](https://manual.raycast.com/keyboard-shortcuts)。

**卸载/反感的原因**

- **强行 All-in-one**：用户明确说"目前…好像还并没有一个软件能够在将两边的功能都做得完美的前提下保持界面美观/多平台快速同步" [B](https://sspai.com/post/77123)。
- **时间块过满导致第一天就失败**："不要把时间表排得太满…如果提前事无巨细地计划好了一切，到头来可能从第一天就失败了" [B](https://sspai.com/post/77123)。

### 3.5 留存/流失因子汇总

| 维度   | 留存因子（做）                           | 流失因子（别做）                           |
| ------ | ---------------------------------------- | ------------------------------------------ |
| 捕获   | 全局快捷键、自然语言、一次输入带全部属性 | 必须先选项目/标签/日期                     |
| 计划   | 日视图 + 周视图、可拖可键盘              | 强制 All-in-one、把待办塞进日历            |
| 执行   | 一键完成、即时反馈、专注与任务绑定       | 完成无撤销、计时器独立成 App               |
| 情绪   | freeze/补记/暂停、可见进度、克制庆祝     | 断签清零、羞辱文案、礼花轰炸               |
| 信任   | 本地优先、可导出、同步状态可见           | 静默覆盖、订阅陷阱、把升级入口塞进任务列表 |
| 注意力 | 1–2 条/天、按需订阅、安静时段            | 突发连发、首启索权、红点催促               |

---

## 4. 知名产品拆解：交互模式的共同点与差异

> 说明：本节关注**交互模式**而非功能清单。证据等级见每行末。

### 4.1 快速捕获（Quick Capture）

| 产品     | 模式                        | 关键细节                                                                                                                 | 证据                                                                              |
| -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Things 3 | 全局 Quick Entry + Autofill | `Ctrl+Space` 唤起；可在不离开当前 App 的情况下建待办；`Esc` **丢弃**输入、`Cmd+Enter` 保存；主 App 里 `Esc` 是收起并保存 | [A](https://culturedcode.com/things/support/articles/2249437/)                    |
| Todoist  | Quick Add + 全局快捷键      | 支持为 Quick Add 设置全局快捷键；Quick Add 内可加描述、日期                                                              | [A](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz) |
| Raycast  | 命令面板即捕获              | `⌘Space` 打开；输入即搜索；`⌘K` 打开动作面板；表单内 `⌘↵` 提交                                                           | [A](https://manual.raycast.com/keyboard-shortcuts)                                |

**共同点**：捕获是一个**覆盖层**（overlay），不是页面；**键盘唤起**；**可放弃**；保存与放弃有明确不同的按键语义。
**差异**：Things 把"放弃"放在 `Esc`（危险但快速），Raycast 把"动作"做成二级面板（可扩展），Todoist 把自然语言交给其他入口。
**对本库**：`QuickAdd` 必须是 overlay + `Surface` 分层；`Esc` 丢弃需二次确认或"草稿保留 5 秒"的折中（见 §7.2）。

### 4.2 键盘流（Keyboard-first）

| 产品       | 模式                                                                                             | 证据                                                           |
| ---------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Raycast    | 全键盘可达；`⌘K` 动作面板、`⌘↵` 次要动作、`⌃N/⌃P` 上下、`⌘D` 复制、`⌃X` 删除；Emacs/Vim 绑定可选 | [A](https://manual.raycast.com/keyboard-shortcuts)             |
| Superhuman | 以"快"为核心卖点，命令面板/快捷键驱动邮件处理（官网定位）                                        | [C](https://superhuman.com/)                                   |
| Linear     | 以键盘优先与"quality software"为产品哲学（Method 页面）                                          | [C](https://linear.app/method)                                 |
| Things     | 全量快捷键，且**快捷键在 Quick Entry 内同样生效**                                                | [A](https://culturedcode.com/things/support/articles/2785159/) |

**共同点**：单一入口（命令面板）+ 动作面板 + 一致的修饰键语义；快捷键是**产品语言**而非辅助功能。
**差异**：Raycast 把"动作"提升为一级概念（同一对象可有 primary/secondary/tertiary 动作）；Linear 把键盘流嵌入 issue 的层级导航。
**对本库**：`CommandPalette` 需要"对象 + 动作"两段式，而不是纯搜索。

### 4.3 自然语言输入（NL Input）

- Things 支持 `tod…`、`10-3`、`2p`、`17d`、`3rd wed jul`、`last fri jul…`，并**官方列出中文**为支持语言 [A](https://culturedcode.com/things/support/articles/9780167/)。
- Todoist 有独立开关"Turn smart date recognition on or off" [A](https://www.todoist.com/help/todoist/features/turn-smart-date-recognition-on-or-off-63WfIr)。
- Baymard 对自动补全的研究指出：**只有 19% 的站点把 autocomplete 做对**，说明"建议 + 可解析"是容易被低估的组件能力 [C](https://baymard.com/research-articles/autocomplete-design)。

**设计含义**：NL 输入的价值不在"炫技"，而在**减少选择**（Hick 定律）——用户用一句话替代 3 个 picker。解析失败时必须"降级为普通文本 + 可手动改"，不能阻塞保存。

### 4.4 层级克制（Hierarchy Restraint）

- Things：Area → Project → Heading → To-do，层级深但**默认只显示一层**，靠"Inbox/Today/Upcoming"平级入口降低深度感 [A](https://culturedcode.com/things/support/articles/2249437/)。
- 滴答清单：功能丰富（四象限、日历、标签、便签），但被一位长期用户评价为"太正式，太商务""功能上做加法" [B](https://sspai.com/post/77123)。
- Obsidian：以"文件即数据"的扁平结构 + 插件扩展，避免内置层级（官网定位）[C](https://obsidian.md/)。
- Notion：块级结构最灵活，但也把"如何组织"变成用户的认知工作（官网定位）[C](https://www.notion.com/product/calendar)。

**共同点**：成功的产品把**结构藏起来**，把**入口露出来**。
**对本库**：Periodicity 的 `Overview / Cycles / Rituals / Insights` 已是 4 个平级入口，应坚持"不再加第 5 个"，新能力以 Sheet/Palette 形式进入。

### 4.5 状态可视（State Visibility）

- Structured：一天 = 一条时间轴，块的长度即时长，颜色即类别 [A](https://structured.app/)。
- 滴答清单：进度以"专注关联任务"体现，用户能回看"写一篇文章需要多久" [B](https://sspai.com/post/91132)。
- Duolingo：streak 是核心状态，7 天后损失厌恶生效 [C](https://lennydistilled.com/episodes/behind-the-product-duolingo-streaks/)。
- 本库：`ProgressRing` 已实现百分比 + label，`Badge` 提供 5 个语义 tone——**状态可视的基础件已具备**，缺"时间维度"的可视化（周/月/热力）。

### 4.6 日历布局（Calendar Layout）

- Structured：日时间轴 + 周/月视图；"start planning on your phone, finish on your computer" [A](https://structured.app/)。
- Amie / Rise / Reclaim：把 todo 与 calendar 合并、AI 自动排程（官网定位）[C](https://www.amie.so/) / [C](https://www.risecalendar.com/) / [C](https://reclaim.ai/)。
- Sunrise（历史）：日历作为"第一公民"的设计先驱，2015 年被 Microsoft 收购（官方公告）[A](https://blogs.microsoft.com/blog/2015/02/11/microsoft-acquires-sunrise-creator-innovative-calendar-app-mobile-devices/)，其交互理念随后影响 Outlook Mobile（整合细节为背景知识，未逐页核验）。

**共同点**：**日视图是执行界面，周视图是计划界面，月视图是复盘界面**——三者不是同一张表的三档缩放。
**差异**：AI 排程类产品把"安排"自动化，但用户仍需要"手动覆盖"的安全感（推断）。
**对本库**：`TimelineDay` / `WeekStrip` / `CalendarMonth` 应是三个组件，而不是一个 `Calendar` 加 `view` prop 硬撑。

### 4.7 产品 × 交互模式对照

| 产品       | 快速捕获       | 键盘流 | 自然语言     | 层级克制     | 状态可视  | 日历布局          | 证据 |
| ---------- | -------------- | ------ | ------------ | ------------ | --------- | ----------------- | ---- |
| Things 3   | ● 全局 overlay | ● 全量 | ● 含中文     | ● 深但默认浅 | ○         | ○                 | A    |
| Todoist    | ● Quick Add    | ◐      | ● Smart date | ◐ 项目/标签  | ○         | ◐                 | A    |
| TickTick   | ◐              | ◐      | ◐            | ◐            | ◐         | ● 日历视图        | C    |
| Notion     | ○              | ◐      | ◐            | ○ 需自建     | ○         | ◐ Notion Calendar | C    |
| Obsidian   | ◐              | ◐      | ○            | ● 扁平       | ○         | ○                 | C    |
| Linear     | ● 命令         | ● 强   | ◐            | ●            | ●         | ○                 | C    |
| Raycast    | ●              | ● 极强 | ◐            | ●            | ○         | ● Calendar        | A    |
| Superhuman | ● 命令         | ● 极强 | ◐            | ●            | ○         | ○                 | C    |
| Structured | ◐              | ○      | ○            | ●            | ● 时间轴  | ● 日/周/月        | A    |
| Amie       | ◐              | ◐      | ◐            | ●            | ●         | ● 日历+todo       | C    |
| Rise       | ◐              | ○      | ○            | ●            | ●         | ● AI 排程         | C    |
| Reclaim    | ◐              | ○      | ○            | ●            | ●         | ● 自动 block      | C    |
| Forest     | ○              | ○      | ○            | ●            | ● 树/森林 | ○                 | B    |

（● 强 / ◐ 中 / ○ 弱或不做）

### 4.8 五条差异总结

1. **捕获的"可放弃性"是分水岭**：Things 用 `Esc` 丢弃、`Cmd+Enter` 保存，把"反悔"做成一等公民 [A](https://culturedcode.com/things/support/articles/2249437/)。
2. **动作面板 > 右键菜单**：Raycast 把"对一个对象能做什么"做成可搜索面板，支持键盘直达 [A](https://manual.raycast.com/keyboard-shortcuts)。
3. **自然语言是"减少选择"的手段**，不是输入框的花活（Hick 定律）[A](https://lawsofux.com/hicks-law/)。
4. **日历与清单是两种承诺**：一个是"不得不"，一个是"可以选择"；混在一起会让工具失真 [B](https://sspai.com/post/77123)。
5. **状态可视要服务"下一步"**，不是服务"报表"：用户看进度是为了决定现在做什么（goal-gradient）[A](https://lawsofux.com/goal-gradient-effect/)。

---

## 5. 认知负荷与动机研究

### 5.1 选择数量 = 决策时间（Hick / Choice Overload）

Hick 定律：决策时间随选项数量与复杂度上升；应对方式是"减少关键路径上的选择、把复杂任务拆小、突出推荐项、渐进式引导" [A](https://lawsofux.com/hicks-law/)。
Choice Overload 进一步指出选项过多会导致"瘫痪"而非"自由" [A](https://lawsofux.com/choice-overload/)。
**对本库**：QuickAdd 默认只暴露"标题 + 时间"；标签/颜色/tone 收进 `⌘K` 动作面板或"更多"。

### 5.2 响应时间与 Doherty 阈值

- NN/g 的响应时间三档：**0.1s** 感觉即时、**1s** 保持思路、**10s** 是注意力上限 [A](https://www.nngroup.com/articles/response-times-3-important-limits/)。
- Doherty 阈值：**400ms** 内的反馈能让交互"上瘾"，并建议用动画/进度条填补等待 [A](https://lawsofux.com/doherty-threshold/)。
  **对本库**：勾选完成必须在 100ms 内出现视觉变化（乐观 UI），持久化在后台；超过 400ms 的写入显示 `SyncStatus` 的 "saving" 态。

### 5.3 目标梯度（Goal-Gradient）

Kivetz 等的研究：越接近目标，努力越加速；"人为的进度"也能提升完成动机，但会带来"错觉进度"的伦理问题 [A](http://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf) / [A](https://lawsofux.com/goal-gradient-effect/)。
**对本库**：`ProgressRing` 应显示"已完成/总数"与"剩余"，而不只是百分比；不要用"68%"这种无法行动的抽象值（见反模式 §8.2）。

### 5.4 Streak：7 天阈值、损失厌恶与反效果

- Duolingo 留存负责人：**"Once you get to seven days, loss aversion kicks in, and you retain."** 1→2 天、2→3 天的留存提升巨大，直到第 7 天 [C](https://lennydistilled.com/episodes/behind-the-product-duolingo-streaks/)。
- 同一访谈：起步阶段给更多灵活性（freeze），长 streak 后收紧；并且"让用户自己选择目标"本身带来参与度（opt-out 实验是大赢）[C](https://lennydistilled.com/episodes/behind-the-product-duolingo-streaks/)。
- 学术侧：Duolingo 的留存可用前景理论/损失厌恶解释 [C](https://zenodo.org/records/11528881)；习惯形成机制案例研究也把 streak 列为关键机制 [C](https://doaj.org/article/d24e292737844124a6719a323f6f738b)。
- 用户侧：streak freeze "essential"；断签"crushing" [B](https://news.ycombinator.com/item?id=33843954) / [B](https://news.ycombinator.com/item?id=33852098)。
- 相邻证据（社交 streak）：Snapchat streak 与"义务型社交"焦虑的研究综述 [C](https://hiwavemakers.com/blog/snap-streaks-digital-anxiety-teen-research/)。

**设计结论**：streak 可以做，但必须配 `freeze`、`补记`、`暂停`，且**断签不清零历史最佳**；文案从"你断了"改为"要补上昨天吗？"（推断：降低羞耻感可减少弃用）。

### 5.5 通知疲劳

- NN/g 引用 Telefonica 研究：2016 年移动用户**日均 56 条通知**；并列出五大错误：首启索权、不说明内容、突发连发、无关内容、难以关闭 [A](https://www.nngroup.com/articles/push-notification/)。
- NN/g 特别点名待办类产品 Wunderlist："sends notifications for every task that is due… burst notifications" [A](https://www.nngroup.com/articles/push-notification/)。
- Duolingo 的做法相反：每天 2 条，第一条在"上次练习后 23.5 小时"发送，锚定用户习惯时刻 [C](https://lennydistilled.com/episodes/behind-the-product-duolingo-streaks/)。
  **对本库**：默认"每个仪式最多 1 条/天"，合并同类项，提供安静时段；不做"连续 N 天未打开"的召回轰炸。

### 5.6 决策疲劳与"计划本身的工作量"

少数派用户描述：功能越多，"每次打开它时我总会感觉到一点小小的心理压力" [B](https://sspai.com/post/77123)。这不是审美问题，而是**每次打开都要重新做分类决策**。
**对本库**：默认视图必须"零决策"——打开即 Today + 今日仪式，不需要先选项目/视图。

---

## 6. 用户喜欢清单 / 不喜欢清单

### 6.1 用户喜欢（每条：证据 → 设计含义 → 组件）

| #   | 喜欢什么                | 证据                                                                              | 设计含义                            | 组件                         |
| --- | ----------------------- | --------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------- |
| L1  | 完成任务的声音/触感反馈 | "完成任务后的『叮』声…秩序感" [B](https://sspai.com/post/91132)                   | 反馈要可感知、可关闭；默认轻柔      | `Checkbox` + `SoundToggle`   |
| L2  | 打勾带来的成就感        | "打钩可以给自己一种『我做了很多事情』的满足感" [B](https://sspai.com/post/77123)  | 完成态要有"累积"视觉（今日计数/环） | `ProgressRing`、`TodayCount` |
| L3  | 全局快速记录            | Things Quick Entry [A](https://culturedcode.com/things/support/articles/2249437/) | 任意页面 `⌘K`/`N` 可捕获            | `QuickAdd`                   |
| L4  | 一句话说清时间          | Things NL，含中文 [A](https://culturedcode.com/things/support/articles/9780167/)  | 解析结果要"可见可改"                | `NaturalDateInput`           |
| L5  | 键盘直达一切            | Raycast [A](https://manual.raycast.com/keyboard-shortcuts)                        | 每个鼠标操作都要有键位              | `CommandPalette`、`Kbd`      |
| L6  | 时间轴一眼看懂一天      | Structured [A](https://structured.app/)                                           | 块长=时长，颜色=类别，不叠字        | `TimelineDay`                |
| L7  | 周视图做计划            | Structured 周/月视图 [A](https://structured.app/)                                 | 周视图可拖、可缩放、可回到今天      | `WeekStrip`、`WeekGrid`      |
| L8  | 数据本地、可导出        | Streaks 用户理由 [B](https://news.ycombinator.com/item?id=33845360)               | 导出入口常在设置一级                | `ExportAction`               |
| L9  | streak 可冻结/补记      | [B](https://news.ycombinator.com/item?id=33843954)                                | 断签给"修复"路径，不清零            | `StreakFreezeSheet`          |
| L10 | 可暂停（旅行/生病）     | Show HN 卖点 [B](https://news.ycombinator.com/item?id=40893866)                   | "暂停周期"是正式功能                | `PauseCycleAction`           |
| L11 | 负向习惯可记录          | [B](https://news.ycombinator.com/item?id=33844205)                                | 支持"戒除"型仪式（计数 abstain）    | `RitualKind`（do/avoid）     |
| L12 | 暗色好看且护眼          | NN/g 调研 [A](https://www.nngroup.com/articles/dark-mode-users-issues/)           | 深色为默认，保留亮色                | theme tokens                 |
| L13 | 空状态教我怎么开始      | NN/g 三指南 [A](https://www.nngroup.com/articles/empty-state-interface-design/)   | 说明状态 + 学习线索 + 主行动        | `EmptyState`                 |
| L14 | 删了能撤回              | NN/g 启发式 [A](https://www.nngroup.com/articles/ten-usability-heuristics/)       | 删除/完成/移动都可撤销              | `UndoBar`                    |
| L15 | 批量整理清单            | 看板分类用户 [B](https://sspai.com/post/91132)                                    | 多选后才有批量条，不常驻            | `BatchBar`                   |

### 6.2 用户不喜欢（每条：证据 → 设计含义 → 反模式编号）

| #   | 不喜欢什么               | 证据                                                                                                    | 设计含义                               | 反模式 |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------ |
| D1  | 断签清零/羞辱            | [B](https://news.ycombinator.com/item?id=33843954) / [B](https://news.ycombinator.com/item?id=33852098) | 提供 freeze/补记/暂停；文案不指责      | P1     |
| D2  | 功能臃肿、打开有压力     | [B](https://sspai.com/post/77123)                                                                       | 默认零决策；高级能力收进 Sheet/Palette | P6     |
| D3  | 所有事都要复选框         | [B](https://sspai.com/post/77123)                                                                       | 区分 Commitment / Intention / Ritual   | P7     |
| D4  | 手动输入太累             | [B](https://news.ycombinator.com/item?id=33842724)                                                      | 一键完成、默认值、NL                   | P8     |
| D5  | 跳过两步太麻烦           | [B](https://news.ycombinator.com/item?id=33847147)                                                      | 提供 swipe / 双按钮（Done/Skip）       | P8     |
| D6  | 通知轰炸                 | NN/g 56 条/天、Wunderlist 案例 [A](https://www.nngroup.com/articles/push-notification/)                 | 合并、限频、安静时段                   | P5     |
| D7  | 首次启动就索要通知权限   | NN/g Mistake #1 [A](https://www.nngroup.com/articles/push-notification/)                                | 先给价值，再在设置里询问               | P9     |
| D8  | 升级入口混进任务列表     | Forest PLUS 置顶误触 [B](https://w.dzwww.com/p/p1nmSzd9x5.html)                                         | 商业化不进入执行回路                   | P11    |
| D9  | 买断转订阅、老用户变二等 | Forest 12 元 → 155 元/年 [B](https://w.dzwww.com/p/p1nmSzd9x5.html)                                     | 老功能永久保留；不做功能回收           | P11    |
| D10 | 空状态只有一张大插画     | NN/g 反例 [A](https://www.nngroup.com/articles/empty-state-interface-design/)                           | 必须给状态 + 下一步                    | P10    |
| D11 | 假精确的进度/时长        | 预估错误导致计划失败 [B](https://sspai.com/post/77123)                                                  | 5/15 分钟粒度；不显示 68% 这类值       | P2     |
| D12 | 排太满的计划             | [B](https://sspai.com/post/77123)                                                                       | 时间轴显示"空白/缓冲"，超载提示        | P12    |
| D13 | 只能在日历里改、不能撤销 | 推断（同类产品常见）                                                                                    | 所有拖拽有 `⌘Z`                        | P9     |
| D14 | 暗色对比不足/发光过强    | NN/g 暗色问题 [A](https://www.nngroup.com/articles/dark-mode-users-issues/)                             | 非文本对比 ≥ 3:1，避免纯黑+纯白        | P13    |

---

## 7. 组件化机会清单（按 使用频率 × 情绪价值 排序）

> 排序逻辑：**S** = 每天用 + 高情绪；**A** = 每周用 + 中高情绪/信任；**B** = 低频但决定完成度。
> 命名遵循现有约定：`src/component/<name>/<Pascal>.tsx` + `<Pascal>.css`，BEM（`checkbox__box`），复用 `Surface` 分层与 `--tone`。

### 7.1 S 级（先做，直接决定留存）

| #   | 组件                           | 目录建议                 | 核心交互                                                                   | Microcopy（中/英）                                                                                                  | 动效                                                                                  | 快捷键                             |
| --- | ------------------------------ | ------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------- |
| S1  | **RitualCheck / Checkbox**     | `component/input/check/` | 单击完成；长按/右键看"跳过/补记"；完成后行保留 1.2s 再淡出（或保留删除线） | 完成："已完成 · 撤销" / "Done · Undo"；跳过："今天跳过" / "Skip today"                                              | 勾选路径 140ms + 80ms 回弹；行淡出 180ms；`prefers-reduced-motion` 时只做透明度 120ms | `Space` 切换、`⌘Z` 撤销            |
| S2  | **QuickAdd**                   | `component/quickadd/`    | overlay；标题 + NL 时间 + tone；`⌘↵` 保存、`Esc` 丢弃并保留草稿 5s         | 占位："试试：明天 9 点 深度工作 90 分钟" / "Try: tomorrow 9am, deep work 90m"                                       | 淡入 + 上移 8px，200ms ease-out；关闭 160ms                                           | `N`、`⌘↵`、`Esc`                   |
| S3  | **CommandPalette**             | `component/command/`     | 搜索 + 动作面板两段式；分组（导航/创建/设置）；最近使用                    | 空结果："没有匹配。试试『新建仪式』" / "No match. Try 'new ritual'"                                                 | 打开 180ms；列表项高亮 90ms                                                           | `⌘K`、`↑↓`、`↵`、`⌘↵` 次要动作     |
| S4  | **ProgressRing / ProgressBar** | `component/progress/`    | 显示"3/5 完成"而非裸百分比；支持 label/eyebrow                             | "今日 3/5" / "3 of 5 today"                                                                                         | 数值变化 480ms ease-out；不循环发光                                                   | —                                  |
| S5  | **StreakBadge**                | `component/streak/`      | 当前/最佳/冻结次数；点击展开 freeze 说明                                   | "连续 12 天 · 最佳 34" / "12-day streak · best 34"                                                                  | hover 90ms；不抖动                                                                    | `S` 打开详情（推断）               |
| S6  | **TimelineDay**                | `component/timeline/`    | 24h 轴；块=时长；15min snap；拖拽 + 键盘 nudge；重叠并排                   | 空日："这一天是空的。拖一个仪式进来，或按 N 新建。"                                                                 | 拖拽跟手 0ms 延迟；落位 160ms                                                         | `↑↓` 15min、`⇧↑↓` 60min、`⌘Z` 撤销 |
| S7  | **EmptyState**                 | `component/empty/`       | 状态说明 + 一个主行动 + 一个示例/学习线索                                  | "这里还没有仪式。先加一件 5 分钟就能完成的小事。" / "No rituals yet. Start with something that takes five minutes." | 无动效或 120ms 淡入                                                                   | `N` 直接新建                       |
| S8  | **UndoBar**                    | `component/undo/`        | 底部浮条；5–10s 可撤销；hover 暂停计时                                     | "已删除 1 项 · 撤销" / "Deleted 1 item · Undo"                                                                      | 入 180ms / 出 140ms；倒计时细线                                                       | `⌘Z`                               |

### 7.2 A 级（决定"计划可信"与"数据安全"）

| #   | 组件                 | 目录建议                   | 核心交互                                             | 关键细节                                                                   |
| --- | -------------------- | -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| A1  | **WeekStrip**        | `component/calendar/week`  | 7 天条 + 周数 + 今日高亮；`[` `]` 翻周               | **周一为首日**；显示"第 43 周"（可选）；`T` 回今天                         |
| A2  | **CalendarMonth**    | `component/calendar/month` | 月网格 + 每日完成度点/环                             | 点击进入日视图；不做过小的点击目标（≥ 32×32）                              |
| A3  | **MonthHeatmap**     | `component/heatmap/`       | 月/年热力；hover 显示当日明细                        | 低对比度可读；不用红色表示"失败"                                           |
| A4  | **InlineEdit**       | `component/inline-edit/`   | 点标题直接编辑；`↵` 保存、`Esc` 取消                 | 中文 IME 组合期间不提交（见 §9.4）                                         |
| A5  | **BatchBar**         | `component/batch/`         | 多选后出现；显示计数；完成/移动/删除；`Esc` 退出选择 | 不常驻；批量删除必须可撤销                                                 |
| A6  | **SyncStatus**       | `component/sync/`          | 三段：已同步/同步中/离线；冲突时打开 `ConflictSheet` | 离线文案："离线中 · 更改会在恢复连接后同步"                                |
| A7  | **RecoveryPrompt**   | `component/recovery/`      | 断签时提示"补记/冻结/暂停"                           | 文案不指责："昨天是空白。要补记吗？" / "Yesterday was blank. Backfill it?" |
| A8  | **SegmentedControl** | `component/segment/`       | 日/周/月切换；记忆上次选择                           | 切换 160ms 滑块；`1/2/3` 直选（推断）                                      |
| A9  | **DragSort**         | `component/drag/`          | 拖拽排序；键盘 `⌥↑↓` 移动；拖拽时显示插入线          | 必须有按钮/键盘替代（可达性）                                              |
| A10 | **Kbd**              | `component/kbd/`           | 展示键位；`⌘`/`Ctrl` 按平台渲染                      | 等宽字体，与 `eyebrow` 同族                                                |

### 7.3 B 级（补齐完成度）

`TagInput`、`Tooltip`、`Popover`、`Menu`（对象动作）、`Sheet/Drawer`、`Tabs`（设置）、`Banner/InlineNotice`、`Skeleton`、`StatTile`、`FocusTimer`（含 `SessionRing`）、`PauseCycleAction`、`ExportAction`、`SolarTermLabel`、`LunarDateLabel`、`WeekStartPicker`、`TimeStepper`。

### 7.4 每个 S 级组件的验收细节（可直接写进 issue）

**S1 RitualCheck**

- 状态：`idle | done | skipped | missed`；`done` 必须有 `aria-checked`、`aria-live` 播报"已完成，可撤销"。
- 触控目标 ≥ 44×44（含 padding）；`Space` 与单击等价。
- 完成动效 ≤ 220ms；`prefers-reduced-motion: reduce` 时降级为 opacity。
- 每日"庆祝"（confetti/粒子）**最多 1 次**，且提供关闭；默认强度低。

**S2 QuickAdd**

- 打开到可输入 < 100ms；保存到列表出现 < 100ms（乐观 UI）；持久化失败回滚并保留草稿。
- 解析优先级：显式选择 > NL 解析 > 默认值；解析结果以 `Badge` 展示（"明天 09:00 · 90 分钟"），点击可改。
- `Esc` 行为：有内容 → 保留草稿并关闭（提示"草稿已保留"）；无内容 → 直接关闭。

**S3 CommandPalette**

- 输入 0 字符显示"最近/建议"；输入后分组；无结果给一条可执行建议。
- 动作面板：`⌘K` 打开、`↵` 主 action、`⌘↵` 次 action、`Esc` 返回上级（对齐 Raycast）[A](https://manual.raycast.com/keyboard-shortcuts)。
- 焦点陷阱 + 关闭后焦点回到触发元素。

**S6 TimelineDay**

- 像素/小时 ≥ 64px（可读性），缩放 3 档（紧凑/标准/宽松），记住选择。
- 拖拽 = 移动，拖底边 = 改时长；均有键盘替代与 `⌘Z`。
- 重叠块并排宽度 ≥ 45%，最多 3 列后折叠为 "+2"。

**S8 UndoBar**

- 5s（删除 10s）；hover/focus 暂停；`⌘Z` 与按钮等价；连续操作合并为"撤销全部"。

---

## 8. 反模式清单（这个品类被骂得最多的 UI 模式）

| #   | 反模式                      | 为什么被骂                               | 证据                                                                                                                                    | 我们应该怎么做                                                  |
| --- | --------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| P1  | **Streak 惩罚/断签清零**    | 长期积累一夜归零，直接导致弃用           | [B](https://news.ycombinator.com/item?id=33843954) / [B](https://news.ycombinator.com/item?id=33852098)                                 | freeze + 补记 + 暂停；保留"最佳"；文案不指责                    |
| P2  | **假精确**                  | "68%""预计 23 分钟"给出无法行动的精确感  | 预估错误导致计划失败 [B](https://sspai.com/post/77123)；进度条"准确与否都可容忍"但不应伪装 [A](https://lawsofux.com/doherty-threshold/) | 时间只用 5/15 分钟粒度；进度用"3/5"；未知就显示未知             |
| P3  | **模态嵌套**                | Dialog 里开 Dialog，返回键失灵、焦点丢失 | 推断（原生 `<dialog>` 叠加的常见问题）                                                                                                  | 最多一层模态；第二层用 Sheet/Popover；`Esc` 只关最上层          |
| P4  | **日历缩放不可控**          | 自动适配导致 15 分钟块不可读；缩放不记忆 | 推断（时间轴产品通病）                                                                                                                  | 3 档缩放 + 记忆；最小块高 24px，小于则聚合                      |
| P5  | **通知轰炸**                | 同一到期日连发、无法关闭                 | NN/g Wunderlist 案例 [A](https://www.nngroup.com/articles/push-notification/)                                                           | 合并、限 1–2 条/天、安静时段、按仪式开关                        |
| P6  | **功能堆叠**                | 四象限/番茄钟/打卡/时间线全塞进主界面    | [B](https://sspai.com/post/77123)                                                                                                       | 主界面只留"今天"；高级能力进 Palette/Sheet                      |
| P7  | **万物皆复选框**            | 把"和朋友吃饭"也变成任务                 | [B](https://sspai.com/post/77123)                                                                                                       | 三种对象：Commitment（无勾）/ Intention（可勾）/ Ritual（周期） |
| P8  | **完成不可撤销 / 两步跳过** | 误触无法恢复；跳过要两步                 | [B](https://news.ycombinator.com/item?id=33847147)                                                                                      | 所有状态变更 `⌘Z`；Done/Skip 双按钮或 swipe                     |
| P9  | **首次启动索权 + 强制引导** | 用户还没获得价值就被要权限               | NN/g Mistake #1 [A](https://www.nngroup.com/articles/push-notification/)                                                                | 先完成第一次仪式，再在设置里问                                  |
| P10 | **空状态说教/羞辱**         | "你还没有任何习惯" + 大插画              | NN/g 反例 [A](https://www.nngroup.com/articles/empty-state-interface-design/)                                                           | 状态 + 下一步 + 示例；语气平视                                  |
| P11 | **订阅入口侵入执行回路**    | PLUS 奖励置顶、误触                      | Forest 案例 [B](https://w.dzwww.com/p/p1nmSzd9x5.html)                                                                                  | 付费只在设置/账户；不做功能回收                                 |
| P12 | **排满计划**                | 第一天失败即放弃                         | [B](https://sspai.com/post/77123)                                                                                                       | 显示缓冲/空白；超载时提示"今天排了 9 小时"                      |
| P13 | **暗色对比不足/发光过强**   | 次级文字看不清、边框消失                 | NN/g 暗色问题 [A](https://www.nngroup.com/articles/dark-mode-users-issues/)                                                             | 文本 ≥ 4.5:1；非文本 ≥ 3:1；避免纯黑底+纯白字                   |
| P14 | **红点驱动焦虑**            | 未读数催促，制造义务感                   | 推断（通知疲劳的延伸）[A](https://www.nngroup.com/articles/push-notification/)                                                          | 用"待办数量"而非红点；可关闭角标                                |
| P15 | **只能拖拽**                | 键盘/辅助技术用户无法排序                | 推断；可达性要求                                                                                                                        | 拖拽 + 按钮 + 键盘三通道                                        |

---

## 9. 中文 / 中国用户特有需求

> 本节区分「**有据**」与「**推断**」。中文互联网的 UX 研究公开数据较少，很多结论只能标为推断。

### 9.1 周一开始 & 日期格式（有据）

- **周一开始**：ISO 8601 规定周一为一周第一天 [C](https://en.wikipedia.org/wiki/ISO_8601)；Unicode CLDR 的 `weekData` 按地区定义 `firstDay`，中国大陆为周一 [A](https://www.unicode.org/reports/tr35/tr35-dates.html#Week_Data)。
  → `WeekStrip` 默认周一开头；提供设置（周日/周一）；周数显示遵循 ISO 周编号。
- **日期格式**：中文习惯 `2026年10月20日`，紧凑场景 `10月20日 周二`；ISO `2026-10-20` 用于导出/输入解析。**推断**：中文用户对"Oct 20"式英文月份缩写有理解成本，尤其在 `eyebrow` 等宽小字里。
- **相对日期**：`明天 / 后天 / 下周一 / 月底` 应被 NL 解析（Things 已支持中文）[A](https://culturedcode.com/things/support/articles/9780167/)。

### 9.2 节气与农历（有据 + 工程约束）

- 节气定义：太阳黄经每 **15°** 一个节气，春分 0°、清明 15°…… [A](https://www.hko.gov.hk/sc/gts/time/24solarterms.htm)。
- 农历月必须含一个"中气"，无中气的月为上一个月的闰月 [A](https://www.hko.gov.hk/sc/gts/time/24solarterms.htm)；国标 GB/T 33661-2017《农历的编算和颁行》给出编算规则 [A](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=E107EA4DE9725EDF819F33C60A44B296)。
- **工程含义**：节气不能写死公历日期（每年差 1 天），应按时区（UTC+8）用天文算法或权威年表；跨年/闰月要有测试用例。
- **产品含义（推断）**：把"节气"作为 `Cycles` 的自然分界（如"霜降 · 第 18 个节气"），比"第 43 周"更有中文语境的情绪价值；但**不要**把节气做成伪科学建议（"霜降宜早睡"这类）。

### 9.3 中文排版（有据）

W3C《中文排版需求》（clreq）要点 [A](https://www.w3.org/TR/clreq/)：

- 汉字与标点是 **1:1 方形**，无缝隙排列；
- 中西文混排时，汉字与西文/阿拉伯数字之间加 **不超过 1/4 汉字宽**的间距；
- 行首行尾禁则（标点不能出现在行首等）；
- 标点位置存在**地区差异**（中国大陆 vs 港台），应按"区域"而非"繁简"处理。

**对本库**：

- `Text` 组件需要 `lang="zh-CN"` 下的 `line-height: 1.7` 左右（推断值，需真机校准）；
- 等宽 `eyebrow` 中混中文时，字距要重置（`letter-spacing: 0`），否则汉字会被拉散；
- 数字/日期在中文标题中避免使用过窄的西文字体（`font-variant-numeric: tabular-nums` 用于计时）。

### 9.4 输入法（IME）与快捷键冲突（有据的工程约束）

- 中文输入依赖组合事件（`compositionstart/update/end`）；组合期间按 `Enter` 是"上屏"而非"提交" [A](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionend_event)。
- **验收**：`QuickAdd`、`InlineEdit`、`CommandPalette` 在 `isComposing` 为真时不触发提交/快捷键/校验；否则中文用户会频繁误提交（**推断**：这是中文场景最常见的"看起来能用、用起来想砸键盘"的问题）。

### 9.5 微信生态（部分有据，部分推断）

- 有据：中文市场存在以"社群打卡"为核心的产品（小打卡，定位"社群互动学习平台"）[B](https://sj.qq.com/appdetail/com.zhuihuodong.xiaodaka)。
- **推断**：分享到微信/群、订阅消息提醒、小程序入口是中文习惯类产品的常见增长路径；但 Periodicity 是本地优先的个人工具，**不建议**把微信登录作为前置。
- 设计建议（推断）：只做"导出分享卡片"（图片），不做通讯录/群排行榜；分享内容默认不含具体习惯名。

### 9.6 付费心理（有据）

Forest 案例：买断 12–68 元 → Plus 155 元/年；用户感到"二等用户"，因为"金币可购买的树种不再更新""PLUS 奖励置顶误触" [B](https://w.dzwww.com/p/p1nmSzd9x5.html)。
**含义**：中文用户对"买断转订阅"高度敏感；若做商业化，**老功能永久保留 + 新功能订阅**是底线；不要把升级入口放进任务列表。

### 9.7 本节推断汇总

| 推断                       | 依据                         | 验证方式                          |
| -------------------------- | ---------------------------- | --------------------------------- |
| 中文用户更接受"周一开始"   | CLDR/ISO 标准 + 中文日历习惯 | 5 人可用性测试，观察周条首日困惑  |
| 节气是情绪价值而非功能价值 | 主题相关性 + 中文内容生态    | 上线后看 `SolarTermLabel` 点击率  |
| IME 误提交是高频挫败点     | 组合事件机制                 | 中文用户 5 人测试，记录误提交次数 |
| 微信分享是增长路径但非核心 | 小打卡等产品形态             | 分享卡片使用率                    |

---

## 10. 对这个库的 10 条用户导向原则（可验收）

> 每条都给出**验收方法**，可直接作为 PR checklist。

1. **捕获 ≤ 2 次按键，反馈 ≤ 100ms**
   验收：任意页面按 `N` 或 `⌘K` → 输入标题 → `⌘↵`，列表在 100ms 内出现新条目（乐观 UI）；P95 端到端 < 400ms（Doherty）[A](https://lawsofux.com/doherty-threshold/)。

2. **一切状态变更都可撤销 ≥ 5s**
   验收：完成/删除/拖拽/批量操作后出现 `UndoBar`；`⌘Z` 与按钮等价；刷新页面后撤销栈不要求持久（推断：会话内即可）。

3. **默认零决策**
   验收：首屏不需要选择项目/视图/筛选即可开始；首屏可交互控件 ≤ 12 个；新增功能不得增加首屏控件数（只能进 Palette/Sheet）。

4. **状态永远可见**
   验收：保存中/已保存/离线/冲突/计时中 5 种状态都有对应 UI；离线时顶部有 `SyncStatus`，且不阻塞编辑。

5. **时间是刻度，不是假精确**
   验收：代码中不存在非 5 分钟倍数的时长展示（除非来自实测数据）；进度用"3/5"与"剩余"表达；`68%` 这类值仅用于真实计算且带上下文。

6. **连续性是叙事，不是惩罚**
   验收：断签不清零"最佳"；提供 freeze/补记/暂停；断签文案不含"失败/落后/可惜"等词；`aria-live` 播报中性。

7. **键盘、触控、读屏三通道等价**
   验收：所有拖拽有按钮/键盘替代；`Tab` 顺序与视觉顺序一致；完成状态有 `aria-checked` + `aria-live`；axe 扫描 0 critical。

8. **暗色默认，但不唯一；动效可关**
   验收：暗/亮主题均通过 4.5:1（文本）与 3:1（非文本）；`prefers-reduced-motion` 下所有动效降级为透明度/无；庆祝动画可关闭。

9. **空状态是教学，不是装饰**
   验收：每个列表/日历/图表都有 `EmptyState`，包含"当前状态 + 一个主行动 + 一个示例"；文案不出现"你还没有…"式指责（NN/g）[A](https://www.nngroup.com/articles/empty-state-interface-design/)。

10. **中文优先（不是翻译优先）**
    验收：周一开始、`YYYY年M月D日`、中文 NL 解析、IME 组合期不提交、节气按黄经计算；`lang="zh-CN"` 下排版通过人工走查（clreq）[A](https://www.w3.org/TR/clreq/)。

---

## 附录 A：证据清单（按主题）

### A.1 用户原声（Hacker News / 少数派 / 新闻）

- Ask HN: What do you want in a habit tracker? — https://news.ycombinator.com/item?id=33842599
- 用户原声：streak freeze 必要 — https://news.ycombinator.com/item?id=33843954
- 用户原声：手动输入太累/隐私/分析 — https://news.ycombinator.com/item?id=33842724
- 用户原声：同步、负向习惯、自动化 — https://news.ycombinator.com/item?id=33844205
- 用户原声：两步跳过太麻烦，想要 swipe/Done-Skip — https://news.ycombinator.com/item?id=33847147
- 用户原声：widget 展示 streak — https://news.ycombinator.com/item?id=33846888
- 用户原声：本地 + CSV + 无追踪 — https://news.ycombinator.com/item?id=33845360
- 用户原声：断签"crushing" — https://news.ycombinator.com/item?id=33852098
- Show HN：离线、freeze、可暂停 — https://news.ycombinator.com/item?id=40893866
- 少数派：滴答清单 4 件事（含"叮"声、专注关联任务）— https://sspai.com/post/91132
- 少数派：日程与待办分离（含功能臃肿批评）— https://sspai.com/post/77123
- 红星新闻/海报新闻：Forest 买断转订阅争议 — https://w.dzwww.com/p/p1nmSzd9x5.html

### A.2 产品与官方文档

- Things Quick Entry — https://culturedcode.com/things/support/articles/2249437/
- Things 自然语言输入（含中文）— https://culturedcode.com/things/support/articles/9780167/
- Things 键盘快捷键 — https://culturedcode.com/things/support/articles/2785159/
- Todoist Quick Add — https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz
- Todoist 自定义 Quick Add — https://www.todoist.com/help/todoist/features/customize-quick-add-in-todoist-eqRRlZJNN
- Todoist Smart date 开关 — https://www.todoist.com/help/todoist/features/turn-smart-date-recognition-on-or-off-63WfIr
- Raycast 键盘快捷键 — https://manual.raycast.com/keyboard-shortcuts
- Raycast 命令别名/热键 — https://manual.raycast.com/command-aliases-and-hotkeys
- Structured 官网（时间轴/周月视图）— https://structured.app/
- Linear Method — https://linear.app/method
- Forest 官网 — https://www.forestapp.cc/
- TickTick 官网 — https://ticktick.com/
- Notion Calendar — https://www.notion.com/product/calendar
- Obsidian — https://obsidian.md/
- Superhuman — https://superhuman.com/
- Amie — https://www.amie.so/
- Rise — https://www.risecalendar.com/
- Reclaim — https://reclaim.ai/
- Microsoft 收购 Sunrise 官方公告 — https://blogs.microsoft.com/blog/2015/02/11/microsoft-acquires-sunrise-creator-innovative-calendar-app-mobile-devices/

### A.3 研究与标准

- NN/g 响应时间限制 — https://www.nngroup.com/articles/response-times-3-important-limits/
- NN/g 暗色模式用户认知 — https://www.nngroup.com/articles/dark-mode-users-issues/
- NN/g 暗色 vs 亮色 — https://www.nngroup.com/articles/dark-mode/
- NN/g 空状态三指南 — https://www.nngroup.com/articles/empty-state-interface-design/
- NN/g 推送五错误 — https://www.nngroup.com/articles/push-notification/
- NN/g 十条可用性启发式 — https://www.nngroup.com/articles/ten-usability-heuristics/
- Laws of UX：Hick — https://lawsofux.com/hicks-law/
- Laws of UX：Choice Overload — https://lawsofux.com/choice-overload/
- Laws of UX：Doherty Threshold — https://lawsofux.com/doherty-threshold/
- Laws of UX：Goal-Gradient — https://lawsofux.com/goal-gradient-effect/
- Kivetz et al. 目标梯度论文 — http://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf
- Duolingo streak 产品访谈整理 — https://lennydistilled.com/episodes/behind-the-product-duolingo-streaks/
- Duolingo 习惯形成机制案例研究（DOAJ）— https://doaj.org/article/d24e292737844124a6719a323f6f738b
- Duolingo 留存与前景理论分析 — https://zenodo.org/records/11528881
- 社交 streak 焦虑研究综述 — https://hiwavemakers.com/blog/snap-streaks-digital-anxiety-teen-research/
- Baymard：Autocomplete 设计研究 — https://baymard.com/research-articles/autocomplete-design
- Ink & Switch：Local-first software — https://www.inkandswitch.com/local-first/
- Google PAIR Guidebook — https://pair.withgoogle.com/guidebook/
- W3C 中文排版需求（clreq）— https://www.w3.org/TR/clreq/
- 香港天文台：二十四节气 — https://www.hko.gov.hk/sc/gts/time/24solarterms.htm
- GB/T 33661-2017 农历的编算和颁行 — https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=E107EA4DE9725EDF819F33C60A44B296
- Unicode CLDR week data — https://www.unicode.org/reports/tr35/tr35-dates.html#Week_Data
- ISO 8601（周一为首日）— https://en.wikipedia.org/wiki/ISO_8601
- MDN prefers-reduced-motion — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- MDN compositionend（IME）— https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionend_event
- 小打卡（社群打卡产品）— https://sj.qq.com/appdetail/com.zhuihuodong.xiaodaka

## 附录 B：未能获取的来源（透明记录）

| 目标                                        | 结果                   | 替代                                      |
| ------------------------------------------- | ---------------------- | ----------------------------------------- |
| Reddit r/productivity、r/ADHD、r/selfhosted | 连接失败（多次）       | HN、少数派、新闻报道                      |
| Trustpilot 评论                             | 403 人机校验           | 新闻报道中的用户引述                      |
| App Store / Play Store 评论正文             | 页面不渲染评论         | 产品官网 + 第三方讨论                     |
| G2 / Capterra                               | 未尝试（同类风控预期） | 官方文档 + 学术/媒体                      |
| Ink & Switch 正文                           | 抓取返回空（JS 渲染）  | 仅引用概念 URL，不引用具体数字            |
| CLDR first-day 图表页                       | 404                    | 引用 TR35 规范章节                        |
| Wikipedia                                   | 网络不可达             | 改用官方公告（如 Microsoft 收购 Sunrise） |

## 附录 C：命名与目录建议（与现状对齐）

```
src/component/
├── input/check/Check.tsx          # S1
├── quickadd/QuickAdd.tsx          # S2
├── command/CommandPalette.tsx     # S3
├── progress/ProgressBar.tsx       # S4
├── streak/StreakBadge.tsx         # S5
├── timeline/TimelineDay.tsx       # S6
├── empty/EmptyState.tsx           # S7
├── undo/UndoBar.tsx               # S8
├── calendar/{WeekStrip,CalendarMonth}.tsx
├── heatmap/MonthHeatmap.tsx
├── inline-edit/InlineEdit.tsx
├── batch/BatchBar.tsx
├── sync/SyncStatus.tsx
├── recovery/RecoveryPrompt.tsx
├── segment/SegmentedControl.tsx
├── drag/DragSort.tsx
├── kbd/Kbd.tsx
└── solar-term/SolarTermLabel.tsx
```

约定：

- 每个组件一个目录，`PascalCase.tsx` + 同名 `.css`；
- 类名 BEM：`block__element--modifier`（对齐现有 `button__control`、`field__label`）；
- 颜色只用语义 token（`index.css` 与 `foundation/tokens.css` 中的 `--accent/--mint/--violet/--amber/--danger`），不新增 hex；
- 复用 `Surface` 的 background/foreground 分层与 `ripple`，不重写阴影/圆角；
- Overlay / 浮层优先复用 `foundation`：`Portal` + `useFocusTrap` + `useDismiss` + `useAnchoredPosition`；列表键盘导航用 `useRovingTabIndex`；表单字段用 `Field`；
- tone 统一为 `lime | mint | violet | amber`（与 `RitualTone`、`Badge` 一致）。

---

### 最后一句

这个品类的用户不是在找"更多功能"，而是在找**一个不会让自己更累的系统**：能快速放进去、能一眼看见、能放心勾掉、能在断掉时被温柔接住。组件库的每一件，都应该服务这四件事之一；否则它只是新的负担。
