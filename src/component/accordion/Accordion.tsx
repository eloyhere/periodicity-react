import {
    useCallback,
    useId,
    useMemo,
    useRef,
    type FC,
    type KeyboardEvent,
    type MutableRefObject,
    type ReactNode,
} from "react";
import { createListAdapter, type ListAdapter, type ListEntry } from "../../layout/list/adapter";
import cx from "../foundation/cx";
import useControllableState, { type Updater } from "../foundation/useControllableState";
import Icon, { type IconName } from "../icon/Icon";
import Surface from "../surface/Surface";
import "./Accordion.css";

/**
 * A single accordion section.
 * Type: interface.
 * Fields:
 * - `value`: Stable identifier used by the controlled value list.
 * - `title`: Content rendered inside the section heading.
 * - `content`: Content revealed while the section is expanded.
 * - `icon`: Optional leading icon shown in the heading.
 * - `disabled`: Whether the section can be toggled.
 * @example
 * const item: AccordionItem = { value: "setup", title: "Setup", content: "..." };
 */
export interface AccordionItem {
    value: string;
    title: ReactNode;
    content: ReactNode;
    icon?: IconName;
    disabled?: boolean;
}

/**
 * Props for the Accordion component.
 * Type: interface.
 * Fields:
 * - `items`: Sections in display order.
 * - `value`: Controlled list of expanded values.
 * - `defaultValue`: Uncontrolled initial list of expanded values.
 * - `onValueChange`: Called with the next expanded value list.
 * - `multiple`: Whether several sections may be open at once.
 * - `variant`: Visual treatment; defaults to `default`.
 * - `className`: Extra class names for the root element.
 * @example
 * <Accordion items={items} defaultValue={["setup"]} multiple />
 */
export interface AccordionProps {
    items: AccordionItem[];
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (values: string[]) => void;
    multiple?: boolean;
    variant?: "default" | "contained";
    className?: string;
}

/**
 * Finds the next enabled heading in a direction, wrapping at both ends.
 * @param items - Accordion sections in display order.
 * @param from - Index of the heading that received the key.
 * @param step - `1` for the next heading, `-1` for the previous one.
 * @example
 * const next: number = findAdjacentEnabled(items, 0, 1);
 * @returns The enabled index, or `-1` when no section is enabled.
 */
const findAdjacentEnabled: (items: readonly AccordionItem[], from: number, step: 1 | -1) => number = (
    items: readonly AccordionItem[],
    from: number,
    step: 1 | -1,
): number => {
    for (let offset: number = 1; offset <= items.length; offset += 1) {
        const candidate: number = (((from + step * offset) % items.length) + items.length) % items.length;

        if (!items[candidate].disabled) {
            return candidate;
        }
    }

    return -1;
};

/**
 * Finds the first or last enabled heading.
 * @param items - Accordion sections in display order.
 * @param fromEnd - Whether to search from the end.
 * @example
 * const first: number = findEdgeEnabled(items, false);
 * @returns The enabled index, or `-1` when no section is enabled.
 */
const findEdgeEnabled: (items: readonly AccordionItem[], fromEnd: boolean) => number = (
    items: readonly AccordionItem[],
    fromEnd: boolean,
): number => {
    for (let offset: number = 0; offset < items.length; offset += 1) {
        const candidate: number = fromEnd ? items.length - 1 - offset : offset;

        if (!items[candidate].disabled) {
            return candidate;
        }
    }

    return -1;
};

/**
 * Renders collapsible sections with heading buttons, regions, and a rotating chevron.
 * @param props - Sections, expanded values, multi-open flag, variant, and change handler.
 * @example
 * <Accordion items={items} defaultValue={["setup"]} />
 * @returns The accordion root element.
 */
