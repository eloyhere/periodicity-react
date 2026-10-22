# 标准事件层：over / enter / leave / wheel / click / press / input / continuous / drag

> 状态：Accepted v2 · 2026-10-22
> 适用：`periodicity-react` / Web / React 19
> 结论：**移除 Gesture、相位队列、语义 controller 和 scheduler。** 鼠标/触摸/键盘模块直接注册原生事件，统一触发组件需要的标准事件。

---

## 1. 为什么推翻上一版

上一版试图先造一个通用 Gesture：

```
三模块 → phase queue → Gesture → semantics controller → 组件
```

它的问题是：**组件不需要 Gesture，组件需要事件。**

- 组件不关心 down/move/up 如何组成 session；
- 组件不关心谁 claim、谁 reject；
- 组件不关心长按/双击的通用状态机；
- 浏览器已经把输入放在高优先级任务里，不需要再实现一套输入队列。

所以这一版只保留三件事：

1. **模块**：鼠标、触摸、键盘分别注册自己的原生事件。
2. **标准事件**：`over`、`enter`、`leave`、`wheel`、`click`、`press`、`input`、`continuous`、`drag`。
3. **一个绑定 hook**：把一个元素上的三个模块合成一个 `ref`，组件只消费标准事件。

```
mouse/register.ts ───┐
touch/register.ts ───┼→ useStandardEvents(ref) → onOver / onEnter / onLeave / onWheel
keyboard/register.ts ┘                          → onClick / onPress / onInput
                                                → onContinuous / onDrag
```

没有 `Gesture` 类，没有 phase，没有语义层。

---

## 2. 标准事件表

| 事件         | 语义                                      | 来源                          | 关键字段                             |
| ------------ | ----------------------------------------- | ----------------------------- | ------------------------------------ |
| `over`       | 指针在元素上移动（冒泡）                  | mouse / pen                   | `x/y`                                |
| `enter`      | 指针进入元素（不冒泡）                    | mouse / pen                   | `x/y`                                |
| `leave`      | 指针离开元素                              | mouse / pen                   | `x/y`                                |
| `wheel`      | 滚轮/触控板                               | mouse                         | `deltaX/deltaY/deltaMode`、`x/y`     |
| `click`      | 一次完整激活                              | mouse / touch / keyboard / AT | `count`、`x/y`、`source`             |
| `press`      | 按下开始，不表示激活                      | mouse / touch / keyboard      | `x/y`、`source`                      |
| `input`      | 文本值变化，独立于指针领域                | keyboard / IME                | `value`、`x/y`                       |
| `continuous` | 连续点击的第二次及以后（multi-click）     | mouse / touch / keyboard      | `count >= 2`、`x/y`                  |
| `drag`       | 按住并移动，`phase` 为 start / move / end | mouse / touch / pen           | `phase`、`deltaX/Y`、`totalDeltaX/Y` |

### 2.1 `press` 与 `click`

- `press` 只表示“按下了”，在 pointerdown / keydown 时触发。
- `click` 表示“完成了一次激活”，在原生 click 时触发。
- 不在 `press` 里判断长按；长按需要时再加 `longPress`，不要偷偷塞 timer。

### 2.2 `continuous` 是 multi-click

- 默认窗口 `300ms`、距离 `10px`。
- 第一次 click 的 `count = 1`；第二次及以后 `count = 2, 3, ...`。
- `onClick` 每次点击都触发；`onContinuous` 只在 `count >= 2` 时触发。
- 不是 hold-repeat。按住连续触发是另一种事件，需要时单独加 `repeat`。

### 2.3 `drag`

- 指针按下后移动超过阈值（mouse 6px / touch 10px）才进入 drag。
- 事件带 `phase`：
    - `start`：第一次超过阈值；
    - `move`：拖动过程；
    - `end`：抬起/取消。
- `deltaX/Y` 是相对上一次 move；`totalDeltaX/Y` 是相对按下点。
- drag 结束后的 trailing click 被抑制。
- drag 只负责指针；键盘用户需要组件提供“上移/下移/移动到”按钮或菜单。

### 2.4 `input` 不是手势

