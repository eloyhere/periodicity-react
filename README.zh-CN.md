# Periodicity React

面向产品界面、管理后台和数据密集型应用的 Material 风格 React 19 组件库。

`periodicity-react` 提供 **141 个 `Periodicity*` 组件**、四种统计图、文件与图片选择器、作用域排版、设计系统 Provider，以及 **12 个内置语言包**。API 以 TypeScript 为先、以 Flex 布局为基础，并尽量贴近浏览器原生行为：在合理的地方透传原生属性、事件、ARIA 和 `ref`。

- **npm：** [`periodicity-react`](https://www.npmjs.com/package/periodicity-react)
- **版本：** `0.1.14`
- **在线示例：** 运行 `npm run dev`；源码见 [`src/showcase`](src/showcase)
- **源码：** [github.com/eloyhere/periodicity-react](https://github.com/eloyhere/periodicity-react)
- **要求：** React 19、React DOM 19
- **许可证：** Apache 2.0

## 目录

- [0.1.9 包含什么](#019-包含什么)
- [设计原则](#设计原则)
- [要求与安装](#要求与安装)
- [快速开始](#快速开始)
- [公共导出面](#公共导出面)
- [主题](#主题)
- [国际化](#国际化)
- [统计图](#统计图)
- [文件与图片选择器](#文件与图片选择器)
- [表单与输入](#表单与输入)
- [选择器与日历](#选择器与日历)
- [集合与数据](#集合与数据)
- [浮层与反馈](#浮层与反馈)
- [导航与布局](#导航与布局)
- [消息与评论](#消息与评论)
- [排版与 Font](#排版与-font)
- [动效与标准事件](#动效与标准事件)
- [可访问性](#可访问性)
- [样式与 Token](#样式与-token)
- [API 约定](#api-约定)
- [组件索引](#组件索引)
- [开发](#开发)
- [更新日志](#更新日志)

## 0.1.9 包含什么

- **Canvas 与 WebGL 统计图。** `BarChart`、`PieChart`、`LineChart`、`ScatterChart` 共用响应式画布框架：WebGL 系列层、canvas 回退、DPR 尺寸、图例、屏幕阅读器数据表，并通过共享的优先级 task 队列调度重绘。
- **原生文件与图片选择器。** `useFilePick` 驱动 `FilePicker`、`PhotoPicker`、`AvatarPicker` 内部渲染的隐藏原生 file 输入。图片与头像支持 Base64 预览和 Dialog 内裁剪，并区分确认、取消、关闭三种结果。
- **完整的国际化收尾。** 图表、选择器、评论、Transfer、日期时间、Mention、评分、进度、单选、滚动条、右键菜单、Combobox、Loading，以及邮箱/电话校验文案，都会读取当前语言包；12 个内置 locale 全部覆盖。
- **作用域排版。** `Font` 与 `useFont` 通过嵌套字体上下文提供字号层级、字体族、字重、行高、字距、大小写转换和对齐方式。
- **Electron 安全浮层。** Dropdown 与 Popover 面板设置 `-webkit-app-region: no-drag`；菜单覆盖在 Electron 自定义标题栏、应用栏或 Hero 的拖拽区域上时，整个面板仍可点击。

## 设计原则

Periodicity 遵循六条规则：

- **语义优先于装饰。** 组件消费 `--color-primary`、`--color-on-surface`、`--space-4` 等 token，不硬编码某套品牌色。切换主题或色盲配色时，所有组件会一起变化。
- **Flex 优先布局。** 组件使用 flexbox 组合，不依赖 CSS Grid，可以安全嵌入宿主布局、虚拟列表和滚动容器。
- **原生行为优先。** 表单仍可提交，链接仍可导航，输入仍走浏览器校验，对话框仍管理焦点，`ref` 指向真实 DOM；ARIA 和 data 属性是在原生语义上的增强。
- **可组合的表面。** `Surface`、`StateLayer`、`Ripple`、`Icon`、`Text`、`Font` 和布局原语是共享积木；高层组件保持轻量，并可通过 token 定制。
- **默认可访问、可国际化。** 焦点环、键盘路径、减少动效、经过对比度审计的配色、强制颜色样式，以及 12 个语言包都属于公共 API。
- **调度而非抖动。** 集合默认支持虚拟化，图表把绘制交给 task 调度器，输入变化时会取消过期的帧。

## 要求与安装

```bash
npm install periodicity-react
```

`react` 和 `react-dom` 是 peer dependencies，宿主应用需要安装 React 19。包内提供 ES Module、TypeScript 声明文件和提取后的样式表。在应用入口引入一次样式：

```tsx
import "periodicity-react/styles.css";
```

适用于 Vite、Next.js、webpack 等支持 ESM 的构建工具。开发脚本要求 Node.js 20 或更高版本。

## 快速开始

用主题、国际化和 Toast Provider 包裹应用，然后使用带前缀的组件。

```tsx
import { useState } from "react";
import {
    PeriodicityButton,
    PeriodicityInternational,
    PeriodicityTextInput,
    PeriodicityTheme,
    PeriodicityToastProvider,
} from "periodicity-react";
import "periodicity-react/styles.css";

export function SignIn() {
    const [email, setEmail] = useState("");

    return (
        <PeriodicityTheme theme="milk" mode="system">
            <PeriodicityInternational locale="zh-CN">
                <PeriodicityToastProvider>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            console.log(email);
                        }}
                    >
                        <PeriodicityTextInput
                            label="邮箱"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            hint="这个地址只用于登录。"
                        />
                        <PeriodicityButton type="submit">继续</PeriodicityButton>
                    </form>
                </PeriodicityToastProvider>
            </PeriodicityInternational>
        </PeriodicityTheme>
    );
}
```

## 公共导出面

组件导出只使用 `Periodicity*` 前缀；包根同时导出两个 Hook 和标准事件工具。完整组件清单见[组件索引](#组件索引)。

| 导出分组 | 名称                                                                   |
| -------- | ---------------------------------------------------------------------- |
| 组件     | 所有 `Periodicity*` 组件，以及已导出的对应 Props 类型                  |
| Hooks    | `useFilePick`、`useFont`                                               |
| 标准事件 | `createStandardEvent`、`useStandardEvents`、`withStandardEvents`       |
| 类型     | 共享 Props、`PeriodicityStandardEventProps`、图表/选择器/字体/语言类型 |

```tsx
import { PeriodicityButton, PeriodicityDialog, useFilePick } from "periodicity-react";
```

发布包刻意只暴露带前缀的组件表面。

## 主题

用 `PeriodicityTheme` 包裹应用，可设置预设、明暗模式、密度、圆角和 token 覆盖。

```tsx
import { useState, type ComponentProps } from "react";
import { PeriodicityTheme } from "periodicity-react";

type ThemeId = NonNullable<ComponentProps<typeof PeriodicityTheme>["theme"]>;

export function Shell() {
    const [theme, setTheme] = useState<ThemeId>("milk");

    return (
        <PeriodicityTheme
            theme={theme}
            mode="system"
            density="regular"
            radius="default"
            onThemeChange={(next) => setTheme(next)}
        >
            <App />
        </PeriodicityTheme>
    );
}
```

`theme` 是受控属性；`defaultTheme` 是非受控初值。`mode` 可选 `light`、`dark`、`system`，会覆盖预设自身的明暗模式。`density` 可选 `compact`、`regular`、`comfortable`；`radius` 可选 `sharp`、`default`、`rounded`、`pill`。`tokens` 和 `defaultTokens` 接受 CSS 自定义属性，优先级高于预设 token。

```tsx
<PeriodicityTheme
    theme="dark"
    tokens={{
        "--color-primary": "#f48fb1",
        "--color-secondary": "#80cbc4",
        "--space-4": "18px",
    }}
>
    <App />
</PeriodicityTheme>
```

### 预设

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

无障碍预设会提高文字、边框、焦点和禁用态的对比度；`prefers-contrast` 和 `forced-colors` 提供额外的系统级样式。主题 token 见 [`src/component/foundation/tokens.css`](src/component/foundation/tokens.css)，常用分组包括颜色（`--color-*`）、间距（`--space-*`）、圆角（`--radius-*`）、排版（`--type-*`、`--weight-*`、`--leading-*`）和高度（`--elevation-*`）。

## 国际化

用 `PeriodicityInternational` 包裹应用并设置 `locale`。所有内置组件文案——标签、空状态、图表图例与表头、选择器文案、校验消息、评论操作——都会读取当前语言包。

```tsx
import { useState, type ComponentProps } from "react";
import { PeriodicityInternational } from "periodicity-react";

type LocaleId = NonNullable<ComponentProps<typeof PeriodicityInternational>["locale"]>;

export function LocalisedApp() {
    const [locale, setLocale] = useState<LocaleId>("zh-CN");

    return (
        <>
            <LocaleSwitcher value={locale} onChange={setLocale} />
            <PeriodicityInternational locale={locale}>
                <App />
            </PeriodicityInternational>
        </>
    );
}
```

`locale` 是受控属性；`defaultLocale` 是非受控初值。`fallbackLocale` 默认是 `en-GB`。自定义文案会深度合并到内置字典之上：

```tsx
<PeriodicityInternational
    locale="zh-CN"
    messages={{
        save: "保存",
        cancel: "取消",
        noData: "暂无数据",
        legend: "图例",
        chooseFile: "选择文件",
    }}
>
    <App />
</PeriodicityInternational>
```

| Locale  | 语言                 |
| ------- | -------------------- |
| `en-GB` | British English      |
| `en-US` | American English     |
| `zh-CN` | 中国大陆简体中文     |
| `zh-SG` | 新加坡简体中文       |
| `zh-HK` | 香港繁体中文         |
| `zh-TW` | 台湾繁体中文         |
| `ja-JP` | 日本語               |
| `ko-KR` | 한국어               |
| `es-ES` | Español (España)     |
| `es-MX` | Español (México)     |
| `pt-PT` | Português (Portugal) |
| `pt-BR` | Português (Brasil)   |

支持 `fr-CA` 这类自定义 locale；缺失的 key 会按回退语言落到 `en-GB`。带可见标签的组件也接受 labels props，方便产品自定义文案。用例页面的语言选择器显示“原生名称 · 英文名称”，并禁用浏览器自动翻译，避免页面语言被外部翻译器改写。

## 统计图

四种图表共用一套 canvas/WebGL 框架：

- **双渲染层。** WebGL 系列层位于底层，2D canvas 负责绘制坐标轴和标签。`renderer` 接受 `"auto"`（有 WebGL 时使用）、`"webgl"` 或 `"canvas"`；WebGL 不可用或初始化失败时自动回退到 2D canvas。
- **响应式且清晰。** `ResizeObserver` 跟踪绘图区，设备像素比决定 canvas 的实际尺寸，重绘交给共享的优先级 task 队列。`renderPriority` 可选 `"high"`、`"medium"`、`"low"`；新的渲染会取消仍在排队的旧帧。
- **默认可访问。** 绘图区暴露 `role="img"` 和 `ariaLabel`，视觉隐藏的数据表完整镜像每个值，供屏幕阅读器读取。
- **主题感知。** 系列颜色来自 `series.color`、`palette` prop 或当前主题；类似 `--color-primary: var(--accent)` 的 CSS 变量别名会先通过计算样式解析，再交给 canvas/WebGL。

所有图表都接受 `ariaLabel`、`height`（默认 `320`）、`renderer`、`renderPriority`、`palette`、`showLegend`、相关图表支持的 `showGrid`、`emptyLabel`、`valueFormatter`、`onError`、`className`、`ref` 以及原生 `div` 属性。

### 柱状图

```tsx
import { PeriodicityBarChart } from "periodicity-react";

<PeriodicityBarChart
    ariaLabel="季度营收与成本"
    categories={["Q1", "Q2", "Q3", "Q4"]}
    series={[
        { id: "revenue", label: "营收", values: [42, 58, 64, 81] },
        { id: "costs", label: "成本", values: [28, 34, 39, 47] },
    ]}
    stacked={false}
    showValues
    renderer="auto"
    height={320}
/>;
```

`BarChart` 支持分组柱、堆叠柱、围绕零基线的负值、可选的数值标签，以及 x 轴类别标签。

### 饼图

```tsx
import { PeriodicityPieChart } from "periodicity-react";

<PeriodicityPieChart
    ariaLabel="各业务线营收占比"
    data={[
        { id: "product", label: "产品", value: 44 },
        { id: "services", label: "服务", value: 28 },
        { id: "support", label: "支持", value: 18 },
        { id: "other", label: "其他", value: 10 },
    ]}
    innerRadius={0.52}
    showPercentages
    height={320}
/>;
```

`innerRadius` 是外半径的比例，会被限制在 `0..0.85`；省略时绘制完整饼图。只有有限的正数会计入总和、图例和无障碍表格。

### 折线图

```tsx
import { PeriodicityLineChart } from "periodicity-react";

<PeriodicityLineChart
    ariaLabel="各设备月度会话"
    series={[
        {
            id: "desktop",
            label: "桌面端",
            points: [
                { x: 1, y: 22 },
                { x: 2, y: 28 },
                { x: 3, y: 25 },
                { x: 4, y: 36 },
            ],
        },
        {
            id: "mobile",
            label: "移动端",
            points: [
                { x: 1, y: 12 },
                { x: 2, y: 16 },
                { x: 3, y: 21 },
                { x: 4, y: 24 },
            ],
        },
    ]}
    area
    showPoints
    xFormatter={(value) => `M${value}`}
    yFormatter={(value) => `${value}k`}
    height={320}
/>;
```

`area` 用半透明填充把系列填到基线；`showPoints` 添加数据点标记。所有值相同时，x/y 数值域会自动扩展。

### 散点图

```tsx
import { PeriodicityScatterChart } from "periodicity-react";

<PeriodicityScatterChart
    ariaLabel="各队列转化率"
    series={[
        {
            id: "control",
            label: "对照组",
            points: [
                { x: 12, y: 18 },
                { x: 18, y: 24 },
                { x: 24, y: 21 },
            ],
        },
        {
            id: "variant",
            label: "实验组",
            points: [
                { x: 14, y: 28 },
                { x: 20, y: 35 },
                { x: 26, y: 33 },
            ],
        },
    ]}
    pointRadius={4}
    height={320}
/>;
```

`xFormatter` / `yFormatter` 控制坐标轴标签和无障碍表格；`valueFormatter` 作为数值的通用回退格式。

## 文件与图片选择器

三个选择器都会渲染自己的隐藏原生 `<input type="file">`。`useFilePick` 驱动该输入，并返回稳定的 `pick()`，解析用户选择的文件。

### useFilePick

```tsx
import { useFilePick } from "periodicity-react";

export function ImportButton() {
    const pick = useFilePick(["image/png", ".jpg"], { multiple: true });

    const handleClick = async () => {
        const files = await pick();
        if (files.length > 0) {
            await upload(files);
        }
    };

    return <button onClick={handleClick}>导入图片</button>;
}
```

Hook 接受 `accept` 字符串或数组，以及包含 `multiple`、`capture`、`disabled`、`inputRef` 的选项。没有 `inputRef` 时，它会创建、挂载并清理一个临时原生输入，因此也可以单独使用。取消对话框会解析为 `[]`；新的 pick 会取消上一个未完成的 Promise；组件卸载时 pending Promise 也会以 `[]` 结束。

### FilePicker

```tsx
import { PeriodicityFilePicker } from "periodicity-react";

<PeriodicityFilePicker
    label="附件"
    accept={[".pdf", ".png", ".jpg"]}
    multiple
    hint="支持 PDF 或图片"
    onChange={(files) => console.log(files.map((file) => file.name))}
/>;
```

`FilePicker` 在原生选择完成后立即触发 `onChange(files)`。默认 slot 会替换触发区内容；传入函数可获得 `{ open, disabled, files, summary }`。slot 内容渲染在触发按钮内部，应保持纯展示。

### PhotoPicker

```tsx
import { PeriodicityPhotoPicker } from "periodicity-react";

<PeriodicityPhotoPicker
    label="封面照片"
    aspect={16 / 9}
    outputWidth={1600}
    onChange={(selection) => {
        console.log(selection.file, selection.dataUrl, selection.cropped);
    }}
/>;
```

### AvatarPicker

```tsx
import { PeriodicityAvatarPicker } from "periodicity-react";

<PeriodicityAvatarPicker
    label="头像"
    name="Mira Chen"
    size="lg"
    onChange={(selection) => saveAvatar(selection.file)}
/>;
```

图片和头像选择后会打开裁剪 Dialog。change 语义如下：

| 操作                           | 结果                                                |
| ------------------------------ | --------------------------------------------------- |
| 裁剪 Dialog 中点击确认         | 触发一次 change，`{ file, dataUrl, cropped: true }` |
| 裁剪 Dialog 中点击取消         | 触发一次 change，使用原图，`cropped` 为 `false`     |
| 点击关闭、按 Escape 或点击遮罩 | 不触发 change                                       |

`PhotoPicker` 的 slots 是 `pick`、`preview`、`crop`；`AvatarPicker` 的 slots 是 `avatar`、`crop`。crop slot 会作为库内 `Dialog` 的 body 渲染，而不是原生 dialog。`labels` 可按字段覆盖文案，`ImageSelection` 以 `PeriodicityImageSelection` 类型导出。

## 表单与输入

### 文本输入

`TextInput`、`TextArea`、`EmailInput`、`TelephoneInput`、`NumberInput`、`CompleteInput`、`Mention` 共用六槽 `InputLayout` 字段壳：`prefix`、`hint`、`message`、`limitation`、`error`、`suffix`。

```tsx
import { PeriodicityTextInput } from "periodicity-react";

<PeriodicityTextInput
    label="工作区名称"
    value={name}
    onChange={(event) => setName(event.target.value)}
    prefix="Folder"
    hint="工作区成员都能看到这个名称。"
    message="仅支持小写字母、数字和连字符。"
    limitation={`${name.length}/40`}
    suffix="Check"
    required
/>;
```

邮箱和电话输入会清洗输入、保持光标位置、使用原生 pattern 属性，并从当前语言包读取本地化校验消息。`PeriodicityForm`、`PeriodicityFormField`、`PeriodicityFormActions` 封装原生 `<form>`，为原生控件生成 `label htmlFor`、`aria-describedby` 和 `aria-invalid` 关联。

### 按钮

`PeriodicityButton` 除图标、variant、size 外，还支持紧凑的 `prefix`、`content`、`suffix` 三槽布局。

```tsx
<PeriodicityButton variant="outline" prefix="Plus" content="新建项目" suffix="ChevronRight" onClick={createProject} />
```

### 其他控件

`PeriodicityCheckbox`、`PeriodicityRadio` / `PeriodicityRadioGroup`、`PeriodicitySwitch`、`PeriodicityRange`、`PeriodicityField`、`PeriodicityFieldGroup`、`PeriodicitySelect`、`PeriodicityVirtualSelect`、`PeriodicityTreeSelect`、`PeriodicityCombobox` 覆盖常见表单和筛选布局，均支持受控/非受控值、disabled/readOnly 和原生属性透传。

## 选择器与日历

| 组件                        | 行为                                                |
| --------------------------- | --------------------------------------------------- |
| `PeriodicityTimePicker`     | 24 小时制滚轮时间选择，支持键盘输入。               |
| `PeriodicityDateTimePicker` | 日期 + 时间组合面板，包含年、月、时、分字段。       |
| `PeriodicityNumberPicker`   | Android 风格数字滚轮，支持输入建议与 min/max/step。 |
| `PeriodicityColourPicker`   | 原生颜色输入与预设色板，可选显示数值。              |
| `PeriodicityCyclePicker`    | 循环滚轮选择器，支持自动补全和自定义条目类型。      |
| `PeriodicityVariantPicker`  | 单选样式变体 chips。                                |
| `PeriodicityCalendar`       | 支持 locale 的月历网格，ISO 值，完整键盘导航。      |

```tsx
<PeriodicityCalendar
    label="交付日期"
    value={date}
    onChange={setDate}
    min="2026-01-01"
    max="2026-12-31"
    firstDayOfWeek={1}
/>
```

日历值使用 ISO `YYYY-MM-DD` 字符串。方向键按天/周移动，Home/End 移到本周边界，PageUp/PageDown 切换月份，Shift+PageUp/PageDown 切换年份，Enter 或空格选择。日期单元格暴露 `slots.header`、`slots.body`、`slots.footer`。

## 集合与数据

集合可以使用普通数组或 Adapter，并支持可选的固定行高虚拟化。

```tsx
import { PeriodicityList, PeriodicityTable, PeriodicityTree } from "periodicity-react";

<PeriodicityList
    items={people}
    getKey={(person) => person.id}
    selectionMode="single"
    renderItem={(person) => `${person.firstName} ${person.lastName}`}
/>;

<PeriodicityTable
    columns={[
        { id: "name", header: "姓名", cell: (person) => person.name },
        { id: "role", header: "角色", cell: (person) => person.role },
    ]}
    rows={people}
    rowKey={(person) => person.id}
    caption="团队成员"
/>;

<PeriodicityTree items={nodes} getKey={(node) => node.id} renderItem={(node) => node.label} />;
```

集合家族包括 `List`、`Tree`、`Table`、`Select`、`Combobox`、`Transfer`，以及 `Virtual*` 预设和 `NormalList` / `MultipleList` / `SelectList` / `CheckList` / `CheckTree` / `SelectTree` 等便捷包装。固定行高虚拟化使用 `virtual`、`height` 和 `itemHeight` / `rowHeight`。选择、展开、加载、空状态和禁用状态在整个家族中保持一致。

## 浮层与反馈

```tsx
import {
    PeriodicityAlert,
    PeriodicityDialog,
    PeriodicityDropdown,
    PeriodicityDropdownItem,
    PeriodicityTooltip,
} from "periodicity-react";

<PeriodicityAlert tone="success" title="已保存" description="所有更改都已同步。" />;

<PeriodicityDialog open={open} title="删除项目" onClose={() => setOpen(false)}>
    此操作无法撤销。
</PeriodicityDialog>;

<PeriodicityDropdown ariaLabel="项目操作" trigger={(slot) => <button {...slot}>操作</button>}>
    <PeriodicityDropdownItem onSelect={rename}>重命名</PeriodicityDropdownItem>
    <PeriodicityDropdownItem onSelect={archive}>归档</PeriodicityDropdownItem>
</PeriodicityDropdown>;

<PeriodicityTooltip content="复制链接">
    <PeriodicityButton aria-label="复制链接" prefix="Link" />
</PeriodicityTooltip>;
```

浮层家族覆盖 Dialog、Confirm/Message/Input Dialog、Drawer、DrawerLayout、ContextMenu、Dropdown、Popover、Tooltip、Snackbar、Toast、Alert、Banner、Backdrop，以及全屏/局部 Loading。它们支持受控/非受控打开状态、关闭原因、Escape 处理、焦点恢复和原生面板属性。

Dropdown 和 Popover 会 portal 到 `document.body`，并标记 `-webkit-app-region: no-drag`，因此即使覆盖在 Electron 自定义应用栏或 Hero 的拖拽区域上，整个面板仍可交互。

## 导航与布局

导航组件包括 `PeriodicityNavigationView`、`PeriodicityTabs` / `PeriodicityTabPanel`、`PeriodicityPager` / `PeriodicityPage`、`PeriodicityMenu` 家族、`PeriodicityStepper`、`PeriodicityAccordion`。

布局以 Flex 为基础，不使用 CSS Grid。结构组件包括：

- `PeriodicityGridLayout`
- `PeriodicityLinearLayout` 和 `PeriodicityLinearLayoutItem`
- `PeriodicityConstraintLayout` 和 `PeriodicityConstraint`
- `PeriodicityWaterfallLayout`
- `PeriodicityDrawerLayout`
- `PeriodicityCoordinator`、`PeriodicityAppBar`、`PeriodicityCollapse`、`PeriodicityToolbar`
- `PeriodicitySticky` 和 `PeriodicityStickyPage`
- `PeriodicityScrollbar`
- `PeriodicityScroll`
- `PeriodicityDrag`

`PeriodicityCoordinator` 只有 `collapse`、`header`、`main` 三个插槽。`collapse` 随 `main` 滚动从 `collapseHeight` 收缩到 0；`header` 是固定 AppBar；`main` 是滚动视口。当 `main` 无法滚动时，未被内部组件消费的竖直滚轮会用于折叠或恢复 collapse，而不是滚动页面；嵌套滚动容器仍然优先。

```tsx
<PeriodicityCoordinator
    height={520}
    collapseHeight={200}
    collapse={<HeroImage />}
    header={
        <PeriodicityAppBar expandedHeight={64} collapsedHeight={64} scrollBehaviour="none" liftOnScroll={false}>
            <PeriodicityToolbar
                title="野外笔记"
                subtitle="秋季考察"
                navigationIcon="←"
                actions={
                    <PeriodicityButton size="sm" variant="outline">
                        分享
                    </PeriodicityButton>
                }
            />
        </PeriodicityAppBar>
    }
    main={<Notes />}
/>
```

`PeriodicityToolbar` 也接受 `prefix`、`content`、`suffix` 三个插槽；三个插槽等分整行，只有一个时占满，两个时各占一半。`prefix` 和 `suffix` 的字符串值会被视为图标名。

`PeriodicityScroll` 是 Android `ScrollView` 语义的布局：一个纵向滚动视口、一个内容块，以及可放任意数量子元素的 slot。`fillViewport` 对应 Android 的同名标志，滚动视口本身是可聚焦的 region。`PeriodicityScrollbar` 仍是带 Material overlay 滚动条和可替换滚动条 slot 的滚动容器。

`PeriodicityStickyPage` 是建立在 `Scroll` 之上的页面容器，slot 可放任意数量子元素；内部的 `PeriodicitySticky` 会吸附在这个页面的视口上。`Sticky` 支持顶部/底部边缘、偏移、`zIndex`、原生 CSS `filter` 语义、`disabled`、吸附状态样式和 `onStuckChange`，并始终暴露 `data-edge` 与 `data-stuck`。

```tsx
<PeriodicityStickyPage height={520} ariaLabel="Launch">
    <PeriodicitySticky offset={0} zIndex={20}>
        <SiteNav />
    </PeriodicitySticky>
    <PeriodicitySticky offset={56} filter="saturate(1.08)">
        <Hero />
    </PeriodicitySticky>
    <Article />
</PeriodicityStickyPage>
```

`PeriodicitySticky` 也可以单独用在任意滚动容器里，例如卡片或左右分栏：

```tsx
<PeriodicitySticky offset={64} stuckClassName="toolbar--pinned" onStuckChange={setPinned}>
    <PeriodicityToolbar title="野外笔记" />
</PeriodicitySticky>
```

`PeriodicityDrag` 对单个 slot 容器的直接子元素做拖拽排序，并在排序时渲染跟随指针的拖拽幽灵。

## 消息与评论

消息家族包括 `PeriodicityContact` / `PeriodicityVirtualContact`、`PeriodicityMessageList` / `PeriodicityVirtualMessageList`、`PeriodicityChat` / `PeriodicityVirtualChat`、`PeriodicityAgentChat` / `PeriodicityVirtualAgentChat`，以及联系人/消息右键菜单。

- `PeriodicityContact` 支持搜索、虚拟化、选择，以及联系人右键菜单。
- `PeriodicityMessageList` 支持消息选择、复制、引用、转发、删除、撤回、重试，以及消息右键菜单。传入 `reactions`（例如 `defaultMessageReactions`）即可在时间旁的消息底部加入 Telegram 风格 emoji 回应：前六个快捷项构成一个原生 radio 组，末尾的 more 图标按钮在浮窗中展示其余 emoji 分组；`PeriodicityVirtualMessageList` 默认使用 136px 行高以完整显示底部内容。
- `PeriodicityChat` 组合联系人列表、会话、输入区和消息操作。
- `PeriodicityAgentChat` / `PeriodicityVirtualAgentChat` 复用该布局做 Agent 工作区：左侧是历史会话，Agent 回复按 Markdown 渲染，思考过程放在独立的折叠视图中，展开时带动画且宽度保持稳定。消息设置 `streaming` 后会以打字机效果逐字显示并带光标，`typingSpeed` 控制速度。
- `PeriodicityCommentThread` 支持回复、提及、引用、标记解决和删除；新增的 `PeriodicityVirtualCommentThread` 按固定行高对扁平化评论线程做虚拟滚动。

两种评论线程都接受 `comment` slot 替换整条评论。联系人、消息和聊天组件暴露 `contact`、`context`、`message`、`messageContext`、`avatar` slots，并接收渲染索引和对应数据项。

## 排版与 Font

`PeriodicityText` 按字号层级和语义色调渲染文本。`PeriodicityFont` 创建作用域排版上下文，`useFont` 读取引用元素的计算后字体族、字号、颜色、字重、行高、字距和大小写转换。

```tsx
import { PeriodicityFont, useFont } from "periodicity-react";

<PeriodicityFont level="h3" family="display" weight="semibold" letterSpacing="tight">
    考察笔记
</PeriodicityFont>;

const font = useFont(triggerRef);
```

`Font` 的 level 可选 `display`、`h1`、`h2`、`h3`、`h4`、`body`、`body-sm`、`label`、`mono`；family 可选 `sans`、`display`、`mono`，也可以传原始 CSS 字体栈。`useFont` 在 ref 挂载前会回退到最近的 `Font` 上下文，适合让 portal 浮层与触发元素保持一致。

## 文档

`PeriodicityMarkdown` 把只读 Markdown 文档渲染为经过清理的语义化 HTML，支持标题、段落、嵌套列表、表格、引用、代码块、任务列表、链接和图片；原始 HTML 会被转义而不是执行，链接与图片只接受安全的 URL 协议。

`PeriodicityTex` 把 TeX 渲染为原生 MathML；当源码包含 `\begin{document}` 时，它会被视为完整 LaTeX 文档并渲染为 HTML 文章：标题、作者、摘要、带编号的章节与附录、列表、表格、图片、脚注、引用、交叉引用，以及内嵌公式。前导区中的 `\newcommand`、`\renewcommand`、`\def` 和 `\DeclareMathOperator` 会被展开；`\includegraphics`、`\href` 和 `\url` 只接受安全的 URL 协议。

```tsx
import { PeriodicityMarkdown, PeriodicityTex } from "periodicity-react";

<PeriodicityMarkdown source={"# 笔记\n\n只读预览。"} />;

<PeriodicityTex source="E = mc^2" />;
<PeriodicityTex display={false} source="a^2 + b^2 = c^2" />;
<PeriodicityTex source={paper} />;
```

`Markdown` 接受 `source` 和可选的 `breaks`；`Tex` 接受 `source` 和 `display`，用于在行内公式与独立公式之间切换；完整文档模式下 `display` 会被忽略。通过 `\input` 或 `\bibliography` 引用的外部文件不会被加载，宏包不会执行，未知环境会退化为渲染其内容，`align` 的每一行不会单独编号。

## 动效与标准事件

`PeriodicityAnimation` 和 `PeriodicityAnimated` 提供动效配置、减少动效处理和元素多态动画包装。Ripple 层由可交互表面共享，在关闭动效时停止。

每个公共 `Periodicity*` 组件都同时接受原生 React props 和标准事件层，两者不会互相覆盖：

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

命名监听器包括 `over`、`enter`、`leave`、`wheel`、`click`、`press`、`input`、`continuous`、`drag`。可以用 `onStandardEvent` 统一监听，或用 `standardEvents` 配置每个事件和阈值。原生 `onClick`、`onWheel`、`onInput`、`onDrag` 保持原样。

## 可访问性

- 默认提供语义角色和标签，可用原生 `aria-*` 覆盖。
- Dialog、Drawer、Menu、Dropdown、Listbox、Tree、Table 都实现了键盘交互。
- 浮层支持焦点恢复和 Escape 关闭。
- 选中文本的颜色被限制在可读范围内。
- 动画和 Ripple 尊重减少动效偏好。
- `PeriodicityDrag` 支持 Alt+ArrowUp/Alt+ArrowDown 键盘排序，并通过 live region 播报。
- `PeriodicityScrollbar` 支持 Arrow、Page、Home/End、Space 键盘滚动，并暴露 scrollbar ARIA。
- `PeriodicityCalendar` 和 `PeriodicityDateTimePicker` 提供完整的日历网格键盘导航和 roving focus。
- Table 和 Tree 暴露行头、排序中立表头、树层级、选中/勾选状态和虚拟集合位置。
- 图表把绘图区暴露为带标签的图片，并用视觉隐藏表格镜像所有数值。
- 内置跳过链接、landmark 结构、减少动效、强制颜色和 `prefers-contrast` 样式。

如果组件封装了原生控件，优先使用其原生 props 和事件，不要手工重复 ARIA。

## 样式与 Token

在应用入口引入一次 `periodicity-react/styles.css`。组件暴露稳定的 class name 供宿主覆盖；主题定制应优先通过 CSS 自定义属性完成，而不是 fork 组件样式。设计系统 token 覆盖颜色角色、表面、描边、间距、圆角、排版、状态层、高度和 z-index 层级。

```css
:root {
    --color-primary: #1976d2;
    --color-on-primary: #ffffff;
    --color-surface: #fbf9f6;
    --space-4: 16px;
    --radius-md: 12px;
}
```

组件以 Flex 为基础，不使用 CSS Grid。宿主应用可以在组件外部自由使用 Grid；库内结构组件本身保持 flex 容器。

## API 约定

- **受控与非受控。** 组件通常接受 `value` / `defaultValue` 加 change 回调，或 `open` / `defaultOpen` 加 open-change 回调；传入受控 prop 时以受控值为准。
- **原生属性与事件。** 公共组件继承原生元素 props；显式传入的原生处理器会与内部处理器组合，而不是被替换。
- **Ref。** 大多数组件接受根元素 `ref`；部分复合字段还接受专用的 `rootRef` 或内部 input ref。
- **Slots。** Slot props 接受节点或接收类型化上下文的渲染函数。Slot 内容应保持展示性，行为和 ARIA 由组件负责。
- **Change 语义。** 文件选择立即触发；图片选择器只在裁剪 Dialog 点击确认或取消后触发；图表是只读可视化，不提供值变更事件。
- **只有前缀导出。** 发布入口暴露 `Periodicity*` 组件、`useFilePick`、`useFont` 和标准事件工具。

## 组件索引

发布包包含 142 个 `Periodicity*` 组件。下表省略前缀以便阅读。

| 家族            | 组件                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Provider 与基础 | Theme, International, Animation, Animated, Portal, Surface, StateLayer, VisuallyHidden, Font, Text, Icon, Divider                                                                                                                                                                                                                                                                                                                                                              |
| 操作与字段      | Button, TextInput, TextArea, EmailInput, TelephoneInput, NumberInput, CompleteInput, Mention, Select, VirtualSelect, TreeSelect, Combobox, Checkbox, Radio, RadioGroup, Switch, Range, Field, FieldGroup, Form, FormField, FormActions, Link, Anchor                                                                                                                                                                                                                           |
| 选择器与日历    | FilePicker, PhotoPicker, AvatarPicker, TimePicker, DateTimePicker, NumberPicker, ColourPicker, CyclePicker, VariantPicker, Calendar                                                                                                                                                                                                                                                                                                                                            |
| 统计图          | BarChart, PieChart, LineChart, ScatterChart                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 集合与数据      | List, VirtualList, NormalList, MultipleList, SelectList, CheckList, Tree, VirtualTree, CheckTree, SelectTree, Table, VirtualTable, Transfer, Pagination, Scrollbar, Drag, Timeline, Card                                                                                                                                                                                                                                                                                       |
| 浮层与反馈      | Dialog, ConfirmDialog, MessageDialog, InputDialog, Drawer, DrawerLayout, Popover, Dropdown, DropdownItem, DropdownGroup, DropdownSeparator, ContextMenu, ContextMenuItem, ContextMenuGroup, ContextMenuSeparator, Menu, MenuItem, MenuGroup, MenuSeparator, Tooltip, ToastProvider, Snackbar, Alert, Banner, Backdrop, FullscreenLoading, ElementLoading, Progress, CircularProgress, ProgressRing, Spinner, Skeleton, Rate, Badge, Tag, Chip, Avatar, AvatarGroup, EmptyState |
| 导航与布局      | Coordinator, AppBar, Collapse, Toolbar, Sticky, StickyPage, Tabs, TabPanel, Pager, Page, Scroll, NavigationView, Stepper, Accordion, Breadcrumbs, LinearLayout, LinearLayoutItem, ConstraintLayout, Constraint, GridLayout, WaterfallLayout                                                                                                                                                                                                                                    |
| 消息与评论      | Contact, VirtualContact, ContactContextMenu, MessageList, VirtualMessageList, MessageContextMenu, Chat, VirtualChat, AgentChat, VirtualAgentChat, CommentThread, VirtualCommentThread                                                                                                                                                                                                                                                                                          |
| 文档            | Markdown, Tex                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## 开发

```bash
npm install
npm run dev           # Vite 组件用例站
npm run build:lib     # 可发布的 ES Module、CSS 和 TypeScript 声明
npm run build:app     # 静态用例站构建
npm run lint
npm run format:check
npm run test:a11y     # 无障碍审计
npx vitest run        # 完整单元/组件测试
npm run preview       # 预览静态用例站
```

`npm run build` 是 `npm run build:lib` 的别名。库构建输出 `dist/periodicity-react.js`、`dist/periodicity-react.css` 和 `dist/types` 下的声明文件。`publish.ps1` 执行 `npm publish`，会先触发 `prepublishOnly` 重新构建库。

### 目录结构

- `src/component` — 组件家族、共享原语和公共 barrel。
- `src/layout` — Coordinator、AppBar、Drawer、Table、List、Tree 等布局与集合。
- `src/theme` — 主题 Provider、预设和 token 契约。
- `src/international` — locale 解析、内置语言包和消息处理。
- `src/animation`、`src/gesture` — 动效、Ripple 和标准事件层。
- `src/task` — 图表与集合使用的优先级调度器。
- `src/showcase` — 文档应用和实时示例。
- `tests` — Vitest、Testing Library 与 axe 无障碍检查。

### 验证

仓库使用以下命令验证：

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run lint
npm run format:check
npx vitest run
npm run audit:contrast
npm run audit:locales
npm run test:a11y
npm run build:lib
```

## 更新日志

英文版本见 [CHANGELOG.md](CHANGELOG.md)，中文版本见 [CHANGELOG.zh-CN.md](CHANGELOG.zh-CN.md)。
