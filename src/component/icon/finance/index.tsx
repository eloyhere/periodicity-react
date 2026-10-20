import { createIcon, type Icon } from "../types";

export type FinanceIconName =
    | "Wallet"
    | "Card"
    | "Coin"
    | "Money"
    | "Bank"
    | "Chart"
    | "PieChart"
    | "Receipt"
    | "Tag"
    | "Gift"
    | "Invoice"
    | "Savings";

export const financeIcons: Record<FinanceIconName, Icon> = {
    Wallet: createIcon(
        "Wallet",
        <>
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </>,
    ),
    Card: createIcon(
        "Card",
        <>
            <rect x="2.5" y="5" width="19" height="14" rx="2" />
            <path d="M2.5 9.5h19" />
            <rect x="6" y="12.5" width="3" height="2.5" rx="0.5" />
            <path d="M14.5 15.5h4" />
        </>,
    ),
    Coin: createIcon(
        "Coin",
        <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M15 8.7h-4.2a2.1 2.1 0 0 0 0 4.2h2.4a2.1 2.1 0 0 1 0 4.2H9" />
            <path d="M12 6.7v10.6" />
        </>,
    ),
    Money: createIcon(
        "Money",
        <>
            <rect x="2.5" y="6.5" width="19" height="11" rx="1.5" />
            <circle cx="12" cy="12" r="2.2" />
            <circle cx="5.7" cy="12" r="0.5" fill="currentColor" stroke="none" />
            <circle cx="18.3" cy="12" r="0.5" fill="currentColor" stroke="none" />
        </>,
    ),
    Bank: createIcon(
        "Bank",
        <>
            <path d="M2.5 9 12 3l9.5 6Z" />
            <path d="M4 10.5h16" />
            <path d="M6 12v6.5M10 12v6.5M14 12v6.5M18 12v6.5" />
            <path d="M3 18.5h18M2 21h20" />
        </>,
    ),
    Chart: createIcon(
        "Chart",
        <>
            <path d="M3.5 3.5v17h17" />
            <path d="M8 20.5v-5M12.5 20.5v-9M17 20.5v-13" />
        </>,
    ),
    PieChart: createIcon(
        "PieChart",
        <>
            <path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z" />
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        </>,
    ),
    Receipt: createIcon(
        "Receipt",
        <>
            <path d="M5 3.5h14V21l-2.4-1.6L14.2 21 12 19.4 9.8 21 7.6 19.6 5 21V3.5Z" />
            <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" />
        </>,
    ),
    Tag: createIcon(
        "Tag",
        <>
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
            <circle cx="7.5" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
        </>,
    ),
    Gift: createIcon(
        "Gift",
        <>
            <path d="M12 7v14M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
            <rect x="3" y="7" width="18" height="4" rx="1" />
            <path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" />
        </>,
    ),
    Invoice: createIcon(
        "Invoice",
        <>
            <path d="M6.5 2.5h7.2L19 7.9v13.6H6.5Z" />
            <path d="M13.7 2.5v5.4H19" />
            <path d="M9.5 10.5h5M9.5 13.5h5M9.5 17h5.5" />
            <path d="M9.5 19.2h7" />
        </>,
    ),
    Savings: createIcon(
        "Savings",
        <>
            <path d="M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" />
            <path d="M16 10h.01" />
            <path d="M2 8v1a2 2 0 0 0 2 2h1" />
        </>,
    ),
};
