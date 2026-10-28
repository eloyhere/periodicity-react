import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as PublicComponents from "../src/component/public";
import NavigationView, { type NavigationItem } from "../src/layout/navigation/NavigationView";

type ResizeCallback = (entries: ResizeObserverEntry[]) => void;

const callbacks: ResizeCallback[] = [];

class ResizeObserverStub {
    constructor(callback: ResizeCallback) {
        callbacks.push(callback);
    }

    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
}

const items: NavigationItem[] = [
    { value: "today", label: "Today" },
    { value: "cycles", label: "Cycles" },
    { value: "search", label: "Search" },
];

const resize: (width: number) => void = (width: number): void => {
    act((): void => {
        callbacks.forEach((callback: ResizeCallback): void => {
            callback([{ contentRect: { width } } as ResizeObserverEntry]);
        });
    });
};

describe("navigation view width modes", (): void => {
    afterEach((): void => {
        callbacks.length = 0;
        vi.unstubAllGlobals();
    });

    it("switches to the compact list when only one destination fits", (): void => {
        vi.stubGlobal("ResizeObserver", ResizeObserverStub);

        const { container }: { container: HTMLElement } = render(
            <NavigationView items={items} variant="bottom" />,
        );
        const nav: HTMLElement | null = container.querySelector<HTMLElement>(".navigation-view");

        if (nav === null) {
            throw new Error("Navigation root is missing.");
        }

        expect(callbacks).toHaveLength(1);
        expect(nav.dataset.compact).toBe("false");

        resize(120);
        expect(nav.dataset.compact).toBe("true");

        resize(400);
        expect(nav.dataset.compact).toBe("false");
    });

    it("stays horizontal while two destinations fit", (): void => {
        vi.stubGlobal("ResizeObserver", ResizeObserverStub);

        const { container }: { container: HTMLElement } = render(
            <NavigationView items={items} variant="bottom" />,
        );
        const nav: HTMLElement | null = container.querySelector<HTMLElement>(".navigation-view");

        if (nav === null) {
            throw new Error("Navigation root is missing.");
        }

        resize(240);
        expect(nav.dataset.compact).toBe("false");
    });

    it("keeps the horizontal list when no observer is available", (): void => {
        vi.stubGlobal("ResizeObserver", (void 0));

        const { container }: { container: HTMLElement } = render(
            <NavigationView items={items} variant="bottom" />,
        );
        const nav: HTMLElement | null = container.querySelector<HTMLElement>(".navigation-view");

        if (nav === null) {
            throw new Error("Navigation root is missing.");
        }

        expect(nav.dataset.compact).toBe("false");
    });

    it("paints hover and click ripples on navigation items", (): void => {
        const { container }: { container: HTMLElement } = render(<NavigationView items={items} />);
        const item: HTMLElement | null = container.querySelector<HTMLElement>(
            ".navigation-view__item",
        );

        if (item === null) {
            throw new Error("Navigation item is missing.");
        }

        fireEvent.pointerEnter(item, { pointerType: "mouse", clientX: 8, clientY: 8 });
        expect(item.querySelectorAll(".ripple").length).toBeGreaterThan(0);

        fireEvent.pointerDown(item, { pointerType: "mouse", clientX: 8, clientY: 8, button: 0 });
        expect(item.querySelectorAll(".ripple").length).toBeGreaterThan(0);
    });

    it("publishes the Navigation name instead of NavigationView", (): void => {
        expect("PeriodicityNavigation" in PublicComponents).toBe(true);
        expect("PeriodicityNavigationView" in PublicComponents).toBe(false);
        expect(typeof PublicComponents.PeriodicityNavigation).toBe("function");
    });
});
