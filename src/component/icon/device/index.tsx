import { createIcon, type Icon } from "../types";

export type DeviceIconName =
    | "Laptop"
    | "Desktop"
    | "Tablet"
    | "Watch"
    | "Camera"
    | "Printer"
    | "Keyboard"
    | "Mouse"
    | "Battery"
    | "Wifi"
    | "Bluetooth"
    | "Speaker";

export const deviceIcons: Record<DeviceIconName, Icon> = {
    Laptop: createIcon(
        "Laptop",
        <>
            <rect x="4" y="4.5" width="16" height="11" rx="1.8" />
            <path d="M2.5 18.5h19" />
            <path d="M5.5 15.5 3 18.5M18.5 15.5 21 18.5" />
        </>,
    ),
    Desktop: createIcon(
        "Desktop",
        <>
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M9 20h6M12 16v4" />
        </>,
    ),
    Tablet: createIcon(
        "Tablet",
        <>
            <rect x="5.5" y="2.5" width="13" height="19" rx="2.5" />
            <path d="M11 18.5h2" />
        </>,
    ),
    Watch: createIcon(
        "Watch",
        <>
            <rect x="7" y="7" width="10" height="10" rx="3" />
            <path d="M9 7V3.5h6V7M9 17v3.5h6V17" />
            <path d="M12 10.4V12l1.6.9" />
        </>,
    ),
    Camera: createIcon(
        "Camera",
        <>
            <path d="M3 8.8A2.8 2.8 0 0 1 5.8 6h1.1l1.3-2h7.6l1.3 2h1.1A2.8 2.8 0 0 1 21 8.8v7.4a2.8 2.8 0 0 1-2.8 2.8H5.8A2.8 2.8 0 0 1 3 16.2Z" />
            <circle cx="12" cy="12.4" r="3.4" />
        </>,
    ),
    Printer: createIcon(
        "Printer",
        <>
            <path d="M7 9V3.5h10V9" />
            <rect x="3.5" y="9" width="17" height="6.5" rx="2" />
            <path d="M7 13.5h10v7H7Z" />
            <circle cx="17.4" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    Keyboard: createIcon(
        "Keyboard",
        <>
            <rect x="2.5" y="6" width="19" height="12" rx="2" />
            <path d="M6 9.5h.01M9.5 9.5h.01M13 9.5h.01M16.5 9.5h.01M6 13h.01M9.5 13h.01M13 13h.01M16.5 13h.01" />
            <path d="M8.5 15.8h7" />
        </>,
    ),
    Mouse: createIcon(
        "Mouse",
        <>
            <rect x="7" y="2.5" width="10" height="19" rx="5" />
            <path d="M12 6.5v4" />
        </>,
    ),
    Battery: createIcon(
        "Battery",
        <>
            <rect x="2.5" y="7.5" width="17" height="9" rx="2.5" />
            <path d="M22 10.5v3" />
            <rect x="5.5" y="10" width="7" height="4" rx="1" fill="currentColor" stroke="none" />
        </>,
    ),
    Wifi: createIcon(
        "Wifi",
        <>
            <path d="M2.5 8.6a15 15 0 0 1 19 0" />
            <path d="M5.6 12.2a10.4 10.4 0 0 1 12.8 0" />
            <path d="M8.7 15.8a5.8 5.8 0 0 1 6.6 0" />
            <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
        </>,
    ),
    Bluetooth: createIcon("Bluetooth", <path d="m7 7.5 10 9-5 4.5V3l5 4.5-10 9" />),
    Speaker: createIcon(
        "Speaker",
        <>
            <rect x="5" y="2.5" width="14" height="19" rx="3" />
            <circle cx="12" cy="15.2" r="3.2" />
            <circle cx="12" cy="7" r="1.3" />
        </>,
    ),
};
