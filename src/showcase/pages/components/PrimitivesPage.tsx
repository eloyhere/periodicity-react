import {
    useState,
    type ChangeEvent,
    type Dispatch,
    type FC,
    type MouseEvent,
    type ReactNode,
    type SetStateAction,
} from "react";
import { Inline, Stack } from "../../../arrange/layout";
import { useInternational, type InternationalContextValue } from "../../../international";
import {
    Anchor,
    Backdrop,
    Button,
    Card,
    Link,
    PeriodicityIcon,
    Portal,
    StateLayer,
    Surface,
    Text,
    VisuallyHidden,
} from "../../../component";
import Demo, { DemoGroup } from "../../Demo";
import {
    iconCatalog,
    iconGroups,
    type IconCatalogEntry,
    type IconGroup,
} from "../../iconCatalog";
import { resolveIconMessages, type IconMessages } from "../../iconMessages";

const backdropCode: string = `const [open, setOpen] = useState(false);

<Button variant="outline" onClick={() => setOpen(true)}>
    Open backdrop
</Button>

<Backdrop open={open} blur onClick={() => setOpen(false)} />`;

const portalCode: string = `const [visible, setVisible] = useState(false);

<Button variant="outline" onClick={() => setVisible(!visible)}>
    {visible ? "Hide portal layer" : "Show portal layer"}
</Button>

{visible ? (
    <Portal>
        <Surface className="showcase__portal-layer" elevation={2} shape="sm">
            <Text variant="label">Portal layer</Text>
            <Text variant="body-sm" tone="muted">
                Rendered into document.body, outside this card.
            </Text>
        </Surface>
    </Portal>
) : null}`;

const stateLayerCode: string = `<div className="showcase__state-demo">
    <Text variant="body-sm">Resting</Text>
    <StateLayer />
</div>

<div className="showcase__state-demo">
    <Text variant="body-sm">Active</Text>
    <StateLayer active />
</div>`;

const visuallyHiddenCode: string = `<Button variant="outline" icon="Search">
    <VisuallyHidden>Search rituals</VisuallyHidden>
</Button>`;

const iconsCode: string = `const [query, setQuery] = useState("");
const visible = iconCatalog.filter((entry) =>
    entry.name.toLowerCase().includes(query.toLowerCase()),
);

<input
    type="search"
    value={query}
    onChange={(event) => setQuery(event.target.value)}
    aria-label="Search icons"
/>

{visible.map((entry) => (
    <PeriodicityIcon key={entry.name} name={entry.name} size={22} />
))}`;

const linksCode: string = `<Link href="#primitives">In-page link</Link>
<Link href="https://example.com" external>External link</Link>
<Link href="#disabled" disabled>Disabled link</Link>

<Anchor href="#primitives" active>Active section</Anchor>
<Anchor href="#primitives">Another section</Anchor>`;

/**
 * Documents the low-level visual primitives that larger components build on.
 * Every preview is live: the backdrop really covers the viewport, the portal
 * really leaves the card, and the state layer really tints its surface.
 * @example
 * <PrimitivesPage />
 * @returns Backdrop, Portal, StateLayer, and VisuallyHidden demos.
 */
