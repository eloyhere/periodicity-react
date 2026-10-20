import { useMemo, useState, type Dispatch, type FC, type ReactNode, type SetStateAction } from "react";
import { createListAdapter, type ListAdapter } from "../../layout/list/adapter";
import cx from "../foundation/cx";
import Icon, { type IconName } from "../icon/Icon";
import Surface from "../surface/Surface";
import Text from "../text/Text";
import "./Breadcrumbs.css";

/**
 * A single crumb in a breadcrumb trail.
 * Type: interface.
 * Fields:
 * - `label`: Visible crumb text.
 * - `href`: Optional link target; a button is rendered when omitted.
 * - `onClick`: Optional activation handler.
 * - `icon`: Optional leading icon.
 * @example
 * const item: BreadcrumbItem = { label: "Library", href: "/library" };
 */
export interface BreadcrumbItem {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: IconName;
}

/**
 * Props for the Breadcrumbs component.
 * Type: interface.
 * Fields:
 * - `items`: Crumbs from the root to the current page.
 * - `separator`: Decorative separator between crumbs.
 * - `maxItems`: Maximum visible crumbs before collapsing; omitted means never collapse.
 * - `className`: Extra class names for the navigation element.
 * @example
 * <Breadcrumbs items={items} maxItems={4} />
 */
export interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    separator?: ReactNode;
    maxItems?: number;
    className?: string;
}

/**
 * A rendered slot in the trail: either a crumb or the expandable ellipsis.
 * Type: type alias.
 * Fields:
 * - `kind`: Discriminator for the slot.
 * - `index`: Source crumb index; only present when `kind` is `item`.
 * @example
 * const slot: BreadcrumbSlot = { kind: "ellipsis" };
 */
type BreadcrumbSlot = { readonly kind: "item"; readonly index: number } | { readonly kind: "ellipsis" };

/**
 * Renders a breadcrumb trail with an expandable ellipsis for long paths.
 * @param props - Crumbs, separator, collapse limit, and class name.
 * @example
 * <Breadcrumbs items={items} maxItems={4} />
 * @returns A labelled navigation landmark containing an ordered list.
 */
const Breadcrumbs: FC<BreadcrumbsProps> = ({
    items,
    separator,
    maxItems,
    className = "",
}: BreadcrumbsProps): ReactNode => {
    const adapter: ListAdapter<BreadcrumbItem> = useMemo<ListAdapter<BreadcrumbItem>>(
        () => createListAdapter<BreadcrumbItem>(items),
        [items],
    );
    const [expanded, setExpanded]: readonly [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const resolvedMaxItems: number = maxItems ?? items.length;
    const isCollapsible: boolean = maxItems !== (void 0) && resolvedMaxItems >= 3 && items.length > resolvedMaxItems;
    const slots: readonly BreadcrumbSlot[] = useMemo<readonly BreadcrumbSlot[]>(() => {
        const allSlots: BreadcrumbSlot[] = [];

        for (let index: number = 0; index < items.length; index += 1) {
            allSlots.push({ kind: "item", index });
        }

        if (!isCollapsible || expanded) {
            return allSlots;
        }

        const tailCount: number = resolvedMaxItems - 2;
        const tailStart: number = items.length - tailCount;
        const collapsedSlots: BreadcrumbSlot[] = [{ kind: "item", index: 0 }, { kind: "ellipsis" }];

        for (let index: number = tailStart; index < items.length; index += 1) {
            collapsedSlots.push({ kind: "item", index });
        }

        return collapsedSlots;
    }, [expanded, isCollapsible, items.length, resolvedMaxItems]);
    const separatorNode: ReactNode =
        separator === (void 0) ? (
            <Icon className="breadcrumbs__separator-icon" name="ChevronRight" size={14} />
        ) : (
            separator
        );

    return (
        <nav className={cx("breadcrumbs", className)} aria-label="Breadcrumb">
            <ol className="breadcrumbs__list">
                {slots.map((slot: BreadcrumbSlot, slotIndex: number): ReactNode => {
                    const isLast: boolean = slotIndex === slots.length - 1;

                    if (slot.kind === "ellipsis") {
                        return (
                            <li key="breadcrumbs-ellipsis" className="breadcrumbs__item">
                                <Surface
                                    className="breadcrumbs__surface"
                                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                                >
                                    <button
                                        type="button"
                                        className="breadcrumbs__ellipsis"
                                        aria-label="Show all breadcrumbs"
                                        onClick={(): void => {
                                            setExpanded(true);
                                        }}
                                    >
                                        <Icon name="Dots" size={16} />
                                    </button>
                                </Surface>
                                <span className="breadcrumbs__separator" aria-hidden="true">
                                    {separatorNode}
                                </span>
                            </li>
                        );
                    }

                    const item: BreadcrumbItem = adapter.getItem(slot.index);
                    const isCurrent: boolean = slot.index === items.length - 1;
                    const iconNode: ReactNode = item.icon ? (
                        <Icon className="breadcrumbs__icon" name={item.icon} size={14} />
                    ) : null;
                    const labelNode: ReactNode = (
                        <Text
                            as="span"
                            variant="body-sm"
                            tone={isCurrent ? "default" : "muted"}
                            className="breadcrumbs__text"
                        >
                            {item.label}
                        </Text>
                    );
                    let crumb: ReactNode;

                    if (isCurrent) {
                        crumb = (
                            <span className="breadcrumbs__current" aria-current="page">
                                {iconNode}
                                {labelNode}
                            </span>
                        );
                    } else if (item.href) {
                        crumb = (
                            <Surface
                                className="breadcrumbs__surface"
                                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                            >
                                <a
                                    className="breadcrumbs__link"
                                    href={item.href}
                                    onClick={(): void => {
                                        item.onClick?.();
                                    }}
                                >
                                    {iconNode}
                                    {labelNode}
                                </a>
                            </Surface>
                        );
                    } else if (item.onClick) {
                        crumb = (
                            <Surface
                                className="breadcrumbs__surface"
                                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                            >
                                <button
                                    type="button"
                                    className="breadcrumbs__link"
                                    onClick={(): void => {
                                        item.onClick?.();
                                    }}
                                >
                                    {iconNode}
                                    {labelNode}
                                </button>
                            </Surface>
                        );
                    } else {
                        crumb = (
                            <span className="breadcrumbs__label">
                                {iconNode}
                                {labelNode}
                            </span>
                        );
                    }

                    return (
                        <li key={adapter.getKey(slot.index)} className="breadcrumbs__item">
                            {crumb}
                            {isLast ? null : (
                                <span className="breadcrumbs__separator" aria-hidden="true">
                                    {separatorNode}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
