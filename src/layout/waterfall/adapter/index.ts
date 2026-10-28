import type { ListAdapter } from "../../list/adapter";
import { createListAdapter } from "../../list/adapter";
import { optionKey } from "../../list/node";

/**
 * Default card model understood by the adapter when no extractors are supplied.
 * Type: interface.
 * Fields: id, height.
 * @example
 * const card: WaterfallItem = { id: "hero", height: 220 };
 */
export interface WaterfallItem {
    id: string;
    height: number;
}

/**
 * One card after column placement.
 * Type: interface.
 * Fields: index, key, column, top, height, bottom.
 * `top` is relative to the top of its column, and `bottom` is `top + height`.
 * @example
 * const placement: WaterfallPlacement = {
 *     index: 0,
 *     key: "card-0",
 *     column: 0,
 *     top: 0,
 *     height: 120,
 *     bottom: 120,
 * };
 */
export interface WaterfallPlacement {
    readonly index: number;
    readonly key: string;
    readonly column: number;
    readonly top: number;
    readonly height: number;
    readonly bottom: number;
}

/**
 * One column of a waterfall arrangement.
 * Type: interface.
 * Fields: index, height, placements.
 * Placements are ordered from the top of the column to the bottom.
 * @example
 * const column: WaterfallColumn = { index: 0, height: 280, placements: [] };
 */
export interface WaterfallColumn {
    readonly index: number;
    readonly height: number;
    readonly placements: readonly WaterfallPlacement[];
}

/**
 * Result of placing every card into balanced columns.
 * Type: interface.
 * Fields: columnCount, gap, columns, height.
 * @example
 * const arrangement = adapter.arrange({ columns: 3, gap: 12 });
 */
export interface WaterfallArrangement {
    readonly columnCount: number;
    readonly gap: number;
    readonly columns: readonly WaterfallColumn[];
    /** Height of the tallest column in CSS pixels; this is the scroll content height. */
    readonly height: number;
}

/**
 * Options for placing cards into columns.
 * Type: interface.
 * Fields: columns, gap.
 * @example
 * const options: WaterfallArrangeOptions = { columns: 3, gap: 12 };
 */
export interface WaterfallArrangeOptions {
    columns: number;
    gap?: number;
}

/**
 * Metadata extractors and fallback height for a waterfall adapter.
 * Type: interface.
 * Fields: getKey, getHeight, itemHeight.
 * When omitted, keys fall back to an `id` (or standard list-option value), and
 * heights fall back to a numeric `height` field before `itemHeight`.
 * @example
 * const options: WaterfallAdapterOptions<Card> = {
 *     getKey: (card) => card.id,
 *     getHeight: (card) => card.height,
 * };
 */
export interface WaterfallAdapterOptions<T = WaterfallItem> {
    getKey?: (item: T, index: number) => string;
    /** Resolves the card height in CSS pixels; omit to read a numeric `height` field. */
    getHeight?: (item: T, index: number) => number;
    /** Fallback height for cards without a usable height; defaults to 160. */
    itemHeight?: number;
}

/**
 * Indexed adapter with the heights and column placement needed by a virtual waterfall.
 * Type: interface.
 * Fields: size, keys, getKey, getItem, getEntry, indexOf, getRange, heights,
 * getHeight, arrange.
 * `arrange` returns a cached arrangement while the column count and gap stay
 * unchanged, so repeated renders do not recompute every position.
 * @example
 * const adapter: WaterfallAdapter<Card> = createWaterfallAdapter(cards, {
 *     getKey: (card) => card.id,
 *     getHeight: (card) => card.height,
 * });
 */
export interface WaterfallAdapter<T = WaterfallItem> extends ListAdapter<T> {
    readonly heights: readonly number[];
    getHeight(index: number): number;
    arrange(options: WaterfallArrangeOptions): WaterfallArrangement;
}

/**
 * Default height used when a card does not provide one.
 * Type: constant.
 * Fields: none.
 * @example
 * const height = DefaultWaterfallHeight;
 */
const DefaultWaterfallHeight: number = 160;

