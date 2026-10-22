import type { ReactElement } from "react";
import Table, { type TableProps } from "./Table";

/**
 * Props for the virtual table preset. The `virtual` flag is implied.
 * Type: type alias.
 * Fields: none.
 * @example
 * const props: VirtualTableProps<Row> = { columns, rows };
 */
export type VirtualTableProps<Row> = Omit<TableProps<Row>, "virtual">;

/**
 * Renders a table with row windowing enabled.
 * @param props - Table columns, rows, and native attributes.
 * @example
 * <VirtualTable columns={columns} rows={rows} height={320} />
 * @returns A virtualised table element.
 */
const VirtualTable: <Row>(props: VirtualTableProps<Row>) => ReactElement = <Row,>(
    props: VirtualTableProps<Row>,
): ReactElement => <Table<Row> {...props} virtual />;

export default VirtualTable;
