/* eslint-disable @typescript-eslint/typedef -- Literal effect specs are intentionally concise. */
import { createEffectIcon, type IconEffect } from "../effects";
import type { Icon } from "../types";

const specs = [
    ["MotionDotsBounce", "M6 8h.01M12 8h.01M18 8h.01", "bounce"],
    ["MotionDotsWave", "M6 12h.01M12 12h.01M18 12h.01", "wave"],
    ["MotionOrbitDots", "M12 4a8 8 0 1 0 .01 0M12 2v2", "spin"],
    ["MotionSpinSquare", "M6 6h12v12H6Z", "spin"],
    ["MotionPulseRing", "M12 3a9 9 0 1 0 .01 0", "pulse"],
    ["MotionBreatheRing", "M12 3a9 9 0 1 0 .01 0M12 7a5 5 0 1 1-.01 0", "breathe"],
    ["MotionDashLine", "M3 12h18", "dash"],
    ["MotionDashCircle", "M12 3a9 9 0 1 1-.01 0", "dash"],
    ["MotionScanLines", "M4 6h16M4 12h16M4 18h16", "scan"],
    ["MotionRadarSweep", "M12 12V3M12 12a9 9 0 0 1 8 5", "spin"],
    ["MotionSignalBars", "M5 19v-4M10 19v-7M15 19v-10M20 19V6", "bars"],
    ["MotionWaveBars", "M5 10v4M9 7v10M13 4v16M17 7v10M21 10v4", "bars"],
    [
        "MotionBellSwing",
        "M6 16h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v3.5L6 16ZM10 19a2 2 0 0 0 4 0",
        "swing",
    ],
    ["MotionClockTick", "M12 3a9 9 0 1 0 .01 0M12 7v5l3 2", "spin"],
    ["MotionBatteryCharge", "M4 8h14v8H4zM20 10v4M7 12h4", "pulse"],
    ["MotionDownload", "M12 3v12M7 10l5 5 5-5M4 20h16", "bounce"],
    ["MotionUpload", "M12 21V9M7 14l5-5 5 5M4 4h16", "bounce"],
    [
        "MotionRefresh",
        "M20 12a8 8 0 0 1-13.4 5.9M4 12a8 8 0 0 1 13.4-5.9M17 3.5v4h-4M7 20.5v-4h4",
        "spin",
    ],
    [
        "MotionHeartBeat",
        "M12 20s-7-4.4-7-9a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 4.6-7 9-7 9Z",
        "pulse",
    ],
    ["MotionTyping", "M6 12h.01M12 12h.01M18 12h.01", "wave"],
] as const;

/**
 * Extra motion icon names used to keep the Motion group well populated.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: MotionExtraIconName = "MotionDotsBounce";
 */
export type MotionExtraIconName = (typeof specs)[number][0];

export const motionExtraIcons: Record<MotionExtraIconName, Icon> = Object.fromEntries(
    specs.map(
        ([name, d, effect]: (typeof specs)[number]): [MotionExtraIconName, Icon] => [
            name,
            createEffectIcon(name, d, effect as IconEffect),
        ],
    ),
) as Record<MotionExtraIconName, Icon>;
