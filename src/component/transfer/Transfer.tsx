import {
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type CSSProperties,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type MutableRefObject,
    type ReactNode,
    type Ref,
    type SetStateAction,
} from "react";
import type { IconName } from "../icon/Icon";
import Icon from "../icon/Icon";
import type { ListAdapter, ListEntry } from "../../layout/list/adapter";
import { createListAdapter } from "../../layout/list/adapter";
import Button from "../button/Button";
import Checkbox from "../input/check/Checkbox";
import Spinner from "../progress/Spinner";
import Surface from "../surface/Surface";
import cx from "../foundation/cx";
import useControllableState from "../foundation/useControllableState";
import useVirtualWindow, { type VirtualWindow } from "../foundation/useVirtualWindow";
import { useInternational, type InternationalContextValue } from "../../international";
import "./Transfer.css";

/**
 * One selectable row in a transfer list.
 * Type: interface.
 * Fields: key, label, description, icon, disabled.
 * @example
 * const item: TransferItem = { key: "mira", label: "Mira Chen" };
 */
export interface TransferItem {
    key: string;
    label: ReactNode;
    description?: string;
    icon?: IconName;
    disabled?: boolean;
}

/**
 * Props for the two-pane transfer control.
 * Type: interface.
 * Native div attributes are forwarded to the control root; `className` and `style` apply to that element.
 * Fields: items, sourceAdapter, targetAdapter, value, defaultValue, onChange, titles, searchable,
 * disabled, loading, emptySource, emptyTarget, renderItem, virtual, listHeight,
 * itemHeight, className, id, ref, and native div attributes.
 * @param items - Items offered in the source pane.
 * @param sourceAdapter - Indexed source items used instead of `items`.
 * @param targetAdapter - Indexed selected items used instead of deriving them from `value`.
 * @param value - Controlled selected keys.
 * @param defaultValue - Initial selected keys when uncontrolled.
 * @param onChange - Called with the next selected keys.
 * @param titles - Source and target pane titles.
 * @param searchable - Shows the filter field when true.
 * @param disabled - Disables selection, search, and movement.
 * @param loading - Shows a spinner in the source pane.
 * @param emptySource - Content shown when the source pane has no rows.
 * @param emptyTarget - Content shown when the target pane has no rows.
 * @param renderItem - Renders the visible label of a row.
 * @param virtual - Enables a fixed-row window over long lists.
 * @param listHeight - Maximum height of a virtual list.
 * @param itemHeight - Fixed row height used by the virtual window.
 * @param className - Extra classes for the control root.
 * @param ref - Ref to the control root.
 * @example
 * <Transfer items={people} value={selected} onChange={setSelected} />
 */
export interface TransferProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "className" | "children"> {
    items?: readonly TransferItem[];
    sourceAdapter?: ListAdapter<TransferItem>;
    targetAdapter?: ListAdapter<TransferItem>;
    value?: readonly string[];
    defaultValue?: readonly string[];
    onChange: (next: readonly string[]) => void;
    titles?: readonly [string, string];
    searchable?: boolean;
    disabled?: boolean;
    loading?: boolean;
    emptySource?: ReactNode;
    emptyTarget?: ReactNode;
    renderItem?: (item: TransferItem) => ReactNode;
    virtual?: boolean;
    listHeight?: number;
    itemHeight?: number;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Converts a node label to searchable text.
 * @param value - Label node.
 * @example
 * const text = labelText("Mira");
 * @returns Plain text, or an empty string.
 */
const labelText: (value: ReactNode) => string = (value: ReactNode): string =>
    typeof value === "string" || typeof value === "number" ? `${value}` : "";

/**
 * Props for one interactive transfer row.
 * Type: interface.
 * Fields: item, checked, disabled, onToggle, renderItem.
 * @example
 * <TransferRow item={item} checked={checked} disabled={false} onToggle={toggle} />
 */
interface TransferRowProps {
    item: TransferItem;
    checked: boolean;
    disabled: boolean;
    onToggle: () => void;
    renderItem?: (item: TransferItem) => ReactNode;
}

/**
 * Material transfer option with its own ripple and the shared Checkbox control.
 * @param props - Item, checked state, and toggle callback.
 * @example
 * <TransferRow item={item} checked={false} disabled={false} onToggle={toggle} />
 * @returns A selectable transfer row.
 */
const TransferRow: FC<TransferRowProps> = ({
    item,
    checked,
    disabled,
    onToggle,
    renderItem,
}: TransferRowProps) => {
    const { t }: InternationalContextValue = useInternational();

    return (
    <div
        className="transfer__item"
        role="option"
        aria-selected={checked}
        aria-disabled={disabled ? "true" : (void 0)}
        tabIndex={disabled ? -1 : 0}
        onClick={(event: ReactMouseEvent<HTMLDivElement>): void => {
            if ((event.target as Element).closest(".checkbox") !== null) {
                return;
            }

            if (!disabled) {
                onToggle();
            }
        }}
        onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>): void => {
            if (event.target !== event.currentTarget) {
                return;
            }

            if ((event.key === " " || event.key === "Enter") && !disabled) {
                event.preventDefault();
                onToggle();
            }
        }}
    >
        <Surface
            className="transfer__item-surface"
            stateLayer={!disabled}
            ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
            disabled={disabled}
        >
            <span className="transfer__checkbox">
                <Checkbox
                    size="sm"
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={onToggle}
                    label={<span className="visually-hidden">{t("selectItem", { item: labelText(item.label) || item.key })}</span>}
                />
            </span>
            {item.icon === (void 0) ? null : <Icon name={item.icon} size={16} />}
            <span className="transfer__copy">
                <span className="transfer__label">
                    {renderItem === (void 0) ? item.label : renderItem(item)}
                </span>
                {item.description === (void 0) ? null : (
                    <span className="transfer__description">{item.description}</span>
                )}
            </span>
        </Surface>
    </div>
    );
};

