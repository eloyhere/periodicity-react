import { describe, expect, it } from "vitest";
import * as PublicComponents from "../src/component/public";

describe("public component surface", (): void => {
    it("exports Periodicity-prefixed components", (): void => {
        expect("PeriodicityButton" in PublicComponents).toBe(true);
        expect("PeriodicityTable" in PublicComponents).toBe(true);
        expect("PeriodicityDialog" in PublicComponents).toBe(true);
        expect("PeriodicityIcon" in PublicComponents).toBe(true);
    });

    it("does not export unprefixed compatibility names", (): void => {
        expect("Button" in PublicComponents).toBe(false);
        expect("Table" in PublicComponents).toBe(false);
        expect("Dialog" in PublicComponents).toBe(false);
        expect("Icon" in PublicComponents).toBe(false);
    });

    it("wraps every public component with standard event support", (): void => {
        const components: [string, unknown][] = Object.entries(PublicComponents).filter(
            ([name]: [string, unknown]): boolean => name.startsWith("Periodicity"),
        );

        expect(components.length).toBeGreaterThan(100);

        for (const [name, component] of components) {
            expect(typeof component, name).toBe("function");
            expect(
                (component as { displayName?: string }).displayName,
                name,
            ).toContain("withStandardEvents");
        }
    });
});
