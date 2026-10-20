import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
    ButtonHTMLAttributes,
    CSSProperties,
    Dispatch,
    FC,
    KeyboardEventHandler,
    MouseEventHandler,
    MutableRefObject,
    ReactNode,
    Ref,
    RefCallback,
    RefObject,
    SetStateAction,
} from "react";
import { createSelectAdapter, type SelectAdapter, type SelectOption } from "../adapter";
import type { ListEntry } from "../../../../layout/list/adapter";
import Dropdown, { DropdownItem } from "../../../dropdown/Dropdown";
import cx from "../../../foundation/cx";
import useControllableState from "../../../foundation/useControllableState";
import useField, { type FieldState } from "../../../foundation/useField";
import useMergedRef from "../../../foundation/useMergedRef";
import Icon from "../../../icon/Icon";
import Surface from "../../../surface/Surface";
import useVirtualWindow, { type VirtualWindow } from "../../../foundation/useVirtualWindow";
import { useInternational, type InternationalContextValue } from "../../../../international";
import "../Select.css";

/**
 * Visual treatment of the select shell, mirroring TextInput.
 * Type: type alias.
 * Fields: none.
 * @example
 * const variant: SelectVariant = "outline";
 */
export type SelectVariant = "outline" | "fill" | "standard";

/**
 * Control size of the select shell.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: SelectSize = "md";
 */
export type SelectSize = "sm" | "md" | "lg";

/**
 * Props for the virtual Select listbox.
 * Type: interface.
 * Native button attributes are forwarded to the trigger; `className` and `style` apply to the field root.
 * Fields: label, value, defaultValue, options, adapter, onChange, variant, size, hint, error,
 * placeholder, disabled, readOnly, open, defaultOpen, onOpenChange, listHeight, itemHeight,
 * className, id, ref, and native button attributes.
 * @param label - Floating label and accessible name for the trigger.
 * @param value - Controlled selected value.
 * @param defaultValue - Initial selected value when uncontrolled.
 * @param options - Choices rendered in the virtual listbox.
 * @param adapter - Indexed choices used instead of `options`.
 * @param onChange - Called with the selected option value.
 * @param variant - Field variant: outline, fill, or standard.
 * @param size - Control size.
 * @param hint - Supporting text shown below the field.
 * @param error - Validation message; replaces the hint and marks the field invalid.
 * @param placeholder - Text shown while the listbox is open without a selection; defaults to the localised
 * Select label.
 * @param disabled - Disables the trigger natively.
 * @param readOnly - Keeps the value visible but suppresses opening and selection.
 * @param open - Controlled listbox visibility.
 * @param defaultOpen - Initial listbox visibility when uncontrolled.
 * @param onOpenChange - Called when the listbox visibility changes.
 * @param listHeight - Maximum height of the virtual viewport.
 * @param itemHeight - Fixed row height used by the virtual window.
 * @param className - Extra classes for the field root.
 * @param id - Id for the trigger; generated when omitted.
 * @param ref - Ref to the trigger button.
 * @example
 * <VirtualSelect label="Options" value={value} options={options} onChange={setValue} />
 */
export interface VirtualSelectProps
    extends Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        "value" | "defaultValue" | "onChange" | "type" | "className" | "children"
    > {
    label: string;
    value?: string;
    defaultValue?: string;
    options?: readonly SelectOption[];
    adapter?: SelectAdapter;
    onChange: (value: string) => void;
    variant?: SelectVariant;
    size?: SelectSize;
    hint?: string;
    error?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    listHeight?: number;
    itemHeight?: number;
    className?: string;
    id?: string;
    ref?: Ref<HTMLButtonElement>;
}

/**
 * Renders a Material select with a fixed-row virtual listbox.
 * @param props - Label, value, options, change handler, and window sizing.
 * @example
 * <VirtualSelect label="Options" options={options} value={value} onChange={setValue} />
 * @returns A virtualised select control.
 */
