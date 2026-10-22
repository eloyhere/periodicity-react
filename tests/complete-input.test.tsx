import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState, type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import CompleteInput from "../src/component/input/complete/CompleteInput";

const Harness: () => ReactElement = (): ReactElement => {
    const [value, setValue]: [string, (next: string) => void] = useState<string>("");

    return (
        <CompleteInput
            label="Search"
            options={[
                { value: "alpha", label: "Alpha" },
                { value: "beta", label: "Beta" },
            ]}
            value={value}
            onChange={setValue}
        />
    );
};

describe("CompleteInput focus", (): void => {
    it("keeps focus in the field while the suggestions are open", (): void => {
        render(<Harness />);
        const input: HTMLInputElement = screen.getByLabelText("Search") as HTMLInputElement;

        act((): void => {
            input.focus();
        });
        fireEvent.change(input, { target: { value: "Al" } });

        expect(screen.getByRole("listbox", { name: "Search suggestions" })).toBeTruthy();
        expect(document.activeElement).toBe(input);
    });

    it("closes the panel and blurs the field after selecting", async (): Promise<void> => {
        render(<Harness />);
        const input: HTMLInputElement = screen.getByLabelText("Search") as HTMLInputElement;

        act((): void => {
            input.focus();
        });
        fireEvent.change(input, { target: { value: "Al" } });

        const listbox: HTMLElement = screen.getByRole("listbox", {
            name: "Search suggestions",
        });
        fireEvent.click(within(listbox).getByRole("option", { name: "Alpha" }));

        expect(input.value).toBe("alpha");
        expect(document.activeElement).not.toBe(input);

        await waitFor((): void => {
            expect(screen.queryByRole("listbox")).toBeNull();
        });
    });
});
