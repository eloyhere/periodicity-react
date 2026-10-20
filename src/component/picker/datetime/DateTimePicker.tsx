import {
    useEffect,
    useId,
    useRef,
    useState,
    type ButtonHTMLAttributes,
    type ChangeEvent,
    type FC,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import Icon from "../../icon/Icon";
import Popover from "../../popover/Popover";
import Surface from "../../surface/Surface";
import Button from "../../button/Button";
import useControllableState from "../../foundation/useControllableState";
import useMergedRef from "../../foundation/useMergedRef";
import type { PickerDataAttributes } from "../shared/native";
import PickerField from "../shared/PickerField";
import { useInternational, type InternationalContextValue } from "../../../international";
import "./DateTimePicker.css";

interface DateTimeParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
}

/**
 * A single calendar day used for focus navigation.
 * Type: interface.
 * Fields: year, month, day.
 * @example
 * const date: CalendarDate = { year: 2026, month: 10, day: 20 };
 */
interface CalendarDate {
    year: number;
    month: number;
    day: number;
}

/**
 * Props for the input-friendly date-time picker.
 * Type: interface.
 * Fields: value, defaultValue, onChange, label, hint, error, disabled, readOnly, required,
 * placeholder, step, onOpenChange, popupClassName, id, className, ref, and the native
 * button attributes.
 * The trigger button receives `id`, `style`, `aria-*`, data attributes, and focus, blur,
 * click, and key handlers; callers can cancel the internal toggle with `preventDefault`.
 * `step` sets the minute input increment.
 * @example
 * <DateTimePicker label="Starts at" value={value} onChange={setValue} />
 */
export interface DateTimePickerProps
    extends Omit<
            ButtonHTMLAttributes<HTMLButtonElement>,
            "type" | "value" | "defaultValue" | "onChange" | "children" | "className"
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
    required?: boolean;
    placeholder?: string;
    id?: string;
    className?: string;
    step?: number;
    onOpenChange?: (open: boolean) => void;
    popupClassName?: string;
    ref?: Ref<HTMLButtonElement>;
}

const pad: (value: number) => string = (value: number): string =>
    `${value}`.padStart(2, "0");

const daysInMonth: (year: number, month: number) => number = (
    year: number,
    month: number,
): number => new Date(year, month, 0).getDate();

const dayFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
});

/**
 * Formats a calendar day as a full, spoken date.
 * @param date - Calendar day to format.
 * @example
 * const label: string = formatDayLabel({ year: 2026, month: 10, day: 20 });
 * @returns A label such as `Tuesday, 20 October 2026`.
 */
const formatDayLabel: (date: CalendarDate) => string = (date: CalendarDate): string =>
    dayFormatter.format(new Date(date.year, date.month - 1, date.day));

/**
 * Serialises a calendar day as an ISO local date key.
 * @param date - Calendar day to serialise.
 * @example
 * const key: string = toDateKey({ year: 2026, month: 10, day: 20 });
 * @returns The `YYYY-MM-DD` key.
 */
const toDateKey: (date: CalendarDate) => string = (date: CalendarDate): string =>
    `${date.year}-${pad(date.month)}-${pad(date.day)}`;

/**
 * Normalises a calendar day, clamping it to the supported year, month, and day bounds.
 * @param date - Candidate calendar day.
 * @example
 * const date: CalendarDate = clampCalendarDate({ year: 2026, month: 13, day: 1 });
 * @returns A valid calendar day within 1900-2100 and the target month length.
 */
const clampCalendarDate: (date: CalendarDate) => CalendarDate = (
    date: CalendarDate,
): CalendarDate => {
    const year: number = Math.min(2100, Math.max(1900, date.year));
    const month: number = Math.min(12, Math.max(1, date.month));
    const day: number = Math.min(daysInMonth(year, month), Math.max(1, date.day));

    return { year, month, day };
};

/**
 * Tests whether two calendar days are the same date.
 * @param left - First calendar day.
 * @param right - Second calendar day.
 * @example
 * const equal: boolean = sameCalendarDate(left, right);
 * @returns Whether the years, months, and days all match.
 */
