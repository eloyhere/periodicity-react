# Periodicity React

面向产品界面、管理后台和数据密集型应用的 Material 风格 React 组件库。

`periodicity-react` 提供 130 个带 `Periodicity` 前缀的组件，覆盖表单、选择器、浮层、导航、集合视图、消息会话、文件工具，以及把它们连接起来的设计系统 Provider。API 以 TypeScript 为先、以 Flex 布局为基础，并尽量贴近浏览器原生行为：在合理的地方透传原生属性、事件、ARIA 和 `ref`。

- **npm：** [`periodicity-react`](https://www.npmjs.com/package/periodicity-react)
- **版本：** `0.1.0`
- **源码：** [github.com/eloyhere/periodicity-react](https://github.com/eloyhere/periodicity-react)
- **要求：** React 19、React DOM 19、现代浏览器
- **许可证：** Apache 2.0

## 设计理念

Periodicity 遵循五条规则：

- **语义优先于装饰。** 组件只消费 `--colourPrimary`、`--surface`、`--state-hover-opacity` 等主题 token，不硬编码某套品牌色，因此切换主题或色盲配色时，所有组件会一起变化。
- **Flex 优先布局。** 组件使用 flexbox 组合，不依赖 CSS Grid，可以安全嵌入宿主布局、虚拟列表和滚动容器。
- **原生行为优先。** 表单仍可提交，链接仍可导航，输入仍走浏览器校验，对话框仍管理焦点，`ref` 指向真实 DOM；ARIA 和 data 属性是在原生语义上的增强。
- **可组合的表面。** `Surface`、`StateLayer`、`Ripple`、`Icon`、`Text` 和布局原语是共享积木，高层组件保持轻量，并可通过 token 定制。
- **默认可访问、可国际化。** 焦点环、键盘路径、减少动效、经过对比度审计的配色，以及 12 个内置语言包都属于公共 API，而不是事后补丁。

## 功能地图

| 功能       | 组件                                                                                                                                | 适用场景                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 基础       | `Theme`、`International`、`Surface`、`StateLayer`、`Ripple`、`Text`、`Icon`、`LinearLayout`、`Inline`、`Stack`、`Divider`、`Spacer` | design token、排版、表面与组合。 |
| 输入       | `Button`、`TextInput`、`TextArea`、`Select`、`Checkbox`、`Switch`、`Range`、`NumberInput`、各种 Picker、`Calendar`                  | 表单、筛选和参数编辑。           |
| 数据       | `List`、`Table`、`Tree`、`Pagination`、`Scrollbar`、`Badge`、`Tag`、`Chip`、`Avatar`                                                | 密集记录、虚拟集合和身份展示。   |
| 布局       | `Coordinator`、`AppBar`、`Collapse`、`Toolbar`、`Drawer`、`DrawerLayout`、`Tabs`、`Accordion`                                       | 应用壳、导航和响应式面板。       |
| 浮层       | `Dialog`、`ConfirmDialog`、`InputDialog`、`MessageDialog`、`Dropdown`、`Menu`、`Tooltip`、`Toast`、`Snackbar`                       | 临时反馈、菜单和模态任务。       |
| 文件与消息 | `Editor`、`Preview`、`ProjectManager`、`Chat`、`VirtualChat`、`Contact`、`MessageList`                                              | 代码、项目结构、会话和联系人。   |
| 辅助       | `Link`、`Anchor`、`Progress`、`Skeleton`、`EmptyState`、`Kbd`、`VisuallyHidden`                                                     | 小型可复用交互元素。             |

## 目录

- [设计理念](#设计理念)
- [功能地图](#功能地图)
- [安装](#安装)
- [快速开始](#快速开始)
- [按功能划分的组件](#按功能划分的组件)
- [组件命名](#组件命名)
- [表单与选择器](#表单与选择器)
- [集合与数据](#集合与数据)
- [浮层与反馈](#浮层与反馈)
- [导航与布局](#导航与布局)
- [消息与联系人](#消息与联系人)
- [文件与预览](#文件与预览)
- [主题](#主题)
- [国际化](#国际化)
- [动效](#动效)
- [可访问性](#可访问性)
- [开发](#开发)
- [验证](#验证)
- [更新日志](#更新日志)

## 安装

```bash
npm install periodicity-react
```

`react` 和 `react-dom` 是 peer dependencies。宿主应用需要安装 React 19。

在应用入口引入一次组件样式：

```tsx
import "periodicity-react/styles.css";
```

包内提供 ES Module、TypeScript 声明文件和提取后的样式表，适用于 Vite、Next.js、webpack 等构建工具。

## 快速开始

```tsx
import { useState } from "react";
import { PeriodicityButton, PeriodicityTextInput } from "periodicity-react";
import "periodicity-react/styles.css";

export function SignIn() {
    const [email, setEmail] = useState("");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 360 }}>
            <PeriodicityTextInput
                label="邮箱"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
            />
            <PeriodicityButton onClick={() => console.log(email)}>继续</PeriodicityButton>
        </div>
    );
}
```

需要全局主题或语言切换时，在应用外层包住 Provider：

```tsx
<PeriodicityTheme theme="accessible">
    <PeriodicityInternational locale="ja-JP">{app}</PeriodicityInternational>
</PeriodicityTheme>
```

## 按功能划分的组件

- **基础与 token：** `Theme`、`International`、`Surface`、`StateLayer`、`Ripple`、`Text`、`Icon`、`LinearLayout`、`Inline`、`Stack`、`Divider`、`Spacer`、`VisuallyHidden`。
- **输入与选择器：** `Button`、`TextInput`、`TextArea`、`Select`、`VirtualSelect`、`Checkbox`、`Switch`、`Range`、`NumberInput`、`ColourPicker`、`TimePicker`、`DateTimePicker`、`NumberPicker`、`CyclePicker`、`VariantPicker`、`Calendar`。
- **数据与身份：** `List`、`VirtualList`、`Table`、`VirtualTable`、`Tree`、`VirtualTree`、`Pagination`、`Scrollbar`、`Badge`、`Tag`、`Chip`、`Avatar`、`AvatarGroup`。
- **导航与布局：** `Coordinator`、`AppBar`、`Collapse`、`Toolbar`、`Drawer`、`DrawerLayout`、`Tabs`、`Accordion`。
- **浮层与反馈：** `Dialog`、`ConfirmDialog`、`InputDialog`、`MessageDialog`、`Dropdown`、`Menu`、`Tooltip`、`Toast`、`Snackbar`、`Progress`、`Skeleton`、`EmptyState`。
- **文件与消息：** `Editor`、`Preview`、`ProjectManager`、`Chat`、`VirtualChat`、`Contact`、`VirtualContact`、`MessageList`、`VirtualMessageList`。
- **辅助：** `Link`、`Anchor`、`Kbd`、`Badge`、`Divider`、`VisuallyHidden`。

## 组件命名

每个公共组件只导出带 `Periodicity` 前缀的名称：

```tsx
import { PeriodicityButton, PeriodicityDialog, PeriodicityTable, PeriodicityTextInput } from "periodicity-react";
```

不再导出不带前缀的兼容别名。统一使用带前缀的名称，以明确组件边界并避免与宿主应用组件重名。

```tsx
import { PeriodicityTable } from "periodicity-react";
```

### 动态图标

`PeriodicityIcon` 增加了十个动态图标，用于加载与活动反馈：

```tsx
<PeriodicityIcon name="Spinner" size={24} />
<PeriodicityIcon name="LoadingDots" size={24} />
<PeriodicityIcon name="Pulse" size={24} />
<PeriodicityIcon name="Orbit" size={24} />
<PeriodicityIcon name="Bars" size={24} />
<PeriodicityIcon name="Wave" size={24} />
<PeriodicityIcon name="Radar" size={24} />
<PeriodicityIcon name="Breathe" size={24} />
<PeriodicityIcon name="Sync" size={24} />
<PeriodicityIcon name="BellRing" size={24} />
```

`Spinner` 是安卓风格的转圈图标，旋转时缺口大小会动态变化。所有动态图标都尊重 `prefers-reduced-motion`。`Agent` 组是静态 AI 厂商图标；`Motion` 和 `Live` 使用 CSS 动画；专门新增的 `Dynamic` 组把 SMIL 动画写在 SVG 内部：`DynamicRotateRight`、`DynamicRotateLeft`、`DynamicThrob`、`DynamicBounceBall`、`DynamicFlipCard`、`DynamicMorphing`、`DynamicLoad`、`DynamicSatellite`、`DynamicBlink`、`DynamicRipple`、`DynamicPulse`、`DynamicTyping`、`DynamicWave`、`DynamicScan`、`DynamicOrbit`、`DynamicBreathe`、`DynamicShake`。新增 `Programming` 编程分组（Java、Python、JavaScript、TypeScript、C、C++、C#、PHP、Kotlin、Rust、Go、Swift、Ruby、Dart、Scala、Perl、Lua、Bash、HTML、CSS、SQL、npm、Maven、JSON 等）、`Computer` 分组（终端、服务器、数据库、代码、芯片、网络、存储等）和 `Electronics` 分组（电阻、电容、二极管、晶体管、PCB、示波器、万用表、电位器、热敏电阻、MOSFET、桥式整流、高压危险、触电警示等）。`Math` 分类新增 `Equal`、`NotEqual`、`LessThan`、`GreaterThan`、`Sum`、`Pi`、`Infinity`、`SquareRoot`、`Fraction`、`Percent`、`Integral`、`Function`、`Matrix`、`Angle`、`Delta`、`Partial`、`Nabla`、`Product`、`Factorial`、`Union`、`Intersection`、`ElementOf`、`NotElementOf`、`Subset`、`ForAll`、`Exists`、`PlusMinus`、`Approximately`、`Degree`、`Proportional`、`Therefore`、`Because`、`Vector`、`Coordinate`、`Integer`、`Negative`、`Absolute`、`Rational`、`Irrational`、`Real`、`Imaginary`、`Quaternion`、`Natural`、`Complex`、`Even`、`Odd`、`Positive`。新增独立的 `Animal` 和 `Plant` 分组，每组 30 个图标。现在每个分组都至少有 30 个图标；`Motion`、`Live`、`Dynamic` 还包含额外的动效和状态变体。

## 表单与选择器

表单组件支持原生 input 属性，并透传事件、`ref`、`aria-*` 和 `data-*` 属性。

Button 使用 `prefix`、`content`、`suffix` 三个内容自适应 flex 插槽。`prefix`/`suffix` 传入字符串时按图标名渲染；
只有一个图标时居中，两个图标等宽，内容自然增长，不会把按钮撑满父容器。

文本输入框使用六个插槽：`prefix`、浮动 `hint`、`message`、`limitation`、`error`、`suffix`。`hint` 是不接收
指针事件的占位文本，未聚焦时垂直居中，聚焦或有内容时动画缩小并移到左上角；`message` 会被 `error` 替换；
`limitation` 位于 suffix 下方，显示当前/最小/最大字符数。输入框与按钮都支持悬浮和点击 ripple。聚焦时，边框以
鼠标位置为圆心（键盘聚焦时用文本光标，空输入框用字段中心）做径向波纹展示：最近的边先出现，每条边从鼠标在该边
上的投影点向两端生长，整体使用 1 秒的先快后慢缓动。

```tsx
<PeriodicityButton prefix="Plus" content="添加" suffix="ArrowRight" />
<PeriodicityButton prefix="Plus" aria-label="添加" />
<PeriodicityButton prefix="Plus" suffix="ArrowRight" aria-label="拆分" />
```

```tsx
import {
    PeriodicityCheckbox,
    PeriodicityNumberInput,
    PeriodicityRange,
    PeriodicitySelect,
    PeriodicitySwitch,
    PeriodicityTextArea,
} from "periodicity-react";

<PeriodicityTextArea label="备注" rows={4} maxLength={500} />
<PeriodicityCheckbox label="订阅" defaultChecked />
<PeriodicitySwitch label="启用" defaultChecked onChange={() => {}} />
<PeriodicityRange label="音量" min={0} max={100} defaultValue={60} onChange={() => {}} />
<PeriodicityNumberInput label="数量" min={1} max={99} defaultValue={1} />
<PeriodicitySelect label="团队" options={teams} onChange={(value) => console.log(value)} />
```

选择器组件包括：

- `PeriodicityColourPicker`
- `PeriodicityTimePicker`
- `PeriodicityDateTimePicker`
- `PeriodicityNumberPicker`
- `PeriodicityCyclePicker`
- `PeriodicityVariantPicker`

### 颜色选择器

`PeriodicityColourPicker` 组合原生颜色输入、可见的十六进制值和一排预设色块。原生输入保留系统取色器和键盘行为；
标签、提示、错误、禁用和只读状态复用统一的 PickerField。

```tsx
import { PeriodicityColourPicker } from "periodicity-react";

<PeriodicityColourPicker label="品牌色" defaultValue="#1976d2" showValue onChange={(value) => console.log(value)} />;
```

值使用 CSS 十六进制颜色。传入 `value` 即受控，使用 `defaultValue` 即非受控。预设色块带有 `aria-pressed`，
在 `readOnly` 或 `disabled` 时不可交互。

### 日历

`PeriodicityCalendar` 是支持 locale 的月历网格，使用单一 roving tab stop。值格式为 ISO `YYYY-MM-DD`；传入 `value` 为受控，使用 `defaultValue` 为非受控。

```tsx
import { PeriodicityCalendar } from "periodicity-react";

<PeriodicityCalendar
    label="交付日期"
    value={date}
    onChange={setDate}
    min="2026-01-01"
    max="2026-12-31"
    firstDayOfWeek={1}
    slots={{
        body: ({ day }) => <span>{day % 2 === 0 ? "偶数" : "奇数"}</span>,
    }}
/>;
```

每个日期 cell 有 `slots.header`、`slots.body`、`slots.footer` 三行；header 默认显示日期数字。键盘：方向键按天/周移动，Home/End 到本周首尾，PageUp/PageDown 切换月份，Shift+PageUp/PageDown 切换年份，Enter 或 Space 选择。`showAdjacentDays`、`weekdayLabels`、`monthLabels`、`slots`、`renderDay`、`disabled` 和 `readOnly` 可用于定制。

大部分表单和选择器支持受控/非受控值、`disabled`、适当的 `readOnly`，以及调用方与内部事件处理器的组合。`PeriodicityMention` 提供异步建议列表和 Token 化 Chip；加载器由调用方提供，并与其它输入框共用 `prefix`、`hint`、`message`、`limitation`、`error`、`suffix` 六个插槽。

## 集合与数据

集合可以使用普通数组或 Adapter，并支持可选的固定行高虚拟化。

```tsx
import { PeriodicityList, PeriodicityTable, PeriodicityTree } from "periodicity-react";

<PeriodicityList
    items={people}
    getKey={(person) => person.id}
    selectionMode="single"
    renderItem={(person) => `${person.firstName} ${person.lastName}`}
/>

<PeriodicityTable
    columns={[
        { id: "name", header: "姓名", cell: (person) => person.name },
        { id: "role", header: "角色", cell: (person) => person.role },
    ]}
    rows={people}
    rowKey={(person) => person.id}
    caption="团队成员"
/>

<PeriodicityTree
    items={nodes}
    getKey={(node) => node.id}
    renderItem={(node) => node.label}
/>
```

集合组件包括 `List`、`Tree`、`Table`、`Select`、`Combobox`、`Transfer` 和 `WaterfallLayout`。使用 `virtual`、`height` 和 `itemHeight` / `rowHeight` 开启固定行虚拟化。选择、展开、加载、空状态和禁用状态在各集合中保持一致。

## 浮层与反馈

```tsx
import {
    PeriodicityAlert,
    PeriodicityDialog,
    PeriodicityToastProvider,
} from "periodicity-react";

<PeriodicityAlert tone="success" title="已保存">
    你的修改已经更新。
</PeriodicityAlert>

<PeriodicityDialog open={open} title="删除项目" onClose={() => setOpen(false)}>
    此操作无法撤销。
</PeriodicityDialog>

<PeriodicityToastProvider>
    <App />
</PeriodicityToastProvider>
```

浮层组件覆盖 Dialog、Confirm/Message/Input Dialog、Drawer 与 DrawerLayout、ContextMenu、Dropdown、Popover、Tooltip、Snackbar、Toast、Alert、Banner、Backdrop，以及全屏/局部 Loading。支持受控/非受控打开状态、关闭原因、Escape 处理、焦点恢复和原生面板属性。

## 导航与布局

导航组件：

- `PeriodicityNavigationView`
- `PeriodicityTabs` 与 `PeriodicityTabPanel`
- `PeriodicityPager`
- `PeriodicityMenu`、`PeriodicityMenuItem`、`PeriodicityMenuGroup`、`PeriodicityMenuSeparator`
- `PeriodicityStepper`

布局以 Flex 为基础，不使用 CSS Grid。结构组件包括：

- `PeriodicityGridLayout`
- `PeriodicityLinearLayout` 与 `PeriodicityLinearLayoutItem`
- `PeriodicityConstraintLayout` 与 `PeriodicityConstraint`
- `PeriodicityWaterfallLayout`
- `PeriodicityDrawerLayout`
- `PeriodicityCoordinator`
- `PeriodicityAppBar`
- `PeriodicityCollapse`
- `PeriodicityToolbar`
- `PeriodicityScrollbar`
- `PeriodicityDrag`

`PeriodicityCoordinator` 有三个插槽：`collapse`、`header` 和 `main`。`collapse` 从 `collapseHeight` 开始，随着 `main` 滚动收缩到 0 高度；`header` 是固定 AppBar；`main` 是滚动主内容。当 `main` 无法滚动时，没有被子元素消费的垂直滚轮输入会收缩或恢复折叠区域，而不是滚动页面；嵌套滚动容器优先消费滚轮。

```tsx
<PeriodicityCoordinator
    height={520}
    collapseHeight={200}
    collapse={<HeroImage />}
    header={
        <PeriodicityAppBar expandedHeight={64} collapsedHeight={64} scrollBehaviour="none" liftOnScroll={false}>
            <PeriodicityToolbar
                title="Field notes"
                subtitle="Autumn expedition"
                navigationIcon="←"
                actions={
                    <PeriodicityButton size="sm" variant="outline">
                        Share
                    </PeriodicityButton>
                }
            />
        </PeriodicityAppBar>
    }
    main={<Notes />}
/>
```

`PeriodicityToolbar` 也支持 `prefix`、`content`、`suffix` 三个插槽：三个插槽按 1:1:1 分享整行；
只有一个插槽时占满整行，两个时按 1:1 排布。`prefix` 和 `suffix` 传入字符串时会按图标名渲染。

```tsx
<PeriodicityToolbar prefix="Menu" content="探索" suffix="More" />
```

`PeriodicityCollapse` 仍可用于旧式 AppBar 内部的 Hero 组合。

`PeriodicityDrag` 对单一插槽容器的直接子元素排序，并在拖动时显示跟随指针的 Ghost。

## 消息与联系人

```tsx
import {
    PeriodicityChat,
    PeriodicityCommentThread,
    PeriodicityContact,
    PeriodicityMessageList,
    PeriodicityVirtualCommentThread,
} from "periodicity-react";
```

`PeriodicityContact` 支持搜索、虚拟化、选择和联系人菜单。`PeriodicityMessageList` 支持消息选择、复制、引用、转发、删除、撤回、重试和消息菜单。`PeriodicityChat` 组合联系人列表、会话、输入框和消息操作。`PeriodicityCommentThread` 支持回复、Mention、引用、解决和删除。两个评论组件都支持 `comment` slot 整项渲染；联系人、消息和聊天组件提供 `contact`、`context`、`message`、`messageContext`、`avatar` slot，参数为渲染索引与对应数据项。

## 文件与预览

```tsx
import { PeriodicityEditor, PeriodicityPreview, PeriodicityProjectManager } from "periodicity-react";
```

- `PeriodicityPreview` 将 Markdown 和 HTML 渲染为 HTML，将文章文件渲染为文章，并将代码文件显示为函数、类、方法、属性、变量、类型和接口的结构树。
- `PeriodicityEditor` 封装 CodeMirror 6，提供语法高亮、行号、历史、搜索、括号匹配、折叠、只读、换行和 Tab 宽度控制。
- `PeriodicityProjectManager` 组合项目树、预览/编辑模式、导入导出，以及文件保存/修改回调。

编辑器不包含代码补全。需要补全时，请接入 LSP 或专用编辑器扩展。

## 主题

使用 `PeriodicityTheme` 包裹应用，并通过 `theme` 选择全局预设：

```tsx
import { PeriodicityTheme } from "periodicity-react";

<PeriodicityTheme theme="milk">
    <App />
</PeriodicityTheme>;
```

`theme` 为受控值，`defaultTheme` 为非受控初始值，`onThemeChange` 监听切换，`useTheme().setTheme(id)` 可在运行时切换。不传 `theme` 时保持现有 `mode` 行为；显式 `mode` 会覆盖预设的明暗模式，显式 `tokens` 会覆盖预设 Token。

| 预设              | 中文         | English                | 模式  |
| ----------------- | ------------ | ---------------------- | ----- |
| `accessible`      | 高对比度     | High contrast          | light |
| `accessible-dark` | 高对比度夜间 | High contrast dark     | dark  |
| `protanopia`      | 红色盲友好   | Protanopia friendly    | light |
| `deuteranopia`    | 绿色盲友好   | Deuteranopia friendly  | light |
| `tritanopia`      | 蓝色盲友好   | Tritanopia friendly    | light |
| `achromatopsia`   | 全色盲友好   | Achromatopsia friendly | light |
| `default`         | 默认         | Default                | light |
| `dark`            | 夜间         | Dark                   | dark  |
| `milk`            | 牛奶白       | Milk white             | light |
| `space-gray`      | 深空灰       | Space grey             | dark  |
| `gray`            | 灰色         | Grey                   | dark  |
| `light-gray`      | 浅灰色       | Light grey             | light |
| `sky-blue`        | 天蓝色       | Sky blue               | light |
| `pale-blue`       | 淡蓝色       | Pale blue              | light |
| `deep-blue`       | 深蓝色       | Deep blue              | dark  |
| `orange`          | 橙色         | Orange                 | light |
| `yellow`          | 黄色         | Yellow                 | light |
| `lemon`           | 柠檬黄       | Lemon yellow           | light |
| `red`             | 红色         | Red                    | light |
| `rose`            | 玫瑰红       | Rose red               | light |
| `green`           | 绿色         | Green                  | light |
| `deep-green`      | 深绿色       | Deep green             | dark  |
| `light-green`     | 浅绿色       | Light green            | light |

同时导出 `themePresets`、`getThemePreset(id)` 和 `ThemePresetId`。`accessible` 提高文字、边框、焦点和禁用状态对比度；`prefers-contrast` 和 `forced-colors` 媒体查询提供系统级补充。

## 国际化

```tsx
import { PeriodicityInternational } from "periodicity-react";

<PeriodicityInternational locale="zh-CN">
    <App />
</PeriodicityInternational>;
```

内置 locale：

| Locale  | 语言             |
| ------- | ---------------- |
| `en-GB` | 英式英语         |
| `en-US` | 美式英语         |
| `zh-CN` | 中国大陆简体中文 |
| `zh-SG` | 新加坡简体中文   |
| `zh-HK` | 香港繁体中文     |
| `zh-TW` | 台湾繁体中文     |
| `ja-JP` | 日本语           |
| `ko-KR` | 韩国语           |
| `es-ES` | 西班牙-西班牙语  |
| `es-MX` | 墨西哥-西班牙语  |
| `pt-PT` | 葡萄牙-葡萄牙语  |
| `pt-BR` | 巴西-葡萄牙语    |

同时导出 `localeOptions`、`builtInMessages`、`resolveLocaleMessages` 和 `useInternational()`。内置词典覆盖常用操作、状态、导航、选择和相对日期；调用方消息会深度合并并优先，缺失 key 回退到 `en-GB`，也接受自定义 locale 标签。`t("save")` 读取文案，`formatNumber` / `formatDate` 跟随 locale，自定义 RTL 语言会得到 `dir="rtl"`。带可见文案的组件也支持 label 类 props 覆盖产品文案。

`PeriodicityAnimation` 与 `PeriodicityAnimated` 提供动效配置、减少动态效果处理和元素多态包装。

## 动效

动效通过 `PeriodicityAnimation` 和 `PeriodicityAnimated` 显式启用，并尊重系统的 `prefers-reduced-motion` 设置。交互 Surface 共享 Ripple 层，关闭动效时 Ripple 也会停止。

## 标准事件

所有公开的 `Periodicity*` 组件同时支持原生 React 事件和标准事件层，两者互不替代：

```tsx
<PeriodicityButton
    onClick={save}
    onStandardClick={(event) => console.log(event.count, event.source)}
    standardEvents={{
        press: start,
        drag: reorder,
        continuous: zoom,
    }}
/>
```

`over`、`enter`、`leave`、`wheel`、`click`、`press`、`input`、`continuous`、`drag` 都有对应的
`onStandard*` 监听器；也可以用 `onStandardEvent` 接收全部事件，或用 `standardEvents` 配置每个事件及阈值。
原生 `onClick`、`onWheel`、`onInput`、`onDrag` 保持不变。

## 可访问性

- 默认提供语义化角色和标签，并可通过原生 `aria-*` 属性覆盖。
- Dialog、Drawer、Menu、Dropdown、Listbox、Tree 和 Table 实现了键盘交互。
- 浮层支持焦点恢复和 Escape 关闭。
- 选区颜色经过限制，选中文字保持可读。
- 动效和 Ripple 尊重“减少动态效果”偏好。
- `PeriodicityDrag` 支持 Alt+ArrowUp/Alt+ArrowDown 键盘排序，并通过 live region 播报位置。
- `PeriodicityScrollbar` 支持方向键、Page、Home/End 和 Space 键盘滚动，并提供 scrollbar ARIA。
- `PeriodicityCalendar` 与 `PeriodicityDateTimePicker` 提供完整日历网格键盘导航和 roving focus。
- Table/Tree 提供行标题、树层级、选中/勾选状态和虚拟列表位置语义。
- 内置 skip link、landmark、减少动效、强制颜色和 `prefers-contrast` 样式。

当组件封装原生控件时，优先使用原生属性和事件，而不是手工重复 ARIA。

## 其他组件

完整 API 和英文说明见 [Additional components](README.md#additional-components)。以下组件均已导出：

- `PeriodicityTag`
- `PeriodicityEmailInput`
- `PeriodicityTelephoneInput`
- `PeriodicityCompleteInput`
- `PeriodicityVirtualSelect`
- `PeriodicityRadio`
- `PeriodicityRadioGroup`
- `PeriodicityField`
- `PeriodicityFieldGroup`
- `PeriodicityCard`
- `PeriodicityStateLayer`
- `PeriodicityBadge`
- `PeriodicityAvatar`
- `PeriodicityAvatarGroup`
- `PeriodicityDivider`
- `PeriodicityTimeline`
- `PeriodicityRate`
- `PeriodicityEmptyState`
- `PeriodicityProgress`
- `PeriodicityCircularProgress`
- `PeriodicityProgressRing`
- `PeriodicitySpinner`
- `PeriodicitySkeleton`
- `PeriodicityElementLoading`
- `PeriodicityFullscreenLoading`
- `PeriodicityuseLoad`
- `PeriodicityConfirmDialog`
- `PeriodicityMessageDialog`
- `PeriodicityInputDialog`
- `PeriodicityDropdownItem`
- `PeriodicityDropdownGroup`
- `PeriodicityDropdownSeparator`
- `PeriodicityContextMenuGroup`
- `PeriodicityContextMenuItem`
- `PeriodicityContextMenuSeparator`
- `PeriodicityAccordion`
- `PeriodicityBreadcrumbs`
- `PeriodicityPagination`
- `PeriodicityNormalList`
- `PeriodicityMultipleList`
- `PeriodicitySelectList`
- `PeriodicityCheckList`
- `PeriodicityVirtualList`
- `PeriodicityCheckTree`
- `PeriodicitySelectTree`
- `PeriodicityVirtualTree`
- `PeriodicityVirtualContact`
- `PeriodicityVirtualMessageList`
- `PeriodicityVirtualChat`
- `PeriodicityContactContextMenu`
- `PeriodicityMessageContextMenu`
- `PeriodicityPortal`
- `PeriodicityVisuallyHidden`

## 开发

```bash
npm install
npm run dev          # 组件展示站
npm run build:lib    # 可发布的 ES Module、CSS 和声明文件
npm run build:app    # 静态展示站构建
npm run lint
npm run format:check
npm run preview      # 预览静态展示站
```

`npm run build` 等价于 `npm run build:lib`。库构建输出 `dist/periodicity-react.js`、`dist/periodicity-react.css`，声明文件位于 `dist/types`。

## 验证

```bash
npx tsc -p tsconfig.app.json --noEmit
npx eslint src --max-warnings 0
npm run build
```

## 更新日志

见 [CHANGELOG.zh-CN.md](CHANGELOG.zh-CN.md)。
