import {
    useRef,
    useState,
    type Dispatch,
    type FC,
    type ReactNode,
    type RefObject,
    type SetStateAction,
} from "react";
import { Columns, Inline, Stack } from "../../../arrange/layout";
import {
    Badge,
    Button,
    Checkbox,
    CheckList,
    CheckTree,
    Constraint,
    ConstraintLayout,
    DrawerLayout,
    GridLayout,
    LinearLayout,
    LinearLayoutItem,
    List,
    NavigationView,
    Pager,
    PagerPage,
    Surface,
    Switch,
    Table,
    Tree,
    VirtualList,
    VirtualTree,
    WaterfallLayout,
} from "../../../component";
import Text from "../../../component/text/Text";
import { useToast } from "../../../component/toast/ToastContext";
import type { ToastApi } from "../../../component/toast/ToastContext";
import type {
    DrawerLayoutHandle,
    ListItemState,
    ListOption,
    NavigationItem,
    NavigationViewHandle,
    PagerHandle,
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

const tableCode: string = `<Table
    columns={tableColumns}
    rows={teamRows}
    rowKey={(row) => row.id}
    caption="Team"
    selectedKeys={tableSelection}
    onSelectionChange={(keys) => setTableSelection([...keys])}
    onRowClick={(row) => toast.show({ title: \`Selected \${row.name}\` })}
/>`;

const virtualTableCode: string = `<Table
    columns={tableColumns}
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

const pagerCode: string = `<Pager
    ref={pagerApiRef}
    value={pagerPage}
    onChange={setPagerPage}
    onRouteChange={(route) => toast.show({ title: \`Pager route: \${route}\` })}
    ariaLabel="Layout pager"
>
    <PagerPage route="one">
        <Surface className="showcase__page" elevation={1} shape="sm">
            <Text variant="h4">Page one</Text>
            <Text variant="body-sm" tone="muted">Swipe or use the arrow keys.</Text>
        </Surface>
    </PagerPage>
    <PagerPage route="two">
        <Surface className="showcase__page" elevation={1} shape="sm">
            <Text variant="h4">Page two</Text>
            <Text variant="body-sm" tone="muted">Scroll-snapped page.</Text>
        </Surface>
    </PagerPage>
    <PagerPage route="three">
        <Surface className="showcase__page" elevation={1} shape="sm">
            <Text variant="h4">Page three</Text>
            <Text variant="body-sm" tone="muted">Last page.</Text>
        </Surface>
    </PagerPage>
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
    const [switchOn, setSwitchOn]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
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
                <Table
                    columns={tableColumns}
                    rows={virtualTeamRows}
                    rowKey={(row: TeamRow): string => row.id}
                    caption="Virtual team"
                    virtual
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
                        <PagerPage route="one">
                            <Surface className="showcase__page" elevation={1} shape="sm">
                                <Text variant="h4">Page one</Text>
                                <Text variant="body-sm" tone="muted">
                                    Swipe or use the arrow keys.
                                </Text>
                            </Surface>
                        </PagerPage>
                        <PagerPage route="two">
                            <Surface className="showcase__page" elevation={1} shape="sm">
                                <Text variant="h4">Page two</Text>
                                <Text variant="body-sm" tone="muted">
                                    Scroll-snapped page.
                                </Text>
                            </Surface>
                        </PagerPage>
                        <PagerPage route="three">
                            <Surface className="showcase__page" elevation={1} shape="sm">
                                <Text variant="h4">Page three</Text>
                                <Text variant="body-sm" tone="muted">
                                    Last page.
                                </Text>
                            </Surface>
                        </PagerPage>
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
        </>
    );
};

export default LayoutPage;
