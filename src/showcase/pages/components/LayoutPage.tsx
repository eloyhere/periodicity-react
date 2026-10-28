import {
    useRef,
    useState,
    type Dispatch,
    type FC,
    type ChangeEvent,
    type ReactNode,
    type RefObject,
    type SetStateAction,
} from "react";
import { Columns, Inline, Stack } from "../../../arrange/layout";
import {
    AppBar,
    Badge,
    Button,
    Checkbox,
    CheckList,
    CheckTree,
    Constraint,
    ConstraintLayout,
    Coordinator,
    DrawerLayout,
    Drag,
    Form,
    FormActions,
    FormField,
    FormMessage,
    FormSubmit,
    Frame,
    FramePage,
    GridLayout,
    LinearLayout,
    LinearLayoutItem,
    List,
    NavigationView,
    Pager,
    Page,
    Scroll,
    Scrollbar,
    Surface,
    Switch,
    Table,
    Toolbar,
    Tree,
    VirtualList,
    VirtualTable,
    VirtualTree,
    VirtualWaterfallLayout,
    WaterfallLayout,
} from "../../../component";
import Text from "../../../component/text/Text";
import { useToast } from "../../../component/toast/ToastContext";
import type { ToastApi } from "../../../component/toast/ToastContext";
import type {
    DrawerLayoutHandle,
    FormErrors,
    FormFieldControlProps,
    FormValues,
    ListItemState,
    ListOption,
    NavigationItem,
    NavigationViewHandle,
    PagerHandle,
    ScrollbarState,
    TreeItemState,
} from "../../../component";
import Demo from "../../Demo";
import {
    listOptions,
    navigationItems,
    tableColumns,
    teamRows,
    treeItems,
    virtualItems,
    virtualTeamRows,
    type RitualNode,
    type TeamRow,
} from "../../samples";

const linearCode: string = `<Surface className="showcase__layout-box" elevation={1} shape="sm">
    <LinearLayout orientation="horizontal" gravity="between" align="center" gap="md">
        <Text variant="label">LinearLayout</Text>
        <LinearLayoutItem weight={1}>
            <Text variant="body-sm" tone="muted">weighted child</Text>
        </LinearLayoutItem>
        <Button size="sm">Action</Button>
    </LinearLayout>
</Surface>`;

const gridCode: string = `<GridLayout columns={4} gap="sm">
    {[1, 2, 3, 4, 5, 6, 7, 8].map((cell) => (
        <Surface key={cell} className="showcase__layout-cell" elevation={1} shape="sm">
            <Text variant="body-sm">Cell {cell}</Text>
        </Surface>
    ))}
</GridLayout>

<WaterfallLayout columns={3} gap="sm">
    {[64, 112, 84, 148, 72, 124, 96, 136].map((height, index) => (
        <Surface
            key={height}
            className="showcase__waterfall-card"
            elevation={1}
            shape="sm"
            style={{ height }}
        >
            <Text variant="body-sm">Masonry {index + 1}</Text>
        </Surface>
    ))}
</WaterfallLayout>`;

interface WaterfallCard {
    id: string;
    title: string;
    height: number;
}

const waterfallCards: readonly WaterfallCard[] = [
    { id: "masonry-1", title: "Masonry 1", height: 88 },
    { id: "masonry-2", title: "Masonry 2", height: 128 },
    { id: "masonry-3", title: "Masonry 3", height: 72 },
    { id: "masonry-4", title: "Masonry 4", height: 156 },
    { id: "masonry-5", title: "Masonry 5", height: 104 },
    { id: "masonry-6", title: "Masonry 6", height: 80 },
    { id: "masonry-7", title: "Masonry 7", height: 136 },
    { id: "masonry-8", title: "Masonry 8", height: 96 },
    { id: "masonry-9", title: "Masonry 9", height: 120 },
];

const virtualWaterfallCode: string = `<VirtualWaterfallLayout
    items={waterfallCards}
    getKey={(card) => card.id}
    getHeight={(card) => card.height}
    columns={3}
    gap="sm"
    height={320}
    renderItem={(card) => (
        <Surface
            className="showcase__waterfall-card"
            elevation={1}
            shape="sm"
            style={{ height: "100%" }}
        >
            <Text variant="body-sm">{card.title}</Text>
        </Surface>
    )}
/>`;

const tableCode: string = `<Table
    columns={tableColumns}
    rows={teamRows}
    rowKey={(row) => row.id}
    caption="Team"
    selectedKeys={tableSelection}
    onSelectionChange={(keys) => setTableSelection([...keys])}
    onRowClick={(row) => toast.show({ title: \`Selected \${row.name}\` })}
/>`;

