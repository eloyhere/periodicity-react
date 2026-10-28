/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
    createWaterfallAdapter,
    visibleWaterfallPlacements,
    VirtualWaterfallLayout,
    WaterfallLayout,
    type WaterfallItemState,
    type WaterfallPlacement,
} from "../src/layout/waterfall";

interface Card {
    id: string;
    title: string;
    height: number;
}

const cards: readonly Card[] = [
    { id: "alpha", title: "Alpha", height: 100 },
    { id: "beta", title: "Beta", height: 50 },
    { id: "gamma", title: "Gamma", height: 120 },
];

const manyCards: readonly Card[] = Array.from({ length: 12 }, (value: unknown, index: number) => {
    void value;

    return {
        id: `card-${index}`,
        title: `Card ${index + 1}`,
        height: 100,
    };
});

describe("WaterfallLayout", (): void => {
    it("wraps every child in the flow item container by default", (): void => {
        const { container } = render(
            <WaterfallLayout columns={2} gap="none">
                <span>One</span>
                <span>Two</span>
                <span>Three</span>
            </WaterfallLayout>,
        );

        expect(container.querySelectorAll(".waterfall-layout__column")).toHaveLength(2);
        expect(container.querySelectorAll(".waterfall-layout__item")).toHaveLength(3);
    });

    it("replaces the item container through slots.item", (): void => {
        const { container } = render(
            <WaterfallLayout
                columns={2}
                gap="none"
                slots={{
                    item: (child: ReactNode, state: WaterfallItemState): ReactNode => (
                        <article
                            data-testid="card"
                            data-column={state.column}
                            data-index={state.index}
                            style={state.style}
                        >
                            {child}
                        </article>
                    ),
                }}
            >
                <span>One</span>
                <span>Two</span>
                <span>Three</span>
            </WaterfallLayout>,
        );
        const items: HTMLElement[] = Array.from(
            container.querySelectorAll<HTMLElement>('[data-testid="card"]'),
        );

        expect(items).toHaveLength(3);
        expect(items.map((item: HTMLElement): string => item.dataset.index ?? "")).toEqual([
            "0",
            "2",
            "1",
        ]);
        expect(items.map((item: HTMLElement): string => item.dataset.column ?? "")).toEqual([
            "0",
            "0",
            "1",
        ]);
        expect(container.querySelectorAll(".waterfall-layout__item")).toHaveLength(0);
    });
});

describe("waterfall adapter", (): void => {
    it("indexes cards and balances columns by height", (): void => {
        const adapter = createWaterfallAdapter(cards, {
            getKey: (card: Card): string => card.id,
            getHeight: (card: Card): number => card.height,
        });

        expect(adapter.size).toBe(3);
        expect(adapter.keys).toEqual(["alpha", "beta", "gamma"]);
        expect(adapter.heights).toEqual([100, 50, 120]);
        expect(adapter.getHeight(1)).toBe(50);
        expect(adapter.indexOf("gamma")).toBe(2);
        expect((): number => adapter.getHeight(3)).toThrow(RangeError);

        const arrangement = adapter.arrange({ columns: 2, gap: 10 });

        expect(arrangement.columnCount).toBe(2);
        expect(arrangement.height).toBe(180);
        expect(arrangement.columns[0].height).toBe(100);
        expect(arrangement.columns[1].height).toBe(180);
        expect(arrangement.columns[1].placements[1].top).toBe(60);
        expect(arrangement.columns[1].placements[1].index).toBe(2);
    });

    it("reuses the cached arrangement for the same geometry", (): void => {
        const adapter = createWaterfallAdapter(cards);

        expect(adapter.keys).toEqual(["alpha", "beta", "gamma"]);
        expect(adapter.heights).toEqual([100, 50, 120]);
        expect(adapter.arrange({ columns: 2, gap: 8 })).toBe(
            adapter.arrange({ columns: 2, gap: 8 }),
        );
        expect(adapter.arrange({ columns: 3, gap: 8 })).not.toBe(
            adapter.arrange({ columns: 2, gap: 8 }),
        );
    });

    it("slices visible placements with a binary search", (): void => {
        const adapter = createWaterfallAdapter(cards, {
            getHeight: (card: Card): number => card.height,
        });
        const arrangement = adapter.arrange({ columns: 1, gap: 0 });
        const column = arrangement.columns[0];

        expect(
            visibleWaterfallPlacements(column, 0, 100).map(
                (placement: WaterfallPlacement): number => placement.index,
            ),
        ).toEqual([0]);
        expect(
            visibleWaterfallPlacements(column, 100, 150).map(
                (placement: WaterfallPlacement): number => placement.index,
            ),
        ).toEqual([1]);
        expect(
            visibleWaterfallPlacements(column, 150, 180).map(
                (placement: WaterfallPlacement): number => placement.index,
            ),
        ).toEqual([2]);
        expect(visibleWaterfallPlacements(column, 400, 500)).toEqual([]);
    });
});

