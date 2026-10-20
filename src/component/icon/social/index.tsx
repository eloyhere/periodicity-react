import { createIcon, type Icon } from "../types";

export type SocialIconName =
    | "Users"
    | "Group"
    | "Profile"
    | "AddUser"
    | "RemoveUser"
    | "Bookmark"
    | "ThumbsUp"
    | "ThumbsDown"
    | "Flag"
    | "Mention"
    | "Share"
    | "Follow"
    | "Like";

export const socialIcons: Record<SocialIconName, Icon> = {
    Users: createIcon(
        "Users",
        <>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6" />
            <path d="M15.8 5.1a3.5 3.5 0 0 1 0 6.4" />
            <path d="M17.4 14.8c2 .8 3.3 2.5 3.7 5.2" />
        </>,
    ),
    Group: createIcon(
        "Group",
        <>
            <circle cx="12" cy="6.6" r="3" />
            <circle cx="4.8" cy="9.8" r="2.4" />
            <circle cx="19.2" cy="9.8" r="2.4" />
            <path d="M7.1 20c.5-3.3 2.4-5.2 4.9-5.2s4.4 1.9 4.9 5.2" />
            <path d="M1.6 18.4c.3-2.2 1.5-3.6 3.2-4M22.4 18.4c-.3-2.2-1.5-3.6-3.2-4" />
        </>,
    ),
    Profile: createIcon(
        "Profile",
        <>
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="9.8" r="3" />
            <path d="M6.4 18.9c.8-2.8 2.9-4.4 5.6-4.4s4.8 1.6 5.6 4.4" />
        </>,
    ),
    AddUser: createIcon(
        "AddUser",
        <>
            <circle cx="10" cy="8" r="3.5" />
            <path d="M3.5 20c.6-3.6 3.2-5.6 6.5-5.6 1.2 0 2.3.3 3.3.8" />
            <path d="M18 13.5v6M15 16.5h6" />
        </>,
    ),
    RemoveUser: createIcon(
        "RemoveUser",
        <>
            <circle cx="10" cy="8" r="3.5" />
            <path d="M3.5 20c.6-3.6 3.2-5.6 6.5-5.6 1.2 0 2.3.3 3.3.8" />
            <path d="M15 16.5h6" />
        </>,
    ),
    Bookmark: createIcon("Bookmark", <path d="M6.5 3.5h11v17l-5.5-4.2-5.5 4.2Z" />),
    ThumbsUp: createIcon(
        "ThumbsUp",
        <>
            <path d="M7 10.5V21H3.5V10.5Z" />
            <path d="M7 10.5 11 3.2a2 2 0 0 1 1.8 2.8L12 9h5.3a2.2 2.2 0 0 1 2.1 2.9l-1.7 6.3a2.5 2.5 0 0 1-2.4 1.8H7" />
        </>,
    ),
    ThumbsDown: createIcon(
        "ThumbsDown",
        <>
            <path d="M7 13.5V3H3.5v10.5Z" />
            <path d="M7 13.5 11 20.8a2 2 0 0 0 1.8-2.8L12 15h5.3a2.2 2.2 0 0 0 2.1-2.9l-1.7-6.3A2.5 2.5 0 0 0 15.3 4H7" />
        </>,
    ),
    Flag: createIcon(
        "Flag",
        <>
            <path d="M5 21V3.5" />
            <path d="M5 4.5h12.5l-3 4 3 4H5" />
        </>,
    ),
    Mention: createIcon(
        "Mention",
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
        </>,
    ),
    Share: createIcon(
        "Share",
        <>
            <circle cx="18" cy="5.5" r="2.8" />
            <circle cx="6" cy="12" r="2.8" />
            <circle cx="18" cy="18.5" r="2.8" />
            <path d="m8.5 10.6 7.1-3.7M8.5 13.4l7.1 3.7" />
        </>,
    ),
    Follow: createIcon(
        "Follow",
        <>
            <circle cx="9.5" cy="8" r="3.5" />
            <path d="M3 20c.6-3.6 3.2-5.6 6.5-5.6 1.1 0 2.1.2 3 .7" />
            <path d="M14.5 17h6M18 14.5 20.5 17 18 19.5" />
        </>,
    ),
    Like: createIcon(
        "Like",
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 16.4c-2.1-1.4-3.6-2.8-3.6-4.5a2 2 0 0 1 3.6-1.2 2 2 0 0 1 3.6 1.2c0 1.7-1.5 3.1-3.6 4.5Z" />
        </>,
    ),
};
