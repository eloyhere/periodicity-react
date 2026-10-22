import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Showcase from "../src/showcase/Showcase";

describe("showcase component search", (): void => {
    beforeEach((): void => {
        window.history.replaceState(null, "", "#overview");
        Element.prototype.scrollTo = vi.fn();
        Element.prototype.scrollIntoView = vi.fn();
    });

    it("opens the component picked from the CompleteInput", async (): Promise<void> => {
        render(<Showcase />);
        const search: HTMLInputElement = screen.getByLabelText(
            "Search components",
        ) as HTMLInputElement;

        act((): void => {
            search.focus();
        });
        fireEvent.change(search, { target: { value: "Toast" } });
        expect(document.activeElement).toBe(search);

        const listbox: HTMLElement = screen.getByRole("listbox", {
            name: "Search components suggestions",
        });
        fireEvent.click(within(listbox).getByRole("option", { name: "ToastProvider" }));

        expect(window.location.hash).toBe("#toast-provider");
        expect(search.value).toBe("");
        expect(document.activeElement).not.toBe(search);
        expect(
            screen.getByRole("heading", { level: 1, name: "ToastProvider" }),
        ).toBeTruthy();

        await waitFor((): void => {
            expect(screen.queryByRole("listbox")).toBeNull();
        });
    });
});
