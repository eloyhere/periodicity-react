import {
    Children,
    isValidElement,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    type FC,
    type KeyboardEventHandler,
    type ReactNode,
    type Ref,
    type RefObject,
    type UIEventHandler,
} from "react";
import cx from "../../component/foundation/cx";
import useControllableState from "../../component/foundation/useControllableState";
import "./Pager.css";

/**
 * Scroll behaviour used by imperative pager navigation.
 * Type: interface.
 * Fields: behavior.
 * @example
 * pager.current?.goTo("two", { behavior: "auto" });
 */
export interface PagerScrollOptions {
    behavior?: ScrollBehavior;
}

/**
 * Imperative pager controls exposed through a ref.
 * Type: interface.
 * Fields: goTo, scrollTo, next, previous, getRoute, getIndex.
 * @example
 * pager.current?.goTo("settings");
 */
export interface PagerHandle {
    goTo(route: string | number, options?: PagerScrollOptions): void;
    scrollTo(route: string | number, options?: PagerScrollOptions): void;
    next(): void;
    previous(): void;
    getRoute(): string;
    getIndex(): number;
}

/**
 * Props for one routed pager page.
 * Type: interface.
 * Fields: route, label, children, className.
 * @example
 * <PagerPage route="today">...</PagerPage>
 */
export interface PagerPageProps {
    route: string;
    label?: string;
    children: ReactNode;
    className?: string;
}

/**
 * Declares a route for a pager child. The Pager reads `route` and renders the content.
 * @param props - Route metadata and content.
 * @example
 * <PagerPage route="week">Week</PagerPage>
 * @returns The page content.
 */
export const PagerPage: FC<PagerPageProps> = ({ children }: PagerPageProps) => <>{children}</>;

/**
 * Props for the horizontal pager.
 * Type: interface.
 * Fields: children, value, defaultValue, route, defaultRoute, onChange, onRouteChange,
 * ariaLabel, className, ref.
 * @example
 * <Pager value={page} onChange={setPage}>...</Pager>
 */
export interface PagerProps {
    children: ReactNode;
    value?: number;
    defaultValue?: number;
    route?: string;
    defaultRoute?: string;
    onChange?: (value: number) => void;
    onRouteChange?: (route: string, index: number) => void;
    ariaLabel?: string;
    className?: string;
    ref?: Ref<PagerHandle>;
}

/**
 * Swipeable, scroll-snapped page container with controlled and uncontrolled state.
 * @param props - Pages and active index.
 * @example
 * <Pager defaultValue={0}><Page /><Page /></Pager>
 * @returns A horizontal pager.
 */
