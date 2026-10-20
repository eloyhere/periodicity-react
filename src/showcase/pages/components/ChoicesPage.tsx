import {
    useState,
    type Dispatch,
    type FC,
    type SetStateAction,
} from "react";
import { Columns, Stack } from "../../../arrange/layout";
import {
    Checkbox,
    Field,
    FieldGroup,
    NumberInput,
    Radio,
    RadioGroup,
    Range,
    Switch,
} from "../../../component";
import Demo, { DemoGroup } from "../../Demo";

const togglesCode: string = `<Checkbox
    checked={checked}
    onCheckedChange={setChecked}
    label="Remind me"
    description="A quiet nudge ten minutes before."
/>
<Checkbox
    checked={false}
    indeterminate
    label="Select all rituals"
    description="Indeterminate state"
/>
<Switch
    checked={switchOn}
    onChange={setSwitchOn}
    label="Daily reminder"
    description="Visible label and track."
/>`;

const radioCode: string = `<RadioGroup
    label="Rhythm"
    value={radioValue}
    onValueChange={setRadioValue}
    hint="One cadence at a time."
>
    <Radio value="daily" label="Daily" />
    <Radio value="weekly" label="Weekly" description="A longer loop" />
    <Radio value="monthly" label="Monthly" />
</RadioGroup>
<Range
    label="Focus minutes"
    value={rangeValue}
    min={0}
    max={120}
    step={5}
    onChange={setRangeValue}
    format={(value) => \`\${value} min\`}
/>
<NumberInput
    label="Sessions"
    value={numberValue}
    onChange={setNumberValue}
    min={0}
    max={12}
    hint="Arrow keys step the value."
/>`;

const wrappersCode: string = `<Field
    label="Display name"
    hint="Field wraps any native control."
    htmlFor="showcase-display-name"
>
    <input
        id="showcase-display-name"
        className="showcase__native-input"
        defaultValue="Mira Chen"
    />
</Field>
<FieldGroup legend="Notifications" hint="FieldGroup groups related choices.">
    <Checkbox defaultChecked label="Daily summary" />
    <Checkbox label="Weekly review" />
</FieldGroup>`;

const checkboxStatesCode: string = `<Checkbox size="sm" defaultChecked label="Small" />
<Checkbox size="md" defaultChecked label="Medium" />
<Checkbox size="lg" defaultChecked label="Large" />
<Checkbox label="Invalid" error="Choose at least one." />
<Checkbox label="Disabled" disabled />`;

const radioOrientationsCode: string = `<RadioGroup label="Horizontal" orientation="horizontal" defaultValue="a">
    <Radio value="a" label="Alpha" />
    <Radio value="b" label="Beta" />
    <Radio value="c" label="Gamma" />
</RadioGroup>
<RadioGroup label="Invalid" error="Select one option." defaultValue="a">
    <Radio value="a" label="Option" />
    <Radio value="b" label="Other" />
</RadioGroup>
<RadioGroup label="Disabled" defaultValue="a" disabled>
    <Radio value="a" label="Locked" />
    <Radio value="b" label="Also locked" />
</RadioGroup>`;

const rangeStatesCode: string = `<Range label="Disabled range" value={rangeValue} onChange={setRangeValue} disabled />
<Range
    label="Invalid range"
    value={rangeValue}
    onChange={setRangeValue}
    error="Value is outside the allowed band."
/>`;

const switchStatesCode: string = `<Switch size="sm" checked={switchOn} onChange={setSwitchOn} label="Small" />
<Switch size="md" checked={switchOn} onChange={setSwitchOn} label="Medium" />
<Switch size="lg" checked={switchOn} onChange={setSwitchOn} label="Large" />
<Switch checked={switchOn} onChange={setSwitchOn} label="Disabled" disabled />`;

/**
 * Documents checkbox, radio, range, number, and switch controls.
 * @example
 * <ChoicesPage />
 * @returns The Choices entry.
 */
