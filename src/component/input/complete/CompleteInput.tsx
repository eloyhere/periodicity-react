import {
    useRef,
    useState,
    type ChangeEvent,
    type Dispatch,
    type FC,
    type ReactNode,
    type RefObject,
    type SetStateAction,
} from "react";
import Dropdown, { DropdownItem } from "../../dropdown/Dropdown";
import TextInput from "../text/TextInput";
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
 * Fields: label, value, options, onChange, onSelect, hint, error, disabled, placeholder, minChars, className.
 * @example
 * <CompleteInput label="Ritual" value={value} options={options} onChange={setValue} />
 */
export interface CompleteInputProps {
    label: string;
    value: string;
    options: ReadonlyArray<string | CompleteOption>;
    onChange: (value: string) => void;
    onSelect?: (option: CompleteOption) => void;
    hint?: string;
    error?: string;
    disabled?: boolean;
    placeholder?: string;
    minChars?: number;
    className?: string;
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
    options,
    onChange,
    onSelect,
    hint,
    error,
    disabled = false,
    placeholder,
    minChars = 0,
    className = "",
}: CompleteInputProps) => {
    const anchorRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const normalized: CompleteOption[] = options.map(toOption);
    const query: string = value.trim().toLowerCase();
    const visible: CompleteOption[] = normalized.filter(
        (option: CompleteOption): boolean =>
            query.length >= minChars && option.label.toLowerCase().includes(query),
    );
    const shouldOpen: boolean = open && !disabled && query.length >= minChars;

    return (
        <span ref={anchorRef} className={`complete-input ${className}`}>
            <TextInput
                label={label}
                value={value}
                hint={hint}
                error={error}
                disabled={disabled}
                placeholder={placeholder}
                autoComplete="off"
                onFocus={(): void => setOpen(true)}
                onChange={(event: ChangeEvent<HTMLInputElement>): void => {
                    onChange(event.target.value);
                    setOpen(true);
                }}
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
                        selected={option.value === value}
                        onSelect={(): void => {
                            onChange(option.value);
                            onSelect?.(option);
                            setOpen(false);
                        }}
                    >
                        {option.label}
                    </DropdownItem>
                ))}
            </Dropdown>
        </span>
    );
};

export default CompleteInput;
