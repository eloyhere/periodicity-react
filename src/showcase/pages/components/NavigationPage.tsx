import {
    useState,
    type Dispatch,
    type FC,
    type SetStateAction,
} from "react";
import { Inline, Stack } from "../../../arrange/layout";
import {
    Accordion,
    Breadcrumbs,
    NavigationView,
    Pagination,
    Stepper,
    TabPanel,
    Tabs,
} from "../../../component";
import Text from "../../../component/text/Text";
import Demo, { DemoGroup } from "../../Demo";
import { accordionItems, breadcrumbItems, navigationItems, stepItems, tabItems } from "../../samples";

const breadcrumbsCode: string = `<Breadcrumbs items={breadcrumbItems} />

<Tabs items={tabItems} value={tabValue} onValueChange={setTabValue} variant="pill" />
<TabPanel value="today" activeValue={tabValue}>
    <Text variant="body">Today’s rhythm: three rituals, one deep block.</Text>
</TabPanel>
<TabPanel value="week" activeValue={tabValue}>
    <Text variant="body">This week: 82% consistency, six deep sessions.</Text>
</TabPanel>
<TabPanel value="month" activeValue={tabValue}>
    <Text variant="body">This month: the season is still forming.</Text>
</TabPanel>

<Tabs
    items={[
        { value: "line-overview", label: "Overview" },
        { value: "line-activity", label: "Activity" },
    ]}
    defaultValue="line-overview"
    variant="line"
/>
<Tabs
    items={[
        { value: "enclosed-one", label: "One" },
        { value: "enclosed-two", label: "Two" },
    ]}
    defaultValue="enclosed-one"
    variant="enclosed"
/>`;

const accordionCode: string = `<Accordion
    items={accordionItems}
    value={accordionValue}
    onValueChange={setAccordionValue}
/>

<Accordion
    items={[
        {
            value: "contained-a",
            title: "Contained accordion",
            content: "A flat Material container with a single divider.",
        },
        {
            value: "contained-b",
            title: "Second panel",
            content: "Content sits directly below its summary.",
        },
    ]}
    defaultValue={["contained-a"]}
    variant="contained"
/>`;

const paginationCode: string = `<Inline gap="lg" wrap justify="between">
    <Pagination page={page} pageCount={12} onPageChange={setPage} />
    <Stepper steps={stepItems} current={step} onStepClick={setStep} />
</Inline>`;

const tabSizesCode: string = `<Tabs
    size="sm"
    items={[
        { value: "small-a", label: "Small" },
        { value: "small-b", label: "Second" },
    ]}
    defaultValue="small-a"
    variant="line"
/>
<Tabs
    size="md"
    items={[
        { value: "medium-a", label: "Medium" },
        { value: "medium-b", label: "Second" },
    ]}
    defaultValue="medium-a"
    variant="line"
/>
<Tabs
    size="lg"
    items={[
        { value: "large-a", label: "Large" },
        { value: "large-b", label: "Second" },
    ]}
    defaultValue="large-a"
    variant="line"
/>`;

const multipleCode: string = `<Accordion
    multiple
    items={[
        { value: "multi-a", title: "First panel", content: "Multiple panels can stay open." },
        { value: "multi-b", title: "Second panel", content: "This one starts expanded too." },
        { value: "multi-c", title: "Third panel", content: "A third option for the demo." },
    ]}
    defaultValue={["multi-a", "multi-b"]}
/>`;

const compactCode: string = `<Pagination page={page} pageCount={12} onPageChange={setPage} size="sm" />
<Stepper steps={stepItems} current={step} onStepClick={setStep} orientation="vertical" />`;

const truncatedCode: string = `<Breadcrumbs
    maxItems={3}
    items={[
        { label: "Workspace", href: "#navigation" },
        { label: "Projects", href: "#navigation" },
        { label: "Periodicity", href: "#navigation" },
        { label: "Cycles", href: "#navigation" },
        { label: "Cycle 04" },
    ]}
/>`;

const navigationCode: string = `<NavigationView
    items={navigationItems}
    value={navValue}
    onValueChange={setNavValue}
    variant="rail"
    ariaLabel="Navigation rail"
/>
<NavigationView
    items={navigationItems}
    value={navValue}
    onValueChange={setNavValue}
    variant="bottom"
    ariaLabel="Bottom navigation demo"
/>`;

/**
 * Documents breadcrumbs, tabs, accordions, pagination, steppers, and navigation views.
 * @example
 * <NavigationPage />
 * @returns The Navigation entry.
 */
