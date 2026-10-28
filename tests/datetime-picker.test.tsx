/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DateTimePicker from "../src/component/picker/datetime/DateTimePicker";

describe("DateTimePicker header", (): void => {
    it("edits year and month through NumberInput fields", (): void => {
        const onChange = vi.fn();

        render(
            <DateTimePicker
                label="Starts at"
                defaultValue="2026-10-20T09:30"
                onChange={onChange}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /Starts at/ }));

        const year: HTMLInputElement = screen.getByRole("spinbutton", {
            name: "Year",
        }) as HTMLInputElement;
        const month: HTMLInputElement = screen.getByRole("spinbutton", {
            name: "Month",
        }) as HTMLInputElement;

        expect(year.closest(".input-layout")).toBeTruthy();
        expect(month.closest(".input-layout")).toBeTruthy();
        expect(year.value).toBe("2026");
        expect(month.value).toBe("10");

        fireEvent.change(year, { target: { value: "2027" } });
        expect(onChange).toHaveBeenLastCalledWith("2027-10-20T09:30");

        fireEvent.change(month, { target: { value: "12" } });
        expect(onChange).toHaveBeenLastCalledWith("2027-12-20T09:30");
    });
});
