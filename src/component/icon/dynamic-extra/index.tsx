import { createIcon, type Icon } from "../types";

/**
 * Extra SVG-animated icon names for the Dynamic group.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: DynamicExtraIconName = "DynamicSpinSquare";
 */
export type DynamicExtraIconName =
    | "DynamicSpinSquare"
    | "DynamicDrawCheck"
    | "DynamicDrawCircle"
    | "DynamicDrawStar"
    | "DynamicPulseDot"
    | "DynamicFlipCoin"
    | "DynamicFlipSquare"
    | "DynamicPulseBars"
    | "DynamicPulseGrid"
    | "DynamicSlideArrow"
    | "DynamicPendulum"
    | "DynamicRotateCube"
    | "DynamicWaveLine";

export const dynamicExtraIcons: Record<DynamicExtraIconName, Icon> = {
    DynamicSpinSquare: createIcon(
        "DynamicSpinSquare",
        <g>
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="1.8s"
                repeatCount="indefinite"
            />
            <rect x="6" y="6" width="12" height="12" rx="1" />
        </g>,
        24,
    ),
    DynamicDrawCheck: createIcon(
        "DynamicDrawCheck",
        <path d="M4 12l5 5L20 6" strokeDasharray="18 100" strokeDashoffset="0">
            <animate
                attributeName="stroke-dashoffset"
                values="0;-100"
                dur="1.8s"
                repeatCount="indefinite"
            />
        </path>,
        24,
    ),
    DynamicDrawCircle: createIcon(
        "DynamicDrawCircle",
        <circle cx="12" cy="12" r="8" strokeDasharray="18 100" strokeDashoffset="0">
            <animate
                attributeName="stroke-dashoffset"
                values="0;-100"
                dur="1.8s"
                repeatCount="indefinite"
            />
        </circle>,
        24,
    ),
    DynamicDrawStar: createIcon(
        "DynamicDrawStar",
        <path
            d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z"
            strokeDasharray="24 100"
            strokeDashoffset="0"
        >
            <animate
                attributeName="stroke-dashoffset"
                values="0;-100"
                dur="2.4s"
                repeatCount="indefinite"
            />
        </path>,
        24,
    ),
    DynamicPulseDot: createIcon(
        "DynamicPulseDot",
        <circle cx="12" cy="12" r="3">
            <animate attributeName="r" values="3;7;3" dur="1.4s" repeatCount="indefinite" />
            <animate
                attributeName="opacity"
                values="1;0.35;1"
                dur="1.4s"
                repeatCount="indefinite"
            />
        </circle>,
        24,
    ),
    DynamicFlipCoin: createIcon(
        "DynamicFlipCoin",
        <ellipse cx="12" cy="12" rx="6" ry="8">
            <animate attributeName="rx" values="6;1;6" dur="1.6s" repeatCount="indefinite" />
        </ellipse>,
        24,
    ),
    DynamicFlipSquare: createIcon(
        "DynamicFlipSquare",
        <rect x="5" y="5" width="14" height="14" rx="1">
            <animateTransform
                attributeName="transform"
                type="scale"
                values="1 1;0.1 1;1 1"
                dur="1.6s"
                repeatCount="indefinite"
            />
        </rect>,
        24,
    ),
    DynamicPulseBars: createIcon(
        "DynamicPulseBars",
        <>
            <path d="M6 18V8">
                <animate attributeName="d" values="M6 18V8;M6 18V4;M6 18V8" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M12 18V5">
                <animate attributeName="d" values="M12 18V5;M12 18V2;M12 18V5" dur="1s" begin="0.15s" repeatCount="indefinite" />
            </path>
            <path d="M18 18v-6">
                <animate attributeName="d" values="M18 18v-6;M18 18v-2;M18 18v-6" dur="1s" begin="0.3s" repeatCount="indefinite" />
            </path>
        </>,
        24,
    ),
    DynamicPulseGrid: createIcon(
        "DynamicPulseGrid",
        <g>
            <animate
                attributeName="opacity"
                values="0.3;1;0.3"
                dur="1.6s"
                repeatCount="indefinite"
            />
            <rect x="4" y="4" width="6" height="6" rx="1" />
            <rect x="14" y="4" width="6" height="6" rx="1" />
            <rect x="4" y="14" width="6" height="6" rx="1" />
            <rect x="14" y="14" width="6" height="6" rx="1" />
        </g>,
        24,
    ),
    DynamicSlideArrow: createIcon(
        "DynamicSlideArrow",
        <g>
            <animateTransform
                attributeName="transform"
                type="translate"
                values="-2 0;2 0;-2 0"
                dur="1.6s"
                repeatCount="indefinite"
            />
            <path d="M3 12h15M13 7l5 5-5 5" />
        </g>,
        24,
    ),
    DynamicPendulum: createIcon(
        "DynamicPendulum",
        <g transform="translate(12 4)">
            <g>
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="-28;28;-28"
                    dur="2s"
                    repeatCount="indefinite"
                />
                <line x1="0" y1="0" x2="0" y2="14" />
                <circle cx="0" cy="14" r="2.2" fill="currentColor" stroke="none" />
            </g>
        </g>,
        24,
    ),
    DynamicRotateCube: createIcon(
        "DynamicRotateCube",
        <g>
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="2.4s"
                repeatCount="indefinite"
            />
            <path d="M12 3l7 4v10l-7 4-7-4V7l7-4ZM5 7l7 4 7-4M12 11v10" />
        </g>,
        24,
    ),
    DynamicWaveLine: createIcon(
        "DynamicWaveLine",
        <path d="M2 12c3-5 5-5 8 0s5 5 8 0 3-3 4-1" strokeDasharray="20 80">
            <animate
                attributeName="stroke-dashoffset"
                values="0;-100"
                dur="1.6s"
                repeatCount="indefinite"
            />
        </path>,
        24,
    ),
};