const scrollbarCode: string = `<div style={{ height: 220 }}>
    <Scrollbar orientation="vertical" autoHide>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
            {Array.from({ length: 24 }, (_, index) => (
                <Surface key={index} elevation={1} shape="xs">
                    Row {index + 1}
                </Surface>
            ))}
        </div>
    </Scrollbar>
</div>`;

const scrollViewportCode: string = `<Scroll height={220} ariaLabel="Scroll viewport">
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
        {rows.map((row) => (
            <div key={row}>{row}</div>
        ))}
    </div>
</Scroll>`;

const scrollbarSlotCode: string = `<Scrollbar
    height={220}
    direction="vertical"
    size={8}
    slots={{ scrollbar: (state) => <MyScrollbar state={state} /> }}
>
    <div style={{ padding: 12 }}>Long content…</div>
</Scrollbar>`;

const dragCode: string = `<Drag onReorder={(from, to) => reorder(from, to)}>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => (
            <div key={item}>{item}</div>
        ))}
    </div>
</Drag>`;

const formCode: string = `<Form
    validate={(values: FormValues): FormErrors =>
        typeof values.email === "string" && values.email.includes("@")
            ? {}
            : { email: "Enter an address with an @." }
    }
    onValidSubmit={async (values: FormValues): Promise<void> => {
        await subscribe(values);
        toast.show({ title: "Subscribed" });
    }}
>
    <FormMessage />
    <FormField label="Email" name="email" hint="We never share it." required>
        {(field) => <input {...field} type="email" autoComplete="email" />}
    </FormField>
    <FormActions align="end">
        <FormSubmit content="Subscribe" pendingContent="Subscribing…" />
    </FormActions>
</Form>`;
const coordinatorCode: string = `<Coordinator
    height={460}
    collapseHeight={180}
    collapse={<div className="hero-image" />}
    header={
        <AppBar expandedHeight={64} collapsedHeight={64} scrollBehaviour="none" liftOnScroll={false}>
            <Toolbar
                title="Field notes"
                subtitle="Autumn expedition"
                navigationIcon="←"
                actions={<Button size="sm" variant="outline" style={{ color: "inherit", borderColor: "currentColor" }}>Share</Button>}
            />
        </AppBar>
    }
    main={
        <div className="content">
            {notes.map((note) => <article key={note.id}>{note.text}</article>)}
        </div>
    }
/>`;

const slotToolbarCode: string = `<Toolbar prefix="Menu" content="Workspace" suffix="More" />`;

const virtualTableCode: string = `<VirtualTable    columns={tableColumns}
    rows={virtualTeamRows}
    rowKey={(row) => row.id}
    caption="Virtual team"
    virtual
    height={240}
    rowHeight={52}
    selectedKeys={virtualTableSelection}
    onSelectionChange={(keys) => setVirtualTableSelection([...keys])}
/>`;

const listsCode: string = `<List
    items={listOptions}
    getKey={(item) => item.value}
    selectionMode="single"
    defaultSelectedKeys={["deep-work"]}
    onItemClick={(item) => toast.show({ title: item.value })}
    slots={{
        item: (item, state) => (
            <span className="showcase__item-slot">
                <span>{item.label}</span>
                {state.selected ? <Badge tone="mint">Selected</Badge> : null}
            </span>
        ),
    }}
/>
<CheckList
    items={listOptions}
    getKey={(item) => item.value}
    defaultSelectedKeys={["morning-pages"]}
/>
<VirtualList items={virtualItems} height={220} itemHeight={40} getKey={(item) => item} />

<CheckTree
    items={treeItems}
    getKey={(item) => item.value}
    getChildren={(item) => item.children ?? []}
    defaultExpandedKeys={new Set(["practice"])}
    defaultCheckedKeys={["breath"]}
/>
<Tree
    items={treeItems}
    getKey={(item) => item.value}
    getChildren={(item) => item.children ?? []}
    selectionMode="single"
    defaultExpandedKeys={new Set(["review"])}
    slots={{
        item: (item, state) => (
            <span>{item.label}{state.level > 0 ? " · child" : ""}</span>
        ),
    }}
/>
<VirtualTree
    items={treeItems}
    getKey={(item) => item.value}
    getChildren={(item) => item.children ?? []}
    defaultExpandedKeys={new Set(["practice", "review"])}
    height={220}
    itemHeight={40}
/>`;

