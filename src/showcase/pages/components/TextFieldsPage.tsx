import {
    useState,
    type ChangeEvent,
    type Dispatch,
    type FC,
    type SetStateAction,
} from "react";
import { Columns, Stack } from "../../../arrange/layout";
import {
    Combobox,
    CompleteInput,
    EmailInput,
    Select,
    TelephoneInput,
    TextArea,
    TextInput,
    VirtualSelect,
} from "../../../component";
import Icon from "../../../component/icon/Icon";
import Demo, { DemoGroup } from "../../Demo";
import {
    comboboxOptions,
    completeOptions,
    selectOptions,
    virtualComboboxOptions,
    virtualSelectOptions,
} from "../../samples";

const variantsCode: string = `<div className="showcase__field-grid">
    <TextInput
        label="Project"
        variant="outline"
        placeholder="e.g. Morning pages"
        hint="Outline · resting label"
        leading={<Icon name="Search" size={16} />}
    />
    <TextInput
        label="Ritual name"
        variant="outline"
        value={textValue}
        onChange={(event) => setTextValue(event.target.value)}
        hint="Outline · floating label"
        leading={<Icon name="Plan" size={16} />}
    />
    <TextInput
        label="Email"
        variant="fill"
        type="email"
        placeholder="mira@example.com"
        hint="Fill · bottom line"
        leading={<Icon name="Mail" size={16} />}
    />
    <TextInput label="Standard" variant="standard" placeholder="Type here" hint="Standard · underline only" />
</div>`;

const completeCode: string = `<CompleteInput
    label="Autocomplete"
    value={completeValue}
    options={completeOptions}
    onChange={setCompleteValue}
    hint="Free text with suggestions"
/>

<EmailInput
    label="Email"
    value={emailValue}
    onChange={(event) => setEmailValue(event.target.value)}
    hint="Email keyboard and validation"
/>

<TelephoneInput
    label="Telephone"
    value={telephoneValue}
    onChange={(event) => setTelephoneValue(event.target.value)}
    hint="Tel keyboard"
/>`;

const notesCode: string = `<Columns count={2} gap="lg">
    <TextArea
        label="Notes"
        value={areaValue}
        onChange={(event) => setAreaValue(event.target.value)}
        rows={3}
        maxLength={120}
        showCount
        hint="Outline textarea"
    />
    <Stack gap="md">
        <Select
            label="Cadence"
            value={selectValue}
            options={selectOptions}
            onChange={setSelectValue}
            hint="Dropdown with listbox semantics"
        />
        <Combobox
            label="Ritual"
            value={comboboxValue}
            options={comboboxOptions}
            onChange={setComboboxValue}
            hint="Filter and select"
        />
    </Stack>
</Columns>`;

const virtualCode: string = `<Columns count={2} gap="lg">
    <VirtualSelect
        label="Virtual select"
        value={virtualSelectValue}
        options={virtualSelectOptions}
        onChange={setVirtualSelectValue}
        listHeight={240}
        hint="160 options, windowed"
    />
    <Combobox
        label="Virtual combobox"
        value={virtualComboboxValue}
        options={virtualComboboxOptions}
        onChange={setVirtualComboboxValue}
        virtual
        listHeight={240}
        hint="160 options, windowed"
    />
</Columns>`;

const sizesCode: string = `<TextInput size="sm" label="Small" variant="outline" hint="sm" />
<TextInput size="md" label="Medium" variant="outline" hint="md" />
<TextInput size="lg" label="Large" variant="outline" hint="lg" />`;

const statesCode: string = `<TextInput
    label="Invalid"
    variant="outline"
    defaultValue="not-an-email"
    error="Enter a valid email address."
/>
<TextInput label="Disabled" variant="outline" defaultValue="Locked" disabled />
<TextInput
    label="With trailing action"
    variant="fill"
    trailing={<Icon name="Search" size={16} />}
/>`;

