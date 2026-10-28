/**
 * One scheduled appearance of a barrage item.
 * Type: interface.
 * @param itemIndex - Index of the item in the source list.
 * @param lane - Lane the appearance travels on.
 * @param startAt - Milliseconds after the scheduler started.
 * @param duration - Travel time in milliseconds at the shared speed.
 * @example
 * const entry: BarrageScheduleEntry = { itemIndex: 0, lane: 0, startAt: 0, duration: 6000 };
 */
export interface BarrageScheduleEntry {
    readonly itemIndex: number;
    readonly lane: number;
    readonly startAt: number;
    readonly duration: number;
}

/**
 * Carried state between scheduling passes.
 * Type: interface.
 * @param laneFree - Earliest time each lane can accept another item.
 * @param nextStart - Earliest time the next item may start across all lanes.
 * @example
 * const state: BarrageScheduleState = { laneFree: [0, 0, 0], nextStart: 0 };
 */
export interface BarrageScheduleState {
    readonly laneFree: readonly number[];
    readonly nextStart: number;
}

/**
 * Inputs for one scheduling pass.
 * Type: interface.
 * @param widths - Measured item widths in pixels.
 * @param state - Lane availability and next start time from the previous pass.
 * @param laneCount - Number of available lanes.
 * @param layerWidth - Width of the scrolling layer in pixels.
 * @param duration - Milliseconds a point needs to cross the layer.
 * @param stagger - Minimum milliseconds between consecutive item starts.
 * @example
 * const options: BarrageScheduleOptions = { widths: [120], state, laneCount: 3, layerWidth: 800, duration: 9000, stagger: 600 };
 */
export interface BarrageScheduleOptions {
    readonly widths: readonly number[];
    readonly state: BarrageScheduleState;
    readonly laneCount: number;
    readonly layerWidth: number;
    readonly duration: number;
    readonly stagger: number;
}

/**
 * Result of one scheduling pass.
 * Type: interface.
 * @param entries - Appearances scheduled by this pass.
 * @param state - Carried state for the next pass.
 * @example
 * const pass: BarrageSchedulePass = scheduleBarragePass(options);
 */
export interface BarrageSchedulePass {
    readonly entries: readonly BarrageScheduleEntry[];
    readonly state: BarrageScheduleState;
}

/**
 * Smallest horizontal gap left between two items sharing a lane.
 * Type: number constant.
 * @example
 * const gap: number = MinimumGap;
 */
const MinimumGap: number = 12;

/**
 * Schedules one pass of items without overlap.
 *
 * Every item travels at the same pixels-per-millisecond speed, so a later
 * item can never overtake an earlier one in the same lane. A lane becomes
 * available once the previous item's trailing edge has entered the layer and
 * left the configured gap. The pass preserves item order and the minimum
 * stagger between starts.
 * @param options - Widths, carried state, lane count, layer width, duration, and stagger.
 * @example
 * const pass = scheduleBarragePass({
 *     widths: [120, 80],
 *     state: { laneFree: [0, 0], nextStart: 0 },
 *     laneCount: 2,
 *     layerWidth: 800,
 *     duration: 9000,
 *     stagger: 600,
 * });
 * @returns Scheduled entries and the state for the next pass.
 */
export const scheduleBarragePass: (options: BarrageScheduleOptions) => BarrageSchedulePass = (
    options: BarrageScheduleOptions,
): BarrageSchedulePass => {
    const laneCount: number = Math.max(1, Math.floor(options.laneCount));
    const layerWidth: number = Math.max(0, options.layerWidth);
    const duration: number = Math.max(1, options.duration);
    const stagger: number = Math.max(0, options.stagger);
    const speed: number = layerWidth / duration;
    const entries: BarrageScheduleEntry[] = [];
    const laneFree: number[] = [];

    for (let lane: number = 0; lane < laneCount; lane += 1) {
        laneFree.push(Math.max(0, options.state.laneFree[lane] ?? 0));
    }
    let nextStart: number = Math.max(0, options.state.nextStart);

    if (speed <= 0) {
        return {
            entries,
            state: { laneFree, nextStart },
        };
    }

    for (let itemIndex: number = 0; itemIndex < options.widths.length; itemIndex += 1) {
        const width: number = Math.max(0, options.widths[itemIndex] ?? 0);
        let lane: number = 0;

        for (let candidate: number = 1; candidate < laneCount; candidate += 1) {
            if (laneFree[candidate] < laneFree[lane]) {
                lane = candidate;
            }
        }

        const startAt: number = Math.max(nextStart, laneFree[lane]);
        entries.push({
            itemIndex,
            lane,
            startAt,
            duration: (layerWidth + width) / speed,
        });
        laneFree[lane] = startAt + (width + MinimumGap) / speed;
        nextStart = startAt + stagger;
    }

    return {
        entries,
        state: { laneFree, nextStart },
    };
};

export default scheduleBarragePass;
