import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
    ChangeEvent,
    ChangeEventHandler,
    CSSProperties,
    Dispatch,
    FC,
    FocusEvent,
    FocusEventHandler,
    KeyboardEvent,
    KeyboardEventHandler,
    MouseEventHandler,
    PointerEvent,
    ReactNode,
    RefObject,
    SetStateAction,
} from "react";
import { createListAdapter } from "../../layout/list/adapter";
import type { ListAdapter, ListEntry } from "../../layout/list/adapter";
import Dropdown, { DropdownItem } from "../dropdown/Dropdown";
import cx from "../foundation/cx";
import useField, { type FieldState } from "../foundation/useField";
import useVirtualWindow, { type VirtualWindow } from "../foundation/useVirtualWindow";
import Icon from "../icon/Icon";
import Surface from "../surface/Surface";
import "./Combobox.css";

/**
 * One choice offered by Combobox.
 * Type: interface.
 * Fields:
 * - `value`: Stable value passed to `onChange`.
 * - `label`: Visible option text and filter target.
 * - `disabled`: Whether the option is skipped by pointer and keyboard input.
 * @example
 * const option: ComboboxOption = { value: "daily", label: "Daily" };
 */
export interface ComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
}

/**
 * Props for the Combobox filterable input.
 * Type: interface.
 * Fields:
 * - `label`: Visible field label and accessible name.
 * - `value`: Controlled selected value.
 * - `options`: Choices filtered by the typed text.
 * - `onChange`: Called with the selected option value.
 * - `onInputChange`: Called with every typed filter text.
 * - `placeholder`: Input placeholder.
 * - `hint`: Supporting text shown below the field.
 * - `error`: Validation message; replaces the hint and marks the field invalid.
 * - `disabled`: Disables the input and listbox.
 * - `loading`: Shows a loading message in the listbox and marks the field busy.
 * - `virtual`: Enables a fixed-row window over very long option lists.
 * - `listHeight`: Maximum height of the virtual listbox.
 * - `itemHeight`: Fixed row height used by the virtual listbox.
 * - `className`: Extra class names for the field root.
 * @example
 * <Combobox label="Ritual" value={ritual} options={options} onChange={setRitual} />
 */
export interface ComboboxProps {
    label: string;
    value: string;
    options: ComboboxOption[];
    onChange: (value: string) => void;
    onInputChange?: (text: string) => void;
    placeholder?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    loading?: boolean;
    virtual?: boolean;
    listHeight?: number;
    itemHeight?: number;
    className?: string;
}

/**
 * Finds the next enabled index by walking `step` from `from` and wrapping once.
 * @param adapter - Adapter over the filtered options.
 * @param from - Index to walk from.
 * @param step - Direction: `1` forwards, `-1` backwards.
 * @example
 * const next: number = findEnabledFrom(adapter, 0, 1);
 * @returns The enabled index, or `-1` when every option is disabled.
 */
const findEnabledFrom: (
    adapter: ListAdapter<ComboboxOption>,
    from: number,
    step: number,
) => number = (adapter: ListAdapter<ComboboxOption>, from: number, step: number): number => {
    if (adapter.size === 0) {
        return -1;
    }

    for (let offset: number = 1; offset <= adapter.size; offset += 1) {
        const index: number = (from + step * offset + adapter.size * 2) % adapter.size;

        if (adapter.getItem(index).disabled !== true) {
            return index;
        }
    }

    return -1;
};

/**
 * Finds the first enabled filtered option.
 * @param adapter - Adapter over the filtered options.
 * @example
 * const first: number = findFirstEnabled(adapter);
 * @returns The first enabled index, or `-1` when every option is disabled.
 */
const findFirstEnabled: (adapter: ListAdapter<ComboboxOption>) => number = (
    adapter: ListAdapter<ComboboxOption>,
): number => findEnabledFrom(adapter, adapter.size - 1, 1);

/**
 * Finds the last enabled filtered option.
 * @param adapter - Adapter over the filtered options.
 * @example
 * const last: number = findLastEnabled(adapter);
 * @returns The last enabled index, or `-1` when every option is disabled.
 */
const findLastEnabled: (adapter: ListAdapter<ComboboxOption>) => number = (
    adapter: ListAdapter<ComboboxOption>,
): number => findEnabledFrom(adapter, 0, -1);

/**
 * Renders a Material-style input that filters options and commits one on selection.
 * @param props - Label, value, options, change handlers, and field state.
 * @example
 * <Combobox
 *     label="Ritual"
 *     value={ritual}
 *     options={rituals}
 *     onChange={setRitual}
 *     onInputChange={setFilter}
 *     hint="Start typing to narrow the list."
 * />
 * @returns A combobox input element.
 */