const constraintCode: string = `<ConstraintLayout height={220} ariaLabel="Constraint layout">
    <Constraint horizontal="start" vertical="top" offsetX={16} offsetY={16}>
        <Badge tone="neutral">start / top</Badge>
    </Constraint>
    <Constraint horizontal="center" vertical="center">
        <Surface className="showcase__constraint-card" elevation={1} shape="sm">
            <Text variant="h4">Centre</Text>
            <Text variant="body-sm" tone="muted">Anchored to both axes</Text>
        </Surface>
    </Constraint>
    <Constraint horizontal="end" vertical="bottom" offsetX={16} offsetY={16}>
        <Badge tone="mint">end / bottom</Badge>
    </Constraint>
</ConstraintLayout>

<NavigationView
    ref={navigationApiRef}
    items={navigationItems}
    value={navValue}
    onValueChange={setNavValue}
    onItemClick={(item) => toast.show({ title: \`Navigation: \${item.label}\` })}
    header={<Text variant="label">NavigationView</Text>}
    footer={<Text variant="body-sm" tone="muted">Sidebar</Text>}
/>
<Button size="sm" variant="outline" onClick={() => navigationApiRef.current?.select("settings")}>
    API select settings
</Button>`;

const framePagesCode: string = `const [page, setPage] = useState("overview");

<Frame height={240} ariaLabel="Frame pages">
    <FramePage active={page === "overview"}>
        <OverviewPage />
    </FramePage>
    <FramePage active={page === "details"}>
        <DetailsPage />
    </FramePage>
    <div style={{ position: "absolute", insetInlineStart: 16, bottom: 16 }}>
        <Button onClick={() => setPage("overview")}>Overview</Button>
        <Button onClick={() => setPage("details")}>Details</Button>
    </div>
</Frame>`;

const pagerCode: string = `<Pager
    ref={pagerApiRef}
    value={pagerPage}
    onChange={setPagerPage}
    onRouteChange={(route) => toast.show({ title: \`Pager route: \${route}\` })}
    ariaLabel="Layout pager"
>
    <Page route="one">
        <Surface className="showcase__page" elevation={1} shape="sm">
            <Text variant="h4">Page one</Text>
            <Text variant="body-sm" tone="muted">Swipe or use the arrow keys.</Text>
        </Surface>
    </Page>
    <Page route="two">
        <Surface className="showcase__page" elevation={1} shape="sm">
            <Text variant="h4">Page two</Text>
            <Text variant="body-sm" tone="muted">Scroll-snapped page.</Text>
        </Surface>
    </Page>
    <Page route="three">
        <Surface className="showcase__page" elevation={1} shape="sm">
            <Text variant="h4">Page three</Text>
            <Text variant="body-sm" tone="muted">Last page.</Text>
        </Surface>
    </Page>
</Pager>`;

const drawerLayoutCode: string = `<DrawerLayout
    ref={drawerApiRef}
    className="showcase__drawer-layout"
    leftOpen={leftDrawer}
    onLeftOpenChange={setLeftDrawer}
    rightOpen={rightDrawer}
    onRightOpenChange={setRightDrawer}
    topOpen={topDrawer}
    onTopOpenChange={setTopDrawer}
    bottomOpen={bottomDrawer}
    onBottomOpenChange={setBottomDrawer}
    leftWidth={220}
    rightWidth={200}
    topHeight={110}
    bottomHeight={96}
    left={
        <NavigationView items={navigationItems} value={navValue} onValueChange={setNavValue} />
    }
    centre={
        <Stack gap="md" className="showcase__drawer-center">
            <Text variant="h3">Centre slot</Text>
            <Text variant="body" tone="muted">
                Left, right, top, and bottom drawers push this content instead of covering it.
            </Text>
            <Inline gap="sm" wrap>
                <Button onClick={() => setLeftDrawer(true)}>Open left</Button>
                <Button variant="outline" onClick={() => setRightDrawer(true)}>Open right</Button>
                <Button variant="outline" onClick={() => setTopDrawer(true)}>Open top</Button>
                <Button variant="outline" onClick={() => setBottomDrawer(true)}>Open bottom</Button>
            </Inline>
        </Stack>
    }
    top={<Stack gap="sm" className="showcase__drawer-panel">Top slot</Stack>}
    bottom={<Stack gap="xs" className="showcase__drawer-panel">Bottom slot</Stack>}
    right={
        <Stack gap="md" className="showcase__drawer-panel">
            <Text variant="label">Right slot</Text>
            <Checkbox defaultChecked label="Show completed" />
            <Switch checked={switchOn} onChange={setSwitchOn} label="Compact rows" />
        </Stack>
    }
/>`;

const bottomNavigationCode: string = `<NavigationView
    items={navigationItems}
    variant="bottom"
    ariaLabel="Bottom navigation"
/>`;

/**
 * Documents linear, constraint, grid, waterfall, table, list, tree, pager,
 * and drawer layouts.
 * @example
 * <LayoutPage />
 * @returns The Layout entry.
 */
