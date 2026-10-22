/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Select from "../src/component/input/select/list/normal/Select";

const renderOpenSelect = () => {
    render(
        <Select
            label="Brand"
            options={[{ value: "deepseek", label: "DeepSeek" }]}
            onChange={() => {}}
        />,
    );
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).not.toBeNull();
};

const settleClose = (): void => {
    act(() => {
        vi.advanceTimersByTime(200);
    });
};

describe("floating layer dismiss fallbacks", (): void => {
    beforeEach((): void => {
        vi.useFakeTimers();
    });

    afterEach((): void => {
        Reflect.deleteProperty(document, "visibilityState");
        vi.useRealTimers();
    });

    it("closes the listbox when the window loses focus", (): void => {
        renderOpenSelect();

        fireEvent(window, new Event("blur"));
        settleClose();

        expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("closes the listbox when the document becomes hidden", (): void => {
        Object.defineProperty(document, "visibilityState", {
            configurable: true,
            get: (): string => "hidden",
        });
        renderOpenSelect();

        fireEvent(document, new Event("visibilitychange"));
        settleClose();

        expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("keeps the listbox while the document stays visible", (): void => {
        Object.defineProperty(document, "visibilityState", {
            configurable: true,
            get: (): string => "visible",
        });
        renderOpenSelect();

        fireEvent(document, new Event("visibilitychange"));
        settleClose();

        expect(screen.getByRole("listbox")).not.toBeNull();
    });
});
