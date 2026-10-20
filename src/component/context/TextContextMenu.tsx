import {
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type FC,
    type KeyboardEvent as ReactKeyboardEvent,
    type RefObject,
    type SetStateAction,
} from "react";
import Icon from "../icon/Icon";
import Portal from "../foundation/Portal";
import Surface from "../surface/Surface";
import useDismiss from "../foundation/useDismiss";
import "./TextContextMenu.css";

interface TextTarget {
    element: HTMLElement;
    editable: boolean;
}

interface TextMenuState extends TextTarget {
    x: number;
    y: number;
    range: Range | null;
}

interface PressState extends TextTarget {
    x: number;
    y: number;
}

const resolveTarget: (element: Element) => TextTarget | null = (
    element: Element,
): TextTarget | null => {
    const field: HTMLElement | null = element.closest<HTMLElement>(
        "input, textarea, [contenteditable='true']",
    );
    const text: HTMLElement | null = element.closest<HTMLElement>(
        ".text, .selectable, pre, code",
    );
    const target: HTMLElement | null = field ?? text;

    if (target === null) {
        return null;
    }

    if (
        target instanceof HTMLInputElement &&
        ["checkbox", "radio", "range", "color", "file", "button", "submit", "reset", "image"].includes(
            target.type,
        )
    ) {
        return null;
    }

    return {
        element: target,
        editable:
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target.isContentEditable,
    };
};

/**
 * Native context menu replaced by Copy, Paste, and Select for text fields and
 * selectable text components. Opens on right-click and 500ms long press.
 * @example
 * <TextContextMenu />
 * @returns A singleton document-level text menu.
 */
