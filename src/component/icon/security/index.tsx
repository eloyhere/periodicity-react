import { createIcon, type Icon } from "../types";

export type SecurityIconName =
    | "Shield"
    | "Key"
    | "Fingerprint"
    | "Alert"
    | "Warning"
    | "Bug"
    | "Scan"
    | "Encrypted"
    | "EyeOff"
    | "Verified"
    | "Firewall";

export const securityIcons: Record<SecurityIconName, Icon> = {
    Shield: createIcon(
        "Shield",
        <path d="M12 3 4.5 5.9v5.7c0 4.4 3.1 7.6 7.5 9.4 4.4-1.8 7.5-5 7.5-9.4V5.9Z" />,
    ),
    Key: createIcon(
        "Key",
        <>
            <circle cx="8.2" cy="8.2" r="4.6" />
            <path d="m11.5 11.5 8 8" />
            <path d="m16.8 16.8 1.8-1.8M14.3 14.3l1.8-1.8" />
        </>,
    ),
    Fingerprint: createIcon(
        "Fingerprint",
        <>
            <path d="M12 4.2a7.8 7.8 0 0 0-7.8 7.8c0 2 .5 3.9 1.4 5.6" />
            <path d="M19.8 12A7.8 7.8 0 0 0 12 4.2" />
            <path d="M12 7.6a4.4 4.4 0 0 0-4.4 4.4c0 2 .4 4 1.3 5.7" />
            <path d="M16.4 12A4.4 4.4 0 0 0 12.6 7.7" />
            <path d="M12 11.2a.9.9 0 0 0-.9.9c0 2.2.5 4.3 1.4 6.2" />
        </>,
    ),
    Alert: createIcon(
        "Alert",
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5v5" />
            <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
        </>,
    ),
    Warning: createIcon(
        "Warning",
        <>
            <path d="M12 3.6 2.2 20.4h19.6Z" />
            <path d="M12 9.5v4.6" />
            <circle cx="12" cy="17.3" r="1" fill="currentColor" stroke="none" />
        </>,
    ),
    Bug: createIcon(
        "Bug",
        <>
            <path d="M8 9.5a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0Z" />
            <path d="M12 8v8" />
            <path d="M4.5 7 7.3 9.2M19.5 7 16.7 9.2M3.5 12.5H7M17 12.5h3.5M4.5 18.5 7.3 16.5M19.5 18.5 16.7 16.5" />
            <path d="M9.6 4.7 8 3M14.4 4.7 16 3" />
        </>,
    ),
    Scan: createIcon(
        "Scan",
        <>
            <path d="M3.5 8.5V6a2.5 2.5 0 0 1 2.5-2.5h2.5M15.5 3.5H18A2.5 2.5 0 0 1 20.5 6v2.5M20.5 15.5V18a2.5 2.5 0 0 1-2.5 2.5h-2.5M8.5 20.5H6A2.5 2.5 0 0 1 3.5 18v-2.5" />
            <path d="M3.5 12h17" />
        </>,
    ),
    Encrypted: createIcon(
        "Encrypted",
        <>
            <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            <circle cx="12" cy="14.6" r="1.3" />
            <path d="M12 15.9v1.5" />
        </>,
    ),
    EyeOff: createIcon(
        "EyeOff",
        <>
            <path d="M2.5 12s3.6-6.2 9.5-6.2S21.5 12 21.5 12s-3.6 6.2-9.5 6.2S2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="2.8" />
            <path d="m4 4 16 16" />
        </>,
    ),
    Verified: createIcon(
        "Verified",
        <>
            <path d="M12 2.8 14.4 4.5 17.4 4.2 18.6 6.9 21.2 8.4 20.4 11.3 21.2 14.2 18.6 15.7 17.4 18.4 14.4 18.1 12 19.8 9.6 18.1 6.6 18.4 5.4 15.7 2.8 14.2 3.6 11.3 2.8 8.4 5.4 6.9 6.6 4.2 9.6 4.5Z" />
            <path d="m8.6 11.4 2.2 2.2 4.4-4.5" />
        </>,
    ),
    Firewall: createIcon(
        "Firewall",
        <>
            <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" />
            <path d="M2.5 9.5h19M2.5 14.5h19" />
            <path d="M8 4.5v5M16 4.5v5M12 9.5v5M8 14.5v5M16 14.5v5" />
        </>,
    ),
};
