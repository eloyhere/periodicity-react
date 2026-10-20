import {
    Children,
    cloneElement,
    isValidElement,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type KeyboardEventHandler,
    type PointerEvent as ReactPointerEvent,
    type PointerEventHandler,
    type ReactElement,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
    type SetStateAction,
} from "react";
import cx from "../foundation/cx";
import useMergedRef from "../foundation/useMergedRef";
import "./Drag.css";

/**
 * Props for a direct child of the sortable container.
 * Type: type alias.
 * Fields: children, aria-describedby, aria-keyshortcuts, tabIndex.
 */
type DragItemProps = {
    children?: ReactNode;
    "aria-describedby"?: string;
    "aria-keyshortcuts"?: string;
    tabIndex?: number;
};

/**
 * Props for the single-slot drag sorter.
 * Type: interface.
 * Fields: children, disabled, className, keyboard, label, onReorder, onReorderStart,
 * onReorderEnd, ref, plus native root attributes and events.
 * @example
 * <Drag label="Playlist" onReorder={(from, to) => reorder(from, to)} data-testid="sortable-list">
 *     <ul><li>One</li><li>Two</li></ul>
 * </Drag>
 */
export interface DragProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children: ReactElement<DragItemProps>;
    disabled?: boolean;
    className?: string;
    keyboard?: boolean;
    label?: string;
    onReorder?: (from: number, to: number, order: readonly number[]) => void;
    onReorderStart?: (index: number) => void;
    onReorderEnd?: (index: number, to: number | null) => void;
    ref?: Ref<HTMLDivElement>;
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

interface DragState {
    index: number;
    startX: number;
    startY: number;
    active: boolean;
}

const DragThreshold: number = 6;
const InteractiveSelector: string = "button, a, input, textarea, select, [contenteditable='true']";
const TextEntrySelector: string = "input, textarea, select, [contenteditable='true']";
const KeyboardShortcuts: string = "Alt+ArrowUp Alt+ArrowDown";
const KeyboardInstructions: string = "Press Alt plus Arrow Up or Alt plus Arrow Down to move this item.";

/**
 * Returns whether an element belongs to a control that owns pointer interaction.
 * @param element - Candidate element.
 * @returns True when the element sits inside an interactive control.
 */
const isInteractive: (element: Element) => boolean = (element: Element): boolean =>
    element.closest(InteractiveSelector) !== null;

/**
 * Returns whether an element belongs to a text-entry control that keeps its native arrow keys.
 * @param element - Candidate element.
 * @returns True when the element sits inside a text-entry control.
 */
const isTextEntry: (element: Element) => boolean = (element: Element): boolean =>
    element.closest(TextEntrySelector) !== null;

/**
 * Finds the nearest sortable row around an element, including the element itself.
 * @param target - Element under the pointer or inside the focused row.
 * @returns The nearest row, or null when the element is not inside a row.
 */
const findNearestRow: (target: Element) => HTMLElement | null = (target: Element): HTMLElement | null =>
    target.closest<HTMLElement>("[data-drag-child]");

/**
 * Finds the nearest row owned by one drag instance, walking out of nested drag sorters.
 * @param target - Element under the pointer or inside the focused row.
 * @param owner - Identifier of the drag instance that owns the row.
 * @returns The owned row, or null when the element is outside the instance.
 */
const findOwnedRow: (target: Element | null, owner: string) => HTMLElement | null = (
    target: Element | null,
    owner: string,
): HTMLElement | null => {
    let row: HTMLElement | null = target === null ? null : findNearestRow(target);

    while (row !== null) {
        if (row.dataset.dragOwner === owner) {
            return row;
        }

        const parent: HTMLElement | null = row.parentElement;
        row = parent === null ? null : parent.closest<HTMLElement>("[data-drag-child]");
    }

    return null;
};

/**
 * Makes every direct child of a single slotted container sortable by pointer or keyboard.
 *
 * Pointer sorting keeps the six-pixel activation threshold and a pointer-following ghost. Keyboard
 * users can focus a sortable child and press Alt plus Arrow Up or Alt plus Arrow Down to move it one
 * position; every successful move is announced through a polite live region and focus follows the moved
 * child. Plain arrow keys are never intercepted, including inside nested inputs, buttons and links.
 *
 * Keyboard moves call `onReorder` only; the pointer lifecycle callbacks `onReorderStart` and
 * `onReorderEnd` keep their existing drag-only meaning.
 *
 * Keyboard sorting is enabled by default; pass `keyboard={false}` to opt out. The `label` prop names the
 * sortable group and falls back to a native `aria-label`.
 *
 * @param props - One container element, optional disabled state, keyboard switch, list label,
 *     reorder callbacks, and native root attributes and events.
 * @example
 * <Drag label="Playlist" onReorder={(from, to) => reorder(from, to)}>
 *     <ul><li>One</li><li>Two</li></ul>
 * </Drag>
 * @returns A single slot whose child elements can be reordered by pointer or keyboard.
 */
