/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { act, render, waitFor } from "@testing-library/react";
import { useRef, type ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ElementLoading from "../src/component/loading/ElementLoading";

interface RectState {
    top: number;
    left: number;
    width: number;
    height: number;
}

/**
 * Builds a mutable DOMRect-like object.
 * @param state - Editable geometry.
 * @example
 * const rect = createRect({ top: 100, left: 40, width: 300, height: 80 });
 * @returns A rectangle that follows later mutations.
 */
const createRect = (state: RectState): DOMRect =>
    ({
        get x() {
            return state.left;
        },
        get y() {
            return state.top;
        },
        get top() {
            return state.top;
        },
        get left() {
            return state.left;
        },
        get right() {
            return state.left + state.width;
        },
        get bottom() {
            return state.top + state.height;
        },
        get width() {
            return state.width;
        },
        get height() {
            return state.height;
        },
        toJSON: (): Record<string, number> => ({ ...state }),
    }) as DOMRect;

const Fixture: () => ReactElement = (): ReactElement => {
    const targetRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <div ref={targetRef} data-testid="target" />
            <ElementLoading loading target={targetRef} label="Saving" />
        </>
    );
};

afterEach((): void => {
    vi.restoreAllMocks();
});

describe("element loading mask", (): void => {
    it("follows the target through layout shifts without a scroll event", async (): Promise<void> => {
        const state: RectState = { top: 100, left: 40, width: 300, height: 80 };
        const rect: DOMRect = createRect(state);
        const { getByTestId } = render(<Fixture />);
        const target: HTMLElement = getByTestId("target");

        vi.spyOn(target, "getBoundingClientRect").mockImplementation((): DOMRect => rect);

        await act(async (): Promise<void> => {
            window.dispatchEvent(new Event("resize"));
        });

        const overlay: HTMLElement = await waitFor((): HTMLElement => {
            const node: HTMLElement | null = document.querySelector<HTMLElement>(".element-loading");
            expect(node).not.toBeNull();
            return node as HTMLElement;
        });

        expect(overlay.style.top).toBe("100px");
        expect(overlay.style.left).toBe("40px");
        expect(overlay.style.width).toBe("300px");
        expect(overlay.style.height).toBe("80px");

        state.top = 164;
        state.left = 56;

        await waitFor((): void => {
            expect(overlay.style.top).toBe("164px");
            expect(overlay.style.left).toBe("56px");
        });

        state.top = 2000;

        await waitFor((): void => {
            expect(document.querySelector(".element-loading")).toBeNull();
        });
    });
});
