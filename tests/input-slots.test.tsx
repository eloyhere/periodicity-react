/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
    PeriodicityColourPicker,
    PeriodicityCompleteInput,
    PeriodicityMention,
    PeriodicityNumberInput,
    PeriodicityTextArea,
    PeriodicityTextInput,
} from "../src/component/public";

describe("six-slot inputs", (): void => {
    it("renders prefix, hint, message, limitation, and suffix slots", (): void => {
        const { container } = render(
            <PeriodicityTextInput
                label="Email"
                hint="name@example.com"
                message="We never share it."
                limitation
                maxLength={80}
                prefix="Mail"
                suffix="Check"
            />,
        );

        expect(container.querySelector(".input-layout__prefix")).not.toBeNull();
        expect(container.querySelector(".input-layout__hint")?.textContent).toBe(
            "name@example.com",
        );
        expect(container.querySelector(".input-layout__message")?.textContent).toBe(
            "We never share it.",
        );
        expect(container.querySelector(".input-layout__limitation")?.textContent).toContain(
            "0 / 80",
        );
        expect(container.querySelector(".input-layout__suffix")).not.toBeNull();
        expect(screen.getByRole("textbox").getAttribute("placeholder")).toBe(" ");
    });

    it("replaces the message with the error slot", (): void => {
        const { container } = render(
            <PeriodicityTextInput
                label="Email"
                hint="name@example.com"
                message="We never share it."
                error="Enter a valid address."
            />,
        );

        expect(container.querySelector(".input-layout__message")).toBeNull();
        expect(container.querySelector(".input-layout__error")?.textContent).toBe(
            "Enter a valid address.",
        );
    });

    it("keeps the same slots on CompleteInput and Mention", (): void => {
        const { container, rerender } = render(
            <PeriodicityCompleteInput
                label="Search"
                options={["Alpha", "Beta"]}
                value=""
                onChange={() => {}}
                hint="Type to search"
                message="Suggestions update as you type."
                limitation={true}
                prefix="Search"
                suffix="Check"
            />,
        );

        expect(container.querySelector(".input-layout.complete-input")).not.toBeNull();
        expect(container.querySelector(".input-layout__prefix")).not.toBeNull();
        expect(container.querySelector(".input-layout__hint")?.textContent).toBe(
            "Type to search",
        );
        expect(container.querySelector(".input-layout__message")?.textContent).toBe(
            "Suggestions update as you type.",
        );
        expect(container.querySelector(".input-layout__limitation")?.textContent).toBe("0");
        expect(container.querySelector(".input-layout__suffix")).not.toBeNull();

        rerender(
            <PeriodicityMention
                label="Reply"
                value=""
                onChange={() => {}}
                hint="Write a reply"
                message="Type @ to mention someone."
                limitation={true}
                prefix="Mention"
                suffix="Send"
            />,
        );

        expect(container.querySelector(".input-layout.mention")).not.toBeNull();
        expect(container.querySelector(".input-layout__prefix")).not.toBeNull();
        expect(container.querySelector(".input-layout__hint")?.textContent).toBe(
            "Write a reply",
        );
        expect(container.querySelector(".input-layout__message")?.textContent).toBe(
            "Type @ to mention someone.",
        );
        expect(container.querySelector(".input-layout__limitation")?.textContent).toBe("0");
        expect(container.querySelector(".input-layout__suffix")).not.toBeNull();
        expect(screen.getByRole("combobox")).toBeTruthy();
    });

    it("replaces the Mention message with the error slot", (): void => {
        const { container } = render(
            <PeriodicityMention
                label="Reply"
                message="Type @ to mention someone."
                error="Choose a valid mention."
                onChange={() => {}}
            />,
        );
        const editor: HTMLElement = screen.getByRole("combobox");
        const error: HTMLElement | null = container.querySelector(".input-layout__error");

        expect(container.querySelector(".input-layout__message")).toBeNull();
        expect(error?.textContent).toBe("Choose a valid mention.");
        expect(editor.getAttribute("aria-describedby")).toBe(error?.id);
    });

    it("paints hover and click ripple on the input surface", (): void => {
        const { container } = render(
            <PeriodicityTextInput label="Name" hint="Your name" />,
        );
        const surface: HTMLElement = container.querySelector(".input-layout__surface") as HTMLElement;

        fireEvent.pointerEnter(surface, { pointerType: "mouse", clientX: 8, clientY: 8 });
        expect(surface.querySelectorAll(".ripple").length).toBeGreaterThan(0);

        fireEvent.pointerDown(surface, { pointerType: "mouse", clientX: 8, clientY: 8 });
        expect(surface.querySelectorAll(".ripple").length).toBeGreaterThan(0);
    });

    it("opens the colour picker from anywhere in its field", (): void => {
        const click = vi.spyOn(HTMLInputElement.prototype, "click");
        const { container } = render(
            <PeriodicityColourPicker label="Accent" defaultValue="#1976d2" />,
        );
        const control: HTMLElement = container.querySelector(
            ".picker-field__control",
        ) as HTMLElement;

        fireEvent.click(control);

        expect(click).toHaveBeenCalled();
    });

    it("prevents the input from blurring when a focused field is pressed", (): void => {
        const { container } = render(
            <PeriodicityTextInput label="Name" hint="Your name" prefix="Search" />,
        );
        const input: HTMLInputElement = screen.getByRole("textbox") as HTMLInputElement;
        const prefix: HTMLElement = container.querySelector(".input-layout__prefix") as HTMLElement;

        input.focus();

        expect(fireEvent.pointerDown(prefix)).toBe(false);
        expect(document.activeElement).toBe(input);
    });

    it("focuses the input when the surrounding field is clicked", (): void => {
        const { container } = render(
            <PeriodicityTextInput label="Name" hint="Your name" prefix="Search" />,
        );
        const input: HTMLInputElement = screen.getByRole("textbox") as HTMLInputElement;
        const prefix: HTMLElement = container.querySelector(".input-layout__prefix") as HTMLElement;

        fireEvent.click(prefix);

        expect(document.activeElement).toBe(input);
    });

    it("keeps the same slots on TextArea and NumberInput", (): void => {
        const { container, rerender } = render(
            <PeriodicityTextArea
                label="Notes"
                hint="Add notes"
                message="Markdown is supported."
                limitation
                maxLength={120}
                prefix="File"
                suffix="Edit"
            />,
        );

        expect(container.querySelector(".input-layout__hint")?.textContent).toBe("Add notes");
        expect(container.querySelector(".input-layout__limitation")?.textContent).toContain(
            "0 / 120",
        );

        rerender(
            <PeriodicityNumberInput
                label="Guests"
                hint="Number of guests"
                message="Between 1 and 8."
                prefix="Person"
                suffix="Setting"
                min={1}
                max={8}
                onChange={() => {}}
            />,
        );

        expect(container.querySelector(".input-layout__prefix")).not.toBeNull();
        expect(container.querySelector(".input-layout__suffix")).not.toBeNull();
        expect(container.querySelector(".input-layout__message")?.textContent).toBe(
            "Between 1 and 8.",
        );

        const step: HTMLElement = container.querySelector(
            ".number-field__step-surface",
        ) as HTMLElement;
        fireEvent.pointerDown(step, { pointerType: "mouse", clientX: 4, clientY: 4 });
        expect(step.querySelectorAll(".ripple").length).toBeGreaterThan(0);
    });
});