const sameCalendarDate: (left: CalendarDate, right: CalendarDate) => boolean = (
    left: CalendarDate,
    right: CalendarDate,
): boolean => left.year === right.year && left.month === right.month && left.day === right.day;

/**
 * Moves a calendar day by a number of days, crossing month and year boundaries.
 * @param date - Starting calendar day.
 * @param amount - Days to add; use a negative value to move backwards.
 * @example
 * const next: CalendarDate = shiftDays({ year: 2026, month: 10, day: 20 }, 7);
 * @returns The shifted calendar day.
 */
const shiftDays: (date: CalendarDate, amount: number) => CalendarDate = (
    date: CalendarDate,
    amount: number,
): CalendarDate => {
    const shifted: Date = new Date(date.year, date.month - 1, date.day + amount);

    return {
        year: shifted.getFullYear(),
        month: shifted.getMonth() + 1,
        day: shifted.getDate(),
    };
};

/**
 * Moves a calendar day by a number of months, clamping the day to the target month.
 * @param date - Starting calendar day.
 * @param amount - Months to add; use a negative value to move backwards.
 * @example
 * const next: CalendarDate = shiftMonths({ year: 2026, month: 1, day: 31 }, 1);
 * @returns The shifted calendar day, using the last valid day where required.
 */
const shiftMonths: (date: CalendarDate, amount: number) => CalendarDate = (
    date: CalendarDate,
    amount: number,
): CalendarDate => {
    const shifted: Date = new Date(date.year, date.month - 1 + amount, 1);
    const year: number = shifted.getFullYear();
    const month: number = shifted.getMonth() + 1;

    return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
};

/**
 * Finds the Sunday that starts the week containing a calendar day.
 * @param date - Calendar day within the week.
 * @example
 * const start: CalendarDate = startOfWeek({ year: 2026, month: 10, day: 20 });
 * @returns The first day of the week.
 */
const startOfWeek: (date: CalendarDate) => CalendarDate = (date: CalendarDate): CalendarDate => {
    const weekday: number = new Date(date.year, date.month - 1, date.day).getDay();

    return shiftDays(date, -weekday);
};

/**
 * Finds the Saturday that ends the week containing a calendar day.
 * @param date - Calendar day within the week.
 * @example
 * const end: CalendarDate = endOfWeek({ year: 2026, month: 10, day: 20 });
 * @returns The last day of the week.
 */
const endOfWeek: (date: CalendarDate) => CalendarDate = (date: CalendarDate): CalendarDate => {
    const weekday: number = new Date(date.year, date.month - 1, date.day).getDay();

    return shiftDays(date, 6 - weekday);
};

/**
 * Focuses the button for a calendar day, falling back to the grid when it is unavailable.
 * @param grid - Calendar grid element.
 * @param date - Calendar day to focus.
 * @example
 * focusDayInGrid(gridRef.current, date);
 * @returns Nothing.
 */
const focusDayInGrid: (grid: HTMLDivElement | null, date: CalendarDate) => void = (
    grid: HTMLDivElement | null,
    date: CalendarDate,
): void => {
    const cell: HTMLButtonElement | null =
        grid?.querySelector<HTMLButtonElement>(`[data-date="${toDateKey(date)}"]`) ?? null;

    if (cell !== null && !cell.disabled) {
        cell.focus({ preventScroll: true });
        return;
    }

    grid?.focus({ preventScroll: true });
};

/**
 * Parses an ISO date-time, falling back to the current local time.
 * @param value - ISO local date-time.
 * @example
 * const parts = parseDateTime("2026-10-20T09:30");
 * @returns Date and time parts.
 */
const parseDateTime: (value: string) => DateTimeParts = (value: string): DateTimeParts => {
    const match: RegExpMatchArray | null = value.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
    );
    const now: Date = new Date();

    if (match === null) {
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            hour: now.getHours(),
            minute: now.getMinutes(),
        };
    }

    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: Number(match[5]),
    };
};

