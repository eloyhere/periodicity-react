/* eslint-disable @typescript-eslint/typedef -- Literal icon specs are intentionally concise. */
import { createIcon, type Icon } from "../types";

const specs = [
    ["Resistor", "M3 12h4l2-4 4 8 2-4h6"],
    ["Capacitor", "M8 5v14M16 5v14M3 12h5M16 12h5"],
    ["Inductor", "M4 12c0-3 4-3 4 0s4 3 4 0 4-3 4 0 4 3 4 0"],
    ["Diode", "M6 12h4l4-5v10l-4-5M14 12h4M16 5v14"],
    ["LED", "M5 12h5l3-4v8l-3-4M13 12h6M16 5v14M18 4l-2 2M20 6l-2 2"],
    ["Transistor", "M6 12h4M10 6v12M10 9l5-3M10 15l5 3M15 5v3M15 16v3"],
    ["BatteryCell", "M4 8h14v8H4zM20 10v4M7 12h4M9 10v4"],
    ["Circuit", "M4 6h6v6H4zM14 12h6v6h-6zM10 9h4M12 9v3"],
    ["Chip", "M7 7h10v10H7zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"],
    ["Oscilloscope", "M3 5h18v14H3zM6 12c2-5 4 5 6 0s4-5 6 0"],
    ["Multimeter", "M5 3h14v18H5zM8 7h8v5H8zM12 15v3M9 16h6"],
    ["SolderingIron", "M4 18l10-10 3 3-10 10H4zM14 8l2-2M17 11l2-2"],
    [
        "Breadboard",
        "M3 6h18v12H3zM6 9h.01M9 9h.01M12 9h.01M15 9h.01M18 9h.01M6 12h.01M9 12h.01M12 12h.01M15 12h.01M18 12h.01M6 15h.01M9 15h.01M12 15h.01M15 15h.01M18 15h.01",
    ],
    ["PCB", "M4 4h16v16H4zM8 8h4v4H8zM14 8h2M14 12h2M8 15h8"],
    ["Switch", "M4 12h4M16 12h4M8 12a4 4 0 0 1 8 0M8 12l5-4"],
    ["Relay", "M4 8h6v8H4zM14 8h6v8h-6zM10 12h4M16 4v4M16 16v4"],
    [
        "Transformer",
        "M6 4v16M18 4v16M6 8h6a3 3 0 0 1 0 6H6M18 8h-6a3 3 0 0 0 0 6h6",
    ],
    ["Fuse", "M3 10h4v4H3zM17 10h4v4h-4zM7 12h10M9 9l6 6"],
    ["Ground", "M12 4v8M6 12h12M8 15h8M10 18h4"],
    ["Voltage", "M12 3v18M8 6l4-3 4 3M8 18l4 3 4-3"],
    ["Current", "M4 12h16M8 6l4 6-4 6M16 6l-4 6 4 6"],
    ["Ohm", "M5 12a7 7 0 0 1 14 0v7H5v-7Z"],
    ["WaveformDisplay", "M3 12h3l2-6 4 12 3-8 2 2h4"],
    ["Antenna", "M12 21V9M8 21h8M12 9a5 5 0 1 0 .01 0M6 4l3 3M18 4l-3 3"],
    ["SpeakerDriver", "M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"],
    [
        "Microphone",
        "M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v3M9 20h6",
    ],
    ["Sensor", "M4 12a8 8 0 0 1 16 0M7 12a5 5 0 0 1 10 0M10 12a2 2 0 0 1 4 0M12 12h.01"],
    ["Motor", "M4 9h12v6H4zM16 10l4-2v8l-4-2M7 9V6M10 9V6M7 15v3M10 15v3"],
    ["SolarCell", "M4 6h16v12H4zM4 12h16M12 6v12M7 9h.01M17 15h.01"],
    ["PowerSupply", "M4 5h16v14H4zM8 9v6M16 9v6M8 12h8"],
    ["Potentiometer", "M3 12h4l2-4 4 8 2-4h6M12 4v4M12 8l3-3"],
    ["Thermistor", "M3 12h4l2-4 4 8 2-4h6M12 17v4M10 21h4"],
    ["Photoresistor", "M3 12h4l2-4 4 8 2-4h6M17 4l-2 2M20 7l-2 2"],
    ["Varistor", "M3 12h4l2-4 4 8 2-4h6M17 4l-2 4M20 7l-3 1"],
    ["ZenerDiode", "M6 12h4l4-5v10l-4-5M14 12h4M16 5v14M16 5l-2 2M16 19l2-2"],
    ["BridgeRectifier", "M4 4h16v16H4zM8 8l4 4-4 4M16 8l-4 4 4 4"],
    ["Thyristor", "M6 12h4l4-5v10l-4-5M14 12h4M16 5v14M18 14l2 4"],
    ["MOSFET", "M6 12h4M10 6v12M10 9l5-3M10 15l5 3M15 5v3M15 16v3M17 12h3"],
    ["OperationalAmplifier", "M5 5v14l14-7L5 5ZM8 9h4M10 7v4M8 15h4"],
    ["VoltageRegulator", "M5 7h14v10H5zM3 9h2M19 9h2M12 17v3M9 20h6M8 11h8"],
    ["Crystal", "M9 5h6M9 19h6M12 5v14M7 9h4v6H7zM13 9h4v6h-4z"],
    ["Connector", "M5 9h6v6H5zM11 10h4v4h-4zM15 12h6M8 9V6M8 15v3"],
    ["HighVoltage", "M12 3 22 20H2L12 3ZM13 8l-3 5h3l-1 4 4-6h-3l0-3Z"],
    ["ElectricShock", "M13 2 7 12h4l-1 10 7-12h-4l0-8ZM4 4l3 3M20 4l-3 3M4 20l3-3M20 20l-3-3"],
] as const;

/**
 * Electronics and hardware icon names.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: ElectronicsIconName = "Resistor";
 */
export type ElectronicsIconName = (typeof specs)[number][0];

export const electronicsIcons: Record<ElectronicsIconName, Icon> = Object.fromEntries(
    specs.map(
        ([name, d]: (typeof specs)[number]): [ElectronicsIconName, Icon] => [
            name,
            createIcon(name, <path d={d} />),
        ],
    ),
) as Record<ElectronicsIconName, Icon>;
