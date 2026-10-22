import {
    useRef,
    useState,
    type ChangeEvent,
    type FocusEvent,
    type FocusEventHandler,
    type FC,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import Dropdown, { DropdownItem } from "../../dropdown/Dropdown";
import useControllableState from "../../foundation/useControllableState";
import useMergedRef from "../../foundation/useMergedRef";
import TextInput, { type TextInputProps } from "../text/TextInput";
import { useInternational, type InternationalContextValue } from "../../../international";
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
 * prefix, hint, message, limitation, error, suffix, disabled, readOnly, placeholder, minChars,
 * className, id, ref, and native input attributes.
 * @param label - Accessible label; also the default floating hint.
 * @param value - Controlled text value.
 * @param defaultValue - Initial text value when uncontrolled.
 * @param options - Strings or options filtered by the typed text.
 * @param onChange - Called with every edited text value.
 * @param onSelect - Called with the committed suggestion; the panel then closes and the field blurs.
 * @param open - Controlled suggestion panel visibility.
 * @param defaultOpen - Initial panel visibility when uncontrolled.
 * @param onOpenChange - Called when the suggestion panel visibility changes.
 * @param prefix - Leading icon slot; a string is treated as an icon name.
 * @param hint - Floating placeholder shown inside the field until focus or content.
 * @param message - Supporting message shown below the field.
 * @param limitation - Character counter shown under the suffix.
 * @param error - Validation message; replaces the message and marks the field invalid.
 * @param suffix - Trailing icon slot; a string is treated as an icon name.
 * @param disabled - Disables the field and suggestion panel.
 * @param readOnly - Keeps the value focusable but suppresses edits and selection.
 * @param placeholder - Native placeholder fallback for the floating hint.
 * @param minChars - Query length required before suggestions are shown.
 * @param className - Extra classes for the field root.
 * @param ref - Ref to the underlying input element.
 * @example
 * <CompleteInput label="Ritual" value={value} options={options} onChange={setValue} />
 */
export interface CompleteInputProps
    extends Omit<
        TextInputProps,
        "type" | "value" | "defaultValue" | "onChange" | "onSelect" | "className" | "rootRef"
    > {
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
 * Focus stays in the field while the panel is open, so the focused border and
 * typing remain active; selecting a suggestion closes the panel and blurs the field.
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
    const { t }: InternationalContextValue = useInternational();
    const fieldRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
    const mergedInputRef: RefCallback<HTMLInputElement> = useMergedRef(ref, inputRef);
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
        inputRef.current?.blur();
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
        <>
            <TextInput
                {...rest}
                ref={mergedInputRef}
                rootRef={fieldRef}
                className={`complete-input ${className}`.trim()}
                style={style}
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
                anchorRef={fieldRef}
                matchWidth
                role="listbox"
                ariaLabel={`${label} suggestions`}
                isEmpty={visible.length === 0}
                empty={t("noResults")}
                autoFocus={false}
                restoreFocus={false}
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
        </>
    );
};

export default CompleteInput;
