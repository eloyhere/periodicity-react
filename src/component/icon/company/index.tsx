import { createIcon, type Icon } from "../types";

export type CompanyIconName =
    | "Google"
    | "Baidu"
    | "Tencent"
    | "Microsoft"
    | "Alphabet"
    | "AppleLogo"
    | "Amazon"
    | "Meta"
    | "Nvidia"
    | "ByteDance"
    | "Alibaba"
    | "Huawei"
    | "Xiaomi"
    | "Samsung"
    | "Sony"
    | "Netflix"
    | "Tesla"
    | "SpaceX"
    | "Adobe"
    | "Oracle"
    | "IBM"
    | "Intel"
    | "AMD"
    | "Salesforce"
    | "SAP"
    | "Uber"
    | "Airbnb"
    | "Spotify"
    | "GitHub"
    | "Figma"
    | "Notion"
    | "Slack"
    | "Discord"
    | "Zoom"
    | "PayPal"
    | "Visa"
    | "Mastercard"
    | "Stripe"
    | "Shopify"
    | "X";

export const companyIcons: Record<CompanyIconName, Icon> = {
    Google: createIcon(
        "Google",
        <>
            <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
            <path d="M20.5 12H12" />
            <path d="M20.2 5.9v4.6h-4.6" />
        </>,
    ),
    Baidu: createIcon(
        "Baidu",
        <>
            <ellipse cx="12" cy="15" rx="4.6" ry="3.8" />
            <circle cx="6.4" cy="10.2" r="1.9" />
            <circle cx="10.3" cy="7.4" r="1.9" />
            <circle cx="14.7" cy="7.4" r="1.9" />
            <circle cx="18.3" cy="10.2" r="1.9" />
        </>,
    ),
    Tencent: createIcon(
        "Tencent",
        <>
            <path d="M12 3.5c-3.6 0-5.8 2.8-5.8 6.3 0 1.7-.9 2.8-1.8 4.2-.8 1.3.1 2.7 1.7 2.3 1.2-.3 2.1-1.1 2.8-2.1.9 1.5 2 2.4 3.1 2.4s2.2-.9 3.1-2.4c.7 1 1.6 1.8 2.8 2.1 1.6.4 2.5-1 1.7-2.3-.9-1.4-1.8-2.5-1.8-4.2 0-3.5-2.2-6.3-5.8-6.3Z" />
            <circle cx="9.8" cy="9" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="14.2" cy="9" r="0.8" fill="currentColor" stroke="none" />
            <path d="m10.5 11.8 1.5 1 1.5-1" />
        </>,
    ),
    Microsoft: createIcon(
        "Microsoft",
        <>
            <rect x="3.5" y="3.5" width="7.5" height="7.5" />
            <rect x="13" y="3.5" width="7.5" height="7.5" />
            <rect x="3.5" y="13" width="7.5" height="7.5" />
            <rect x="13" y="13" width="7.5" height="7.5" />
        </>,
    ),
    Alphabet: createIcon(
        "Alphabet",
        <>
            <path d="M12 3 21 21H3L12 3Z" />
            <path d="M8.2 15h7.6" />
            <path d="M12 9v12" />
        </>,
    ),
    AppleLogo: createIcon(
        "AppleLogo",
        <>
            <path d="M15.8 7.2c-.7.5-1.5.8-2.4.8-.9 0-1.7-.3-2.4-.8-1.7 0-3.4 1.4-3.4 4.1 0 3.4 2.4 6.7 4.1 6.7.8 0 1.2-.4 1.8-.4s1 .4 1.8.4c1.7 0 4.1-3.3 4.1-6.7 0-2.7-1.7-4.1-3.4-4.1Z" />
            <path d="M12 7.2c.1-1.7 1.2-3.1 2.8-3.6" />
            <path d="M15.3 4.1c1.2-.9 2.6-.8 3.5 0-1 .8-2.4 1-3.5 0Z" />
        </>,
    ),
    Amazon: createIcon(
        "Amazon",
        <>
            <path d="M4 16.5c4.6 3.8 11.4 3.8 16 0" />
            <path d="m17.6 15.7 2.4.8-.8 2.4" />
            <path d="M7.5 12.5 12 7l4.5 5.5" />
        </>,
    ),
    Meta: createIcon(
        "Meta",
        <>
            <path d="M12 12c-2.2-4-4.2-5.8-6.1-5.8-2.1 0-3.4 2.2-3.4 5.8s1.3 5.8 3.4 5.8c1.9 0 3.9-1.8 6.1-5.8Z" />
            <path d="M12 12c2.2-4 4.2-5.8 6.1-5.8 2.1 0 3.4 2.2 3.4 5.8s-1.3 5.8-3.4 5.8c-1.9 0-3.9-1.8-6.1-5.8Z" />
        </>,
    ),
    Nvidia: createIcon(
        "Nvidia",
        <>
            <path d="M2.5 12s4-6 9.5-6 9.5 6 9.5 6-4 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 8.8c2.2.2 3.8 1.4 4.4 3.2" />
        </>,
    ),
    ByteDance: createIcon(
        "ByteDance",
        <>
            <path d="M9 18V6l8-2v11" />
            <circle cx="6.5" cy="18" r="2.5" />
            <circle cx="14.5" cy="15" r="2.5" />
            <path d="M9 9.5l8-2" />
        </>,
    ),
    Alibaba: createIcon(
        "Alibaba",
        <>
            <path d="M4 17c4-1 8-4 10-8 2 4 4 7 6 8" />
            <path d="M7 12c2.5.5 5 1.8 7 3.8" />
            <path d="M17 7c.7.9 1 1.9 1 3" />
        </>,
    ),
    Huawei: createIcon(
        "Huawei",
        <>
            <circle cx="12" cy="12" r="2.4" />
            <path d="M12 3.5c1.4 2.2 1.4 5.4 0 8.5-1.4-3.1-1.4-6.3 0-8.5Z" />
            <path
                d="M12 3.5c1.4 2.2 1.4 5.4 0 8.5-1.4-3.1-1.4-6.3 0-8.5Z"
                transform="rotate(60 12 12)"
            />
            <path
                d="M12 3.5c1.4 2.2 1.4 5.4 0 8.5-1.4-3.1-1.4-6.3 0-8.5Z"
                transform="rotate(120 12 12)"
            />
            <path
                d="M12 3.5c1.4 2.2 1.4 5.4 0 8.5-1.4-3.1-1.4-6.3 0-8.5Z"
                transform="rotate(180 12 12)"
            />
            <path
                d="M12 3.5c1.4 2.2 1.4 5.4 0 8.5-1.4-3.1-1.4-6.3 0-8.5Z"
                transform="rotate(240 12 12)"
            />
            <path
                d="M12 3.5c1.4 2.2 1.4 5.4 0 8.5-1.4-3.1-1.4-6.3 0-8.5Z"
                transform="rotate(300 12 12)"
            />
        </>,
    ),
    Xiaomi: createIcon(
        "Xiaomi",
        <>
            <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
            <path d="M8 16V9h3.2c1.2 0 2 .7 2 1.8s-.8 1.8-2 1.8H8" />
            <path d="M17 9v7" />
            <circle cx="17" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    Samsung: createIcon(
        "Samsung",
        <>
            <ellipse cx="12" cy="12" rx="9" ry="6.5" />
            <path d="M15.5 9.5c-1.2-1.4-4.6-1.1-4.6 1 0 2.2 4.8 1.5 4.8 3.7 0 2.1-3.5 2.4-5.1.8" />
        </>,
    ),
    Sony: createIcon(
        "Sony",
        <>
            <path d="M16.5 7.5c-1.6-1.7-6.5-1.5-6.5 1.4 0 2.8 6 1.9 6 4.6 0 2.6-4.8 2.8-6.7 1" />
            <path d="M4 12h16" opacity="0.35" />
        </>,
    ),
    Netflix: createIcon(
        "Netflix",
        <>
            <path d="M7 3v18l10-18v18" />
            <path d="M7 3h4l6 18h-4" opacity="0.45" />
        </>,
    ),
    Tesla: createIcon(
        "Tesla",
        <>
            <path d="M5 5h14" />
            <path d="M12 5v15" />
            <path d="M8 9h8" />
        </>,
    ),
    SpaceX: createIcon(
        "SpaceX",
        <>
            <path d="M12 3c2.5 2.2 4 5.2 4 8.5 0 2.1-.8 4-2 5.5h-4c-1.2-1.5-2-3.4-2-5.5C8 8.2 9.5 5.2 12 3Z" />
            <path d="M9.5 15.5 8 20l4-1.5 4 1.5-1.5-4.5" />
            <circle cx="12" cy="9" r="1" fill="currentColor" stroke="none" />
        </>,
    ),
    Adobe: createIcon(
        "Adobe",
        <>
            <path d="M4 20 12 4l8 16" />
            <path d="M8 14h8" />
        </>,
    ),
    Oracle: createIcon(
        "Oracle",
        <>
            <ellipse cx="12" cy="12" rx="9" ry="6" />
            <path d="M7 12h10" />
        </>,
    ),
    IBM: createIcon(
        "IBM",
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M4 9h16" />
            <path d="M4 12h16" />
            <path d="M4 15h16" />
        </>,
    ),
    Intel: createIcon(
        "Intel",
        <>
            <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M6 18c3-5 9-7 13-5" />
        </>,
    ),
    AMD: createIcon(
        "AMD",
        <>
            <path d="M4 16 16 4h4v4L8 20H4v-4Z" />
            <path d="m9 15 3-3" />
        </>,
    ),
    Salesforce: createIcon(
        "Salesforce",
        <>
            <path d="M7 17a4 4 0 0 1-.6-7.9A5.5 5.5 0 0 1 17 8.5a4.2 4.2 0 0 1 .5 8.4H7Z" />
        </>,
    ),
    SAP: createIcon(
        "SAP",
        <>
            <path d="M16 7.5c-1.4-1.6-5.7-1.4-5.7 1.2 0 2.5 5.2 1.7 5.2 4.2 0 2.4-4.2 2.6-5.8.9" />
            <path d="M4 4h4l2 16H6L4 4Z" />
        </>,
    ),
    Uber: createIcon(
        "Uber",
        <>
            <path d="M5 7v6a7 7 0 0 0 14 0V7" />
            <path d="M9 7v4h6V7" />
        </>,
    ),
    Airbnb: createIcon(
        "Airbnb",
        <>
            <path d="M12 4c2 0 3.5 3 5 7s2.5 6 1 7-4-2-6-5c-2 3-4.5 6-6 5s-.5-3 1-7 3-7 5-7Z" />
            <path d="M12 12v4" />
        </>,
    ),
    Spotify: createIcon(
        "Spotify",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M7.5 9c3-1 6.5-.5 9 1" />
            <path d="M8 12.2c2.5-.8 5.4-.4 7.6.9" />
            <path d="M8.7 15.3c2-.6 4.2-.3 6 .6" />
        </>,
    ),
    GitHub: createIcon(
        "GitHub",
        <>
            <path d="M12 3a9 9 0 0 0-2.8 17.5c.4.1.6-.2.6-.5v-1.7c-2.5.5-3-1.2-3-1.2-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-2-.2-4.1-1-4.1-4.4 0-1 .3-1.8.9-2.4-.1-.2-.4-1.1.1-2.3 0 0 .8-.3 2.5 1a8.7 8.7 0 0 1 4.6 0c1.7-1.3 2.5-1 2.5-1 .5 1.2.2 2.1.1 2.3.6.6.9 1.4.9 2.4 0 3.4-2.1 4.2-4.1 4.4.3.3.6.9.6 1.8v2.7c0 .3.2.6.6.5A9 9 0 0 0 12 3Z" />
        </>,
    ),
    Figma: createIcon(
        "Figma",
        <>
            <path d="M8 3h4v6H8a3 3 0 0 1 0-6Z" />
            <path d="M12 3h4a3 3 0 0 1 0 6h-4V3Z" />
            <path d="M8 9h4v6H8a3 3 0 0 1 0-6Z" />
            <path d="M12 9h4a3 3 0 0 1 0 6h-4V9Z" />
            <path d="M8 15h4v3a3 3 0 1 1-4-3Z" />
        </>,
    ),
    Notion: createIcon(
        "Notion",
        <>
            <rect x="4" y="3.5" width="16" height="17" rx="3" />
            <path d="M8 8v8" />
            <path d="m8 8 8 8" />
            <path d="M16 8v8" />
        </>,
    ),
    Slack: createIcon(
        "Slack",
        <>
            <rect x="10" y="3" width="4" height="8" rx="2" />
            <rect x="10" y="13" width="4" height="8" rx="2" />
            <rect x="3" y="10" width="8" height="4" rx="2" />
            <rect x="13" y="10" width="8" height="4" rx="2" />
        </>,
    ),
    Discord: createIcon(
        "Discord",
        <>
            <path d="M5 8c2-1.5 4.2-2 7-2s5 .5 7 2l1.5 8c-1.5 1-3 1.5-4.5 2l-1-2h-6l-1 2c-1.5-.5-3-1-4.5-2L5 8Z" />
            <circle cx="9.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="14.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    Zoom: createIcon(
        "Zoom",
        <>
            <rect x="3" y="7" width="12" height="10" rx="2" />
            <path d="m15 10 5-3v10l-5-3" />
        </>,
    ),
    PayPal: createIcon(
        "PayPal",
        <>
            <path d="M7 20 9 4h6c2.5 0 3.5 1.5 3 3.7-.5 2.2-2 3.3-4.3 3.3H10" />
            <path d="M13 20l2-16h5c2 0 3 1.2 2.5 3.2" />
        </>,
    ),
    Visa: createIcon(
        "Visa",
        <>
            <path d="M3 7h4l3 10h4l3-10h4" />
            <path d="M7 7h4l2 10" opacity="0.45" />
        </>,
    ),
    Mastercard: createIcon(
        "Mastercard",
        <>
            <circle cx="9" cy="12" r="5" />
            <circle cx="15" cy="12" r="5" />
            <path d="M12 8.4a5 5 0 0 0 0 7.2" />
        </>,
    ),
    Stripe: createIcon(
        "Stripe",
        <>
            <path d="M16 7.5c-1.2-1.5-5.8-1.3-5.8 1.1 0 2.5 5.8 1.6 5.8 4.4 0 2.6-4.7 2.9-6.4 1.1" />
            <path d="M4 4h16" opacity="0.35" />
        </>,
    ),
    Shopify: createIcon(
        "Shopify",
        <>
            <path d="M6 8h12l1 12H5L6 8Z" />
            <path d="M9 8a3 3 0 0 1 6 0" />
            <path d="M9 12h6" />
        </>,
    ),
    X: createIcon(
        "X",
        <>
            <path d="M5 4l14 16" />
            <path d="M19 4 5 20" />
        </>,
    ),
};