/**
 * Moves selected keys between two Material transfer panes.
 * Type: function component.
 * @param props - Items or adapters, value, and titles.
 * @example
 * <Transfer items={items} value={keys} onChange={setKeys} />
 * @returns A two-pane transfer list.
 */
const Transfer: FC<TransferProps> = ({
    items = [],
    sourceAdapter,
    targetAdapter,
    value,
    defaultValue,
    onChange,
    titles,
    searchable = true,
    disabled = false,
    loading = false,
    emptySource,
    emptyTarget,
    renderItem,
    virtual = false,
    listHeight = 260,
    itemHeight = 48,
    className = "",
    style,
    ref,
    ...rest
}: TransferProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedTitles: readonly [string, string] = titles ?? [t("available"), t("selected")];
    const resolvedEmptySource: ReactNode = emptySource ?? t("nothingAvailable");
    const resolvedEmptyTarget: ReactNode = emptyTarget ?? t("nothingSelected");
    const [selectedKeys, setSelectedKeys]: readonly [
        readonly string[],
        (next: readonly string[] | ((previous: readonly string[]) => readonly string[])) => void,
    ] = useControllableState<readonly string[]>({
        value,
        defaultValue: defaultValue ?? [],
        onChange,
    });
    const source: ListAdapter<TransferItem> = useMemo((): ListAdapter<TransferItem> => {
        if (sourceAdapter !== (void 0)) {
            return sourceAdapter;
        }

        return createListAdapter<TransferItem>(items, {
            getKey: (item: TransferItem): string => item.key,
        });
    }, [sourceAdapter, items]);
    const targetItems: readonly TransferItem[] = useMemo((): readonly TransferItem[] => {
        if (targetAdapter !== (void 0)) {
            return targetAdapter
                .getRange(0, targetAdapter.size)
                .map((entry: ListEntry<TransferItem>): TransferItem => entry.item);
        }

        const byKey: Map<string, TransferItem> = new Map<string, TransferItem>();

        for (const entry of source.getRange(0, source.size)) {
            byKey.set(entry.key, entry.item);
        }

        return selectedKeys
            .map((key: string): TransferItem | null => byKey.get(key) ?? null)
            .filter((item: TransferItem | null): item is TransferItem => item !== null);
    }, [source, targetAdapter, selectedKeys]);
    const [sourceChecked, setSourceChecked]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(new Set<string>());
    const [targetChecked, setTargetChecked]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(new Set<string>());
    const [query, setQuery]: [string, Dispatch<SetStateAction<string>>] = useState<string>("");
    const selected: ReadonlySet<string> = useMemo(
        (): ReadonlySet<string> => new Set<string>(selectedKeys),
        [selectedKeys],
    );
    const normalizedQuery: string = query.trim().toLowerCase();
    const sourceRows: readonly ListEntry<TransferItem>[] = source
        .getRange(0, source.size)
        .filter((entry: ListEntry<TransferItem>): boolean => !selected.has(entry.key))
        .filter(
            (entry: ListEntry<TransferItem>): boolean =>
                normalizedQuery.length === 0 ||
                labelText(entry.item.label).toLowerCase().includes(normalizedQuery),
        );
    const targetRows: readonly TransferItem[] = targetItems.filter(
        (item: TransferItem): boolean =>
            normalizedQuery.length === 0 ||
            labelText(item.label).toLowerCase().includes(normalizedQuery),
    );
    const {
        attachViewport: attachSourceViewport,
        start: sourceWindowStart,
        end: sourceWindowEnd,
        onScroll: onSourceScroll,
        scrollToIndex: scrollSourceTo,
    }: VirtualWindow = useVirtualWindow({
        count: sourceRows.length,
        itemHeight,
        fallbackHeight: listHeight,
        overscan: 2,
        resetKey: loading,
    });
    const {
        attachViewport: attachTargetViewport,
        start: targetWindowStart,
        end: targetWindowEnd,
        onScroll: onTargetScroll,
        scrollToIndex: scrollTargetTo,
    }: VirtualWindow = useVirtualWindow({
        count: targetRows.length,
        itemHeight,
        fallbackHeight: listHeight,
        overscan: 2,
        resetKey: loading,
    });
    const previousQueryRef: MutableRefObject<string> = useRef<string>(normalizedQuery);
    const sourceStart: number = virtual ? sourceWindowStart : 0;
    const sourceEnd: number = virtual ? sourceWindowEnd : sourceRows.length;
    const targetStart: number = virtual ? targetWindowStart : 0;
    const targetEnd: number = virtual ? targetWindowEnd : targetRows.length;
    const visibleSourceRows: readonly ListEntry<TransferItem>[] = sourceRows.slice(
        sourceStart,
        sourceEnd,
    );
    const visibleTargetRows: readonly TransferItem[] = targetRows.slice(
        targetStart,
        targetEnd,
    );

    useLayoutEffect((): void => {
        if (!virtual || previousQueryRef.current === normalizedQuery) {
            return;
        }

        previousQueryRef.current = normalizedQuery;
        scrollSourceTo(0, "start");
        scrollTargetTo(0, "start");
    }, [normalizedQuery, scrollSourceTo, scrollTargetTo, virtual]);

    const toggle: (
        current: ReadonlySet<string>,
        key: string,
        set: Dispatch<SetStateAction<ReadonlySet<string>>>,
    ) => void = (
        current: ReadonlySet<string>,
        key: string,
        set: Dispatch<SetStateAction<ReadonlySet<string>>>,
    ): void => {
        const next: Set<string> = new Set<string>(current);

        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }

        set(next);
    };

    const moveRight: () => void = (): void => {
        const next: Set<string> = new Set<string>(selectedKeys);

        for (const key of sourceChecked) {
            next.add(key);
        }

        setSelectedKeys([...next]);
        setSourceChecked(new Set<string>());
    };

    const moveLeft: () => void = (): void => {
        setSelectedKeys(selectedKeys.filter((key: string): boolean => !targetChecked.has(key)));
        setTargetChecked(new Set<string>());
    };

    const moveAllRight: () => void = (): void => {
        const next: Set<string> = new Set<string>(selectedKeys);

        for (const entry of sourceRows) {
            if (!entry.item.disabled) {
                next.add(entry.key);
            }
        }

        setSelectedKeys([...next]);
        setSourceChecked(new Set<string>());
    };

    const moveAllLeft: () => void = (): void => {
        setSelectedKeys([]);
        setTargetChecked(new Set<string>());
    };

    const sourceHeaderId: string = "transfer-source-title";
    const targetHeaderId: string = "transfer-target-title";

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("transfer", className)}
            style={style}
            data-disabled={disabled ? "true" : "false"}
        >
            <section className="transfer__pane" aria-labelledby={sourceHeaderId}>
                <header className="transfer__header">
                    <h3 className="transfer__title" id={sourceHeaderId}>
                        {resolvedTitles[0]}
                    </h3>
                    <span className="transfer__count">{sourceRows.length}</span>
                </header>

                {searchable ? (
                    <label className="transfer__search">
                        <Icon name="Search" size={16} />
                        <input
                            className="transfer__search-input"
                            type="search"
                            value={query}
                            placeholder={t("search")}
                            disabled={disabled || loading}
                            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
                                setQuery(event.target.value)
                            }
                        />
                    </label>
                ) : null}

                <div
                    ref={virtual ? attachSourceViewport : (void 0)}
                    className={cx("transfer__list", virtual && "transfer__list--virtual")}
                    role="listbox"
                    aria-multiselectable="true"
                    aria-labelledby={sourceHeaderId}
                    style={
                        virtual
                            ? ({
                                  maxHeight: listHeight,
                                  minHeight: listHeight,
                                  "--transfer-item-height": `${itemHeight}px`,
                              } as CSSProperties)
                            : (void 0)
                    }
                    onScroll={virtual ? onSourceScroll : (void 0)}
                >
                    {loading ? (
                        <div className="transfer__empty">
                            <Spinner size="sm" />
                        </div>
                    ) : sourceRows.length === 0 ? (
                        <div className="transfer__empty">{resolvedEmptySource}</div>
                    ) : (
                        <>
                            {virtual && sourceStart > 0 ? (
                                <div
                                    aria-hidden="true"
                                    style={{ height: sourceStart * itemHeight, flex: "none" }}
                                />
                            ) : null}
                            {visibleSourceRows.map(
                                (entry: ListEntry<TransferItem>): ReactNode => (
                                    <TransferRow
                                        key={entry.key}
                                        item={entry.item}
                                        checked={sourceChecked.has(entry.key)}
                                        disabled={disabled || entry.item.disabled === true}
                                        renderItem={renderItem}
                                        onToggle={(): void =>
                                            toggle(sourceChecked, entry.key, setSourceChecked)
                                        }
                                    />
                                ),
                            )}
                            {virtual && sourceEnd < sourceRows.length ? (
                                <div
                                    aria-hidden="true"
                                    style={{
                                        height: (sourceRows.length - sourceEnd) * itemHeight,
                                        flex: "none",
                                    }}
                                />
                            ) : null}
                        </>
                    )}
                </div>
            </section>

            <div className="transfer__controls">
                <Button
                    variant="outline"
                    size="sm"
                    aria-label={t("moveSelectedTo", { target: resolvedTitles[1] })}
                    disabled={disabled || sourceChecked.size === 0}
                    onClick={moveRight}
                >
                    <Icon name="ChevronRight" size={16} />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    aria-label={t("moveSelectedTo", { target: resolvedTitles[0] })}
                    disabled={disabled || targetChecked.size === 0}
                    onClick={moveLeft}
                >
                    <Icon name="ChevronLeft" size={16} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("moveAllTo", { target: resolvedTitles[1] })}
                    disabled={disabled || sourceRows.length === 0}
                    onClick={moveAllRight}
                >
                    {t("all")}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("moveAllTo", { target: resolvedTitles[0] })}
                    disabled={disabled || targetRows.length === 0}
                    onClick={moveAllLeft}
                >
                    {t("none")}
                </Button>
            </div>

            <section className="transfer__pane" aria-labelledby={targetHeaderId}>
                <header className="transfer__header">
                    <h3 className="transfer__title" id={targetHeaderId}>
                        {resolvedTitles[1]}
                    </h3>
                    <span className="transfer__count">{targetRows.length}</span>
                </header>

                <div
                    ref={virtual ? attachTargetViewport : (void 0)}
                    className={cx("transfer__list", virtual && "transfer__list--virtual")}
                    role="listbox"
                    aria-multiselectable="true"
                    aria-labelledby={targetHeaderId}
                    style={
                        virtual
                            ? ({
                                  maxHeight: listHeight,
                                  minHeight: listHeight,
                                  "--transfer-item-height": `${itemHeight}px`,
                              } as CSSProperties)
                            : (void 0)
                    }
                    onScroll={virtual ? onTargetScroll : (void 0)}
                >
                    {targetRows.length === 0 ? (
                        <div className="transfer__empty">{resolvedEmptyTarget}</div>
                    ) : (
                        <>
                            {virtual && targetStart > 0 ? (
                                <div
                                    aria-hidden="true"
                                    style={{ height: targetStart * itemHeight, flex: "none" }}
                                />
                            ) : null}
                            {visibleTargetRows.map((item: TransferItem): ReactNode => (
                                <TransferRow
                                    key={item.key}
                                    item={item}
                                    checked={targetChecked.has(item.key)}
                                    disabled={disabled}
                                    renderItem={renderItem}
                                    onToggle={(): void =>
                                        toggle(targetChecked, item.key, setTargetChecked)
                                    }
                                />
                            ))}
                            {virtual && targetEnd < targetRows.length ? (
                                <div
                                    aria-hidden="true"
                                    style={{
                                        height: (targetRows.length - targetEnd) * itemHeight,
                                        flex: "none",
                                    }}
                                />
                            ) : null}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Transfer;
