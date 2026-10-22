/* eslint-disable @typescript-eslint/typedef -- Literal effect specs are intentionally concise. */
import { createEffectIcon, type IconEffect } from "../effects";
import type { Icon } from "../types";

const specs = [
    ["LiveDotPulse", "M12 12h.01", "pulse"],
    ["LiveSignalTower", "M8 20h8M12 20V8M6 8a6 6 0 0 1 12 0", "pulse"],
    [
        "LiveBroadcast",
        "M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13",
        "wave",
    ],
    ["LiveWaveform", "M5 10v4M9 7v10M13 4v16M17 7v10M21 10v4", "bars"],
    [
        "LiveHeart",
        "M12 20s-7-4.4-7-9a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 4.6-7 9-7 9Z",
        "pulse",
    ],
    ["LiveOrbit", "M12 4a8 8 0 1 0 .01 0M12 2v2", "spin"],
    ["LiveScan", "M4 6h16M4 12h16M4 18h16", "scan"],
    ["LiveRipple", "M12 3a9 9 0 1 0 .01 0M12 7a5 5 0 1 0 .01 0", "pulse"],
    ["LiveStream", "M4 8h16M4 12h16M4 16h16", "dash"],
    ["LiveCamera", "M4 8h11v8H4zM15 10l5-2v8l-5-2", "pulse"],
    [
        "LiveMic",
        "M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v3M9 20h6",
        "pulse",
    ],
    [
        "LiveEye",
        "M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6ZM12 9a3 3 0 1 0 .01 0",
        "wave",
    ],
    ["LiveBeacon", "M12 20V10M8 20h8M9 10a3 3 0 0 1 6 0M6 10a6 6 0 0 1 12 0", "pulse"],
    ["LiveTower", "M12 20V6M8 20h8M9 6a3 3 0 0 1 6 0M6 6a6 6 0 0 1 12 0", "pulse"],
    [
        "LiveGlobe",
        "M12 3a9 9 0 1 0 .01 0M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
        "spin",
    ],
    ["LiveChat", "M4 5h16v11H9l-5 4V5Z", "bounce"],
    [
        "LiveUsers",
        "M9 11a3 3 0 1 0 .01 0M3 20a6 6 0 0 1 12 0M16 8a3 3 0 0 1 0 6M18 20a6 6 0 0 0-3-5",
        "pulse",
    ],
    ["LiveClock", "M12 3a9 9 0 1 0 .01 0M12 7v5l3 2", "spin"],
    ["LiveBattery", "M4 8h14v8H4zM20 10v4M7 12h4", "pulse"],
    ["LiveWifi", "M3 9a13 13 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9 15a5 5 0 0 1 6 0M12 18h.01", "wave"],
    ["LiveActivity", "M2 12h4l2-5 4 10 3-7 2 2h5", "dash"],
    ["LivePulse", "M12 3a9 9 0 1 0 .01 0M12 7a5 5 0 1 0 .01 0", "pulse"],
] as const;

/**
 * Extra live-status icon names.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: LiveExtraIconName = "LiveDotPulse";
 */
export type LiveExtraIconName = (typeof specs)[number][0];

export const liveExtraIcons: Record<LiveExtraIconName, Icon> = Object.fromEntries(
    specs.map(
        ([name, d, effect]: (typeof specs)[number]): [LiveExtraIconName, Icon] => [
            name,
            createEffectIcon(name, d, effect as IconEffect),
        ],
    ),
) as Record<LiveExtraIconName, Icon>;
