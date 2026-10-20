import { createIcon, type Icon } from "../types";

export type EmotionIconName =
    | "Smile"
    | "Cry"
    | "Sad"
    | "Laugh"
    | "Angry"
    | "Happy"
    | "Joy"
    | "Confused"
    | "Love"
    | "Wink"
    | "Surprised"
    | "Sleep"
    | "Nervous"
    | "Calm"
    | "Excited"
    | "Bored";

export const emotionIcons: Record<EmotionIconName, Icon> = {
    Smile: createIcon(
        "Smile",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7.2 7.4c.8-.7 1.8-.7 2.6 0M14.2 7.4c.8-.7 1.8-.7 2.6 0" />
            <circle cx="8.8" cy="10.2" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15.2" cy="10.2" r="0.8" fill="currentColor" stroke="none" />
            <path d="M8 14.5c1 1.5 2.4 2.3 4 2.3s3-.8 4-2.3" />
        </>,
    ),
    Cry: createIcon(
        "Cry",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7 8.3 9.4 7M17 8.3 14.6 7" />
            <circle cx="8.8" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15.2" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <path d="M8.5 12c-.9 1.1-.8 2.2.2 2.6 1-.4 1.1-1.5.2-2.6l-.2-.3Z" />
            <path d="M9.6 15.8c0 1.6 1 2.6 2.4 2.6s2.4-1 2.4-2.6c-1.6-.7-3.2-.7-4.8 0Z" />
        </>,
    ),
    Sad: createIcon(
        "Sad",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7 8.3 9.4 7M17 8.3 14.6 7" />
            <circle cx="8.8" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15.2" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <path d="M8.3 17c1-1.4 2.2-2.1 3.7-2.1s2.7.7 3.7 2.1" />
        </>,
    ),
    Laugh: createIcon(
        "Laugh",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7.2 7.3c.8-.5 1.8-.5 2.6 0M14.2 7.3c.8-.5 1.8-.5 2.6 0" />
            <path d="M7.6 10.2c.7-.9 1.7-.9 2.4 0M14 10.2c.7-.9 1.7-.9 2.4 0" />
            <path d="M7.8 13.8h8.4c0 2.7-1.9 4.4-4.2 4.4s-4.2-1.7-4.2-4.4Z" />
        </>,
    ),
    Angry: createIcon(
        "Angry",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7 7 9.7 8.8M17 7 14.3 8.8" />
            <circle cx="8.8" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15.2" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            <path d="M8.4 17.2c1-1.2 2.2-1.8 3.6-1.8s2.6.6 3.6 1.8" />
        </>,
    ),
    Happy: createIcon(
        "Happy",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7.1 6.9c.8-.7 1.9-.7 2.7 0M14.2 6.9c.8-.7 1.9-.7 2.7 0" />
            <circle cx="8.8" cy="10.2" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15.2" cy="10.2" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="7.4" cy="13.2" r="0.7" fill="currentColor" stroke="none" />
            <circle cx="16.6" cy="13.2" r="0.7" fill="currentColor" stroke="none" />
            <path d="M8.1 14.1h7.8c-.4 1.7-1.8 2.8-3.9 2.8s-3.5-1.1-3.9-2.8Z" />
        </>,
    ),
    Joy: createIcon(
        "Joy",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7.2 7.1c.8-.7 1.8-.7 2.6 0M14.2 7.1c.8-.7 1.8-.7 2.6 0" />
            <path d="M7.5 10.3c.8-1 1.8-1 2.5 0M14 10.3c.8-1 1.8-1 2.5 0" />
            <path d="M7.8 14.2c1.2 2 2.6 3 4.2 3s3-1 4.2-3" />
        </>,
    ),
    Confused: createIcon(
        "Confused",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M6.9 6.9c.8-.8 1.9-.7 2.6.1M14.5 8.2h2.7" />
            <circle cx="8.8" cy="10.2" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15.2" cy="10.6" r="0.8" fill="currentColor" stroke="none" />
            <path d="M8.4 15.9c1.1.9 2.2-.7 3.4 0s2.3.6 3.5-.1" />
        </>,
    ),
    Love: createIcon(
        "Love",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8.6 11.7 6.9 10c-.8-.8-.3-2 .7-2 .5 0 .9.3 1 .7.1-.4.5-.7 1-.7 1 0 1.5 1.2.7 2l-1.7 1.7Z" />
            <path d="M15.4 11.7 13.7 10c-.8-.8-.3-2 .7-2 .5 0 .9.3 1 .7.1-.4.5-.7 1-.7 1 0 1.5 1.2.7 2l-1.7 1.7Z" />
            <path d="M9 15.6c.9 1.2 2 1.9 3 1.9s2.1-.7 3-1.9" />
        </>,
    ),
    Wink: createIcon(
        "Wink",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7.2 7.3c.8-.7 1.8-.7 2.6 0M14.1 6.8c.9-.4 1.9-.3 2.6.2" />
            <circle cx="8.8" cy="10.2" r="0.8" fill="currentColor" stroke="none" />
            <path d="M13.9 10.2h3.2" />
            <path d="M8.4 15.2c1 1.4 2.2 2.1 3.6 2.1 1.1 0 2.1-.5 2.9-1.4" />
        </>,
    ),
    Surprised: createIcon(
        "Surprised",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7.1 6.6c.8-.7 1.9-.7 2.7 0M14.2 6.6c.8-.7 1.9-.7 2.7 0" />
            <circle cx="8.8" cy="10" r="1.2" />
            <circle cx="15.2" cy="10" r="1.2" />
            <circle cx="12" cy="16" r="1.8" />
        </>,
    ),
    Sleep: createIcon(
        "Sleep",
        <>
            <circle cx="11.5" cy="12.5" r="8.5" />
            <path d="M7.4 10.7c.7.6 1.5.6 2.2 0M12.4 10.7c.7.6 1.5.6 2.2 0" />
            <path d="M10.2 16.2h2.6" />
            <path d="M17.5 2.5h4l-4 4h4M19.5 8h2.5l-2.5 2.5h2.5" />
        </>,
    ),
    Nervous: createIcon(
        "Nervous",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7.1 8.6 9.5 7.5M16.9 8.6 14.5 7.5" />
            <circle cx="8.8" cy="10.2" r="1.1" />
            <circle cx="15.2" cy="10.2" r="1.1" />
            <path d="M8.6 16c1 .7 2-.6 3.4 0s2.2.5 3.4-.1" />
            <path d="M19.9 6.2c-.8 1.1-.7 2 .2 2.3.9-.3 1-1.2.2-2.3l-.2-.4Z" />
        </>,
    ),
    Calm: createIcon(
        "Calm",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7.2 7.3h2.6M14.2 7.3h2.6" />
            <path d="M7.5 10.3c.7.5 1.5.5 2.2 0M14.3 10.3c.7.5 1.5.5 2.2 0" />
            <path d="M8.5 15.2c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" />
        </>,
    ),
    Excited: createIcon(
        "Excited",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7.1 6.6c.8-.7 1.9-.7 2.7 0M14.2 6.6c.8-.7 1.9-.7 2.7 0" />
            <circle cx="8.8" cy="9.8" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="15.2" cy="9.8" r="1.1" fill="currentColor" stroke="none" />
            <path d="M7.8 13.8c.9 1.9 2.4 2.9 4.2 2.9s3.3-1 4.2-2.9" />
        </>,
    ),
    Bored: createIcon(
        "Bored",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7.2 7.8h2.7M14.1 7.8h2.7" />
            <path d="M7.4 10h2.8M13.8 10h2.8" />
            <circle cx="8.8" cy="11" r="0.5" fill="currentColor" stroke="none" />
            <circle cx="15.2" cy="11" r="0.5" fill="currentColor" stroke="none" />
            <path d="M8.8 16.2h6.4" />
        </>,
    ),
};
