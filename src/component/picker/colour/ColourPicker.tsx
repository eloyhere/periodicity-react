import { useId, type ChangeEvent, type FC, type ReactNode } from "react";
import cx from "../../foundation/cx";
import PickerField from "../shared/PickerField";
import "./ColourPicker.css";

const presetColours: readonly string[] = [
    "#1976d2",
    "#0d47a1",
    "#dc004e",
    "#00897b",
    "#7b1fa2",
    "#ed6c02",
];

/**
 * Normalises a CSS colour for the native color input.
 * @param value - Hex colour, with or without alpha.
 * @example
 * const hex = normalizeColour("#fff");
 * @returns A six-digit hex colour.
 */
const normalizeColour: (value: string) => string = (value: string): string => {
    const hex: string = value.trim().toLowerCase();

    if (/^#[0-9a-f]{6}$/i.test(hex)) {
        return hex;
    }

    if (/^#[0-9a-f]{3}$/i.test(hex)) {
        return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }

    return "#000000";
};

/**
 * Props for the Material colour picker.
 * Type: interface.
 * Fields: value, onChange, label, hint, error, disabled, showValue, className.
 * @example
 * <ColourPicker label="Accent" value="#1976d2" onChange={setColour} />
 */
export interface ColourPickerProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    showValue?: boolean;
    className?: string;
}

/**
 * Renders a native colour input, hex value, and a row of presets.
 * @param props - Colour value, label, and presets.
 * @example
 * <ColourPicker label="Brand" value="#1976d2" onChange={setColour} />
 * @returns A colour picker.
 */
const ColourPicker: FC<ColourPickerProps> = ({
    value,
    onChange,
    label,
    hint,
    error,
    disabled = false,
    showValue = true,
    className = "",
}: ColourPickerProps) => {
    const generatedId: string = useId();
    const inputId: string = `${generatedId}-colour`;

    return (
        <PickerField
            label={label}
            hint={hint}
            error={error}
            htmlFor={inputId}
            disabled={disabled}
            className={cx("colour-picker", className)}
        >
            <input
                id={inputId}
                className="colour-picker__input"
                type="color"
                value={normalizeColour(value)}
                disabled={disabled}
                aria-label={`${label} colour`}
                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                    onChange(event.target.value)
                }
            />
            {showValue ? <span className="colour-picker__value">{value}</span> : null}
            <span className="colour-picker__presets">
                {presetColours.map((colour: string): ReactNode => (
                    <button
                        key={colour}
                        type="button"
                        className={cx(
                            "colour-picker__preset",
                            normalizeColour(value) === colour && "colour-picker__preset--selected",
                        )}
                        style={{ background: colour }}
                        aria-label={colour}
                        disabled={disabled}
                        onClick={(): void => onChange(colour)}
                    />
                ))}
            </span>
        </PickerField>
    );
};

export default ColourPicker;
