/* eslint-disable @typescript-eslint/typedef -- Test fixtures and native listeners are intentionally concise. */
import { fireEvent, render } from "@testing-library/react";
import { useEffect, useRef, type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import Coordinator from "../src/layout/coordinator/Coordinator";
import AppBar from "../src/layout/appbar/AppBar";
import Toolbar from "../src/layout/toolbar/Toolbar";

interface ViewportMetrics {
    clientHeight: number;
    scrollHeight: number;
    scrollTop?: number;
}

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
    element.scrollTop = metrics.scrollTop ?? 0;
};

const getViewport: (container: HTMLElement) => HTMLElement = (
    container: HTMLElement,
): HTMLElement => {
    const viewport: HTMLElement | null = container.querySelector(".coordinator__viewport");

    if (viewport === null) {
        throw new Error("Coordinator viewport is missing.");
    }

    return viewport;
};

const getCollapse: (container: HTMLElement) => HTMLElement = (
    container: HTMLElement,
): HTMLElement => {
    const collapse: HTMLElement | null = container.querySelector(".coordinator__collapse");

    if (collapse === null) {
        throw new Error("Coordinator collapse area is missing.");
    }

    return collapse;
};

const Consumer: () => ReactElement = (): ReactElement => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect((): (() => void) => {
        const node: HTMLDivElement | null = ref.current;

        if (node === null) {
            return (): void => {};
        }

        /**
         * Consumes wheel input before it reaches the coordinator.
         * @param event - Native wheel event.
         * @example
         * node.addEventListener("wheel", consume, { passive: false });
         * @returns Nothing.
         */
        const consume: (event: WheelEvent) => void = (event: WheelEvent): void => {
            event.preventDefault();
        };

        node.addEventListener("wheel", consume, { passive: false });

        return (): void => {
            node.removeEventListener("wheel", consume);
        };
    }, []);

    return <div ref={ref} data-testid="consumer" />;
};

describe("Coordinator wheel fallback", (): void => {
    it("collapses and restores the hero when the content cannot scroll", (): void => {
        const { container } = render(
            <Coordinator
                height={480}
                collapseHeight={200}
                collapse={<div />}
                header={<Toolbar title="Field notes" />}
                main={<p>Short content</p>}
            />,
        );
        const viewport: HTMLElement = getViewport(container);
        const collapse: HTMLElement = getCollapse(container);

        setMetrics(viewport, { clientHeight: 300, scrollHeight: 240 });
        expect(collapse.style.height).toBe("200px");

        fireEvent.wheel(viewport, { deltaY: 80 });
        expect(collapse.style.height).toBe("120px");

        expect(fireEvent.wheel(viewport, { deltaY: 500 })).toBe(false);
        expect(collapse.style.height).toBe("0px");

        fireEvent.wheel(viewport, { deltaY: -60 });
        expect(collapse.style.height).toBe("60px");
    });

    it("leaves wheel input to content that can still scroll", (): void => {
        const { container } = render(
            <Coordinator
                height={480}
                collapseHeight={200}
                collapse={<div />}
                main={<p>Long content</p>}
            />,
        );
        const viewport: HTMLElement = getViewport(container);
        const collapse: HTMLElement = getCollapse(container);

        setMetrics(viewport, { clientHeight: 300, scrollHeight: 600 });

        expect(fireEvent.wheel(viewport, { deltaY: 80 })).toBe(true);
        expect(collapse.style.height).toBe("200px");
    });

    it("consumes wheel input over the fixed header when content cannot scroll", (): void => {
        const { container } = render(
            <Coordinator
                height={480}
                collapseHeight={200}
                collapse={<div />}
                header={<Toolbar title="Field notes" />}
                main={<p>Short content</p>}
            />,
        );
        const viewport: HTMLElement = getViewport(container);
        const collapse: HTMLElement = getCollapse(container);
        const header: HTMLElement | null = container.querySelector(".coordinator__header");

        setMetrics(viewport, { clientHeight: 300, scrollHeight: 240 });

        if (header === null) {
            throw new Error("Coordinator header is missing.");
        }

        fireEvent.wheel(header, { deltaY: 80 });
        expect(collapse.style.height).toBe("120px");
    });

    it("leaves wheel input to a nested scroller until it reaches its end", (): void => {
        const { container, getByTestId } = render(
            <Coordinator
                height={480}
                collapseHeight={200}
                collapse={<div />}
                main={
                    <div data-testid="nested" style={{ overflowY: "auto" }}>
                        <p>Nested content</p>
                    </div>
                }
            />,
        );
        const viewport: HTMLElement = getViewport(container);
        const collapse: HTMLElement = getCollapse(container);
        const nested: HTMLElement = getByTestId("nested");

        setMetrics(viewport, { clientHeight: 300, scrollHeight: 240 });
        setMetrics(nested, { clientHeight: 100, scrollHeight: 400 });

        fireEvent.wheel(nested, { deltaY: 80 });
        expect(collapse.style.height).toBe("200px");

        nested.scrollTop = 300;
        fireEvent.wheel(nested, { deltaY: 80 });
        expect(collapse.style.height).toBe("120px");
    });

    it("leaves a wheel event that a child already prevented", (): void => {
        const { container } = render(
            <Coordinator
                height={480}
                collapseHeight={200}
                collapse={<div />}
                main={<Consumer />}
            />,
        );
        const viewport: HTMLElement = getViewport(container);
        const collapse: HTMLElement = getCollapse(container);
        const consumer: HTMLElement = container.querySelector("[data-testid='consumer']") as HTMLElement;

        setMetrics(viewport, { clientHeight: 300, scrollHeight: 240 });

        fireEvent.wheel(consumer, { deltaY: 80 });
        expect(collapse.style.height).toBe("200px");
    });

    it("feeds wheel collapse progress into a nested app bar", (): void => {
        const { container } = render(
            <Coordinator
                height={480}
                collapseHeight={200}
                collapse={<div />}
                header={
                    <AppBar
                        expandedHeight={200}
                        collapsedHeight={64}
                        liftOnScroll={false}
                    >
                        <Toolbar title="Field notes" />
                    </AppBar>
                }
                main={<p>Short content</p>}
            />,
        );
        const viewport: HTMLElement = getViewport(container);
        const appBar: HTMLElement | null = container.querySelector(".app-bar");

        setMetrics(viewport, { clientHeight: 300, scrollHeight: 240 });
        fireEvent.wheel(viewport, { deltaY: 68 });

        expect(appBar?.getAttribute("data-progress")).toBe("0.500");
    });
});
