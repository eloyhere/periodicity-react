/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Icon, { type IconName } from "../src/component/icon/Icon";

describe("motion icons", (): void => {
    it("renders the animated spinner icon", (): void => {
        const { container } = render(<Icon name="Spinner" />);
        const svg: SVGElement = container.querySelector("svg") as SVGElement;

        expect(svg.getAttribute("data-icon")).toBe("Spinner");
        expect(svg.querySelector(".icon-motion-spinner__track")).not.toBeNull();
        expect(svg.querySelector(".icon-motion-spinner__arc")).not.toBeNull();
    });

    it("renders the animated loading dots", (): void => {
        const { container } = render(<Icon name="LoadingDots" />);

        expect(container.querySelectorAll(".icon-motion-dot")).toHaveLength(3);
    });

    it("renders the animated pulse line", (): void => {
        const { container } = render(<Icon name="Pulse" />);

        expect(container.querySelector(".icon-motion-pulse__line")).not.toBeNull();
    });

    it("uses SVG SMIL animation for the Dynamic group", (): void => {
        const { container } = render(
            <>
                <Icon name="DynamicRotateRight" motion="always" />
                <Icon name="DynamicRotateLeft" />
                <Icon name="DynamicThrob" />
                <Icon name="DynamicLoad" />
            </>,
        );
        expect(container.querySelectorAll("animate, animateTransform").length).toBeGreaterThan(0);
        expect(container.querySelector('[data-icon-motion="always"]')).not.toBeNull();
    });

    it("scales the heart in the Throb icon", (): void => {
        const { container } = render(<Icon name="DynamicThrob" motion="always" />);

        expect(
            container.querySelector('animateTransform[type="scale"]'),
        ).not.toBeNull();
    });

    it("closes the eyelid in the Blink icon", (): void => {
        const { container } = render(<Icon name="DynamicBlink" motion="always" />);

        expect(container.querySelector('path > animate[attributeName="d"]')).not.toBeNull();
        expect(container.querySelector('circle > animate[attributeName="r"]')).toBeNull();
    });

    it("keeps Motion and Live on their CSS animations", (): void => {
        const { container } = render(
            <>
                <Icon name="Spinner" />
                <Icon name="Live" />
            </>,
        );

        expect(container.querySelectorAll("animate, animateTransform")).toHaveLength(0);
    });

    it("does not animate agent icons", (): void => {
        const { container } = render(<Icon name="ChatGPT" />);

        expect(container.querySelectorAll("animate, animateTransform")).toHaveLength(0);
    });

    it("falls back instead of crashing for an unknown icon name", (): void => {
        const { container } = render(<Icon name={"MissingIcon" as IconName} />);
        const svg: SVGElement = container.querySelector("svg") as SVGElement;

        expect(svg.getAttribute("data-icon")).toBe("MissingIcon");
        expect(svg.getAttribute("data-icon-fallback")).toBe("true");
        expect(svg.childNodes.length).toBeGreaterThan(0);
    });

    it("renders every motion icon with its motion marker", (): void => {
        const names = [
            "Spinner",
            "LoadingDots",
            "Pulse",
            "Orbit",
            "Bars",
            "Wave",
            "Radar",
            "Breathe",
            "Sync",
            "BellRing",
        ] as const;
        const { container } = render(
            <>
                {names.map((name) => (
                    <Icon key={name} name={name} />
                ))}
            </>,
        );
        const icons: NodeListOf<SVGElement> = container.querySelectorAll("svg");

        expect(icons).toHaveLength(names.length);
        names.forEach((name: (typeof names)[number], index: number): void => {
            expect(icons[index]?.getAttribute("data-icon")).toBe(name);
        });
    });
});
