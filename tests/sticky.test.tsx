/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { createRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PeriodicitySticky } from "../src/component/public";
import StickyPage from "../src/showcase/pages/components/StickyPage";
import { findEntry, resolveEntryId } from "../src/showcase/registry";

const makeRect = (top: number, bottom: number): DOMRect =>
    ({
        top,
        bottom,
        left: 0,
        right: 320,
        width: 320,
        height: bottom - top,
        x: 0,
        y: top,
        toJSON: () => ({}),
    }) as DOMRect;

const setScrollMetrics = (
    element: HTMLElement,
    metrics: { clientHeight: number; scrollHeight: number; scrollTop: number },
): void => {
    Object.defineProperty(element, "clientHeight", {
        configurable: true,
        value: metrics.clientHeight,
    });
    Object.defineProperty(element, "scrollHeight", {
        configurable: true,
        value: metrics.scrollHeight,
    });
    element.scrollTop = metrics.scrollTop;
};

const renderScrollableSticky = (
    props: {
        edge?: "top" | "bottom";
        offset?: number;
        disabled?: boolean;
        onStuckChange?: (stuck: boolean) => void;
    } = {},
): { scroller: HTMLDivElement; sticky: HTMLDivElement } => {
    const { container } = render(
        <div data-testid="scroller" style={{ overflowY: "auto", height: 300 }}>
            <PeriodicitySticky {...props}>
                <span>Pinned content</span>
            </PeriodicitySticky>
        </div>,
    );
    const scroller: HTMLDivElement = screen.getByTestId("scroller") as HTMLDivElement;
    const sticky: HTMLDivElement = container.querySelector(".sticky") as HTMLDivElement;

    return { scroller, sticky };
};