const textareaCode: string = `<TextArea label="Filled textarea" variant="fill" rows={3} hint="Fill variant" />
<TextArea label="Standard textarea" variant="standard" rows={3} hint="Standard variant" />`;

const selectVariantsCode: string = `<Select
    label="Fill"
    variant="fill"
    value={selectValue}
    options={selectOptions}
    onChange={setSelectValue}
/>
<Select
    label="Standard"
    variant="standard"
    value={selectValue}
    options={selectOptions}
    onChange={setSelectValue}
/>
<Select
    label="Small"
    size="sm"
    value={selectValue}
    options={selectOptions}
    onChange={setSelectValue}
/>
<Select
    label="Disabled"
    value={selectValue}
    options={selectOptions}
    onChange={setSelectValue}
    disabled
/>`;

const comboboxStatesCode: string = `<Combobox
    label="Loading"
    value={comboboxValue}
    options={comboboxOptions}
    onChange={setComboboxValue}
    loading
/>
<Combobox
    label="Disabled"
    value={comboboxValue}
    options={comboboxOptions}
    onChange={setComboboxValue}
    disabled
/>`;

/**
 * Documents text fields, selects, comboboxes, and their sizes and states.
 * @example
 * <TextFieldsPage />
 * @returns The Text fields entry.
 */
