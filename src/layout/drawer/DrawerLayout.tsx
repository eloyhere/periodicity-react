import {
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    type CSSProperties,
    type FC,
    type HTMLAttributes,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import cx from "../../component/foundation/cx";
import useControllableState from "../../component/foundation/useControllableState";
import useMergedRef from "../../component/foundation/useMergedRef";
import "./DrawerLayout.css";

/**
 * Edge from which a drawer opens.
 * Type: type alias.
 * Fields: none.
 * @example
 * const side: DrawerSide = "bottom";
 */
export type DrawerSide = "left" | "right" | "top" | "bottom";

/**
 * Imperative drawer controls exposed through a ref.
 * Type: interface.
 * Fields: open, close, toggle, per-side helpers, isOpen.
 * @example
 * drawer.current?.open("top");
 */
export interface DrawerLayoutHandle {
    open(side: DrawerSide): void;
    close(side: DrawerSide): void;
    toggle(side: DrawerSide): void;
    openLeft(): void;
    closeLeft(): void;
    openRight(): void;
    closeRight(): void;
    openTop(): void;
    closeTop(): void;
    openBottom(): void;
    closeBottom(): void;
    isOpen(side: DrawerSide): boolean;
}

/**
 * Props for the five-region push drawer layout.
 * Type: interface.
 * Fields: left, top, centre, center, right, bottom, open state, callbacks,
 * sizes, labels, className, rootRef, ref, plus native div attributes forwarded to the layout root.
 * @example
 * <DrawerLayout
 *     left={<Navigation />}
 *     centre={<Main />}
 *     top={<Toolbar />}
 *     leftOpen={open}
 * />
 */
export interface DrawerLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    left?: ReactNode;
    top?: ReactNode;
    centre?: ReactNode;
    center?: ReactNode;
    right?: ReactNode;
    bottom?: ReactNode;
    leftOpen?: boolean;
    rightOpen?: boolean;
    topOpen?: boolean;
    bottomOpen?: boolean;
    defaultLeftOpen?: boolean;
    defaultRightOpen?: boolean;
    defaultTopOpen?: boolean;
    defaultBottomOpen?: boolean;
    onLeftOpenChange?: (open: boolean) => void;
    onRightOpenChange?: (open: boolean) => void;
    onTopOpenChange?: (open: boolean) => void;
    onBottomOpenChange?: (open: boolean) => void;
    onLeftOpen?: () => void;
    onLeftClose?: () => void;
    onRightOpen?: () => void;
    onRightClose?: () => void;
    onTopOpen?: () => void;
    onTopClose?: () => void;
    onBottomOpen?: () => void;
    onBottomClose?: () => void;
    onOpenChange?: (side: DrawerSide, open: boolean) => void;
    leftWidth?: number | string;
    rightWidth?: number | string;
    topHeight?: number | string;
    bottomHeight?: number | string;
    leftLabel?: string;
    rightLabel?: string;
    topLabel?: string;
    bottomLabel?: string;
    centreLabel?: string;
    className?: string;
    /** Ref for the native layout root, forwarded alongside the imperative handle. */
    rootRef?: Ref<HTMLDivElement>;
    ref?: Ref<DrawerLayoutHandle>;
}

const sides: readonly DrawerSide[] = ["left", "right", "top", "bottom"];

/**
 * Measures a slot size as a CSS length.
 * @param size - Number of pixels or CSS length.
 * @example
 * const length = slotSize(280);
 * @returns A CSS length string.
 */
const slotSize: (size: number | string) => string = (size: number | string): string =>
    typeof size === "number" ? `${size}px` : size;

/**
 * Android DrawerLayout with left/top/centre/right/bottom slots. Exactly one
 * edge opens at a time and pushes the centre instead of covering it.
 * @param props - Five slots, open state, sizes, and events.
 * @example
 * <DrawerLayout left={<Left />} centre={<Main />} top={<Top />} />
 * @returns A five-region push drawer layout.
 */
