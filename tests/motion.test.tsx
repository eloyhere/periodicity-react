/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Animation, Animated } from "../src/animation";

/**
 * Reads one custom property from an element's inline style.
 * @param element - Styled element.
 * @param property - Custom property name.
 * @example
 * const scale = motionVar(scope, "--motion-scale");
 * @returns The inline value.
 */
const motionVar = (element: HTMLElement, property: string): string =>
    element.style.getPropertyValue(property).trim();

describe("motion scope", (): void => {
    it("pauses every motion layer when animation is disabled", (): void => {
        const { container } = render(
            <Animation enabled={false}>
                <span>Paused</span>
            </Animation>,
        );
        const scope = container.querySelector(".animation-scope") as HTMLElement;

        expect(motionVar(scope, "--motion-scale")).toBe("0");
        expect(motionVar(scope, "--motion-essential-scale")).toBe("0");
        expect(motionVar(scope, "--motion-repeat")).toBe("1");
        expect(scope.getAttribute("data-animation")).toBe("disabled");
    });

    it("keeps essential loading motion available when motion is reduced", (): void => {
        const { container } = render(
            <Animation reducedMotion="always">
                <span>Reduced</span>
            </Animation>,
        );
        const scope = container.querySelector(".animation-scope") as HTMLElement;

        expect(motionVar(scope, "--motion-scale")).toBe("0");
        expect(motionVar(scope, "--motion-essential-scale")).toBe("0.5");
        expect(motionVar(scope, "--motion-repeat")).toBe("1");
        expect(scope.getAttribute("data-animation-reduced")).toBe("true");
    });

    it("leaves the full scale available when reduced motion is ignored", (): void => {
        const { container } = render(
            <Animation reducedMotion="never">
                <span>Full motion</span>
            </Animation>,
        );
        const scope = container.querySelector(".animation-scope") as HTMLElement;

        expect(motionVar(scope, "--motion-scale")).toBe("1");
        expect(motionVar(scope, "--motion-essential-scale")).toBe("1");
        expect(motionVar(scope, "--motion-repeat")).toBe("infinite");
    });

    it("forwards the same motion variables to an animated element", (): void => {
        const { container } = render(
            <Animated preset="fade" reducedMotion="never">
                Content
            </Animated>,
        );
        const element = container.querySelector(".animated") as HTMLElement;

        expect(motionVar(element, "--motion-scale")).toBe("1");
        expect(motionVar(element, "--motion-essential-scale")).toBe("1");
        expect(motionVar(element, "--motion-repeat")).toBe("infinite");
    });
});