`input` 是值变化，来源是键盘/IME/粘贴。它和 `over/enter/leave` 放在同一个 hook 里只是 API 便利，语义上属于另一个领域。不要用它判断点击/拖动。

---

## 3. 公共 API

```ts
export type StandardEventName =
    "over" | "enter" | "leave" | "wheel" | "click" | "press" | "input" | "continuous" | "drag";

export type StandardEventSource = "mouse" | "touch" | "pen" | "keyboard" | "virtual";
export type StandardDragPhase = "start" | "move" | "end";

export interface StandardEvent {
    readonly type: StandardEventName;
    readonly x: number;
    readonly y: number;
    readonly source: StandardEventSource;
    readonly target: Element;
    readonly currentTarget: Element;
    readonly count: number;
    readonly value?: string;
    readonly deltaX?: number;
    readonly deltaY?: number;
    readonly deltaMode?: number;
    readonly totalDeltaX?: number;
    readonly totalDeltaY?: number;
    readonly phase?: StandardDragPhase;
    readonly originalEvent: Event;
    preventDefault(): void;
    stopPropagation(): void;
}

export interface StandardEventOptions {
    readonly over?: StandardEventHandler;
    readonly enter?: StandardEventHandler;
    readonly leave?: StandardEventHandler;
    readonly wheel?: StandardEventHandler;
    readonly click?: StandardEventHandler;
    readonly press?: StandardEventHandler;
    readonly input?: StandardEventHandler;
    readonly continuous?: StandardEventHandler;
    readonly drag?: StandardEventHandler;
    readonly continuousInterval?: number;
    readonly continuousSlop?: number;
    readonly dragThreshold?: number;
    readonly disabled?: boolean;
}

export interface StandardEventState {
    readonly pressed: boolean;
    readonly hovered: boolean;
    readonly continuousCount: number;
    readonly dragging: boolean;
}

export const useStandardEvents: (options?: StandardEventOptions) => {
    readonly ref: RefCallback<HTMLElement>;
    readonly state: StandardEventState;
};
```

### 3.1 用法

```tsx
const events = useStandardEvents({
    click: save,
    continuous: zoom,
    drag: reorder,
});

return <div ref={events.ref}>...</div>;
```

### 3.2 事件处理

```tsx
const events = useStandardEvents({
    press: (event): void => setPressed(true),
    click: (event): void => {
        if (event.count === 1) {
            save();
        }
    },
    continuous: (event): void => {
        zoom(event.count);
    },
    drag: (event): void => {
        if (event.phase === "move") {
            moveGhost(event.totalDeltaX, event.totalDeltaY);
        }
    },
});
```

---

## 4. 坐标规则

**所有标准事件都带 `x/y`。**

| 来源     | x/y                               |
| -------- | --------------------------------- |
| mouse    | `event.clientX` / `event.clientY` |
| touch    | 触点坐标                          |
| pen      | 笔尖坐标                          |
| keyboard | **光标坐标（caret）**             |
| virtual  | caret；无法测量时退回焦点元素中心 |

键盘坐标的读取顺序：

1. `input` / `textarea`：按 `selectionStart` 用镜像元素测量光标；
2. `contenteditable`：`Selection.getRangeAt(0).getBoundingClientRect()`；
3. 按钮、`password`、jsdom：焦点元素中心。

实现：[`caret.ts`](../../src/gesture/core/caret.ts)。

---

## 5. 模块职责

### 5.1 鼠标模块

[`mouse/register.ts`](../../src/gesture/mouse/register.ts)

- `pointerover` / `pointerenter` / `pointerleave`：只处理 `pointerType === "mouse"`。
- `wheel`：非 passive，保留 `preventDefault()` 能力。
- `pointerdown`：主键 → `press`。
- drag：按下后挂 window `pointermove/up/cancel`，超过阈值发 `drag start/move/end`。
- 不处理 click；click 由 hook 统一监听，避免 mouse/touch/keyboard 三份重复。

### 5.2 触摸模块

[`touch/register.ts`](../../src/gesture/touch/register.ts)

