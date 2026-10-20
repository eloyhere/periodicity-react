# Periodicity React

面向产品界面、管理后台和数据密集型应用的 Material 风格 React 组件库。

`periodicity-react` 提供 120 个带 `Periodicity` 前缀的组件，覆盖表单、选择器、浮层、导航、集合视图、消息会话、文件工具，以及把它们连接起来的设计系统 Provider。API 以 TypeScript 为先、以 Flex 布局为基础，并尽量贴近浏览器原生行为：在合理的地方透传原生属性、事件、ARIA 和 `ref`。

- **npm：** [`periodicity-react`](https://www.npmjs.com/package/periodicity-react)
- **版本：** `0.1.0`
- **源码：** [github.com/eloyhere/periodicity-react](https://github.com/eloyhere/periodicity-react)
- **要求：** React 19、React DOM 19、现代浏览器

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
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
- `PeriodicityScrollbar`
- `PeriodicityDrag`

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

使用 `PeriodicityTheme` 包裹应用：

```tsx
import { PeriodicityTheme } from "periodicity-react";

<PeriodicityTheme mode="dark">
    <App />
</PeriodicityTheme>;
```

`mode` 支持 `"light"`、`"dark"` 和 `"system"`。Provider 支持受控/非受控模式、密度、圆角、设计 Token 和原生元素属性。嵌套 Provider 会继承未指定的值。

## 国际化

```tsx
import { PeriodicityInternational } from "periodicity-react";

<PeriodicityInternational locale="zh-CN">
    <App />
</PeriodicityInternational>;
```

Provider 支持 locale 继承、回退 locale、消息表、插值和原生 `lang` 覆盖。`PeriodicityAnimation` 与 `PeriodicityAnimated` 提供动效配置、减少动态效果处理和元素多态包装。

## 动效

动效通过 `PeriodicityAnimation` 和 `PeriodicityAnimated` 显式启用，并尊重系统的 `prefers-reduced-motion` 设置。交互 Surface 共享 Ripple 层，关闭动效时 Ripple 也会停止。

## 可访问性

- 默认提供语义化角色和标签，并可通过原生 `aria-*` 属性覆盖。
- Dialog、Drawer、Menu、Dropdown、Listbox、Tree 和 Table 实现了键盘交互。
- 浮层支持焦点恢复和 Escape 关闭。
- 选区颜色经过限制，选中文字保持可读。
- 动效和 Ripple 尊重“减少动态效果”偏好。

当组件封装原生控件时，优先使用原生属性和事件，而不是手工重复 ARIA。

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
