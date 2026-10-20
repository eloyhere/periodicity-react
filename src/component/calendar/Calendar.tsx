import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type FC,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    type Ref,
    type RefObject,
} from "react";
import cx from "../foundation/cx";
import useControllableState from "../foundation/useControllableState";
import { useInternational, type InternationalContextValue } from "../../international";
import "./Calendar.css";

/**
 * A calendar value serialised as an ISO local date key.
 * Type: type alias.
 * Fields: none.
 * @example
 * const value: CalendarValue = "2026-10-20";
 */
export type CalendarValue = string;

/**
 * A calendar day expressed in the local calendar.
 * Type: interface.
 * Fields:
 * - `year`: Four-digit year.
 * - `month`: Month number from 1 (January) to 12 (December).
 * - `day`: Day of the month from 1 to the month length.
 * @example
 * const date: CalendarDate = { year: 2026, month: 10, day: 20 };
 */
export interface CalendarDate {
    year: number;
    month: number;
    day: number;
}

/**
 * Context handed to a custom day renderer.
 * Type: interface.
 * Fields:
 * - `date`: Structured calendar day.
 * - `iso`: ISO local date key, for example `2026-10-20`.
 * - `day`: Day of the month.
 * - `month`: Month number from 1 to 12.
 * - `year`: Four-digit year.
 * - `isSelected`: Whether the day is the selected value.
 * - `isToday`: Whether the day matches today or the `today` override.
 * - `isOutsideMonth`: Whether the day belongs to an adjacent month.
 * - `isDisabled`: Whether the day is outside `min`/`max` or the calendar is disabled.
 * - `isTabStop`: Whether the day currently owns the roving tab stop.
 * @example
 * const context: CalendarDayContext = {
 *     date: { year: 2026, month: 10, day: 20 },
 *     iso: "2026-10-20",
 *     day: 20,
 *     month: 10,
 *     year: 2026,
 *     isSelected: true,
 *     isToday: false,
 *     isOutsideMonth: false,
 *     isDisabled: false,
 *     isTabStop: true,
 * };
 */
export interface CalendarDayContext {
    date: CalendarDate;
    iso: string;
    day: number;
    month: number;
    year: number;
    isSelected: boolean;
    isToday: boolean;
    isOutsideMonth: boolean;
    isDisabled: boolean;
    isTabStop: boolean;
}

/**
 * Props for the Calendar component.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `style`, `role`, `aria-*`, pointer, mouse, keyboard,
 * and focus handlers are forwarded to the root element. `children`, `className`, `defaultValue`, and
 * `onChange` are replaced by the component API.
 * Fields:
 * - `value`: Controlled selected date as `YYYY-MM-DD`; omit for uncontrolled use.
 * - `defaultValue`: Initial uncontrolled date; defaults to an empty string.
 * - `onChange`: Called with the next ISO date key after a selection is accepted.
 * - `min`: Earliest selectable ISO date; invalid values leave the range open.
 * - `max`: Latest selectable ISO date; invalid values leave the range open.
 * - `disabled`: Disables browsing and selection.
 * - `readOnly`: Prevents selection while leaving month browsing available.
 * - `locale`: BCP 47 locale for Intl month, weekday, and date labels; defaults to `en-GB`.
 * - `firstDayOfWeek`: First weekday column, 0 (Sunday) to 6 (Saturday); defaults to 1 (Monday).
 * - `today`: ISO date that overrides the real local date for the `aria-current="date"` marker.
 * - `showAdjacentDays`: Whether leading and trailing days from adjacent months are rendered.
 * - `weekdayLabels`: Seven visible weekday labels ordered Sunday to Saturday.
 * - `monthLabels`: Twelve visible month labels ordered January to December.
 * - `renderDay`: Replaces the default day number with custom cell content.
 * - `label`: Accessible name of the calendar group; defaults to the localised Calendar label.
 * - `previousMonthLabel`: Accessible name of the previous-month button; defaults to the localised
 * Previous month label.
 * - `nextMonthLabel`: Accessible name of the next-month button; defaults to the localised Next month label.
 * - `todayLabel`: Accessible suffix added to the current day; defaults to the localised Today label.
 * - `className`: Extra class names for the root element.
 * - `ref`: Ref forwarded to the root element.
 * @example
 * <Calendar defaultValue="2026-10-20" onChange={(value) => console.log(value)} />
 * @example
 * <Calendar value={value} min="2026-01-01" max="2026-12-31" firstDayOfWeek={0} onChange={setValue} />
 */
