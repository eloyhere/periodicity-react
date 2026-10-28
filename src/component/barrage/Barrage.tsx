import {
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type MutableRefObject,
    type ReactNode,
    type Ref,
    type RefObject,
    type SetStateAction,
} from "react";
import { usePrefersReducedMotion } from "../../animation/usePrefersReducedMotion";
import cx from "../foundation/cx";
import VisuallyHidden from "../foundation/VisuallyHidden";
import {
    scheduleBarragePass,
    type BarrageScheduleEntry,
    type BarrageSchedulePass,
    type BarrageScheduleState,
} from "./schedule";
import "./Barrage.css";

/**
 * Travel direction of the floating items.
 * Type: type alias.
 * Fields: none.
 * @example
 * const direction: BarrageDirection = "ltr";
 */
export type BarrageDirection = "rtl" | "ltr";

/**
 * One floating comment.
 * Type: interface.
 * @param id - Stable key; the index is used when omitted.
 * @param text - Plain text, also used for the screen-reader transcript.
 * @param content - Rich content painted inside the default pill; wins over `text`.
 * @example
 * const item: BarrageItem = { id: "c1", text: "First!" };
 */
export interface BarrageItem {
    readonly id?: string;
    readonly text?: string;
    readonly content?: ReactNode;
}

/**
 * Context handed to the item slot.
 * Type: interface.
 * @param item - The floating comment being rendered.
 * @param index - Position of the comment in the `items` list.
 * @param lane - Row the comment travels along.
 * @example
 * const context: BarrageSlotContext = { item, index: 0, lane: 0 };
 */
export interface BarrageSlotContext {
    readonly item: BarrageItem;
    readonly index: number;
    readonly lane: number;
}

/**
 * Customisation points of the floating layer.
 * Type: interface.
 * @param item - Replaces the default pill for every floating comment.
 * @param overlay - Extra floating UI painted above the items; its children can receive pointer events.
 * @example
 * const slots: BarrageSlots = { item: (context) => <Chip label={context.item.text} /> };
 */
export interface BarrageSlots {
    item?: (context: BarrageSlotContext) => ReactNode;
    overlay?: ReactNode;
}

/**
 * Props for the Barrage component.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `aria-*`, `data-*`, `style`, and pointer, mouse, keyboard,
 * and focus handlers are forwarded to the root element that also hosts the children.
 * @param items - Floating comments, painted in list order.
 * @param children - Content the comments float over, such as a video or a card.
 * @param paused - Freezes every item in place without hiding it.
 * @param direction - Travel direction; `rtl` enters from the right edge.
 * @param lanes - Number of rows the comments are distributed across; defaults to `3`.
 * @param duration - Milliseconds a point needs to cross the layer; defaults to `9000`. Every item moves at
 * the same speed, so wider items take proportionally longer.
 * @param stagger - Minimum milliseconds between consecutive item starts; defaults to `600`.
 * @param repeat - Repeats the crossing forever instead of playing once per item.
 * @param bottomInset - Pixels reserved below the scrolling layer for chrome such as a video control bar.
 * @param respectReducedMotion - Keeps the stream still when the user prefers reduced motion; defaults to `true`.
 * @param slots - Item and overlay slots for custom floating UI.
 * @param className - Extra class names applied to the root element.
 * @param ref - Ref forwarded to the root element.
 * @example
 * <Barrage items={[{ text: "Ship it" }, { text: "Nice" }]} lanes={2}>
 *     <HorizontalVideo src="/launch.mp4" label="Launch film" />
 * </Barrage>
 * @example
 * <Barrage
 *     items={comments}
 *     paused={isPaused}
 *     slots={{ item: ({ item }) => <Chip label={item.text} />, overlay: <Badge>LIVE</Badge> }}
 * >
 *     <VerticalVideo src="/short.mp4" label="Short film" />
 * </Barrage>
 */
