import {
    useRef,
    useState,
    type Dispatch,
    type FC,
    type RefObject,
    type SetStateAction,
} from "react";
import { Inline, Stack } from "../../../arrange/layout";
import {
    Button,
    ContextMenu,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuSeparator,
    Dropdown,
    DropdownGroup,
    DropdownItem,
    DropdownSeparator,
    Menu,
    MenuGroup,
    MenuItem,
    MenuSeparator,
    Popover,
    Surface,
    Tooltip,
} from "../../../component";
import Icon from "../../../component/icon/Icon";
import Text from "../../../component/text/Text";
import Demo, { DemoGroup } from "../../Demo";

const overlaysCode: string = `<span ref={dropdownAnchorRef}>
    <Button
        variant="outline"
        trailingIcon="ChevronDown"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-expanded={dropdownOpen}
        aria-haspopup="menu"
    >
        Dropdown
    </Button>
</span>
<Dropdown
    open={dropdownOpen}
    onOpenChange={setDropdownOpen}
    anchorRef={dropdownAnchorRef}
    header={<Text variant="label">Workspace</Text>}
    footer={<Text variant="body-sm" tone="muted">3 spaces</Text>}
    empty="No spaces"
    role="menu"
>
    <DropdownGroup label="Recent">
        <DropdownItem icon="Plan" selected onSelect={() => setMenuAnchor("all")}>
            All rituals
        </DropdownItem>
        <DropdownItem icon="Calendar" onSelect={() => setMenuAnchor("today")}>
            Today
        </DropdownItem>
    </DropdownGroup>
    <DropdownSeparator />
    <DropdownItem icon="Setting" shortcut="⌘,">Settings</DropdownItem>
</Dropdown>

<span ref={menuAnchorRef}>
    <Button
        variant="outline"
        trailingIcon="ChevronDown"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
    >
        Menu
    </Button>
</span>
<Menu open={menuOpen} onOpenChange={setMenuOpen} anchorRef={menuAnchorRef}>
    <MenuItem icon="Plan" onSelect={() => setMenuOpen(false)}>New ritual</MenuItem>
    <MenuItem icon="Calendar" shortcut="⌘K" onSelect={() => setMenuOpen(false)}>
        Open calendar
    </MenuItem>
    <MenuItem icon="Setting" disabled>Managed by admin</MenuItem>
    <MenuSeparator />
    <MenuGroup label="View">
        <MenuItem selected onSelect={() => setMenuOpen(false)}>Overview</MenuItem>
        <MenuItem onSelect={() => setMenuOpen(false)}>Cycles</MenuItem>
    </MenuGroup>
</Menu>

<span ref={popoverAnchorRef}>
    <Button
        variant="outline"
        trailingIcon="ChevronDown"
        onClick={() => setPopoverOpen(!popoverOpen)}
        aria-expanded={popoverOpen}
    >
        Popover
    </Button>
</span>
<Popover
    open={popoverOpen}
    onOpenChange={setPopoverOpen}
    anchorRef={popoverAnchorRef}
    placement="bottom-start"
>
    <Stack gap="sm" className="showcase__popover">
        <Text variant="h4">A small panel</Text>
        <Text variant="body-sm" tone="muted">
            Anchored, dismissible, and keyboard reachable.
        </Text>
        <Button size="sm" onClick={() => setPopoverOpen(false)}>Close</Button>
    </Stack>
</Popover>`;

const tooltipsCode: string = `{["top", "bottom", "left", "right"].map((placement) => (
    <Tooltip key={placement} content={\`Tooltip \${placement}\`} placement={placement}>
        <span className="showcase__anchor">
            <Button variant="outline">{placement}</Button>
        </span>
    </Tooltip>
))}`;

