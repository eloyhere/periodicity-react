import type { FC, ReactNode } from "react";
import cx from "../../foundation/cx";
import PickerField from "../shared/PickerField";
import "./VariantPicker.css";

/**
 * One selectable variant.
 * Type: interface.
 * Fields: value, label, swatch, disabled.
 * @example
 * const option: VariantOption = { value: "blue", label: "Blue", swatch: "#1976d2" };
 */
export interface VariantOption {
    value: string;
    label: string;
    swatch?: string;
    disabled?: boolean;
}

/**
 * Props for the variant picker.
 * Type: interface.
 * Fields: label, value, onChange, variants, hint, error, disabled, orientation, className.
 * @example
 * <VariantPicker label="Colour" variants={variants} value={value} onChange={setValue} />
 */
export interface VariantPickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    variants: readonly VariantOption[];
    hint?: string;
    error?: string;
    disabled?: boolean;
    orientation?: "horizontal" | "vertical";
    className?: string;
}

/**
 * Renders a radio-style variant selector with optional colour swatches.
 * @param props - Variants, selected value, and label.
 * @example
 * <VariantPicker label="Size" variants={sizes} value={size} onChange={setSize} />
 * @returns A variant picker.
 */
const VariantPicker: FC<VariantPickerProps> = ({
    label,
    value,
    onChange,
    variants,
    hint,
    error,
    disabled = false,
    orientation = "horizontal",
    className = "",
}: VariantPickerProps) => (
    <PickerField
        label={label}
        hint={hint}
        error={error}
        disabled={disabled}
        className={cx("variant-picker", className)}
    >
        <div
            className={cx(
                "variant-picker__options",
                `variant-picker__options--${orientation}`,
            )}
            role="radiogroup"
            aria-label={label}
        >
            {variants.map((variant: VariantOption): ReactNode => {
                const selected: boolean = variant.value === value;
                const optionDisabled: boolean = disabled || variant.disabled === true;

                return (
                    <button
                        key={variant.value}
                        type="button"
                        className={cx(
                            "variant-picker__option",
                            selected && "variant-picker__option--selected",
                        )}
                        role="radio"
                        aria-checked={selected}
                        disabled={optionDisabled}
                        onClick={(): void => onChange(variant.value)}
                    >
                        {variant.swatch === (void 0) ? null : (
                            <span
                                className="variant-picker__swatch"
                                style={{ background: variant.swatch }}
                                aria-hidden="true"
                            />
                        )}
                        {variant.label}
                    </button>
                );
            })}
        </div>
    </PickerField>
);

export default VariantPicker;