const PrimitivesPage: FC = () => {
    const [backdropOpen, setBackdropOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [portalVisible, setPortalVisible]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const { locale }: InternationalContextValue = useInternational();
    const copy: IconMessages = resolveIconMessages(locale);
    const [iconQuery, setIconQuery]: [string, Dispatch<SetStateAction<string>>] = useState<string>("");
    const normalisedIconQuery: string = iconQuery.trim().toLowerCase();
    const visibleIconGroups: IconGroup[] = iconGroups
        .map(
            (group: IconGroup): IconGroup => {
                const label: string = copy.groups[group.id] ?? group.label;
                const groupMatches: boolean =
                    label.toLowerCase().includes(normalisedIconQuery) ||
                    group.label.toLowerCase().includes(normalisedIconQuery);

                return {
                    ...group,
                    label,
                    entries: group.entries.filter(
                        (entry: IconCatalogEntry): boolean =>
                            groupMatches ||
                            entry.name.toLowerCase().includes(normalisedIconQuery) ||
                            entry.category.toLowerCase().includes(normalisedIconQuery),
                    ),
                };
            },
        )
        .filter((group: IconGroup): boolean => group.entries.length > 0);
    const visibleIconCount: number = visibleIconGroups.reduce(
        (count: number, group: IconGroup): number => count + group.entries.length,
        0,
    );

    return (
        <>
            <Demo
                title="Backdrop"
                description="A fixed scrim used behind drawers and command palettes. Click it to dismiss."
                code={backdropCode}
            >
                <DemoGroup label="Backdrop">
                    <Button variant="outline" onClick={(): void => setBackdropOpen(true)}>
                        Open backdrop
                    </Button>
                    <Text variant="body-sm" tone="muted">
                        The open scrim covers the viewport and closes on click.
                    </Text>
                </DemoGroup>
                <Backdrop open={backdropOpen} blur onClick={(): void => setBackdropOpen(false)} />
            </Demo>

            <Demo
                title="Portal"
                description="Children leave the demo card and render into document.body."
                code={portalCode}
            >
                <DemoGroup label="Portal">
                    <Button
                        variant="outline"
                        onClick={(): void => setPortalVisible(!portalVisible)}
                    >
                        {portalVisible ? "Hide portal layer" : "Show portal layer"}
                    </Button>
                </DemoGroup>
                {portalVisible ? (
                    <Portal>
                        <Surface className="showcase__portal-layer" elevation={2} shape="sm">
                            <Stack gap="xs">
                                <Text variant="label" tone="accent">
                                    Portal layer
                                </Text>
                                <Text variant="body-sm" tone="muted">
                                    Rendered into document.body, outside this card.
                                </Text>
                            </Stack>
                        </Surface>
                    </Portal>
                ) : null}
            </Demo>

            <Demo
                title="State layer"
                description="The hover, press, and focus tint that sits above a surface background."
                code={stateLayerCode}
            >
                <DemoGroup label="State layer">
                    <div className="showcase__state-demo">
                        <Text variant="body-sm">Resting</Text>
                        <StateLayer />
                    </div>
                    <div className="showcase__state-demo">
                        <Text variant="body-sm">Active</Text>
                        <StateLayer active />
                    </div>
                </DemoGroup>
            </Demo>

            <Demo
                title="Icons"
                description={copy.description(iconCatalog.length)}
                code={iconsCode}
            >
                <div className="showcase__icon-catalogue">
                        <div className="showcase__icon-toolbar">
                            <label className="showcase__icon-search">
                                <PeriodicityIcon name="Search" size={16} />
                                <input
                                    type="search"
                                    value={iconQuery}
                                    placeholder={copy.searchPlaceholder}
                                    aria-label={copy.searchLabel}
                                    onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                        setIconQuery(event.target.value)
                                    }
                                />
                            </label>
                            <span className="showcase__icon-count">
                                {visibleIconCount} / {iconCatalog.length}
                            </span>
                        </div>
                        <div className="showcase__icon-groups">
                            {visibleIconGroups.map(
                                (group: IconGroup): ReactNode => (
                                    <Card
                                        className="showcase__icon-group-card"
                                        key={group.id}
                                        title={group.label}
                                        action={
                                            <span className="showcase__icon-group-count">
                                                {group.entries.length}
                                            </span>
                                        }
                                        headingLevel={3}
                                        ripple={false}
                                    >
                                        <div className="showcase__icon-grid">
                                            {group.entries.map(
                                                (entry: IconCatalogEntry): ReactNode => (
                                                    <div
                                                        className="showcase__icon-cell"
                                                        key={`${entry.category}-${entry.name}`}
                                                        title={`${entry.category} / ${entry.name}`}
                                                    >
                                                        <PeriodicityIcon
                                                            name={entry.name}
                                                            size={22}
                                                            motion={
                                                                group.id === "dynamic"
                                                                    ? "always"
                                                                    : "auto"
                                                            }
                                                        />
                                                        <span className="showcase__icon-name">
                                                            {entry.name}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </Card>
                                ),
                            )}
                        </div>
                        {visibleIconCount === 0 ? (
                            <Text variant="body-sm" tone="muted">
                                {copy.empty(iconQuery)}
                            </Text>
                        ) : null}
                </div>
            </Demo>

            <Demo
                title="Links and anchors"
                description="Native anchors with focus, tone, external-link, and active-section semantics."
                code={linksCode}
            >
                <DemoGroup label="Link and Anchor">
                    <Inline gap="md" align="center" wrap>
                        <Link
                            href="#primitives"
                            onClick={(event: MouseEvent<HTMLAnchorElement>): void =>
                                event.preventDefault()
                            }
                        >
                            In-page link
                        </Link>
                        <Link href="https://example.com" external>
                            External link
                        </Link>
                        <Link href="#disabled" disabled>
                            Disabled link
                        </Link>
                        <Anchor href="#primitives" active>
                            Active section
                        </Anchor>
                        <Anchor
                            href="#primitives"
                            onNavigate={(
                                href: string,
                                event: MouseEvent<HTMLAnchorElement>,
                            ): void => {
                                void href;
                                event.preventDefault();
                            }}
                        >
                            Another section
                        </Anchor>
                    </Inline>
                </DemoGroup>
            </Demo>

            <Demo
                title="Visually hidden"
                description="A label that stays invisible on screen but available to assistive technology."
                code={visuallyHiddenCode}
            >
                <Inline gap="sm" align="center" wrap>
                    <Button variant="outline" icon="Search">
                        <VisuallyHidden>Search rituals</VisuallyHidden>
                    </Button>
                    <Text variant="body-sm" tone="muted">
                        The icon button has no visible text; screen readers announce Search rituals.
                    </Text>
                </Inline>
            </Demo>
        </>
    );
};

export default PrimitivesPage;
