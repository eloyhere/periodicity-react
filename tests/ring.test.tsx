/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as PublicComponents from "../src/component/public";
import Ring from "../src/component/ring/Ring";

const circumference: number = 2 * Math.PI * 44;

describe("Ring", (): void => {
    it("spins by default and announces its label", (): void => {
        const { container } = render(<Ring label="Uploading" />);
        const root: HTMLElement = container.querySelector(".ring") as HTMLElement;
        const arc: SVGCircleElement = container.querySelector(".ring__arc") as SVGCircleElement;

        expect(root.getAttribute("role")).toBe("status");
        expect(root.style.width).toBe("40px");
        expect(root.classList.contains("ring--accent")).toBe(true);
        expect(root.classList.contains("ring--determinate")).toBe(false);
        expect(arc.hasAttribute("stroke-dasharray")).toBe(false);
        expect(arc.hasAttribute("stroke-dashoffset")).toBe(false);
        expect(screen.getByText("Uploading")).toBeTruthy();
    });

    it("sizes the ring and its stroke from the props", (): void => {
        const { container } = render(<Ring size="lg" thickness={6} tone="mint" />);
        const root: HTMLElement = container.querySelector(".ring") as HTMLElement;
        const arc: SVGCircleElement = container.querySelector(".ring__arc") as SVGCircleElement;

        expect(root.style.width).toBe("56px");
        expect(root.classList.contains("ring--mint")).toBe(true);
        expect(Number(arc.getAttribute("stroke-width"))).toBeCloseTo((6 / 56) * 100, 6);
    });

    it("renders a determinate arc and progressbar semantics for a value", (): void => {
        const { container } = render(<Ring value={68} size={80} showValue label="Cycle" />);
        const root: HTMLElement = container.querySelector(".ring") as HTMLElement;
        const arc: SVGCircleElement = container.querySelector(".ring__arc") as SVGCircleElement;
        const dash: number[] = (arc.style.strokeDasharray ?? "").split(" ").map(Number);

        expect(root.classList.contains("ring--determinate")).toBe(true);
        expect(root.getAttribute("role")).toBe("progressbar");
        expect(root.getAttribute("aria-valuenow")).toBe("68");
        expect(root.getAttribute("aria-valuetext")).toBe("68%");
        expect(root.getAttribute("aria-label")).toBe("Cycle");
        expect(container.querySelector(".ring__track")).not.toBeNull();
        expect(container.querySelector(".ring__value")?.textContent).toBe("68%");
        expect(dash[0]).toBeCloseTo(0.68 * circumference, 4);
        expect(dash[1]).toBeCloseTo(circumference * 1.6, 4);
    });

    it("clamps the value and forwards the ref", (): void => {
        const ref = createRef<HTMLSpanElement>();
        const { container } = render(<Ring ref={ref} value={140} />);
        const root: HTMLElement = container.querySelector(".ring") as HTMLElement;

        expect(ref.current).toBe(root);
        expect(root.getAttribute("aria-valuenow")).toBe("100");
    });

    it("is published with the Periodicity prefix and replaces the old circles", (): void => {
        expect("PeriodicityRing" in PublicComponents).toBe(true);
        expect("PeriodicityProgressRing" in PublicComponents).toBe(false);
        expect("PeriodicityCircularProgress" in PublicComponents).toBe(false);
        expect("PeriodicityCyclePicker" in PublicComponents).toBe(true);
    });
});
