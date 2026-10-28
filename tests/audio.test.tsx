/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as PublicComponents from "../src/component/public";
import Audio from "../src/component/audio/Audio";
import type { AudioControlsContext } from "../src/component/audio/Audio";
import MediaPage from "../src/showcase/pages/components/MediaPage";
import { findEntry } from "../src/showcase/registry";

/**
 * Defines a readable media metric on one element, because jsdom never loads media.
 * @param node - Audio element under test.
 * @param property - Metric to override.
 * @param value - Replacement value.
 * @returns Nothing.
 */
const defineMetric = (node: HTMLAudioElement, property: string, value: unknown): void => {
    Object.defineProperty(node, property, { configurable: true, get: () => value });
};

describe("Audio", (): void => {
    it("renders the shell, the title, the transport, and the caption", (): void => {
        const { container } = render(
            <Audio
                src="/episode.mp3"
                title="Episode 12"
                subtitle="Field recording"
                caption="Recorded in one take."
            />,
        );
        const figure: HTMLElement = container.querySelector(".audio") as HTMLElement;
        const media: HTMLAudioElement = container.querySelector(".audio__media") as HTMLAudioElement;
        const native: HTMLInputElement = container.querySelector(".seekbar__native") as HTMLInputElement;

        expect(figure.dataset.controls).toBe("custom");
        expect(figure.dataset.empty).toBe("false");
        expect(container.querySelector(".audio__shell")).not.toBeNull();
        expect(container.querySelector(".audio__artwork svg")).not.toBeNull();
        expect(container.querySelector(".audio__title")?.textContent).toBe("Episode 12");
        expect(container.querySelector(".audio__subtitle")?.textContent).toBe("Field recording");
        expect(media.getAttribute("aria-label")).toBe("Episode 12");
        expect(media.hasAttribute("controls")).toBe(false);
        expect(container.querySelector(".audio__transport")).not.toBeNull();
        expect(native.getAttribute("aria-label")).toBe("Seek");
        expect(container.querySelector("figcaption")?.textContent).toBe("Recorded in one take.");
    });

    it("renders encoded sources and custom artwork", (): void => {
        const { container } = render(
            <Audio
                sources={[{ src: "/episode.mp3", type: "audio/mpeg" }]}
                artwork={<img alt="" src="/cover.png" />}
            />,
        );
        const source: HTMLElement = container.querySelector(".audio__media source") as HTMLElement;

        expect(source.getAttribute("src")).toBe("/episode.mp3");
        expect(source.getAttribute("type")).toBe("audio/mpeg");
        expect(container.querySelector(".audio__artwork img")?.getAttribute("src")).toBe("/cover.png");
        expect(container.querySelector(".audio__artwork svg")).toBeNull();
    });

    it("prefers an explicit aria-label over the visible title", (): void => {
        const { container } = render(
            <Audio src="/episode.mp3" title="Episode 12" aria-label="Spoken episode" />,
        );
        const media: HTMLAudioElement = container.querySelector(".audio__media") as HTMLAudioElement;

        expect(media.getAttribute("aria-label")).toBe("Spoken episode");
    });

    it("tracks duration, time, and buffered progress from media events", (): void => {
        const { container } = render(<Audio src="/episode.mp3" title="Episode 12" />);
        const media: HTMLAudioElement = container.querySelector(".audio__media") as HTMLAudioElement;
        const native: HTMLInputElement = container.querySelector(".seekbar__native") as HTMLInputElement;

        defineMetric(media, "duration", 125);
        fireEvent(media, new Event("durationchange"));
        defineMetric(media, "currentTime", 65);
        fireEvent(media, new Event("timeupdate"));
        defineMetric(media, "buffered", { length: 1, end: (): number => 100 });
        fireEvent(media, new Event("progress"));

        expect(container.querySelector(".audio__time")?.textContent).toBe("1:05 / 2:05");
        expect(native.value).toBe("65");
        expect(native.getAttribute("aria-valuetext")).toBe("1:05 / 2:05");
        expect(container.querySelector(".seekbar__secondary")).not.toBeNull();
    });

    it("plays and pauses through the transport", (): void => {
        const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
        const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
        const { container } = render(<Audio src="/episode.mp3" title="Episode 12" />);
        const media: HTMLAudioElement = container.querySelector(".audio__media") as HTMLAudioElement;
        const control: HTMLElement = container.querySelector(".audio__button--play") as HTMLElement;

        fireEvent.click(control);

        expect(play).toHaveBeenCalledTimes(1);

        fireEvent(media, new Event("play"));

        expect(control.getAttribute("aria-label")).toBe("Pause audio");

        fireEvent.click(control);

        expect(pause).toHaveBeenCalledTimes(1);
    });

    it("switches to the browser controls when asked", (): void => {
        const { container } = render(
            <Audio src="/episode.mp3" title="Episode 12" controls="native" />,
        );
        const figure: HTMLElement = container.querySelector(".audio") as HTMLElement;
        const media: HTMLAudioElement = container.querySelector(".audio__media") as HTMLAudioElement;

        expect(figure.dataset.controls).toBe("native");
        expect(media.controls).toBe(true);
        expect(container.querySelector(".audio__transport")).toBeNull();
        expect(container.querySelector(".audio__title")?.textContent).toBe("Episode 12");
    });

    it("shows the failure row and retries the load", (): void => {
        const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
        const { container } = render(<Audio src="/broken.mp3" title="Episode 12" />);
        const media: HTMLAudioElement = container.querySelector(".audio__media") as HTMLAudioElement;

        fireEvent(media, new Event("error"));

        expect(screen.getByRole("alert")).toBeTruthy();
        expect(container.querySelector(".audio__status--error")).not.toBeNull();
        expect(container.querySelector(".audio__transport")).toBeNull();
        expect(screen.getByText("The audio could not be loaded.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Retry" }));

        expect(load).toHaveBeenCalledTimes(1);
        expect(container.querySelector(".audio__status--error")).toBeNull();
        expect(container.querySelector(".audio__transport")).not.toBeNull();
    });

    it("renders the empty state when no source is supplied", (): void => {
        const { container } = render(<Audio title="Episode 12" />);
        const figure: HTMLElement = container.querySelector(".audio") as HTMLElement;

        expect(figure.dataset.empty).toBe("true");
        expect(container.querySelector(".audio__status--empty")).not.toBeNull();
        expect(screen.getByText("No audio source")).toBeTruthy();
        expect(container.querySelector(".audio__transport")).toBeNull();
    });

    it("opens a vertical volume rail and mutes at zero", (): void => {
        const { container } = render(<Audio src="/episode.mp3" title="Episode 12" />);
        const media: HTMLAudioElement = container.querySelector(".audio__media") as HTMLAudioElement;
        const entry: HTMLElement = screen.getByRole("button", { name: "Volume" });

        fireEvent.click(entry);

        const panel: HTMLElement = container.querySelector(".audio__volume") as HTMLElement;

        expect(panel).not.toBeNull();
        expect(panel.querySelector(".seekbar--vertical")).not.toBeNull();

        const rail: HTMLInputElement = panel.querySelector(".seekbar__native") as HTMLInputElement;

        fireEvent.change(rail, { target: { value: "40" } });

        expect(media.volume).toBeCloseTo(0.4, 5);

        fireEvent.change(rail, { target: { value: "0" } });

        expect(media.muted).toBe(true);

        fireEvent.click(entry);

        expect(container.querySelector(".audio__volume")).toBeNull();
    });

    it("toggles mute beside the volume entry", (): void => {
        const { container } = render(<Audio src="/episode.mp3" title="Episode 12" />);
        const media: HTMLAudioElement = container.querySelector(".audio__media") as HTMLAudioElement;

        fireEvent.click(screen.getByRole("button", { name: "Mute" }));

        expect(media.muted).toBe(true);
        expect(screen.getByRole("button", { name: "Unmute" })).toBeTruthy();
    });

    it("cycles the playback speed through the offered rates", (): void => {
        const { container } = render(
            <Audio src="/episode.mp3" title="Episode 12" rates={[1, 1.5, 2]} />,
        );
        const media: HTMLAudioElement = container.querySelector(".audio__media") as HTMLAudioElement;

        fireEvent.click(screen.getByRole("button", { name: "Playback speed 1×" }));

        expect(media.playbackRate).toBe(1.5);
        expect(screen.getByRole("button", { name: "Playback speed 1.5×" })).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Playback speed 1.5×" }));

        expect(media.playbackRate).toBe(2);
    });

    it("hides the speed action when only one rate is offered", (): void => {
        render(<Audio src="/episode.mp3" title="Episode 12" rates={[1]} />);

        expect(screen.queryByRole("button", { name: /Playback speed/u })).toBeNull();
    });

    it("replaces the transport through the controls slot and renders the actions slot", (): void => {
        const { container } = render(
            <Audio
                src="/episode.mp3"
                title="Episode 12"
                rates={[1]}
                slots={{
                    controls: (context: AudioControlsContext) => (
                        <div className="custom-transport" data-playing={context.playing}>
                            <button type="button" onClick={context.togglePlayback}>
                                Custom
                            </button>
                        </div>
                    ),
                    actions: (context: AudioControlsContext) => (
                        <span data-testid="action">{`${context.duration.toFixed(0)}s`}</span>
                    ),
                }}
            />,
        );

        expect(container.querySelector(".audio__transport")).toBeNull();
        expect((container.querySelector(".custom-transport") as HTMLElement).dataset.playing).toBe(
            "false",
        );
        expect(screen.getByRole("button", { name: "Custom" })).toBeTruthy();
        expect(screen.getByTestId("action").textContent).toBe("0s");
        expect(container.querySelector(".audio__actions")).not.toBeNull();
    });
});

describe("audio showcase", (): void => {
    it("publishes the prefixed component", (): void => {
        expect("PeriodicityAudio" in PublicComponents).toBe(true);
        expect("Audio" in PublicComponents).toBe(false);
    });

    it("documents the audio demo on the media family page", (): void => {
        expect(findEntry("audio").anchor).toBe("demo-audio-player");

        const { container } = render(<MediaPage />);

        expect(container.querySelector("#demo-audio-player")).not.toBeNull();
        expect(container.querySelector("#demo-audio-player .audio__title")?.textContent).toBe(
            "Tyrannosaurus rex",
        );
        expect(container.querySelector("#demo-audio-player .media__cover")).not.toBeNull();
    });
});
