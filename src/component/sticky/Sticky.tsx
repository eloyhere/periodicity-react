import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
    type SetStateAction,
} from "react";
import cx from "../foundation/cx";
import findScrollContainer from "../foundation/scrollContainer";
import useMergedRef from "../foundation/useMergedRef";
import "./Sticky.css";

/**
 * Edge of the scroll container that a Sticky element pins to.
 * Type: type alias.
 * Fields: none.
 * @example
 * const edge: StickyEdge = "bottom";
 */
export type StickyEdge = "top" | "bottom";

/**
 * Props for the Sticky component.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `title`, `aria-*`, `data-*`,
 * `tabIndex`, and pointer, mouse, keyboard, and focus handlers are forwarded to
 * the sticky element. Sticky only changes layout; it never adds a landmark or a
 * widget role, so the caller owns the semantics of the pinned content.
 * Fields: children, edge, offset, zIndex, filter, disabled, stuckClassName,
 * onStuckChange, className.
 * @example
 * <Sticky offset={64} onStuckChange={setPinned}>
 *     <Toolbar title="Project" />
 * </Sticky>
 */
export interface StickyProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    /**
     * Content that stays pinned while the scroll container moves.
     * @example
     * <Sticky><Toolbar title="Project" /></Sticky>
     */
    children: ReactNode;
    /**
     * Edge that the content pins to; defaults to `top`.
     * @example
     * edge="bottom"
     */
    edge?: StickyEdge;
    /**
     * Distance in pixels between the pinned content and the chosen edge.
     * Use the height of a fixed header, or a small inset when the sticky block
     * should float above the content. Defaults to `0`.
     * @example
     * offset={72}
     */
    offset?: number;
    /**
     * Stacking order applied to the sticky element. Defaults to the
     * `--z-sticky` token so pinned content stays above ordinary content while
     * remaining below dropdowns, overlays, and dialogs.
     * @example
     * zIndex={120}
     */
    zIndex?: number | string;
    /**
     * Native CSS filter applied to the sticky element, and therefore to the
     * sub-page content it wraps. The value uses the same functions and
     * semantics as the CSS `filter` property.
     * @example
     * filter="grayscale(1) contrast(1.1)"
     */
    filter?: CSSProperties["filter"];
    /**
     * Keeps the content in normal flow. The element still renders and still
     * reports `false` to `onStuckChange`, but it no longer sticks.
     * @example
     * disabled={isPrintLayout}
     */
    disabled?: boolean;
    /**
     * Extra class name applied while the content is pinned.
     * @example
     * stuckClassName="card__header--pinned"
     */
    stuckClassName?: string;
    /**
     * Called when the pinned state changes. The initial `false` state is not
     * reported, so the callback only fires for real transitions.
     * @example
     * onStuckChange={(stuck) => setPinned(stuck)}
     */
    onStuckChange?: (stuck: boolean) => void;
    /**
     * Extra class names applied to the sticky element.
     * @example
     * className="card__header"
     */
    className?: string;
    /**
     * Ref forwarded to the sticky element.
     * @example
     * const headerRef = useRef<HTMLDivElement>(null);
     */
    ref?: Ref<HTMLDivElement>;
}

/**
 * Pixel tolerance for sub-pixel layout rounding.
 * Type: number constant.
 * @example
 * const line: number = rootTop + offset + StickyTolerance;
 */
const StickyTolerance: number = 0.5;

/**
 * Pins its content to the top or bottom edge of the nearest scroll container
 * and reports whether the content is currently stuck.
 *
 * The component uses CSS `position: sticky` for the pinning, so there is no
 * portal, no duplicate content, and normal flow keeps the space reserved. A
 * passive scroll listener plus `ResizeObserver` update the stuck state only
 * when the pinned flag actually changes, which keeps scroll work proportional
 * to real state transitions rather than to rendered content.
 * @param props - Edge, offset, stacking order, disabled state, stuck styling,
 * state callback, class names, and native div attributes.
 * @example
 * <Sticky offset={72} stuckClassName="toolbar--pinned">
 *     <Toolbar title="Project" />
 * </Sticky>
 * @returns A single element that sticks inside its nearest scroll container.
 */
