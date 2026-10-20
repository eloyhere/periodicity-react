import {
    useId,
    type FC,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    type Ref,
} from "react";
import cx from "../../foundation/cx";
import useControllableState from "../../foundation/useControllableState";
import { composeEventHandlers } from "../shared/composeEventHandlers";
import type { PickerDataAttributes } from "../shared/native";
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
 * Fields: label, value, defaultValue, onChange, variants, hint, error, disabled, readOnly,
 * required, orientation, className, ref, and the native radio-group attributes.
 * The group receives `id`, `style`, `aria-*`, data attributes, and focus, blur, click, and
 * key handlers; arrow keys move focus between enabled options.
 * @example
 * <VariantPicker label="Colour" variants={variants} value={value} onChange={setValue} />
 */
export interface VariantPickerProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "defaultValue" | "onChange">,
        PickerDataAttributes {
    label: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    variants: readonly VariantOption[];
    hint?: string;
    error?: string;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    orientation?: "horizontal" | "vertical";
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a radio-style variant selector with optional colour swatches.
 * The value is controlled when `value` is supplied and uncontrolled otherwise.
 * @param props - Variants, selected value, label, and native group attributes.
 * @example
 * <VariantPicker label="Size" variants={sizes} value={size} onChange={setSize} />
 * @returns A variant picker.
 */
const VariantPicker: FC<VariantPickerProps> = ({
    label,
    value,
    defaultValue,
    onChange,
    variants,
    hint,
    error,
    disabled = false,
    readOnly = false,
    required = false,
    orientation = "horizontal",
    className = "",
    id,
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    onKeyDown,
    ref,
    ...rest
}: VariantPickerProps) => {
    const generatedId: string = useId();
    const groupId: string = id ?? generatedId;
    const hintId: string = `${groupId}-hint`;
    const errorId: string = `${groupId}-error`;
    const invalid: boolean = error !== (void 0) && error.length > 0;
    const [selectedValue, setSelectedValue]: readonly [string, (next: string) => void] =
        useControllableState<string>({
            value,
            defaultValue: defaultValue ?? "",
            onChange,
        });
    const describedBy: string = [
        invalid ? errorId : hint !== (void 0) && hint.length > 0 ? hintId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((entry: string): boolean => entry.length > 0)
        .join(" ");

    /**
     * Reports a new variant unless the picker is disabled or read-only.
     * @param next - Selected variant value.
     * @example
     * selectVariant("blue");
     * @returns Nothing.
     */
    const selectVariant: (next: string) => void = (next: string): void => {
        if (disabled || readOnly) {
            return;
        }

        setSelectedValue(next);
    };

    /**
     * Moves focus between enabled options and follows the native radio-group pattern.
     * @param event - Keyboard event from the radio group.
     * @example
     * <div role="radiogroup" onKeyDown={handleKeyDown} />
     * @returns Nothing.
     */
    const handleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        if (disabled) {
            return;
        }

        const forward: boolean =
            event.key === "ArrowRight" || event.key === "ArrowDown";
        const backward: boolean =
            event.key === "ArrowLeft" || event.key === "ArrowUp";
        const first: boolean = event.key === "Home";
        const last: boolean = event.key === "End";

        if (!forward && !backward && !first && !last) {
            return;
        }

        const buttons: HTMLButtonElement[] = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>(
                "[data-variant-index]:not(:disabled)",
            ),
        );

        if (buttons.length === 0) {
            return;
        }

        event.preventDefault();

        const current: number = buttons.findIndex(
            (button: HTMLButtonElement): boolean => button === document.activeElement,
        );
        const nextIndex: number = first
            ? 0
            : last
              ? buttons.length - 1
              : forward
                ? current < 0 || current === buttons.length - 1
                    ? 0
                    : current + 1
                : current <= 0
                  ? buttons.length - 1
                  : current - 1;
        const nextButton: HTMLButtonElement = buttons[nextIndex];
        const variantIndex: number = Number(nextButton.dataset.variantIndex ?? "");
        const option: VariantOption | undefined = variants[variantIndex];

        nextButton.focus({ preventScroll: true });

        if (option !== (void 0)) {
            selectVariant(option.value);
        }
    };

    return (
        <PickerField
            label={label}
            hint={hint}
            error={error}
            hintId={hintId}
            errorId={errorId}
            required={required}
            disabled={disabled}
            className={cx("variant-picker", className)}
        >
            <div
                {...rest}
                ref={ref}
                id={groupId}
                className={cx(
                    "variant-picker__options",
                    `variant-picker__options--${orientation}`,
                )}
                role="radiogroup"
                aria-label={ariaLabel ?? label}
                aria-disabled={disabled ? "true" : (void 0)}
                aria-readonly={readOnly ? "true" : (void 0)}
                aria-required={required ? "true" : (void 0)}
                aria-invalid={invalid ? "true" : (void 0)}
                aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
            >
                {variants.map((variant: VariantOption, index: number): ReactNode => {
                    const selected: boolean = variant.value === selectedValue;
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
                            aria-disabled={readOnly ? "true" : (void 0)}
                            data-variant-index={index}
                            disabled={optionDisabled}
                            onClick={(): void => selectVariant(variant.value)}
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
};

export default VariantPicker;
