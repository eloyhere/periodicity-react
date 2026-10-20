import {
    useId,
    useMemo,
    useState,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactElement,
    type ReactNode,
    type Ref,
    type RefCallback,
    type UIEvent,
    type UIEventHandler,
} from "react";
import type { ListAdapter, ListEntry } from "../list/adapter";
import { createListAdapter } from "../list/adapter";
import { composeRefs } from "../list/refs";
import Checkbox from "../../component/input/check/Checkbox";
import Spinner from "../../component/progress/Spinner";
import cx from "../../component/foundation/cx";
import useVirtualWindow, { type VirtualWindow } from "../../component/foundation/useVirtualWindow";
import "./Table.css";

/**
 * One table column definition.
 * Type: interface.
 * Fields: id, header, cell, align, width, rowHeader.
 * Set `rowHeader` on a column whose cells identify the row, so its body cells render as
 * `<th scope="row">` instead of `<td>`.
 * @example
 * const column: TableColumn<Person> = { id: "name", header: "Name", cell: (person) => person.name };
 */
export interface TableColumn<Row> {
    id: string;
    header: ReactNode;
    cell: (row: Row, index: number) => ReactNode;
    align?: "start" | "center" | "end";
    width?: number | string;
    rowHeader?: boolean;
}

/**
 * Props for the adapter-backed table.
 * Type: interface.
 * Fields: columns, rows, adapter, rowKey, caption, density, striped, hover, selectable,
 * disabled, isRowDisabled, selectedKeys, defaultSelectedKeys, onSelectionChange, onRowClick,
 * onRowDoubleClick, loading, loadingLabel, empty, virtual, height, rowHeight, viewportRef,
 * ref, and native `div` attributes.
 * Native `id`, `className`, `style`, `title`, `tabIndex`, `role`, `aria-*`, `data-*`, pointer,
 * mouse, keyboard, and focus handlers are forwarded to the table wrapper. `aria-label` and
 * `aria-labelledby` name the `<table>` element itself; when neither is supplied, the caption
 * becomes the accessible name. Sorting is not implemented, so no `aria-sort` is emitted.
 * @example
 * <Table columns={columns} rows={people} caption="Team" aria-label="Team members" />
 */
export interface TableProps<Row> extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    columns: readonly TableColumn<Row>[];
    rows?: readonly Row[];
    adapter?: ListAdapter<Row>;
    rowKey?: (row: Row, index: number) => string;
    caption?: ReactNode;
    density?: "compact" | "standard";
    striped?: boolean;
    hover?: boolean;
    selectable?: boolean;
    disabled?: boolean;
    isRowDisabled?: (row: Row, key: string) => boolean;
    selectedKeys?: readonly string[];
    defaultSelectedKeys?: readonly string[];
    onSelectionChange?: (keys: readonly string[], rows: readonly Row[]) => void;
    onRowClick?: (row: Row, key: string) => void;
    onRowDoubleClick?: (row: Row, key: string) => void;
    loading?: boolean;
    loadingLabel?: string;
    empty?: ReactNode;
    virtual?: boolean;
    height?: number;
    rowHeight?: number;
    viewportRef?: Ref<HTMLDivElement>;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a semantic Material table with selection, adapter-backed rows, optional
 * virtualisation, loading and empty states, and native `div` pass-through for
 * attributes, events, and refs.
 * @param props - Columns, rows or adapter, density, selection, and native attributes.
 * @example
 * <Table columns={columns} rows={people} selectedKeys={keys} onSelectionChange={setKeys} />
 * @returns A table element.
 */