const Accordion: FC<AccordionProps> = ({
    items,
    value,
    defaultValue,
    onValueChange,
    multiple = false,
    variant = "default",
    className = "",
}: AccordionProps): ReactNode => {
    const baseId: string = useId();
    const adapter: ListAdapter<AccordionItem> = useMemo<ListAdapter<AccordionItem>>(
        () => createListAdapter<AccordionItem>(items, { getKey: (item: AccordionItem): string => item.value }),
        [items],
    );
    const entries: readonly ListEntry<AccordionItem>[] = useMemo<readonly ListEntry<AccordionItem>[]>(
        () => adapter.getRange(0, adapter.size),
        [adapter],
    );
    const [currentValues, setCurrentValues]: readonly [string[], (next: Updater<string[]>) => void] =
        useControllableState<string[]>({
            value,
            defaultValue: defaultValue ?? [],
            onChange: onValueChange,
        });
    const expandedValues: ReadonlySet<string> = useMemo<ReadonlySet<string>>(
        () => new Set<string>(currentValues),
        [currentValues],
    );
    const triggerRefs: MutableRefObject<(HTMLButtonElement | null)[]> = useRef<(HTMLButtonElement | null)[]>([]);

    const toggleSection: (sectionValue: string) => void = useCallback(
        (sectionValue: string): void => {
            const isExpanded: boolean = expandedValues.has(sectionValue);
            let nextValues: string[];

            if (multiple) {
                nextValues = isExpanded
                    ? currentValues.filter((entry: string): boolean => entry !== sectionValue)
                    : [...currentValues, sectionValue];
            } else {
                nextValues = isExpanded ? [] : [sectionValue];
            }

            setCurrentValues(nextValues);
        },
        [currentValues, expandedValues, multiple, setCurrentValues],
    );

    const handleTriggerKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void = (
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ): void => {
        let targetIndex: number;

        if (event.key === "ArrowDown") {
            targetIndex = findAdjacentEnabled(items, index, 1);
        } else if (event.key === "ArrowUp") {
            targetIndex = findAdjacentEnabled(items, index, -1);
        } else if (event.key === "Home") {
            targetIndex = findEdgeEnabled(items, false);
        } else if (event.key === "End") {
            targetIndex = findEdgeEnabled(items, true);
        } else {
            return;
        }

        if (targetIndex < 0) {
            return;
        }

        event.preventDefault();

        if (targetIndex !== index) {
            triggerRefs.current[targetIndex]?.focus();
        }
    };

    return (
        <Surface className={cx("accordion", `accordion--${variant}`, className)} contentClassName="accordion__body">
            {entries.map((entry: ListEntry<AccordionItem>): ReactNode => {
                const item: AccordionItem = entry.item;
                const isExpanded: boolean = expandedValues.has(item.value);
                const triggerId: string = `${baseId}-trigger-${entry.index}`;
                const panelId: string = `${baseId}-panel-${entry.index}`;

                return (
                    <div key={entry.key} className="accordion__item">
                        <Surface
                            className="accordion__surface"
                            disabled={item.disabled}
                            ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                        >
                            <h3 className="accordion__heading">
                                <button
                                    ref={(node: HTMLButtonElement | null): void => {
                                        triggerRefs.current[entry.index] = node;
                                    }}
                                    type="button"
                                    id={triggerId}
                                    className="accordion__trigger"
                                    aria-expanded={isExpanded}
                                    aria-controls={panelId}
                                    disabled={item.disabled}
                                    onClick={(): void => {
                                        toggleSection(item.value);
                                    }}
                                    onKeyDown={(event: KeyboardEvent<HTMLButtonElement>): void => {
                                        handleTriggerKeyDown(event, entry.index);
                                    }}
                                >
                                    {item.icon ? (
                                        <Icon className="accordion__icon" name={item.icon} size={16} />
                                    ) : null}
                                    <span className="accordion__title">{item.title}</span>
                                    <Icon className="accordion__chevron" name="ChevronDown" size={16} />
                                </button>
                            </h3>
                        </Surface>
                        <div
                            id={panelId}
                            role="region"
                            aria-labelledby={triggerId}
                            className="accordion__panel"
                            hidden={!isExpanded}
                        >
                            <div className="accordion__content">{item.content}</div>
                        </div>
                    </div>
                );
            })}
        </Surface>
    );
};

export default Accordion;
