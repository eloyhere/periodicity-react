import {
    useId,
    useRef,
    useState,
    type ChangeEvent,
    type FC,
    type ReactNode,
    type RefObject,
} from "react";
import Icon from "../../icon/Icon";
import Popover from "../../popover/Popover";
import Surface from "../../surface/Surface";
import Button from "../../button/Button";
import PickerField from "../shared/PickerField";
import "./DateTimePicker.css";

interface DateTimeParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
}

/**
 * Props for the input-friendly date-time picker.
 * Type: interface.
 * Fields: value, onChange, label, hint, error, disabled, id, className, step.
 * @example
 * <DateTimePicker label="Starts at" value={value} onChange={setValue} />
 */
export interface DateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
    step?: number;
}

const pad: (value: number) => string = (value: number): string =>
    `${value}`.padStart(2, "0");

const daysInMonth: (year: number, month: number) => number = (
    year: number,
    month: number,
): number => new Date(year, month, 0).getDate();

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
 * Renders a custom date-time picker whose year and month are editable inputs.
 * @param props - Value, label, and change handler.
 * @example
 * <DateTimePicker label="Starts at" value="2026-10-20T09:30" onChange={setValue} />
 * @returns A date-time picker.
 */
const DateTimePicker: FC<DateTimePickerProps> = ({
    value,
    onChange,
    label,
    hint,
    error,
    disabled = false,
    id,
    className = "",
}: DateTimePickerProps) => {
    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const anchorRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
    const [open, setOpen]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const parts: DateTimeParts = parseDateTime(value);

    const commit: (next: Partial<DateTimeParts>) => void = (
        next: Partial<DateTimeParts>,
    ): void => {
        const year: number = Math.min(2100, Math.max(1900, next.year ?? parts.year));
        const month: number = Math.min(12, Math.max(1, next.month ?? parts.month));
        const day: number = Math.min(
            daysInMonth(year, month),
            Math.max(1, next.day ?? parts.day),
        );
        const hour: number = Math.min(23, Math.max(0, next.hour ?? parts.hour));
        const minute: number = Math.min(59, Math.max(0, next.minute ?? parts.minute));

        onChange(toValue({ year, month, day, hour, minute }));
    };

    const firstWeekday: number = new Date(parts.year, parts.month - 1, 1).getDay();
    const dayCount: number = daysInMonth(parts.year, parts.month);
    const cells: Array<number | null> = [
        ...Array.from({ length: firstWeekday }, (): null => null),
        ...Array.from(
            { length: dayCount },
            (value: unknown, index: number): number => {
                void value;
                return index + 1;
            },
        ),
    ];

    const displayValue: string =
        value.length === 0
            ? "Select date and time"
            : `${parts.year}/${pad(parts.month)}/${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`;

    return (
        <span ref={anchorRef} className={`date-time-picker ${className}`.trim()}>
            <PickerField
                label={label}
                hint={hint}
                error={error}
                htmlFor={inputId}
                disabled={disabled}
            >
                <Surface
                    className="date-time-picker__ripple"
                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                    disabled={disabled}
                >
                    <button
                        id={inputId}
                        type="button"
                        className="date-time-picker__trigger"
                        disabled={disabled}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        onClick={(): void => setOpen(!open)}
                    >
                        <Icon name="Calendar" size={16} />
                        {displayValue}
                    </button>
                </Surface>
            </PickerField>

            <Popover
                open={open}
                onOpenChange={setOpen}
                anchorRef={anchorRef}
                placement="bottom-start"
                ariaLabel={`${label} picker`}
            >
                <div className="date-time-picker__panel">
                    <div className="date-time-picker__header">
                        <label>
                            Year
                            <input
                                type="number"
                                min={1900}
                                max={2100}
                                value={parts.year}
                                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                    commit({ year: Number(event.target.value) })
                                }
                            />
                        </label>
                        <label>
                            Month
                            <input
                                type="number"
                                min={1}
                                max={12}
                                value={parts.month}
                                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                    commit({ month: Number(event.target.value) })
                                }
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

                    <div className="date-time-picker__days" role="grid" aria-label="Days">
                        {cells.map(
                            (day: number | null, index: number): ReactNode =>
                                day === null ? (
                                    <span
                                        key={`empty-${index}`}
                                        className="date-time-picker__blank"
                                    />
                                ) : (
                                    <button
                                        key={day}
                                        type="button"
                                        className={
                                            day === parts.day
                                                ? "date-time-picker__day date-time-picker__day--selected"
                                                : "date-time-picker__day"
                                        }
                                        aria-pressed={day === parts.day}
                                        onClick={(): void => commit({ day })}
                                    >
                                        {day}
                                    </button>
                                ),
                        )}
                    </div>

                    <div className="date-time-picker__time">
                        <label>
                            Hour
                            <input
                                type="number"
                                min={0}
                                max={23}
                                value={parts.hour}
                                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                    commit({ hour: Number(event.target.value) })
                                }
                            />
                        </label>
                        <label>
                            Minute
                            <input
                                type="number"
                                min={0}
                                max={59}
                                step={5}
                                value={parts.minute}
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
                            onClick={(): void => {
                                onChange("");
                                setOpen(false);
                            }}
                        >
                            Clear
                        </Button>
                        <Button
                            size="sm"
                            onClick={(): void => {
                                commit({});
                                setOpen(false);
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
