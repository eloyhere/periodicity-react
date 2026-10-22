import { createContext, useContext } from "react";

/**
 * Scroll state shared by a Coordinator and its collapsing app bar.
 * Type: interface.
 * Fields: offset, maxOffset, collapseOffset, scrollTo.
 * `offset` follows the main viewport scroll position; `collapseOffset` also
 * counts wheel input that the content could not consume, so headers collapse
 * even when the content is too short to scroll.
 * @example
 * const { offset, collapseOffset, scrollTo } = useCoordinator();
 */
export interface CoordinatorContextValue {
    offset: number;
    maxOffset: number;
    collapseOffset: number;
    scrollTo: (offset: number, behavior?: ScrollBehavior) => void;
}

export const CoordinatorContext: ReturnType<typeof createContext<CoordinatorContextValue | null>> =
    createContext<CoordinatorContextValue | null>(null);

/**
 * Reads the nearest Coordinator scroll state.
 * @returns The coordinator state, or a neutral zero state outside a coordinator.
 * @example
 * const coordinator = useCoordinator();
 */
export const useCoordinator: () => CoordinatorContextValue = (): CoordinatorContextValue =>
    useContext(CoordinatorContext) ?? {
        offset: 0,
        maxOffset: 0,
        collapseOffset: 0,
        scrollTo: (): void => {},
    };

/**
 * Collapse progress shared by an AppBar with its Collapse content.
 * Type: interface.
 * Fields: progress, expandedHeight, collapsedHeight.
 * @example
 * const { progress } = useAppBar();
 */
export interface AppBarContextValue {
    progress: number;
    expandedHeight: number;
    collapsedHeight: number;
}

export const AppBarContext: ReturnType<typeof createContext<AppBarContextValue | null>> =
    createContext<AppBarContextValue | null>(null);

/**
 * Reads the nearest AppBar collapse progress.
 * @returns The app-bar state, or a static expanded state outside an app bar.
 * @example
 * const appBar = useAppBar();
 */
export const useAppBar: () => AppBarContextValue = (): AppBarContextValue =>
    useContext(AppBarContext) ?? {
        progress: 0,
        expandedHeight: 240,
        collapsedHeight: 64,
    };