export interface BarrageProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    items?: readonly BarrageItem[];
    children?: ReactNode;
    paused?: boolean;
    direction?: BarrageDirection;
    lanes?: number;
    duration?: number;
    stagger?: number;
    repeat?: boolean;
    bottomInset?: number;
    respectReducedMotion?: boolean;
    slots?: BarrageSlots;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * One live appearance of a comment.
 * Type: interface.
 * @param id - Unique occurrence id.
 * @param itemIndex - Index of the source item.
 * @param lane - Lane assigned by the scheduler.
 * @param startX - Horizontal start offset in pixels.
 * @param endX - Horizontal end offset in pixels.
 * @param duration - Travel time in milliseconds.
 * @example
 * const occurrence: BarrageOccurrence = { id: 1, itemIndex: 0, lane: 0, startX: 800, endX: -120, duration: 11000 };
 */
interface BarrageOccurrence {
    readonly id: number;
    readonly itemIndex: number;
    readonly lane: number;
    readonly startX: number;
    readonly endX: number;
    readonly duration: number;
}

/**
 * Style object that positions one occurrence.
 * Type: interface.
 * @param --barrage-lane - Row index resolved to a top offset by the stylesheet.
 * @param transform - Current horizontal translation.
 * @example
 * const style: BarrageItemStyle = { "--barrage-lane": 1, transform: "translate3d(800px, 0, 0)" };
 */
interface BarrageItemStyle extends CSSProperties {
    "--barrage-lane": number;
    transform: string;
}

/**
 * Props for one animated occurrence.
 * Type: interface.
 * @param occurrence - Occurrence identity and travel geometry.
 * @param pausedRef - Latest pause state, read without restarting the animation.
 * @param register - Registers the live animation on the parent.
 * @param release - Removes the animation from the parent registry.
 * @param onFinished - Called when the travel animation finishes.
 * @param children - Rendered slot content or default pill.
 * @example
 * <BarrageOccurrenceView occurrence={occurrence} pausedRef={pausedRef} register={register} release={release} onFinished={onFinished}>
 *     <span className="barrage__pill">First!</span>
 * </BarrageOccurrenceView>
 */
interface BarrageOccurrenceViewProps {
    readonly occurrence: BarrageOccurrence;
    readonly pausedRef: MutableRefObject<boolean>;
    readonly register: (id: number, animation: Animation) => void;
    readonly release: (id: number) => void;
    readonly onFinished: (id: number) => void;
    readonly children: ReactNode;
}

const emptyItems: readonly BarrageItem[] = [];
const DefaultLanes: number = 3;
const DefaultDuration: number = 9000;
const DefaultStagger: number = 600;
const MinimumLanes: number = 1;
const MinimumDuration: number = 500;
const MinimumWidth: number = 1;
const MaxFrameDelta: number = 100;
const MinimumBuffer: number = 4;

/**
 * Builds a stable identity for one source item.
 * @param item - Source item.
 * @param index - Position in the source list.
 * @example
 * const key: string = barrageItemKey({ id: "a", text: "First" }, 0);
 * @returns A key that changes when the rendered text or string content changes.
 */
const barrageItemKey: (item: BarrageItem, index: number) => string = (
    item: BarrageItem,
    index: number,
): string =>
    `${item.id ?? index}\u0000${item.text ?? ""}\u0000${
        typeof item.content === "string" ? item.content : ""
    }`;

/**
 * Renders one occurrence and drives its Web Animations timeline.
 * @param props - Occurrence geometry, pause state, animation registry callbacks, and rendered content.
 * @example
 * <BarrageOccurrenceView {...props}>First!</BarrageOccurrenceView>
 * @returns An absolutely positioned travelling item.
 */
