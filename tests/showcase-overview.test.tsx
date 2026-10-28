/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OverviewPage from "../src/showcase/pages/components/OverviewPage";
import * as PublicComponents from "../src/component/public";
import { topLevelComponents } from "../src/showcase/componentCatalogue";

describe("showcase overview", (): void => {
    it("renders one card per top-level component", (): void => {
        const { container } = render(<OverviewPage />);
        const cards: NodeListOf<Element> = container.querySelectorAll(".showcase__component-card");
        const names: string[] = Array.from(
            container.querySelectorAll(".showcase__component-card-name"),
        ).map((node: Element): string => node.textContent ?? "");

        expect(cards).toHaveLength(topLevelComponents.length);
        expect(names).toContain("Form");
        expect(names).toContain("Icon");
        expect(names).not.toContain("FormField");
        expect(names).not.toContain("FormActions");
    });

    it("includes every public component except parented subcomponents", (): void => {
        const publicNames: string[] = Object.keys(PublicComponents)
            .filter((name: string): boolean => name.startsWith("Periodicity"))
            .map((name: string): string => name.replace(/^Periodicity/, ""));
        const catalogueNames: Set<string> = new Set(
            topLevelComponents.map((component): string => component.name),
        );
        const missing: string[] = publicNames.filter(
            (name: string): boolean =>
                name !== "FormField" &&
                name !== "FormActions" &&
                name !== "FormMessage" &&
                name !== "FormSubmit" &&
                !catalogueNames.has(name),
        );

        expect(missing).toEqual([]);
    });
});
