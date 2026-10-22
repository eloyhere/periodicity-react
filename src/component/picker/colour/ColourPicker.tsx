import {
    useId,
    useRef,
    type ChangeEvent,
    type FC,
    type InputHTMLAttributes,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import cx from "../../foundation/cx";
import useControllableState from "../../foundation/useControllableState";
import useMergedRef from "../../foundation/useMergedRef";
import { composeEventHandlers } from "../shared/composeEventHandlers";
import type { PickerDataAttributes } from "../shared/native";
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
 * Fields: value, defaultValue, onChange, label, hint, error, disabled, readOnly,
 * showValue, className, ref, and the native colour input attributes.
 * The native input receives `id`, `name`, `required`, `style`, `aria-*`, data attributes,
 * and focus, blur, click, and key handlers.
 * @example
 * <ColourPicker label="Accent" value="#1976d2" onChange={setColour} />
 */
export interface ColourPickerProps
    extends Omit<
            InputHTMLAttributes<HTMLInputElement>,
            "children" | "className" | "defaultValue" | "onChange" | "size" | "type" | "value"
        >,
        PickerDataAttributes {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    label: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    readOnly?: boolean;
    showValue?: boolean;
    className?: string;
    ref?: Ref<HTMLInputElement>;
}

/**
 * Renders a native colour input, hex value, and a row of presets.
 * The value is controlled when `value` is supplied and uncontrolled otherwise.
 * @param props - Colour value, label, presets, and native input attributes.
 * @example
 * <ColourPicker label="Brand" value="#1976d2" onChange={setColour} />
 * @returns A colour picker.
 */
const ColourPicker: FC<ColourPickerProps> = ({
    value,
    defaultValue,
    onChange,
    label,
    hint,
    error,
    disabled = false,
    readOnly = false,
    showValue = true,
    className = "",
    id,
    required = false,
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    onClick: onInputClick,
    ref,
    ...rest
}: ColourPickerProps) => {
    const generatedId: string = useId();
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
    const mergedRef: RefCallback<HTMLInputElement> = useMergedRef<HTMLInputElement>(inputRef, ref);
    const inputId: string = id ?? `${generatedId}-colour`;
    const hintId: string = `${inputId}-hint`;
    const errorId: string = `${inputId}-error`;
    const invalid: boolean = error !== (void 0) && error.length > 0;
    const [selectedValue, setSelectedValue]: readonly [string, (next: string) => void] =
        useControllableState<string>({
            value,
            defaultValue: defaultValue ?? "#000000",
            onChange,
        });
    const describedBy: string = [
        invalid ? errorId : hint !== (void 0) && hint.length > 0 ? hintId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((entry: string): boolean => entry.length > 0)
        .join(" ");

    /**
     * Reports a new colour unless the picker is disabled or read-only.
     * @param next - Requested colour.
     * @example
     * commitColour("#1976d2");
     * @returns Nothing.
     */
    const commitColour: (next: string) => void = (next: string): void => {
        if (disabled || readOnly || (value !== (void 0) && onChange === (void 0))) {
            return;
        }

        setSelectedValue(next);
    };

    /**
     * Forwards the native colour input change to the controlled value.
     * @param event - Change event from the native colour input.
     * @example
     * <input onChange={handleInputChange} />
     * @returns Nothing.
     */
    const handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        commitColour(event.target.value);
    };

    /**
     * Keeps a read-only picker from opening the native colour dialog.
     * @param event - Click event from the native colour input.
     * @example
     * <input onClick={handleInputClick} />
     * @returns Nothing.
     */
    const handleInputClick: (event: ReactMouseEvent<HTMLInputElement>) => void = (
        event: ReactMouseEvent<HTMLInputElement>,
    ): void => {
        if (readOnly) {
            event.preventDefault();
        }
    };

    const currentColour: string = normalizeColour(selectedValue);

    const handleFieldClick: (event: ReactMouseEvent<HTMLDivElement>) => void = (
        event: ReactMouseEvent<HTMLDivElement>,
    ): void => {
        if (disabled || readOnly) {
            return;
        }

        const target: HTMLElement = event.target as HTMLElement;

        if (target === inputRef.current || target.closest("button") !== null) {
            return;
        }

        event.preventDefault();
        inputRef.current?.click();
    };

    return (
        <PickerField
            label={label}
            hint={hint}
            error={error}
            htmlFor={inputId}
            hintId={hintId}
            errorId={errorId}
            required={required}
            disabled={disabled}
            className={cx("colour-picker", className)}
            onClick={handleFieldClick}
        >
            <input
                {...rest}
                ref={mergedRef}
                id={inputId}
                className="colour-picker__input"
                type="color"
                value={currentColour}
                disabled={disabled}
                readOnly={readOnly}
                aria-label={ariaLabel ?? `${label} colour`}
                aria-invalid={invalid ? "true" : (void 0)}
                aria-readonly={readOnly ? "true" : (void 0)}
                aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                onChange={handleInputChange}
                onClick={composeEventHandlers(onInputClick, handleInputClick)}
            />
            {showValue ? <span className="colour-picker__value">{selectedValue}</span> : null}
            <span className="colour-picker__presets">
                {presetColours.map((colour: string): ReactNode => (
                    <button
                        key={colour}
                        type="button"
                        className={cx(
                            "colour-picker__preset",
                            currentColour === colour && "colour-picker__preset--selected",
                        )}
                        style={{ background: colour }}
                        aria-label={colour}
                        aria-pressed={currentColour === colour}
                        disabled={disabled || readOnly}
                        onClick={(): void => commitColour(colour)}
                    />
                ))}
            </span>
        </PickerField>
    );
};

export default ColourPicker;