const NavigationPage: FC = () => {
    const [tabValue, setTabValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("today");
    const [accordionValue, setAccordionValue]: [string[], Dispatch<SetStateAction<string[]>>] =
        useState<string[]>(["rhythm"]);
    const [page, setPage]: [number, Dispatch<SetStateAction<number>>] = useState<number>(3);
    const [step, setStep]: [number, Dispatch<SetStateAction<number>>] = useState<number>(1);
    const [navValue, setNavValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("today");

    return (
        <>
            <Demo
                title="Breadcrumbs and tabs"
                description="Breadcrumbs give the route; pill, line, and enclosed tabs switch panels."
                code={breadcrumbsCode}
            >
                <Stack gap="lg">
                    <Breadcrumbs items={breadcrumbItems} />
                    <Tabs items={tabItems} value={tabValue} onValueChange={setTabValue} variant="pill" />
                    <TabPanel value="today" activeValue={tabValue}>
                        <Text variant="body">Today’s rhythm: three rituals, one deep block.</Text>
                    </TabPanel>
                    <TabPanel value="week" activeValue={tabValue}>
                        <Text variant="body">This week: 82% consistency, six deep sessions.</Text>
                    </TabPanel>
                    <TabPanel value="month" activeValue={tabValue}>
                        <Text variant="body">This month: the season is still forming.</Text>
                    </TabPanel>
                    <Tabs
                        items={[
                            { value: "line-overview", label: "Overview" },
                            { value: "line-activity", label: "Activity" },
                        ]}
                        defaultValue="line-overview"
                        variant="line"
                    />
                    <Tabs
                        items={[
                            { value: "enclosed-one", label: "One" },
                            { value: "enclosed-two", label: "Two" },
                        ]}
                        defaultValue="enclosed-one"
                        variant="enclosed"
                    />
                </Stack>
            </Demo>

            <Demo
                title="Accordion"
                description="Single and contained accordions with controlled and uncontrolled values."
                code={accordionCode}
            >
                <Stack gap="lg">
                    <Accordion
                        items={accordionItems}
                        value={accordionValue}
                        onValueChange={setAccordionValue}
                    />
                    <Accordion
                        items={[
                            {
                                value: "contained-a",
                                title: "Contained accordion",
                                content: "A flat Material container with a single divider.",
                            },
                            {
                                value: "contained-b",
                                title: "Second panel",
                                content: "Content sits directly below its summary.",
                            },
                        ]}
                        defaultValue={["contained-a"]}
                        variant="contained"
                    />
                </Stack>
            </Demo>

            <Demo
                title="Pagination and stepper"
                description="Page through a long list, then walk a four-step ritual."
                code={paginationCode}
            >
                <Inline gap="lg" wrap justify="between">
                    <Pagination page={page} pageCount={12} onPageChange={setPage} />
                    <Stepper steps={stepItems} current={step} onStepClick={setStep} />
                </Inline>
            </Demo>

            <Demo title="Tab sizes" code={tabSizesCode}>
                <DemoGroup label="Tab sizes">
                    <Tabs
                        size="sm"
                        items={[
                            { value: "small-a", label: "Small" },
                            { value: "small-b", label: "Second" },
                        ]}
                        defaultValue="small-a"
                        variant="line"
                    />
                    <Tabs
                        size="md"
                        items={[
                            { value: "medium-a", label: "Medium" },
                            { value: "medium-b", label: "Second" },
                        ]}
                        defaultValue="medium-a"
                        variant="line"
                    />
                    <Tabs
                        size="lg"
                        items={[
                            { value: "large-a", label: "Large" },
                            { value: "large-b", label: "Second" },
                        ]}
                        defaultValue="large-a"
                        variant="line"
                    />
                </DemoGroup>
            </Demo>

            <Demo title="Accordion multiple" code={multipleCode}>
                <DemoGroup label="Accordion multiple">
                    <Accordion
                        multiple
                        items={[
                            {
                                value: "multi-a",
                                title: "First panel",
                                content: "Multiple panels can stay open.",
                            },
                            {
                                value: "multi-b",
                                title: "Second panel",
                                content: "This one starts expanded too.",
                            },
                            {
                                value: "multi-c",
                                title: "Third panel",
                                content: "A third option for the demo.",
                            },
                        ]}
                        defaultValue={["multi-a", "multi-b"]}
                    />
                </DemoGroup>
            </Demo>

            <Demo title="Compact controls and vertical stepper" code={compactCode}>
                <DemoGroup label="Compact controls and vertical stepper">
                    <Pagination page={page} pageCount={12} onPageChange={setPage} size="sm" />
                    <Stepper
                        steps={stepItems}
                        current={step}
                        onStepClick={setStep}
                        orientation="vertical"
                    />
                </DemoGroup>
            </Demo>

            <Demo
                title="Truncated breadcrumbs"
                description="Long trails collapse to a maximum number of items."
                code={truncatedCode}
            >
                <Breadcrumbs
                    maxItems={3}
                    items={[
                        { label: "Workspace", href: "#navigation" },
                        { label: "Projects", href: "#navigation" },
                        { label: "Periodicity", href: "#navigation" },
                        { label: "Cycles", href: "#navigation" },
                        { label: "Cycle 04" },
                    ]}
                />
            </Demo>

            <Demo
                title="Navigation rail and bottom bar"
                description="The same navigation items in rail and bottom-bar variants."
                code={navigationCode}
            >
                <DemoGroup label="Navigation rail and bottom bar">
                    <NavigationView
                        items={navigationItems}
                        value={navValue}
                        onValueChange={setNavValue}
                        variant="rail"
                        ariaLabel="Navigation rail"
                    />
                    <NavigationView
                        items={navigationItems}
                        value={navValue}
                        onValueChange={setNavValue}
                        variant="bottom"
                        ariaLabel="Bottom navigation demo"
                    />
                </DemoGroup>
            </Demo>
        </>
    );
};

export default NavigationPage;
