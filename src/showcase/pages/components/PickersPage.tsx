import {
    useState,
    type Dispatch,
    type FC,
    type SetStateAction,
} from "react";
import {
    AvatarPicker,
    Calendar,
    ColourPicker,
    CyclePicker,
    DateTimePicker,
    FilePicker,
    NumberPicker,
    PhotoPicker,
    Text,
    TimePicker,
    VariantPicker,
    type ImageSelection,
} from "../../../component";
import { useInternational, type InternationalContextValue } from "../../../international";
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
    label="Calendar"
    value={calendarValue}
    onChange={setCalendarValue}
    min="2026-01-01"
    max="2026-12-31"
    firstDayOfWeek={1}
/>`;

const filePickersCode: string = `<div className="showcase__field-grid">
    <FilePicker
        label="Attachment"
        accept={[".pdf", ".png", ".jpg"]}
        multiple
        onChange={(files) => log(files.map((file) => file.name).join(", "))}
    />
    <PhotoPicker
        label="Cover photo"
        onChange={(selection) => log("photo", selection.dataUrl, selection.cropped)}
    />
    <AvatarPicker
        label="Profile photo"
        name="Mira Chen"
        onChange={(selection) => log("avatar", selection.dataUrl, selection.cropped)}
    />
</div>`;

/**
 * Documents time, date-time, number, colour, variant, file, and image pickers,
 * plus the month calendar.
 * @example
 * <PickersPage />
 * @returns The Pickers entry.
 */
const PickersPage: FC = () => {
    const { t }: InternationalContextValue = useInternational();
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
    const [selectionSummary, setSelectionSummary]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("No selection yet");

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
                title="File and image pickers"
                description="A native file dialog, a cropped photo preview, and a circular avatar editor, each emitting change when the selection is confirmed."
                code={filePickersCode}
            >
                <div className="showcase__field-grid">
                    <FilePicker
                        label="Attachment"
                        accept={[".pdf", ".png", ".jpg"]}
                        multiple
                        hint="Any number of PDF or image files"
                        onChange={(files: File[]): void => {
                            setSelectionSummary(
                                files.map((file: File): string => file.name).join(", "),
                            );
                        }}
                    />
                    <PhotoPicker
                        label="Cover photo"
                        hint="Crop to a four by three cover"
                        onChange={(selection: ImageSelection): void => {
                            setSelectionSummary(
                                `${selection.cropped ? "Cropped" : "Original"} photo · ${selection.file.name}`,
                            );
                        }}
                    />
                    <AvatarPicker
                        label="Profile photo"
                        name="Mira Chen"
                        hint="Cropped to a square avatar"
                        onChange={(selection: ImageSelection): void => {
                            setSelectionSummary(
                                `${selection.cropped ? "Cropped" : "Original"} avatar · ${selection.file.name}`,
                            );
                        }}
                    />
                </div>
                <Text variant="body-sm" tone="muted" aria-live="polite">
                    {selectionSummary}
                </Text>
            </Demo>

            <Demo
                title="Calendar"
                description="A locale-aware month grid with arrow, Home/End, PageUp/PageDown, and Enter selection."
                code={calendarCode}
            >
                <Calendar
                    label={t("calendar")}
                    value={calendarValue}
                    onChange={setCalendarValue}
                    min="2026-01-01"
                    max="2026-12-31"
                    firstDayOfWeek={1}
                />
            </Demo>
        </>
    );
};

export default PickersPage;
