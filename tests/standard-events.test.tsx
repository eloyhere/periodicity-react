/* eslint-disable @typescript-eslint/typedef, react-hooks/refs -- Test doubles and callback refs are intentionally concise. */
import { fireEvent, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { useStandardEvents } from "../src/gesture/react/useStandardEvents";
import type { StandardEventOptions } from "../src/gesture/events/types";

const Box: (props: { options: StandardEventOptions; testId: string }) => ReactElement = (props: {
    options: StandardEventOptions;
    testId: string;
}): ReactElement => {
    const events = useStandardEvents(props.options);

    return <div data-testid={props.testId} ref={events.ref} />;
};

const Input: (props: { options: StandardEventOptions }) => ReactElement = (props: {
    options: StandardEventOptions;
}): ReactElement => {
    const events = useStandardEvents(props.options);

    return <input data-testid="input" ref={events.ref} />;
};

describe("useStandardEvents", (): void => {
    it("emits over, enter, leave, and wheel", (): void => {
        const over = vi.fn();
        const enter = vi.fn();
        const leave = vi.fn();
        const wheel = vi.fn();
        const { getByTestId } = render(<Box testId="box" options={{ over, enter, leave, wheel }} />);
        const box: HTMLElement = getByTestId("box");

        fireEvent.pointerEnter(box, { pointerType: "mouse", clientX: 10, clientY: 20 });
        fireEvent.pointerLeave(box, { pointerType: "mouse", clientX: 30, clientY: 40 });
        fireEvent.wheel(box, { deltaX: 1, deltaY: 2, deltaMode: 0, clientX: 5, clientY: 6 });

        expect(over).toHaveBeenCalledTimes(1);
        expect(over.mock.calls[0]?.[0]?.x).toBe(10);
        expect(enter).toHaveBeenCalledTimes(1);
        expect(leave).toHaveBeenCalledTimes(1);
        expect(wheel).toHaveBeenCalledTimes(1);
        expect(wheel.mock.calls[0]?.[0]?.deltaY).toBe(2);
    });

    it("emits press and click, then continuous on a second click", (): void => {
        const press = vi.fn();
        const click = vi.fn();
        const continuous = vi.fn();
        const { getByTestId } = render(
            <Box testId="box" options={{ press, click, continuous, continuousInterval: 1000 }} />,
        );
        const box: HTMLElement = getByTestId("box");

        fireEvent.pointerDown(box, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 10, clientY: 20 });
        expect(press).toHaveBeenCalledTimes(1);
        fireEvent.pointerUp(box, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 10, clientY: 20 });
        fireEvent.click(box, { clientX: 10, clientY: 20 });
        fireEvent.click(box, { clientX: 10, clientY: 20 });

        expect(click).toHaveBeenCalledTimes(2);
        expect(click.mock.calls[0]?.[0]?.count).toBe(1);
        expect(click.mock.calls[1]?.[0]?.count).toBe(2);
        expect(continuous).toHaveBeenCalledTimes(1);
        expect(continuous.mock.calls[0]?.[0]?.count).toBe(2);
    });

    it("emits drag start, move, and end, and suppresses the trailing click", (): void => {
        const drag = vi.fn();
        const click = vi.fn();
        const { getByTestId } = render(<Box testId="box" options={{ drag, click }} />);
        const box: HTMLElement = getByTestId("box");

        fireEvent.pointerDown(box, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 0, clientY: 0 });
        fireEvent.pointerMove(box, { pointerId: 1, pointerType: "mouse", clientX: 20, clientY: 10 });
        fireEvent.pointerUp(box, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 20, clientY: 10 });
        fireEvent.click(box, { clientX: 20, clientY: 10 });

        expect(drag.mock.calls.map((call) => call[0].phase)).toEqual(["start", "move", "end"]);
        expect(click).not.toHaveBeenCalled();
    });

    it("emits press and click from the keyboard", (): void => {
        const press = vi.fn();
        const click = vi.fn();
        const { getByTestId } = render(<Box testId="box" options={{ press, click }} />);
        const box: HTMLElement = getByTestId("box");

        fireEvent.keyDown(box, { key: "Enter" });
        fireEvent.keyUp(box, { key: "Enter" });
        fireEvent.click(box, { detail: 0 });

        expect(press).toHaveBeenCalledTimes(1);
        expect(click).toHaveBeenCalledTimes(1);
        expect(click.mock.calls[0]?.[0]?.source).toBe("keyboard");
    });

    it("emits an input event with the current value", (): void => {
        const input = vi.fn();
        const { getByTestId } = render(<Input options={{ input }} />);
        const element: HTMLInputElement = getByTestId("input") as HTMLInputElement;

        fireEvent.input(element, { target: { value: "hello" } });

        expect(input).toHaveBeenCalledTimes(1);
        expect(input.mock.calls[0]?.[0]?.value).toBe("hello");
    });
});