const BarrageOccurrenceView: FC<BarrageOccurrenceViewProps> = ({
    occurrence,
    pausedRef,
    register,
    release,
    onFinished,
    children,
}: BarrageOccurrenceViewProps) => {
    const nodeRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const style: BarrageItemStyle = {
        "--barrage-lane": occurrence.lane,
        transform: `translate3d(${occurrence.startX}px, 0, 0)`,
    };

    useLayoutEffect((): (() => void) => {
        const node: HTMLDivElement | null = nodeRef.current;

        if (node === null) {
            return (): void => {};
        }

        if (typeof node.animate !== "function") {
            onFinished(occurrence.id);
            return (): void => {};
        }

        const animation: Animation = node.animate(
            [
                { transform: `translate3d(${occurrence.startX}px, 0, 0)` },
                { transform: `translate3d(${occurrence.endX}px, 0, 0)` },
            ],
            {
                duration: occurrence.duration,
                easing: "linear",
                fill: "forwards",
            },
        );

        register(occurrence.id, animation);

        if (pausedRef.current) {
            animation.pause();
        }

        animation.onfinish = (): void => {
            release(occurrence.id);
            onFinished(occurrence.id);
        };

        return (): void => {
            animation.onfinish = null;
            animation.cancel();
            release(occurrence.id);
        };
    }, [
        occurrence.duration,
        occurrence.endX,
        occurrence.id,
        occurrence.startX,
        onFinished,
        pausedRef,
        register,
        release,
    ]);

    return (
        <div
            ref={nodeRef}
            className="barrage__item"
            style={style}
            data-item-index={occurrence.itemIndex}
            data-lane={occurrence.lane}
            data-occurrence={occurrence.id}
        >
            {children}
        </div>
    );
};

/**
 * Renders its children with a Bilibili-style floating comment stream above them.
 *
 * Every comment moves at the same pixels-per-millisecond speed, enters from the
 * configured edge, and is assigned a lane whose previous comment has already
 * cleared the entry edge. Scheduling is collision-aware, repeats create separate
 * occurrences (so custom UI can overlap itself), and pause/resume is handled by
 * the Web Animations API without resetting progress. The scrolling layer is hidden
 * from assistive technology; plain-text comments are mirrored in a visually hidden
 * list, and the whole layer stops under `prefers-reduced-motion`.
 * @param props - Items, wrapped children, playback state, direction, lanes, timing, slots, class names, and
 * native div attributes.
 * @example
 * <Barrage items={comments} duration={7000} repeat>
 *     <HorizontalVideo src="/launch.mp4" label="Launch film" />
 * </Barrage>
 * @returns A positioned wrapper hosting the wrapped content and the floating layer.
 */
