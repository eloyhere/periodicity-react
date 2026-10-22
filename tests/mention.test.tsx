import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Mention from "../src/component/mention/Mention";

describe("Mention field", (): void => {
    it("focuses the editor from the shared field shell", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Mention label="Reply" onChange={(): void => {}} prefix="Mention" />,
        );
        const editor: HTMLElement = screen.getByRole("combobox");
        const prefix: HTMLElement | null = container.querySelector(".input-layout__prefix");

        expect(container.querySelector(".input-layout.mention")).not.toBeNull();
        expect(container.querySelector(".input-layout__hint")?.textContent).toBe("Reply");
        expect(screen.getByLabelText("Reply")).toBe(editor);

        if (prefix === null) {
            throw new Error("Mention prefix slot is missing.");
        }

        expect(fireEvent.pointerDown(prefix)).toBe(false);
        expect(document.activeElement).toBe(editor);
    });

    it("floats the shared hint while the editor is focused", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Mention label="Reply" onChange={(): void => {}} />,
        );
        const editor: HTMLElement = screen.getByRole("combobox");
        const root: HTMLElement | null = container.querySelector(".input-layout.mention");

        act((): void => {
            editor.focus();
        });

        expect(root?.getAttribute("data-hint-floating")).toBe("true");

        act((): void => {
            editor.blur();
        });

        expect(root?.getAttribute("data-hint-floating")).toBeNull();
    });

    it("still emits edited text through the shared field shell", (): void => {
        const change: (value: string) => void = vi.fn();
        render(<Mention label="Reply" onChange={change} />);
        const editor: HTMLElement = screen.getByRole("combobox");

        editor.textContent = "Hello";
        fireEvent.input(editor);

        expect(change).toHaveBeenCalledWith("Hello");
    });

    it("does not focus a disabled editor from the field shell", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Mention label="Reply" disabled onChange={(): void => {}} prefix="Mention" />,
        );
        const editor: HTMLElement = screen.getByRole("combobox");
        const prefix: HTMLElement | null = container.querySelector(".input-layout__prefix");

        if (prefix === null) {
            throw new Error("Mention prefix slot is missing.");
        }

        fireEvent.click(prefix);
        expect(document.activeElement).not.toBe(editor);
    });

    it("still focuses a read-only editor from the field shell", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Mention label="Reply" readOnly onChange={(): void => {}} prefix="Mention" />,
        );
        const editor: HTMLElement = screen.getByRole("combobox");
        const prefix: HTMLElement | null = container.querySelector(".input-layout__prefix");

        if (prefix === null) {
            throw new Error("Mention prefix slot is missing.");
        }

        fireEvent.click(prefix);
        expect(document.activeElement).toBe(editor);
    });
});