const Table: <Row>(props: TableProps<Row>) => ReactElement = <Row,>({
    columns,
    rows = [],
    adapter,
    rowKey,
    caption,
    density = "standard",
    striped = false,
    hover = true,
    selectable = true,
    disabled = false,
    isRowDisabled,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    onRowClick,
    onRowDoubleClick,
    loading = false,
    loadingLabel = "Loading",
    empty = "No rows",
    virtual = false,
    height = 360,
    rowHeight,
    viewportRef,
    className = "",
    style,
    ref,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    onScroll,
    ...rest
}: TableProps<Row>): ReactElement => {
    const captionId: string = useId();
    const list: ListAdapter<Row> = useMemo((): ListAdapter<Row> => {
        if (adapter !== (void 0)) {
            return adapter;
        }

        return createListAdapter<Row>(rows, {
            getKey: (row: Row, index: number): string =>
                rowKey === (void 0) ? `${index}` : rowKey(row, index),
        });
    }, [adapter, rows, rowKey]);
    const [internalSelected, setInternalSelected]: [
        ReadonlySet<string>,
        (next: ReadonlySet<string>) => void,
    ] = useState<ReadonlySet<string>>(new Set<string>(defaultSelectedKeys ?? []));
    const selected: ReadonlySet<string> =
        selectedKeys === (void 0) ? internalSelected : new Set<string>(selectedKeys);
    const entries: readonly ListEntry<Row>[] = list.getRange(0, list.size);
    const resolvedRowHeight: number = rowHeight ?? (density === "compact" ? 40 : 52);
    const columnCount: number = selectable ? columns.length + 1 : columns.length;
    const {
        attachViewport,
        start: windowStart,
        end: windowEnd,
        onScroll: handleVirtualScroll,
    }: VirtualWindow = useVirtualWindow({
        count: entries.length,
        itemHeight: resolvedRowHeight,
        fallbackHeight: height,
        overscan: 2,
        resetKey: loading,
    });
    const start: number = virtual ? windowStart : 0;
    const end: number = virtual ? windowEnd : entries.length;
    const visibleEntries: readonly ListEntry<Row>[] = entries.slice(start, end);
    const mergedViewportRef: RefCallback<HTMLDivElement> = useMemo(
        (): RefCallback<HTMLDivElement> =>
            composeRefs<HTMLDivElement>([virtual ? attachViewport : (void 0), viewportRef]),
        [virtual, attachViewport, viewportRef],
    );
    const handleScroll: UIEventHandler<HTMLDivElement> = (event: UIEvent<HTMLDivElement>): void => {
        if (virtual) {
            handleVirtualScroll(event);
        }

        onScroll?.(event);
    };
    const resolveRowDisabled: (row: Row, key: string) => boolean = (row: Row, key: string): boolean =>
        disabled || isRowDisabled?.(row, key) === true;
    const allSelected: boolean =
        entries.length > 0 &&
        entries.every((entry: ListEntry<Row>): boolean => selected.has(entry.key));
    const someSelected: boolean =
        !allSelected && entries.some((entry: ListEntry<Row>): boolean => selected.has(entry.key));
    const tableLabelledBy: string | undefined =
        ariaLabel === (void 0) && ariaLabelledBy === (void 0) && caption !== (void 0)
            ? captionId
            : ariaLabelledBy;

    const setSelection: (next: ReadonlySet<string>) => void = (next: ReadonlySet<string>): void => {
        if (selectedKeys === (void 0)) {
            setInternalSelected(next);
        }

        const selectedRows: Row[] = [...next]
            .map((key: string): Row | null => {
                const index: number = list.indexOf(key);
                return index === -1 ? null : list.getItem(index);
            })
            .filter((row: Row | null): row is Row => row !== null);
        onSelectionChange?.([...next], selectedRows);
    };

    const toggleRow: (key: string) => void = (key: string): void => {
        const next: Set<string> = new Set<string>(selected);

        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }

        setSelection(next);
    };

    const toggleAll: () => void = (): void => {
        if (allSelected) {
            setSelection(new Set<string>());
            return;
        }

        setSelection(new Set<string>(entries.map((entry: ListEntry<Row>): string => entry.key)));
    };

    return (
        <div
            {...rest}
            ref={ref}
            className={cx(
                "table",
                `table--${density}`,
                striped && "table--striped",
                virtual && "table--virtual",
                disabled && "table--disabled",
                className,
            )}
            style={style}
            aria-disabled={disabled ? "true" : rest["aria-disabled"]}
            data-disabled={disabled ? "true" : "false"}
        >
            <div
                ref={mergedViewportRef}
                className="table__viewport"
                style={virtual ? { maxHeight: height } : (void 0)}
                onScroll={handleScroll}
            >
                <table
                    className="table__element"
                    aria-busy={loading ? "true" : (void 0)}
                    aria-colcount={virtual ? columnCount : (void 0)}
                    aria-rowcount={virtual ? entries.length + 1 : (void 0)}
                    aria-label={ariaLabel}
                    aria-labelledby={tableLabelledBy}
                >
                    {caption === (void 0) ? null : (
                        <caption className="table__caption" id={captionId}>
                            {caption}
                        </caption>
                    )}
                    <thead>
                        <tr aria-rowindex={virtual ? 1 : (void 0)}>
                            {selectable ? (
                                <th className="table__selection" scope="col">
                                    <Checkbox
                                        size="sm"
                                        checked={allSelected}
                                        indeterminate={someSelected}
                                        disabled={disabled || entries.length === 0}
                                        onCheckedChange={toggleAll}
                                        label={
                                            <span className="visually-hidden">Select all rows</span>
                                        }
                                    />
                                </th>
                            ) : null}
                            {columns.map((column: TableColumn<Row>): ReactNode => (
                                <th
                                    key={column.id}
                                    scope="col"
                                    className={`table__cell table__cell--${column.align ?? "start"}`}
                                    style={{ width: column.width }}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td className="table__state" colSpan={columnCount}>
                                    <Spinner size="sm" label={loadingLabel} />
                                </td>
                            </tr>
                        ) : entries.length === 0 ? (
                            <tr>
                                <td className="table__state" colSpan={columnCount}>
                                    {empty}
                                </td>
                            </tr>
                        ) : (
                            <>
                                {virtual && start > 0 ? (
                                    <tr aria-hidden="true" className="table__spacer">
                                        <td
                                            colSpan={columnCount}
                                            style={{ height: start * resolvedRowHeight }}
                                        />
                                    </tr>
                                ) : null}
                                {visibleEntries.map((entry: ListEntry<Row>): ReactNode => {
                                    const rowDisabled: boolean = resolveRowDisabled(entry.item, entry.key);
                                    const isSelected: boolean = selected.has(entry.key);
                                    const clickable: boolean =
                                        !rowDisabled &&
                                        (onRowClick !== (void 0) || onRowDoubleClick !== (void 0));

                                    return (
                                        <tr
                                            key={entry.key}
                                            className={cx(
                                                isSelected && "table__row--selected",
                                                hover && "table__row--hover",
                                                clickable && "table__row--clickable",
                                                rowDisabled && "table__row--disabled",
                                            )}
                                            aria-selected={selectable ? isSelected : (void 0)}
                                            aria-disabled={rowDisabled ? "true" : (void 0)}
                                            aria-rowindex={virtual ? entry.index + 2 : (void 0)}
                                            tabIndex={
                                                !rowDisabled && onRowClick !== (void 0)
                                                    ? 0
                                                    : (void 0)
                                            }
                                            onClick={(): void => {
                                                if (rowDisabled) {
                                                    return;
                                                }

                                                onRowClick?.(entry.item, entry.key);
                                            }}
                                            onDoubleClick={(): void => {
                                                if (rowDisabled) {
                                                    return;
                                                }

                                                onRowDoubleClick?.(entry.item, entry.key);
                                            }}
                                            onKeyDown={(
                                                event: ReactKeyboardEvent<HTMLTableRowElement>,
                                            ): void => {
                                                if (
                                                    rowDisabled ||
                                                    (event.target as Element).closest(
                                                        ".checkbox",
                                                    ) !== null
                                                ) {
                                                    return;
                                                }

                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    onRowClick?.(entry.item, entry.key);
                                                }
                                            }}
                                        >
                                            {selectable ? (
                                                <td className="table__selection">
                                                    <span
                                                        onClick={(
                                                            event: ReactMouseEvent<HTMLSpanElement>,
                                                        ): void => event.stopPropagation()}
                                                        role="presentation"
                                                    >
                                                        <Checkbox
                                                            size="sm"
                                                            checked={isSelected}
                                                            disabled={rowDisabled}
                                                            onCheckedChange={(): void =>
                                                                toggleRow(entry.key)
                                                            }
                                                            label={
                                                                <span className="visually-hidden">
                                                                    Select row {entry.index + 1} of{" "}
                                                                    {entries.length}
                                                                </span>
                                                            }
                                                        />
                                                    </span>
                                                </td>
                                            ) : null}
                                            {columns.map((column: TableColumn<Row>): ReactNode => {
                                                const cell: ReactNode = column.cell(
                                                    entry.item,
                                                    entry.index,
                                                );
                                                const cellClass: string =
                                                    `table__cell table__cell--${column.align ?? "start"}`;

                                                return column.rowHeader === true ? (
                                                    <th key={column.id} scope="row" className={cellClass}>
                                                        {cell}
                                                    </th>
                                                ) : (
                                                    <td key={column.id} className={cellClass}>
                                                        {cell}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                                {virtual && end < entries.length ? (
                                    <tr aria-hidden="true" className="table__spacer">
                                        <td
                                            colSpan={columnCount}
                                            style={{
                                                height: (entries.length - end) * resolvedRowHeight,
                                            }}
                                        />
                                    </tr>
                                ) : null}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Table;
