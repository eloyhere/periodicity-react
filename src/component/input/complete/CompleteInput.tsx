import {
    useRef,
    useState,
    type ChangeEvent,
    type FocusEvent,
    type FocusEventHandler,
    type FC,
    type ReactNode,
    type Ref,
    type RefObject,
} from "react";
import Dropdown, { DropdownItem } from "../../dropdown/Dropdown";
import useControllableState from "../../foundation/useControllableState";
import TextInput, { type TextInputProps } from "../text/TextInput";
import "./CompleteInput.css";

/**
 * One autocomplete suggestion.
 * Type: interface.
 * Fields: value, label.
 * @example
 * const option: CompleteOption = { value: "design", label: "Design review" };
 */
export interface CompleteOption {
    value: string;
    label: string;
}

/**
 * Props for the free-text autocomplete input.
 * Type: interface.
 * Native input attributes are forwarded to the underlying text field; `className` and `style` apply to the field root.
 * Fields: label, value, defaultValue, options, onChange, onSelect, open, defaultOpen, onOpenChange,
 * hint, error, disabled, readOnly, placeholder, minChars, className, id, ref, and native input attributes.
 * @param label - Floating label.
 * @param value - Controlled text value.
 * @param defaultValue - Initial text value when uncontrolled.
 * @param options - Strings or options filtered by the typed text.
 * @param onChange - Called with every edited text value.
 * @param onSelect - Called with the committed suggestion.
 * @param open - Controlled suggestion panel visibility.
 * @param defaultOpen - Initial panel visibility when uncontrolled.
 * @param onOpenChange - Called when the suggestion panel visibility changes.
 * @param hint - Supporting text shown below the field.
 * @param error - Validation message; replaces the hint and marks the field invalid.
 * @param disabled - Disables the field and suggestion panel.
 * @param readOnly - Keeps the value focusable but suppresses edits and selection.
 * @param placeholder - Placeholder text.
 * @param minChars - Query length required before suggestions are shown.
 * @param className - Extra classes for the field root.
 * @param ref - Ref to the underlying input element.
 * @example
 * <CompleteInput label="Ritual" value={value} options={options} onChange={setValue} />
 */
export interface CompleteInputProps
    extends Omit<TextInputProps, "type" | "value" | "defaultValue" | "onChange" | "onSelect" | "className"> {
    label: string;
    value?: string;
    defaultValue?: string;
    options: ReadonlyArray<string | CompleteOption>;
    onChange: (value: string) => void;
    onSelect?: (option: CompleteOption) => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    minChars?: number;
    className?: string;
    ref?: Ref<HTMLInputElement>;
}

/**
 * Normalises a string or option into an autocomplete option.
 * @param value - String or option.
 * @example
 * const option = toOption("Design");
 * @returns An autocomplete option.
 */
const toOption: (value: string | CompleteOption) => CompleteOption = (
    value: string | CompleteOption,
): CompleteOption =>
    typeof value === "string" ? { value, label: value } : { value: value.value, label: value.label };

/**
 * Renders a Material text field with a filtered suggestion panel.
 * @param props - Value, suggestions, and selection callback.
 * @example
 * <CompleteInput label="Project" options={["Design", "Research"]} value={value} onChange={setValue} />
 * @returns A free-text autocomplete field.
 */
const CompleteInput: FC<CompleteInputProps> = ({
    label,
    value,
    defaultValue,
    options,
    onChange,
    onSelect,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    hint,
    error,
    disabled = false,
    readOnly = false,
    placeholder,
    minChars = 0,
    className = "",
    style,
    autoComplete = "off",
    onFocus,
    ref,
    ...rest
}: CompleteInputProps) => {
    const anchorRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
    const controlled: boolean = value !== (void 0);
    const [uncontrolledValue, setUncontrolledValue]: [string, (next: string) => void] = useState<string>(
        defaultValue ?? "",
    );
    const currentValue: string = controlled ? (value as string) : uncontrolledValue;
    const [isOpen, setOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: openProp,
        defaultValue: defaultOpen,
        onChange: onOpenChange,
    });
    const normalized: CompleteOption[] = options.map(toOption);
    const query: string = currentValue.trim().toLowerCase();
    const visible: CompleteOption[] = normalized.filter(
        (option: CompleteOption): boolean =>
            query.length >= minChars && option.label.toLowerCase().includes(query),
    );
    const shouldOpen: boolean = isOpen && !disabled && !readOnly && query.length >= minChars;

    const commit: (option: CompleteOption) => void = (option: CompleteOption): void => {
        if (readOnly) {
            return;
        }

        if (!controlled) {
            setUncontrolledValue(option.value);
        }

        onChange(option.value);
        onSelect?.(option);
        setOpen(false);
    };

    const handleFocus: FocusEventHandler<HTMLInputElement> = (event: FocusEvent<HTMLInputElement>): void => {
        onFocus?.(event);

        if (!disabled && !readOnly) {
            setOpen(true);
        }
    };

    const handleChange: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const next: string = event.target.value;

        if (readOnly) {
            return;
        }

        if (!controlled) {
            setUncontrolledValue(next);
        }

        onChange(next);
        setOpen(true);
    };

    return (
        <span ref={anchorRef} className={`complete-input ${className}`.trim()} style={style}>
            <TextInput
                {...rest}
                ref={ref}
                label={label}
                value={currentValue}
                hint={hint}
                error={error}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={placeholder}
                autoComplete={autoComplete}
                onFocus={handleFocus}
                onChange={handleChange}
            />
            <Dropdown
                open={shouldOpen}
                onOpenChange={setOpen}
                anchorRef={anchorRef}
                matchWidth
                role="listbox"
                ariaLabel={`${label} suggestions`}
                isEmpty={visible.length === 0}
                empty="No suggestions"
            >
                {visible.map((option: CompleteOption): ReactNode => (
                    <DropdownItem
                        key={option.value}
                        role="option"
                        selected={option.value === currentValue}
                        onSelect={(): void => commit(option)}
                    >
                        {option.label}
                    </DropdownItem>
                ))}
            </Dropdown>
        </span>
    );
};

export default CompleteInput;
