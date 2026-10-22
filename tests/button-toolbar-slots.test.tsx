/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PeriodicityButton, PeriodicityToolbar } from "../src/component/public";

describe("button slots", (): void => {
    it("renders prefix, content, and suffix as three equal slots", (): void => {
        const { container } = render(
            <PeriodicityButton prefix="Plus" content="Add" suffix="ArrowRight" />,
        );
        const slots: NodeListOf<Element> = container.querySelectorAll(".button__slot");

        expect(slots).toHaveLength(3);
        expect(slots[0].classList.contains("button__slot--prefix")).toBe(true);
        expect(slots[1].classList.contains("button__slot--content")).toBe(true);
        expect(slots[2].classList.contains("button__slot--suffix")).toBe(true);
    });

    it("renders a single icon slot without a content slot", (): void => {
        const { container } = render(<PeriodicityButton prefix="Plus" aria-label="Add" />);

        expect(container.querySelectorAll(".button__slot")).toHaveLength(1);
        expect(container.querySelector(".button__slot--prefix")).not.toBeNull();
        expect(container.querySelector(".button__slot--content")).toBeNull();
    });

    it("renders two icon slots as a 1:1 layout", (): void => {
        const { container } = render(
            <PeriodicityButton prefix="Plus" suffix="ArrowRight" aria-label="Split" />,
        );

        expect(container.querySelectorAll(".button__slot")).toHaveLength(2);
        expect(container.querySelector(".button__slot--prefix")).not.toBeNull();
        expect(container.querySelector(".button__slot--suffix")).not.toBeNull();
        expect(container.querySelector(".button__slot--content")).toBeNull();
    });

    it("keeps native click handling on the slotted button", (): void => {
        const onClick = vi.fn();
        render(<PeriodicityButton content="Save" onClick={onClick} />);

        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe("toolbar slots", (): void => {
    it("renders prefix, content, and suffix slots", (): void => {
        const { container } = render(
            <PeriodicityToolbar prefix={<span>P</span>} content="Title" suffix={<span>S</span>} />,
        );

        expect(container.querySelectorAll(".toolbar__slot")).toHaveLength(3);
        expect(container.querySelector(".toolbar__slot--content")?.textContent).toBe("Title");
    });

    it("fills the row with one slot and splits two slots evenly", (): void => {
        const { container, rerender } = render(<PeriodicityToolbar content="Title" />);

        expect(container.querySelectorAll(".toolbar__slot")).toHaveLength(1);

        rerender(<PeriodicityToolbar prefix={<span>P</span>} suffix={<span>S</span>} />);
        expect(container.querySelectorAll(".toolbar__slot")).toHaveLength(2);
    });

    it("keeps the legacy toolbar API working", (): void => {
        render(<PeriodicityToolbar title="Explore" subtitle="Projects" />);

        expect(screen.getByRole("toolbar").textContent).toContain("Explore");
        expect(screen.getByRole("toolbar").textContent).toContain("Projects");
    });
});
