import { createIcon, type Icon } from "../types";

export type CommunicationIconName =
    | "Bell"
    | "Mail"
    | "Inbox"
    | "Send"
    | "Chat"
    | "Message"
    | "Megaphone"
    | "Call"
    | "VideoCall"
    | "At"
    | "Hashtag"
    | "Rss"
    | "Voicemail"
    | "Reply"
    | "Forward";

export const communicationIcons: Record<CommunicationIconName, Icon> = {
    Bell: createIcon(
        "Bell",
        <>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </>,
    ),
    Mail: createIcon(
        "Mail",
        <>
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="m3.5 7.5 8.5 6 8.5-6" />
        </>,
    ),
    Inbox: createIcon(
        "Inbox",
        <>
            <path d="M4.5 4h15L22 13v5.5a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5V13l2.5-9Z" />
            <path d="M2 13h5l1.5 2.5h7L17 13h5" />
        </>,
    ),
    Send: createIcon(
        "Send",
        <>
            <path d="m21.5 2.5-6.8 19-3.2-8-8-3.2 18-7.8Z" />
            <path d="M21.5 2.5 11.5 13.5" />
        </>,
    ),
    Chat: createIcon(
        "Chat",
        <>
            <path d="M20.5 11.5a8.5 8.5 0 0 1-8.5 8.5H8l-4 2 1.2-4.1A8.5 8.5 0 1 1 20.5 11.5Z" />
            <circle cx="9" cy="11.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="11.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="15" cy="11.5" r="1" fill="currentColor" stroke="none" />
        </>,
    ),
    Message: createIcon(
        "Message",
        <>
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M7 9.5h10M7 13h10M7 16.5h6" />
        </>,
    ),
    Megaphone: createIcon(
        "Megaphone",
        <>
            <path d="m3 11 18-5v12L3 14v-3Z" />
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </>,
    ),
    Call: createIcon(
        "Call",
        <path d="M4.5 3.5h3l1.7 4.3-2 1.7a14 14 0 0 0 7.3 7.3l1.7-2 4.3 1.7v3a1.5 1.5 0 0 1-1.5 1.5A16.5 16.5 0 0 1 3 5a1.5 1.5 0 0 1 1.5-1.5Z" />,
    ),
    VideoCall: createIcon(
        "VideoCall",
        <>
            <rect x="2.5" y="6.5" width="13" height="11" rx="2.5" />
            <path d="m15.5 10 5.5-3v10l-5.5-3" />
            <path d="M9 9.5v5M6.5 12h5" />
        </>,
    ),
    At: createIcon(
        "At",
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
        </>,
    ),
    Hashtag: createIcon(
        "Hashtag",
        <>
            <line x1="4" x2="20" y1="9" y2="9" />
            <line x1="4" x2="20" y1="15" y2="15" />
            <line x1="10" x2="8" y1="3" y2="21" />
            <line x1="16" x2="14" y1="3" y2="21" />
        </>,
    ),
    Rss: createIcon(
        "Rss",
        <>
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
        </>,
    ),
    Voicemail: createIcon(
        "Voicemail",
        <>
            <circle cx="6" cy="12" r="4" />
            <circle cx="18" cy="12" r="4" />
            <line x1="10" x2="14" y1="12" y2="12" />
        </>,
    ),
    Reply: createIcon(
        "Reply",
        <>
            <polyline points="9 17 4 12 9 7" />
            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
        </>,
    ),
    Forward: createIcon(
        "Forward",
        <>
            <polyline points="15 17 20 12 15 7" />
            <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
        </>,
    ),
};
