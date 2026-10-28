/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SeekBar from "../src/component/input/seekbar/SeekBar";

const noop = (): void => {};

describe("SeekBar", (): void => {
    it("renders a labelled native slider with its bounds and formatted value", (): void => {
        const { container } = render(
            <SeekBar
                label="Volume"
                value={25}
                min={0}
                max={100}
                step={5}
                onChange={noop}
                format={(value) => `${value}%`}
                showValue
            />,
        );
        const slider: HTMLInputElement = screen.getByRole("slider", {
            name: "Volume",
        }) as HTMLInputElement;

        expect(slider.value).toBe("25");
        expect(slider.min).toBe("0");
        expect(slider.max).toBe("100");
        expect(slider.step).toBe("5");
        expect(slider.getAttribute("aria-orientation")).toBe("horizontal");
        expect(slider.getAttribute("aria-valuetext")).toBe("25%");
        expect(container.querySelector(".seekbar")?.classList.contains("seekbar--horizontal")).toBe(true);
        expect(container.querySelector(".seekbar__value")?.textContent).toBe("25%");
        expect((container.querySelector(".seekbar__fill") as HTMLElement).style.width).toBe("25%");
        expect((container.querySelector(".seekbar__thumb") as HTMLElement).style.insetInlineStart).toBe(
            "25%",
        );
    });

    it("lays out a vertical track from bottom to top", (): void => {
        const { container } = render(
            <SeekBar
                direction="vertical"
                length={200}
                label="Vertical"
                value={40}
                secondaryValue={60}
                step={20}
                ticks
                onChange={noop}
                showValue
            />,
        );
        const root: HTMLElement = container.querySelector(".seekbar") as HTMLElement;
        const slider: HTMLInputElement = screen.getByRole("slider", {
            name: "Vertical",
        }) as HTMLInputElement;
        const fill: HTMLElement = container.querySelector(".seekbar__fill") as HTMLElement;
        const secondary: HTMLElement = container.querySelector(".seekbar__secondary") as HTMLElement;
        const thumb: HTMLElement = container.querySelector(".seekbar__thumb") as HTMLElement;
        const marks: NodeListOf<Element> = container.querySelectorAll(".seekbar__tick");

        expect(root.classList.contains("seekbar--vertical")).toBe(true);
        expect(root.getAttribute("data-direction")).toBe("vertical");
        expect(root.style.getPropertyValue("--seekbar-length")).toBe("200px");
        expect(slider.getAttribute("aria-orientation")).toBe("vertical");
        expect(fill.style.height).toBe("40%");
        expect(fill.style.width).toBe("");
        expect(secondary.style.height).toBe("60%");
        expect(thumb.style.bottom).toBe("40%");
        expect(thumb.style.insetInlineStart).toBe("");
        expect(marks[1].getAttribute("style")).toContain("bottom: 20%");
    });

    it("reports user changes and paints the buffered secondary track", (): void => {
        const onChange = vi.fn();
        const { container } = render(
            <SeekBar
                label="Playback"
                defaultValue={20}
                secondaryValue={80}
                onChange={onChange}
            />,
        );
        const slider: HTMLInputElement = screen.getByRole("slider", {
            name: "Playback",
        }) as HTMLInputElement;

        fireEvent.change(slider, { target: { value: "60" } });

        expect(onChange).toHaveBeenCalledWith(60);
        expect(slider.value).toBe("60");
        expect((container.querySelector(".seekbar__secondary") as HTMLElement).style.width).toBe("80%");
        expect((container.querySelector(".seekbar__fill") as HTMLElement).style.width).toBe("60%");
    });

    it("derives tick marks from the step and marks the ones behind the thumb", (): void => {
        const { container } = render(
            <SeekBar label="Rating" value={3} min={0} max={5} step={1} ticks onChange={noop} />,
        );
        const marks: NodeListOf<Element> = container.querySelectorAll(".seekbar__tick");
        const active: NodeListOf<Element> = container.querySelectorAll(".seekbar__tick--active");

        expect(marks).toHaveLength(6);
        expect(active).toHaveLength(4);
    });

    it("announces an error instead of the hint and marks the slider invalid", (): void => {
        const { container } = render(
            <SeekBar
                label="Position"
                value={20}
                onChange={noop}
                hint="Pick a place."
                error="Choose a position inside the track."
            />,
        );
        const slider: HTMLInputElement = screen.getByRole("slider", {
            name: "Position",
        }) as HTMLInputElement;

        expect(slider.getAttribute("aria-invalid")).toBe("true");
        expect(slider.getAttribute("aria-describedby")).toBe(`${slider.id}-error`);
        expect(screen.queryByText("Pick a place.")).toBeNull();
        expect(screen.getByText("Choose a position inside the track.")).not.toBeNull();
        expect(container.querySelector(".seekbar")?.getAttribute("data-invalid")).toBe("true");
    });

    it("spawns a thumb ripple on hover and restarts it on click", (): void => {
        const { container } = render(<SeekBar label="Volume" value={25} onChange={noop} />);
        const surface: HTMLElement = container.querySelector(".seekbar__surface") as HTMLElement;
        const slider: HTMLInputElement = screen.getByRole("slider", {
            name: "Volume",
        }) as HTMLInputElement;

        fireEvent.pointerEnter(surface, { pointerType: "mouse", clientX: 20, clientY: 10 });
        const hoverRipple: Element | null = container.querySelector(".seekbar__ripple");
        expect(hoverRipple).not.toBeNull();
        expect(container.querySelectorAll(".seekbar__ripple")).toHaveLength(1);

        fireEvent.pointerDown(slider, { button: 0, clientX: 30, clientY: 10 });
        const clickRipple: Element | null = container.querySelector(".seekbar__ripple");
        expect(clickRipple).not.toBeNull();
        expect(clickRipple).not.toBe(hoverRipple);
        expect(container.querySelectorAll(".seekbar__ripple")).toHaveLength(1);
    });

    it("does not ripple for a touch hover or a disabled control", (): void => {
        const touch: ReturnType<typeof render> = render(
            <SeekBar label="Touch" value={25} onChange={noop} />,
        );
        fireEvent.pointerEnter(touch.container.querySelector(".seekbar__surface") as HTMLElement, {
            pointerType: "touch",
        });
        expect(touch.container.querySelector(".seekbar__ripple")).toBeNull();

        const disabled: ReturnType<typeof render> = render(
            <SeekBar label="Locked" value={25} onChange={noop} disabled />,
        );
        fireEvent.pointerEnter(disabled.container.querySelector(".seekbar__surface") as HTMLElement, {
            pointerType: "mouse",
        });
        expect(disabled.container.querySelector(".seekbar__ripple")).toBeNull();
    });

    it("reports seek start and end around a pointer drag", (): void => {
        const onSeekStart = vi.fn();
        const onSeekEnd = vi.fn();
        render(
            <SeekBar
                label="Volume"
                value={25}
                onChange={noop}
                onSeekStart={onSeekStart}
                onSeekEnd={onSeekEnd}
            />,
        );
        const slider: HTMLInputElement = screen.getByRole("slider", {
            name: "Volume",
        }) as HTMLInputElement;

        fireEvent.pointerDown(slider, { button: 0 });
        expect(onSeekStart).toHaveBeenCalledTimes(1);
        expect(onSeekEnd).not.toHaveBeenCalled();

        fireEvent.pointerUp(window);
        expect(onSeekEnd).toHaveBeenCalledWith(25);
    });

    it("disables the native input and the surface when disabled", (): void => {
        const { container } = render(
            <SeekBar label="Volume" value={25} onChange={noop} disabled />,
        );
        const slider: HTMLInputElement = screen.getByRole("slider", {
            name: "Volume",
        }) as HTMLInputElement;

        expect(slider.disabled).toBe(true);
        expect(container.querySelector(".seekbar")?.getAttribute("data-disabled")).toBe("true");
        expect(container.querySelector(".seekbar__surface")?.getAttribute("data-disabled")).toBe("true");
    });
});
