import type { ChangeEvent, FC, MouseEvent, ReactNode } from "react";
import Text from "../component/text/Text";
import {
    defaultEntryId,
    showcaseGroups,
    type ShowcaseEntry,
    type ShowcaseGroup,
} from "./registry";
import "./ShowcaseNav.css";

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
 * The groups come straight from the entry registry, so adding an entry is
 * enough for it to appear here, in the mobile select, and in the page header.
 * @param props - Active entry id and the navigation callback.
 * @example
 * <ShowcaseNav activeId="colours" onNavigate={navigate} />
 * @returns A sidebar with Foundations and Components groups.
 */
const ShowcaseNav: FC<ShowcaseNavProps> = ({ activeId, onNavigate }: ShowcaseNavProps) => {
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

                <label className="showcase-sidebar__select">
                    <span className="showcase-sidebar__select-label">Section</span>
                    <select
                        aria-label="Design system section"
                        value={activeId}
                        onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
                            onNavigate(event.target.value)
                        }
                    >
                        {showcaseGroups.map((group: ShowcaseGroup): ReactNode => (
                            <optgroup label={group.label} key={group.id}>
                                {group.entries.map((entry: ShowcaseEntry): ReactNode => (
                                    <option key={entry.id} value={entry.id}>
                                        {entry.label}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </label>

                <nav className="showcase-sidebar__nav" aria-label="Component documentation">
                    {showcaseGroups.map((group: ShowcaseGroup): ReactNode => (
                        <div className="showcase-sidebar__group" key={group.id}>
                            <p className="showcase-sidebar__title">{group.label}</p>
                            <ul className="showcase-sidebar__list">
                                {group.entries.map((entry: ShowcaseEntry): ReactNode => {
                                    const isActive: boolean = entry.id === activeId;

                                    return (
                                        <li key={entry.id}>
                                            <a
                                                className={
                                                    isActive
                                                        ? "showcase-sidebar__link showcase-sidebar__link--active"
                                                        : "showcase-sidebar__link"
                                                }
                                                href={`#${entry.id}`}
                                                aria-current={isActive ? "page" : (void 0)}
                                                onClick={(event: MouseEvent<HTMLAnchorElement>): void =>
                                                    handleLinkClick(event, entry.id)
                                                }
                                            >
                                                {entry.label}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="showcase-sidebar__footer">
                    <Text variant="body-sm" tone="muted">
                        Material · Roboto
                    </Text>
                    <a className="showcase-sidebar__back" href="#dashboard" onClick={handleDashboard}>
                        Dashboard
                    </a>
                </div>
            </div>
        </aside>
    );
};

export default ShowcaseNav;
