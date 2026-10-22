import { createIcon, type Icon } from "../types";

/**
 * SVG-animated icon names. These glyphs carry their animation in SMIL, so the
 * SVG moves by itself without a CSS keyframe. Every icon stays visible when
 * animation is disabled.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: DynamicIconName = "DynamicRotateRight";
 */
export type DynamicIconName =
    | "DynamicRotateRight"
    | "DynamicRotateLeft"
    | "DynamicThrob"
    | "DynamicBounceBall"
    | "DynamicFlipCard"
    | "DynamicMorphing"
    | "DynamicLoad"
    | "DynamicSatellite"
    | "DynamicBlink"
    | "DynamicRipple"
    | "DynamicPulse"
    | "DynamicTyping"
    | "DynamicWave"
    | "DynamicScan"
    | "DynamicOrbit"
    | "DynamicBreathe"
    | "DynamicShake";

export const dynamicIcons: Record<DynamicIconName, Icon> = {
    DynamicRotateRight: createIcon(
        "DynamicRotateRight",
        <g>
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="1.6s"
                repeatCount="indefinite"
            />
            <path d="M20 12a8 8 0 1 1-2.3-5.7" />
            <path d="M20 4v5h-5" />
        </g>,
        24,
    ),
    DynamicRotateLeft: createIcon(
        "DynamicRotateLeft",
        <g>
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="360 12 12"
                to="0 12 12"
                dur="1.6s"
                repeatCount="indefinite"
            />
            <path d="M4 12a8 8 0 1 0 2.3-5.7" />
            <path d="M4 4v5h5" />
        </g>,
        24,
    ),
    DynamicThrob: createIcon(
        "DynamicThrob",
        <g transform="translate(12 12)">
            <g>
                <animateTransform
                    attributeName="transform"
                    type="scale"
                    values="1;1.2;0.95;1.12;1"
                    keyTimes="0;0.15;0.3;0.45;1"
                    dur="1.2s"
                    repeatCount="indefinite"
                />
                <path d="M0 8C-2 5.5-8 2.5-8-2.5C-8-5.5-5.5-8-3-8C-1.5-8-.5-7.2 0-6C.5-7.2 1.5-8 3-8C5.5-8 8-5.5 8-2.5C8 2.5 2 5.5 0 8Z" />
            </g>
        </g>,
        24,
    ),
    DynamicBounceBall: createIcon(
        "DynamicBounceBall",
        <>
            <ellipse cx="12" cy="19.5" rx="4" ry="1" opacity="0.25" />
            <circle cx="12" cy="7" r="3.2">
                <animate
                    attributeName="cy"
                    values="7;15;7"
                    dur="1.2s"
                    repeatCount="indefinite"
                />
                <animate
                    attributeName="r"
                    values="3.2;2.8;3.2"
                    dur="1.2s"
                    repeatCount="indefinite"
                />
            </circle>
        </>,
        24,
    ),
    DynamicFlipCard: createIcon(
        "DynamicFlipCard",
        <g>
            <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 12 12;180 12 12;360 12 12"
                dur="2s"
                repeatCount="indefinite"
            />
            <rect x="7" y="5" width="10" height="14" rx="1.2" />
            <path d="M10 9h4M10 12h4M10 15h2" />
        </g>,
        24,
    ),
    DynamicMorphing: createIcon(
        "DynamicMorphing",
        <rect x="5" y="5" width="14" height="14">
            <animate
                attributeName="rx"
                values="0;7;0"
                dur="2s"
                repeatCount="indefinite"
            />
            <animate
                attributeName="ry"
                values="0;7;0"
                dur="2s"
                repeatCount="indefinite"
            />
        </rect>,
        24,
    ),
    DynamicSatellite: createIcon(
        "DynamicSatellite",
        <>
            <circle cx="12" cy="12" r="8" opacity="0.3" />
            <circle cx="12" cy="12" r="3" />
            <g>
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 12 12"
                    to="360 12 12"
                    dur="1.8s"
                    repeatCount="indefinite"
                />
                <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
            </g>
        </>,
        24,
    ),
    DynamicLoad: createIcon(
        "DynamicLoad",
        <g>
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="1.4s"
                repeatCount="indefinite"
            />
            <circle cx="12" cy="12" r="9" opacity="0.24" />
            <circle
                cx="12"
                cy="12"
                r="9"
                pathLength={100}
                strokeDasharray="52 100"
                strokeDashoffset="-16"
            >
                <animate
                    attributeName="stroke-dasharray"
                    values="1 100;52 100;72 100;72 100"
                    keyTimes="0;0.45;0.75;1"
                    dur="1.4s"
                    repeatCount="indefinite"
                />
                <animate
                    attributeName="stroke-dashoffset"
                    values="0;-16;-52;-100"
                    keyTimes="0;0.45;0.75;1"
                    dur="1.4s"
                    repeatCount="indefinite"
                />
            </circle>
        </g>,
        24,
    ),
    DynamicBlink: createIcon(
        "DynamicBlink",
        <>
            <path d="M3 12Q12 3 21 12Q12 21 3 12Z">
                <animate
                    attributeName="d"
                    values="M3 12Q12 3 21 12Q12 21 3 12Z;M3 12Q12 10.5 21 12Q12 13.5 3 12Z;M3 12Q12 12 21 12Q12 12 3 12Z;M3 12Q12 12 21 12Q12 12 3 12Z;M3 12Q12 10.5 21 12Q12 13.5 3 12Z;M3 12Q12 3 21 12Q12 21 3 12Z"
                    keyTimes="0;0.35;0.44;0.55;0.64;1"
                    dur="2.4s"
                    repeatCount="indefinite"
                />
            </path>
            <circle cx="12" cy="12" r="2.5">
                <animate
                    attributeName="opacity"
                    values="1;1;0;0;1;1"
                    keyTimes="0;0.38;0.44;0.55;0.61;1"
                    dur="2.4s"
                    repeatCount="indefinite"
                />
            </circle>
        </>,
        24,
    ),
    DynamicRipple: createIcon(
        "DynamicRipple",
        <>
            <circle cx="12" cy="12" r="3" opacity="0.9">
                <animate
                    attributeName="r"
                    values="3;10"
                    dur="1.6s"
                    begin="0s"
                    repeatCount="indefinite"
                />
                <animate
                    attributeName="opacity"
                    values="0.9;0"
                    dur="1.6s"
                    begin="0s"
                    repeatCount="indefinite"
                />
            </circle>
            <circle cx="12" cy="12" r="6" opacity="0.6">
                <animate
                    attributeName="r"
                    values="6;13"
                    dur="1.6s"
                    begin="0.32s"
                    repeatCount="indefinite"
                />
                <animate
                    attributeName="opacity"
                    values="0.6;0"
                    dur="1.6s"
                    begin="0.32s"
                    repeatCount="indefinite"
                />
            </circle>
            <circle cx="12" cy="12" r="9" opacity="0.3">
                <animate
                    attributeName="r"
                    values="9;16"
                    dur="1.6s"
                    begin="0.64s"
                    repeatCount="indefinite"
                />
                <animate
                    attributeName="opacity"
                    values="0.3;0"
                    dur="1.6s"
                    begin="0.64s"
                    repeatCount="indefinite"
                />
            </circle>
        </>,
        24,
    ),
    DynamicPulse: createIcon(
        "DynamicPulse",
        <>
            <path d="M2 12h4l2-5 4 10 3-7 2 2h5" />
            <circle cx="2" cy="12" r="2" fill="currentColor" stroke="none">
                <animateMotion
                    path="M0 0h4l2-5 4 10 3-7 2 2h5"
                    dur="2s"
                    repeatCount="indefinite"
                />
            </circle>
        </>,
        24,
    ),
    DynamicTyping: createIcon(
        "DynamicTyping",
        <>
            <circle cx="6" cy="12" r="1.7" fill="currentColor" stroke="none">
                <animate
                    attributeName="opacity"
                    values="0.25;1;0.25"
                    dur="1.2s"
                    begin="0s"
                    repeatCount="indefinite"
                />
            </circle>
            <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none">
                <animate
                    attributeName="opacity"
                    values="0.25;1;0.25"
                    dur="1.2s"
                    begin="0.16s"
                    repeatCount="indefinite"
                />
            </circle>
            <circle cx="18" cy="12" r="1.7" fill="currentColor" stroke="none">
                <animate
                    attributeName="opacity"
                    values="0.25;1;0.25"
                    dur="1.2s"
                    begin="0.32s"
                    repeatCount="indefinite"
                />
            </circle>
        </>,
        24,
    ),
    DynamicWave: createIcon(
        "DynamicWave",
        <>
            <path d="M4 10v4">
                <animate
                    attributeName="d"
                    values="M4 10v4;M4 8v8;M4 10v4"
                    dur="1.1s"
                    begin="0s"
                    repeatCount="indefinite"
                />
            </path>
            <path d="M8 7v10">
                <animate
                    attributeName="d"
                    values="M8 7v10;M8 4v16;M8 7v10"
                    dur="1.1s"
                    begin="0.12s"
                    repeatCount="indefinite"
                />
            </path>
            <path d="M12 4v16">
                <animate
                    attributeName="d"
                    values="M12 4v16;M12 3v18;M12 4v16"
                    dur="1.1s"
                    begin="0.24s"
                    repeatCount="indefinite"
                />
            </path>
            <path d="M16 7v10">
                <animate
                    attributeName="d"
                    values="M16 7v10;M16 4v16;M16 7v10"
                    dur="1.1s"
                    begin="0.36s"
                    repeatCount="indefinite"
                />
            </path>
            <path d="M20 10v4">
                <animate
                    attributeName="d"
                    values="M20 10v4;M20 8v8;M20 10v4"
                    dur="1.1s"
                    begin="0.48s"
                    repeatCount="indefinite"
                />
            </path>
        </>,
        24,
    ),
    DynamicScan: createIcon(
        "DynamicScan",
        <>
            <rect x="4" y="4" width="16" height="16" rx="2" opacity="0.3" />
            <line x1="6" y1="7" x2="18" y2="7">
                <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0;0 10;0 0"
                    dur="2s"
                    repeatCount="indefinite"
                />
            </line>
        </>,
        24,
    ),
    DynamicOrbit: createIcon(
        "DynamicOrbit",
        <>
            <circle cx="12" cy="12" r="8" opacity="0.3" />
            <g>
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 12 12"
                    to="360 12 12"
                    dur="1.8s"
                    repeatCount="indefinite"
                />
                <circle cx="12" cy="5" r="2" fill="currentColor" stroke="none" />
                <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
            </g>
        </>,
        24,
    ),
    DynamicBreathe: createIcon(
        "DynamicBreathe",
        <>
            <circle cx="12" cy="12" r="9">
                <animate
                    attributeName="r"
                    values="9;7;9"
                    dur="2.2s"
                    repeatCount="indefinite"
                />
                <animate
                    attributeName="opacity"
                    values="0.35;1;0.35"
                    dur="2.2s"
                    repeatCount="indefinite"
                />
            </circle>
            <circle cx="12" cy="12" r="5">
                <animate
                    attributeName="r"
                    values="5;6.5;5"
                    dur="2.2s"
                    begin="-1.1s"
                    repeatCount="indefinite"
                />
            </circle>
        </>,
        24,
    ),
    DynamicShake: createIcon(
        "DynamicShake",
        <g>
            <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 12 5;8 12 5;-6 12 5;4 12 5;0 12 5"
                keyTimes="0;0.2;0.4;0.6;1"
                dur="1.6s"
                repeatCount="indefinite"
            />
            <path d="M6 16h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v3.5L6 16Z" />
            <path d="M10 19a2 2 0 0 0 4 0" />
        </g>,
        24,
    ),
};