describe("VirtualWaterfallLayout", (): void => {
    it("mounts only the placed cards inside the measured window", (): void => {
        const { container } = render(
            <VirtualWaterfallLayout
                items={manyCards}
                renderItem={(card: Card): ReactNode => <span>{card.title}</span>}
                columns={2}
                gap="none"
                height={200}
                overscan={0}
            />,
        );

        expect(container.querySelectorAll(".waterfall-layout__item")).toHaveLength(4);
        expect(screen.getByText("Card 1")).toBeTruthy();
        expect(screen.queryByText("Card 5")).toBeNull();
        expect(
            (container.querySelector(".waterfall-layout__canvas") as HTMLElement).style.height,
        ).toBe("600px");

        const viewport: HTMLElement = container.querySelector(".waterfall-layout--virtual") as HTMLElement;
        fireEvent.scroll(viewport, { target: { scrollTop: 200 } });

        expect(container.querySelectorAll(".waterfall-layout__item")).toHaveLength(4);
        expect(screen.queryByText("Card 1")).toBeNull();
        expect(screen.getByText("Card 5")).toBeTruthy();
        expect(screen.getByText("Card 8")).toBeTruthy();
    });

    it("applies the item-container slot to positioned cards", (): void => {
        const { container } = render(
            <VirtualWaterfallLayout
                items={manyCards}
                getKey={(card: Card): string => card.id}
                getHeight={(card: Card): number => card.height}
                renderItem={(card: Card): ReactNode => <span>{card.title}</span>}
                columns={2}
                gap="none"
                height={200}
                overscan={0}
                slots={{
                    item: (child: ReactNode, state: WaterfallItemState): ReactNode => (
                        <article
                            className={state.className}
                            data-testid="virtual-card"
                            data-column={state.column}
                            data-index={state.index}
                            style={state.style}
                        >
                            {child}
                        </article>
                    ),
                }}
            />,
        );
        const items: HTMLElement[] = Array.from(
            container.querySelectorAll<HTMLElement>('[data-testid="virtual-card"]'),
        );

        expect(items).toHaveLength(4);
        expect(items[0].style.top).toBe("0px");
        expect(items[0].style.height).toBe("100px");
        expect(items[1].style.top).toBe("100px");
        expect(items[0].className).toContain("waterfall-layout__item--virtual");
    });

    it("renders an adapter and an empty state", (): void => {
        const adapter = createWaterfallAdapter(cards, {
            getKey: (card: Card): string => card.id,
            getHeight: (card: Card): number => card.height,
        });
        const { rerender } = render(
            <VirtualWaterfallLayout
                adapter={adapter}
                renderItem={(card: Card): ReactNode => <span>{card.title}</span>}
                columns={2}
                gap="none"
                height={400}
            />,
        );

        expect(screen.getByText("Alpha")).toBeTruthy();
        expect(screen.getByText("Gamma")).toBeTruthy();

        rerender(
            <VirtualWaterfallLayout
                items={[]}
                renderItem={(card: Card): ReactNode => <span>{card.title}</span>}
                height={200}
                empty="No cards yet"
            />,
        );

        expect(screen.getByRole("status").textContent).toBe("No cards yet");
    });
});
