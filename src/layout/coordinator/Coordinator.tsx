import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
    type RefObject,
    type SetStateAction,
    type UIEvent,
} from "react";
import cx from "../../component/foundation/cx";
import Scrollbar from "../../component/scrollbar/Scrollbar";
import useMergedRef from "../../component/foundation/useMergedRef";
import { CoordinatorContext, type CoordinatorContextValue } from "./context";
import "./Coordinator.css";

/**
 * Props for the Coordinator scroll host.
 * Type: interface.
 * Fields: collapse, header, main, collapseHeight, height, scrollRef, onScrollChange, className, ref, plus native div attributes.
 * @example
 * <Coordinator
 *     collapse={<Hero />}
 *     header={<Toolbar title="Explore" />}
 *     main={<p>Content</p>}
 *     height={520}
 * />
 */
export interface CoordinatorProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    collapse?: ReactNode;
    header?: ReactNode;
    main: ReactNode;
    collapseHeight?: number;
    height?: number | string;
    scrollRef?: Ref<HTMLDivElement>;
    onScrollChange?: (offset: number, maxOffset: number) => void;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Hosts a collapsing area above a fixed header and one scrollable main slot.
 * The collapse area shrinks from `collapseHeight` to zero as the main viewport
 * scrolls; the header remains in place.
 * @param props - Collapse, header, main, heights, and native container attributes.
 * @example
 * <Coordinator
 *     collapse={<Hero />}
 *     header={<Toolbar title="Explore" />}
 *     main={<p>Scrollable content</p>}
 * />
 * @returns A coordinator layout with three slots.
 */
const Coordinator: FC<CoordinatorProps> = ({
    collapse,
    header,
    main,
    collapseHeight = 220,
    height = 520,
    scrollRef,
    onScrollChange,
    className = "",
    ref,
    onScroll,
    ...rest
}: CoordinatorProps) => {
    const rootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const viewportRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const mergedRootRef: Ref<HTMLDivElement> = useMergedRef<HTMLDivElement>(ref, rootRef);
    const mergedViewportRef: Ref<HTMLDivElement> = useMergedRef<HTMLDivElement>(
        scrollRef,
        viewportRef,
    );
    const [offset, setOffset]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(0);
    const [maxOffset, setMaxOffset]: [
        number,
        Dispatch<SetStateAction<number>>,
    ] = useState<number>(0);

    const measure: () => void = useCallback((): void => {
        const viewport: HTMLDivElement | null = viewportRef.current;

        if (viewport === null) {
            return;
        }

        setMaxOffset(Math.max(0, viewport.scrollHeight - viewport.clientHeight));
    }, []);

    useEffect((): (() => void) => {
        measure();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure);

            return (): void => window.removeEventListener("resize", measure);
        }

        const observer: ResizeObserver = new ResizeObserver(measure);
        const viewport: HTMLDivElement | null = viewportRef.current;

        if (viewport !== null) {
            observer.observe(viewport);
            if (viewport.firstElementChild !== null) {
                observer.observe(viewport.firstElementChild);
            }
        }

        return (): void => observer.disconnect();
    }, [measure]);

    const scrollTo: (next: number, behavior?: ScrollBehavior) => void = useCallback(
        (next: number, behavior: ScrollBehavior = "smooth"): void => {
            viewportRef.current?.scrollTo({ top: next, behavior });
        },
        [],
    );

    const handleScroll: (event: UIEvent<HTMLDivElement>) => void = (
        event: UIEvent<HTMLDivElement>,
    ): void => {
        const viewport: HTMLDivElement = event.currentTarget;
        const next: number = Math.max(0, viewport.scrollTop);
        setOffset(next);
        setMaxOffset(Math.max(0, viewport.scrollHeight - viewport.clientHeight));
        onScrollChange?.(next, Math.max(0, viewport.scrollHeight - viewport.clientHeight));
        onScroll?.(event);
    };

    const style: CSSProperties = {
        height: typeof height === "number" ? `${height}px` : height,
    };

    const contextValue: CoordinatorContextValue = useMemo<CoordinatorContextValue>(
        () => ({ offset, maxOffset, scrollTo }),
        [maxOffset, offset, scrollTo],
    );
    const currentCollapseHeight: number = Math.max(0, collapseHeight - offset);

    return (
        <CoordinatorContext.Provider value={contextValue}>
            <div
                {...rest}
                ref={mergedRootRef}
                className={cx("coordinator", className)}
                style={{ ...style, ...rest.style }}
                data-offset={offset}
            >
                {collapse === (void 0) ? null : (
                    <div
                        className="coordinator__collapse"
                        style={{ height: `${currentCollapseHeight}px` }}
                        aria-hidden={currentCollapseHeight <= 0 ? "true" : (void 0)}
                        inert={currentCollapseHeight <= 0 ? true : (void 0)}
                    >
                        {collapse}
                    </div>
                )}
                {header === (void 0) ? null : (
                    <div className="coordinator__header">{header}</div>
                )}
                <Scrollbar
                    className="coordinator__scrollbar"
                    height="100%"
                    orientation="vertical"
                    autoHide={false}
                    viewportClassName="coordinator__viewport"
                    viewportRef={mergedViewportRef}
                    onScroll={handleScroll}
                    scrollbarLabel="Coordinator content"
                >
                    {main}
                </Scrollbar>
            </div>
        </CoordinatorContext.Provider>
    );
};

export default Coordinator;