const LayoutPage: FC = () => {
    const toast: ToastApi = useToast();
    const [tableSelection, setTableSelection]: [string[], Dispatch<SetStateAction<string[]>>] =
        useState<string[]>(["mira"]);
    const [virtualTableSelection, setVirtualTableSelection]: [
        string[],
        Dispatch<SetStateAction<string[]>>,
    ] = useState<string[]>([]);
    const [leftDrawer, setLeftDrawer]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [rightDrawer, setRightDrawer]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [topDrawer, setTopDrawer]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [bottomDrawer, setBottomDrawer]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [navValue, setNavValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("today");
    const [pagerPage, setPagerPage]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
    const [framePage, setFramePage]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("overview");
    const [switchOn, setSwitchOn]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    const [formEmail, setFormEmail]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("");
    const drawerApiRef: RefObject<DrawerLayoutHandle | null> =
        useRef<DrawerLayoutHandle | null>(null);
    const navigationApiRef: RefObject<NavigationViewHandle | null> =
        useRef<NavigationViewHandle | null>(null);
    const pagerApiRef: RefObject<PagerHandle | null> = useRef<PagerHandle | null>(null);

    return (
        <>
            <Demo
                title="Linear layout"
                description="A horizontal row with weighted children and gravity."
                code={linearCode}
            >
                <Surface className="showcase__layout-box" elevation={1} shape="sm">
                    <LinearLayout orientation="horizontal" gravity="between" align="center" gap="md">
                        <Text variant="label">LinearLayout</Text>
                        <LinearLayoutItem weight={1}>
                            <Text variant="body-sm" tone="muted">
                                weighted child
                            </Text>
                        </LinearLayoutItem>
                        <Button size="sm">Action</Button>
                    </LinearLayout>
                </Surface>
            </Demo>

            <Demo
                title="Grid and waterfall"
                description="A fixed-column grid and a masonry layout, both built with flex."
                code={gridCode}
            >
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        GridLayout
                    </Text>
                    <GridLayout columns={4} gap="sm">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((cell: number): ReactNode => (
                            <Surface
                                key={cell}
                                className="showcase__layout-cell"
                                elevation={1}
                                shape="sm"
                            >
                                <Text variant="body-sm">Cell {cell}</Text>
                            </Surface>
                        ))}
                    </GridLayout>
                </Stack>
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        WaterfallLayout
                    </Text>
                    <WaterfallLayout columns={3} gap="sm">
                        {[64, 112, 84, 148, 72, 124, 96, 136].map(
                            (height: number, index: number): ReactNode => (
                                <Surface
                                    key={height}
                                    className="showcase__waterfall-card"
                                    elevation={1}
                                    shape="sm"
                                    style={{ height }}
                                >
                                    <Text variant="body-sm">Masonry {index + 1}</Text>
                                </Surface>
                            ),
                        )}
                    </WaterfallLayout>
                </Stack>
            </Demo>

            <Demo
                title="Virtual waterfall"
                description="A height-aware masonry layout that fills the shortest column and mounts only the visible window."
                code={virtualWaterfallCode}
            >
                <VirtualWaterfallLayout
                    items={waterfallCards}
                    getKey={(card: WaterfallCard): string => card.id}
                    getHeight={(card: WaterfallCard): number => card.height}
                    columns={3}
                    gap="sm"
                    height={320}
                    renderItem={(card: WaterfallCard): ReactNode => (
                        <Surface
                            className="showcase__waterfall-card"
                            elevation={1}
                            shape="sm"
                            style={{ height: "100%" }}
                        >
                            <Text variant="body-sm">{card.title}</Text>
                        </Surface>
                    )}
                />
            </Demo>

            <Demo
                title="Table"
                description="Column definitions, row selection, and a row-click callback."
                code={tableCode}
            >
                <Table
                    columns={tableColumns}
                    rows={teamRows}
                    rowKey={(row: TeamRow): string => row.id}
                    caption="Team"
                    selectedKeys={tableSelection}
                    onSelectionChange={(keys: readonly string[]): void =>
                        setTableSelection([...keys])
                    }
                    onRowClick={(row: TeamRow): void => {
                        toast.show({ title: `Selected ${row.name}` });
                    }}
                />
            </Demo>

            <Demo
                title="Virtual table"
                description="The same columns over 120 rows, windowed to the viewport."
                code={virtualTableCode}
            >
                <VirtualTable
                    columns={tableColumns}
                    rows={virtualTeamRows}
                    rowKey={(row: TeamRow): string => row.id}
                    caption="Virtual team"
                    height={240}
                    rowHeight={52}
                    selectedKeys={virtualTableSelection}
                    onSelectionChange={(keys: readonly string[]): void =>
                        setVirtualTableSelection([...keys])
                    }
                />
            </Demo>

            <Demo
                title="Lists and trees"
                description="Single, multiple, virtual, checkable, and selectable collections."
                code={listsCode}
            >
                <Columns className="showcase__fields" count={2} gap="lg">
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            List · single
                        </Text>
                        <List
                            items={listOptions}
                            getKey={(item: ListOption<string>): string => item.value}
                            selectionMode="single"
                            defaultSelectedKeys={["deep-work"]}
                            onItemClick={(item: ListOption<string>): void => {
                                toast.show({ title: item.value });
                            }}
                            slots={{
                                item: (
                                    item: ListOption<string>,
                                    state: ListItemState,
                                ): ReactNode => (
                                    <span className="showcase__item-slot">
                                        <span>{item.label}</span>
                                        {state.selected ? <Badge tone="mint">Selected</Badge> : null}
                                    </span>
                                ),
                            }}
                        />
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            List · multiple
                        </Text>
                        <CheckList
                            items={listOptions}
                            getKey={(item: ListOption<string>): string => item.value}
                            defaultSelectedKeys={["morning-pages"]}
                        />
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            List · virtual
                        </Text>
                        <VirtualList
                            items={virtualItems}
                            height={220}
                            itemHeight={40}
                            getKey={(item: string): string => item}
                        />
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Tree · checkable
                        </Text>
                        <CheckTree
                            items={treeItems}
                            getKey={(item: RitualNode): string => item.value}
                            getChildren={(item: RitualNode): readonly RitualNode[] =>
                                item.children ?? []
                            }
                            defaultExpandedKeys={new Set<string>(["practice"])}
                            defaultCheckedKeys={["breath"]}
                        />
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Tree · select
                        </Text>
                        <Tree
                            items={treeItems}
                            getKey={(item: RitualNode): string => item.value}
                            getChildren={(item: RitualNode): readonly RitualNode[] =>
                                item.children ?? []
                            }
                            selectionMode="single"
                            defaultExpandedKeys={new Set<string>(["review"])}
                            slots={{
                                item: (item: RitualNode, state: TreeItemState): ReactNode => (
                                    <span>
                                        {item.label}
                                        {state.level > 0 ? " · child" : ""}
                                    </span>
                                ),
                            }}
                        />
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Tree · virtual
                        </Text>
                        <VirtualTree
                            items={treeItems}
                            getKey={(item: RitualNode): string => item.value}
                            getChildren={(item: RitualNode): readonly RitualNode[] =>
                                item.children ?? []
                            }
                            defaultExpandedKeys={new Set<string>(["practice", "review"])}
                            height={220}
                            itemHeight={40}
                        />
                    </Stack>
                </Columns>
            </Demo>

            <Demo
                title="Constraint layout and navigation"
                description="Anchored children on both axes, and a NavigationView driven by its ref API."
                code={constraintCode}
            >
                <Columns className="showcase__fields" count={2} gap="lg">
                    <ConstraintLayout height={220} ariaLabel="Constraint layout">
                        <Constraint horizontal="start" vertical="top" offsetX={16} offsetY={16}>
                            <Badge tone="neutral">start / top</Badge>
                        </Constraint>
                        <Constraint horizontal="center" vertical="center">
                            <Surface className="showcase__constraint-card" elevation={1} shape="sm">
                                <Text variant="h4">Centre</Text>
                                <Text variant="body-sm" tone="muted">
                                    Anchored to both axes
                                </Text>
                            </Surface>
                        </Constraint>
                        <Constraint horizontal="end" vertical="bottom" offsetX={16} offsetY={16}>
                            <Badge tone="mint">end / bottom</Badge>
                        </Constraint>
                    </ConstraintLayout>

                    <Stack gap="sm">
                        <NavigationView
                            ref={navigationApiRef}
                            items={navigationItems}
                            value={navValue}
                            onValueChange={setNavValue}
                            onItemClick={(item: NavigationItem): void => {
                                toast.show({ title: `Navigation: ${item.label}` });
                            }}
                            header={<Text variant="label">NavigationView</Text>}
                            footer={<Text variant="body-sm" tone="muted">Sidebar</Text>}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(): void => navigationApiRef.current?.select("settings")}
                        >
                            API select settings
                        </Button>
                    </Stack>
                </Columns>
            </Demo>

            <Demo
                title="Frame pages"
                description="FramePage fills the frame and keeps its state while inactive. Switch sub-views without unmounting either page."
                code={framePagesCode}
            >
                <Frame
                    height={240}
                    ariaLabel="Frame pages demo"
                    style={{
                        border: "1px solid var(--color-outline-variant)",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--color-surface-container-lowest)",
                    }}
                >
                    <FramePage active={framePage === "overview"}>
                        <Stack gap="sm" style={{ padding: 24 }}>
                            <Text variant="label" tone="accent">
                                Page 01
                            </Text>
                            <Text variant="h4">Overview</Text>
                            <Text variant="body" tone="soft">
                                A full-frame sub-view. The page stays mounted when inactive,
                                so local state survives every switch.
                            </Text>
                        </Stack>
                    </FramePage>
                    <FramePage active={framePage === "details"}>
                        <Stack gap="sm" style={{ padding: 24 }}>
                            <Text variant="label" tone="accent">
                                Page 02
                            </Text>
                            <Text variant="h4">Details</Text>
                            <Text variant="body" tone="soft">
                                Inactive pages carry the native hidden attribute, removing them
                                from focus and the accessibility tree.
                            </Text>
                        </Stack>
                    </FramePage>
                    <div
                        style={{
                            position: "absolute",
                            insetInlineStart: 16,
                            bottom: 16,
                            zIndex: 2,
                        }}
                    >
                        <Inline gap="xs">
                            <Button
                                size="sm"
                                variant={framePage === "overview" ? "solid" : "outline"}
                                onClick={(): void => setFramePage("overview")}
                            >
                                Overview
                            </Button>
                            <Button
                                size="sm"
                                variant={framePage === "details" ? "solid" : "outline"}
                                onClick={(): void => setFramePage("details")}
                            >
                                Details
                            </Button>
                        </Inline>
                    </div>
                </Frame>
            </Demo>

            <Demo
                title="Pager"
                description="A scroll-snapped horizontal pager with imperative navigation."
                code={pagerCode}
            >
                <Stack gap="sm">
                    <Inline gap="sm" align="center" justify="between">
                        <Text variant="label">Pager</Text>
                        <Inline gap="xs">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(): void => pagerApiRef.current?.goTo("two")}
                            >
                                API goTo two
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(): void => pagerApiRef.current?.scrollTo("three")}
                            >
                                API scroll three
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={pagerPage === 0}
                                onClick={(): void =>
                                    setPagerPage((current: number): number => current - 1)
                                }
                            >
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={pagerPage === 2}
                                onClick={(): void =>
                                    setPagerPage((current: number): number => current + 1)
                                }
                            >
                                Next
                            </Button>
                        </Inline>
                    </Inline>
                    <Pager
                        ref={pagerApiRef}
                        value={pagerPage}
                        onChange={setPagerPage}
                        onRouteChange={(route: string): void => {
                            toast.show({ title: `Pager route: ${route}` });
                        }}
                        ariaLabel="Layout pager"
                    >
                        <Page route="one">
                            <Surface className="showcase__page" elevation={1} shape="sm">
                                <Text variant="h4">Page one</Text>
                                <Text variant="body-sm" tone="muted">
                                    Swipe or use the arrow keys.
                                </Text>
                            </Surface>
                        </Page>
                        <Page route="two">
                            <Surface className="showcase__page" elevation={1} shape="sm">
                                <Text variant="h4">Page two</Text>
                                <Text variant="body-sm" tone="muted">
                                    Scroll-snapped page.
                                </Text>
                            </Surface>
                        </Page>
                        <Page route="three">
                            <Surface className="showcase__page" elevation={1} shape="sm">
                                <Text variant="h4">Page three</Text>
                                <Text variant="body-sm" tone="muted">
                                    Last page.
                                </Text>
                            </Surface>
                        </Page>
                    </Pager>
                </Stack>
            </Demo>

            <Demo
                title="Drawer layout"
                description="Push drawers on all four edges, with a centre slot and an imperative toggle."
                code={drawerLayoutCode}
            >
                <Stack gap="sm">
                    <Inline gap="sm" align="center" justify="between">
                        <Text variant="label">DrawerLayout · push</Text>
                        <Inline gap="xs">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(): void => setLeftDrawer(!leftDrawer)}
                            >
                                Left
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(): void => setRightDrawer(!rightDrawer)}
                            >
                                Right
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(): void => setTopDrawer(!topDrawer)}
                            >
                                Top
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(): void => setBottomDrawer(!bottomDrawer)}
                            >
                                Bottom
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(): void => drawerApiRef.current?.toggle("left")}
                            >
                                API left
                            </Button>
                        </Inline>
                    </Inline>
                    <DrawerLayout
                        ref={drawerApiRef}
                        className="showcase__drawer-layout"
                        leftOpen={leftDrawer}
                        onLeftOpenChange={setLeftDrawer}
                        rightOpen={rightDrawer}
                        onRightOpenChange={setRightDrawer}
                        topOpen={topDrawer}
                        onTopOpenChange={setTopDrawer}
                        bottomOpen={bottomDrawer}
                        onBottomOpenChange={setBottomDrawer}
                        onLeftOpen={(): void => {
                            toast.show({ title: "Left drawer opened" });
                        }}
                        onLeftClose={(): void => {
                            toast.show({ title: "Left drawer closed" });
                        }}
                        onRightOpen={(): void => {
                            toast.show({ title: "Right drawer opened" });
                        }}
                        onRightClose={(): void => {
                            toast.show({ title: "Right drawer closed" });
                        }}
                        onTopOpen={(): void => {
                            toast.show({ title: "Top drawer opened" });
                        }}
                        onTopClose={(): void => {
                            toast.show({ title: "Top drawer closed" });
                        }}
                        onBottomOpen={(): void => {
                            toast.show({ title: "Bottom drawer opened" });
                        }}
                        onBottomClose={(): void => {
                            toast.show({ title: "Bottom drawer closed" });
                        }}
                        leftWidth={220}
                        rightWidth={200}
                        topHeight={110}
                        bottomHeight={96}
                        left={
                            <NavigationView
                                items={navigationItems}
                                value={navValue}
                                onValueChange={setNavValue}
                                ariaLabel="Drawer navigation"
                            />
                        }
                        centre={
                            <Stack gap="md" className="showcase__drawer-center">
                                <Text variant="h3">Centre slot</Text>
                                <Text variant="body" tone="muted">
                                    Left, right, top, and bottom drawers push this content instead of
                                    covering it. The centre is the main page slot.
                                </Text>
                                <Inline gap="sm" wrap>
                                    <Button onClick={(): void => setLeftDrawer(true)}>
                                        Open left
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={(): void => setRightDrawer(true)}
                                    >
                                        Open right
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={(): void => setTopDrawer(true)}
                                    >
                                        Open top
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={(): void => setBottomDrawer(true)}
                                    >
                                        Open bottom
                                    </Button>
                                </Inline>
                            </Stack>
                        }
                        top={
                            <Stack gap="sm" className="showcase__drawer-panel">
                                <Text variant="label">Top slot</Text>
                                <Text variant="body-sm" tone="muted">
                                    Search and global filters can live here.
                                </Text>
                            </Stack>
                        }
                        bottom={
                            <Stack gap="xs" className="showcase__drawer-panel">
                                <Text variant="label">Bottom slot</Text>
                                <Text variant="body-sm" tone="muted">
                                    Status, hints, or a compact action bar.
                                </Text>
                            </Stack>
                        }
                        right={
                            <Stack gap="md" className="showcase__drawer-panel">
                                <Text variant="label">Right slot</Text>
                                <Text variant="body-sm" tone="muted">
                                    Filters, inspector, or secondary actions.
                                </Text>
                                <Checkbox defaultChecked label="Show completed" />
                                <Switch
                                    checked={switchOn}
                                    onChange={setSwitchOn}
                                    label="Compact rows"
                                />
                            </Stack>
                        }
                    />
                </Stack>
            </Demo>

            <Demo
                title="Scrollbar"
                description="Native scrolling with a Material overlay thumb that appears on hover and scroll."
                code={scrollbarCode}
            >
                <div style={{ height: 220 }}>
                    <Scrollbar orientation="vertical" autoHide>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                padding: 12,
                            }}
                        >
                            {[...Array.from({ length: 24 }).keys()].map(
                                (index: number): ReactNode => (
                                    <Surface key={index} elevation={1} shape="sm">
                                        <Text variant="body-sm">Row {index + 1}</Text>
                                    </Surface>
                                ),
                            )}
                        </div>
                    </Scrollbar>
                </div>
            </Demo>

            <Demo
                title="Scroll viewport"
                description="An Android-ScrollView-style layout: one vertically scrollable viewport, one content slot, and any number of children."
                code={scrollViewportCode}
            >
                <Scroll height={220} ariaLabel="Scroll viewport demo" fillViewport={false}>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            padding: 12,
                        }}
                    >
                        {[...Array.from({ length: 18 }).keys()].map(
                            (index: number): ReactNode => (
                                <Surface key={index} elevation={1} shape="xs">
                                    <Text variant="body-sm">{`Scroll viewport row ${index + 1}`}</Text>
                                </Surface>
                            ),
                        )}
                    </div>
                </Scroll>
            </Demo>

            <Demo
                title="Scrollbar slot"
                description="Replace the built-in scrollbar UI through the slot, with configurable direction and size."
                code={scrollbarSlotCode}
            >
                <div style={{ height: 220 }}>
                    <Scrollbar
                        height={220}
                        direction="vertical"
                        size={8}
                        slots={{
                            scrollbar: (state: ScrollbarState): ReactNode => (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 2,
                                        right: 2,
                                        bottom: 2,
                                        width: 8,
                                        borderRadius: 999,
                                        background: "var(--color-surface-container-high)",
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: state.vertical.offset,
                                            right: 0,
                                            width: 8,
                                            height: state.vertical.thumbSize,
                                            borderRadius: 999,
                                            background: "var(--color-primary)",
                                        }}
                                    />
                                </div>
                            ),
                        }}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
                            {[...Array.from({ length: 18 }).keys()].map(
                                (index: number): ReactNode => (
                                    <Text key={index} variant="body-sm">
                                        Scrollbar slot row {index + 1}
                                    </Text>
                                ),
                            )}
                        </div>
                    </Scrollbar>
                </div>
            </Demo>

            <Demo
                title="Drag"
                description="Every direct child of the single slotted container can be reordered by dragging."
                code={dragCode}
            >
                <Drag
                    onReorder={(from: number, to: number): void => {
                        toast.show({ title: `Moved ${from + 1} → ${to + 1}` });
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {["Plan", "Write", "Review", "Publish"].map(
                            (label: string): ReactNode => (
                                <div
                                    key={label}
                                    style={{
                                        padding: "10px 12px",
                                        border: "1px solid var(--color-outline-variant)",
                                        borderRadius: 8,
                                        background: "var(--color-surface-container-low)",
                                    }}
                                >
                                    <Text variant="body-sm">{label}</Text>
                                </div>
                            ),
                        )}
                    </div>
                </Drag>
            </Demo>

            <Demo
                title="Bottom navigation"
                description="A compact bottom bar for narrow screens."
                code={bottomNavigationCode}
            >
                <NavigationView
                    items={navigationItems}
                    variant="bottom"
                    ariaLabel="Bottom navigation"
                />
            </Demo>

            <Demo
                title="Form"
                description="A native form plus a validation, submission, and pending pipeline. Field errors, the message region, and the submit button share one state, so an invalid submission focuses the summary and a slow save keeps the button busy."
                code={formCode}
            >
                <Form
                    validate={(values: FormValues): FormErrors =>
                        typeof values.email === "string" && values.email.includes("@")
                            ? {}
                            : { email: "Enter an address with an @." }
                    }
                    onValidSubmit={async (values: FormValues): Promise<void> => {
                        await new Promise<void>((resolve: () => void): void => {
                            window.setTimeout(resolve, 900);
                        });
                        toast.show({
                            title: "Subscribed",
                            description: `Email: ${values.email ?? ""}`,
                        });
                        setFormEmail("");
                    }}
                >
                    <FormMessage />
                    <FormField
                        label="Email"
                        name="email"
                        hint="We never share your email."
                        required
                    >
                        {(field: FormFieldControlProps): ReactNode => (
                            <input
                                {...field}
                                type="email"
                                autoComplete="email"
                                value={formEmail}
                                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                    setFormEmail(event.target.value)
                                }
                                style={{
                                    minHeight: 40,
                                    padding: "0 12px",
                                    border: "1px solid var(--color-outline-variant)",
                                    borderRadius: 8,
                                    background: "var(--color-surface)",
                                    color: "var(--color-on-surface)",
                                    font: "inherit",
                                }}
                            />
                        )}
                    </FormField>
                    <FormActions align="end">
                        <FormSubmit content="Subscribe" pendingContent="Subscribing…" />
                    </FormActions>
                </Form>
            </Demo>

            <Demo
                title="Coordinator and app bar"
                description="A collapsing hero app bar coordinated with its scroll viewport, plus a pinned toolbar."
                code={coordinatorCode}
            >
                <Coordinator
                    height={460}
                    collapseHeight={180}
                    collapse={
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                background:
                                    "linear-gradient(135deg, #0d47a1 0%, #1976d2 48%, #4fc3f7 100%)",
                            }}
                        />
                    }
                    header={
                        <AppBar
                            expandedHeight={64}
                            collapsedHeight={64}
                            scrollBehaviour="none"
                            liftOnScroll={false}
                        >
                            <Toolbar
                                title="Field notes"
                                subtitle="Autumn expedition"
                                navigationIcon="←"
                                onNavigationClick={(): void => {
                                    toast.show({ title: "Back" });
                                }}
                                actions={
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        style={{
                                            color: "inherit",
                                            borderColor: "currentColor",
                                        }}
                                        onClick={(): void => {
                                            toast.show({ title: "Shared field notes" });
                                        }}
                                    >
                                        Share
                                    </Button>
                                }
                            />
                        </AppBar>
                    }
                    main={
                        <Stack gap="sm">
                        {Array.from({ length: 12 }, (value: unknown, index: number): ReactNode => {
                            void value;

                            return (
                            <Surface
                                key={index}
                                className="showcase__surface"
                                elevation={1}
                                shape="sm"
                            >
                                <Stack gap="xs">
                                    <Text variant="label">{`Note ${index + 1}`}</Text>
                                    <Text variant="body-sm" tone="muted">
                                        Scroll this viewport to collapse the hero and lift the
                                        pinned toolbar.
                                    </Text>
                                </Stack>
                            </Surface>
                            );
                        })}
                        </Stack>
                    }
                />
            </Demo>

            <Demo
                title="Toolbar slots"
                description="Prefix, content, and suffix share the row 1:1:1; remove slots to get 1:1 or a single centered slot."
                code={slotToolbarCode}
            >
                <Toolbar prefix="Menu" content="Workspace" suffix="More" />
            </Demo>
        </>
    );
};

export default LayoutPage;
