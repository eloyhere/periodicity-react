import {
    Children,
    cloneElement,
    isValidElement,
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type PointerEvent as ReactPointerEvent,
    type PointerEventHandler,
    type ReactElement,
    type ReactNode,
    type Ref,
    type RefObject,
    type SetStateAction,
} from "react";
import cx from "../foundation/cx";
import "./Drag.css";

/**
 * Props for the single-slot drag sorter.
 * Type: interface.
 * Fields: children, disabled, className, onReorder, onReorderStart, onReorderEnd,
 * ref, plus native root attributes and events.
 * @example
 * <Drag onReorder={(from, to) => reorder(from, to)} data-testid="sortable-list">
 *     <ul><li>One</li><li>Two</li></ul>
 * </Drag>
 */
export interface DragProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children: ReactElement<{ children?: ReactNode }>;
    disabled?: boolean;
    className?: string;
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

const isInteractive: (element: Element) => boolean = (element: Element): boolean =>
    element.closest("button, a, input, textarea, select, [contenteditable='true']") !== null;

/**
 * Makes every direct child of a single slotted container draggable.
 * @param props - One container element, optional disabled state, reorder callbacks, and native attributes.
 * @example
 * <Drag onReorder={(from, to) => reorder(from, to)}>
 *     <ul><li>One</li><li>Two</li></ul>
 * </Drag>
 * @returns A single slot whose child elements can be reordered.
 */
const Drag: FC<DragProps> = ({
    children,
    disabled = false,
    className = "",
    onReorder,
    onReorderStart,
    onReorderEnd,
    ref,
    onPointerDown,
    ...rest
}: DragProps) => {
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
    const lastTargetRef: RefObject<number | null> = useRef<number | null>(null);
    const sourceRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const ghostRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const ghostOffsetRef: RefObject<{ x: number; y: number } | null> = useRef<{
        x: number;
        y: number;
    } | null>(null);
    const safeOrder: readonly number[] =
        order.length === slots.length ? order : indices;

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

            if (!drag.active && distance < 6) {
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
            const row: HTMLElement | null | undefined =
                target?.closest<HTMLElement>("[data-drag-child]");

            if (row === null || row === (void 0)) {
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
    }, [drag, safeOrder, onReorder, onReorderStart, onReorderEnd]);

    const start: PointerEventHandler<HTMLDivElement> = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        if (
            !disabled &&
            event.button === 0 &&
            event.target instanceof Element &&
            !isInteractive(event.target)
        ) {
            const row: Element | null = event.target.closest("[data-drag-child]");

            if (row !== null) {
                const index: number = Number((row as HTMLElement).dataset.dragIndex);

                if (!Number.isNaN(index)) {
                    event.preventDefault();
                    lastTargetRef.current = null;
                    sourceRef.current = row as HTMLElement;
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

    const ordered: readonly ReactNode[] = safeOrder.map(
        (slotIndex: number, position: number): ReactNode => {
            const slot: ReactNode = slots[slotIndex];

            if (!isValidElement(slot)) {
                return slot;
            }

            const dragData: Record<string, unknown> = {};
            dragData["data-drag-child"] = "";
            dragData["data-drag-index"] = slotIndex;
            dragData["data-drag-position"] = position;
            dragData["data-drag-active"] =
                drag?.index === slotIndex ? "true" : (void 0);

            return cloneElement(
                slot as ReactElement<Record<string, unknown>>,
                dragData,
            );
        },
    );

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("drag", disabled && "drag--disabled", className)}
            data-disabled={disabled ? "true" : "false"}
            onPointerDown={start}
        >
            {cloneElement(children, { children: ordered })}
        </div>
    );
};

export default Drag;
