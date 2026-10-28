/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as PublicComponents from "../src/component/public";
import Barrage from "../src/component/barrage/Barrage";
import HorizontalVideo from "../src/component/video/HorizontalVideo";
import VerticalVideo from "../src/component/video/VerticalVideo";
import type { VideoControlsContext } from "../src/component/video/VideoPlayer";
import MediaPage from "../src/showcase/pages/components/MediaPage";
import { findEntry } from "../src/showcase/registry";

/**
 * Defines a readable media metric on one element, because jsdom never loads media.
 * @param node - Video element under test.
 * @param property - Metric to override.
 * @param value - Replacement value.
 * @returns Nothing.
 */
const defineMetric = (node: HTMLVideoElement, property: string, value: unknown): void => {
    Object.defineProperty(node, property, { configurable: true, get: () => value });
};

describe("HorizontalVideo", (): void => {
    it("renders the 16:9 stage, the seek bar, and the caption", (): void => {
        const { container } = render(
            <HorizontalVideo src="/clip.mp4" label="Clip" caption="Recorded in one take." />,
        );
        const figure: HTMLElement = container.querySelector(".video") as HTMLElement;
        const stage: HTMLElement = container.querySelector(".video__stage") as HTMLElement;
        const media: HTMLVideoElement = container.querySelector(".video__media") as HTMLVideoElement;

        expect(figure.dataset.layout).toBe("horizontal");
        expect(figure.dataset.controls).toBe("custom");
        expect(stage.style.getPropertyValue("--video-aspect")).toBe(`${16 / 9}`);
        expect(media.getAttribute("aria-label")).toBe("Clip");
        expect(media.hasAttribute("controls")).toBe(false);
        expect(container.querySelector(".video__controls")).not.toBeNull();
        expect(container.querySelector(".video__seekbar")).not.toBeNull();
        expect(container.querySelector(".seekbar__native")?.getAttribute("aria-label")).toBe("Seek");
        expect(container.querySelector("figcaption")?.textContent).toBe("Recorded in one take.");
    });

    it("tracks duration, time, and buffered progress from media events", (): void => {
        const { container } = render(<HorizontalVideo src="/clip.mp4" label="Clip" />);
        const media: HTMLVideoElement = container.querySelector(".video__media") as HTMLVideoElement;
        const native: HTMLInputElement = container.querySelector(".seekbar__native") as HTMLInputElement;

        defineMetric(media, "duration", 120);
        fireEvent(media, new Event("durationchange"));
        defineMetric(media, "currentTime", 30);
        fireEvent(media, new Event("timeupdate"));
        defineMetric(media, "buffered", { length: 1, end: (): number => 90 });
        fireEvent(media, new Event("progress"));

        expect(container.querySelector(".video__time")?.textContent).toBe("0:30 / 2:00");
        expect(native.value).toBe("30");
        expect(native.getAttribute("aria-valuetext")).toBe("0:30 / 2:00");
        expect(container.querySelector(".seekbar__secondary")).not.toBeNull();
    });

    it("plays and pauses through the control bar", (): void => {
        const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
        const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
        const { container } = render(<HorizontalVideo src="/clip.mp4" label="Clip" />);
        const media: HTMLVideoElement = container.querySelector(".video__media") as HTMLVideoElement;
        const control = container.querySelector(".video__controls .video__button") as HTMLElement;

        fireEvent.click(control);

        expect(play).toHaveBeenCalledTimes(1);

        fireEvent(media, new Event("play"));
        fireEvent.click(container.querySelector(".video__controls .video__button") as HTMLElement);

        expect(pause).toHaveBeenCalledTimes(1);
    });

    it("switches to the browser controls when asked", (): void => {
        const { container } = render(
            <HorizontalVideo src="/clip.mp4" controls="native" label="Clip" />,
        );
        const media: HTMLVideoElement = container.querySelector(".video__media") as HTMLVideoElement;

        expect(media.controls).toBe(true);
        expect(container.querySelector(".video__controls")).toBeNull();
        expect(container.querySelector(".video__play")).toBeNull();
    });

    it("shows the failure overlay and retries the load", (): void => {
        const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
        const { container } = render(<HorizontalVideo src="/broken.mp4" label="Clip" />);
        const media: HTMLVideoElement = container.querySelector(".video__media") as HTMLVideoElement;

        fireEvent(media, new Event("error"));

        expect(screen.getByRole("alert")).toBeTruthy();
        expect(container.querySelector(".video__status--error")).not.toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Retry" }));

        expect(load).toHaveBeenCalledTimes(1);
        expect(container.querySelector(".video__status--error")).toBeNull();
    });

    it("renders the empty state when no source is supplied", (): void => {
        const { container } = render(<HorizontalVideo label="Clip" />);

        expect(container.querySelector(".video__status--empty")).not.toBeNull();
        expect(screen.getByText("No video source")).toBeTruthy();
        expect(container.querySelector(".video__controls")).toBeNull();
    });

    it("toggles the chrome when the video area is clicked", (): void => {
        const { container } = render(<HorizontalVideo src="/clip.mp4" label="Clip" />);
        const figure: HTMLElement = container.querySelector(".video") as HTMLElement;
        const stage: HTMLElement = container.querySelector(".video__stage") as HTMLElement;

        expect(figure.dataset.controlsVisible).toBe("true");

        fireEvent.click(stage);

        expect(figure.dataset.controlsVisible).toBe("false");
        expect(container.querySelector(".video__controls")).toBeNull();
        expect(container.querySelector(".video__play")).not.toBeNull();

        fireEvent.click(stage);

        expect(figure.dataset.controlsVisible).toBe("true");
        expect(container.querySelector(".video__controls")).not.toBeNull();
    });

    it("shows aboveControls with the chrome and hides it with the bar", (): void => {
        const { container } = render(
            <HorizontalVideo
                src="/clip.mp4"
                label="Clip"
                slots={{
                    aboveControls: () => <span data-testid="above-controls">Composer</span>,
                }}
            />,
        );
        const figure: HTMLElement = container.querySelector(".video") as HTMLElement;
        const stage: HTMLElement = container.querySelector(".video__stage") as HTMLElement;

        expect(screen.getByTestId("above-controls")).toBeTruthy();
        expect(container.querySelector(".video__above-controls")).not.toBeNull();
        expect(container.querySelector(".video__controls")).not.toBeNull();

        fireEvent.click(stage);

        expect(figure.dataset.controlsVisible).toBe("false");
        expect(screen.queryByTestId("above-controls")).toBeNull();
        expect(container.querySelector(".video__above-controls")).toBeNull();
        expect(container.querySelector(".video__controls")).toBeNull();

        fireEvent.click(stage);

        expect(figure.dataset.controlsVisible).toBe("true");
        expect(screen.getByTestId("above-controls")).toBeTruthy();
        expect(container.querySelector(".video__above-controls")).not.toBeNull();
        expect(container.querySelector(".video__controls")).not.toBeNull();
    });

    it("keeps the chrome open when the bar itself is clicked", (): void => {
        const { container } = render(<HorizontalVideo src="/clip.mp4" label="Clip" />);
        const figure: HTMLElement = container.querySelector(".video") as HTMLElement;
        const bar: HTMLElement = container.querySelector(".video__controls") as HTMLElement;

        fireEvent.click(bar);

        expect(figure.dataset.controlsVisible).toBe("true");
    });

    it("opens a vertical volume rail and mutes at zero", (): void => {
        const { container } = render(<HorizontalVideo src="/clip.mp4" label="Clip" />);
        const media: HTMLVideoElement = container.querySelector(".video__media") as HTMLVideoElement;
        const entry: HTMLElement = screen.getByRole("button", { name: "Volume" });

        fireEvent.click(entry);

        const panel: HTMLElement = container.querySelector(".video__volume") as HTMLElement;

        expect(panel).not.toBeNull();
        expect(panel.querySelector(".seekbar--vertical")).not.toBeNull();

        const rail: HTMLInputElement = panel.querySelector(".seekbar__native") as HTMLInputElement;

        fireEvent.change(rail, { target: { value: "40" } });

        expect(media.volume).toBeCloseTo(0.4, 5);

        fireEvent.change(rail, { target: { value: "0" } });

        expect(media.muted).toBe(true);

        fireEvent.click(entry);

        expect(container.querySelector(".video__volume")).toBeNull();
    });

    it("toggles mute beside the volume entry", (): void => {
        const { container } = render(<HorizontalVideo src="/clip.mp4" label="Clip" />);
        const media: HTMLVideoElement = container.querySelector(".video__media") as HTMLVideoElement;

        fireEvent.click(screen.getByRole("button", { name: "Mute" }));

        expect(media.muted).toBe(true);
        expect(screen.getByRole("button", { name: "Unmute" })).toBeTruthy();
    });

    it("paints a ripple on hover and press", (): void => {
        const { container } = render(<HorizontalVideo src="/clip.mp4" label="Clip" />);
        const button: HTMLElement = container.querySelector(
            ".video__controls .video__button",
        ) as HTMLElement;

        vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
            width: 32,
            height: 32,
            top: 0,
            left: 0,
            right: 32,
            bottom: 32,
            x: 0,
            y: 0,
            toJSON: (): Record<string, number> => ({}),
        } as DOMRect);

        fireEvent.pointerOver(button, { clientX: 10, clientY: 10 });

        expect(button.querySelector(".ripple")).not.toBeNull();

        fireEvent.pointerDown(button, { clientX: 12, clientY: 12 });
        fireEvent.pointerDown(button, { clientX: 14, clientY: 14 });

        expect(button.querySelectorAll(".ripple")).toHaveLength(1);
    });

    it("replaces the bottom bar through the controls slot", (): void => {
        const { container } = render(
            <HorizontalVideo
                src="/clip.mp4"
                label="Clip"
                slots={{
                    controls: (context: VideoControlsContext) => (
                        <div className="custom-bar" data-playing={context.playing}>
                            <button type="button" onClick={context.togglePlayback}>
                                Custom
                            </button>
                        </div>
                    ),
                }}
            />,
        );

        expect(container.querySelector(".video__controls")).toBeNull();
        expect((container.querySelector(".custom-bar") as HTMLElement).dataset.playing).toBe("false");
        expect(screen.getByRole("button", { name: "Custom" })).toBeTruthy();
    });
});

