/* eslint-disable @typescript-eslint/typedef -- Test fixtures and DOM mocks are intentionally concise. */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef, type ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import Coordinator from "../src/layout/coordinator/Coordinator";
import Dropdown, { DropdownItem } from "../src/component/dropdown/Dropdown";

interface ViewportMetrics {
    clientHeight: number;
    scrollHeight: number;
}

/**
 * Sets the scroll metrics JSDOM does not calculate.
 * @param element - Scroll viewport.
 * @param metrics - Client and scroll height.
 * @example
 * setMetrics(viewport, { clientHeight: 300, scrollHeight: 200 });
 * @returns Nothing.
 */
const setMetrics: (element: HTMLElement, metrics: ViewportMetrics) => void = (
    element: HTMLElement,
    metrics: ViewportMetrics,
): void => {
    Object.defineProperty(element, "clientHeight", {
        configurable: true,
        value: metrics.clientHeight,
    });
    Object.defineProperty(element, "scrollHeight", {
        configurable: true,
        value: metrics.scrollHeight,
    });
    element.scrollTop = 0;
};

/**
 * Builds a rectangle for a mocked anchor.
 * @param top - Viewport-relative top edge.
 * @param height - Anchor height.
 * @example
 * const rect = anchorRect(240, 40);
 * @returns A DOMRect-like object.
 */
const anchorRect: (top: number, height: number) => DOMRect = (
    top: number,
    height: number,
): DOMRect =>
    ({
        x: 24,
        y: top,
        top,
        bottom: top + height,
        left: 24,
        right: 284,
        width: 260,
        height,
        toJSON: (): Record<string, number> => ({}),
    }) as DOMRect;

const Fixture: () => ReactElement = (): ReactElement => {
    const anchorRef = useRef<HTMLButtonElement>(null);

    return (
        <Coordinator
            height={480}
            collapseHeight={200}
            collapse={<div />}
            header={<div />}
            main={
                <>
                    <button ref={anchorRef} type="button">
                        Anchor
                    </button>
                    <Dropdown
                        anchorRef={anchorRef}
                        open
                        onOpenChange={(): void => {}}
                        ariaLabel="Brands"
                    >
                        <DropdownItem>DeepSeek</DropdownItem>
                    </Dropdown>
                </>
            }
        />
    );
};

describe("anchored layers inside Coordinator", (): void => {
    it("follows the anchor when the collapsing header shifts it without scrolling", async (): Promise<void> => {
        const baseTop: number = 300;
        const { container } = render(<Fixture />);
        const viewport: HTMLElement | null = container.querySelector(".coordinator__viewport");
        const collapse: HTMLElement | null = container.querySelector(".coordinator__collapse");
        const trigger: HTMLElement | null = container.querySelector("button");

        if (viewport === null || collapse === null || trigger === null) {
            throw new Error("Coordinator fixture is incomplete.");
        }

        vi.spyOn(trigger, "getBoundingClientRect").mockImplementation((): DOMRect => {
            const collapseHeight: number = parseFloat(collapse.style.height) || 0;
            return anchorRect(baseTop - (200 - collapseHeight), 40);
        });

        const panel: HTMLElement = await screen.findByRole("menu", { name: "Brands" });

        await waitFor((): void => {
            expect(panel.style.top).toBe("346px");
        });

        // Drain the post-mount frames before shifting the layout; otherwise a queued
        // update could hide a missing continuous position tracker.
        await act(async (): Promise<void> => {
            await new Promise<void>((resolve: () => void): void => {
                window.requestAnimationFrame((): void => {
                    window.requestAnimationFrame((): void => resolve());
                });
            });
        });

        expect(panel.style.top).toBe("346px");

        setMetrics(viewport, { clientHeight: 300, scrollHeight: 240 });
        fireEvent.wheel(viewport, { deltaY: 80 });

        expect(collapse.style.height).toBe("120px");

        await waitFor((): void => {
            expect(panel.style.top).toBe("266px");
        });

        fireEvent.wheel(viewport, { deltaY: 80 });

        expect(collapse.style.height).toBe("40px");

        await waitFor((): void => {
            expect(panel.style.top).toBe("186px");
        });
    });
});
