/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PeriodicityButton, PeriodicityTable, PeriodicityTextInput } from "../src/component/public";
import type { StandardEvent } from "../src/gesture";
import type { TableColumn } from "../src/layout/table/Table";

interface Row {
    id: string;
    name: string;
}

const rows: readonly Row[] = [{ id: "one", name: "One" }];
const columns: readonly TableColumn<Row>[] = [
    { id: "name", header: "Name", cell: (row: Row): string => row.name },
];

describe("standard events on public components", (): void => {
    it("calls native and standard click handlers together", (): void => {
        const nativeClick = vi.fn();
        const standardClick = vi.fn();
        const standardPress = vi.fn();

        render(
            <PeriodicityButton
                onClick={nativeClick}
                standardEvents={{ click: standardClick, press: standardPress }}
            >
                Save
            </PeriodicityButton>,
        );

        const button: HTMLElement = screen.getByRole("button", { name: "Save" });
        fireEvent.pointerDown(button, { pointerType: "mouse", clientX: 10, clientY: 12 });
        fireEvent.click(button, { clientX: 10, clientY: 12 });

        expect(nativeClick).toHaveBeenCalledTimes(1);
        expect(standardPress).toHaveBeenCalledTimes(1);
        expect(standardClick).toHaveBeenCalledTimes(1);
        expect((standardClick.mock.calls[0][0] as StandardEvent).type).toBe("click");
    });

    it("keeps native-only components free of an extra wrapper", (): void => {
        const { container } = render(<PeriodicityButton>Plain</PeriodicityButton>);

        expect(container.querySelector(".standard-event-boundary")).toBeNull();
    });

    it("supports named onStandard handlers without leaking props to the DOM", (): void => {
        const standardClick = vi.fn();
        const { container } = render(
            <PeriodicityButton onStandardClick={standardClick}>Open</PeriodicityButton>,
        );

        fireEvent.click(screen.getByRole("button", { name: "Open" }));

        expect(standardClick).toHaveBeenCalledTimes(1);
        expect(container.querySelector("[onStandardClick]")).toBeNull();
    });

    it("keeps generic table props while adding standard events", (): void => {
        const onRowClick = vi.fn();
        const standardClick = vi.fn();

        render(
            <PeriodicityTable<Row>
                columns={columns}
                rows={rows}
                rowKey={(row: Row): string => row.id}
                onRowClick={onRowClick}
                onStandardClick={standardClick}
            />,
        );

        fireEvent.click(screen.getByText("One"));

        expect(onRowClick).toHaveBeenCalledTimes(1);
        expect(standardClick).toHaveBeenCalledTimes(1);
    });

    it("emits standard input events from a wrapped text field", (): void => {
        const standardInput = vi.fn();

        render(
            <PeriodicityTextInput
                label="Name"
                defaultValue=""
                onStandardInput={standardInput}
            />,
        );

        const input: HTMLInputElement = screen.getByRole("textbox", { name: "Name" });
        fireEvent.input(input, { target: { value: "Mira" } });

        expect(standardInput).toHaveBeenCalledTimes(1);
        expect((standardInput.mock.calls[0][0] as StandardEvent).value).toBe("Mira");
    });
});
