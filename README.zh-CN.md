# Periodicity React

面向产品界面、管理后台和数据密集型应用的 Material 风格 React 组件库。

`periodicity-react` 提供 130 个带 `Periodicity` 前缀的组件，覆盖表单、选择器、浮层、导航、集合视图、消息会话、文件工具，以及把它们连接起来的设计系统 Provider。API 以 TypeScript 为先、以 Flex 布局为基础，并尽量贴近浏览器原生行为：在合理的地方透传原生属性、事件、ARIA 和 `ref`。

- **npm：** [`periodicity-react`](https://www.npmjs.com/package/periodicity-react)
- **版本：** `0.1.0`
- **源码：** [github.com/eloyhere/periodicity-react](https://github.com/eloyhere/periodicity-react)
- **要求：** React 19、React DOM 19、现代浏览器
- **许可证：** Apache 2.0

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [表单](#表单)
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

### 链接与锚点

```tsx
import { Anchor, Link } from "periodicity-react";

<Link href="https://example.com" external>文档</Link>
<Anchor href="#installation" active>安装</Anchor>;
```

`Link` 封装单个原生 anchor，提供 tone、下划线、外链、禁用和焦点处理。`Anchor` 增加当前区块标记和 `onNavigate` 回调，用于页内导航。两者都保留原生 `href`、`target`、`rel`、键盘和右键菜单行为。

## 表单

`PeriodicityForm` 封装原生 `<form>`，保留浏览器原生校验、提交、重置、method、action 和 autocomplete 行为。

```tsx
import { PeriodicityButton, PeriodicityForm, PeriodicityFormActions, PeriodicityFormField } from "periodicity-react";

<PeriodicityForm
    action="/subscribe"
    method="post"
    onSubmit={(event) => {
        event.preventDefault();
        subscribe(new FormData(event.currentTarget));
    }}
>
    <PeriodicityFormField label="邮箱" name="email" hint="我们不会分享你的邮箱。" required>
        {(field) => <input {...field} type="email" autoComplete="email" />}
    </PeriodicityFormField>

    <PeriodicityFormActions align="end">
        <PeriodicityButton type="submit">订阅</PeriodicityButton>
    </PeriodicityFormActions>
</PeriodicityForm>;
```

`PeriodicityFormField` 自动生成控件 id，并绑定 `label htmlFor`、`aria-describedby` 和 `aria-invalid`。
`PeriodicityTextInput` 等 UI 输入组件已经内置同样的 label 关联，可以直接放进 `PeriodicityForm`。

## 组件命名

每个公共组件都提供 `Periodicity` 前缀：

```tsx
import { PeriodicityButton, PeriodicityDialog, PeriodicityTable, PeriodicityTextInput } from "periodicity-react";
```

不带前缀的名称作为兼容别名保留，下面两种写法指向同一个组件：

```tsx
import { PeriodicityTable } from "periodicity-react";
import { Table } from "periodicity-react";
```

新代码应使用带前缀的名称，以明确组件边界并避免与宿主应用组件重名。

### 链接与锚点

```tsx
import { Anchor, Link } from "periodicity-react";

<Link href="https://example.com" external>文档</Link>
<Anchor href="#installation" active>安装</Anchor>;
```

`Link` 封装单个原生 anchor，提供 tone、下划线、外链、禁用和焦点处理。`Anchor` 增加当前区块标记和 `onNavigate` 回调，用于页内导航。两者都保留原生 `href`、`target`、`rel`、键盘和右键菜单行为。

## 表单与选择器

表单组件支持原生 input 属性，并透传事件、`ref`、`aria-*` 和 `data-*` 属性。

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
    locale="zh-CN"
    firstDayOfWeek={1}
/>;
```

键盘：方向键按天/周移动，Home/End 到本周首尾，PageUp/PageDown 切换月份，Shift+PageUp/PageDown 切换年份，Enter 或 Space 选择。`showAdjacentDays`、`weekdayLabels`、`monthLabels`、`renderDay`、`disabled` 和 `readOnly` 可用于定制。

大部分表单和选择器支持受控/非受控值、`disabled`、适当的 `readOnly`，以及调用方与内部事件处理器的组合。`PeriodicityMention` 提供异步建议列表和 Token 化 Chip；加载器由调用方提供。

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

`PeriodicityCoordinator` 有三个插槽：`collapse`、`header` 和 `main`。`collapse` 从 `collapseHeight` 开始，随着 `main` 滚动收缩到 0 高度；`header` 是固定 AppBar；`main` 是滚动主内容。

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

`PeriodicityCollapse` 仍可用于旧式 AppBar 内部的 Hero 组合。

`PeriodicityDrag` 对单一插槽容器的直接子元素排序，并在拖动时显示跟随指针的 Ghost。

## 消息与联系人

```tsx
import {
    PeriodicityChat,
    PeriodicityCommentThread,
    PeriodicityContact,
    PeriodicityMessageList,
} from "periodicity-react";
```

`PeriodicityContact` 支持搜索、虚拟化、选择和联系人菜单。`PeriodicityMessageList` 支持消息选择、复制、引用、转发、删除、撤回、重试和消息菜单。`PeriodicityChat` 组合联系人列表、会话、输入框和消息操作。`PeriodicityCommentThread` 支持回复、Mention、引用、解决和删除。

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

| 预设            | 中文       | English                | 模式  |
| --------------- | ---------- | ---------------------- | ----- |
| `accessible`    | 高对比度   | High contrast          | light |
| `protanopia`    | 红色盲友好 | Protanopia friendly    | light |
| `deuteranopia`  | 绿色盲友好 | Deuteranopia friendly  | light |
| `tritanopia`    | 蓝色盲友好 | Tritanopia friendly    | light |
| `achromatopsia` | 全色盲友好 | Achromatopsia friendly | light |
| `default`       | 默认       | Default                | light |
| `dark`          | 夜间       | Dark                   | dark  |
| `milk`          | 牛奶白     | Milk white             | light |
| `space-gray`    | 深空灰     | Space grey             | dark  |
| `gray`          | 灰色       | Grey                   | dark  |
| `light-gray`    | 浅灰色     | Light grey             | light |
| `sky-blue`      | 天蓝色     | Sky blue               | light |
| `pale-blue`     | 淡蓝色     | Pale blue              | light |
| `deep-blue`     | 深蓝色     | Deep blue              | dark  |
| `orange`        | 橙色       | Orange                 | light |
| `yellow`        | 黄色       | Yellow                 | light |
| `lemon`         | 柠檬黄     | Lemon yellow           | light |
| `red`           | 红色       | Red                    | light |
| `rose`          | 玫瑰红     | Rose red               | light |
| `green`         | 绿色       | Green                  | light |
| `deep-green`    | 深绿色     | Deep green             | dark  |
| `light-green`   | 浅绿色     | Light green            | light |

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
- `PeriodicityTabLayout`

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