describe("VerticalVideo", (): void => {
    it("renders the 9:16 stage, the action stack, and the slim rail", (): void => {
        const { container } = render(<VerticalVideo src="/clip.mp4" label="Portrait" />);
        const figure: HTMLElement = container.querySelector(".video") as HTMLElement;
        const stage: HTMLElement = container.querySelector(".video__stage") as HTMLElement;

        expect(figure.dataset.layout).toBe("vertical");
        expect(stage.style.getPropertyValue("--video-aspect")).toBe(`${9 / 16}`);
        expect(container.querySelector(".video__badge")?.textContent).toBe("0:00 / 0:00");
        expect(container.querySelectorAll(".video__actions .video__button").length).toBeGreaterThanOrEqual(2);
        expect(container.querySelector(".video__controls--slim .video__seekbar")).not.toBeNull();
        expect(container.querySelector(".video__time")).toBeNull();
    });
});

describe("Barrage", (): void => {
    it("keeps the travelling layer hidden and mirrors text for assistive technology", (): void => {
        const { container } = render(
            <Barrage
                items={[
                    { id: "a", text: "First" },
                    { id: "b", text: "Second" },
                    { id: "c", text: "Third" },
                ]}
                lanes={2}
                duration={8000}
                stagger={500}
                repeat
            >
                <span data-testid="content">Wrapped</span>
            </Barrage>,
        );
        const measures: NodeListOf<HTMLElement> = container.querySelectorAll(".barrage__measure-item");

        expect(measures).toHaveLength(3);
        expect(container.querySelector(".barrage__layer")?.getAttribute("aria-hidden")).toBe("true");
        expect(container.querySelector(".barrage__measure")?.getAttribute("aria-hidden")).toBe("true");
        expect(container.querySelector(".barrage__transcript")?.textContent).toBe("FirstSecondThird");
        expect(screen.getByTestId("content").textContent).toBe("Wrapped");
    });

    it("reflects paused and direction, and renders the slot content", (): void => {
        const { container, rerender } = render(
            <Barrage
                items={[{ text: "Only" }]}
                paused
                direction="ltr"
                slots={{
                    item: ({ item, lane }) => <em className="custom">{`${item.text}-${lane}`}</em>,
                    overlay: <span data-testid="overlay">LIVE</span>,
                }}
            />,
        );
        const root: HTMLElement = container.querySelector(".barrage") as HTMLElement;
        const custom: HTMLElement | null = container.querySelector(".barrage__measure-item .custom");

        expect(root.dataset.paused).toBe("true");
        expect(root.dataset.direction).toBe("ltr");
        expect(custom?.textContent).toBe("Only-0");
        expect(container.querySelector(".barrage__measure-item .barrage__pill")).toBeNull();
        expect(screen.getByTestId("overlay").textContent).toBe("LIVE");

        rerender(<Barrage items={[{ text: "Only" }]} />);

        expect(root.dataset.paused).toBe("false");
        expect(root.dataset.direction).toBe("rtl");
        expect(container.querySelector(".barrage__measure-item .barrage__pill")?.textContent).toBe("Only");
    });
});

