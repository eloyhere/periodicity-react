/* eslint-disable @typescript-eslint/typedef -- Literal icon specs are intentionally concise. */
import { createIcon, type Icon } from "../types";

const specs = [
    ["Workstation", "M3 4h18v12H3zM8 20h8M12 16v4"],
    ["NotebookDevice", "M5 5h14v10H5zM3 19h18l-2-4H5l-2 4Z"],
    ["Server", "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01"],
    ["Database", "M12 3c4 0 7 1.3 7 3s-3 3-7 3-7-1.3-7-3 3-3 7-3ZM5 6v6c0 1.7 3 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3 3 7 3s7-1.3 7-3v-6"],
    ["CloudService", "M7 18a4 4 0 0 1 0-8 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 18 18H7Z"],
    ["Terminal", "M3 4h18v16H3zM6 9l3 3-3 3M12 15h6"],
    ["Code", "M8 6 3 12l5 6M16 6l5 6-5 6M14 4l-4 16"],
    ["BugReport", "M8 8h8v8H8zM9 8V6M15 8V6M9 16v2M15 16v2M8 11H5M8 14H5M16 11h3M16 14h3M12 5v3M12 16v3"],
    ["Microchip", "M7 7h10v10H7zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"],
    ["Motherboard", "M4 4h16v16H4zM8 8h4v4H8zM15 7h2M15 11h2M8 15h8M15 15h2"],
    ["KeyboardDevice", "M3 7h18v10H3zM6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7 14h10"],
    ["MouseDevice", "M12 3a5 5 0 0 1 5 5v8a5 5 0 0 1-10 0V8a5 5 0 0 1 5-5ZM12 3v7"],
    ["Display", "M4 4h16v13H4zM8 21h8M12 17v4"],
    ["PrintDevice", "M6 8V3h12v5M4 8h16v9H4zM7 13h10v7H7z"],
    ["Router", "M3 12h18v7H3zM7 15h.01M11 15h.01M15 15h.01M7 12l-3-5M17 12l3-5"],
    ["USB", "M12 21V5M12 5l-3 3M12 5l3 3M12 12l-4 3M12 16l4 3M8 15v2M16 19v2"],
    ["HardDrive", "M4 5h16v14H4zM4 13h16M8 16h.01M12 16h.01"],
    ["SSD", "M4 5h16v14H4zM8 9h8v6H8zM15 17h2"],
    ["RAM", "M4 8h16v8H4zM7 11v2M11 11v2M15 11v2M19 11v2M6 16v2M10 16v2M14 16v2M18 16v2"],
    ["CPU", "M8 8h8v8H8zM10 4v4M14 4v4M10 16v4M14 16v4M4 10h4M4 14h4M16 10h4M16 14h4"],
    ["GPU", "M3 6h18v12H3zM7 10h10v4H7zM7 18v3M17 18v3"],
    ["Network", "M12 4a3 3 0 1 0 .01 0M4 20a3 3 0 1 0 .01 0M20 20a3 3 0 1 0 .01 0M12 7v6M12 13l-6 4M12 13l6 4"],
    ["Directory", "M3 6h7l2 2h9v11H3z"],
    ["FileCode", "M6 3h8l4 4v14H6zM14 3v5h4M9 12l-2 3 2 3M15 12l2 3-2 3"],
    ["GitBranch", "M6 4v16M6 8h7a4 4 0 0 1 4 4v8M6 12h3M18 20a2 2 0 1 0 .01 0M6 6a2 2 0 1 0 .01 0"],
    ["Container", "M4 7l8-4 8 4v10l-8 4-8-4V7ZM4 7l8 4 8-4M12 11v10"],
    ["VirtualMachine", "M4 4h16v12H4zM8 20h8M12 16v4M8 8h3v4H8z"],
    ["Backup", "M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5M18 3v4h-4M6 21v-4h4"],
    ["FirewallRule", "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14M15 5v14"],
    ["Binary", "M7 6h2v12H7zM15 6h2v12h-2zM5 9h6M13 15h6"],
] as const;

/**
 * Computer and software engineering icon names.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: ComputerIconName = "Terminal";
 */
export type ComputerIconName = (typeof specs)[number][0];

export const computerIcons: Record<ComputerIconName, Icon> = Object.fromEntries(
    specs.map(
        ([name, d]: (typeof specs)[number]): [ComputerIconName, Icon] => [
            name,
            createIcon(name, <path d={d} />),
        ],
    ),
) as Record<ComputerIconName, Icon>;