describe("Sticky", (): void => {
    beforeEach((): void => {
        Element.prototype.scrollTo = vi.fn();
    });

    it("renders one sticky element with a top offset by default", (): void => {
        const { container } = render(
            <PeriodicitySticky offset={24} data-testid="sticky">
                <span>Toolbar</span>
            </PeriodicitySticky>,
        );
        const sticky: HTMLElement = screen.getByTestId("sticky");

        expect(container.querySelectorAll(".sticky")).toHaveLength(1);
        expect(sticky.classList.contains("sticky--top")).toBe(true);
        expect(sticky.classList.contains("sticky--stuck")).toBe(false);
        expect(sticky.style.top).toBe("24px");
        expect(sticky.style.bottom).toBe("");
        expect(sticky.dataset.edge).toBe("top");
        expect(sticky.dataset.stuck).toBe("false");
        expect(screen.getByText("Toolbar")).toBeTruthy();
    });

    it("supports the bottom edge, stacking order, and native props", (): void => {
        const ref = createRef<HTMLDivElement>();

        render(
            <PeriodicitySticky
                ref={ref}
                edge="bottom"
                offset={12}
                zIndex={140}
                aria-label="Pinned actions"
            >
                <button type="button">Save</button>
            </PeriodicitySticky>,
        );
        const sticky: HTMLElement = screen.getByLabelText("Pinned actions");

        expect(ref.current).toBe(sticky);
        expect(sticky.classList.contains("sticky--bottom")).toBe(true);
        expect(sticky.style.top).toBe("");
        expect(sticky.style.bottom).toBe("12px");
        expect(sticky.style.zIndex).toBe("140");
        expect(sticky.dataset.edge).toBe("bottom");
    });

    it("keeps the box but stops pinning when disabled", (): void => {
        const onStuckChange = vi.fn();

        const { container } = render(
            <PeriodicitySticky disabled onStuckChange={onStuckChange}>
                <span>Print layout</span>
            </PeriodicitySticky>,
        );
        const sticky: HTMLElement = container.querySelector(".sticky") as HTMLElement;

        expect(sticky.classList.contains("sticky--disabled")).toBe(true);
        expect(sticky.dataset.stuck).toBe("false");
        expect(onStuckChange).not.toHaveBeenCalled();
    });

    it("reports the pinned state when the scroll container moves", async (): Promise<void> => {
        const onStuckChange = vi.fn();
        const { scroller, sticky } = renderScrollableSticky({
            offset: 16,
            onStuckChange,
        });

        setScrollMetrics(scroller, { clientHeight: 300, scrollHeight: 900, scrollTop: 120 });
        vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue(makeRect(100, 400));
        vi.spyOn(sticky, "getBoundingClientRect").mockReturnValue(makeRect(116, 164));
        fireEvent.scroll(scroller);

        await waitFor((): void => {
            expect(sticky.dataset.stuck).toBe("true");
        });
        expect(sticky.classList.contains("sticky--stuck")).toBe(true);
        await waitFor((): void => {
            expect(onStuckChange).toHaveBeenLastCalledWith(true);
        });

        scroller.scrollTop = 0;
        vi.spyOn(sticky, "getBoundingClientRect").mockReturnValue(makeRect(260, 308));
        fireEvent.scroll(scroller);

        await waitFor((): void => {
            expect(sticky.dataset.stuck).toBe("false");
        });
        await waitFor((): void => {
            expect(onStuckChange).toHaveBeenLastCalledWith(false);
        });
    });

    it("detects a bottom sticky bar before the scroll reaches the end", async (): Promise<void> => {
        const onStuckChange = vi.fn();
        const { scroller, sticky } = renderScrollableSticky({
            edge: "bottom",
            onStuckChange,
        });

        setScrollMetrics(scroller, { clientHeight: 200, scrollHeight: 600, scrollTop: 200 });
        vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue(makeRect(0, 200));
        vi.spyOn(sticky, "getBoundingClientRect").mockReturnValue(makeRect(150, 200));
        fireEvent.scroll(scroller);

        await waitFor((): void => {
            expect(sticky.dataset.stuck).toBe("true");
        });
        await waitFor((): void => {
            expect(onStuckChange).toHaveBeenLastCalledWith(true);
        });

        scroller.scrollTop = 400;
        fireEvent.scroll(scroller);

        await waitFor((): void => {
            expect(sticky.dataset.stuck).toBe("false");
        });
        await waitFor((): void => {
            expect(onStuckChange).toHaveBeenLastCalledWith(false);
        });
    });

    it("applies a custom stuck class only while pinned", async (): Promise<void> => {
        const { scroller, sticky } = renderScrollableSticky({ stuckClassName: "toolbar--lifted" });

        setScrollMetrics(scroller, { clientHeight: 300, scrollHeight: 900, scrollTop: 120 });
        vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue(makeRect(0, 300));
        vi.spyOn(sticky, "getBoundingClientRect").mockReturnValue(makeRect(0, 48));
        fireEvent.scroll(scroller);

        await waitFor((): void => {
            expect(sticky.classList.contains("toolbar--lifted")).toBe(true);
        });
    });
});

describe("Sticky showcase entry", (): void => {
    beforeEach((): void => {
        Element.prototype.scrollTo = vi.fn();
        window.history.replaceState(null, "", "#sticky");
    });

    it("owns a dedicated route and points it at the sub-page demo", (): void => {
        const entry = findEntry("sticky");

        expect(resolveEntryId("#sticky")).toBe("sticky");
        expect(entry.id).toBe("sticky");
        expect(entry.page).toBe(StickyPage);
        expect(entry.anchor).toBe("demo-sticky-sub-pages");
    });

    it("switches internal sub-pages inside one scroll port", async (): Promise<void> => {
        const { container } = render(<StickyPage />);

        expect(
            screen.getByRole("heading", { level: 3, name: "A page inside the page" }),
        ).toBeTruthy();
        expect(container.querySelectorAll(".sticky")).toHaveLength(6);
        expect(container.querySelectorAll(".sticky--bottom")).toHaveLength(2);

        fireEvent.click(screen.getByRole("tab", { name: "Guide" }));

        await waitFor((): void => {
            expect(
                screen.getByRole("heading", { level: 3, name: "Pinning with offsets" }),
            ).toBeTruthy();
        });
        expect(Element.prototype.scrollTo).toHaveBeenCalled();
    });
});
