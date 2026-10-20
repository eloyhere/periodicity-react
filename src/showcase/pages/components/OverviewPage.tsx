import type { FC, ReactNode } from "react";
import Icon from "../../../component/icon/Icon";
import Demo from "../../Demo";
import { componentIndex } from "../../samples";

const indexCode: string = `{componentIndex.map(([name, entry]) => (
    <a key={name} href={\`#\${entry}\`}>
        <Icon name="ArrowUpRight" size={14} />
        {name}
    </a>
))}`;

/**
 * Lists every public component and links to the entry that documents it.
 * @example
 * <OverviewPage />
 * @returns The Overview entry.
 */
const OverviewPage: FC = () => (
    <Demo
        title="Component index"
        description={`${componentIndex.length} public building blocks, each linked to its own entry.`}
        code={indexCode}
    >
        <div className="showcase__index-grid">
            {componentIndex.map(([name, entry]: readonly [string, string]): ReactNode => (
                <a className="showcase__index-link" href={`#${entry}`} key={name}>
                    <Icon name="ArrowUpRight" size={14} />
                    {name}
                </a>
            ))}
        </div>
    </Demo>
);

export default OverviewPage;
