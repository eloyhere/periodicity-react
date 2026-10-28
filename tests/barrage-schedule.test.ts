import { describe, expect, it } from "vitest";
import {
    scheduleBarragePass,
    type BarrageSchedulePass,
    type BarrageScheduleState,
} from "../src/component/barrage/schedule";

const emptyState: (lanes: number) => BarrageScheduleState = (lanes: number): BarrageScheduleState => ({
    laneFree: new Array<number>(lanes).fill(0),
    nextStart: 0,
});

describe("scheduleBarragePass", (): void => {
    it("runs every item at the same pixels-per-millisecond speed", (): void => {
        const pass: BarrageSchedulePass = scheduleBarragePass({
            widths: [100, 200],
            state: emptyState(2),
            laneCount: 2,
            layerWidth: 600,
            duration: 6000,
            stagger: 0,
        });

        expect(pass.entries[0].duration).toBeCloseTo(7000);
        expect(pass.entries[1].duration).toBeCloseTo(8000);
        expect((600 + 100) / pass.entries[0].duration).toBeCloseTo(0.1);
        expect((600 + 200) / pass.entries[1].duration).toBeCloseTo(0.1);
    });

    it("waits until the previous item in a lane has cleared the entry gap", (): void => {
        const pass: BarrageSchedulePass = scheduleBarragePass({
            widths: [100, 100, 100],
            state: emptyState(2),
            laneCount: 2,
            layerWidth: 600,
            duration: 6000,
            stagger: 0,
        });

        expect(pass.entries[0].lane).toBe(0);
        expect(pass.entries[1].lane).toBe(1);
        expect(pass.entries[2].lane).toBe(0);
        expect(pass.entries[2].startAt).toBeCloseTo(1120);
    });

    it("carries lane availability and the next start across repeat passes", (): void => {
        const first: BarrageSchedulePass = scheduleBarragePass({
            widths: [100, 100],
            state: emptyState(2),
            laneCount: 2,
            layerWidth: 600,
            duration: 6000,
            stagger: 500,
        });
        const second: BarrageSchedulePass = scheduleBarragePass({
            widths: [100, 100],
            state: first.state,
            laneCount: 2,
            layerWidth: 600,
            duration: 6000,
            stagger: 500,
        });

        expect(first.entries[1].startAt).toBe(500);
        expect(second.entries[0].startAt).toBeGreaterThanOrEqual(1120);
        expect(second.entries[1].startAt).toBeGreaterThanOrEqual(second.entries[0].startAt);
    });

    it("returns no entries for an empty or unmeasured layer", (): void => {
        const empty: BarrageSchedulePass = scheduleBarragePass({
            widths: [],
            state: emptyState(2),
            laneCount: 2,
            layerWidth: 600,
            duration: 6000,
            stagger: 500,
        });
        const hidden: BarrageSchedulePass = scheduleBarragePass({
            widths: [100],
            state: emptyState(2),
            laneCount: 2,
            layerWidth: 0,
            duration: 6000,
            stagger: 500,
        });

        expect(empty.entries).toHaveLength(0);
        expect(hidden.entries).toHaveLength(0);
    });
});
