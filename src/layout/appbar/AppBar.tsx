import {
    useEffect,
    useMemo,
    useRef,
    type CSSProperties,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
    type RefObject,
} from "react";
import cx from "../../component/foundation/cx";
import {
    AppBarContext,
    useCoordinator,
    type AppBarContextValue,
    type CoordinatorContextValue,
} from "../coordinator/context";
import "../coordinator/Coordinator.css";

/**
 * Scroll behaviour of an AppBar.
 * Type: type alias.
 * Fields: none.
 * @example
 * const behaviour: AppBarScrollBehaviour = "exitUntilCollapsed";
 */
export type AppBarScrollBehaviour = "exitUntilCollapsed" | "enterAlways" | "pinned" | "none";

/**
 * Props for the collapsing app bar.
 * Type: interface.
 * Fields: children, expandedHeight, collapsedHeight, scrollBehaviour, liftOnScroll, onCollapseChange,
 * className, ref, plus native div attributes.
 * @example
 * <AppBar expandedHeight={240} collapsedHeight={64}>
 *     <Collapse><Toolbar title="Explore" /></Collapse>
 * </AppBar>
 */
export interface AppBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children?: ReactNode;
    expandedHeight?: number;
    collapsedHeight?: number;
    scrollBehaviour?: AppBarScrollBehaviour;
    liftOnScroll?: boolean;
    onCollapseChange?: (progress: number) => void;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Collapses from an expanded hero height to a pinned toolbar height as the
 * Coordinator viewport scrolls.
 * @param props - Heights, scroll behaviour, and nested collapse content.
 * @example
 * <AppBar><Collapse><Toolbar title="Explore" /></Collapse></AppBar>
 * @returns A collapsing app-bar container.
 */
const AppBar: FC<AppBarProps> = ({
    children,
    expandedHeight = 240,
    collapsedHeight = 64,
    scrollBehaviour = "exitUntilCollapsed",
    liftOnScroll = true,
    onCollapseChange,
    className = "",
    ref,
    style,
    ...rest
}: AppBarProps) => {
    const { offset }: CoordinatorContextValue = useCoordinator();
    const range: number = Math.max(1, expandedHeight - collapsedHeight);
    const collapsible: boolean =
        scrollBehaviour === "exitUntilCollapsed" || scrollBehaviour === "enterAlways";
    const progress: number = collapsible
        ? Math.min(1, Math.max(0, offset / range))
        : 0;
    const currentHeight: number = expandedHeight - progress * range;
    const lastProgressRef: RefObject<number> = useRef<number>(-1);

    useEffect((): void => {
        if (progress !== lastProgressRef.current) {
            lastProgressRef.current = progress;
            onCollapseChange?.(progress);
        }
    }, [onCollapseChange, progress]);

    const contextValue: AppBarContextValue = useMemo<AppBarContextValue>(
        () => ({ progress, expandedHeight, collapsedHeight }),
        [collapsedHeight, expandedHeight, progress],
    );

    const mergedStyle: CSSProperties = {
        height: `${currentHeight}px`,
        ...style,
    };

    return (
        <AppBarContext.Provider value={contextValue}>
            <div
                {...rest}
                ref={ref}
                className={cx(
                    "app-bar",
                    progress >= 0.98 && "app-bar--collapsed",
                    liftOnScroll && progress > 0.02 && "app-bar--lifted",
                    className,
                )}
                style={mergedStyle}
                data-progress={progress.toFixed(3)}
            >
                {children}
            </div>
        </AppBarContext.Provider>
    );
};

export default AppBar;