const ChoicesPage: FC = () => {
    const [checked, setChecked]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(true);
    const [radioValue, setRadioValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("daily");
    const [rangeValue, setRangeValue]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(64);
    const [numberValue, setNumberValue]: [number | null, Dispatch<SetStateAction<number | null>>] =
        useState<number | null>(12);
    const [switchOn, setSwitchOn]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(true);

    return (
        <>
            <Demo
                title="Checkbox and switch"
                description="Choice controls carry their own label, description, and indeterminate state."
                code={togglesCode}
            >
                <Stack gap="md">
                    <Checkbox
                        checked={checked}
                        onCheckedChange={setChecked}
                        label="Remind me"
                        description="A quiet nudge ten minutes before."
                    />
                    <Checkbox
                        checked={false}
                        indeterminate
                        label="Select all rituals"
                        description="Indeterminate state"
                    />
                    <Switch
                        checked={switchOn}
                        onChange={setSwitchOn}
                        label="Daily reminder"
                        description="Visible label and track."
                    />
                </Stack>
            </Demo>

            <Demo
                title="Radio, range, and number"
                description="A single-choice group, a stepped range, and a numeric field."
                code={radioCode}
            >
                <Stack gap="md">
                    <RadioGroup
                        label="Rhythm"
                        value={radioValue}
                        onValueChange={setRadioValue}
                        hint="One cadence at a time."
                    >
                        <Radio value="daily" label="Daily" />
                        <Radio value="weekly" label="Weekly" description="A longer loop" />
                        <Radio value="monthly" label="Monthly" />
                    </RadioGroup>
                    <Range
                        label="Focus minutes"
                        value={rangeValue}
                        min={0}
                        max={120}
                        step={5}
                        onChange={setRangeValue}
                        format={(value: number): string => `${value} min`}
                    />
                    <NumberInput
                        label="Sessions"
                        value={numberValue}
                        onChange={setNumberValue}
                        min={0}
                        max={12}
                        hint="Arrow keys step the value."
                    />
                </Stack>
            </Demo>

            <Demo
                title="Field wrappers"
                description="Field and FieldGroup wrap native controls and related choices."
                code={wrappersCode}
            >
                <Columns className="showcase__fields" count={2} gap="lg">
                    <Field
                        label="Display name"
                        hint="Field wraps any native control."
                        htmlFor="showcase-display-name"
                    >
                        <input
                            id="showcase-display-name"
                            className="showcase__native-input"
                            defaultValue="Mira Chen"
                        />
                    </Field>
                    <FieldGroup legend="Notifications" hint="FieldGroup groups related choices.">
                        <Checkbox defaultChecked label="Daily summary" />
                        <Checkbox label="Weekly review" />
                    </FieldGroup>
                </Columns>
            </Demo>

            <Demo title="Checkbox sizes and states" code={checkboxStatesCode}>
                <DemoGroup label="Checkbox sizes and states">
                    <Checkbox size="sm" defaultChecked label="Small" />
                    <Checkbox size="md" defaultChecked label="Medium" />
                    <Checkbox size="lg" defaultChecked label="Large" />
                    <Checkbox label="Invalid" error="Choose at least one." />
                    <Checkbox label="Disabled" disabled />
                </DemoGroup>
            </Demo>

            <Demo title="Radio orientations" code={radioOrientationsCode}>
                <DemoGroup label="Radio orientations">
                    <RadioGroup label="Horizontal" orientation="horizontal" defaultValue="a">
                        <Radio value="a" label="Alpha" />
                        <Radio value="b" label="Beta" />
                        <Radio value="c" label="Gamma" />
                    </RadioGroup>
                    <RadioGroup label="Invalid" error="Select one option." defaultValue="a">
                        <Radio value="a" label="Option" />
                        <Radio value="b" label="Other" />
                    </RadioGroup>
                    <RadioGroup label="Disabled" defaultValue="a" disabled>
                        <Radio value="a" label="Locked" />
                        <Radio value="b" label="Also locked" />
                    </RadioGroup>
                </DemoGroup>
            </Demo>

            <Demo title="Range states" code={rangeStatesCode}>
                <DemoGroup label="Range states">
                    <Range label="Disabled range" value={rangeValue} onChange={setRangeValue} disabled />
                    <Range
                        label="Invalid range"
                        value={rangeValue}
                        onChange={setRangeValue}
                        error="Value is outside the allowed band."
                    />
                </DemoGroup>
            </Demo>

            <Demo title="Switch sizes and states" code={switchStatesCode}>
                <DemoGroup label="Switch sizes and states">
                    <Switch size="sm" checked={switchOn} onChange={setSwitchOn} label="Small" />
                    <Switch size="md" checked={switchOn} onChange={setSwitchOn} label="Medium" />
                    <Switch size="lg" checked={switchOn} onChange={setSwitchOn} label="Large" />
                    <Switch checked={switchOn} onChange={setSwitchOn} label="Disabled" disabled />
                </DemoGroup>
            </Demo>
        </>
    );
};

export default ChoicesPage;
