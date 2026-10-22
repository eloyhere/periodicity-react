import type { FC } from "react";

/**
 * Props for the screen-reader data table of a chart.
 * Type: interface.
 * Fields: caption, headers, rows.
 * @example
 * <ChartDataTable caption="Revenue" headers={["Quarter", "Value"]} rows={[["Q1", "12k"]]} />
 */
export interface ChartDataTableProps {
    caption: string;
    headers: readonly string[];
    rows: readonly (readonly (string | number)[])[];
}

/**
 * Renders the accessible data behind a canvas chart.
 * The chart frame places this table in a visually hidden container so screen
 * readers can read every value even though the visual chart is a canvas.
 * @param props - Caption, column headers, and rows.
 * @example
 * <ChartDataTable caption="Revenue" headers={["Quarter", "Value"]} rows={[["Q1", "12k"]]} />
 * @returns A table of chart values.
 */
const ChartDataTable: FC<ChartDataTableProps> = ({
    caption,
    headers,
    rows,
}: ChartDataTableProps) => (
    <table className="chart-data-table">
        <caption>{caption}</caption>
        <thead>
            <tr>
                {headers.map((header: string, index: number) => (
                    <th key={`${header}-${index}`} scope="col">
                        {header}
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>
            {rows.map((row: readonly (string | number)[], rowIndex: number) => (
                <tr key={rowIndex}>
                    {row.map((cell: string | number, cellIndex: number) => (
                        <td key={cellIndex}>{cell}</td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
);

export default ChartDataTable;