const TextFieldsPage: FC = () => {
    const [selectValue, setSelectValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("weekly");
    const [comboboxValue, setComboboxValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("design");
    const [virtualSelectValue, setVirtualSelectValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("option-0");
    const [virtualComboboxValue, setVirtualComboboxValue]: [
        string,
        Dispatch<SetStateAction<string>>,
    ] = useState<string>("option-0");
    const [textValue, setTextValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("The Long Now");
    const [areaValue, setAreaValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("Three pages, no editing.");
    const [completeValue, setCompleteValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("Design review");
    const [emailValue, setEmailValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("");
    const [telephoneValue, setTelephoneValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("");

    return (
        <>
            <Demo
                title="Field variants"
                description="Material outline, fill, and standard variants with resting or floating labels."
                code={variantsCode}
            >
                <div className="showcase__field-grid">
                    <TextInput
                        label="Project"
                        variant="outline"
                        placeholder="e.g. Morning pages"
                        hint="Outline · resting label"
                        leading={<Icon name="Search" size={16} />}
                    />
                    <TextInput
                        label="Ritual name"
                        variant="outline"
                        value={textValue}
                        onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                            setTextValue(event.target.value)
                        }
                        hint="Outline · floating label"
                        leading={<Icon name="Plan" size={16} />}
                    />
                    <TextInput
                        label="Email"
                        variant="fill"
                        type="email"
                        placeholder="mira@example.com"
                        hint="Fill · bottom line"
                        leading={<Icon name="Mail" size={16} />}
                    />
                    <TextInput
                        label="Standard"
                        variant="standard"
                        placeholder="Type here"
                        hint="Standard · underline only"
                    />
                </div>
            </Demo>

            <Demo
                title="Autocomplete and contact fields"
                description="Specialised inputs for free text with suggestions, email, and telephone numbers."
                code={completeCode}
            >
                <div className="showcase__field-grid">
                    <CompleteInput
                        label="Autocomplete"
                        value={completeValue}
                        options={completeOptions}
                        onChange={setCompleteValue}
                        hint="Free text with suggestions"
                    />
                    <EmailInput
                        label="Email"
                        value={emailValue}
                        onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                            setEmailValue(event.target.value)
                        }
                        hint="Email keyboard and validation"
                    />
                    <TelephoneInput
                        label="Telephone"
                        value={telephoneValue}
                        onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                            setTelephoneValue(event.target.value)
                        }
                        hint="Tel keyboard"
                    />
                </div>
            </Demo>

            <Demo
                title="Notes and selects"
                description="A textarea pairs with a select and a filterable combobox."
                code={notesCode}
            >
                <Columns className="showcase__fields" count={2} gap="lg">
                    <TextArea
                        label="Notes"
                        value={areaValue}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>): void =>
                            setAreaValue(event.target.value)
                        }
                        rows={3}
                        maxLength={120}
                        showCount
                        hint="Outline textarea"
                    />
                    <Stack gap="md">
                        <Select
                            label="Cadence"
                            value={selectValue}
                            options={selectOptions}
                            onChange={setSelectValue}
                            hint="Dropdown with listbox semantics"
                        />
                        <Combobox
                            label="Ritual"
                            value={comboboxValue}
                            options={comboboxOptions}
                            onChange={setComboboxValue}
                            hint="Filter and select"
                        />
                    </Stack>
                </Columns>
            </Demo>

            <Demo
                title="Virtual selects"
                description="A hundred and sixty options stay fast because only the visible rows are rendered."
                code={virtualCode}
            >
                <Columns className="showcase__fields" count={2} gap="lg">
                    <VirtualSelect
                        label="Virtual select"
                        value={virtualSelectValue}
                        options={virtualSelectOptions}
                        onChange={setVirtualSelectValue}
                        listHeight={240}
                        hint="160 options, windowed"
                    />
                    <Combobox
                        label="Virtual combobox"
                        value={virtualComboboxValue}
                        options={virtualComboboxOptions}
                        onChange={setVirtualComboboxValue}
                        virtual
                        listHeight={240}
                        hint="160 options, windowed"
                    />
                </Columns>
            </Demo>

            <Demo title="Sizes" code={sizesCode}>
                <DemoGroup label="Sizes">
                    <TextInput size="sm" label="Small" variant="outline" hint="sm" />
                    <TextInput size="md" label="Medium" variant="outline" hint="md" />
                    <TextInput size="lg" label="Large" variant="outline" hint="lg" />
                </DemoGroup>
            </Demo>

            <Demo title="States" description="Error, disabled, and trailing-action fields." code={statesCode}>
                <DemoGroup label="States">
                    <TextInput
                        label="Invalid"
                        variant="outline"
                        defaultValue="not-an-email"
                        error="Enter a valid email address."
                    />
                    <TextInput label="Disabled" variant="outline" defaultValue="Locked" disabled />
                    <TextInput
                        label="With trailing action"
                        variant="fill"
                        trailing={<Icon name="Search" size={16} />}
                    />
                </DemoGroup>
            </Demo>

            <Demo title="Textarea variants" code={textareaCode}>
                <Columns className="showcase__fields" count={2} gap="lg">
                    <TextArea label="Filled textarea" variant="fill" rows={3} hint="Fill variant" />
                    <TextArea
                        label="Standard textarea"
                        variant="standard"
                        rows={3}
                        hint="Standard variant"
                    />
                </Columns>
            </Demo>

            <Demo title="Select variants and sizes" code={selectVariantsCode}>
                <DemoGroup label="Select variants and sizes">
                    <Select
                        label="Fill"
                        variant="fill"
                        value={selectValue}
                        options={selectOptions}
                        onChange={setSelectValue}
                    />
                    <Select
                        label="Standard"
                        variant="standard"
                        value={selectValue}
                        options={selectOptions}
                        onChange={setSelectValue}
                    />
                    <Select
                        label="Small"
                        size="sm"
                        value={selectValue}
                        options={selectOptions}
                        onChange={setSelectValue}
                    />
                    <Select
                        label="Disabled"
                        value={selectValue}
                        options={selectOptions}
                        onChange={setSelectValue}
                        disabled
                    />
                </DemoGroup>
            </Demo>

            <Demo title="Combobox states" code={comboboxStatesCode}>
                <DemoGroup label="Combobox states">
                    <Combobox
                        label="Loading"
                        value={comboboxValue}
                        options={comboboxOptions}
                        onChange={setComboboxValue}
                        loading
                    />
                    <Combobox
                        label="Disabled"
                        value={comboboxValue}
                        options={comboboxOptions}
                        onChange={setComboboxValue}
                        disabled
                    />
                </DemoGroup>
            </Demo>
        </>
    );
};

export default TextFieldsPage;
