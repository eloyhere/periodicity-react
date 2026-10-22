/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Table, { type TableColumn } from "../src/layout/table/Table";
import VirtualTable from "../src/layout/table/VirtualTable";
import Tabs from "../src/layout/tab/Tabs";
import Calendar from "../src/component/calendar/Calendar";
import { International } from "../src/international";

interface Row {
    id: string;
    name: string;
}

const rows: readonly Row[] = Array.from(
    { length: 200 },
    (value: unknown, index: number): Row => {
        void value;
        return { id: `row-${index}`, name: `Row ${index}` };
    },
);
const columns: readonly TableColumn<Row>[] = [
    { id: "name", header: "Name", cell: (row: Row): string => row.name },
];

describe("component boundaries", (): void => {
    it("windows a large table without dropping its accessibility row count", (): void => {
        const { container } = render(
            <VirtualTable
                columns={columns}
                rows={rows}
                rowKey={(row: Row): string => row.id}
                height={200}
                rowHeight={20}
            />,
        );
        const bodyRows: NodeListOf<Element> = container.querySelectorAll(
            "tbody tr:not(.table__spacer)",
        );
        const table: HTMLTableElement | null = container.querySelector("table");

        expect(bodyRows.length).toBeGreaterThan(0);
        expect(bodyRows.length).toBeLessThan(rows.length);
        expect(table?.getAttribute("aria-rowcount")).toBe("201");
    });

    it("keeps checkbox selection separate from row activation", (): void => {
        const onRowClick = vi.fn();
        const onSelectionChange = vi.fn();
        const { container } = render(
            <Table
                columns={columns}
                rows={rows.slice(0, 3)}
                rowKey={(row: Row): string => row.id}
                selectable
                onRowClick={onRowClick}
                onSelectionChange={onSelectionChange}
            />,
        );
        const checkbox: HTMLInputElement | null = container.querySelector(
            "tbody input[type='checkbox']",
        );

        expect(checkbox).not.toBeNull();
        fireEvent.click(checkbox as HTMLInputElement);

        expect(onSelectionChange).toHaveBeenCalled();
        expect(onRowClick).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText("Row 0"));
        expect(onRowClick).toHaveBeenCalledWith(rows[0], "row-0");
    });

    it("does not activate a disabled row", (): void => {
        const onRowClick = vi.fn();
        render(
            <Table
                columns={columns}
                rows={rows.slice(0, 2)}
                rowKey={(row: Row): string => row.id}
                isRowDisabled={(row: Row): boolean => row.id === "row-1"}
                onRowClick={onRowClick}
            />,
        );

        fireEvent.click(screen.getByText("Row 1"));

        expect(onRowClick).not.toHaveBeenCalled();
    });

    it("renders empty and busy table states distinctly", (): void => {
        const { container, rerender } = render(
            <Table columns={columns} rows={[]} empty="Nothing here" />,
        );

        expect(container.textContent).toContain("Nothing here");

        rerender(<Table columns={columns} rows={[]} loading loadingLabel="Loading rows" />);

        expect(container.querySelector("table")?.getAttribute("aria-busy")).toBe("true");
        expect(container.textContent).toContain("Loading rows");
    });

    it("renders header, body, and footer slots inside a calendar cell", (): void => {
        const { container } = render(
            <Calendar
                defaultValue="2026-10-20"
                slots={{
                    header: ({ day }): ReactNode => <span>H{day}</span>,
                    body: (): ReactNode => <span>B</span>,
                    footer: (): ReactNode => <span>F</span>,
                }}
            />,
        );
        const cell: HTMLElement = container.querySelector(
            '[data-date="2026-10-20"]',
        ) as HTMLElement;

        expect(cell.querySelector(".calendar__day-header")?.textContent).toBe("H20");
        expect(cell.querySelector(".calendar__day-body")?.textContent).toBe("B");
        expect(cell.querySelector(".calendar__day-footer")?.textContent).toBe("F");
    });

    it("uses the active International locale for month and weekday labels", (): void => {
        const { container } = render(
            <International locale="zh-CN">
                <Calendar defaultValue="2026-10-20" />
            </International>,
        );

        expect(container.textContent).toContain("2026年10月");
        expect(container.textContent).toContain("周一");
    });

    it("paints hover and press ripples on a calendar day", (): void => {
        const { container } = render(<Calendar />);
        const day: HTMLElement = container.querySelector("[data-date]") as HTMLElement;

        fireEvent.pointerEnter(day, { pointerType: "mouse", clientX: 8, clientY: 8 });
        expect(day.querySelectorAll(".ripple").length).toBeGreaterThan(0);

        fireEvent.pointerDown(day, { pointerType: "mouse", clientX: 8, clientY: 8 });
        expect(day.querySelectorAll(".ripple").length).toBeGreaterThan(0);
    });

    it("ignores disabled tabs while preserving tab semantics", (): void => {
        const onValueChange = vi.fn();
        render(
            <Tabs
                items={[
                    { value: "one", label: "One" },
                    { value: "two", label: "Two", disabled: true },
                ]}
                defaultValue="one"
                onValueChange={onValueChange}
            />,
        );

        fireEvent.click(screen.getByRole("tab", { name: "Two" }));

        expect(onValueChange).not.toHaveBeenCalled();
        expect(screen.getByRole("tab", { name: "One" }).getAttribute("aria-selected")).toBe(
            "true",
        );
    });
});