const VirtualSelect: FC<VirtualSelectProps> = ({
    label,
    value,
    defaultValue = "",
    options = [],
    adapter,
    onChange,
    variant = "outline",
    size = "md",
    hint,
    error,
    placeholder,
    disabled = false,
    readOnly = false,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    listHeight = 280,
    itemHeight = 40,
    className = "",
    style,
    id,
    onClick,
    onKeyDown,
    ref,
    ...rest
}: VirtualSelectProps) => {
    const { t }: InternationalContextValue = useInternational();
    const virtual: boolean = true;
    const fieldState: FieldState = useField({ id, label, hint, error });
    const controlId: string = fieldState.controlId;
    const labelId: string = `${controlId}-label`;
    const listboxId: string = `${controlId}-listbox`;
    const [selectedValue, setSelectedValue]: readonly [
        string,
        (next: string | ((previous: string) => string)) => void,
    ] = useControllableState<string>({
        value,
        defaultValue,
        onChange,
    });
    const [open, setOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: openProp,
        defaultValue: defaultOpen,
        onChange: onOpenChange,
    });
    const hasError: boolean = fieldState.invalid;
    const describedBy: string = hasError
        ? fieldState.errorId
        : hint !== (void 0) && hint.length > 0
          ? fieldState.hintId
          : "";
    const placeholderText: string = placeholder ?? t("select");

    const source: SelectAdapter = useMemo(
        (): SelectAdapter => adapter ?? createSelectAdapter(options),
        [adapter, options],
    );

    const selectedIndex: number = source.indexOf(selectedValue);
    const selectedOption: SelectOption | void =
        selectedIndex >= 0 ? source.getItem(selectedIndex) : (void 0);
    const displayText: string = selectedOption === (void 0) ? selectedValue : selectedOption.label;
    const hasValue: boolean = selectedOption !== (void 0) || selectedValue.length > 0;
    const [activeIndex, setActiveIndex]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(-1);
    const enabledIndices: number[] = Array.from(
        { length: source.size },
        (entry: unknown, index: number): number => {
            void entry;
            return index;
        },
    ).filter((index: number): boolean => source.getItem(index).disabled !== true);
    const firstEnabledIndex: number = enabledIndices.length === 0 ? -1 : enabledIndices[0];
    const initialActiveIndex: number =
        selectedIndex >= 0 && source.getItem(selectedIndex).disabled !== true
            ? selectedIndex
            : firstEnabledIndex;
    const {
        viewportRef,
        attachViewport,
        attached,
        start,
        end,
        onScroll,
        scrollToIndex,
    }: VirtualWindow = useVirtualWindow({
        count: source.size,
        itemHeight,
        fallbackHeight: listHeight,
        overscan: 2,
    });
    const virtualStart: number = virtual ? start : 0;
    const virtualEnd: number = virtual ? end : source.size;
    const visibleEntries: readonly ListEntry<SelectOption>[] = source.getRange(
        virtualStart,
        virtualEnd,
    );

    const triggerRef: RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement | null>(null);
    const mergedTriggerRef: RefCallback<HTMLButtonElement> = useMergedRef<HTMLButtonElement>(
        triggerRef,
        ref,
    );
    const typeBufferRef: MutableRefObject<string> = useRef<string>("");
    const typeTimerRef: MutableRefObject<number | void> = useRef<number | void>((void 0));

    useLayoutEffect((): void => {
        if (!virtual || !open || !attached || activeIndex < 0) {
            return;
        }

        scrollToIndex(activeIndex, "nearest");
    }, [activeIndex, attached, open, scrollToIndex, virtual]);

    useLayoutEffect((): (() => void) | void => {
        if (!virtual || !open || !attached || activeIndex < 0) {
            return;
        }

        const frame: number = window.requestAnimationFrame((): void => {
            viewportRef.current
                ?.querySelector<HTMLButtonElement>(
                    ".select-field__option--active .dropdown__item-control",
                )
                ?.focus({ preventScroll: true });
        });

        return (): void => {
            window.cancelAnimationFrame(frame);
        };
    }, [activeIndex, attached, open, viewportRef, virtual]);

    useEffect(
        (): (() => void) => (): void => {
            if (typeTimerRef.current !== (void 0)) {
                window.clearTimeout(typeTimerRef.current);
            }
        },
        [],
    );

    /**
     * Opens the controlled dropdown.
     * @example
     * openListbox();
     * @returns Nothing.
     */
    const openListbox: () => void = (): void => {
        if (disabled || readOnly) {
            return;
        }

        if (virtual) {
            setActiveIndex(initialActiveIndex);
        }

        setOpen(true);
    };

    /**
     * Closes the dropdown, clears typeahead, and returns focus to the trigger.
     * @example
     * closeListbox();
     * @returns Nothing.
     */
    const closeListbox: () => void = (): void => {
        setOpen(false);
        typeBufferRef.current = "";
        triggerRef.current?.focus({ preventScroll: true });
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
        typeBufferRef.current = "";

        if (next && virtual) {
            setActiveIndex(initialActiveIndex);
        }

        if (!next) {
            triggerRef.current?.focus({ preventScroll: true });
        }
    };

    /**
     * Commits an option, closes the dropdown, and returns focus to the trigger.
     * @param option - Option to commit.
     * @example
     * handleSelect({ value: "daily", label: "Daily" });
     * @returns Nothing.
     */
    const handleSelect: (option: SelectOption) => void = (option: SelectOption): void => {
        if (disabled || readOnly || option.disabled === true) {
            return;
        }

        setSelectedValue(option.value);
        setOpen(false);
        typeBufferRef.current = "";
        triggerRef.current?.focus({ preventScroll: true });
    };

    /**
     * Toggles the dropdown from the trigger button.
     * @param event - Trigger click event.
     * @example
     * <button onClick={handleTriggerClick} />
     * @returns Nothing.
     */
    const handleTriggerClick: MouseEventHandler<HTMLButtonElement> = (
        event: Parameters<MouseEventHandler<HTMLButtonElement>>[0],
    ): void => {
        onClick?.(event);

        if (disabled || readOnly || event.defaultPrevented) {
            return;
        }

        if (open) {
            closeListbox();
            return;
        }

        openListbox();
    };

    /**
     * Opens the dropdown from the trigger with Enter, Space, or an arrow key.
     * @param event - Trigger key event.
     * @example
     * <button onKeyDown={handleTriggerKeyDown} />
     * @returns Nothing.
     */
    const handleTriggerKeyDown: KeyboardEventHandler<HTMLButtonElement> = (
        event: Parameters<KeyboardEventHandler<HTMLButtonElement>>[0],
    ): void => {
        onKeyDown?.(event);

        if (event.defaultPrevented || disabled || readOnly) {
            return;
        }

        if (
            event.key === "ArrowDown" ||
            event.key === "ArrowUp" ||
            event.key === "Enter" ||
            event.key === " "
        ) {
            event.preventDefault();
            openListbox();
        }
    };

    /**
     * Moves the virtual active row by one enabled step.
     * @param step - Direction: `1` forwards, `-1` backwards.
     * @example
     * moveVirtualActive(1);
     */
    const moveVirtualActive: (step: number) => void = (step: number): void => {
        if (enabledIndices.length === 0) {
            return;
        }

        const current: number = enabledIndices.indexOf(activeIndex);
        const next: number =
            current === -1
                ? step > 0
                    ? 0
                    : enabledIndices.length - 1
                : (current + step + enabledIndices.length) % enabledIndices.length;
        setActiveIndex(enabledIndices[next]);
    };

    /**
     * Moves real focus between the rendered options and handles typeahead.
     * @param event - Key event bubbling from a focused option button.
     * @example
     * <div role="presentation" onKeyDown={handleListboxKeyDown} />
     * @returns Nothing.
     */
    const handleListboxKeyDown: KeyboardEventHandler<HTMLDivElement> = (
        event: Parameters<KeyboardEventHandler<HTMLDivElement>>[0],
    ): void => {
        const listbox: HTMLDivElement | null = viewportRef.current;

        if (listbox === null) {
            return;
        }

        if (virtual) {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                moveVirtualActive(event.key === "ArrowDown" ? 1 : -1);
                return;
            }

            if (event.key === "Home" || event.key === "End") {
                event.preventDefault();
                setActiveIndex(
                    event.key === "Home"
                        ? (firstEnabledIndex ?? -1)
                        : enabledIndices[enabledIndices.length - 1] ?? -1,
                );
                return;
            }

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();

                if (activeIndex >= 0 && activeIndex < source.size) {
                    handleSelect(source.getItem(activeIndex));
                }

                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                closeListbox();
                return;
            }

            if (event.key === "Tab") {
                closeListbox();
                return;
            }

            if (event.key.length !== 1) {
                return;
            }

            const buffer: string = event.key.toLowerCase();
            const startAt: number = enabledIndices.indexOf(activeIndex);

            for (let offset: number = 1; offset <= enabledIndices.length; offset += 1) {
                const position: number =
                    (startAt + offset + enabledIndices.length) % enabledIndices.length;
                const index: number = enabledIndices[position];

                if (source.getItem(index).label.toLowerCase().startsWith(buffer)) {
                    event.preventDefault();
                    setActiveIndex(index);
                    return;
                }
            }

            return;
        }

        const buttons: HTMLButtonElement[] = Array.from(
            listbox.querySelectorAll<HTMLButtonElement>(
                ".dropdown__item-control[role='option']:not(:disabled)",
            ),
        );

        if (buttons.length === 0) {
            return;
        }

        const currentIndex: number =
            document.activeElement instanceof HTMLButtonElement
                ? buttons.indexOf(document.activeElement)
                : -1;

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();

            const step: number = event.key === "ArrowDown" ? 1 : -1;
            const from: number = currentIndex >= 0 ? currentIndex : step > 0 ? -1 : 0;
            const nextIndex: number = (from + step + buttons.length) % buttons.length;
            buttons[nextIndex].focus({ preventScroll: true });
            return;
        }

        if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            const nextIndex: number = event.key === "Home" ? 0 : buttons.length - 1;
            buttons[nextIndex].focus({ preventScroll: true });
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeListbox();
            return;
        }

        if (event.key === "Tab") {
            closeListbox();
            return;
        }

        if (event.key.length !== 1 || event.key === " ") {
            return;
        }

        const buffer: string = `${typeBufferRef.current}${event.key}`.toLowerCase();
        typeBufferRef.current = buffer;

        if (typeTimerRef.current !== (void 0)) {
            window.clearTimeout(typeTimerRef.current);
        }

        typeTimerRef.current = window.setTimeout((): void => {
            typeBufferRef.current = "";
        }, 500);

        for (let offset: number = 1; offset <= buttons.length; offset += 1) {
            const index: number =
                ((currentIndex >= 0 ? currentIndex : -1) + offset + buttons.length) % buttons.length;
            const button: HTMLButtonElement = buttons[index];
            const labelNode: HTMLElement | null = button.querySelector<HTMLElement>(
                ".dropdown__item-label",
            );
            const text: string = (labelNode?.textContent ?? button.textContent ?? "")
                .trim()
                .toLowerCase();

            if (text.startsWith(buffer)) {
                button.focus({ preventScroll: true });
                break;
            }
        }

        event.preventDefault();
    };

    return (
        <div
            className={cx(
                "select-field",
                `select-field--${variant}`,
                `select-field--${size}`,
                open && "select-field--open",
                hasValue && "select-field--filled",
                hasError && "select-field--invalid",
                disabled && "select-field--disabled",
                readOnly && "select-field--readonly",
                virtual && "select-field--virtual",
                className,
            )}
            style={style}
            data-open={open ? "true" : "false"}
            data-invalid={hasError ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
            data-readonly={readOnly ? "true" : "false"}
        >
            <Surface
                className="select-field__surface"
                background={<span className="select-field__background" />}
                foreground={<span className="select-field__edge" />}
                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
            >
                <button
                    {...rest}
                    ref={mergedTriggerRef}
                    id={controlId}
                    type="button"
                    role="combobox"
                    className="select-field__trigger"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-controls={listboxId}
                    aria-labelledby={labelId}
                    aria-invalid={hasError}
                    aria-readonly={readOnly ? true : (void 0)}
                    aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                    disabled={disabled}
                    onClick={handleTriggerClick}
                    onKeyDown={handleTriggerKeyDown}
                >
                    <span
                        className={cx(
                            "select-field__value",
                            displayText.length === 0 && "select-field__value--placeholder",
                        )}
                    >
                        {displayText.length > 0 ? displayText : open ? placeholderText : ""}
                    </span>
                    <span className="select-field__indicator" aria-hidden="true">
                        <Icon name="ChevronDown" size={18} />
                    </span>
                </button>
            </Surface>

            <label className="select-field__label" id={labelId} htmlFor={controlId}>
                {label}
            </label>

            {hasError ? (
                <p className="select-field__error" id={fieldState.errorId} aria-live="polite">
                    {error}
                </p>
            ) : hint !== (void 0) && hint.length > 0 ? (
                <p className="select-field__hint" id={fieldState.hintId}>
                    {hint}
                </p>
            ) : null}

            <Dropdown
                open={open}
                onOpenChange={handleOpenChange}
                anchorRef={triggerRef}
                placement="bottom-start"
                matchWidth
                role="listbox"
                ariaLabel={label}
                isEmpty={source.size === 0}
                empty={<span id={listboxId}>{t("noResults")}</span>}
            >
                <div
                    ref={attachViewport}
                    id={listboxId}
                    className={cx(
                        "select-field__listbox",
                        virtual && "select-field__listbox--virtual",
                    )}
                    style={
                        virtual
                            ? ({
                                  maxHeight: listHeight,
                                  overflowY: "auto",
                                  "--select-item-height": `${itemHeight}px`,
                              } as CSSProperties)
                            : (void 0)
                    }
                    onScroll={onScroll}
                    onKeyDown={handleListboxKeyDown}
                >
                    {virtual && virtualStart > 0 ? (
                        <div
                            aria-hidden="true"
                            style={{ height: virtualStart * itemHeight, flex: "none" }}
                        />
                    ) : null}
                    {visibleEntries.map((entry: ListEntry<SelectOption>): ReactNode => {
                        const option: SelectOption = entry.item;

                        return (
                            <DropdownItem
                                key={option.value}
                                icon={option.icon}
                                selected={option.value === selectedValue}
                                disabled={option.disabled === true}
                                role="option"
                                className={cx(
                                    virtual && "select-field__option--virtual",
                                    virtual &&
                                        entry.index === activeIndex &&
                                        "select-field__option--active",
                                )}
                                onSelect={(): void => handleSelect(option)}
                            >
                                {option.label}
                            </DropdownItem>
                        );
                    })}
                    {virtual && virtualEnd < source.size ? (
                        <div
                            aria-hidden="true"
                            style={{
                                height: (source.size - virtualEnd) * itemHeight,
                                flex: "none",
                            }}
                        />
                    ) : null}
                </div>
            </Dropdown>
        </div>
    );
};

export default VirtualSelect;