const DrawerLayout: FC<DrawerLayoutProps> = ({
    left,
    top,
    centre,
    center,
    right,
    bottom,
    leftOpen: leftOpenProp,
    rightOpen: rightOpenProp,
    topOpen: topOpenProp,
    bottomOpen: bottomOpenProp,
    defaultLeftOpen = false,
    defaultRightOpen = false,
    defaultTopOpen = false,
    defaultBottomOpen = false,
    onLeftOpenChange,
    onRightOpenChange,
    onTopOpenChange,
    onBottomOpenChange,
    onLeftOpen,
    onLeftClose,
    onRightOpen,
    onRightClose,
    onTopOpen,
    onTopClose,
    onBottomOpen,
    onBottomClose,
    onOpenChange,
    leftWidth = 280,
    rightWidth = 280,
    topHeight = 120,
    bottomHeight = 120,
    leftLabel = "Left drawer",
    rightLabel = "Right drawer",
    topLabel = "Top drawer",
    bottomLabel = "Bottom drawer",
    centreLabel,
    className = "",
    rootRef: rootRefProp,
    ref,
    ...rest
}: DrawerLayoutProps) => {
    const [leftOpen, setLeftOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: leftOpenProp,
        defaultValue: defaultLeftOpen,
        onChange: onLeftOpenChange,
    });
    const [rightOpen, setRightOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: rightOpenProp,
        defaultValue: defaultRightOpen,
        onChange: onRightOpenChange,
    });
    const [topOpen, setTopOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: topOpenProp,
        defaultValue: defaultTopOpen,
        onChange: onTopOpenChange,
    });
    const [bottomOpen, setBottomOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: bottomOpenProp,
        defaultValue: defaultBottomOpen,
        onChange: onBottomOpenChange,
    });
    const [lastOpened, setLastOpened]: [
        DrawerSide | null,
        (next: DrawerSide | null) => void,
    ] = useState<DrawerSide | null>(null);
    const previousOpenRef: RefObject<Record<DrawerSide, boolean>> = useRef<
        Record<DrawerSide, boolean>
    >({
        left: leftOpen,
        right: rightOpen,
        top: topOpen,
        bottom: bottomOpen,
    });
    const leftPaneRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const rightPaneRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const topPaneRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const bottomPaneRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const rootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const mergedRootRef: RefCallback<HTMLDivElement> = useMergedRef<HTMLDivElement>(
        rootRef,
        rootRefProp,
    );
    const previousActiveRef: RefObject<DrawerSide | null> = useRef<DrawerSide | null>(null);
    const states: Record<DrawerSide, boolean> = {
        left: leftOpen,
        right: rightOpen,
        top: topOpen,
        bottom: bottomOpen,
    };
    const openSide: DrawerSide | null =
        lastOpened !== null && states[lastOpened]
            ? lastOpened
            : (sides.find((side: DrawerSide): boolean => states[side]) ?? null);
    const active: (side: DrawerSide) => boolean = useCallback(
        (side: DrawerSide): boolean => openSide === side,
        [openSide],
    );
    const leftLength: string = slotSize(leftWidth);
    const rightLength: string = slotSize(rightWidth);
    const topLength: string = slotSize(topHeight);
    const bottomLength: string = slotSize(bottomHeight);
    const centreContent: ReactNode = centre ?? center;

    const setSideOpen: (side: DrawerSide, value: boolean) => void = useCallback(
        (side: DrawerSide, value: boolean): void => {
            if (side === "left") {
                setLeftOpen(value);
            } else if (side === "right") {
                setRightOpen(value);
            } else if (side === "top") {
                setTopOpen(value);
            } else {
                setBottomOpen(value);
            }
        },
        [setBottomOpen, setLeftOpen, setRightOpen, setTopOpen],
    );

    // Close every other edge whenever a new one opens.
    useEffect((): void => {
        const current: Record<DrawerSide, boolean> = {
            left: leftOpen,
            right: rightOpen,
            top: topOpen,
            bottom: bottomOpen,
        };
        const previous: Record<DrawerSide, boolean> = previousOpenRef.current;
        const turnedOn: DrawerSide | null =
            sides.find((side: DrawerSide): boolean => current[side] && !previous[side]) ?? null;
        previousOpenRef.current = current;

        if (turnedOn !== null) {
            setLastOpened(turnedOn);
        }

        const openSides: DrawerSide[] = sides.filter((side: DrawerSide): boolean => current[side]);

        if (openSides.length > 1) {
            const keep: DrawerSide =
                turnedOn ??
                (lastOpened !== null && current[lastOpened] ? lastOpened : openSides[0]);

            for (const side of openSides) {
                if (side !== keep) {
                    setSideOpen(side, false);
                }
            }
        }
    }, [leftOpen, rightOpen, topOpen, bottomOpen, lastOpened, setSideOpen]);


    useEffect((): void => {
        if (openSide !== previousActiveRef.current) {
            const previous: DrawerSide | null = previousActiveRef.current;
            previousActiveRef.current = openSide;

            if (previous !== null) {
                if (previous === "left") {
                    onLeftClose?.();
                } else if (previous === "right") {
                    onRightClose?.();
                } else if (previous === "top") {
                    onTopClose?.();
                } else {
                    onBottomClose?.();
                }

                onOpenChange?.(previous, false);
            }

            if (openSide !== null) {
                if (openSide === "left") {
                    onLeftOpen?.();
                } else if (openSide === "right") {
                    onRightOpen?.();
                } else if (openSide === "top") {
                    onTopOpen?.();
                } else {
                    onBottomOpen?.();
                }

                onOpenChange?.(openSide, true);
            }
        }
    }, [
        openSide,
        onLeftOpen,
        onLeftClose,
        onRightOpen,
        onRightClose,
        onTopOpen,
        onTopClose,
        onBottomOpen,
        onBottomClose,
        onOpenChange,
    ]);

    const paneFor: (side: DrawerSide) => HTMLElement | null = (side: DrawerSide): HTMLElement | null => {
        if (side === "left") {
            return leftPaneRef.current;
        }

        if (side === "right") {
            return rightPaneRef.current;
        }

        if (side === "top") {
            return topPaneRef.current;
        }

        return bottomPaneRef.current;
    };

    useEffect((): (() => void) => {
        if (openSide === null) {
            return (): void => {};
        }

        const handlePointerDown: (event: PointerEvent) => void = (event: PointerEvent): void => {
            const target: Node | null = event.target as Node | null;

            if (target === null) {
                return;
            }

            if (target instanceof Element && target.closest(".drawer-layout__scrim") !== null) {
                return;
            }

            if (rootRef.current !== null && !rootRef.current.contains(target)) {
                event.preventDefault();
                event.stopPropagation();
                setSideOpen(openSide, false);
                return;
            }

            const pane: HTMLElement | null = paneFor(openSide);

            if (pane !== null && !pane.contains(target)) {
                setSideOpen(openSide, false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown, true);

        return (): void => {
            document.removeEventListener("pointerdown", handlePointerDown, true);
        };
    }, [openSide, setSideOpen]);

    const open: (side: DrawerSide) => void = useCallback(
        (side: DrawerSide): void => {
            setLastOpened(side);

            for (const other of sides) {
                setSideOpen(other, other === side);
            }
        },
        [setSideOpen],
    );

    const close: (side: DrawerSide) => void = useCallback(
        (side: DrawerSide): void => {
            setSideOpen(side, false);
        },
        [setSideOpen],
    );

    const toggle: (side: DrawerSide) => void = useCallback(
        (side: DrawerSide): void => {
            if (active(side)) {
                close(side);
            } else {
                open(side);
            }
        },
        [active, close, open],
    );

    const closeActive: () => void = useCallback((): void => {
        if (openSide !== null) {
            setSideOpen(openSide, false);
        }
    }, [openSide, setSideOpen]);

    useImperativeHandle(
        ref,
        (): DrawerLayoutHandle => ({
            open,
            close,
            toggle,
            openLeft: (): void => open("left"),
            closeLeft: (): void => close("left"),
            openRight: (): void => open("right"),
            closeRight: (): void => close("right"),
            openTop: (): void => open("top"),
            closeTop: (): void => close("top"),
            openBottom: (): void => open("bottom"),
            closeBottom: (): void => close("bottom"),
            isOpen: (side: DrawerSide): boolean => active(side),
        }),
        [active, close, open, toggle],
    );

    const scrimStyle: CSSProperties = {
        left: active("left") ? leftLength : "0px",
        right: active("right") ? rightLength : "0px",
        top: active("top") ? topLength : "0px",
        bottom: active("bottom") ? bottomLength : "0px",
    };

    return (
        <div {...rest} ref={mergedRootRef} className={cx("drawer-layout", className)}>
            {left === (void 0) ? null : (
                <aside
                    ref={leftPaneRef}
                    className="drawer-layout__pane drawer-layout__pane--left"
                    style={{ width: active("left") ? leftLength : "0px" }}
                    aria-label={leftLabel}
                    aria-hidden={!active("left")}
                    inert={!active("left")}
                    data-open={active("left") ? "true" : "false"}
                >
                    <div className="drawer-layout__panel" style={{ width: leftLength }}>
                        {left}
                    </div>
                </aside>
            )}

            <div className="drawer-layout__body">
                {top === (void 0) ? null : (
                    <aside
                        ref={topPaneRef}
                        className="drawer-layout__pane drawer-layout__pane--top"
                        style={{ height: active("top") ? topLength : "0px" }}
                        aria-label={topLabel}
                        aria-hidden={!active("top")}
                        inert={!active("top")}
                        data-open={active("top") ? "true" : "false"}
                    >
                        <div className="drawer-layout__panel" style={{ height: topLength }}>
                            {top}
                        </div>
                    </aside>
                )}

                <div
                    className="drawer-layout__centre"
                    role="region"
                    aria-label={centreLabel}
                >
                    {centreContent}
                </div>

                {bottom === (void 0) ? null : (
                    <aside
                        ref={bottomPaneRef}
                        className="drawer-layout__pane drawer-layout__pane--bottom"
                        style={{ height: active("bottom") ? bottomLength : "0px" }}
                        aria-label={bottomLabel}
                        aria-hidden={!active("bottom")}
                        inert={!active("bottom")}
                        data-open={active("bottom") ? "true" : "false"}
                    >
                        <div className="drawer-layout__panel" style={{ height: bottomLength }}>
                            {bottom}
                        </div>
                    </aside>
                )}
            </div>

            {right === (void 0) ? null : (
                <aside
                    ref={rightPaneRef}
                    className="drawer-layout__pane drawer-layout__pane--right"
                    style={{ width: active("right") ? rightLength : "0px" }}
                    aria-label={rightLabel}
                    aria-hidden={!active("right")}
                    inert={!active("right")}
                    data-open={active("right") ? "true" : "false"}
                >
                    <div className="drawer-layout__panel" style={{ width: rightLength }}>
                        {right}
                    </div>
                </aside>
            )}

            {openSide !== null ? (
                <div
                    className="drawer-layout__scrim"
                    aria-hidden="true"
                    style={scrimStyle}
                    onPointerDown={(event: ReactPointerEvent<HTMLDivElement>): void =>
                        event.stopPropagation()
                    }
                    onClick={closeActive}
                />
            ) : null}
        </div>
    );
};

export default DrawerLayout;
