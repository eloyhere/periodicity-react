import {
    Fragment,
    useCallback,
    useMemo,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
    type RefCallback,
    type UIEvent,
} from "react";
import Spinner from "../../../component/progress/Spinner";
import cx from "../../../component/foundation/cx";
import { useInternational, type InternationalContextValue } from "../../../international";
import { optionLabel } from "../../list/node";
import type {
    WaterfallAdapter,
    WaterfallArrangement,
    WaterfallColumn,
    WaterfallItem,
    WaterfallPlacement,
} from "../adapter";
import { createWaterfallAdapter, visibleWaterfallPlacements } from "../adapter";
import type { WaterfallItemState, WaterfallSlots } from "../slots";
import { WaterfallGapPixels, type WaterfallGap } from "../types";
import { useWaterfallWindow, type WaterfallWindow } from "./useWaterfallWindow";
import "../WaterfallLayout.css";

/**
 * Props for the adapter-backed virtual waterfall.
 * Type: interface.
 * Fields: items, adapter, getKey, getHeight, itemHeight, renderItem, columns, gap,
 * height, overscan, loading, loadingLabel, empty, slots, ariaLabel, ref, and native
 * `div` attributes.
 * Native `id`, `className`, `style`, `title`, `tabIndex`, `role`, `aria-*`, `data-*`,
 * pointer, mouse, keyboard, focus, and scroll handlers are forwarded to the scroll viewport.
 * `getHeight` should match the rendered card height; the layout positions cards by the
 * supplied height and does not measure their content.
 * @example
 * <VirtualWaterfallLayout
 *     items={cards}
 *     getKey={(card) => card.id}
 *     getHeight={(card) => card.height}
 *     columns={3}
 *     height={420}
 *     renderItem={(card) => <Card {...card} />}
 * />
 */
export interface VirtualWaterfallLayoutProps<Item = WaterfallItem>
    extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    items?: readonly Item[];
    adapter?: WaterfallAdapter<Item>;
    getKey?: (item: Item, index: number) => string;
    getHeight?: (item: Item, index: number) => number;
    /** Fallback card height in CSS pixels when no numeric `height` or `getHeight` is available; defaults to 160. */
    itemHeight?: number;
    /** Renders one card's content; defaults to the card's text label. */
    renderItem?: (item: Item, index: number) => ReactNode;
    columns?: number;
    gap?: WaterfallGap;
    height?: number;
    /** Extra vertical pixels rendered above and below the viewport; defaults to 320. */
    overscan?: number;
    loading?: boolean;
    /** Accessible loading label; defaults to the localised Loading label. */
    loadingLabel?: string;
    /** Empty-state content; defaults to the localised Empty label. */
    empty?: ReactNode;
    /** Replaces the element that wraps each card; spread `state.className` and `state.style` to keep placement. */
    slots?: WaterfallSlots;
    ariaLabel?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a height-aware virtual masonry: cards are placed into the shortest
 * column from an adapter, and only the columns' visible slice is mounted.
 * @param props - Items or adapter, heights, renderer, columns, viewport height, states, and native attributes.
 * @example
 * <VirtualWaterfallLayout
 *     items={cards}
 *     getKey={(card) => card.id}
 *     getHeight={(card) => card.height}
 *     height={360}
 *     renderItem={(card) => <Card {...card} />}
 * />
 * @returns A virtualised waterfall scroll viewport.
 */