const contextMenuCode: string = `<ContextMenu
    header={<Text variant="label">Cycle 04</Text>}
    footer={<Text variant="body-sm" tone="muted">Right-click menu</Text>}
    menu={
        <>
            <ContextMenuGroup label="Open">
                <ContextMenuItem icon="Plan" onSelect={() => setMenuAnchor("plan")}>
                    Open plan
                </ContextMenuItem>
                <ContextMenuItem icon="Calendar" shortcut="⌘K">Schedule</ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup label="Manage">
                <ContextMenuItem icon="Plan" disabled>Duplicate cycle</ContextMenuItem>
                <ContextMenuItem icon="Setting" danger>Archive cycle</ContextMenuItem>
            </ContextMenuGroup>
        </>
    }
>
    <Surface className="showcase__context-zone" elevation={1} shape="sm">
        <Stack gap="xs">
            <Text variant="label">Context menu</Text>
            <Text variant="body-sm" tone="muted">
                Right-click this surface, or press Shift+F10.
            </Text>
        </Stack>
    </Surface>
</ContextMenu>`;

const emptyContextCode: string = `<ContextMenu empty="No actions are available for this item.">
    <Surface className="showcase__context-zone" elevation={1} shape="sm">
        <Stack gap="xs">
            <Text variant="label">Context menu · empty</Text>
            <Text variant="body-sm" tone="muted">Right-click to see the empty slot.</Text>
        </Stack>
    </Surface>
</ContextMenu>`;

const tooltipPlacements: ReadonlyArray<"top" | "bottom" | "left" | "right"> = [
    "top",
    "bottom",
    "left",
    "right",
];

/**
 * Documents dropdowns, menus, popovers, tooltips, and context menus.
 * @example
 * <OverlaysPage />
 * @returns The Overlays entry.
 */
