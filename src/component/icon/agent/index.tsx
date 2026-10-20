import { createIcon, type Icon } from "../types";

export type AgentIconName =
    | "ChatGPT"
    | "Claude"
    | "DeepSeek"
    | "Kimi"
    | "Grok"
    | "Gemini"
    | "Copilot"
    | "Llama"
    | "Mistral"
    | "Perplexity"
    | "Qwen"
    | "Doubao"
    | "Ernie"
    | "Hunyuan"
    | "Spark"
    | "Baichuan"
    | "MiniMax"
    | "Yi"
    | "GLM"
    | "Phi"
    | "Command"
    | "Jurassic"
    | "Titan"
    | "Nova"
    | "Falcon"
    | "Sora"
    | "Midjourney"
    | "Flux"
    | "Runway"
    | "Ideogram";

export const agentIcons: Record<AgentIconName, Icon> = {
    ChatGPT: createIcon(
        "ChatGPT",
        <>
            <rect x="7.9" y="3" width="8.2" height="18" rx="4.1" />
            <rect x="7.9" y="3" width="8.2" height="18" rx="4.1" transform="rotate(60 12 12)" />
            <rect x="7.9" y="3" width="8.2" height="18" rx="4.1" transform="rotate(120 12 12)" />
        </>,
    ),
    Claude: createIcon(
        "Claude",
        <>
            <path d="M12 12V2.7" />
            <path d="m12 12 5.6-7.9" />
            <path d="m12 12 8.8-2.8" />
            <path d="m12 12 8.2 4.5" />
            <path d="m12 12 3.9 8.1" />
            <path d="m12 12-1 9.3" />
            <path d="m12 12-5.9 7.2" />
            <path d="m12 12-8.6 3.2" />
            <path d="M12 12 3.4 8.1" />
            <path d="M12 12 6.8 3.5" />
            <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    DeepSeek: createIcon(
        "DeepSeek",
        <>
            <path d="M3.4 13.5c.8-3.9 4.2-6.7 8.2-6.7 3.5 0 6.5 2.2 7.7 5.4 1.4-.9 2.5-2.2 3.1-3.8.3 2.4 1.1 4.5 2.5 6.3-2.1 2.6-5.2 4.2-8.6 4.2-3.2 0-6.1-1.5-7.9-3.9-.5-.7-1.2-1.4-2-1.9Z" />
            <path d="M10.2 6.6C9.7 5.1 8.8 4 7.6 3.3" />
            <path d="M12.3 6.8c.2-1.4-.1-2.7-.9-3.8" />
            <path d="M9.4 15.3c.8 1.5 1.9 2.7 3.3 3.6" />
            <circle cx="8.1" cy="11.7" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    Kimi: createIcon(
        "Kimi",
        <>
            <path d="M15.6 3.8a8.6 8.6 0 1 0 4.9 15.6A8.7 8.7 0 0 1 15.6 3.8Z" />
            <path
                d="M19.1 4.2l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z"
                fill="currentColor"
                stroke="none"
            />
        </>,
    ),
    Grok: createIcon(
        "Grok",
        <>
            <path d="M3.5 3.5h5.1l11.9 17h-5.1l-11.9-17Z" fill="currentColor" stroke="none" />
            <path d="M20.5 3.5 14 10.9M10 14.6l-6.5 5.9" />
        </>,
    ),
    Gemini: createIcon(
        "Gemini",
        <>
            <path d="M12 2.4c.6 5.3 4.3 9 9.6 9.6-5.3.6-9 4.3-9.6 9.6-.6-5.3-4.3-9-9.6-9.6 5.3-.6 9-4.3 9.6-9.6Z" />
        </>,
    ),
    Copilot: createIcon(
        "Copilot",
        <>
            <rect x="3" y="4.5" width="12" height="12" rx="5" transform="rotate(-25 9 10.5)" />
            <rect x="9" y="7.5" width="12" height="12" rx="5" transform="rotate(-25 15 13.5)" />
        </>,
    ),
    Llama: createIcon(
        "Llama",
        <>
            <path d="M8.6 20.5v-7.2c0-1.7.6-3.4 1.7-4.7l2.2-2.6V2.9c0-.6.7-.9 1.1-.5l2.3 2.3V2.9c0-.6.7-.9 1.1-.5l2.3 2.3c.3.3.5.7.5 1.1v2.3c0 1-.4 2-1.2 2.7l-2.1 2.1" />
            <path d="M8.6 14.2c2.2.3 4.4-.3 6.1-1.7" />
            <path d="M9.7 17.8h6.2" />
            <circle cx="12.7" cy="10.2" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    Mistral: createIcon(
        "Mistral",
        <>
            <path d="M4 20.5V4.2L12 13l8-8.8v16.3" />
            <path d="M4 9.5h5.6M14.4 9.5H20M4 15h5.6M14.4 15H20" />
        </>,
    ),
    Perplexity: createIcon(
        "Perplexity",
        <>
            <path d="M12 2.6 21.4 12 12 21.4 2.6 12 12 2.6Z" />
            <path d="M7.2 7.2 12 12l4.8-4.8M16.8 16.8 12 12l-4.8 4.8" />
            <path d="M12 2.6v4.1M12 17.3v4.1M2.6 12h4.1M17.3 12h4.1" />
        </>,
    ),
    Qwen: createIcon(
        "Qwen",
        <>
            <rect x="4" y="4" width="14" height="14" rx="7" />
            <path d="m14.9 14.9 5.4 5.4" />
        </>,
    ),
    Doubao: createIcon(
        "Doubao",
        <>
            <path d="M12.2 3.6c4.6 0 8.3 3.3 8.3 7.4 0 4.1-3.7 7.4-8.3 7.4-1 0-2-.2-2.9-.5l-4.1 2.1.9-3.9c-1.4-1.4-2.2-3.2-2.2-5.1 0-4.1 3.7-7.4 8.3-7.4Z" />
            <circle cx="9.2" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="14.8" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <path d="M9.5 13.4c1.4 1.3 3.6 1.3 5 0" />
        </>,
    ),
    Ernie: createIcon(
        "Ernie",
        <>
            <rect x="3.1" y="3.1" width="17.8" height="17.8" rx="4.1" />
            <circle cx="12" cy="7" r="0.9" fill="currentColor" stroke="none" />
            <path d="M7.8 9.7h8.4" />
            <path d="m7.8 12.5 8.4 8M7.8 20.5l8.4-8" />
        </>,
    ),
    Hunyuan: createIcon(
        "Hunyuan",
        <>
            <circle cx="12" cy="12" r="8.8" />
            <path d="M12 3.2a4.4 4.4 0 0 1 0 8.8 4.4 4.4 0 0 0 0 8.8" />
            <circle cx="12" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="16.4" r="1.1" fill="currentColor" stroke="none" />
        </>,
    ),
    Spark: createIcon(
        "Spark",
        <>
            <path
                d="M12 8c.5 2.4 1.6 3.5 4 4-2.4.5-3.5 1.6-4 4-.5-2.4-1.6-3.5-4-4 2.4-.5 3.5-1.6 4-4Z"
                fill="currentColor"
                stroke="none"
            />
            <path d="M4.5 4.5c1.5.5 2.5 1.5 3 3M19.5 4.5c-1.5.5-2.5 1.5-3 3M4.5 19.5c1.5-.5 2.5-1.5 3-3M19.5 19.5c-1.5-.5-2.5-1.5-3-3" />
        </>,
    ),
    Baichuan: createIcon(
        "Baichuan",
        <>
            <path d="M3 8.1c4.2 0 5.2-4.1 9.2-4.1s4.8 4.1 8.8 4.1" />
            <path d="M3 14c4.2 0 5.2-4.1 9.2-4.1s4.8 4.1 8.8 4.1" />
            <path d="M5.5 19.9c3.5 0 4.5-4.1 7.8-4.1s4 4.1 7.2 4.1" />
        </>,
    ),
    MiniMax: createIcon(
        "MiniMax",
        <>
            <path d="M3.8 20V4.2L12 13l8.2-8.8V20" />
            <path d="M8.2 20v-5l3.8 3 3.8-3v5" />
        </>,
    ),
    Yi: createIcon(
        "Yi",
        <>
            <path d="M3.5 14.2c4.7 1 12.1.8 17-1.4" />
            <circle cx="16.2" cy="8.2" r="1.3" fill="currentColor" stroke="none" />
        </>,
    ),
    GLM: createIcon(
        "GLM",
        <>
            <path d="M19.2 8.2A8.3 8.3 0 1 0 20.5 12v-2.2h-6.4" />
            <path d="M9.2 9.4h4.3l-4.3 5.4h4.3" />
        </>,
    ),
    Phi: createIcon(
        "Phi",
        <>
            <circle cx="12" cy="12" r="6.2" />
            <path d="M12 2.3v19.4" />
        </>,
    ),
    Command: createIcon(
        "Command",
        <>
            <path d="M18.1 6.1A7.5 7.5 0 1 0 18.1 17.9" />
            <path d="M8.8 20 16.5 4" />
        </>,
    ),
    Jurassic: createIcon(
        "Jurassic",
        <>
            <path d="M7.4 4.5h9.9M14.8 4.5v10.8a4.7 4.7 0 0 1-9.4 0v-1.6" />
            <path d="m8.2 4.5-1.5 3M17.3 4.5l1.4 3" />
        </>,
    ),
    Titan: createIcon(
        "Titan",
        <>
            <path d="M4 5.2h16M12 5.2v15M7.6 20.2h8.8" />
            <path d="M4 5.2v3.2M20 5.2v3.2" />
            <path d="m9.4 5.2 2.6 3 2.6-3" />
        </>,
    ),
    Nova: createIcon(
        "Nova",
        <>
            <path d="m12 2.8 2.8 6 6.6.8-4.9 4.5 1.3 6.5L12 17.4l-5.8 3.2 1.3-6.5-4.9-4.5 6.6-.8 2.8-6Z" />
            <circle cx="12" cy="12.2" r="1.1" fill="currentColor" stroke="none" />
        </>,
    ),
    Falcon: createIcon(
        "Falcon",
        <>
            <path d="M3.2 7.8c3.7 0 6.8 1.9 8.8 5 2-3.1 5.1-5 8.8-5-.8 4.2-4.1 7.3-8.3 7.8L11.3 21l-1.2-5.4c-4.2-.5-7.5-3.6-8.3-7.8Z" />
            <circle cx="12" cy="10.1" r="0.8" fill="currentColor" stroke="none" />
        </>,
    ),
    Sora: createIcon(
        "Sora",
        <>
            <ellipse cx="12" cy="12" rx="9" ry="4.6" transform="rotate(-28 12 12)" />
            <path d="M4.2 13.2c2.1-2.6 4.8-3.9 7.8-3.9s5.7 1.3 7.8 3.9" />
            <circle cx="18.9" cy="7.1" r="1.1" fill="currentColor" stroke="none" />
        </>,
    ),
    Midjourney: createIcon(
        "Midjourney",
        <>
            <path d="M11 4.2 4.8 16.5H11V4.2Z" />
            <path d="M13 6.8l6.2 9.7H13V6.8Z" />
            <path d="M12 2.8v13.7" />
            <path d="M3.5 16.5h17l-3.1 4H6.6l-3.1-4Z" />
        </>,
    ),
    Flux: createIcon(
        "Flux",
        <>
            <path d="M7 21c0-6.6.9-11.6 2.8-14.9 1.2-2 2.9-3.2 5.2-3.3" />
            <path d="M8.2 8.9c3.2-1.1 6.9-1.3 10.3-.5" />
            <path d="M7.9 14.2c2.9-1 6.2-1.2 9.9-.6" />
            <circle cx="18.9" cy="8.5" r="0.8" fill="currentColor" stroke="none" />
        </>,
    ),
    Runway: createIcon(
        "Runway",
        <>
            <path d="M5.5 20.5V4h5.7a5.2 5.2 0 0 1 0 10.4H5.5" />
            <path d="m11 14.4 8.5 6.1M15.5 20.5h4.5V16" />
        </>,
    ),
    Ideogram: createIcon(
        "Ideogram",
        <>
            <circle cx="12" cy="12" r="8.7" />
            <path d="M9.3 7.8h5.4M12 7.8v8.4M9.3 16.2h5.4" />
        </>,
    ),
};