const Drag: FC<DragProps> = ({
    children,
    disabled = false,
    className = "",
    keyboard = true,
    label = "",
    onReorder,
    onReorderStart,
    onReorderEnd,
    ref,
    onKeyDown,
    onPointerDown,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    role,
    ...rest
}: DragProps) => {
    const ownerId: string = useId();
    const instructionsId: string = `${ownerId}-instructions`;
    const rootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const mergedRef: RefCallback<HTMLDivElement> = useMergedRef<HTMLDivElement>(rootRef, ref);
    const slots: readonly ReactNode[] = useMemo(
        (): readonly ReactNode[] => Children.toArray(children.props.children),
        [children],
    );
    const indices: readonly number[] = useMemo(
        (): readonly number[] =>
            Array.from({ length: slots.length }, (value: unknown, index: number): number => {
                void value;
                return index;
            }),
        [slots],
    );
    const [order, setOrder]: [
        readonly number[],
        Dispatch<SetStateAction<readonly number[]>>,
    ] = useState<readonly number[]>(indices);
    const [drag, setDrag]: [
        DragState | null,
        Dispatch<SetStateAction<DragState | null>>,
    ] = useState<DragState | null>(null);
    const [announcement, setAnnouncement]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("");
    const lastTargetRef: RefObject<number | null> = useRef<number | null>(null);
    const pendingFocusRef: RefObject<number | null> = useRef<number | null>(null);
    const sourceRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const ghostRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const ghostOffsetRef: RefObject<{ x: number; y: number } | null> = useRef<{
        x: number;
        y: number;
    } | null>(null);
    const safeOrder: readonly number[] = order.length === slots.length ? order : indices;
    const keyboardEnabled: boolean = keyboard && !disabled;
    const resolvedLabel: string = label.length > 0 ? label : (ariaLabel ?? "");
    const resolvedRole: HTMLAttributes<HTMLDivElement>["role"] =
        role ?? (resolvedLabel.length > 0 ? "group" : (void 0));
    const resolvedDescribedBy: string = [ariaDescribedBy ?? "", keyboardEnabled ? instructionsId : ""]
        .filter((value: string): boolean => value.length > 0)
        .join(" ");

    const removeGhost: () => void = (): void => {
        ghostRef.current?.remove();
        ghostRef.current = null;
        ghostOffsetRef.current = null;
        sourceRef.current = null;
    };

    useEffect(
        (): (() => void) => (): void => {
            removeGhost();
        },
        [],
    );

    useEffect((): (() => void) | void => {
        if (drag === null) {
            return;
        }

        const move: (event: PointerEvent) => void = (event: PointerEvent): void => {
            const distance: number = Math.hypot(
                event.clientX - drag.startX,
                event.clientY - drag.startY,
            );

            if (!drag.active && distance < DragThreshold) {
                return;
            }

            if (!drag.active) {
                setDrag({ ...drag, active: true });
                onReorderStart?.(drag.index);
            }

            const source: HTMLElement | null = sourceRef.current;

            if (source !== null) {
                if (ghostRef.current === null) {
                    const rect: DOMRect = source.getBoundingClientRect();
                    const ghost: HTMLElement = source.cloneNode(true) as HTMLElement;
                    ghost.removeAttribute("id");
                    ghost.classList.add("drag__ghost");
                    ghost.style.position = "fixed";
                    ghost.style.left = `${rect.left}px`;
                    ghost.style.top = `${rect.top}px`;
                    ghost.style.width = `${rect.width}px`;
                    ghost.style.height = `${rect.height}px`;
                    ghost.style.margin = "0";
                    ghost.style.pointerEvents = "none";
                    ghost.style.zIndex = "var(--z-toast, 120)";
                    ghost.setAttribute("aria-hidden", "true");
                    document.body.append(ghost);
                    ghostRef.current = ghost;
                    ghostOffsetRef.current = {
                        x: event.clientX - rect.left,
                        y: event.clientY - rect.top,
                    };
                }

                const offset: { x: number; y: number } | null = ghostOffsetRef.current;

                if (ghostRef.current !== null && offset !== null) {
                    ghostRef.current.style.left = `${event.clientX - offset.x}px`;
                    ghostRef.current.style.top = `${event.clientY - offset.y}px`;
                }
            }

            const target: Element | null =
                document.elementFromPoint(event.clientX, event.clientY);
            const row: HTMLElement | null = findOwnedRow(target, ownerId);

            if (row === null) {
                return;
            }

            const to: number = Number(row.dataset.dragIndex);
            const fromPosition: number = safeOrder.indexOf(drag.index);
            const toPosition: number = safeOrder.indexOf(to);

            if (fromPosition < 0 || toPosition < 0 || fromPosition === toPosition) {
                return;
            }

            const next: number[] = [...safeOrder];
            next.splice(fromPosition, 1);
            next.splice(toPosition, 0, drag.index);
            lastTargetRef.current = to;
            setOrder(next);
            onReorder?.(drag.index, to, next);
        };

        const end: () => void = (): void => {
            if (drag.active) {
                onReorderEnd?.(drag.index, lastTargetRef.current);
            }

            lastTargetRef.current = null;
            removeGhost();
            setDrag(null);
        };

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);

        return (): void => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", end);
            window.removeEventListener("pointercancel", end);
        };
    }, [drag, safeOrder, ownerId, onReorder, onReorderStart, onReorderEnd]);

    useLayoutEffect((): void => {
        const slotIndex: number | null = pendingFocusRef.current;

        if (slotIndex === null) {
            return;
        }

        pendingFocusRef.current = null;
        const root: HTMLDivElement | null = rootRef.current;

        if (root === null) {
            return;
        }

        const row: HTMLElement | undefined = Array.from(
            root.querySelectorAll<HTMLElement>("[data-drag-child]"),
        ).find(
            (element: HTMLElement): boolean =>
                element.dataset.dragOwner === ownerId && element.dataset.dragIndex === `${slotIndex}`,
        );

        if (row !== (void 0)) {
            row.focus();
        }
    }, [order, ownerId]);

    const start: PointerEventHandler<HTMLDivElement> = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        if (
            !disabled &&
            event.button === 0 &&
            event.target instanceof Element &&
            !isInteractive(event.target)
        ) {
            const row: HTMLElement | null = findNearestRow(event.target);

            if (row !== null && row.dataset.dragOwner === ownerId) {
                const index: number = Number(row.dataset.dragIndex);

                if (Number.isInteger(index) && index >= 0 && index < slots.length) {
                    event.preventDefault();
                    lastTargetRef.current = null;
                    sourceRef.current = row;
                    setDrag({
                        index,
                        startX: event.clientX,
                        startY: event.clientY,
                        active: false,
                    });
                }
            }
        }

        onPointerDown?.(event);
    };

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        const isMoveKey: boolean = event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown");

        if (
            keyboardEnabled &&
            isMoveKey &&
            event.target instanceof Element &&
            !isTextEntry(event.target)
        ) {
            const row: HTMLElement | null = findNearestRow(event.target);

            if (row !== null && row.dataset.dragOwner === ownerId) {
                const slotIndex: number = Number(row.dataset.dragIndex);
                const fromPosition: number = safeOrder.indexOf(slotIndex);

                if (Number.isInteger(slotIndex) && fromPosition >= 0) {
                    event.preventDefault();

                    const lastPosition: number = safeOrder.length - 1;
                    const toPosition: number =
                        event.key === "ArrowUp"
                            ? Math.max(0, fromPosition - 1)
                            : Math.min(lastPosition, fromPosition + 1);

                    if (toPosition !== fromPosition) {
                        const next: number[] = [...safeOrder];
                        next.splice(fromPosition, 1);
                        next.splice(toPosition, 0, slotIndex);
                        pendingFocusRef.current = slotIndex;
                        setAnnouncement(`Moved to position ${toPosition + 1} of ${safeOrder.length}`);
                        setOrder(next);
                        onReorder?.(slotIndex, safeOrder[toPosition], next);
                    }
                }
            }
        }

        onKeyDown?.(event);
    };

    const ordered: readonly ReactNode[] = safeOrder.map(
        (slotIndex: number, position: number): ReactNode => {
            const slot: ReactNode = slots[slotIndex];

            if (!isValidElement(slot)) {
                return slot;
            }

            const item: ReactElement<Record<string, unknown>> = slot as ReactElement<Record<string, unknown>>;
            const itemProps: DragItemProps = item.props as DragItemProps;
            const dragData: Record<string, unknown> = {};
            dragData["data-drag-child"] = "";
            dragData["data-drag-index"] = slotIndex;
            dragData["data-drag-position"] = position;
            dragData["data-drag-owner"] = ownerId;
            dragData["data-drag-active"] = drag?.index === slotIndex ? "true" : (void 0);

            if (keyboardEnabled) {
                const describedBy: string = [itemProps["aria-describedby"] ?? "", instructionsId]
                    .filter((value: string): boolean => value.length > 0)
                    .join(" ");
                const shortcuts: string = [itemProps["aria-keyshortcuts"] ?? "", KeyboardShortcuts]
                    .filter((value: string): boolean => value.length > 0)
                    .join(" ");
                dragData["tabIndex"] = itemProps.tabIndex ?? 0;
                dragData["aria-describedby"] = describedBy;
                dragData["aria-keyshortcuts"] = shortcuts;
            }

            return cloneElement(item, dragData);
        },
    );

    return (
        <div
            {...rest}
            ref={mergedRef}
            className={cx("drag", disabled && "drag--disabled", className)}
            role={resolvedRole}
            aria-label={resolvedLabel.length > 0 ? resolvedLabel : (void 0)}
            aria-describedby={resolvedDescribedBy.length > 0 ? resolvedDescribedBy : (void 0)}
            data-disabled={disabled ? "true" : "false"}
            onPointerDown={start}
            onKeyDown={handleKeyDown}
        >
            {cloneElement(children, { children: ordered })}
            {keyboardEnabled ? (
                <>
                    <span className="visually-hidden" id={instructionsId}>
                        {KeyboardInstructions}
                    </span>
                    <span className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
                        {announcement}
                    </span>
                </>
            ) : null}
        </div>
    );
};

export default Drag;
