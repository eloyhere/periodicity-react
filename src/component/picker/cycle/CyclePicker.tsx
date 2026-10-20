import {
    useEffect,
    useId,
    useRef,
    useState,
    type ChangeEvent as ReactChangeEvent,
    type Dispatch,
    type FocusEvent as ReactFocusEvent,
    type InputHTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type MutableRefObject,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
    type SetStateAction,
} from "react";
import Button from "../../button/Button";
import cx from "../../foundation/cx";
import useMergedRef from "../../foundation/useMergedRef";
import Icon from "../../icon/Icon";
import "../number/NumberPicker.css";
import type { PickerDataAttributes } from "../shared/native";
import "./CyclePicker.css";

/**
 * Row offsets of the five-row window, measured from the selected row.
 * Type: constant.
 * Fields: none.
 * @example
 * const offsets: readonly number[] = cycleOffsets;
 */
const cycleOffsets: readonly number[] = [-2, -1, 0, 1, 2];

/**
 * Accumulated wheel travel, in pixels, that advances one row.
 * Type: constant.
 * Fields: none.
 * @example
 * wheelAccumulator += wheelStep;
 */
const wheelStep: number = 20;

/**
 * Minimum time between wheel-driven row changes, in milliseconds.
 * Type: constant.
 * Fields: none.
 * @example
 * const ready: boolean = Date.now() - wheelLock > wheelInterval;
 */
const wheelInterval: number = 70;

/**
 * Pointer travel, in pixels, that advances one row while dragging.
 * Type: constant.
 * Fields: none.
 * @example
 * const rows: number = Math.floor(travel / dragStep);
 */
const dragStep: number = 28;

/**
 * Pointer travel, in pixels, that turns a press into a drag.
 * Type: constant.
 * Fields: none.
 * @example
 * const dragging: boolean = travel >= dragThreshold;
 */
const dragThreshold: number = 6;

/**
 * Converts a `WheelEvent.deltaMode` value into a pixel multiplier.
 * @param mode - `WheelEvent.deltaMode` value.
 * @example
 * const unit: number = wheelUnit(1);
 * @returns The multiplier for line, page, or pixel deltas.
 */
const wheelUnit: (mode: number) => number = (mode: number): number => {
    if (mode === 1) {
        return 16;
    }

    if (mode === 2) {
        return 160;
    }

    return 1;
};

/**
 * Wraps an index into the range `[0, size)`.
 * @param index - Index that may be negative or past the last item.
 * @param size - Number of items in the wheel.
 * @example
 * const index: number = wrapIndex(-1, 3);
 * @returns The wrapped index, or `0` when the wheel is empty.
 */
const wrapIndex: (index: number, size: number) => number = (index: number, size: number): number =>
    size <= 0 ? 0 : ((index % size) + size) % size;

/**
 * Checks whether an item can supply a key through its primitive value.
 * @param item - Item to inspect.
 * @example
 * const keyable: boolean = isKeyable("Mon");
 * @returns True for strings, numbers, booleans, and bigints.
 */
const isKeyable: (item: unknown) => boolean = (item: unknown): boolean =>
    typeof item === "string" ||
    typeof item === "number" ||
    typeof item === "boolean" ||
    typeof item === "bigint";

/**
 * Derives a fallback key for an item.
 * @param item - Item to key.
 * @param index - Position used for objects and symbols.
 * @example
 * const key: string = defaultKey("Mon", 0);
 * @returns A type-prefixed key, or a positional key for objects.
 */
const defaultKey: <T>(item: T, index: number) => string = <T,>(item: T, index: number): string => {
    if (typeof item === "string") {
        return `s:${item}`;
    }

    if (typeof item === "number") {
        return `n:${item}`;
    }

    if (typeof item === "boolean") {
        return `b:${item}`;
    }

    if (typeof item === "bigint") {
        return `g:${item}`;
    }

    return `i:${index}`;
};

/**
 * Pointer state captured while a press may become a wheel drag.
 * Type: interface.
 * Fields: pointerId, lastY, offset, travelled, captured, baseIndex, steps.
 * @example
 * const drag: DragState = {
 *     pointerId: 1,
 *     lastY: 40,
 *     offset: 0,
 *     travelled: 0,
 *     captured: false,
 *     baseIndex: 0,
 *     steps: 0,
 * };
 */
