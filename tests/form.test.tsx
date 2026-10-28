/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Form, FormActions, FormField, FormMessage, FormSubmit } from "../src/component";
import type { FormErrors } from "../src/component";

const renderForm = (props: Record<string, unknown>): HTMLElement => {
    const { container } = render(
        <Form {...props}>
            <FormMessage />
            <FormField label="Email" name="email">
                {(field) => <input {...field} type="email" />}
            </FormField>
            <FormField label="Topics" name="topics">
                {(field) => (
                    <>
                        <input {...field} value="design" type="checkbox" aria-label="Design" />
                        <input {...field} value="code" type="checkbox" aria-label="Code" />
                    </>
                )}
            </FormField>
            <FormActions align="end">
                <FormSubmit content="Save" pendingContent="Saving…" />
            </FormActions>
        </Form>,
    );

    return container.querySelector("form") as HTMLFormElement;
};

describe("Form", (): void => {
    it("blocks submission, renders field errors, and focuses the message", async (): Promise<void> => {
        const onValidSubmit = vi.fn();
        const onInvalidSubmit = vi.fn();
        const form = renderForm({
            validate: (): FormErrors => ({ email: "Enter an address." }),
            onValidSubmit,
            onInvalidSubmit,
        });

        fireEvent.submit(form);

        await waitFor((): void => {
            expect(onInvalidSubmit).toHaveBeenCalledTimes(1);
        });

        expect(onValidSubmit).not.toHaveBeenCalled();
        expect(form.querySelector(".form-message__list")?.textContent).toBe("Enter an address.");
        expect(form.querySelector(".form-field")?.getAttribute("data-invalid")).toBe("true");
        expect(document.activeElement).toBe(form.querySelector(".form-message"));
    });

    it("collects values, marks itself pending, and re-enables the submit button", async (): Promise<void> => {
        let release: () => void = (): void => {};
        const gate: Promise<void> = new Promise<void>((resolve: () => void): void => {
            release = resolve;
        });
        const onValidSubmit = vi.fn((): Promise<void> => gate);
        const form = renderForm({
            validate: (): FormErrors => ({}),
            onValidSubmit,
        });
        const email: HTMLInputElement = screen.getByLabelText("Email") as HTMLInputElement;

        fireEvent.change(email, { target: { value: "mira@example.com" } });
        fireEvent.click(screen.getByLabelText("Design"));
        fireEvent.click(screen.getByLabelText("Code"));
        fireEvent.submit(form);

        await waitFor((): void => {
            expect(onValidSubmit).toHaveBeenCalledTimes(1);
        });

        expect(onValidSubmit.mock.calls[0][0]).toEqual({
            email: "mira@example.com",
            topics: ["design", "code"],
        });

        const pendingButton: HTMLButtonElement = screen.getByText("Saving…").closest(
            "button",
        ) as HTMLButtonElement;

        expect(pendingButton.disabled).toBe(true);
        expect(form.getAttribute("data-pending")).toBe("true");

        release();

        await waitFor((): void => {
            expect(form.getAttribute("data-pending")).toBe("false");
        });

        expect(
            (screen.getByText("Save").closest("button") as HTMLButtonElement).disabled,
        ).toBe(false);
    });

    it("reports a rejected submission through the message region", async (): Promise<void> => {
        const onSubmitError = vi.fn();
        const form = renderForm({
            validate: (): FormErrors => ({}),
            onValidSubmit: (): Promise<void> => Promise.reject(new Error("Server exploded")),
            onSubmitError,
        });

        fireEvent.submit(form);

        await waitFor((): void => {
            expect(screen.getByText("Server exploded")).toBeTruthy();
        });

        expect(onSubmitError).toHaveBeenCalledTimes(1);
        expect(form.querySelector(".form-message")?.getAttribute("role")).toBe("alert");
    });

    it("clears errors on reset while keeping the native reset event", async (): Promise<void> => {
        const onReset = vi.fn();
        const form = renderForm({ defaultErrors: { email: "Stale error" }, onReset });

        expect(form.querySelector(".form-message__list")?.textContent).toBe("Stale error");

        fireEvent(form, new Event("reset", { bubbles: true }));

        await waitFor((): void => {
            expect(form.querySelector(".form-message")).toBeNull();
        });

        expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("still calls the native onSubmit handler first", (): void => {
        const onSubmit = vi.fn();
        const form = renderForm({
            validate: (): FormErrors => ({}),
            onValidSubmit: (): void => {},
            onSubmit,
        });

        fireEvent.submit(form);

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });
});
