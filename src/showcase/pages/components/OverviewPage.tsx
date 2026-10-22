import type { FC, ReactNode } from "react";
import Icon from "../../../component/icon/Icon";
import Demo from "../../Demo";
import {
    topLevelComponents,
    topLevelComponentSections,
    type ComponentRecord,
    type ComponentSection,
} from "../../componentCatalogue";

const indexCode: string = `{topLevelComponentSections.map((section) => (
    <section key={section.id}>
        <h2>{section.label}</h2>
        {section.components.map((component) => (
            <a key={component.id} href={\`#\${component.id}\`}>
                <strong>{component.name}</strong>
                <span>{component.description}</span>
            </a>
        ))}
    </section>
))}`;

/**
 * Lists every top-level public component as one card, grouped by section.
 * The page is a single long scroll so the reader can move through the whole
 * inventory without opening a family index first.
 * @example
 * <OverviewPage />
 * @returns The Overview entry.
 */
const OverviewPage: FC = () => (
    <Demo
        title="Component index"
        description={`${topLevelComponents.length} top-level components, one card per component.`}
        code={indexCode}
    >
        <nav className="showcase__component-index" aria-label="Component index">
            {topLevelComponentSections.map(
                (section: ComponentSection): ReactNode => (
                    <section className="showcase__component-section" key={section.id}>
                        <header className="showcase__component-section-header">
                            <h2 className="showcase__component-section-title">{section.label}</h2>
                            <span className="showcase__component-section-count">
                                {section.components.length}
                            </span>
                        </header>
                        <div className="showcase__component-grid">
                            {section.components.map(
                                (component: ComponentRecord): ReactNode => (
                                    <a
                                        className="showcase__component-card"
                                        href={`#${component.id}`}
                                        key={component.id}
                                    >
                                        <span className="showcase__component-card-top">
                                            <span className="showcase__component-card-name">
                                                {component.name}
                                            </span>
                                            <Icon name="ArrowUpRight" size={14} />
                                        </span>
                                        <span className="showcase__component-card-description">
                                            {component.description}
                                        </span>
                                        <span className="showcase__component-card-meta">
                                            {component.demo}
                                        </span>
                                    </a>
                                ),
                            )}
                        </div>
                    </section>
                ),
            )}
        </nav>
    </Demo>
);

export default OverviewPage;