const TextContextMenu: FC = () => {
    const panelRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const timerRef: RefObject<number | null> = useRef<number | null>(null);
    const pressRef: RefObject<PressState | null> = useRef<PressState | null>(null);
    const [menu, setMenu]: [
        TextMenuState | null,
        Dispatch<SetStateAction<TextMenuState | null>>,
    ] = useState<TextMenuState | null>(null);

    const clearPress: () => void = (): void => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        pressRef.current = null;
    };

    const openAt: (x: number, y: number, target: TextTarget) => void = (
        x: number,
        y: number,
        target: TextTarget,
    ): void => {
        const selection: Selection | null = window.getSelection();
        const range: Range | null =
            selection !== null && selection.rangeCount > 0
                ? selection.getRangeAt(0).cloneRange()
                : null;
        setMenu({ x, y, range, ...target });
    };

    useEffect((): (() => void) => {
        const context: (event: MouseEvent) => void = (event: MouseEvent): void => {
            if (!(event.target instanceof Element)) {
                return;
            }

            if (event.target.closest('[role="menu"]') !== null) {
                return;
            }

            const target: TextTarget | null = resolveTarget(event.target);

            if (target === null) {
                return;
            }

            event.preventDefault();
            openAt(event.clientX, event.clientY, target);
        };

        const down: (event: PointerEvent) => void = (event: PointerEvent): void => {
            if (event.pointerType === "mouse" || event.button !== 0) {
                return;
            }

            if (!(event.target instanceof Element)) {
                return;
            }

            if (event.target.closest('[role="menu"]') !== null) {
                return;
            }

            const target: TextTarget | null = resolveTarget(event.target);

            if (target === null) {
                return;
            }

            clearPress();
            pressRef.current = {
                x: event.clientX,
                y: event.clientY,
                ...target,
            };
            timerRef.current = window.setTimeout((): void => {
                const press: PressState | null = pressRef.current;

                if (press !== null) {
                    openAt(press.x, press.y, press);
                }
            }, 500);
        };

        const move: (event: PointerEvent) => void = (event: PointerEvent): void => {
            const press: PressState | null = pressRef.current;

            if (
                press !== null &&
                (Math.abs(event.clientX - press.x) > 8 ||
                    Math.abs(event.clientY - press.y) > 8)
            ) {
                clearPress();
            }
        };

        const up: () => void = (): void => clearPress();

        document.addEventListener("contextmenu", context);
        document.addEventListener("pointerdown", down);
        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", up);
        document.addEventListener("pointercancel", up);

        return (): void => {
            document.removeEventListener("contextmenu", context);
            document.removeEventListener("pointerdown", down);
            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerup", up);
            document.removeEventListener("pointercancel", up);
            clearPress();
        };
    }, []);

    useDismiss({
        enabled: menu !== null,
        refs: [panelRef],
        onDismiss: (): void => setMenu(null),
    });

    useEffect((): void => {
        if (menu !== null) {
            panelRef.current
                ?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
                ?.focus({ preventScroll: true });
        }
    }, [menu]);

    const close: () => void = (): void => setMenu(null);

    const selectedText: (state: TextMenuState) => string = (
        state: TextMenuState,
    ): string => {
        if (
            state.element instanceof HTMLInputElement ||
            state.element instanceof HTMLTextAreaElement
        ) {
            const start: number = state.element.selectionStart ?? 0;
            const end: number = state.element.selectionEnd ?? state.element.value.length;

            return state.element.value.slice(start, end);
        }

        const selection: Selection | null = window.getSelection();

        return selection === null ? "" : `${selection}`;
    };

    const copy: () => void = (): void => {
        if (menu === null) {
            return;
        }

        const selected: string = selectedText(menu);
        const value: string =
            selected.length > 0
                ? selected
                : menu.element instanceof HTMLInputElement ||
                    menu.element instanceof HTMLTextAreaElement
                  ? menu.element.value
                  : menu.element.textContent ?? "";

        if (value.length > 0) {
            void navigator.clipboard?.writeText(value);
        }

        close();
    };

    const paste: () => Promise<void> = async (): Promise<void> => {
        if (menu === null || !menu.editable) {
            return;
        }

        const state: TextMenuState = menu;
        close();

        try {
            const text: string = await navigator.clipboard.readText();

            if (
                state.element instanceof HTMLInputElement ||
                state.element instanceof HTMLTextAreaElement
            ) {
                const start: number =
                    state.element.selectionStart ?? state.element.value.length;
                const end: number = state.element.selectionEnd ?? start;
                const next: string = `${state.element.value.slice(0, start)}${text}${state.element.value.slice(end)}`;
                const prototype: object =
                    state.element instanceof HTMLTextAreaElement
                        ? HTMLTextAreaElement.prototype
                        : HTMLInputElement.prototype;
                const setter: ((value: string) => void) | undefined =
                    Object.getOwnPropertyDescriptor(prototype, "value")?.set as
                        | ((value: string) => void)
                        | undefined;

                setter?.call(state.element, next);
                state.element.focus({ preventScroll: true });
                state.element.setSelectionRange(start + text.length, start + text.length);
                state.element.dispatchEvent(new Event("input", { bubbles: true }));
                return;
            }

            state.element.focus({ preventScroll: true });
            const selection: Selection | null = window.getSelection();

            if (selection !== null && state.range !== null) {
                selection.removeAllRanges();
                selection.addRange(state.range);
            }

            document.execCommand("insertText", false, text);
        } catch {
            // Clipboard permission can be denied; the menu simply closes.
        }
    };

    const select: () => void = (): void => {
        if (menu === null) {
            return;
        }

        const target: HTMLElement = menu.element;

        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            target.focus({ preventScroll: true });
            target.select();
        } else {
            const selection: Selection | null = window.getSelection();

            if (selection !== null) {
                const range: Range = document.createRange();
                range.selectNodeContents(target);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }

        close();
    };

    if (menu === null) {
        return null;
    }

    return (
        <Portal>
            <Surface
                ref={panelRef}
                className="context-menu__panel text-menu"
                style={{
                    position: "fixed",
                    top: Math.max(8, Math.min(menu.y, window.innerHeight - 160)),
                    left: Math.max(8, Math.min(menu.x, window.innerWidth - 180)),
                    zIndex: "var(--z-dropdown)",
                }}
                elevation={3}
                shape="sm"
                tone="neutral"
                role="menu"
                tabIndex={-1}
                aria-label="Text actions"
                onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>): void => {
                    if (event.key === "Escape") {
                        event.preventDefault();
                        close();
                    }
                }}
            >
                <div className="context-menu__header">Text</div>
                <div className="context-menu__item">
                    <button
                        type="button"
                        role="menuitem"
                        className="context-menu__item-control"
                        onClick={copy}
                    >
                        <span className="context-menu__item-icon">
                            <Icon name="Clipboard" size={15} />
                        </span>
                        <span className="context-menu__item-label">Copy</span>
                    </button>
                </div>
                <div className="context-menu__item">
                    <button
                        type="button"
                        role="menuitem"
                        className="context-menu__item-control"
                        disabled={!menu.editable}
                        onClick={(): void => {
                            void paste();
                        }}
                    >
                        <span className="context-menu__item-icon">
                            <Icon name="Clipboard" size={15} />
                        </span>
                        <span className="context-menu__item-label">Paste</span>
                    </button>
                </div>
                <div className="context-menu__item">
                    <button
                        type="button"
                        role="menuitem"
                        className="context-menu__item-control"
                        onClick={select}
                    >
                        <span className="context-menu__item-icon">
                            <Icon name="Select" size={15} />
                        </span>
                        <span className="context-menu__item-label">Select</span>
                    </button>
                </div>
            </Surface>
        </Portal>
    );
};

export default TextContextMenu;