- `pointerdown`：只处理 `touch`/`pen`，主键 → `press`。
- drag：阈值 10px。
- 不处理 hover/wheel；触摸没有 hover。
- 不处理 click；由 hook 统一监听。

### 5.3 键盘模块

[`keyboard/register.ts`](../../src/gesture/keyboard/register.ts)

- `keydown`：Enter/Space，忽略 `repeat` 和 `isComposing` → `press`。
- `input`：读取 input/textarea/contenteditable 的 value → `input`。
- 不处理 click；原生 click 由 hook 统一监听。
- 坐标 = caret。

### 5.4 绑定 hook

[`useStandardEvents.ts`](../../src/gesture/react/useStandardEvents.ts)

- 只挂一个 `click` 监听：负责 `click` + `continuous` 计数。
- 挂 `pointerup/pointercancel/blur`：维护 `pressed`、`dragging`、`hovered` 状态。
- 把 mouse/touch/keyboard 三个模块 attach 到同一个 ref。
- 维护 `continuousInterval` / `continuousSlop` / `dragThreshold` 的默认值。
- drag 期间设置 `suppressClick`，抑制 trailing click。

---

## 6. 无障碍

- **键盘等价**：`press` 和 `click` 必须覆盖 Enter/Space；键盘坐标是 caret。
- **hover 不是唯一信息**：`over/enter/leave` 只用于增强；触摸上用点击/常驻替代。
- **drag 必须有替代**：上移/下移按钮、移动到菜单、方向键；WCAG 2.5.7。
- **continuous 必须有替代**：连续点击不能是唯一入口；提供按钮/输入框/键盘。
- **目标尺寸**：≥24×24，推荐 ≥44×44。
- **不劫持缩放**：不要 `user-scalable=no`；`touch-action` 按组件声明。
- **reduced-motion**：状态层/ghost 只做透明度或关闭。

---

## 7. 测试

`tests/standard-events.test.tsx` 覆盖：

1. `over` / `enter` / `leave` / `wheel` 的坐标和 delta。
2. `press` → `click`，第二次 click 触发 `continuous(count=2)`。
3. drag 的 `start/move/end`，以及 drag 后 click 被抑制。
4. `input` 的 value。

运行：

```powershell
node node_modules/vitest/vitest.mjs run tests/standard-events.test.tsx
```

---

## 8. 迁移

| 现有                         | 新实现                                                              |
| ---------------------------- | ------------------------------------------------------------------- |
| `Surface` / `Button` ripple  | `useStandardEvents({ press, click })`                               |
| `ContextMenu` 长按           | 以后加 `longPress` 标准事件；当前先用 `press` + 组件 timer 或菜单键 |
| `Drag`                       | `useStandardEvents({ drag })`                                       |
| `Scrollbar` / `NumberPicker` | `press` + `drag` + `wheel`                                          |
| `Tooltip`                    | `enter` / `leave`                                                   |
| `Pager`                      | `drag` 或保留原生滚动                                               |
| `useDismiss`                 | `press` 起点 + 组件位移判断                                         |

旧 `Gesture`、`GesturePhaseQueue`、`GestureSemantics`、`useGestureProcess/useGestureSemantics` 已从公共入口移除；相关文件已删除。

---

## 9. 设计依据（简）

- **原生事件优先**：浏览器已经处理输入优先级、合成鼠标事件、滚动取消；不要再造调度器。
- **React Aria `usePress`**：press 是会话，click 是语义确认；但组件侧不需要知道会话内部。
- **Hammer.js #447**：touch + mouse 双管线会双发；鼠标/触摸都走 Pointer Events，按 `pointerType` 过滤。
- **WCAG 2.5.2 / 2.5.7**：激活在 up-event；拖拽必须有单指针替代。
- **Android MotionEvent**：每个事件都带 phase + x/y；标准事件层沿用这个直觉。

---

## 10. 不做

- 不做通用 Gesture/phase/arena/scheduler。
- 不做 hold-repeat；需要时加 `repeat`。
- 不做 pinch/rotate；需要时加 `pinch`。
- 不做长按作为唯一入口；需要长按时加 `longPress` 并提供菜单键/按钮替代。