/**
 * Clamps a height to a non-negative finite pixel value.
 * @param height - Candidate height.
 * @param fallback - Value used when the candidate is not finite.
 * @example
 * const height = normaliseHeight(Number.NaN, 160);
 * @returns A finite, non-negative height.
 */
const normaliseHeight: (height: number, fallback: number) => number = (
    height: number,
    fallback: number,
): number => (Number.isFinite(height) ? Math.max(0, height) : fallback);

/**
 * Checks whether a value can carry named fields.
 * @param value - Candidate item.
 * @example
 * const record = isRecord({ id: "a", height: 120 });
 * @returns True for non-null objects.
 */
const isRecord: (value: unknown) => value is Record<string, unknown> = (
    value: unknown,
): value is Record<string, unknown> => typeof value === "object" && value !== null;

/**
 * Resolves a default key from an `id` field, then from a standard list option.
 * @param item - Card to identify.
 * @param index - Card position.
 * @example
 * const key = defaultKey({ id: "hero", height: 220 }, 0);
 * @returns A stable key.
 */
const defaultKey: <T>(item: T, index: number) => string = <T>(
    item: T,
    index: number,
): string => {
    if (isRecord(item)) {
        const id: unknown = item.id;

        if (typeof id === "string" || typeof id === "number") {
            return `${id}`;
        }
    }

    return optionKey(item, index);
};

/**
 * Resolves a default height from a numeric `height` field.
 * @param item - Card to measure.
 * @param fallback - Height used when the field is absent or not finite.
 * @example
 * const height = defaultHeight({ id: "hero", height: 220 }, 160);
 * @returns The resolved card height.
 */
const defaultHeight: <T>(item: T, fallback: number) => number = <T>(
    item: T,
    fallback: number,
): number => {
    if (isRecord(item) && typeof item.height === "number") {
        return normaliseHeight(item.height, fallback);
    }

    return fallback;
};

/**
 * Places cards into the shortest column, in source order.
 * @param heights - Card heights in source order.
 * @param columns - Column count.
 * @param gap - Vertical and horizontal gap in CSS pixels.
 * @param getKey - Resolves the stable key of one card.
 * @example
 * const arrangement = placeWaterfall([120, 80, 160], 2, 12, adapter.getKey);
 * @returns Columns, their placements, and the total content height.
 */
const placeWaterfall: (
    heights: readonly number[],
    columns: number,
    gap: number,
    getKey: (index: number) => string,
) => WaterfallArrangement = (
    heights: readonly number[],
    columns: number,
    gap: number,
    getKey: (index: number) => string,
): WaterfallArrangement => {
    const columnPlacements: WaterfallPlacement[][] = Array.from(
        { length: columns },
        (): WaterfallPlacement[] => [],
    );
    const columnHeights: number[] = new Array<number>(columns).fill(0);

    for (let index: number = 0; index < heights.length; index += 1) {
        let column: number = 0;

        for (let candidate: number = 1; candidate < columns; candidate += 1) {
            if (columnHeights[candidate] < columnHeights[column]) {
                column = candidate;
            }
        }

        const top: number = columnHeights[column];
        const height: number = heights[index];
        const placement: WaterfallPlacement = {
            index,
            key: getKey(index),
            column,
            top,
            height,
            bottom: top + height,
        };

        columnPlacements[column].push(placement);
        columnHeights[column] = top + height + gap;
    }

    let contentHeight: number = 0;

    for (const columnHeight of columnHeights) {
        contentHeight = Math.max(contentHeight, columnHeight);
    }

    contentHeight = heights.length === 0 ? 0 : Math.max(0, contentHeight - gap);

    const resolvedColumns: WaterfallColumn[] = columnPlacements.map(
        (placements: readonly WaterfallPlacement[], index: number): WaterfallColumn => ({
            index,
            height: placements.length === 0 ? 0 : placements[placements.length - 1].bottom,
            placements,
        }),
    );

    return {
        columnCount: columns,
        gap,
        columns: resolvedColumns,
        height: contentHeight,
    };
};

/**
 * Slices the placements of one column that intersect a vertical window.
 * @param column - Column arrangement to search.
 * @param top - Top of the visible window in CSS pixels.
 * @param bottom - Bottom of the visible window in CSS pixels.
 * @example
 * const visible = visibleWaterfallPlacements(column, 240, 560);
 * @returns Placements intersecting the window, in column order.
 */
