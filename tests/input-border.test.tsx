import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { readCaretPoint } from "../src/gesture/core/caret";
import TextInput from "../src/component/input/text/TextInput";

vi.mock("../src/gesture/core/caret", (): { readCaretPoint: ReturnType<typeof vi.fn> } => ({
    readCaretPoint: vi.fn(),
}));

const readRatio: (control: HTMLElement, edge: string) => number = (
    control: HTMLElement,
    edge: string,
): number => parseFloat(control.style.getPropertyValue(`--input-distance-${edge}`));

describe("input focus border", (): void => {
    it("records the pointer projection and edge distances before focusing", (): void => {
        const { container }: { container: HTMLElement } = render(
            <TextInput label="Name" hint="Your name" />,
        );
        const control: HTMLElement | null = container.querySelector(".input-layout__control");
        const input: HTMLInputElement = screen.getByRole("textbox") as HTMLInputElement;

        if (control === null) {
            throw new Error("Input control is missing.");
        }

        expect(container.querySelectorAll(".input-layout__edge")).toHaveLength(4);
        expect(container.querySelector(".input-layout__edge--top")).not.toBeNull();
        expect(container.querySelector(".input-layout__edge--right")).not.toBeNull();
        expect(container.querySelector(".input-layout__edge--bottom")).not.toBeNull();
        expect(container.querySelector(".input-layout__edge--left")).not.toBeNull();

        vi.spyOn(control, "getBoundingClientRect").mockReturnValue({
            left: 10,
            top: 20,
            width: 100,
            height: 50,
        } as DOMRect);

        let originAtFocus: string = "";
        input.addEventListener("focus", (): void => {
            originAtFocus = control.style.getPropertyValue("--input-activation-x");
        });

        fireEvent.pointerDown(control, { clientX: 60, clientY: 40, button: 0 });

        expect(control.style.getPropertyValue("--input-activation-x")).toBe("50%");
        expect(control.style.getPropertyValue("--input-activation-y")).toBe("40%");
        expect(readRatio(control, "top")).toBeCloseTo(20 / Math.hypot(50, 30), 5);
        expect(readRatio(control, "right")).toBeCloseTo(50 / Math.hypot(50, 30), 5);
        expect(readRatio(control, "bottom")).toBeCloseTo(30 / Math.hypot(50, 30), 5);
        expect(readRatio(control, "left")).toBeCloseTo(50 / Math.hypot(50, 30), 5);
        expect(originAtFocus).toBe("50%");
        expect(document.activeElement).toBe(input);
    });

    it("keeps one bottom edge for fill and standard variants", (): void => {
        const { container, rerender }: { container: HTMLElement; rerender: (ui: ReactElement) => void } =
            render(<TextInput label="Name" hint="Your name" variant="fill" />);

        expect(container.querySelectorAll(".input-layout__edge")).toHaveLength(1);
        expect(container.querySelector(".input-layout__edge--bottom")).not.toBeNull();
        expect(container.querySelector(".input-layout__edge--top")).toBeNull();
        expect(container.querySelector(".input-layout--fill .input-layout__edge--bottom")).not.toBeNull();

        rerender(<TextInput label="Name" hint="Your name" variant="standard" />);

        expect(container.querySelectorAll(".input-layout__edge")).toHaveLength(1);
        expect(container.querySelector(".input-layout__edge--bottom")).not.toBeNull();
        expect(container.querySelector(".input-layout__edge--left")).toBeNull();
        expect(container.querySelector(".input-layout--standard .input-layout__edge--bottom")).not.toBeNull();
    });

    it("uses the field centre when an empty field is focused by keyboard", (): void => {
        const { container }: { container: HTMLElement } = render(
            <TextInput label="Name" hint="Your name" />,
        );
        const control: HTMLElement | null = container.querySelector(".input-layout__control");
        const input: HTMLInputElement = screen.getByRole("textbox") as HTMLInputElement;

        if (control === null) {
            throw new Error("Input control is missing.");
        }

        vi.spyOn(control, "getBoundingClientRect").mockReturnValue({
            left: 10,
            top: 20,
            width: 100,
            height: 50,
        } as DOMRect);

        act((): void => {
            input.focus();
        });

        expect(control.style.getPropertyValue("--input-activation-x")).toBe("50%");
        expect(control.style.getPropertyValue("--input-activation-y")).toBe("50%");
        expect(readRatio(control, "top")).toBeCloseTo(25 / Math.hypot(50, 25), 5);
        expect(readRatio(control, "right")).toBeCloseTo(50 / Math.hypot(50, 25), 5);
        expect(vi.mocked(readCaretPoint)).not.toHaveBeenCalled();
    });

    it("uses the caret projection when a filled field is focused by keyboard", (): void => {
        const { container }: { container: HTMLElement } = render(
            <TextInput label="Name" hint="Your name" defaultValue="Hello" />,
        );
        const control: HTMLElement | null = container.querySelector(".input-layout__control");
        const input: HTMLInputElement = screen.getByRole("textbox") as HTMLInputElement;

        if (control === null) {
            throw new Error("Input control is missing.");
        }

        vi.spyOn(control, "getBoundingClientRect").mockReturnValue({
            left: 10,
            top: 20,
            width: 100,
            height: 50,
        } as DOMRect);
        vi.mocked(readCaretPoint).mockReturnValue({ x: 30, y: 40 });

        act((): void => {
            input.focus();
        });

        expect(vi.mocked(readCaretPoint)).toHaveBeenCalledWith(input);
        expect(control.style.getPropertyValue("--input-activation-x")).toBe("20%");
        expect(control.style.getPropertyValue("--input-activation-y")).toBe("40%");
        expect(readRatio(control, "top")).toBeCloseTo(20 / Math.hypot(80, 30), 5);
        expect(readRatio(control, "right")).toBeCloseTo(80 / Math.hypot(80, 30), 5);
        expect(readRatio(control, "bottom")).toBeCloseTo(30 / Math.hypot(80, 30), 5);
        expect(readRatio(control, "left")).toBeCloseTo(20 / Math.hypot(80, 30), 5);
    });
});