const toValue: (parts: DateTimeParts) => string = (parts: DateTimeParts): string =>
    `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;

/**
 * Renders a custom date-time picker with a keyboard-operable calendar grid and editable
 * year, month, hour, and minute inputs.
 * The calendar uses a roving tabindex: arrow keys move by day or week, Home and End move to
 * the week bounds, PageUp and PageDown change month, and Enter or Space selects the focused
 * day. The value is controlled when `value` is supplied and uncontrolled otherwise.
 * @param props - Value, label, support text, open state, and change handler.
 * @example
 * <DateTimePicker label="Starts at" value="2026-10-20T09:30" onChange={setValue} />
 * @returns A date-time picker.
 */
const DateTimePicker: FC<DateTimePickerProps> = ({
    value,
    defaultValue,
    onChange,
    label,
    hint,
    error,
    disabled = false,
    readOnly = false,
    required = false,
    placeholder,
    id,
    className = "",
    step,
    onOpenChange,
    popupClassName,
    onClick: onTriggerClick,
    onKeyDown: onTriggerKeyDown,
    "aria-describedby": ariaDescribedBy,
    ref,
    ...rest
}: DateTimePickerProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedPlaceholder: string = placeholder ?? t("selectDateTime");
    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const panelId: string = `${inputId}-panel`;
    const hintId: string = `${inputId}-hint`;
    const errorId: string = `${inputId}-error`;
    const yearId: string = `${inputId}-year`;
    const monthId: string = `${inputId}-month`;
    const hourId: string = `${inputId}-hour`;
    const minuteId: string = `${inputId}-minute`;
    const anchorRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
    const triggerRef: RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement | null>(null);
    const gridRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const focusPendingRef: RefObject<boolean> = useRef<boolean>(false);
    const mergedTriggerRef: RefCallback<HTMLButtonElement> = useMergedRef(triggerRef, ref);
    const [open, setOpen]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const [selectedValue, setSelectedValue]: readonly [string, (next: string) => void] =
        useControllableState<string>({
            value,
            defaultValue: defaultValue ?? "",
            onChange,
        });
    const invalid: boolean = error !== (void 0) && error.length > 0;
    const describedBy: string = [
        invalid ? errorId : hint !== (void 0) && hint.length > 0 ? hintId : "",
        ariaDescribedBy ?? "",
    ]
        .filter((entry: string): boolean => entry.length > 0)
        .join(" ");
    const parts: DateTimeParts = parseDateTime(selectedValue);
    const [activeDate, setActiveDate]: [CalendarDate, (next: CalendarDate) => void] =
        useState<CalendarDate>({
            year: parts.year,
            month: parts.month,
            day: parts.day,
        });

    useEffect((): void => {
        if (!open || !focusPendingRef.current) {
            return;
        }

        focusPendingRef.current = false;
        focusDayInGrid(gridRef.current, activeDate);
    }, [activeDate, open]);

    /**
     * Reports an open state change to the caller.
     * @param next - Requested open state.
     * @example
     * requestOpenChange(true);
     * @returns Nothing.
     */
    const requestOpenChange: (next: boolean) => void = (next: boolean): void => {
        if (next === open) {
            return;
        }

        setOpen(next);
        onOpenChange?.(next);
    };

    /**
     * Focuses the selected day, or today when nothing is selected, before the popup opens.
     * @example
     * prepareOpen();
     * @returns Nothing.
     */
    const prepareOpen: () => void = (): void => {
        focusPendingRef.current = true;
        setActiveDate({ year: parts.year, month: parts.month, day: parts.day });
    };

    /**
     * Commits a partial date-time and reports the ISO local value.
     * @param next - Partial date-time to merge with the current value.
     * @example
     * commit({ day: 21 });
     * @returns Nothing.
     */
    const commit: (next: Partial<DateTimeParts>) => void = (
        next: Partial<DateTimeParts>,
    ): void => {
        if (disabled || readOnly || (value !== (void 0) && onChange === (void 0))) {
            return;
        }

        const date: CalendarDate = clampCalendarDate({
            year: next.year ?? parts.year,
            month: next.month ?? parts.month,
            day: next.day ?? parts.day,
        });
        const hour: number = Math.min(23, Math.max(0, next.hour ?? parts.hour));
        const minute: number = Math.min(59, Math.max(0, next.minute ?? parts.minute));

        setSelectedValue(toValue({ ...date, hour, minute }));
    };

    /**
     * Moves the roving tab stop and requests focus after the calendar re-renders.
     * @param next - Calendar day that should receive focus.
     * @example
     * moveActiveDate({ year: 2026, month: 10, day: 21 });
     * @returns Nothing.
     */
    const moveActiveDate: (next: CalendarDate) => void = (next: CalendarDate): void => {
        const target: CalendarDate = clampCalendarDate(next);

        if (sameCalendarDate(target, activeDate)) {
            focusPendingRef.current = false;
            focusDayInGrid(gridRef.current, activeDate);
            return;
        }

        focusPendingRef.current = true;
        setActiveDate(target);
    };

    /**
     * Selects a calendar day while honouring disabled and read-only state.
     * @param date - Calendar day to select.
     * @example
     * selectDay({ year: 2026, month: 10, day: 21 });
     * @returns Nothing.
     */
    const selectDay: (date: CalendarDate) => void = (date: CalendarDate): void => {
        if (disabled || readOnly) {
            return;
        }

        setActiveDate(date);
        commit({ year: date.year, month: date.month, day: date.day });
    };

    /**
     * Keeps the roving tab stop in step with pointer or assistive focus.
     * @param date - Calendar day that received focus.
     * @example
     * handleDayFocus({ year: 2026, month: 10, day: 21 });
     * @returns Nothing.
     */
    const handleDayFocus: (date: CalendarDate) => void = (date: CalendarDate): void => {
        if (sameCalendarDate(date, activeDate)) {
            return;
        }

        setActiveDate(date);
    };

    /**
     * Handles the calendar grid keyboard map.
     * @param event - Keyboard event from a day cell.
     * @example
     * <div role="grid" onKeyDown={handleGridKeyDown} />
     * @returns Nothing.
     */
    const handleGridKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        if (disabled || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectDay(activeDate);
            return;
        }

        let target: CalendarDate | void = (void 0);

        switch (event.key) {
            case "ArrowLeft":
                target = shiftDays(activeDate, -1);
                break;
            case "ArrowRight":
                target = shiftDays(activeDate, 1);
                break;
            case "ArrowUp":
                target = shiftDays(activeDate, -7);
                break;
            case "ArrowDown":
                target = shiftDays(activeDate, 7);
                break;
            case "Home":
                target = startOfWeek(activeDate);
                break;
            case "End":
                target = endOfWeek(activeDate);
                break;
            case "PageUp":
                target = shiftMonths(activeDate, event.shiftKey ? -12 : -1);
                break;
            case "PageDown":
                target = shiftMonths(activeDate, event.shiftKey ? 12 : 1);
                break;
            default:
                break;
        }

        if (target === (void 0)) {
            return;
        }

        event.preventDefault();
        moveActiveDate(target);
    };

    /**
     * Commits a year typed into the calendar header.
     * @param event - Change event from the year input.
     * @example
     * <input onChange={handleYearChange} />
     * @returns Nothing.
     */
    const handleYearChange: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const year: number = Number(event.target.value);

        if (!Number.isFinite(year)) {
            return;
        }

        const date: CalendarDate = clampCalendarDate({
            year,
            month: activeDate.month,
            day: activeDate.day,
        });

        setActiveDate(date);
        commit({ year: date.year, month: date.month, day: date.day });
    };

    /**
     * Commits a month typed into the calendar header.
     * @param event - Change event from the month input.
     * @example
     * <input onChange={handleMonthChange} />
     * @returns Nothing.
     */
    const handleMonthChange: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const month: number = Number(event.target.value);

        if (!Number.isFinite(month)) {
            return;
        }

        const date: CalendarDate = clampCalendarDate({
            year: activeDate.year,
            month,
            day: activeDate.day,
        });

        setActiveDate(date);
        commit({ year: date.year, month: date.month, day: date.day });
    };

    /**
     * Toggles the popup while honouring a cancelled caller event.
     * @example
     * <button onClick={handleTriggerClick} />
     * @returns Nothing.
     */
    const handleTriggerClick: () => void = (): void => {
        if (disabled) {
            return;
        }

        if (!open) {
            prepareOpen();
        }

        requestOpenChange(!open);
    };

    /**
     * Opens the popup from the keyboard and closes it with Escape.
     * @param event - Keyboard event from the trigger.
     * @example
     * <button onKeyDown={handleTriggerKeyDown} />
     * @returns Nothing.
     */
    const handleTriggerKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void = (
        event: ReactKeyboardEvent<HTMLButtonElement>,
    ): void => {
        if (disabled) {
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();

            if (open) {
                focusDayInGrid(gridRef.current, activeDate);
            } else {
                prepareOpen();
                requestOpenChange(true);
            }
        } else if (event.key === "Escape" && open) {
            event.preventDefault();
            requestOpenChange(false);
        }
    };

    /**
     * Closes the popup with Escape and returns focus to the trigger.
     * @param event - Keyboard event from the panel.
     * @example
     * <div onKeyDown={handlePanelKeyDown} />
     * @returns Nothing.
     */
    const handlePanelKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        if (event.key !== "Escape") {
            return;
        }

        event.stopPropagation();
        requestOpenChange(false);
        triggerRef.current?.focus({ preventScroll: true });
    };

    const firstWeekday: number = new Date(activeDate.year, activeDate.month - 1, 1).getDay();
    const dayCount: number = daysInMonth(activeDate.year, activeDate.month);
    const rowCount: number = Math.ceil((firstWeekday + dayCount) / 7);
    const weeks: Array<Array<number | null>> = [];

    for (let weekIndex: number = 0; weekIndex < rowCount; weekIndex += 1) {
        const week: Array<number | null> = [];

        for (let cellIndex: number = 0; cellIndex < 7; cellIndex += 1) {
            const day: number = weekIndex * 7 + cellIndex - firstWeekday + 1;
            week.push(day >= 1 && day <= dayCount ? day : null);
        }

        weeks.push(week);
    }

    const currentDate: Date = new Date();
    const today: CalendarDate = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
    };

    const displayValue: string =
        selectedValue.length === 0
            ? resolvedPlaceholder
            : `${parts.year}/${pad(parts.month)}/${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`;

    return (
        <span ref={anchorRef} className={`date-time-picker ${className}`.trim()}>
            <PickerField
                label={label}
                hint={hint}
                error={error}
                htmlFor={inputId}
                hintId={hintId}
                errorId={errorId}
                required={required}
                disabled={disabled}
            >
                <Surface
                    className="date-time-picker__ripple"
                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                    disabled={disabled}
                >
                    <button
                        {...rest}
                        ref={mergedTriggerRef}
                        id={inputId}
                        type="button"
                        className="date-time-picker__trigger"
                        disabled={disabled}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        aria-controls={open ? panelId : (void 0)}
                        aria-invalid={invalid ? "true" : (void 0)}
                        aria-readonly={readOnly ? "true" : (void 0)}
                        aria-required={required ? "true" : (void 0)}
                        aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                        onClick={(event: ReactMouseEvent<HTMLButtonElement>): void => {
                            onTriggerClick?.(event);

                            if (!event.defaultPrevented) {
                                handleTriggerClick();
                            }
                        }}
                        onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>): void => {
                            onTriggerKeyDown?.(event);

                            if (!event.defaultPrevented) {
                                handleTriggerKeyDown(event);
                            }
                        }}
                    >
                        <Icon name="Calendar" size={16} />
                        {displayValue}
                    </button>
                </Surface>
            </PickerField>

            <Popover
                open={open}
                onOpenChange={requestOpenChange}
                anchorRef={anchorRef}
                placement="bottom-start"
                className={popupClassName}
                ariaLabel={`${label} picker`}
            >
                <div
                    id={panelId}
                    className="date-time-picker__panel"
                    role="dialog"
                    aria-label={`${label} picker`}
                    onKeyDown={handlePanelKeyDown}
                >
                    <div className="date-time-picker__header">
                        <label htmlFor={yearId}>
                            Year
                            <input
                                id={yearId}
                                type="number"
                                min={1900}
                                max={2100}
                                value={activeDate.year}
                                readOnly={readOnly}
                                onChange={handleYearChange}
                            />
                        </label>
                        <label htmlFor={monthId}>
                            Month
                            <input
                                id={monthId}
                                type="number"
                                min={1}
                                max={12}
                                value={activeDate.month}
                                readOnly={readOnly}
                                onChange={handleMonthChange}
                            />
                        </label>
                    </div>

                    <div className="date-time-picker__weekdays" aria-hidden="true">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                            (weekday: string): ReactNode => (
                                <span key={weekday}>{weekday}</span>
                            ),
                        )}
                    </div>

                    <div
                        ref={gridRef}
                        className="date-time-picker__days"
                        role="grid"
                        aria-label={t("days")}
                        aria-colcount={7}
                        aria-rowcount={weeks.length}
                        aria-readonly={readOnly ? "true" : (void 0)}
                        tabIndex={-1}
                        onKeyDown={handleGridKeyDown}
                    >
                        {weeks.map(
                            (week: Array<number | null>, weekIndex: number): ReactNode => (
                                <div
                                    key={`week-${weekIndex}`}
                                    className="date-time-picker__week"
                                    role="row"
                                >
                                    {week.map(
                                        (day: number | null, cellIndex: number): ReactNode => {
                                            if (day === null) {
                                                return (
                                                    <span
                                                        key={`blank-${weekIndex}-${cellIndex}`}
                                                        className="date-time-picker__blank"
                                                        role="gridcell"
                                                        aria-disabled="true"
                                                    />
                                                );
                                            }

                                            const date: CalendarDate = {
                                                year: activeDate.year,
                                                month: activeDate.month,
                                                day,
                                            };
                                            const isSelected: boolean =
                                                date.year === parts.year &&
                                                date.month === parts.month &&
                                                date.day === parts.day;
                                            const isActive: boolean = date.day === activeDate.day;
                                            const isToday: boolean = sameCalendarDate(date, today);

                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    role="gridcell"
                                                    className={
                                                        isSelected
                                                            ? "date-time-picker__day date-time-picker__day--selected"
                                                            : "date-time-picker__day"
                                                    }
                                                    tabIndex={isActive ? 0 : -1}
                                                    aria-selected={isSelected}
                                                    aria-current={isToday ? "date" : (void 0)}
                                                    aria-disabled={
                                                        readOnly ? "true" : (void 0)
                                                    }
                                                    aria-label={formatDayLabel(date)}
                                                    data-date={toDateKey(date)}
                                                    disabled={readOnly}
                                                    onClick={(): void => selectDay(date)}
                                                    onFocus={(): void => handleDayFocus(date)}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                            ),
                        )}
                    </div>

                    <div className="date-time-picker__time">
                        <label htmlFor={hourId}>
                            Hour
                            <input
                                id={hourId}
                                type="number"
                                min={0}
                                max={23}
                                value={parts.hour}
                                readOnly={readOnly}
                                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                    commit({ hour: Number(event.target.value) })
                                }
                            />
                        </label>
                        <label htmlFor={minuteId}>
                            Minute
                            <input
                                id={minuteId}
                                type="number"
                                min={0}
                                max={59}
                                step={step ?? 5}
                                value={parts.minute}
                                readOnly={readOnly}
                                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                    commit({ minute: Number(event.target.value) })
                                }
                            />
                        </label>
                    </div>

                    <footer className="date-time-picker__footer">
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={readOnly}
                            onClick={(): void => {
                                if (readOnly || disabled) {
                                    return;
                                }

                                setSelectedValue("");
                                requestOpenChange(false);
                                triggerRef.current?.focus({ preventScroll: true });
                            }}
                        >
                            Clear
                        </Button>
                        <Button
                            size="sm"
                            onClick={(): void => {
                                commit({});
                                requestOpenChange(false);
                                triggerRef.current?.focus({ preventScroll: true });
                            }}
                        >
                            Apply
                        </Button>
                    </footer>
                </div>
            </Popover>
        </span>
    );
};

export default DateTimePicker;
