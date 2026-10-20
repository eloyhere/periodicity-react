import {
    useMemo,
    useState,
    type MouseEvent as ReactMouseEvent,
    type ReactElement,
    type ReactNode,
} from "react";
import type { ListAdapter, ListEntry } from "../list/adapter";
import { createListAdapter } from "../list/adapter";
import Checkbox from "../../component/input/check/Checkbox";
import Spinner from "../../component/progress/Spinner";
import cx from "../../component/foundation/cx";
import useVirtualWindow, { type VirtualWindow } from "../../component/foundation/useVirtualWindow";
import "./Table.css";

/**
 * One table column definition.
 * Type: interface.
 * Fields: id, header, cell, align, width.
 * @example
 * const column: TableColumn<Person> = { id: "name", header: "Name", cell: (person) => person.name };
 */
export interface TableColumn<Row> {
    id: string;
    header: ReactNode;
    cell: (row: Row, index: number) => ReactNode;
    align?: "start" | "center" | "end";
    width?: number | string;
}

/**
 * Props for the adapter-backed table.
 * Type: interface.
 * Fields: columns, rows, adapter, rowKey, caption, density, striped, hover,
 * selectedKeys, onSelectionChange, onRowClick, loading, empty, virtual, height,
 * rowHeight, className.
 * @example
 * <Table columns={columns} rows={people} />
 */
export interface TableProps<Row> {
    columns: readonly TableColumn<Row>[];
    rows?: readonly Row[];
    adapter?: ListAdapter<Row>;
    rowKey?: (row: Row, index: number) => string;
    caption?: ReactNode;
    density?: "compact" | "standard";
    striped?: boolean;
    hover?: boolean;
    selectedKeys?: readonly string[];
    onSelectionChange?: (keys: readonly string[]) => void;
    onRowClick?: (row: Row, key: string) => void;
    loading?: boolean;
    empty?: ReactNode;
    virtual?: boolean;
    height?: number;
    rowHeight?: number;
    className?: string;
}

/**
 * Renders a semantic Material table with selection and adapter-backed rows.
 * @param props - Columns, rows or adapter, density, and selection.
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
    selectedKeys,
    onSelectionChange,
    onRowClick,
    loading = false,
    empty = "No rows",
    virtual = false,
    height = 360,
    rowHeight,
    className = "",
}: TableProps<Row>): ReactElement => {
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
    ] = useState<ReadonlySet<string>>(new Set<string>(selectedKeys ?? []));
    const selected: ReadonlySet<string> = selectedKeys === (void 0)
        ? internalSelected
        : new Set<string>(selectedKeys);
    const entries: readonly ListEntry<Row>[] = list.getRange(0, list.size);
    const resolvedRowHeight: number = rowHeight ?? (density === "compact" ? 40 : 52);
    const {
        attachViewport,
        start: windowStart,
        end: windowEnd,
        onScroll,
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
    const allSelected: boolean = entries.length > 0 && entries.every(
        (entry: ListEntry<Row>): boolean => selected.has(entry.key),
    );
    const someSelected: boolean = !allSelected && entries.some(
        (entry: ListEntry<Row>): boolean => selected.has(entry.key),
    );

    const setSelection: (next: ReadonlySet<string>) => void = (next: ReadonlySet<string>): void => {
        if (selectedKeys === (void 0)) {
            setInternalSelected(next);
        }

        onSelectionChange?.([...next]);
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
            className={cx(
                "table",
                `table--${density}`,
                striped && "table--striped",
                virtual && "table--virtual",
                className,
            )}
        >
            <div
                ref={virtual ? attachViewport : (void 0)}
                className="table__viewport"
                style={virtual ? { maxHeight: height } : (void 0)}
                onScroll={virtual ? onScroll : (void 0)}
            >
                <table className="table__element">
                    {caption === (void 0) ? null : <caption className="table__caption">{caption}</caption>}
                    <thead>
                        <tr>
                            <th className="table__selection" scope="col">
                                <Checkbox
                                    size="sm"
                                    checked={allSelected}
                                    indeterminate={someSelected}
                                    onCheckedChange={toggleAll}
                                    label={<span className="visually-hidden">Select all rows</span>}
                                />
                            </th>
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
                                <td className="table__state" colSpan={columns.length + 1}>
                                    <Spinner size="sm" />
                                </td>
                            </tr>
                        ) : entries.length === 0 ? (
                            <tr>
                                <td className="table__state" colSpan={columns.length + 1}>
                                    {empty}
                                </td>
                            </tr>
                        ) : (
                            <>
                                {virtual && start > 0 ? (
                                    <tr aria-hidden="true" className="table__spacer">
                                        <td
                                            colSpan={columns.length + 1}
                                            style={{ height: start * resolvedRowHeight }}
                                        />
                                    </tr>
                                ) : null}
                                {visibleEntries.map((entry: ListEntry<Row>): ReactNode => (
                                    <tr
                                        key={entry.key}
                                        className={cx(
                                            selected.has(entry.key) && "table__row--selected",
                                            hover && "table__row--hover",
                                            onRowClick !== (void 0) && "table__row--clickable",
                                        )}
                                        onClick={(): void => onRowClick?.(entry.item, entry.key)}
                                    >
                                        <td className="table__selection">
                                            <span
                                                onClick={(
                                                    event: ReactMouseEvent<HTMLSpanElement>,
                                                ): void => event.stopPropagation()}
                                                role="presentation"
                                            >
                                                <Checkbox
                                                    size="sm"
                                                    checked={selected.has(entry.key)}
                                                    onCheckedChange={(): void =>
                                                        toggleRow(entry.key)
                                                    }
                                                    label={
                                                        <span className="visually-hidden">
                                                            Select row {entry.index + 1}
                                                        </span>
                                                    }
                                                />
                                            </span>
                                        </td>
                                        {columns.map((column: TableColumn<Row>): ReactNode => (
                                            <td
                                                key={column.id}
                                                className={`table__cell table__cell--${column.align ?? "start"}`}
                                            >
                                                {column.cell(entry.item, entry.index)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {virtual && end < entries.length ? (
                                    <tr aria-hidden="true" className="table__spacer">
                                        <td
                                            colSpan={columns.length + 1}
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