export interface CalendarProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "defaultValue" | "onChange"> {
    value?: CalendarValue;
    defaultValue?: CalendarValue;
    onChange?: (value: CalendarValue) => void;
    min?: CalendarValue;
    max?: CalendarValue;
    disabled?: boolean;
    readOnly?: boolean;
    locale?: string;
    firstDayOfWeek?: number;
    today?: CalendarValue;
    showAdjacentDays?: boolean;
    weekdayLabels?: readonly string[];
    monthLabels?: readonly string[];
    renderDay?: (context: CalendarDayContext) => ReactNode;
    label?: string;
    previousMonthLabel?: string;
    nextMonthLabel?: string;
    todayLabel?: string;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * One weekday column of the month grid.
 * Type: interface.
 * Fields:
 * - `weekday`: JavaScript weekday index, 0 (Sunday) to 6 (Saturday).
 * - `shortLabel`: Visible column label.
 * - `longLabel`: Accessible column label.
 * @example
 * const weekday: CalendarWeekday = { weekday: 1, shortLabel: "Mon", longLabel: "Monday" };
 */
interface CalendarWeekday {
    weekday: number;
    shortLabel: string;
    longLabel: string;
}

/**
 * Memoised Intl formatters for one locale.
 * Type: interface.
 * Fields:
 * - `day`: Full spoken date, for example `Tuesday, 20 October 2026`.
 * - `weekdayLong`: Full weekday name.
 * - `weekdayShort`: Abbreviated weekday name.
 * - `month`: Month and year title.
 * @example
 * const formatters: CalendarFormatters = createFormatters("en-GB");
 */
interface CalendarFormatters {
    day: Intl.DateTimeFormat;
    weekdayLong: Intl.DateTimeFormat;
    weekdayShort: Intl.DateTimeFormat;
    month: Intl.DateTimeFormat;
}

/**
 * Roving-focus state for the month grid.
 * Type: interface.
 * Fields:
 * - `activeDate`: Day that owns the roving tab stop.
 * - `selectedKey`: Selected value observed when the focus state was last changed.
 * @example
 * const navigation: CalendarNavigation = {
 *     activeDate: { year: 2026, month: 10, day: 20 },
 *     selectedKey: "2026-10-20",
 * };
 */
interface CalendarNavigation {
    activeDate: CalendarDate;
    selectedKey: string;
}

/**
 * One week row of the month grid, padded with (void 0) holes when adjacent days are hidden.
 * Type: type alias.
 * Fields: none.
 * @example
 * const week: CalendarWeek = [{ year: 2026, month: 10, day: 1 }, null, null, null, null, null, null];
 */
type CalendarWeek = Array<CalendarDate | null>;

/** Locale used for labels and Intl formatting when the prop is empty. */
const DefaultLocale: string = "en-GB";

/** Monday, matching the default `en-GB` locale convention. */
const DefaultFirstDayOfWeek: number = 1;

/** Number of columns in the month grid. */
const DaysPerWeek: number = 7;

/** Lowest ISO year accepted by the parser. */
const MinimumYear: number = 1;

/** Highest ISO year accepted by the parser. */
const MaximumYear: number = 9999;

/** Shape of an ISO local date key. */
const IsoDatePattern: RegExp = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Known Sunday used to derive weekday names without depending on the current date. */
const WeekdayReference: CalendarDate = { year: 2024, month: 1, day: 7 };

/**
 * Pads a number with a leading zero.
 * @param value - Number to pad.
 * @example
 * const text: string = padNumber(4);
 * @returns Two characters, for example `04`.
 */
const padNumber: (value: number) => string = (value: number): string => `${value}`.padStart(2, "0");

/**
 * Creates a local date without the two-digit-year constructor quirk.
 * @param year - Four-digit year.
 * @param month - Month number from 1 to 12.
 * @param day - Day of the month; out-of-range values are normalised by the Date API.
 * @example
 * const date: Date = createLocalDate(2026, 10, 20);
 * @returns A local Date at midnight on the requested day.
 */
const createLocalDate: (year: number, month: number, day: number) => Date = (
    year: number,
    month: number,
    day: number,
): Date => {
    const date: Date = new Date(2000, 0, 1);

    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);

    return date;
};