const OverlaysPage: FC = () => {
    const [dropdownOpen, setDropdownOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [menuOpen, setMenuOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [popoverOpen, setPopoverOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [menuAnchor, setMenuAnchor]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("all");
    const dropdownAnchorRef: RefObject<HTMLSpanElement | null> =
        useRef<HTMLSpanElement | null>(null);
    const menuAnchorRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
    const popoverAnchorRef: RefObject<HTMLSpanElement | null> =
        useRef<HTMLSpanElement | null>(null);

    return (
        <>
            <Demo
                title="Dropdown, menu, and popover"
                description="Shared dropdown slots and anchored overlays, each dismissible with Escape."
                code={overlaysCode}
            >
                <Inline gap="md" wrap>
                    <span ref={dropdownAnchorRef} className="showcase__anchor">
                        <Button
                            variant="outline"
                            trailingIcon="ChevronDown"
                            onClick={(): void => setDropdownOpen(!dropdownOpen)}
                            aria-expanded={dropdownOpen}
                            aria-haspopup="menu"
                        >
                            Dropdown
                        </Button>
                    </span>
                    <Dropdown
                        open={dropdownOpen}
                        onOpenChange={setDropdownOpen}
                        anchorRef={dropdownAnchorRef}
                        header={<Text variant="label">Workspace</Text>}
                        footer={<Text variant="body-sm" tone="muted">3 spaces</Text>}
                        empty="No spaces"
                        role="menu"
                    >
                        <DropdownGroup label="Recent">
                            <DropdownItem icon="Plan" selected onSelect={(): void => setMenuAnchor("all")}>
                                All rituals
                            </DropdownItem>
                            <DropdownItem
                                icon="Calendar"
                                onSelect={(): void => setMenuAnchor("today")}
                            >
                                Today
                            </DropdownItem>
                        </DropdownGroup>
                        <DropdownSeparator />
                        <DropdownItem icon="Setting" shortcut="⌘,">
                            Settings
                        </DropdownItem>
                    </Dropdown>

                    <span ref={menuAnchorRef} className="showcase__anchor">
                        <Button
                            variant="outline"
                            trailingIcon="ChevronDown"
                            onClick={(): void => setMenuOpen(!menuOpen)}
                            aria-expanded={menuOpen}
                            aria-haspopup="menu"
                        >
                            Menu
                        </Button>
                    </span>
                    <Menu open={menuOpen} onOpenChange={setMenuOpen} anchorRef={menuAnchorRef}>
                        <MenuItem icon="Plan" onSelect={(): void => setMenuOpen(false)}>
                            New ritual
                        </MenuItem>
                        <MenuItem
                            icon="Calendar"
                            shortcut="⌘K"
                            onSelect={(): void => setMenuOpen(false)}
                        >
                            Open calendar
                        </MenuItem>
                        <MenuItem icon="Setting" disabled>
                            Managed by admin
                        </MenuItem>
                        <MenuSeparator />
                        <MenuGroup label="View">
                            <MenuItem selected onSelect={(): void => setMenuOpen(false)}>
                                Overview
                            </MenuItem>
                            <MenuItem onSelect={(): void => setMenuOpen(false)}>Cycles</MenuItem>
                        </MenuGroup>
                    </Menu>

                    <span ref={popoverAnchorRef} className="showcase__anchor">
                        <Button
                            variant="outline"
                            trailingIcon="ChevronDown"
                            onClick={(): void => setPopoverOpen(!popoverOpen)}
                            aria-expanded={popoverOpen}
                        >
                            Popover
                        </Button>
                    </span>
                    <Popover
                        open={popoverOpen}
                        onOpenChange={setPopoverOpen}
                        anchorRef={popoverAnchorRef}
                        placement="bottom-start"
                    >
                        <Stack gap="sm" className="showcase__popover">
                            <Text variant="h4">A small panel</Text>
                            <Text variant="body-sm" tone="muted">
                                Anchored, dismissible, and keyboard reachable.
                            </Text>
                            <Button size="sm" onClick={(): void => setPopoverOpen(false)}>
                                Close
                            </Button>
                        </Stack>
                    </Popover>

                    <Inline gap="xs" align="center">
                        <Icon name="Search" size={16} />
                        <Text variant="body-sm" tone="muted">
                            Current view: {menuAnchor}
                        </Text>
                    </Inline>
                </Inline>
            </Demo>

            <Demo
                title="Tooltip placements"
                description="Tooltips show on hover and focus, positioned on all four sides."
                code={tooltipsCode}
            >
                <DemoGroup label="Tooltip placements">
                    {tooltipPlacements.map(
                        (placement: "top" | "bottom" | "left" | "right") => (
                            <Tooltip
                                key={placement}
                                content={`Tooltip ${placement}`}
                                placement={placement}
                            >
                                <span className="showcase__anchor">
                                    <Button variant="outline">{placement}</Button>
                                </span>
                            </Tooltip>
                        ),
                    )}
                </DemoGroup>
            </Demo>

            <Demo
                title="Context menu"
                description="A right-click menu with groups, shortcuts, danger, and disabled items."
                code={contextMenuCode}
            >
                <ContextMenu
                    header={<Text variant="label">Cycle 04</Text>}
                    footer={<Text variant="body-sm" tone="muted">Right-click menu</Text>}
                    menu={
                        <>
                            <ContextMenuGroup label="Open">
                                <ContextMenuItem
                                    icon="Plan"
                                    onSelect={(): void => setMenuAnchor("plan")}
                                >
                                    Open plan
                                </ContextMenuItem>
                                <ContextMenuItem icon="Calendar" shortcut="⌘K">
                                    Schedule
                                </ContextMenuItem>
                            </ContextMenuGroup>
                            <ContextMenuSeparator />
                            <ContextMenuGroup label="Manage">
                                <ContextMenuItem icon="Plan" disabled>
                                    Duplicate cycle
                                </ContextMenuItem>
                                <ContextMenuItem icon="Setting" danger>
                                    Archive cycle
                                </ContextMenuItem>
                            </ContextMenuGroup>
                        </>
                    }
                >
                    <Surface className="showcase__context-zone" elevation={1} shape="sm">
                        <Stack gap="xs">
                            <Text variant="label">Context menu</Text>
                            <Text variant="body-sm" tone="muted">
                                Right-click this surface, or press Shift+F10.
                            </Text>
                        </Stack>
                    </Surface>
                </ContextMenu>
            </Demo>

            <Demo
                title="Context menu · empty"
                description="The empty slot explains why no actions are available."
                code={emptyContextCode}
            >
                <ContextMenu empty="No actions are available for this item.">
                    <Surface className="showcase__context-zone" elevation={1} shape="sm">
                        <Stack gap="xs">
                            <Text variant="label">Context menu · empty</Text>
                            <Text variant="body-sm" tone="muted">
                                Right-click to see the empty slot.
                            </Text>
                        </Stack>
                    </Surface>
                </ContextMenu>
            </Demo>
        </>
    );
};

export default OverlaysPage;
