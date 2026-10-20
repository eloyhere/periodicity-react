import {
    useState,
    type Dispatch,
    type FC,
    type SetStateAction,
} from "react";
import {
    Calendar,
    ColourPicker,
    CyclePicker,
    DateTimePicker,
    NumberPicker,
    TimePicker,
    VariantPicker,
} from "../../../component";
import Demo from "../../Demo";
import { variantOptions } from "../../samples";

const pickersCode: string = `<div className="showcase__field-grid">
    <TimePicker label="Start time" value={timeValue} onChange={setTimeValue} hint="24-hour clock" />
    <DateTimePicker
        label="Starts at"
        value={dateTimeValue}
        onChange={setDateTimeValue}
        hint="Date and time"
    />
    <NumberPicker
        label="Sessions"
        value={numberPickerValue}
        onChange={setNumberPickerValue}
        min={1}
        max={30}
        hint="Android number wheel"
    />
    <CyclePicker
        label="Cycle"
        items={["Breath", "Focus", "Rest", "Review"]}
        value={cycleValue}
        onChange={setCycleValue}
        hint="Looping picker with typed autocomplete"
    />
    <ColourPicker
        label="Accent colour"
        value={colourValue}
        onChange={setColourValue}
        hint="Native colour input with presets"
    />
    <VariantPicker
        label="Variant"
        value={variantValue}
        variants={variantOptions}
        onChange={setVariantValue}
        hint="Radio-style variant chips"
    />
</div>`;

const calendarCode: string = `<Calendar
    label="Delivery date"
    value={calendarValue}
    onChange={setCalendarValue}
    min="2026-01-01"
    max="2026-12-31"
    locale="en-GB"
    firstDayOfWeek={1}
/>`;

/**
 * Documents time, date-time, number, colour, variant pickers, and the month calendar.
 * @example
 * <PickersPage />
 * @returns The Pickers entry.
 */
const PickersPage: FC = () => {
    const [timeValue, setTimeValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("09:30");
    const [dateTimeValue, setDateTimeValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("2026-10-20T09:30");
    const [numberPickerValue, setNumberPickerValue]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(12);
    const [cycleValue, setCycleValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("Focus");
    const [colourValue, setColourValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("#1976d2");
    const [variantValue, setVariantValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("blue");
    const [calendarValue, setCalendarValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("2026-10-20");

    return (
        <>
            <Demo
                title="Pickers"
                description="Time, date-time, number, colour, and variant selection, all keyboard reachable."
                code={pickersCode}
            >
            <div className="showcase__field-grid">
                <TimePicker
                    label="Start time"
                    value={timeValue}
                    onChange={setTimeValue}
                    hint="24-hour clock"
                />
                <DateTimePicker
                    label="Starts at"
                    value={dateTimeValue}
                    onChange={setDateTimeValue}
                    hint="Date and time"
                />
                <NumberPicker
                    label="Sessions"
                    value={numberPickerValue}
                    onChange={setNumberPickerValue}
                    min={1}
                    max={30}
                    hint="Android number wheel"
                />
                <CyclePicker
                    label="Cycle"
                    items={["Breath", "Focus", "Rest", "Review"]}
                    value={cycleValue}
                    onChange={setCycleValue}
                    hint="Looping picker with typed autocomplete"
                />
                <ColourPicker
                    label="Accent colour"
                    value={colourValue}
                    onChange={setColourValue}
                    hint="Native colour input with presets"
                />
                <VariantPicker
                    label="Variant"
                    value={variantValue}
                    variants={variantOptions}
                    onChange={setVariantValue}
                    hint="Radio-style variant chips"
                />
            </div>
        </Demo>

            <Demo
                title="Calendar"
                description="A locale-aware month grid with arrow, Home/End, PageUp/PageDown, and Enter selection."
                code={calendarCode}
            >
                <Calendar
                    label="Delivery date"
                    value={calendarValue}
                    onChange={setCalendarValue}
                    min="2026-01-01"
                    max="2026-12-31"
                    locale="en-GB"
                    firstDayOfWeek={1}
                />
            </Demo>
        </>
    );
};

export default PickersPage;
