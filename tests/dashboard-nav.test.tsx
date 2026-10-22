import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("dashboard navigation", (): void => {
    it("paints hover and click ripples on navigation items", (): void => {
        const { container }: { container: HTMLElement } = render(<App />);
        const item: HTMLElement | null = container.querySelector<HTMLElement>(
            ".nav__item-surface",
        );

        if (item === null) {
            throw new Error("Dashboard navigation item is missing.");
        }

        fireEvent.pointerEnter(item, { pointerType: "mouse", clientX: 8, clientY: 8 });
        expect(item.querySelectorAll(".ripple").length).toBeGreaterThan(0);

        fireEvent.pointerDown(item, {
            pointerType: "mouse",
            clientX: 8,
            clientY: 8,
            button: 0,
        });
        expect(item.querySelectorAll(".ripple").length).toBeGreaterThan(0);
    });
});