interface DragState {
    pointerId: number;
    lastY: number;
    offset: number;
    travelled: number;
    captured: boolean;
    baseIndex: number;
    steps: number;
}

/**
 * Latest wheel state seen by the native wheel listener.
 * Type: interface.
 * Fields: disabled, itemCount, move.
 * @example
 * const state: WheelState = { disabled: false, itemCount: 12, move: commitDelta };
 */
interface WheelState {
    disabled: boolean;
    itemCount: number;
    move: (delta: number) => void;
}

/**
 * One rendered row of the wheel window.
 * Type: interface.
 * Fields: offset, index, label, duplicate.
 * @example
 * const row: CycleRow = { offset: 0, index: 2, label: "Wed", duplicate: false };
 */
interface CycleRow {
    offset: number;
    index: number;
    label: string;
    duplicate: boolean;
}

/**
 * One filtered autocomplete suggestion.
 * Type: interface.
 * Fields: index, label, value.
 * @example
 * const suggestion: CycleSuggestion = { index: 0, label: "Mon", value: "Mon" };
 */
interface CycleSuggestion {
    index: number;
    label: string;
    value: string;
}

/**
 * Props for the cyclic wheel picker.
 * Type: interface.
 * Fields: items, value, defaultValue, onChange, getKey, getLabel, label, hint, error,
 * disabled, readOnly, required, onOpenChange, className, id, ref, and the native search
 * input attributes.
 * Keys from `getKey` must be unique; they identify the selected item and typed matches.
 * The search input receives `id`, `name`, `style`, `aria-*`, data attributes, and focus,
 * blur, click, and key handlers; callers can cancel the internal behaviour with
 * `preventDefault`. `onOpenChange` reports whether the suggestion popup is visible.
 * @typeParam T - Item type; strings work without accessors, objects normally need both.
 * @example
 * <CyclePicker
 *     label="Weekday"
 *     items={["Mon", "Tue", "Wed"]}
 *     defaultValue="Mon"
 *     onChange={setWeekday}
 * />
 */
export interface CyclePickerProps<T>
    extends Omit<
            InputHTMLAttributes<HTMLInputElement>,
            "children" | "className" | "defaultValue" | "onChange" | "size" | "type" | "value"
        >,
        PickerDataAttributes {
    items: readonly T[];
    value?: T;
    defaultValue?: T;
    onChange?: (item: T, index: number) => void;
    getKey?: (item: T) => string;
    getLabel?: (item: T) => string;
    label: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
    id?: string;
    ref?: Ref<HTMLInputElement>;
}

/**
 * Renders a cyclic Android-style wheel: five wrapping rows with a centred selection.
 * Up, wheel-up, and drag-down select the previous item; down, wheel-down, and drag-up
 * select the next one, wrapping at both ends. The value field accepts typed text,
 * filters items as an autocomplete popup, and restores the selection on blur.
 * Type: function component.
 * @typeParam T - Item type; pass `getKey` and `getLabel` for objects.
 * Objects should supply `getKey` so the selection survives list recreation.
 * @param props - Items, selected value, change handler, accessors, and field state.
 * @example
 * <CyclePicker
 *     label="Month"
 *     items={months}
 *     getKey={(month: Month): string => month.id}
 *     getLabel={(month: Month): string => month.name}
 *     value={month}
 *     onChange={(next: Month): void => setMonth(next)}
 * />
 * @returns An accessible listbox wheel that wraps in both directions.
 */