const Pager: FC<PagerProps> = ({
    children,
    value,
    defaultValue = 0,
    onChange,
    route,
    defaultRoute,
    onRouteChange,
    ariaLabel = "Pages",
    className = "",
    ref,
}: PagerProps) => {
    const trackRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const programmaticRef: RefObject<boolean> = useRef<boolean>(false);
    const programmaticTimerRef: RefObject<number | null> = useRef<number | null>(null);
    const targetRef: RefObject<number | null> = useRef<number | null>(null);
    const routeDrivenRef: RefObject<boolean> = useRef<boolean>(false);
    const scrollTimerRef: RefObject<number | null> = useRef<number | null>(null);
    const pages: ReactNode[] = Children.toArray(children);
    const routes: string[] = pages.map((page: ReactNode, index: number): string => {
        if (isValidElement<PagerPageProps>(page) && typeof page.props.route === "string") {
            return page.props.route;
        }

        return `${index}`;
    });
    const routesKey: string = routes.join("|");
    const defaultIndex: number =
        defaultRoute === (void 0) ? defaultValue : Math.max(0, routes.indexOf(defaultRoute));
    const [active, setActive]: readonly [
        number,
        (next: number | ((previous: number) => number)) => void,
    ] = useControllableState<number>({
        value,
        defaultValue: defaultIndex,
        onChange,
    });
    const activeRoute: string = routes[active] ?? "";
    const previousRouteRef: RefObject<string> = useRef<string>(activeRoute);
    const activeRef: RefObject<number> = useRef<number>(active);

    useEffect((): void => {
        activeRef.current = active;
    }, [active]);

    useEffect((): (() => void) | void => {
        if (route === (void 0)) {
            return;
        }

        const timeout: number = window.setTimeout((): void => {
            const index: number = routesKey.split("|").indexOf(route);

            if (index >= 0 && index !== activeRef.current) {
                routeDrivenRef.current = true;
                setActive(index);
            }
        }, 60);

        return (): void => {
            window.clearTimeout(timeout);
        };
    }, [route, routesKey, setActive]);

    useEffect((): void => {
        if (activeRoute !== previousRouteRef.current) {
            previousRouteRef.current = activeRoute;
            const routeDriven: boolean = routeDrivenRef.current;
            routeDrivenRef.current = false;

            if (!routeDriven) {
                onRouteChange?.(activeRoute, active);
            }
        }
    }, [activeRoute, active, onRouteChange]);

    const markProgrammatic: (index: number) => void = useCallback((index: number): void => {
        programmaticRef.current = true;
        targetRef.current = index;

        if (programmaticTimerRef.current !== null) {
            window.clearTimeout(programmaticTimerRef.current);
        }

        programmaticTimerRef.current = window.setTimeout((): void => {
            programmaticRef.current = false;
            programmaticTimerRef.current = null;
        }, 600);
    }, []);

    useEffect((): (() => void) => {
        const node: HTMLDivElement | null = trackRef.current;

        if (node === null || node.clientWidth === 0) {
            return (): void => {};
        }

        const target: number = active * node.clientWidth;

        if (Math.abs(node.scrollLeft - target) > 1) {
            markProgrammatic(active);
            node.scrollTo({ left: target, behavior: "smooth" });
        }

        const observer: ResizeObserver | null =
            typeof ResizeObserver === "undefined" ? null : new ResizeObserver((): void => {
                node.scrollTo({ left: active * node.clientWidth, behavior: "auto" });
            });
        observer?.observe(node);

        return (): void => {
            observer?.disconnect();
        };
    }, [active, markProgrammatic]);

    useEffect(
        (): (() => void) => (): void => {
            if (programmaticTimerRef.current !== null) {
                window.clearTimeout(programmaticTimerRef.current);
            }

            if (scrollTimerRef.current !== null) {
                window.clearTimeout(scrollTimerRef.current);
            }
        },
        [],
    );

    const handleScroll: UIEventHandler<HTMLDivElement> = (
        event: Parameters<UIEventHandler<HTMLDivElement>>[0],
    ): void => {
        if (programmaticRef.current) {
            return;
        }

        const node: HTMLDivElement = event.currentTarget;

        if (scrollTimerRef.current !== null) {
            window.clearTimeout(scrollTimerRef.current);
        }

        scrollTimerRef.current = window.setTimeout((): void => {
            scrollTimerRef.current = null;

            if (node.clientWidth === 0) {
                return;
            }

            const next: number = Math.round(node.scrollLeft / node.clientWidth);
            const target: number | null = targetRef.current;

            if (target !== null) {
                if (next === target) {
                    targetRef.current = null;
                }

                return;
            }

            if (next !== activeRef.current && next >= 0 && next < pages.length) {
                routeDrivenRef.current = false;
                setActive(next);
            }
        }, 80);
    };

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (
        event: Parameters<KeyboardEventHandler<HTMLDivElement>>[0],
    ): void => {
        const select: (next: number) => void = (next: number): void => {
            routeDrivenRef.current = false;
            targetRef.current = null;
            programmaticRef.current = false;
            setActive(next);
        };

        if (event.key === "ArrowRight" && active < pages.length - 1) {
            event.preventDefault();
            select(active + 1);
        } else if (event.key === "ArrowLeft" && active > 0) {
            event.preventDefault();
            select(active - 1);
        } else if (event.key === "Home") {
            event.preventDefault();
            select(0);
        } else if (event.key === "End") {
            event.preventDefault();
            select(pages.length - 1);
        }
    };

    const handlePointerDown: () => void = (): void => {
        targetRef.current = null;
        programmaticRef.current = false;
    };

    const scrollToIndex: (index: number, behavior: ScrollBehavior) => void = useCallback(
        (index: number, behavior: ScrollBehavior): void => {
            const node: HTMLDivElement | null = trackRef.current;

            if (node !== null && node.clientWidth > 0) {
                markProgrammatic(index);
                node.scrollTo({ left: index * node.clientWidth, behavior });
            }
        },
        [markProgrammatic],
    );

    const resolveIndex: (target: string | number) => number = useCallback(
        (target: string | number): number =>
            typeof target === "number" ? target : routes.indexOf(target),
        [routes],
    );

    const goTo: (target: string | number, options?: PagerScrollOptions) => void = useCallback(
        (target: string | number, options: PagerScrollOptions = {}): void => {
            const index: number = resolveIndex(target);

            if (index < 0 || index >= pages.length) {
                return;
            }

            setActive(index);
            routeDrivenRef.current = false;
            scrollToIndex(index, options.behavior ?? "smooth");
        },
        [pages.length, resolveIndex, scrollToIndex, setActive],
    );

    const scrollOnly: (target: string | number, options?: PagerScrollOptions) => void = useCallback(
        (target: string | number, options: PagerScrollOptions = {}): void => {
            const index: number = resolveIndex(target);

            if (index >= 0 && index < pages.length) {
                scrollToIndex(index, options.behavior ?? "auto");
            }
        },
        [pages.length, resolveIndex, scrollToIndex],
    );

    useImperativeHandle(
        ref,
        (): PagerHandle => ({
            goTo,
            scrollTo: scrollOnly,
            next: (): void => goTo(active + 1),
            previous: (): void => goTo(active - 1),
            getRoute: (): string => routes[active] ?? "",
            getIndex: (): number => active,
        }),
        [active, goTo, routes, scrollOnly],
    );

    return (
        <div
            ref={trackRef}
            className={cx("pager", className)}
            role="region"
            aria-roledescription="carousel"
            aria-label={ariaLabel}
            tabIndex={0}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
        >
            {pages.map((page: ReactNode, index: number): ReactNode => {
                const pageProps: PagerPageProps | null = isValidElement<PagerPageProps>(page)
                    ? page.props
                    : null;

                return (
                    <div
                        className={cx("pager__page", pageProps?.className ?? "")}
                        key={routes[index]}
                        role="group"
                        aria-roledescription="slide"
                        aria-label={pageProps?.label ?? routes[index]}
                        aria-hidden={index !== active}
                        inert={index !== active}
                        data-route={routes[index]}
                    >
                        {page}
                    </div>
                );
            })}
        </div>
    );
};

export default Pager;