/**
 * Reads the local calendar fields from a Date.
 * @param date - Date to read.
 * @example
 * const value: CalendarDate = toCalendarDate(new Date(2026, 9, 20));
 * @returns The year, month, and day in local time.
 */
const toCalendarDate: (date: Date) => CalendarDate = (date: Date): CalendarDate => ({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
});

/**
 * Serialises a calendar day as an ISO local date key.
 * @param date - Calendar day to serialise.
 * @example
 * const key: string = toIsoDate({ year: 2026, month: 10, day: 4 });
 * @returns The `YYYY-MM-DD` key, padded where required.
 */
const toIsoDate: (date: CalendarDate) => string = (date: CalendarDate): string =>
    `${`${date.year}`.padStart(4, "0")}-${padNumber(date.month)}-${padNumber(date.day)}`;

/**
 * Counts the days in a month, including leap-year February.
 * @param year - Four-digit year.
 * @param month - Month number from 1 to 12.
 * @example
 * const count: number = daysInMonth(2024, 2);
 * @returns The month length, for example `29`.
 */
const daysInMonth: (year: number, month: number) => number = (year: number, month: number): number =>
    createLocalDate(year, month + 1, 0).getDate();

/**
 * Parses an ISO local date key, rejecting malformed or impossible dates.
 * @param value - Candidate `YYYY-MM-DD` string.
 * @example
 * const date: CalendarDate | null = parseIsoDate("2024-02-29");
 * @returns The calendar day, or null when the value is not a valid ISO date.
 */
const parseIsoDate: (value: string) => CalendarDate | null = (value: string): CalendarDate | null => {
    const match: RegExpMatchArray | null = value.match(IsoDatePattern);

    if (match === null) {
        return null;
    }

    const year: number = Number(match[1]);
    const month: number = Number(match[2]);
    const day: number = Number(match[3]);

    if (
        year < MinimumYear ||
        year > MaximumYear ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > daysInMonth(year, month)
    ) {
        return null;
    }

    return { year, month, day };
};

/**
 * Compares two calendar days chronologically.
 * @param left - First calendar day.
 * @param right - Second calendar day.
 * @example
 * const order: number = compareCalendarDates(left, right);
 * @returns A negative number when `left` is earlier, zero when equal, and a positive number when later.
 */
const compareCalendarDates: (left: CalendarDate, right: CalendarDate) => number = (
    left: CalendarDate,
    right: CalendarDate,
): number => {
    if (left.year !== right.year) {
        return left.year < right.year ? -1 : 1;
    }

    if (left.month !== right.month) {
        return left.month < right.month ? -1 : 1;
    }

    if (left.day !== right.day) {
        return left.day < right.day ? -1 : 1;
    }

    return 0;
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
): boolean => compareCalendarDates(left, right) === 0;

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
): CalendarDate => toCalendarDate(createLocalDate(date.year, date.month, date.day + amount));

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
    const totalMonths: number = date.month - 1 + amount;
    const yearOffset: number = Math.floor(totalMonths / 12);
    const monthIndex: number = ((totalMonths % 12) + 12) % 12;
    const year: number = date.year + yearOffset;
    const month: number = monthIndex + 1;

    return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
};

/**
 * Reads the weekday index of a calendar day.
 * @param date - Calendar day to inspect.
 * @example
 * const weekday: number = getWeekday({ year: 2026, month: 10, day: 20 });
 * @returns The JavaScript weekday index, 0 (Sunday) to 6 (Saturday).
 */
const getWeekday: (date: CalendarDate) => number = (date: CalendarDate): number =>
    createLocalDate(date.year, date.month, date.day).getDay();

/**
 * Finds the first day of the week containing a calendar day.
 * @param date - Calendar day within the week.
 * @param firstDayOfWeek - Week start, 0 (Sunday) to 6 (Saturday).
 * @example
 * const start: CalendarDate = startOfWeek({ year: 2026, month: 10, day: 20 }, 1);
 * @returns The first day of the containing week.
 */
const startOfWeek: (date: CalendarDate, firstDayOfWeek: number) => CalendarDate = (
    date: CalendarDate,
    firstDayOfWeek: number,
): CalendarDate => {
    const weekday: number = getWeekday(date);
    const offset: number = (weekday - firstDayOfWeek + DaysPerWeek) % DaysPerWeek;

    return shiftDays(date, -offset);
};

