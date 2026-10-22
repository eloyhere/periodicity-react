/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "../src/component/toast";
import { International } from "../src/international";
import PrimitivesPage from "../src/showcase/pages/components/PrimitivesPage";
import IconsPage from "../src/showcase/pages/foundations/IconsPage";
import {
    iconCatalog,
    iconGroups,
    type IconCatalogEntry,
    type IconGroup,
} from "../src/showcase/iconCatalog";

describe("Icon component page", (): void => {
    it("shows every icon inside its broad group card", (): void => {
        const { container } = render(<PrimitivesPage />);

        expect(container.querySelectorAll(".showcase__icon-cell")).toHaveLength(iconCatalog.length);
        expect(container.querySelectorAll('[data-icon-fallback="true"]')).toHaveLength(0);
        expect(container.querySelectorAll(".showcase__icon-group-card")).toHaveLength(
            iconGroups.length,
        );
        expect(
            iconGroups.reduce(
                (count: number, group: IconGroup): number => count + group.entries.length,
                0,
            ),
        ).toBe(iconCatalog.length);
        expect(
            iconGroups.every((group: IconGroup): boolean => group.entries.length >= 30),
        ).toBe(true);
        const labels: string[] = Array.from(
            container.querySelectorAll(".showcase__icon-group-card .card__title"),
        ).map((node: Element): string => node.textContent ?? "");
        expect(labels).toContain("Math");
        expect(labels).toContain("Live");
        expect(labels).toContain("Dynamic");
        expect(labels).toContain("Agent");
        expect(container.textContent).toContain("Sum");
    });

    it("keeps every icon name unique across categories", (): void => {
        const names: string[] = iconCatalog.map((entry): string => entry.name);

        expect(new Set<string>(names).size).toBe(names.length);
    });

    it("forces motion playback for the SVG-animated catalogue icons", (): void => {
        const { container } = render(
            <ToastProvider>
                <IconsPage />
            </ToastProvider>,
        );
        const animatedCategories: Set<string> = new Set<string>(["Dynamic", "DynamicExtra"]);
        const animated: IconCatalogEntry[] = iconCatalog.filter((entry: IconCatalogEntry): boolean =>
            animatedCategories.has(entry.category),
        );

        expect(container.querySelectorAll('[data-icon-motion="always"]')).toHaveLength(
            animated.length,
        );
        expect(
            container.querySelectorAll(
                '[data-icon-motion="always"] animate, [data-icon-motion="always"] animateTransform',
            ).length,
        ).toBeGreaterThan(0);
    });

    it("filters icons with the search box", (): void => {
        const { container, getByLabelText } = render(<PrimitivesPage />);

        fireEvent.change(getByLabelText("Search icons"), { target: { value: "Spinner" } });

        expect(container.querySelectorAll(".showcase__icon-cell")).toHaveLength(1);
        expect(container.textContent).toContain("Spinner");
    });

    it("filters the Math group", (): void => {
        const { container, getByLabelText } = render(<PrimitivesPage />);

        fireEvent.change(getByLabelText("Search icons"), { target: { value: "math" } });

        expect(container.querySelectorAll(".showcase__icon-group-card")).toHaveLength(1);
        expect(container.querySelectorAll(".showcase__icon-cell")).toHaveLength(47);
        expect(container.textContent).toContain("Delta");
        expect(container.textContent).toContain("Positive");
    });

    it("shows the animated agent group", (): void => {
        const { container, getByLabelText } = render(<PrimitivesPage />);

        fireEvent.change(getByLabelText("Search icons"), { target: { value: "agent" } });

        const cards: Element[] = Array.from(
            container.querySelectorAll(".showcase__icon-group-card"),
        );
        const agentCard: Element | undefined = cards.find(
            (card: Element): boolean =>
                card.querySelector(".card__title")?.textContent === "Agent",
        );

        expect(agentCard).toBeDefined();
        expect(agentCard?.querySelectorAll(".showcase__icon-cell")).toHaveLength(30);
        expect(agentCard?.querySelectorAll("animate, animateTransform")).toHaveLength(0);
    });

    it("shows the SVG-animated Dynamic group", (): void => {
        const { container, getByLabelText } = render(<PrimitivesPage />);

        fireEvent.change(getByLabelText("Search icons"), { target: { value: "dynamic" } });

        const cards: Element[] = Array.from(
            container.querySelectorAll(".showcase__icon-group-card"),
        );
        const dynamicCard: Element | undefined = cards.find(
            (card: Element): boolean =>
                card.querySelector(".card__title")?.textContent === "Dynamic",
        );

        expect(dynamicCard).toBeDefined();
        expect(dynamicCard?.querySelectorAll(".showcase__icon-cell")).toHaveLength(30);
        expect(
            dynamicCard?.querySelectorAll("animate, animateTransform").length,
        ).toBeGreaterThan(0);
        expect(dynamicCard?.querySelectorAll('[data-icon-motion="always"]')).toHaveLength(30);
    });

    it("shows the Computer group", (): void => {
        const { container, getByLabelText } = render(<PrimitivesPage />);

        fireEvent.change(getByLabelText("Search icons"), { target: { value: "computer" } });

        const cards: Element[] = Array.from(
            container.querySelectorAll(".showcase__icon-group-card"),
        );
        const computerCard: Element | undefined = cards.find(
            (card: Element): boolean =>
                card.querySelector(".card__title")?.textContent === "Computer",
        );

        expect(computerCard).toBeDefined();
        expect(computerCard?.querySelectorAll(".showcase__icon-cell")).toHaveLength(30);
    });

    it("shows the Animal group", (): void => {
        const { container, getByLabelText } = render(<PrimitivesPage />);

        fireEvent.change(getByLabelText("Search icons"), { target: { value: "animal" } });

        const cards: Element[] = Array.from(
            container.querySelectorAll(".showcase__icon-group-card"),
        );
        const animalCard: Element | undefined = cards.find(
            (card: Element): boolean =>
                card.querySelector(".card__title")?.textContent === "Animal",
        );

        expect(animalCard).toBeDefined();
        expect(animalCard?.querySelectorAll(".showcase__icon-cell")).toHaveLength(30);
        expect(animalCard?.textContent).toContain("AnimalLion");
    });

    it("shows the Plant group", (): void => {
        const { container, getByLabelText } = render(<PrimitivesPage />);

        fireEvent.change(getByLabelText("Search icons"), { target: { value: "plant" } });

        const cards: Element[] = Array.from(
            container.querySelectorAll(".showcase__icon-group-card"),
        );
        const plantCard: Element | undefined = cards.find(
            (card: Element): boolean =>
                card.querySelector(".card__title")?.textContent === "Plant",
        );

        expect(plantCard).toBeDefined();
        expect(plantCard?.querySelectorAll(".showcase__icon-cell")).toHaveLength(30);
        expect(plantCard?.textContent).toContain("PlantTree");
    });

    it("shows the Programming group", (): void => {
        const { container, getByLabelText } = render(<PrimitivesPage />);

        fireEvent.change(getByLabelText("Search icons"), { target: { value: "programming" } });

        const cards: Element[] = Array.from(
            container.querySelectorAll(".showcase__icon-group-card"),
        );
        const programmingCard: Element | undefined = cards.find(
            (card: Element): boolean =>
                card.querySelector(".card__title")?.textContent === "Programming",
        );

        expect(programmingCard).toBeDefined();
        expect(programmingCard?.querySelectorAll(".showcase__icon-cell")).toHaveLength(40);
        expect(programmingCard?.textContent).toContain("Kotlin");
    });

    it("shows the Electronics group", (): void => {
        const { container, getByLabelText } = render(<PrimitivesPage />);

        fireEvent.change(getByLabelText("Search icons"), { target: { value: "electronics" } });

        const cards: Element[] = Array.from(
            container.querySelectorAll(".showcase__icon-group-card"),
        );
        const electronicsCard: Element | undefined = cards.find(
            (card: Element): boolean =>
                card.querySelector(".card__title")?.textContent === "Electronics",
        );

        expect(electronicsCard).toBeDefined();
        expect(electronicsCard?.querySelectorAll(".showcase__icon-cell")).toHaveLength(44);
    });

    it("shows the live status group", (): void => {
        const { container, getByLabelText } = render(<PrimitivesPage />);

        fireEvent.change(getByLabelText("Search icons"), { target: { value: "live" } });

        expect(container.querySelectorAll(".showcase__icon-group-card")).toHaveLength(1);
        expect(container.querySelectorAll(".showcase__icon-cell")).toHaveLength(30);
        expect(container.textContent).toContain("Heartbeat");
    });

    it("localizes the group labels and search copy", (): void => {
        const { container, getByLabelText } = render(
            <International locale="zh-CN">
                <PrimitivesPage />
            </International>,
        );

        expect(container.textContent).toContain("数学");
        fireEvent.change(getByLabelText("搜索图标"), { target: { value: "公司" } });

        expect(container.querySelectorAll(".showcase__icon-group-card")).toHaveLength(1);
        expect(container.textContent).toContain("公司");
    });
});