describe("media showcase", (): void => {
    it("publishes the prefixed components", (): void => {
        expect("PeriodicityHorizontalVideo" in PublicComponents).toBe(true);
        expect("PeriodicityVerticalVideo" in PublicComponents).toBe(true);
        expect("PeriodicityBarrage" in PublicComponents).toBe(true);
        expect("PeriodicityVideo" in PublicComponents).toBe(false);
    });

    it("documents the three media entries on the family page", (): void => {
        expect(findEntry("horizontal-video").anchor).toBe("demo-horizontal-player");
        expect(findEntry("vertical-video").anchor).toBe("demo-vertical-player");
        expect(findEntry("barrage").anchor).toBe("demo-barrage-overlay");

        const { container } = render(<MediaPage />);

        expect(container.querySelector("#demo-horizontal-player")).not.toBeNull();
        expect(container.querySelector("#demo-vertical-player")).not.toBeNull();
        expect(container.querySelector("#demo-barrage-overlay")).not.toBeNull();
        expect(container.querySelector(".barrage .video")).not.toBeNull();
        expect(container.querySelector(".media__composer input")).not.toBeNull();
        expect(container.querySelector(".video__above-controls .media__composer")).not.toBeNull();
        expect(container.querySelector(".video__controls")).not.toBeNull();
        expect(container.querySelector(".media__send button")?.getAttribute("aria-label")).toBe("Send");
    });
});