export const visibleWaterfallPlacements: (
    column: WaterfallColumn,
    top: number,
    bottom: number,
) => readonly WaterfallPlacement[] = (
    column: WaterfallColumn,
    top: number,
    bottom: number,
): readonly WaterfallPlacement[] => {
    const placements: readonly WaterfallPlacement[] = column.placements;
    let low: number = 0;
    let high: number = placements.length;

    // First placement whose bottom is below the window top.
    while (low < high) {
        const middle: number = Math.floor((low + high) / 2);

        if (placements[middle].bottom <= top) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }

    const visible: WaterfallPlacement[] = [];

    for (let index: number = low; index < placements.length; index += 1) {
        const placement: WaterfallPlacement = placements[index];

        if (placement.top >= bottom) {
            break;
        }

        visible.push(placement);
    }

    return visible;
};

/**
 * Builds an indexed waterfall adapter from cards and their heights.
 * @param items - Cards in source order.
 * @param options - Key and height extractors plus the fallback height.
 * Omitted extractors read an `id` and a numeric `height` from each card.
 * @example
 * const adapter = createWaterfallAdapter(cards, {
 *     getKey: (card) => card.id,
 *     getHeight: (card) => card.height,
 * });
 * @returns A waterfall adapter with cached column placement.
 */
export const createWaterfallAdapter: <T>(
    items: readonly T[],
    options?: WaterfallAdapterOptions<T>,
) => WaterfallAdapter<T> = <T>(
    items: readonly T[],
    options: WaterfallAdapterOptions<T> = {},
): WaterfallAdapter<T> => {
    const list: ListAdapter<T> = createListAdapter<T>(items, {
        getKey: options.getKey ?? defaultKey,
    });
    const requestedFallback: number = options.itemHeight ?? DefaultWaterfallHeight;
    const fallbackHeight: number =
        Number.isFinite(requestedFallback) && requestedFallback > 0
            ? requestedFallback
            : DefaultWaterfallHeight;
    const heights: readonly number[] = Object.freeze(
        items.map(
            (item: T, index: number): number =>
                normaliseHeight(
                    options.getHeight === (void 0)
                        ? defaultHeight(item, fallbackHeight)
                        : options.getHeight(item, index),
                    fallbackHeight,
                ),
        ),
    );
    let cachedKey: string = "";
    let cachedArrangement: WaterfallArrangement | null = null;

    /**
     * Reads a card height and validates the index.
     * @param index - Card position.
     * @example
     * const height = adapter.getHeight(2);
     * @returns The card height in CSS pixels.
     */
    const getHeight: (index: number) => number = (index: number): number => {
        if (!Number.isInteger(index) || index < 0 || index >= heights.length) {
            throw new RangeError(`Waterfall index out of range: ${index}`);
        }

        return heights[index];
    };

    /**
     * Places cards into columns, reusing the previous arrangement when possible.
     * @param arrangeOptions - Column count and gap.
     * @example
     * const arrangement = adapter.arrange({ columns: 3, gap: 12 });
     * @returns The balanced column arrangement.
     */
    const arrange: (arrangeOptions: WaterfallArrangeOptions) => WaterfallArrangement = (
        arrangeOptions: WaterfallArrangeOptions,
    ): WaterfallArrangement => {
        const columns: number = Number.isFinite(arrangeOptions.columns)
            ? Math.max(1, Math.floor(arrangeOptions.columns))
            : 1;
        const gap: number = normaliseHeight(arrangeOptions.gap ?? 0, 0);
        const key: string = `${columns}:${gap}`;

        if (cachedArrangement !== null && cachedKey === key) {
            return cachedArrangement;
        }

        const arrangement: WaterfallArrangement = placeWaterfall(
            heights,
            columns,
            gap,
            list.getKey,
        );

        cachedKey = key;
        cachedArrangement = arrangement;

        return arrangement;
    };

    return {
        ...list,
        heights,
        getHeight,
        arrange,
    };
};

export default createWaterfallAdapter;