/**
 * Finds the last day of the week containing a calendar day.
 * @param date - Calendar day within the week.
 * @param firstDayOfWeek - Week start, 0 (Sunday) to 6 (Saturday).
 * @example
 * const end: CalendarDate = endOfWeek({ year: 2026, month: 10, day: 20 }, 1);
 * @returns The last day of the containing week.
 */
const endOfWeek: (date: CalendarDate, firstDayOfWeek: number) => CalendarDate = (
    date: CalendarDate,
    firstDayOfWeek: number,
): CalendarDate => shiftDays(startOfWeek(date, firstDayOfWeek), DaysPerWeek - 1);

/**
 * Finds the first day of a calendar month.
 * @param date - Any day within the month.
 * @example
 * const start: CalendarDate = startOfMonth({ year: 2026, month: 10, day: 20 });
 * @returns The first day of the month.
 */
const startOfMonth: (date: CalendarDate) => CalendarDate = (date: CalendarDate): CalendarDate => ({
    year: date.year,
    month: date.month,
    day: 1,
});

/**
 * Finds the last day of a calendar month.
 * @param date - Any day within the month.
 * @example
 * const end: CalendarDate = endOfMonth({ year: 2026, month: 10, day: 20 });
 * @returns The last day of the month.
 */
const endOfMonth: (date: CalendarDate) => CalendarDate = (date: CalendarDate): CalendarDate => ({
    year: date.year,
    month: date.month,
    day: daysInMonth(date.year, date.month),
});

/**
 * Clamps a calendar day to the inclusive minimum and maximum bounds.
 * @param date - Candidate calendar day.
 * @param minimum - Earliest allowed day, or null when unbounded.
 * @param maximum - Latest allowed day, or null when unbounded.
 * @example
 * const date: CalendarDate = clampCalendarDate(candidate, minimum, maximum);
 * @returns The candidate, moved to the nearest bound where required.
 */
const clampCalendarDate: (
    date: CalendarDate,
    minimum: CalendarDate | null,
    maximum: CalendarDate | null,
) => CalendarDate = (
    date: CalendarDate,
    minimum: CalendarDate | null,
    maximum: CalendarDate | null,
): CalendarDate => {
    let next: CalendarDate = {
        year: Math.min(MaximumYear, Math.max(MinimumYear, date.year)),
        month: date.month,
        day: date.day,
    };

    if (minimum !== null && compareCalendarDates(next, minimum) < 0) {
        next = minimum;
    }

    if (maximum !== null && compareCalendarDates(next, maximum) > 0) {
        next = maximum;
    }

    return next;
};

/**
 * Tests whether a calendar day falls outside the inclusive range.
 * @param date - Calendar day to test.
 * @param minimum - Earliest allowed day, or null when unbounded.
 * @param maximum - Latest allowed day, or null when unbounded.
 * @example
 * const blocked: boolean = isDateOutOfRange(date, minimum, maximum);
 * @returns Whether the day is earlier than `minimum` or later than `maximum`.
 */
const isDateOutOfRange: (date: CalendarDate, minimum: CalendarDate | null, maximum: CalendarDate | null) => boolean = (
    date: CalendarDate,
    minimum: CalendarDate | null,
    maximum: CalendarDate | null,
): boolean =>
    (minimum !== null && compareCalendarDates(date, minimum) < 0) ||
    (maximum !== null && compareCalendarDates(date, maximum) > 0);

/**
 * Builds an Intl formatter with a safe fallback for unsupported locales.
 * @param locale - BCP 47 locale tag.
 * @param options - Intl date-time options.
 * @example
 * const formatter: Intl.DateTimeFormat = createFormatter("en-GB", { month: "long" });
 * @returns A formatter for the locale, or for `en-GB` when the tag is invalid.
 */
