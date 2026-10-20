import { useState, type ChangeEvent, type Dispatch, type FC, type ReactNode, type SetStateAction } from "react";
import { Chip } from "../../../component";
import Icon from "../../../component/icon/Icon";
import type { IconName } from "../../../component/icon/Icon";
import { useToast } from "../../../component/toast/ToastContext";
import type { ToastApi } from "../../../component/toast/ToastContext";
import Demo from "../../Demo";
import { iconCatalog, iconCategories, type IconCatalogEntry } from "../../iconCatalog";
import "../../Foundations.css";

const iconSizes: ReadonlyArray<number> = [16, 20, 24, 32];

const iconSizesCode: string = `<Icon name="Sparkle" size={16} />
<Icon name="Sparkle" size={20} />
<Icon name="Sparkle" size={24} />
<Icon name="Sparkle" size={32} />`;

const iconCatalogueCode: string = `<input
    type="search"
    value={iconQuery}
    onChange={(event) => setIconQuery(event.target.value)}
    aria-label="Search icons"
/>

{visibleIcons.map((entry) => (
    <button key={entry.name} onClick={() => copyIcon(entry.name)}>
        <Icon name={entry.name} size={22} />
        <span>{entry.name}</span>
        <span>{entry.category}</span>
    </button>
))}`;

const iconCatalogueNote: string = [
    `${iconCatalog.length} icons across ${iconCategories.length} categories.`,
    "Search or filter, then click a tile to copy its name.",
].join(" ");

/**
 * Documents the icon sizes and the searchable icon catalogue.
 * Clicking a tile copies the icon name and shows a toast confirmation.
 * @example
 * <IconsPage />
 * @returns The Icons entry.
 */
const IconsPage: FC = () => {
    const toast: ToastApi = useToast();
    const [iconQuery, setIconQuery]: [string, Dispatch<SetStateAction<string>>] = useState<string>("");
    const [iconCategory, setIconCategory]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("All");
    const normalisedQuery: string = iconQuery.trim().toLowerCase();
    const visibleIcons: IconCatalogEntry[] = iconCatalog.filter(
        (entry: IconCatalogEntry): boolean =>
            (iconCategory === "All" || entry.category === iconCategory) &&
            (normalisedQuery.length === 0 || entry.name.toLowerCase().includes(normalisedQuery)),
    );

    const copyIcon: (name: IconName) => void = (name: IconName): void => {
        void navigator.clipboard?.writeText(name);
        toast.show({ title: `${name} copied` });
    };

    return (
        <>
            <Demo
                title="Icon sizes"
                description="Icons inherit the current text colour and are drawn on the 24px view box."
                code={iconSizesCode}
                layout="row"
            >
                <div className="foundation-icon-sizes">
                    {iconSizes.map((size: number): ReactNode => (
                        <span className="foundation-icon-size" key={size}>
                            <Icon name="Sparkle" size={size} />
                            <code>{size}px</code>
                        </span>
                    ))}
                </div>
            </Demo>

            <Demo
                title="Icon catalogue"
                description={iconCatalogueNote}
                code={iconCatalogueCode}
            >
                <div className="foundation-icons">
                    <div className="foundation-icons__toolbar">
                        <label className="foundation-icons__search">
                            <Icon name="Search" size={16} />
                            <input
                                type="search"
                                value={iconQuery}
                                placeholder="Search icons"
                                aria-label="Search icons"
                                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                    setIconQuery(event.target.value)
                                }
                            />
                        </label>
                        <span className="foundation-icons__count">{visibleIcons.length} shown</span>
                    </div>
                    <div className="foundation-icons__filters">
                        <Chip
                            label="All"
                            variant="filter"
                            selected={iconCategory === "All"}
                            onClick={(): void => setIconCategory("All")}
                        />
                        {iconCategories.map((category: string): ReactNode => (
                            <Chip
                                key={category}
                                label={category}
                                variant="filter"
                                selected={iconCategory === category}
                                onClick={(): void => setIconCategory(category)}
                            />
                        ))}
                    </div>
                    <div className="foundation-icons__grid">
                        {visibleIcons.map((entry: IconCatalogEntry): ReactNode => (
                            <button
                                key={`${entry.category}-${entry.name}`}
                                type="button"
                                className="foundation-icon"
                                title={`${entry.category} / ${entry.name}`}
                                onClick={(): void => copyIcon(entry.name)}
                            >
                                <span className="foundation-icon__glyph">
                                    <Icon name={entry.name} size={22} />
                                </span>
                                <span className="foundation-icon__name">{entry.name}</span>
                                <span className="foundation-icon__category">{entry.category}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </Demo>
        </>
    );
};

export default IconsPage;
