/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Frame, { FramePage } from "../src/layout/frame/Frame";

describe("Frame", (): void => {
    it("renders a bounded group and clips its pages by default", (): void => {
        const ref = createRef<HTMLDivElement>();

        render(
            <Frame ref={ref} ariaLabel="Photo composition">
                <FramePage active>Base</FramePage>
                <FramePage active={false}>Overlay</FramePage>
            </Frame>,
        );

        const frame: HTMLElement = screen.getByRole("group", {
            name: "Photo composition",
        });
        const base: HTMLElement = screen.getByText("Base") as HTMLElement;

        expect(ref.current).toBe(frame);
        expect(frame.classList.contains("frame")).toBe(true);
        expect(frame.classList.contains("frame--clip")).toBe(true);
        expect(frame.style.height).toBe("240px");
        expect(base.classList.contains("frame__page")).toBe(true);
        expect(base.hidden).toBe(false);
        expect((screen.getByText("Overlay") as HTMLElement).hidden).toBe(true);
    });

    it("keeps inactive FramePages mounted and preserves their state", (): void => {
        const { rerender } = render(
            <Frame height={240} ariaLabel="Pages">
                <FramePage active zIndex={1}>
                    Overview
                </FramePage>
                <FramePage active={false}>Details</FramePage>
            </Frame>,
        );

        const overview: HTMLElement = screen.getByText("Overview") as HTMLElement;
        const details: HTMLElement = screen.getByText("Details") as HTMLElement;

        expect(overview.hidden).toBe(false);
        expect(overview.style.zIndex).toBe("1");
        expect(details.hidden).toBe(true);

        rerender(
            <Frame height={240} ariaLabel="Pages">
                <FramePage active={false} zIndex={1}>
                    Overview
                </FramePage>
                <FramePage active>Details</FramePage>
            </Frame>,
        );

        expect((screen.getByText("Overview") as HTMLElement).hidden).toBe(true);
        expect((screen.getByText("Details") as HTMLElement).hidden).toBe(false);
    });

    it("lets caller styles and native role override the computed defaults", (): void => {
        render(
            <Frame
                height="auto"
                role="region"
                aria-label="Native label"
                style={{ minHeight: 120 }}
            >
                <FramePage style={{ background: "red" }}>Page</FramePage>
            </Frame>,
        );

        const frame: HTMLElement = screen.getByRole("region", {
            name: "Native label",
        });

        expect(frame.style.height).toBe("auto");
        expect(frame.style.minHeight).toBe("120px");
        expect(
            ((screen.getByText("Page") as HTMLElement).style.background),
        ).toBe("red");
    });
});
