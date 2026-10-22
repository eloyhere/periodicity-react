import { act, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Tooltip from "../src/component/tooltip/Tooltip";

const renderTooltip: (open: boolean) => ReactElement = (open: boolean): ReactElement => (
    <Tooltip content="Keyboard shortcut" open={open}>
        <button type="button">Open</button>
    </Tooltip>
);

describe("tooltip fade transitions", (): void => {
    afterEach((): void => {
        vi.useRealTimers();
    });

    it("keeps the tooltip mounted in the closing state before removing it", (): void => {
        vi.useFakeTimers();
        const { rerender }: { rerender: (ui: ReactElement) => void } = render(renderTooltip(false));

        expect(screen.queryByRole("tooltip")).toBeNull();

        rerender(renderTooltip(true));
        expect(screen.getByRole("tooltip").getAttribute("data-state")).toBe("open");

        rerender(renderTooltip(false));
        expect(screen.getByRole("tooltip").getAttribute("data-state")).toBe("closing");

        act((): void => {
            vi.advanceTimersByTime(250);
        });

        expect(screen.queryByRole("tooltip")).toBeNull();
    });

    it("describes the trigger only while the tooltip is open", (): void => {
        vi.useFakeTimers();
        const { rerender }: { rerender: (ui: ReactElement) => void } = render(renderTooltip(false));
        const trigger: HTMLElement = screen.getByRole("button");

        expect(trigger.getAttribute("aria-describedby")).toBeNull();

        rerender(renderTooltip(true));
        expect(trigger.getAttribute("aria-describedby")).not.toBeNull();

        rerender(renderTooltip(false));
        expect(trigger.getAttribute("aria-describedby")).toBeNull();
        expect(screen.getByRole("tooltip").getAttribute("data-state")).toBe("closing");

        act((): void => {
            vi.advanceTimersByTime(250);
        });
    });

    it("reopens without waiting for the exit beat to finish", (): void => {
        vi.useFakeTimers();
        const { rerender }: { rerender: (ui: ReactElement) => void } = render(renderTooltip(true));

        rerender(renderTooltip(false));
        expect(screen.getByRole("tooltip").getAttribute("data-state")).toBe("closing");

        rerender(renderTooltip(true));
        expect(screen.getByRole("tooltip").getAttribute("data-state")).toBe("open");

        act((): void => {
            vi.advanceTimersByTime(250);
        });

        expect(screen.getByRole("tooltip").getAttribute("data-state")).toBe("open");
    });
});
