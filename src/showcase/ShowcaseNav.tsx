import {
    useEffect,
    useRef,
    type ChangeEvent,
    type FC,
    type MouseEvent,
    type ReactNode,
    type RefObject,
} from "react";
import Text from "../component/text/Text";
import Scrollbar from "../component/scrollbar/Scrollbar";
import {
    componentEntries,
    defaultEntryId,
    showcaseGroups,
    type ShowcaseEntry,
    type ShowcaseGroup,
    type ShowcaseSection,
} from "./registry";
import "./ShowcaseNav.css";

/**
 * One sidebar link, merged from every entry that opens the same demo.
 * Type: interface.
 * Fields: key, label, entries, targetId.
 */
interface SidebarLink {
    key: string;
    label: string;
    entries: ShowcaseEntry[];
    targetId: string;
}

/**
 * A labelled group of sidebar links.
 * Type: interface.
 * Fields: id, label, links.
 */
interface SidebarSection {
    id: string;
    label: string;
    links: SidebarLink[];
}

/**
 * A top-level sidebar category made of labelled sections.
 * Type: interface.
 * Fields: id, label, sections.
 */
interface SidebarCategory {
    id: string;
    label: string;
    sections: SidebarSection[];
}

/**
 * Component entries that document a demo owned by another entry.
 * Breadcrumbs appears in the "Breadcrumbs and tabs" demo alongside Tabs, so
 * its canonical entry is Tabs.
 */
const componentGroupAliases: ReadonlyMap<string, string> = new Map<string, string>([
    ["breadcrumbs", "tabs"],
]);

/**
 * Lookup from a component id to its generated entry.
 */
const componentEntryById: ReadonlyMap<string, ShowcaseEntry> = new Map<string, ShowcaseEntry>(
    componentEntries.map((entry: ShowcaseEntry): [string, ShowcaseEntry] => [entry.id, entry]),
);

/**
 * Builds the grouping key for a sidebar entry.
 * Component entries share a key when they use the same family page and demo
 * anchor, because all of them open the identical demo card. Every other entry
 * keeps a key of its own.
 * @param entry - Registry entry to group.
 * @example
 * const key: string = sidebarGroupKey(findEntry("form-field"));
 * @returns The family and demo-anchor key, or a unique entry key.
 */
const sidebarGroupKey: (entry: ShowcaseEntry) => string = (entry: ShowcaseEntry): string => {
    if (entry.kind !== "component" || entry.familyId === (void 0) || entry.anchor === (void 0)) {
        return `entry::${entry.id}`;
    }

    const aliasId: string | void = componentGroupAliases.get(entry.id);
    const canonical: ShowcaseEntry = aliasId === (void 0) ? entry : (componentEntryById.get(aliasId) ?? entry);
    const familyId: string = canonical.familyId ?? entry.familyId;
    const anchor: string = canonical.anchor ?? entry.anchor;

    return `${familyId}::${anchor}`;
};

/**
 * Groups registry entries into one sidebar link per page and demo anchor.
 * Groups keep first-appearance order and stay in the section where they first
 * appear, so the desktop list and the mobile select share the same model.
 * @param categories - Top-level groups from the entry registry.
 * @example
 * const categories: readonly SidebarCategory[] = createSidebarCategories(showcaseGroups);
 * @returns Categories whose sections hold merged sidebar links.
 */
const createSidebarCategories: (categories: readonly ShowcaseGroup[]) => readonly SidebarCategory[] = (
    categories: readonly ShowcaseGroup[],
): readonly SidebarCategory[] => {
    const linksByKey: Map<string, SidebarLink> = new Map<string, SidebarLink>();
    const linksBySection: Map<string, SidebarLink[]> = new Map<string, SidebarLink[]>();

    categories.forEach((category: ShowcaseGroup): void => {
        category.sections.forEach((section: ShowcaseSection): void => {
            const sectionKey: string = `${category.id}::${section.id}`;
            const links: SidebarLink[] = linksBySection.get(sectionKey) ?? [];

            if (!linksBySection.has(sectionKey)) {
                linksBySection.set(sectionKey, links);
            }

            section.entries.forEach((entry: ShowcaseEntry): void => {
                const key: string = sidebarGroupKey(entry);
                const existing: SidebarLink | void = linksByKey.get(key);

                if (existing === (void 0)) {
                    const link: SidebarLink = {
                        key,
                        label: entry.label,
                        entries: [entry],
                        targetId: entry.id,
                    };

                    linksByKey.set(key, link);
                    links.push(link);

                    return;
                }

                existing.entries.push(entry);
                existing.label = `${existing.label} · ${entry.label}`;
            });
        });
    });

    return categories.map(
        (category: ShowcaseGroup): SidebarCategory => ({
            id: category.id,
            label: category.label,
            sections: category.sections.map(
                (section: ShowcaseSection): SidebarSection => ({
                    id: section.id,
                    label: section.label,
                    links: linksBySection.get(`${category.id}::${section.id}`) ?? [],
                }),
            ),
        }),
    );
};

/**
 * Sidebar model shared by the desktop list and the mobile select.
 */
const sidebarCategories: readonly SidebarCategory[] = createSidebarCategories(showcaseGroups);

/**
 * Props for the persistent documentation sidebar.
 * Type: interface.
 * Fields: activeId, onNavigate.
 * @example
 * <ShowcaseNav activeId="buttons" onNavigate={navigate} />
 */