const Sticky: FC<StickyProps> = ({
    children,
    edge = "top",
    offset = 0,
    zIndex,
    filter,
    disabled = false,
    stuckClassName = "",
    onStuckChange,
    className = "",
    style,
    ref,
    ...rest
}: StickyProps) => {
    const nodeRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const mergedRef: RefCallback<HTMLDivElement> = useMergedRef<HTMLDivElement>(ref, nodeRef);
    const callbackRef: RefObject<StickyProps["onStuckChange"]> = useRef(onStuckChange);
    const reportedRef: RefObject<boolean> = useRef<boolean>(false);
    const [stuck, setStuck]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);

    useEffect((): void => {
        callbackRef.current = onStuckChange;
    }, [onStuckChange]);

    useEffect((): void => {
        if (reportedRef.current === stuck) {
            return;
        }

        reportedRef.current = stuck;
        callbackRef.current?.(stuck);
    }, [stuck]);

    useEffect((): (() => void) | void => {
        const node: HTMLDivElement | null = nodeRef.current;

        if (node === null || disabled || typeof window === "undefined") {
            setStuck(false);

            return;
        }

        const container: HTMLElement | null = findScrollContainer(node);
        const borderBottom: number =
            container === null
                ? 0
                : Number.parseFloat(window.getComputedStyle(container).borderBottomWidth);
        const borderBottomWidth: number = Number.isFinite(borderBottom) ? borderBottom : 0;
        let frame: number | null = null;

        const measure: () => void = (): void => {
            const rect: DOMRect = node.getBoundingClientRect();

            if (edge === "top") {
                const rootTop: number = container === null ? 0 : container.getBoundingClientRect().top;
                const line: number = rootTop + (container?.clientTop ?? 0) + offset;
                const scrolled: boolean =
                    container === null ? window.scrollY > StickyTolerance : container.scrollTop > StickyTolerance;
                const next: boolean =
                    scrolled &&
                    rect.top <= line + StickyTolerance &&
                    rect.bottom > line + StickyTolerance;

                setStuck((previous: boolean): boolean => (previous === next ? previous : next));

                return;
            }

            const rootBottom: number =
                container === null
                    ? window.innerHeight
                    : container.getBoundingClientRect().bottom - borderBottomWidth;
            const line: number = rootBottom - offset;
            const atEnd: boolean =
                container === null
                    ? window.scrollY + window.innerHeight >=
                      (document.scrollingElement?.scrollHeight ?? document.documentElement.scrollHeight) -
                          StickyTolerance
                    : container.scrollHeight - container.scrollTop - container.clientHeight <=
                      StickyTolerance;
            const next: boolean =
                !atEnd &&
                rect.top < line - StickyTolerance &&
                rect.bottom >= line - StickyTolerance;

            setStuck((previous: boolean): boolean => (previous === next ? previous : next));
        };

        const schedule: () => void = (): void => {
            if (typeof window.requestAnimationFrame !== "function") {
                measure();

                return;
            }

            if (frame !== null) {
                return;
            }

            frame = window.requestAnimationFrame((): void => {
                frame = null;
                measure();
            });
        };

        measure();

        const scrollTarget: HTMLElement | Window = container ?? window;

        scrollTarget.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);

        const observer: ResizeObserver | null =
            typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);

        observer?.observe(node);

        if (container !== null) {
            observer?.observe(container);
        }

        return (): void => {
            scrollTarget.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            observer?.disconnect();

            if (frame !== null && typeof window.cancelAnimationFrame === "function") {
                window.cancelAnimationFrame(frame);
            }
        };
    }, [disabled, edge, offset]);

    const stickyStyle: CSSProperties = {
        ...style,
        ...(edge === "top" ? { top: offset } : { bottom: offset }),
        ...(zIndex === (void 0) ? {} : { zIndex }),
        ...(filter === (void 0) ? {} : { filter }),
    };
    const isStuck: boolean = stuck && !disabled;

    return (
        <div
            {...rest}
            ref={mergedRef}
            className={cx(
                "sticky",
                `sticky--${edge}`,
                disabled && "sticky--disabled",
                isStuck && "sticky--stuck",
                isStuck && stuckClassName,
                className,
            )}
            style={stickyStyle}
            data-edge={edge}
            data-stuck={isStuck ? "true" : "false"}
        >
            {children}
        </div>
    );
};

export default Sticky;