const Barrage: FC<BarrageProps> = ({
    items = emptyItems,
    children,
    paused = false,
    direction = "rtl",
    lanes = DefaultLanes,
    duration = DefaultDuration,
    stagger = DefaultStagger,
    repeat = false,
    bottomInset = 0,
    respectReducedMotion = true,
    slots,
    className = "",
    ref,
    ...rest
}: BarrageProps) => {
    const renderItem: ((context: BarrageSlotContext) => ReactNode) | undefined = slots?.item;
    const overlay: ReactNode = slots?.overlay;
    const reducedMotion: boolean = usePrefersReducedMotion() && respectReducedMotion;
    const safeBottomInset: number = Number.isFinite(bottomInset) ? Math.max(0, bottomInset) : 0;
    const layerStyle: CSSProperties = { bottom: safeBottomInset };
    const transcript: string[] = items
        .map((item: BarrageItem): string => item.text ?? (typeof item.content === "string" ? item.content : ""))
        .filter((text: string): boolean => text.length > 0);
    const [occurrences, setOccurrences]: [
        readonly BarrageOccurrence[],
        Dispatch<SetStateAction<readonly BarrageOccurrence[]>>,
    ] = useState<readonly BarrageOccurrence[]>([]);
    const [layerWidth, setLayerWidth]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const layerRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const measureRefs: MutableRefObject<(HTMLDivElement | null)[]> = useRef<(HTMLDivElement | null)[]>([]);
    const animationsRef: MutableRefObject<Map<number, Animation>> = useRef<Map<number, Animation>>(
        new Map<number, Animation>(),
    );
    const occurrenceIdRef: MutableRefObject<number> = useRef<number>(0);
    const pausedRef: MutableRefObject<boolean> = useRef<boolean>(paused);
    const itemsRef: MutableRefObject<readonly BarrageItem[]> = useRef<readonly BarrageItem[]>(items);

    const renderContent: (item: BarrageItem, index: number, lane: number) => ReactNode = (
        item: BarrageItem,
        index: number,
        lane: number,
    ): ReactNode =>
        renderItem === (void 0) ? (
            <span className="barrage__pill">{item.content ?? item.text}</span>
        ) : (
            renderItem({ item, index, lane })
        );

    useLayoutEffect((): void => {
        itemsRef.current = items;
    });

    useLayoutEffect((): void => {
        pausedRef.current = paused;
        animationsRef.current.forEach((animation: Animation): void => {
            if (paused) {
                animation.pause();
            } else {
                animation.play();
            }
        });
    }, [paused]);

    useLayoutEffect((): (() => void) => {
        const layer: HTMLDivElement | null = layerRef.current;

        if (layer === null) {
            return (): void => {};
        }

        const updateWidth: () => void = (): void => {
            const nextWidth: number = layer.getBoundingClientRect().width;
            setLayerWidth((current: number): number =>
                Math.abs(current - nextWidth) < 0.5 ? current : nextWidth,
            );
        };

        updateWidth();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", updateWidth);
            return (): void => {
                window.removeEventListener("resize", updateWidth);
            };
        }

        const observer: ResizeObserver = new ResizeObserver(updateWidth);
        observer.observe(layer);

        return (): void => {
            observer.disconnect();
        };
    }, []);

    const registerAnimation: (id: number, animation: Animation) => void = useCallback(
        (id: number, animation: Animation): void => {
            animationsRef.current.set(id, animation);
        },
        [],
    );

    const releaseAnimation: (id: number) => void = useCallback((id: number): void => {
        animationsRef.current.delete(id);
    }, []);

    const handleOccurrenceFinished: (id: number) => void = useCallback((id: number): void => {
        setOccurrences((current: readonly BarrageOccurrence[]): readonly BarrageOccurrence[] =>
            current.filter((occurrence: BarrageOccurrence): boolean => occurrence.id !== id),
        );
    }, []);

    useLayoutEffect((): (() => void) => {
        const layer: HTMLDivElement | null = layerRef.current;
        const animations: Map<number, Animation> = animationsRef.current;
        const reset: () => void = (): void => {
            animations.forEach((animation: Animation): void => animation.cancel());
            animations.clear();
            setOccurrences([]);
        };

        if (
            layer === null ||
            layerWidth <= 0 ||
            reducedMotion ||
            typeof layer.animate !== "function"
        ) {
            reset();
            return (): void => {};
        }

        const laneCount: number = Number.isFinite(lanes)
            ? Math.max(MinimumLanes, Math.floor(lanes))
            : DefaultLanes;
        const safeDuration: number =
            Number.isFinite(duration) && duration > 0 ? Math.max(MinimumDuration, duration) : DefaultDuration;
        const safeStagger: number = Number.isFinite(stagger) ? Math.max(0, stagger) : DefaultStagger;
        const bufferSize: number = Math.max(MinimumBuffer, laneCount * 2);
        let scheduler: BarrageScheduleState = {
            laneFree: new Array<number>(laneCount).fill(0),
            nextStart: 0,
        };
        let knownKeys: string[] = itemsRef.current.map(barrageItemKey);
        let nextItemIndex: number = 0;
        const events: BarrageScheduleEntry[] = [];

        const widthOf: (index: number) => number = (index: number): number => {
            const node: HTMLDivElement | null = measureRefs.current[index] ?? null;
            return node === null ? MinimumWidth : Math.max(MinimumWidth, node.getBoundingClientRect().width);
        };

        const scheduleNext: () => void = (): void => {
            const currentItems: readonly BarrageItem[] = itemsRef.current;

            if (currentItems.length === 0) {
                return;
            }

            if (nextItemIndex >= currentItems.length) {
                if (!repeat) {
                    return;
                }

                nextItemIndex = 0;
            }

            const itemIndex: number = nextItemIndex;
            const pass: BarrageSchedulePass = scheduleBarragePass({
                widths: [widthOf(itemIndex)],
                state: scheduler,
                laneCount,
                layerWidth,
                duration: safeDuration,
                stagger: safeStagger,
            });
            const entry: BarrageScheduleEntry | void = pass.entries[0];

            if (entry === (void 0)) {
                return;
            }

            events.push({ ...entry, itemIndex });
            scheduler = pass.state;
            nextItemIndex += 1;
        };

        const ensureScheduled: () => void = (): void => {
            while (events.length < bufferSize) {
                const previousIndex: number = nextItemIndex;
                scheduleNext();

                if (nextItemIndex === previousIndex) {
                    break;
                }
            }
        };

        reset();

        let elapsed: number = 0;
        let last: number = performance.now();
        let frame: number = 0;

        const tick: (now: number) => void = (now: number): void => {
            const delta: number = Math.min(now - last, MaxFrameDelta);
            last = now;

            if (!pausedRef.current) {
                elapsed += delta;
            }

            const currentItems: readonly BarrageItem[] = itemsRef.current;
            const currentKeys: string[] = currentItems.map(barrageItemKey);
            const appended: boolean =
                currentKeys.length >= knownKeys.length &&
                knownKeys.every((key: string, index: number): boolean => currentKeys[index] === key);

            if (!appended) {
                reset();
                knownKeys = currentKeys;
                scheduler = {
                    laneFree: new Array<number>(laneCount).fill(0),
                    nextStart: 0,
                };
                events.length = 0;
                nextItemIndex = 0;
                elapsed = 0;
                last = now;
            } else {
                knownKeys = currentKeys;
            }

            ensureScheduled();

            if (!pausedRef.current) {
                while (events.length > 0) {
                    const event: BarrageScheduleEntry | void = events[0];

                    if (event === (void 0) || event.startAt > elapsed) {
                        break;
                    }

                    events.shift();

                    const width: number = widthOf(event.itemIndex);
                    const startX: number = direction === "rtl" ? layerWidth : -width;
                    const endX: number = direction === "rtl" ? -width : layerWidth;
                    const id: number = occurrenceIdRef.current + 1;

                    occurrenceIdRef.current = id;
                    setOccurrences(
                        (current: readonly BarrageOccurrence[]): readonly BarrageOccurrence[] => [
                            ...current,
                            {
                                id,
                                itemIndex: event.itemIndex,
                                lane: event.lane,
                                startX,
                                endX,
                                duration: event.duration,
                            },
                        ],
                    );
                }
            }

            frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);

        return (): void => {
            cancelAnimationFrame(frame);
            events.length = 0;
            animations.forEach((animation: Animation): void => animation.cancel());
            animations.clear();
        };
    }, [direction, duration, lanes, layerWidth, reducedMotion, repeat, stagger]);

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("barrage", className)}
            data-paused={paused ? "true" : "false"}
            data-direction={direction}
            data-reduced-motion={reducedMotion ? "true" : "false"}
        >
            <div className="barrage__content">{children}</div>
            <div ref={layerRef} className="barrage__layer" aria-hidden="true" style={layerStyle}>
                {occurrences.map((occurrence: BarrageOccurrence): ReactNode => {
                    const item: BarrageItem | void = items[occurrence.itemIndex];

                    if (item === (void 0)) {
                        return null;
                    }

                    return (
                        <BarrageOccurrenceView
                            key={occurrence.id}
                            occurrence={occurrence}
                            pausedRef={pausedRef}
                            register={registerAnimation}
                            release={releaseAnimation}
                            onFinished={handleOccurrenceFinished}
                        >
                            {renderContent(item, occurrence.itemIndex, occurrence.lane)}
                        </BarrageOccurrenceView>
                    );
                })}
                {overlay === (void 0) ? null : <div className="barrage__overlay">{overlay}</div>}
            </div>
            <div className="barrage__measure" aria-hidden="true">
                {items.map((item: BarrageItem, index: number): ReactNode => (
                    <div
                        key={item.id ?? `${index}`}
                        ref={(node: HTMLDivElement | null): void => {
                            measureRefs.current[index] = node;
                        }}
                        className="barrage__measure-item"
                    >
                        {renderContent(item, index, 0)}
                    </div>
                ))}
            </div>
            {transcript.length === 0 ? null : (
                <VisuallyHidden as="div">
                    <ul className="barrage__transcript">
                        {transcript.map((text: string, index: number): ReactNode => (
                            <li key={`${index}`}>{text}</li>
                        ))}
                    </ul>
                </VisuallyHidden>
            )}
        </div>
    );
};

export default Barrage;