const CyclePicker: <T>(props: CyclePickerProps<T>) => ReactNode = <T,>({
    items,
    value,
    defaultValue,
    onChange,
    getKey,
    getLabel,
    label,
    hint,
    error,
    disabled = false,
    readOnly = false,
    required = false,
    onOpenChange,
    className = "",
    id,
    onFocus: onInputFocus,
    onClick: onInputClick,
    onBlur: onInputBlur,
    onKeyDown: onInputKeyDown,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    ref,
    ...rest
}: CyclePickerProps<T>): ReactNode => {
    const generatedId: string = useId();
    const pickerId: string = id ?? generatedId;
    const wheelRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const dragRef: MutableRefObject<DragState | null> = useRef<DragState | null>(null);
    const suppressClickRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const suggestionClickGuardRef: MutableRefObject<boolean> = useRef<boolean>(false);
    const wheelAccumulatorRef: MutableRefObject<number> = useRef<number>(0);
    const wheelLockRef: MutableRefObject<number> = useRef<number>(0);
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
    const mergedInputRef: RefCallback<HTMLInputElement> = useMergedRef(inputRef, ref);
    const suggestionsRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const suggestionsVisibleRef: RefObject<boolean> = useRef<boolean>(false);
    const [dragging, setDragging]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [draft, setDraft]: [string, Dispatch<SetStateAction<string>>] = useState<string>("");
    const [filterText, setFilterText]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("");
    const [editing, setEditing]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [suggestionsOpen, setSuggestionsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [activeIndex, setActiveIndex]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(-1);

    const keys: readonly string[] = items.map((item: T, index: number): string =>
        getKey === (void 0) ? defaultKey(item, index) : getKey(item),
    );

    /**
     * Resolves an item to its key, preferring identity and then `getKey`.
     * @param item - Item to resolve.
     * @example
     * const key: string | void = resolveKey("Mon");
     * @returns The matching key, or `(void 0)` when the item is not in the wheel.
     */
    const resolveKey: (item: T) => string | void = (item: T): string | void => {
        const identityIndex: number = items.findIndex((entry: T): boolean => Object.is(entry, item));

        if (identityIndex >= 0) {
            return keys[identityIndex];
        }

        if (getKey !== (void 0)) {
            const explicitKey: string = getKey(item);

            if (keys.includes(explicitKey)) {
                return explicitKey;
            }
        }

        return isKeyable(item) ? defaultKey(item, -1) : (void 0);
    };

    /**
     * Builds the display label for one row.
     * @param item - Item to label.
     * @param index - Position used when no accessor can describe the item.
     * @example
     * const text: string = labelOf(item, 0);
     * @returns The supplied label, the primitive value, or a positional fallback.
     */
    const labelOf: (item: T, index: number) => string = (item: T, index: number): string => {
        if (getLabel !== (void 0)) {
            const customLabel: string = getLabel(item);

            if (customLabel.length > 0) {
                return customLabel;
            }
        }

        if (isKeyable(item)) {
            return `${item}`;
        }

        return getKey === (void 0) ? `${index}` : getKey(item);
    };

    /**
     * Builds the searchable value text for one item.
     * @param item - Item to describe.
     * @example
     * const value: string = searchValueOf(item);
     * @returns The accessor key, the primitive value, or an empty string.
     */
    const searchValueOf: (item: T) => string = (item: T): string => {
        if (getKey !== (void 0)) {
            return getKey(item);
        }

        return isKeyable(item) ? `${item}` : "";
    };

    const initialKey: string | void =
        defaultValue === (void 0) ? keys[0] : resolveKey(defaultValue);
    const [uncontrolledKey, setUncontrolledKey]: [
        string | void,
        Dispatch<SetStateAction<string | void>>,
    ] = useState<string | void>(initialKey);
    const selectedKey: string | void =
        value === (void 0) ? uncontrolledKey : resolveKey(value as T);
    const foundIndex: number = selectedKey === (void 0) ? -1 : keys.indexOf(selectedKey);
    const selectedIndex: number = foundIndex >= 0 && foundIndex < items.length ? foundIndex : 0;
    const activeOptionId: string | undefined =
        items.length === 0 ? (void 0) : `${pickerId}-option-0-${selectedIndex}`;
    const invalid: boolean = error !== (void 0) && error.length > 0;
    const canStep: boolean = !disabled && !readOnly && items.length > 1;
    const labelledBy: string | undefined =
        ariaLabel !== (void 0) || ariaLabelledBy !== (void 0)
            ? ariaLabelledBy
            : `${pickerId}-label`;
    const internalDescribedBy: string = invalid
        ? `${pickerId}-error`
        : hint === (void 0) || hint.length === 0
          ? ""
          : `${pickerId}-hint`;
    const describedBy: string = [internalDescribedBy, ariaDescribedBy ?? ""]
        .filter((entry: string): boolean => entry.length > 0)
        .join(" ");
    const rows: readonly CycleRow[] =
        items.length === 0
            ? []
            : cycleOffsets.map((offset: number): CycleRow => {
                  const index: number = wrapIndex(selectedIndex + offset, items.length);
                  const duplicate: boolean = cycleOffsets.some(
                      (candidate: number): boolean =>
                          Math.abs(candidate) < Math.abs(offset) &&
                          wrapIndex(selectedIndex + candidate, items.length) === index,
                  );

                  return {
                      offset,
                      index,
                      label: labelOf(items[index], index),
                      duplicate,
                  };
              });
    const selectedLabel: string =
        items.length === 0 ? "" : labelOf(items[selectedIndex], selectedIndex);
    const normalizedQuery: string = filterText.trim().toLowerCase();
    const suggestions: readonly CycleSuggestion[] = items
        .map(
            (item: T, index: number): CycleSuggestion => ({
                index,
                label: labelOf(item, index),
                value: searchValueOf(item),
            }),
        )
        .filter((suggestion: CycleSuggestion): boolean => {
            if (normalizedQuery.length === 0) {
                return true;
            }

            return (
                suggestion.label.toLowerCase().includes(normalizedQuery) ||
                suggestion.value.toLowerCase().includes(normalizedQuery)
            );
        });
    const suggestionsId: string = `${pickerId}-suggestions`;
    const showSuggestions: boolean =
        suggestionsOpen && editing && !disabled && !readOnly && items.length > 0;
    const activeSuggestion: number =
        activeIndex >= 0 && activeIndex < suggestions.length ? activeIndex : -1;
    const activeSuggestionId: string | undefined =
        showSuggestions && activeSuggestion >= 0
            ? `${pickerId}-suggestion-${suggestions[activeSuggestion].index}`
            : (void 0);
    const displayValue: string =
        editing && !disabled && !readOnly && items.length > 0 ? draft : selectedLabel;

    useEffect((): void => {
        if (suggestionsVisibleRef.current === showSuggestions) {
            return;
        }

        suggestionsVisibleRef.current = showSuggestions;
        onOpenChange?.(showSuggestions);
    }, [onOpenChange, showSuggestions]);

    useEffect((): void => {
        if (!showSuggestions || activeSuggestion < 0) {
            return;
        }

        const list: HTMLDivElement | null = suggestionsRef.current;

        if (list === null) {
            return;
        }

        const active: HTMLElement | null = list.querySelector<HTMLElement>(
            `[data-suggestion-index="${suggestions[activeSuggestion].index}"]`,
        );

        if (active === null) {
            return;
        }

        const top: number = active.offsetTop;
        const bottom: number = top + active.offsetHeight;

        if (top < list.scrollTop) {
            list.scrollTop = top;
        } else if (bottom > list.scrollTop + list.clientHeight) {
            list.scrollTop = bottom - list.clientHeight;
        }
    }, [activeSuggestion, showSuggestions, suggestions]);

    /**
     * Selects a row by index, wrapping it and reporting the change.
     * @param nextIndex - Requested index, which may be out of range.
     * @example
     * commitIndex(-1);
     * @returns Nothing.
     */
    const commitIndex: (nextIndex: number) => void = (nextIndex: number): void => {
        if (disabled || readOnly || items.length === 0) {
            return;
        }

        const index: number = wrapIndex(nextIndex, items.length);

        if (index === selectedIndex) {
            return;
        }

        if (value === (void 0)) {
            setUncontrolledKey(keys[index]);
        }

        onChange?.(items[index], index);
    };

    /**
     * Selects the row `delta` positions away from the selection.
     * @param delta - `1` for the next item, `-1` for the previous one.
     * @example
     * commitDelta(1);
     * @returns Nothing.
     */
    const commitDelta: (delta: number) => void = (delta: number): void => {
        commitIndex(selectedIndex + delta);
    };

    const wheelStateRef: MutableRefObject<WheelState> = useRef<WheelState>({
        disabled: disabled || readOnly,
        itemCount: items.length,
        move: commitDelta,
    });

    useEffect((): void => {
        wheelStateRef.current = {
            disabled: disabled || readOnly,
            itemCount: items.length,
            move: commitDelta,
        };
    });

    /**
     * Commits a suggestion and closes the popup without moving focus.
     * @param index - Index of the chosen item.
     * @example
     * selectSuggestion(2);
     * @returns Nothing.
     */
    const selectSuggestion: (index: number) => void = (index: number): void => {
        commitIndex(index);
        setDraft(labelOf(items[index], index));
        setFilterText("");
        setSuggestionsOpen(false);
        setActiveIndex(-1);
    };

    /**
     * Opens suggestions and selects the current text so typing replaces it.
     * @param event - Focus event from the search input.
     * @example
     * <input onFocus={handleInputFocus} />
     * @returns Nothing.
     */
    const handleInputFocus: (event: ReactFocusEvent<HTMLInputElement>) => void = (): void => {
        if (disabled || readOnly || items.length === 0) {
            return;
        }

        setEditing(true);
        setDraft(selectedLabel);
        setFilterText("");
        setSuggestionsOpen(true);
        setActiveIndex(-1);
        suggestionClickGuardRef.current = false;

        const input: HTMLInputElement | null = inputRef.current;

        if (input !== null) {
            window.requestAnimationFrame((): void => {
                input.select();
            });
        }
    };

    /**
     * Reopens suggestions when the focused input is clicked after an Escape.
     * @param event - Click event from the search input.
     * @example
     * <input onClick={handleInputClick} />
     * @returns Nothing.
     */
    const handleInputClick: (event: ReactMouseEvent<HTMLInputElement>) => void = (): void => {
        if (disabled || readOnly || items.length === 0 || suggestionsOpen) {
            return;
        }

        setEditing(true);
        setDraft(selectedLabel);
        setFilterText("");
        setSuggestionsOpen(true);
        setActiveIndex(-1);
        suggestionClickGuardRef.current = false;
    };

    /**
     * Filters suggestions as the user types and highlights the best match.
     * @param event - Change event from the search input.
     * @example
     * <input onChange={handleInputChange} />
     * @returns Nothing.
     */
    const handleInputChange: (event: ReactChangeEvent<HTMLInputElement>) => void = (
        event: ReactChangeEvent<HTMLInputElement>,
    ): void => {
        if (disabled || readOnly || items.length === 0) {
            return;
        }

        setEditing(true);
        setDraft(event.target.value);
        setFilterText(event.target.value);
        setSuggestionsOpen(true);
        setActiveIndex(0);
        suggestionClickGuardRef.current = false;
    };

    /**
     * Restores the selected item label when the input loses focus.
     * @param event - Blur event from the search input.
     * @example
     * <input onBlur={handleInputBlur} />
     * @returns Nothing.
     */
    const handleInputBlur: (event: ReactFocusEvent<HTMLInputElement>) => void = (): void => {
        setEditing(false);
        setFilterText("");
        setSuggestionsOpen(false);
        setActiveIndex(-1);
    };

    /**
     * Navigates suggestions cyclically and commits or cancels with the keyboard.
     * @param event - Keyboard event from the search input.
     * @example
     * <input onKeyDown={handleInputKeyDown} />
     * @returns Nothing.
     */
    const handleInputKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void = (
        event: ReactKeyboardEvent<HTMLInputElement>,
    ): void => {
        if (disabled || readOnly || items.length === 0 || event.nativeEvent.isComposing) {
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();

            if (!showSuggestions) {
                setEditing(true);
                setDraft(selectedLabel);
                setFilterText("");
                setSuggestionsOpen(true);
                setActiveIndex(event.key === "ArrowDown" ? 0 : suggestions.length - 1);
                suggestionClickGuardRef.current = false;
                return;
            }

            if (suggestions.length === 0) {
                return;
            }

            const step: number = event.key === "ArrowDown" ? 1 : -1;
            const base: number =
                activeSuggestion < 0 ? (step === 1 ? -1 : 0) : activeSuggestion;
            setActiveIndex(wrapIndex(base + step, suggestions.length));
        } else if (event.key === "Enter") {
            if (!showSuggestions) {
                return;
            }

            event.preventDefault();

            if (activeSuggestion >= 0) {
                selectSuggestion(suggestions[activeSuggestion].index);
            } else if (suggestions.length === 1) {
                selectSuggestion(suggestions[0].index);
            }
        } else if (event.key === "Escape") {
            if (suggestionsOpen) {
                event.preventDefault();
                event.stopPropagation();
                setSuggestionsOpen(false);
                setActiveIndex(-1);
                setDraft(selectedLabel);
                setFilterText("");
            }
        } else if (event.key === "Tab") {
            setSuggestionsOpen(false);
            setEditing(false);
            setActiveIndex(-1);
            setFilterText("");
        }
    };

    /**
     * Selects a suggestion on pointer-down and keeps focus in the input.
     * @param event - Pointer press on a suggestion.
     * @param index - Index of the pressed item.
     * @example
     * <button onPointerDown={handleSuggestionPointerDown} />
     * @returns Nothing.
     */
    const handleSuggestionPointerDown: (
        event: ReactPointerEvent<HTMLButtonElement>,
        index: number,
    ) => void = (event: ReactPointerEvent<HTMLButtonElement>, index: number): void => {
        event.preventDefault();
        event.stopPropagation();
        suggestionClickGuardRef.current = true;
        selectSuggestion(index);
    };

    /**
     * Falls back to click selection for assistive technologies without pointer events.
     * @param index - Index of the clicked item.
     * @example
     * <button onClick={(): void => handleSuggestionClick(2)} />
     * @returns Nothing.
     */
    const handleSuggestionClick: (index: number) => void = (index: number): void => {
        if (suggestionClickGuardRef.current) {
            suggestionClickGuardRef.current = false;
            return;
        }

        selectSuggestion(index);
    };

    /**
     * Handles keyboard navigation on the wheel.
     * @param event - Keyboard event from the wheel.
     * @example
     * <div onKeyDown={handleKeyDown} />
     * @returns Nothing.
     */
    const handleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        if (disabled || readOnly || items.length === 0) {
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            commitDelta(-1);
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            commitDelta(1);
        } else if (event.key === "Home") {
            event.preventDefault();
            commitIndex(0);
        } else if (event.key === "End") {
            event.preventDefault();
            commitIndex(items.length - 1);
        } else if (event.key === "PageUp") {
            event.preventDefault();
            commitDelta(-cycleOffsets.length);
        } else if (event.key === "PageDown") {
            event.preventDefault();
            commitDelta(cycleOffsets.length);
        }
    };

    useEffect((): (() => void) | void => {
        const wheel: HTMLDivElement | null = wheelRef.current;

        if (wheel === null) {
            return;
        }

        const onWheel: (event: WheelEvent) => void = (event: WheelEvent): void => {
            const state: WheelState = wheelStateRef.current;

            if (state.disabled || state.itemCount === 0 || event.ctrlKey || event.deltaY === 0) {
                return;
            }

            event.preventDefault();

            if (state.itemCount < 2) {
                return;
            }

            const input: HTMLInputElement | null = inputRef.current;

            if (input !== null && document.activeElement === input) {
                input.blur();
            }

            wheelAccumulatorRef.current += event.deltaY * wheelUnit(event.deltaMode);

            const now: number = Date.now();

            if (now - wheelLockRef.current < wheelInterval) {
                return;
            }

            if (Math.abs(wheelAccumulatorRef.current) < wheelStep) {
                return;
            }

            const delta: number = wheelAccumulatorRef.current > 0 ? 1 : -1;
            wheelAccumulatorRef.current = 0;
            wheelLockRef.current = now;
            state.move(delta);
        };

        wheel.addEventListener("wheel", onWheel, { passive: false });

        return (): void => {
            wheel.removeEventListener("wheel", onWheel);
        };
    }, []);

    /**
     * Starts a press that may become a drag; plain clicks still reach the rows.
     * @param event - Pointer press on the wheel.
     * @example
     * <div onPointerDown={handlePointerDown} />
     * @returns Nothing.
     */
    const handlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        if (disabled || readOnly || items.length < 2) {
            return;
        }

        if (event.pointerType === "mouse" && event.button !== 0) {
            return;
        }

        suppressClickRef.current = false;
        dragRef.current = {
            pointerId: event.pointerId,
            lastY: event.clientY,
            offset: 0,
            travelled: 0,
            captured: false,
            baseIndex: selectedIndex,
            steps: 0,
        };
        wheelRef.current?.focus({ preventScroll: true });
    };

    /**
     * Advances the wheel once the pointer travels far enough to count as a drag.
     * @param event - Pointer move over the wheel.
     * @example
     * <div onPointerMove={handlePointerMove} />
     * @returns Nothing.
     */
    const handlePointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        const drag: DragState | null = dragRef.current;

        if (drag === null || drag.pointerId !== event.pointerId) {
            return;
        }

        const delta: number = event.clientY - drag.lastY;
        drag.lastY = event.clientY;
        drag.travelled += Math.abs(delta);
        drag.offset += delta;

        if (!drag.captured) {
            if (drag.travelled < dragThreshold) {
                return;
            }

            drag.captured = true;
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
        }

        let stepped: boolean = false;

        while (Math.abs(drag.offset) >= dragStep) {
            const direction: number = drag.offset < 0 ? 1 : -1;
            drag.offset += direction === 1 ? dragStep : -dragStep;
            drag.steps += direction;
            stepped = true;
        }

        if (stepped) {
            commitIndex(wrapIndex(drag.baseIndex + drag.steps, items.length));
        }
    };

    /**
     * Ends a drag and suppresses the click that the browser may synthesise.
     * @param event - Pointer release or cancel event.
     * @example
     * <div onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />
     * @returns Nothing.
     */
    const handlePointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        const drag: DragState | null = dragRef.current;

        if (drag === null || drag.pointerId !== event.pointerId) {
            return;
        }

        if (drag.captured) {
            suppressClickRef.current = true;

            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }
        }

        dragRef.current = null;
        setDragging(false);
    };

    /**
     * Clears drag state when the browser releases pointer capture unexpectedly.
     * @param event - Lost pointer capture event.
     * @example
     * <div onLostPointerCapture={handleLostPointerCapture} />
     * @returns Nothing.
     */
    const handleLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        const drag: DragState | null = dragRef.current;

        if (drag === null || drag.pointerId !== event.pointerId) {
            return;
        }

        dragRef.current = null;
        setDragging(false);
    };

    /**
     * Selects a clicked row unless the click is the tail of a drag.
     * @param index - Index of the clicked row.
     * @example
     * <button onClick={(): void => handleRowClick(0)} />
     * @returns Nothing.
     */
    const handleRowClick: (index: number) => void = (index: number): void => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
        }

        commitIndex(index);
        wheelRef.current?.focus({ preventScroll: true });
    };

    return (
        <div
            className={cx(
                "number-picker-field",
                "cycle-picker",
                disabled && "number-picker-field--disabled",
                readOnly && "number-picker-field--readonly",
                invalid && "number-picker-field--invalid",
                className,
            )}
        >
            <label
                className="number-picker-field__label"
                id={`${pickerId}-label`}
                htmlFor={`${pickerId}-input`}
            >
                {label}
                {required ? (
                    <span className="number-picker-field__required" aria-hidden="true">
                        *
                    </span>
                ) : null}
            </label>
            <div className="number-picker">
                <div className="cycle-picker__search">
                    <input
                        {...rest}
                        ref={mergedInputRef}
                        id={`${pickerId}-input`}
                        className="cycle-picker__input"
                        type="text"
                        role="combobox"
                        autoComplete="off"
                        spellCheck={false}
                        value={displayValue}
                        disabled={disabled || items.length === 0}
                        readOnly={readOnly}
                        required={required}
                        aria-label={ariaLabel}
                        aria-labelledby={labelledBy}
                        aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                        aria-invalid={invalid ? "true" : (void 0)}
                        aria-expanded={showSuggestions}
                        aria-controls={
                            showSuggestions && suggestions.length > 0 ? suggestionsId : (void 0)
                        }
                        aria-activedescendant={activeSuggestionId}
                        aria-autocomplete="list"
                        aria-haspopup="listbox"
                        onFocus={(event: ReactFocusEvent<HTMLInputElement>): void => {
                            onInputFocus?.(event);

                            if (!event.defaultPrevented) {
                                handleInputFocus(event);
                            }
                        }}
                        onClick={(event: ReactMouseEvent<HTMLInputElement>): void => {
                            onInputClick?.(event);

                            if (!event.defaultPrevented) {
                                handleInputClick(event);
                            }
                        }}
                        onChange={handleInputChange}
                        onBlur={(event: ReactFocusEvent<HTMLInputElement>): void => {
                            onInputBlur?.(event);

                            if (!event.defaultPrevented) {
                                handleInputBlur(event);
                            }
                        }}
                        onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>): void => {
                            onInputKeyDown?.(event);

                            if (!event.defaultPrevented) {
                                handleInputKeyDown(event);
                            }
                        }}
                    />
                    {showSuggestions ? (
                        suggestions.length === 0 ? (
                            <div
                                className="cycle-picker__suggestions cycle-picker__suggestions--empty"
                                role="status"
                            >
                                No matches
                            </div>
                        ) : (
                            <div
                                ref={suggestionsRef}
                                id={suggestionsId}
                                className="cycle-picker__suggestions"
                                role="listbox"
                                aria-labelledby={`${pickerId}-label`}
                            >
                                {suggestions.map(
                                    (
                                        suggestion: CycleSuggestion,
                                        position: number,
                                    ): ReactNode => (
                                        <button
                                            key={suggestion.index}
                                            id={`${pickerId}-suggestion-${suggestion.index}`}
                                            type="button"
                                            role="option"
                                            className={cx(
                                                "cycle-picker__suggestion",
                                                position === activeSuggestion &&
                                                    "cycle-picker__suggestion--active",
                                                suggestion.index === selectedIndex &&
                                                    "cycle-picker__suggestion--selected",
                                            )}
                                            aria-selected={position === activeSuggestion}
                                            aria-posinset={position + 1}
                                            aria-setsize={suggestions.length}
                                            title={suggestion.label}
                                            tabIndex={-1}
                                            data-suggestion-index={suggestion.index}
                                            onPointerDown={(
                                                event: ReactPointerEvent<HTMLButtonElement>,
                                            ): void =>
                                                handleSuggestionPointerDown(
                                                    event,
                                                    suggestion.index,
                                                )
                                            }
                                            onClick={(): void =>
                                                handleSuggestionClick(suggestion.index)
                                            }
                                        >
                                            {suggestion.label}
                                        </button>
                                    ),
                                )}
                            </div>
                        )
                    ) : null}
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    className="number-picker__step"
                    aria-label={`Previous ${label}`}
                    disabled={!canStep}
                    onClick={(): void => commitDelta(-1)}
                >
                    <Icon name="ChevronUp" size={16} />
                </Button>
                <div
                    ref={wheelRef}
                    id={pickerId}
                    className={cx(
                        "number-picker__wheel",
                        "cycle-picker__wheel",
                        dragging && "cycle-picker__wheel--dragging",
                    )}
                    role={items.length === 0 ? "group" : "listbox"}
                    tabIndex={disabled || items.length === 0 ? -1 : 0}
                    aria-labelledby={`${pickerId}-label`}
                    aria-activedescendant={activeOptionId}
                    aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                    aria-disabled={disabled || items.length === 0 ? "true" : (void 0)}
                    aria-readonly={readOnly ? "true" : (void 0)}
                    aria-required={required ? "true" : (void 0)}
                    aria-invalid={invalid ? "true" : (void 0)}
                    onKeyDown={handleKeyDown}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onLostPointerCapture={handleLostPointerCapture}
                >
                    {items.length === 0 ? (
                        <p className="cycle-picker__empty" role="status">
                            No options
                        </p>
                    ) : (
                        rows.map((row: CycleRow): ReactNode => (
                            <button
                                key={row.offset}
                                id={`${pickerId}-option-${row.offset}-${row.index}`}
                                type="button"
                                className={cx(
                                    "number-picker__item",
                                    Math.abs(row.offset) === 1 && "number-picker__item--adjacent",
                                    row.offset === 0 && "number-picker__item--selected",
                                )}
                                role="option"
                                aria-selected={row.offset === 0}
                                aria-posinset={row.index + 1}
                                aria-setsize={items.length}
                                aria-hidden={row.duplicate ? "true" : (void 0)}
                                title={row.label}
                                tabIndex={-1}
                                disabled={disabled}
                                onClick={(): void => handleRowClick(row.index)}
                            >
                                {row.label}
                            </button>
                        ))
                    )}
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    className="number-picker__step"
                    aria-label={`Next ${label}`}
                    disabled={!canStep}
                    onClick={(): void => commitDelta(1)}
                >
                    <Icon name="ChevronDown" size={16} />
                </Button>
            </div>
            {invalid ? (
                <p className="number-picker-field__error" id={`${pickerId}-error`} role="alert">
                    {error}
                </p>
            ) : hint === (void 0) || hint.length === 0 ? null : (
                <p className="number-picker-field__hint" id={`${pickerId}-hint`}>
                    {hint}
                </p>
            )}
        </div>
    );
};

export default CyclePicker;