const Combobox: FC<ComboboxProps> = ({
    label,
    value,
    options,
    onChange,
    onInputChange,
    placeholder,
    hint,
    error,
    disabled = false,
    loading = false,
    virtual = false,
    listHeight = 280,
    itemHeight = 40,
    className = "",
}: ComboboxProps) => {
    const fieldState: FieldState = useField({ label, hint, error });
    const controlId: string = fieldState.controlId;
    const labelId: string = `${controlId}-label`;
    const listboxId: string = `${controlId}-listbox`;
    const hasError: boolean = fieldState.invalid;
    const describedBy: string = hasError
        ? fieldState.errorId
        : hint !== (void 0) && hint.length > 0
          ? fieldState.hintId
          : "";

    const allAdapter: ListAdapter<ComboboxOption> = useMemo(
        (): ListAdapter<ComboboxOption> =>
            createListAdapter<ComboboxOption>(options, {
                getKey: (option: ComboboxOption): string => option.value,
            }),
        [options],
    );
    const selectedIndex: number = allAdapter.indexOf(value);
    const selectedOption: ComboboxOption | void =
        selectedIndex >= 0 ? allAdapter.getItem(selectedIndex) : (void 0);
    const selectedLabel: string = selectedOption === (void 0) ? value : selectedOption.label;

    const [inputText, setInputText]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(selectedLabel);
    const [editing, setEditing]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [query, setQuery]: [string, Dispatch<SetStateAction<string>>] = useState<string>("");
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [activeIndex, setActiveIndex]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(-1);
    const fieldRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);

    const filteredOptions: readonly ComboboxOption[] = useMemo((): readonly ComboboxOption[] => {
        const normalizedQuery: string = query.trim().toLowerCase();

        if (normalizedQuery.length === 0) {
            return options;
        }

        return options.filter((option: ComboboxOption): boolean =>
            option.label.toLowerCase().includes(normalizedQuery),
        );
    }, [options, query]);
    const filteredAdapter: ListAdapter<ComboboxOption> = useMemo(
        (): ListAdapter<ComboboxOption> =>
            createListAdapter<ComboboxOption>(filteredOptions, {
                getKey: (option: ComboboxOption): string => option.value,
            }),
        [filteredOptions],
    );
    const visibleOptions: readonly ComboboxOption[] = useMemo(
        (): readonly ComboboxOption[] =>
            filteredAdapter
                .getRange(0, filteredAdapter.size)
                .map((entry: ListEntry<ComboboxOption>): ComboboxOption => entry.item),
        [filteredAdapter],
    );
    const {
        attachViewport,
        attached,
        start,
        end,
        onScroll,
        scrollToIndex,
    }: VirtualWindow = useVirtualWindow({
        count: visibleOptions.length,
        itemHeight,
        fallbackHeight: listHeight,
        overscan: 2,
    });
    const windowStart: number = virtual ? start : 0;
    const windowEnd: number = virtual ? end : visibleOptions.length;
    const windowOptions: readonly ComboboxOption[] = visibleOptions.slice(
        windowStart,
        windowEnd,
    );

    const isOpen: boolean = open && !disabled;
    const effectiveActiveIndex: number =
        activeIndex >= 0 && activeIndex < filteredAdapter.size
            ? activeIndex
            : isOpen
              ? filteredAdapter.indexOf(value) >= 0
                  ? filteredAdapter.indexOf(value)
                  : findFirstEnabled(filteredAdapter)
              : -1;
    const activeOption: ComboboxOption | void =
        effectiveActiveIndex >= 0 && effectiveActiveIndex < filteredAdapter.size
            ? filteredAdapter.getItem(effectiveActiveIndex)
            : (void 0);
    const displayText: string = editing ? inputText : selectedLabel;
    const emptyMessage: string = query.trim().length > 0 ? "No matching options" : "No options";
    const emptyState: string = loading ? "Loading…" : emptyMessage;

    useLayoutEffect((): void => {
        if (!virtual || !isOpen || !attached) {
            return;
        }

        const filtering: boolean = query.trim().length > 0;

        scrollToIndex(
            filtering || effectiveActiveIndex < 0 ? 0 : effectiveActiveIndex,
            filtering ? "start" : "nearest",
        );
    }, [attached, effectiveActiveIndex, isOpen, query, scrollToIndex, virtual]);

    useEffect((): (() => void) | void => {
        if (!isOpen) {
            return;
        }

        const frame: number = window.requestAnimationFrame((): void => {
            inputRef.current?.focus({ preventScroll: true });
        });

        return (): void => {
            window.cancelAnimationFrame(frame);
        };
    }, [isOpen]);

    /**
     * Opens the controlled dropdown while keeping focus in the input.
     * @example
     * openListbox();
     * @returns Nothing.
     */
    const openListbox: () => void = (): void => {
        if (disabled) {
            return;
        }

        if (!open) {
            setActiveIndex(-1);
        }

        setOpen(true);
    };

    /**
     * Closes the dropdown and clears the filter state.
     * @example
     * closeListbox();
     * @returns Nothing.
     */
    const closeListbox: () => void = (): void => {
        setOpen(false);
        setQuery("");
        setEditing(false);
        setActiveIndex(-1);
    };

    /**
     * Applies an open-state change requested by the dropdown.
     * @param next - Whether the dropdown should be open.
     * @example
     * handleOpenChange(false);
     * @returns Nothing.
     */
    const handleOpenChange: (next: boolean) => void = (next: boolean): void => {
        setOpen(next);

        if (!next) {
            setQuery("");
            setEditing(false);
            setActiveIndex(-1);
        }
    };

    /**
     * Commits an option, restores the selected label, and closes the dropdown.
     * @param option - Option to commit.
     * @param index - Index of the option in the filtered adapter.
     * @example
     * commitOption({ value: "daily", label: "Daily" }, 0);
     * @returns Nothing.
     */
    const commitOption: (option: ComboboxOption, index: number) => void = (
        option: ComboboxOption,
        index: number,
    ): void => {
        if (option.disabled === true) {
            return;
        }

        onChange(option.value);
        setInputText(option.label);
        setQuery("");
        setEditing(false);
        setActiveIndex(index);
        setOpen(false);
        inputRef.current?.focus({ preventScroll: true });
    };

    /**
     * Selects the input text so typing replaces the current label.
     * @example
     * selectInputText();
     * @returns Nothing.
     */
    const selectInputText: () => void = (): void => {
        const input: HTMLInputElement | null = inputRef.current;

        if (input !== null) {
            input.select();
        }
    };

    /**
     * Opens the dropdown and selects the current text on first focus.
     * @example
     * <input onFocus={handleFocus} />
     * @returns Nothing.
     */
    const handleFocus: FocusEventHandler<HTMLInputElement> = (): void => {
        if (disabled || open) {
            return;
        }

        setOpen(true);
        setActiveIndex(-1);
        window.requestAnimationFrame(selectInputText);
    };

    /**
     * Reopens the dropdown when the input is clicked.
     * @example
     * <input onClick={handleClick} />
     * @returns Nothing.
     */
    const handleClick: MouseEventHandler<HTMLInputElement> = (): void => {
        openListbox();
    };

    /**
     * Filters the options with the typed text and reports it to the caller.
     * @param event - Input change event.
     * @example
     * <input onChange={handleInputChange} />
     * @returns Nothing.
     */
    const handleInputChange: ChangeEventHandler<HTMLInputElement> = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const text: string = event.target.value;

        setInputText(text);
        setQuery(text);
        setEditing(true);
        setActiveIndex(-1);
        setOpen(true);
        onInputChange?.(text);
    };

    /**
     * Moves the active row by one enabled step inside the filtered options.
     * @param step - Direction: `1` forwards, `-1` backwards.
     * @example
     * moveActive(1);
     * @returns Nothing.
     */
    const moveActive: (step: number) => void = (step: number): void => {
        const from: number = effectiveActiveIndex >= 0 ? effectiveActiveIndex : step > 0 ? -1 : 0;
        const nextIndex: number = findEnabledFrom(filteredAdapter, from, step);

        if (nextIndex >= 0) {
            setActiveIndex(nextIndex);
        }
    };

    /**
     * Closes the dropdown when focus leaves the field, ignoring focus moved into the panel.
     * @param event - Input focus event.
     * @example
     * <input onBlur={handleBlur} />
     * @returns Nothing.
     */
    const handleBlur: FocusEventHandler<HTMLInputElement> = (
        event: FocusEvent<HTMLInputElement>,
    ): void => {
        const nextTarget: EventTarget | null = event.relatedTarget;

        if (!(nextTarget instanceof Node)) {
            return;
        }

        if (
            fieldRef.current?.contains(nextTarget) === true ||
            (nextTarget instanceof Element && nextTarget.closest(".dropdown__panel") !== null)
        ) {
            return;
        }

        closeListbox();
    };

    /**
     * Handles the APG combobox keyboard model while focus stays in the input.
     * @param event - Input key event.
     * @example
     * <input onKeyDown={handleInputKeyDown} />
     * @returns Nothing.
     */
    const handleInputKeyDown: KeyboardEventHandler<HTMLInputElement> = (
        event: KeyboardEvent<HTMLInputElement>,
    ): void => {
        if (disabled) {
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();

            if (!isOpen) {
                openListbox();
                return;
            }

            moveActive(event.key === "ArrowDown" ? 1 : -1);
            return;
        }

        if (event.key === "Enter") {
            if (!isOpen) {
                return;
            }

            event.preventDefault();

            if (activeOption !== (void 0)) {
                commitOption(activeOption, effectiveActiveIndex);
            }

            return;
        }

        if (event.key === "Escape") {
            if (!isOpen) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            closeListbox();
            return;
        }

        if ((event.key === "Home" || event.key === "End") && isOpen) {
            event.preventDefault();
            setActiveIndex(
                event.key === "Home"
                    ? findFirstEnabled(filteredAdapter)
                    : findLastEnabled(filteredAdapter),
            );
            return;
        }

        if (event.key === "Tab" && isOpen) {
            closeListbox();
        }
    };

    return (
        <div
            ref={fieldRef}
            className={cx(
                "combobox",
                isOpen && "combobox--open",
                hasError && "combobox--invalid",
                disabled && "combobox--disabled",
                virtual && "combobox--virtual",
                className,
            )}
            data-open={isOpen ? "true" : "false"}
            data-invalid={hasError ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
        >
            <Surface
                className="combobox__surface"
                background={<span className="combobox__background" />}
                foreground={<span className="combobox__edge" />}
                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
            >
                <div
                    className="combobox__row"
                    onClick={(): void => {
                        inputRef.current?.focus();
                    }}
                >
                    <input
                        ref={inputRef}
                        id={controlId}
                        type="text"
                        role="combobox"
                        className="combobox__input"
                        value={displayText}
                        placeholder={placeholder === (void 0) || placeholder.length === 0 ? " " : placeholder}
                        autoComplete="off"
                        spellCheck={false}
                        aria-autocomplete="list"
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                        aria-controls={listboxId}
                        aria-invalid={hasError}
                        aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                        aria-busy={loading ? true : (void 0)}
                        disabled={disabled}
                        onFocus={handleFocus}
                        onClick={handleClick}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        onBlur={handleBlur}
                    />
                    <span className="combobox__indicator" aria-hidden="true">
                        {loading ? (
                            <Icon className="combobox__spinner" name="Loading" size={18} />
                        ) : (
                            <Icon name="ChevronDown" size={18} />
                        )}
                    </span>
                </div>
            </Surface>

            <label className="combobox__label" id={labelId} htmlFor={controlId}>
                {label}
            </label>

            <span className="visually-hidden" role="status" aria-live="polite">
                {isOpen && activeOption !== (void 0) ? activeOption.label : ""}
            </span>

            {hasError ? (
                <p className="combobox__error" id={fieldState.errorId} aria-live="polite">
                    {error}
                </p>
            ) : hint !== (void 0) && hint.length > 0 ? (
                <p className="combobox__hint" id={fieldState.hintId}>
                    {hint}
                </p>
            ) : null}

            <Dropdown
                open={isOpen}
                onOpenChange={handleOpenChange}
                anchorRef={fieldRef}
                placement="bottom-start"
                matchWidth
                role="listbox"
                ariaLabel={label}
                isEmpty={loading || visibleOptions.length === 0}
                empty={<span id={listboxId}>{emptyState}</span>}
            >
                <div
                    ref={virtual ? attachViewport : (void 0)}
                    id={listboxId}
                    className={cx(
                        "combobox__listbox",
                        virtual && "combobox__listbox--virtual",
                    )}
                    style={
                        virtual
                            ? ({
                                  maxHeight: listHeight,
                                  overflowY: "auto",
                                  "--combobox-item-height": `${itemHeight}px`,
                              } as CSSProperties)
                            : (void 0)
                    }
                    onScroll={virtual ? onScroll : (void 0)}
                    onPointerDown={(event: PointerEvent<HTMLDivElement>): void => {
                        event.preventDefault();
                    }}
                >
                    {virtual && windowStart > 0 ? (
                        <div
                            aria-hidden="true"
                            style={{ height: windowStart * itemHeight, flex: "none" }}
                        />
                    ) : null}
                    {windowOptions.map((option: ComboboxOption, index: number): ReactNode => {
                        const optionIndex: number = windowStart + index;

                        return (
                            <DropdownItem
                                key={option.value}
                                selected={option.value === value}
                                disabled={option.disabled === true}
                                role="option"
                                className={cx(
                                    virtual && "combobox__option--virtual",
                                    optionIndex === effectiveActiveIndex &&
                                        "combobox__option--active",
                                )}
                                onSelect={(): void => commitOption(option, optionIndex)}
                            >
                                {option.label}
                            </DropdownItem>
                        );
                    })}
                    {virtual && windowEnd < visibleOptions.length ? (
                        <div
                            aria-hidden="true"
                            style={{
                                height:
                                    (visibleOptions.length - windowEnd) * itemHeight,
                                flex: "none",
                            }}
                        />
                    ) : null}
                </div>
            </Dropdown>
        </div>
    );
};

export default Combobox;