const createFormatter: (locale: string, options: Intl.DateTimeFormatOptions) => Intl.DateTimeFormat = (
    locale: string,
    options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat => {
    try {
        return new Intl.DateTimeFormat(locale, options);
    } catch {
        return new Intl.DateTimeFormat(DefaultLocale, options);
    }
};

/**
 * Creates the full set of formatters used by the calendar.
 * @param locale - BCP 47 locale tag.
 * @example
 * const formatters: CalendarFormatters = createFormatters("en-GB");
 * @returns Intl formatters for spoken dates, weekdays, and month titles.
 */
const createFormatters: (locale: string) => CalendarFormatters = (locale: string): CalendarFormatters => {
    const safeLocale: string = locale.length > 0 ? locale : DefaultLocale;

    return {
        day: createFormatter(safeLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
        weekdayLong: createFormatter(safeLocale, { weekday: "long" }),
        weekdayShort: createFormatter(safeLocale, { weekday: "short" }),
        month: createFormatter(safeLocale, { month: "long", year: "numeric" }),
    };
};

/**
 * Builds the weekday header row in display order.
 * @param firstDayOfWeek - Week start, 0 (Sunday) to 6 (Saturday).
 * @param formatters - Locale formatters.
 * @param weekdayLabels - Optional seven labels ordered Sunday to Saturday.
 * @example
 * const weekdays: CalendarWeekday[] = buildWeekdays(1, formatters, (void 0));
 * @returns Seven weekday columns starting at `firstDayOfWeek`.
 */
const buildWeekdays: (
    firstDayOfWeek: number,
    formatters: CalendarFormatters,
    weekdayLabels: readonly string[] | null,
) => CalendarWeekday[] = (
    firstDayOfWeek: number,
    formatters: CalendarFormatters,
    weekdayLabels: readonly string[] | null,
): CalendarWeekday[] => {
    const weekdays: CalendarWeekday[] = [];

    for (let index: number = 0; index < DaysPerWeek; index += 1) {
        const weekday: number = (firstDayOfWeek + index) % DaysPerWeek;
        const override: string | null = weekdayLabels?.[weekday] ?? null;
        const referenceDate: Date = createLocalDate(
            WeekdayReference.year,
            WeekdayReference.month,
            WeekdayReference.day + weekday,
        );
        const label: string | null = override !== null && override.length > 0 ? override : null;

        weekdays.push({
            weekday,
            shortLabel: label ?? formatters.weekdayShort.format(referenceDate),
            longLabel: label ?? formatters.weekdayLong.format(referenceDate),
        });
    }

    return weekdays;
};

/**
 * Builds the week rows for a month, including adjacent days when requested.
 * @param year - Four-digit year.
 * @param month - Month number from 1 to 12.
 * @param firstDayOfWeek - Week start, 0 (Sunday) to 6 (Saturday).
 * @param showAdjacentDays - Whether out-of-month cells contain real dates.
 * @example
 * const weeks: CalendarWeek[] = buildMonthWeeks(2026, 10, 1, true);
 * @returns Complete week rows padded to whole weeks.
 */
const buildMonthWeeks: (
    year: number,
    month: number,
    firstDayOfWeek: number,
    showAdjacentDays: boolean,
) => CalendarWeek[] = (
    year: number,
    month: number,
    firstDayOfWeek: number,
    showAdjacentDays: boolean,
): CalendarWeek[] => {
    const totalDays: number = daysInMonth(year, month);
    const firstDate: CalendarDate = { year, month, day: 1 };
    const offset: number = (getWeekday(firstDate) - firstDayOfWeek + DaysPerWeek) % DaysPerWeek;
    const totalCells: number = Math.ceil((offset + totalDays) / DaysPerWeek) * DaysPerWeek;
    const cells: Array<CalendarDate | null> = [];

    for (let index: number = 0; index < totalCells; index += 1) {
        const dayOffset: number = index - offset;

        if (dayOffset >= 0 && dayOffset < totalDays) {
            cells.push({ year, month, day: dayOffset + 1 });
        } else {
            cells.push(showAdjacentDays ? shiftDays(firstDate, dayOffset) : null);
        }
    }

    const weeks: CalendarWeek[] = [];

    for (let index: number = 0; index < totalCells; index += DaysPerWeek) {
        weeks.push(cells.slice(index, index + DaysPerWeek));
    }

    return weeks;
};

/**
 * Renders a Material-style month calendar with a semantic, keyboard-operable grid.
 * The value is controlled when `value` is supplied and uncontrolled otherwise. Exactly one day
 * owns the roving tab stop: arrow keys move by day or week, Home and End move to the week bounds,
 * PageUp and PageDown change month (Shift changes year), and Enter or Space selects the focused
 * day. The previous and next month buttons are native buttons with accessible names.
 * @param props - Value, range, state, locale, label, rendering, and native div attributes.
 * @example
 * <Calendar defaultValue="2026-10-20" onChange={(value) => console.log(value)} />
 * @returns A calendar widget with a month header and a seven-column grid.
 */
export const Calendar: FC<CalendarProps> = ({
    value,
    defaultValue = "",
    onChange,
    min,
    max,
    disabled = false,
    readOnly = false,
    locale = DefaultLocale,
    firstDayOfWeek = DefaultFirstDayOfWeek,
    today,
    showAdjacentDays = true,
    weekdayLabels,
    monthLabels,
    renderDay,
    label,
    previousMonthLabel,
    nextMonthLabel,
    todayLabel,
    className = "",
    ref,
    role,
    "aria-label": ariaLabelAttribute,
    ...rest
}: CalendarProps): ReactNode => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedLabel: string = label ?? t("calendar");
    const resolvedPreviousMonthLabel: string = previousMonthLabel ?? t("previousMonth");
    const resolvedNextMonthLabel: string = nextMonthLabel ?? t("nextMonth");
    const resolvedTodayLabel: string = todayLabel ?? t("today");
    const generatedId: string = useId();
    const titleId: string = `${generatedId}-title`;
    const gridId: string = `${generatedId}-grid`;
    const gridRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const focusPendingRef: RefObject<boolean> = useRef<boolean>(false);
    const [selectedValue, setSelectedValue]: readonly [string, (next: string) => void] =
        useControllableState<string>({
            value,
            defaultValue,
            onChange,
        });
    const selectedDate: CalendarDate | null = useMemo<CalendarDate | null>(
        () => parseIsoDate(selectedValue),
        [selectedValue],
    );
    const minimumDate: CalendarDate | null = useMemo<CalendarDate | null>(
        () => (min === (void 0) ? null : parseIsoDate(min)),
        [min],
    );
    const maximumDate: CalendarDate | null = useMemo<CalendarDate | null>(
        () => (max === (void 0) ? null : parseIsoDate(max)),
        [max],
    );
    const todayDate: CalendarDate = useMemo<CalendarDate>(
        () => parseIsoDate(today ?? "") ?? toCalendarDate(new Date()),
        [today],
    );
    const formatters: CalendarFormatters = useMemo<CalendarFormatters>(
        () => createFormatters(locale),
        [locale],
    );
    const safeFirstDayOfWeek: number = Number.isFinite(firstDayOfWeek)
        ? ((Math.floor(firstDayOfWeek) % DaysPerWeek) + DaysPerWeek) % DaysPerWeek
        : DefaultFirstDayOfWeek;
    const selectedKey: string = selectedDate === null ? "" : toIsoDate(selectedDate);
    const initialDate: CalendarDate = selectedDate ?? clampCalendarDate(todayDate, minimumDate, maximumDate);
    const [navigation, setNavigation]: [CalendarNavigation, (next: CalendarNavigation) => void] =
        useState<CalendarNavigation>({
            activeDate: initialDate,
            selectedKey: selectedKey,
        });
    const followedDate: CalendarDate | null =
        selectedDate !== null && selectedKey !== navigation.selectedKey ? selectedDate : null;
    const activeDate: CalendarDate = followedDate ?? navigation.activeDate;
    const activeKey: string = toIsoDate(activeDate);
    const visibleYear: number = activeDate.year;
    const visibleMonth: number = activeDate.month;
    const weeks: CalendarWeek[] = useMemo<CalendarWeek[]>(
        () => buildMonthWeeks(visibleYear, visibleMonth, safeFirstDayOfWeek, showAdjacentDays),
        [visibleYear, visibleMonth, safeFirstDayOfWeek, showAdjacentDays],
    );
    const weekdays: CalendarWeekday[] = useMemo<CalendarWeekday[]>(
        () => buildWeekdays(safeFirstDayOfWeek, formatters, weekdayLabels ?? null),
        [safeFirstDayOfWeek, formatters, weekdayLabels],
    );
    const monthTitle: string = useMemo<string>(() => {
        const override: string | null = monthLabels?.[visibleMonth - 1] ?? null;

        if (override !== null && override.length > 0) {
            return `${override} ${visibleYear}`;
        }

        return formatters.month.format(createLocalDate(visibleYear, visibleMonth, 1));
    }, [formatters, monthLabels, visibleMonth, visibleYear]);
    const isControlled: boolean = value !== (void 0);
    const selectionBlocked: boolean = disabled || readOnly || (isControlled && onChange === (void 0));
    const canGoPrevious: boolean =
        !disabled &&
        visibleYear > MinimumYear &&
        (minimumDate === null || compareCalendarDates(startOfMonth(activeDate), minimumDate) > 0);
    const canGoNext: boolean =
        !disabled &&
        visibleYear < MaximumYear &&
        (maximumDate === null || compareCalendarDates(endOfMonth(activeDate), maximumDate) < 0);

    useEffect((): void => {
        if (!focusPendingRef.current) {
            return;
        }

        focusPendingRef.current = false;

        const grid: HTMLDivElement | null = gridRef.current;

        if (grid === null) {
            return;
        }

        const target: HTMLElement | null = grid.querySelector<HTMLElement>(`[data-date="${activeKey}"]`);

        target?.focus({ preventScroll: true });
    }, [activeKey]);

    /**
     * Moves the roving focus and visible month without changing the selected value.
     * @param date - Day that should own the tab stop.
     * @example
     * moveToDate({ year: 2026, month: 10, day: 21 });
     * @returns Nothing.
     */
    const moveToDate: (date: CalendarDate) => void = (date: CalendarDate): void => {
        if (disabled || sameCalendarDate(date, activeDate)) {
            return;
        }

        focusPendingRef.current = true;
        setNavigation({ activeDate: date, selectedKey });
    };

    /**
     * Selects a day when the current state allows it, moving the view first.
     * @param date - Day to select.
     * @example
     * requestSelection({ year: 2026, month: 10, day: 21 });
     * @returns Nothing.
     */
    const requestSelection: (date: CalendarDate) => void = (date: CalendarDate): void => {
        moveToDate(date);

        if (selectionBlocked || isDateOutOfRange(date, minimumDate, maximumDate)) {
            return;
        }

        const nextKey: string = toIsoDate(date);

        if (nextKey !== selectedKey) {
            setSelectedValue(nextKey);
        }
    };

    /**
     * Moves the active day into a neighbouring month while keeping the current selection.
     * @param amount - Months to add; use a negative value to move backwards.
     * @example
     * changeMonth(1);
     * @returns Nothing.
     */
    const changeMonth: (amount: number) => void = (amount: number): void => {
        if (disabled) {
            return;
        }

        const nextDate: CalendarDate = clampCalendarDate(shiftMonths(activeDate, amount), minimumDate, maximumDate);

        if (sameCalendarDate(nextDate, activeDate)) {
            return;
        }

        setNavigation({ activeDate: nextDate, selectedKey });
    };

    /**
     * Keeps the roving tab stop aligned with pointer or assistive focus inside the month.
     * @param date - Day that received focus.
     * @example
     * handleDayFocus({ year: 2026, month: 10, day: 21 });
     * @returns Nothing.
     */
    const handleDayFocus: (date: CalendarDate) => void = (date: CalendarDate): void => {
        if (date.year !== activeDate.year || date.month !== activeDate.month) {
            return;
        }

        if (sameCalendarDate(date, activeDate)) {
            return;
        }

        setNavigation({ activeDate: date, selectedKey });
    };

    /**
     * Handles the APG date-grid keyboard map.
     * @param event - Keyboard event bubbled from a day cell.
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
            requestSelection(activeDate);
            return;
        }

        let target: CalendarDate | null = null;

        switch (event.key) {
            case "ArrowLeft":
                target = shiftDays(activeDate, -1);
                break;
            case "ArrowRight":
                target = shiftDays(activeDate, 1);
                break;
            case "ArrowUp":
                target = shiftDays(activeDate, -DaysPerWeek);
                break;
            case "ArrowDown":
                target = shiftDays(activeDate, DaysPerWeek);
                break;
            case "Home":
                target = startOfWeek(activeDate, safeFirstDayOfWeek);
                break;
            case "End":
                target = endOfWeek(activeDate, safeFirstDayOfWeek);
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

        if (target === null) {
            return;
        }

        event.preventDefault();
        moveToDate(clampCalendarDate(target, minimumDate, maximumDate));
    };

    return (
        <div
            ref={ref}
            className={cx("calendar", className)}
            role={role ?? "group"}
            aria-label={ariaLabelAttribute ?? resolvedLabel}
            aria-disabled={disabled ? "true" : (void 0)}
            data-disabled={disabled ? "true" : "false"}
            data-readonly={readOnly ? "true" : "false"}
            {...rest}
        >
            <div className="calendar__header">
                <button
                    type="button"
                    className="calendar__nav"
                    aria-label={resolvedPreviousMonthLabel}
                    aria-controls={gridId}
                    disabled={!canGoPrevious}
                    onClick={(): void => {
                        changeMonth(-1);
                    }}
                >
                    <svg
                        className="calendar__chevron"
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <path
                            d="M15 18l-6-6 6-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
                <div id={titleId} className="calendar__title" aria-live="polite" aria-atomic="true">
                    {monthTitle}
                </div>
                <button
                    type="button"
                    className="calendar__nav"
                    aria-label={resolvedNextMonthLabel}
                    aria-controls={gridId}
                    disabled={!canGoNext}
                    onClick={(): void => {
                        changeMonth(1);
                    }}
                >
                    <svg
                        className="calendar__chevron"
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <path
                            d="M9 18l6-6-6-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>

            <div
                ref={gridRef}
                id={gridId}
                className="calendar__grid"
                role="grid"
                aria-labelledby={titleId}
                aria-colcount={DaysPerWeek}
                aria-rowcount={weeks.length + 1}
                aria-readonly={readOnly ? "true" : (void 0)}
                aria-disabled={disabled ? "true" : (void 0)}
                onKeyDown={handleGridKeyDown}
            >
                <div role="row" className="calendar__week calendar__week--header" aria-rowindex={1}>
                    {weekdays.map((weekday: CalendarWeekday): ReactNode => (
                        <div
                            key={weekday.weekday}
                            role="columnheader"
                            className="calendar__weekday"
                            aria-label={weekday.longLabel}
                        >
                            {weekday.shortLabel}
                        </div>
                    ))}
                </div>
                {weeks.map(
                    (week: CalendarWeek, weekIndex: number): ReactNode => (
                        <div
                            key={`calendar-week-${weekIndex}`}
                            role="row"
                            className="calendar__week"
                            aria-rowindex={weekIndex + 2}
                        >
                            {week.map(
                                (date: CalendarDate | null, cellIndex: number): ReactNode => {
                                    if (date === null) {
                                        return (
                                            <div
                                                key={`calendar-blank-${weekIndex}-${cellIndex}`}
                                                role="gridcell"
                                                className="calendar__day calendar__day--blank"
                                                aria-hidden="true"
                                            />
                                        );
                                    }

                                    const iso: string = toIsoDate(date);
                                    const isOutsideMonth: boolean =
                                        date.year !== visibleYear || date.month !== visibleMonth;
                                    const isSelected: boolean = iso === selectedKey;
                                    const isToday: boolean = sameCalendarDate(date, todayDate);
                                    const isDisabled: boolean =
                                        disabled || isDateOutOfRange(date, minimumDate, maximumDate);
                                    const isTabStop: boolean = !disabled && iso === activeKey;
                                    const dateLabel: string = formatters.day.format(
                                        createLocalDate(date.year, date.month, date.day),
                                    );
                                    const accessibleLabel: string =
                                        isToday && resolvedTodayLabel.length > 0
                                            ? `${dateLabel}, ${resolvedTodayLabel}`
                                            : dateLabel;
                                    const context: CalendarDayContext = {
                                        date,
                                        iso,
                                        day: date.day,
                                        month: date.month,
                                        year: date.year,
                                        isSelected,
                                        isToday,
                                        isOutsideMonth,
                                        isDisabled,
                                        isTabStop,
                                    };

                                    return (
                                        <div
                                            key={iso}
                                            role="gridcell"
                                            className={cx(
                                                "calendar__day",
                                                isOutsideMonth && "calendar__day--outside",
                                                isToday && "calendar__day--today",
                                                isSelected && "calendar__day--selected",
                                                isDisabled && "calendar__day--disabled",
                                            )}
                                            tabIndex={isTabStop ? 0 : -1}
                                            aria-label={accessibleLabel}
                                            aria-selected={isSelected}
                                            aria-current={isToday ? "date" : (void 0)}
                                            aria-disabled={isDisabled ? "true" : (void 0)}
                                            data-date={iso}
                                            onClick={(): void => {
                                                requestSelection(date);
                                            }}
                                            onFocus={(): void => {
                                                handleDayFocus(date);
                                            }}
                                        >
                                            {renderDay === (void 0) ? (
                                                <span className="calendar__day-number">{date.day}</span>
                                            ) : (
                                                renderDay(context)
                                            )}
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    ),
                )}
            </div>
        </div>
    );
};

export default Calendar;