export interface ShowcaseNavProps {
    activeId: string;
    onNavigate: (id: string) => void;
}

/**
 * Renders the grouped sidebar navigation.
 * Entries that open the same family page and demo anchor are merged into one
 * link, so the list reflects the documented content rather than the export
 * count. The merged model also feeds the mobile select and keeps every
 * registry entry reachable through its own hash.
 * @param props - Active entry id and the navigation callback.
 * @example
 * <ShowcaseNav activeId="colours" onNavigate={navigate} />
 * @returns A sidebar with Foundations and Components groups.
 */
const ShowcaseNav: FC<ShowcaseNavProps> = ({ activeId, onNavigate }: ShowcaseNavProps) => {
    const activeLinkRef: RefObject<HTMLAnchorElement | null> =
        useRef<HTMLAnchorElement | null>(null);

    useEffect((): void => {
        activeLinkRef.current?.scrollIntoView({ block: "nearest" });
    }, [activeId]);

    const handleLinkClick: (event: MouseEvent<HTMLAnchorElement>, id: string) => void = (
        event: MouseEvent<HTMLAnchorElement>,
        id: string,
    ): void => {
        event.preventDefault();
        onNavigate(id);
    };

    const handleDashboard: (event: MouseEvent<HTMLAnchorElement>) => void = (
        event: MouseEvent<HTMLAnchorElement>,
    ): void => {
        event.preventDefault();
        window.location.hash = "#dashboard";
        window.location.reload();
    };

    return (
        <aside className="showcase-sidebar" aria-label="Design system sections">
            <div className="showcase-sidebar__inner">
                <a
                    className="showcase-sidebar__brand"
                    href={`#${defaultEntryId}`}
                    onClick={(event: MouseEvent<HTMLAnchorElement>): void =>
                        handleLinkClick(event, defaultEntryId)
                    }
                >
                    <span className="showcase-sidebar__mark" aria-hidden="true">
                        P
                    </span>
                    <span className="showcase-sidebar__brand-copy">
                        <Text variant="label">Periodicity</Text>
                        <Text variant="body-sm" tone="muted">
                            Design system v1.0
                        </Text>
                    </span>
                </a>

                <div className="showcase-sidebar__select">
                    <label className="showcase-sidebar__select-label" htmlFor="showcase-section-select">
                        Section
                    </label>
                    <select
                        id="showcase-section-select"
                        aria-label="Design system section"
                        value={activeId}
                        onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
                            onNavigate(event.target.value)
                        }
                    >
                        {sidebarCategories.map(
                            (category: SidebarCategory): ReactNode =>
                                category.sections.map(
                                    (section: SidebarSection): ReactNode => (
                                        <optgroup
                                            label={`${category.label} · ${section.label}`}
                                            key={`${category.id}-${section.id}`}
                                        >
                                            {section.links.map((link: SidebarLink): ReactNode => {
                                                const isActive: boolean = link.entries.some(
                                                    (entry: ShowcaseEntry): boolean => entry.id === activeId,
                                                );
                                                const optionValue: string = isActive ? activeId : link.targetId;

                                                return (
                                                    <option key={link.key} value={optionValue}>
                                                        {link.label}
                                                    </option>
                                                );
                                            })}
                                        </optgroup>
                                    ),
                                ),
                        )}
                    </select>
                </div>

                <div className="showcase-sidebar__scroll">
                    <Scrollbar
                        className="showcase-sidebar__scrollbar"
                        orientation="vertical"
                        autoHide
                    >
                        <nav className="showcase-sidebar__nav" aria-label="Component documentation">
                            {sidebarCategories.map((category: SidebarCategory): ReactNode => (
                                <div className="showcase-sidebar__group" key={category.id}>
                                    <p className="showcase-sidebar__title">{category.label}</p>
                                    {category.sections.map((section: SidebarSection): ReactNode => (
                                        <div className="showcase-sidebar__section" key={section.id}>
                                            <p className="showcase-sidebar__section-title">{section.label}</p>
                                            <ul className="showcase-sidebar__list">
                                                {section.links.map((link: SidebarLink): ReactNode => {
                                                    const isActive: boolean = link.entries.some(
                                                        (entry: ShowcaseEntry): boolean => entry.id === activeId,
                                                    );
                                                    const targetId: string = isActive ? activeId : link.targetId;
                                                    const linkClassName: string = isActive
                                                        ? "showcase-sidebar__link showcase-sidebar__link--active"
                                                        : "showcase-sidebar__link";

                                                    return (
                                                        <li key={link.key}>
                                                            <a
                                                                ref={isActive ? activeLinkRef : null}
                                                                className={linkClassName}
                                                                href={`#${targetId}`}
                                                                aria-current={isActive ? "page" : (void 0)}
                                                                onClick={(
                                                                    event: MouseEvent<HTMLAnchorElement>,
                                                                ): void =>
                                                                    handleLinkClick(event, targetId)
                                                                }
                                                            >
                                                                {link.label}
                                                            </a>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </nav>
                    </Scrollbar>
                </div>

                <footer className="showcase-sidebar__footer">
                    <Text variant="body-sm" tone="muted">
                        {`${componentEntries.length} component entries`}
                    </Text>
                    <Text variant="body-sm" tone="muted">
                        Material · Roboto
                    </Text>
                    <a className="showcase-sidebar__back" href="#dashboard" onClick={handleDashboard}>
                        Dashboard
                    </a>
                </footer>
            </div>
        </aside>
    );
};

export default ShowcaseNav;