const VirtualWaterfallLayout: <Item>(
    props: VirtualWaterfallLayoutProps<Item>,
) => ReactNode = <Item,>({
    items = [],
    adapter,
    getKey,
    getHeight,
    itemHeight,
    renderItem,
    columns = 3,
    gap = "md",
    height = 480,
    overscan = 320,
    loading = false,
    loadingLabel,
    empty,
    slots,
    ariaLabel,
    className = "",
    style,
    ref,
    onScroll,
    ...rest
}: VirtualWaterfallLayoutProps<Item>): ReactNode => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedLoadingLabel: string = loadingLabel ?? t("loading");
    const resolvedEmpty: ReactNode = empty ?? t("empty");
    const safeColumns: number = Number.isFinite(columns) ? Math.max(1, Math.floor(columns)) : 1;
    const gapPixels: number = WaterfallGapPixels[gap];
    const source: WaterfallAdapter<Item> = useMemo(
        (): WaterfallAdapter<Item> =>
            adapter ??
            createWaterfallAdapter<Item>(items, {
                getKey,
                getHeight,
                itemHeight,
            }),
        [adapter, items, getKey, getHeight, itemHeight],
    );
    const arrangement: WaterfallArrangement = useMemo(
        () => source.arrange({ columns: safeColumns, gap: gapPixels }),
        [source, safeColumns, gapPixels],
    );
    const {
        attachViewport,
        scrollTop,
        viewportHeight,
        onScroll: handleWindowScroll,
    }: WaterfallWindow = useWaterfallWindow({
        fallbackHeight: height,
        contentHeight: arrangement.height,
    });
    const overscanPixels: number = Number.isFinite(overscan) ? Math.max(0, overscan) : 0;
    const windowTop: number = Math.max(0, scrollTop - overscanPixels);
    const windowBottom: number = scrollTop + viewportHeight + overscanPixels;

    /**
     * Attaches the virtual viewport while forwarding the caller ref.
     * @param node - Mounted scroll viewport, or `null` while detaching.
     * @example
     * <div ref={mergedViewportRef} />
     * @returns A cleanup that releases both refs.
     */
    const mergedViewportRef: RefCallback<HTMLDivElement> = useCallback(
        (node: HTMLDivElement | null): (() => void) | void => {
            const releaseViewport: (() => void) | void = attachViewport(node);

            if (node === null) {
                if (typeof ref === "function") {
                    ref(null);
                } else if (ref !== null && ref !== (void 0)) {
                    ref.current = null;
                }

                return releaseViewport;
            }

            let releaseCaller: (() => void) | void = (void 0);

            if (typeof ref === "function") {
                const callerRelease: (() => void) | void = ref(node);

                releaseCaller =
                    typeof callerRelease === "function"
                        ? callerRelease
                        : (): void => {
                              ref(null);
                          };
            } else if (ref !== null && ref !== (void 0)) {
                ref.current = node;
                releaseCaller = (): void => {
                    ref.current = null;
                };
            }

            return (): void => {
                if (typeof releaseCaller === "function") {
                    releaseCaller();
                }

                if (typeof releaseViewport === "function") {
                    releaseViewport();
                }
            };
        },
        [attachViewport, ref],
    );

    const handleScroll: (event: UIEvent<HTMLDivElement>) => void = (
        event: UIEvent<HTMLDivElement>,
    ): void => {
        handleWindowScroll(event);
        onScroll?.(event);
    };

    const label: string | undefined = rest["aria-label"] ?? ariaLabel;

    return (
        <div
            {...rest}
            ref={mergedViewportRef}
            className={cx(
                "waterfall-layout",
                "waterfall-layout--virtual",
                `waterfall-layout--gap-${gap}`,
                className,
            )}
            style={{ ...style, height }}
            aria-label={label}
            aria-busy={loading ? "true" : rest["aria-busy"]}
            data-columns={safeColumns}
            onScroll={handleScroll}
        >
            {loading ? (
                <div className="waterfall-layout__state">
                    <Spinner size="sm" label={resolvedLoadingLabel} />
                </div>
            ) : source.size === 0 ? (
                <div className="waterfall-layout__state" role="status">
                    {resolvedEmpty}
                </div>
            ) : (
                <div className="waterfall-layout__canvas" style={{ height: arrangement.height }}>
                    {arrangement.columns.map((column: WaterfallColumn): ReactNode => (
                        <div
                            className="waterfall-layout__column waterfall-layout__column--virtual"
                            key={column.index}
                            style={{ height: arrangement.height }}
                        >
                            {visibleWaterfallPlacements(column, windowTop, windowBottom).map(
                                (placement: WaterfallPlacement): ReactNode => {
                                    const item: Item = source.getItem(placement.index);
                                    const content: ReactNode =
                                        renderItem === (void 0)
                                            ? optionLabel(item)
                                            : renderItem(item, placement.index);
                                    const itemStyle: CSSProperties = {
                                        top: placement.top,
                                        height: placement.height,
                                    };
                                    const state: WaterfallItemState = {
                                        index: placement.index,
                                        column: placement.column,
                                        top: placement.top,
                                        height: placement.height,
                                        className:
                                            "waterfall-layout__item waterfall-layout__item--virtual",
                                        style: itemStyle,
                                    };
                                    const slot: WaterfallSlots["item"] = slots?.item;

                                    return (
                                        <Fragment key={placement.key}>
                                            {slot === (void 0) ? (
                                                <div
                                                    className={state.className}
                                                    style={state.style}
                                                >
                                                    {content}
                                                </div>
                                            ) : (
                                                slot(content, state)
                                            )}
                                        </Fragment>
                                    );
                                },
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VirtualWaterfallLayout;
