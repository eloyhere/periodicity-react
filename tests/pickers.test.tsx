/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AvatarPicker, FilePicker, PhotoPicker } from "../src/component";

const sampleFile = (): File => new File(["pixels"], "photo.png", { type: "image/png" });

const pickImage = async (container: HTMLElement): Promise<HTMLInputElement> => {
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.click(screen.getByRole("button"));
    fireEvent.change(input, { target: { files: [sampleFile()] } });
    await screen.findByRole("dialog");
    return input;
};

describe("file and image pickers", (): void => {
    it("render a native file input", (): void => {
        const { container } = render(
            <div>
                <FilePicker label="Files" />
                <PhotoPicker label="Photo" />
                <AvatarPicker label="Avatar" name="Ada" />
            </div>,
        );

        expect(container.querySelectorAll('input[type="file"]')).toHaveLength(3);
    });

    it("emits the selected files from FilePicker", async (): Promise<void> => {
        const onChange = vi.fn();
        const { container } = render(<FilePicker label="Files" multiple onChange={onChange} />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.click(screen.getByRole("button"));
        fireEvent.change(input, { target: { files: [sampleFile()] } });

        await waitFor((): void => {
            expect(onChange).toHaveBeenCalledTimes(1);
        });
        expect(onChange.mock.calls[0][0][0].name).toBe("photo.png");
    });

    it("opens the crop dialog when window focus beats the change event", async (): Promise<void> => {
        const onChange = vi.fn();
        const { container } = render(
            <StrictMode>
                <PhotoPicker label="Photo" onChange={onChange} />
            </StrictMode>,
        );
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.click(screen.getByRole("button"));
        fireEvent.focus(window);
        await new Promise<void>((resolve: () => void): void => {
            window.setTimeout(resolve, 20);
        });
        fireEvent.change(input, { target: { files: [sampleFile()] } });

        expect(await screen.findByRole("dialog")).not.toBeNull();
        expect(onChange).not.toHaveBeenCalled();
    });

    it("opens the crop dialog even when change never fires", async (): Promise<void> => {
        const { container } = render(<PhotoPicker label="Photo" />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.click(screen.getByRole("button"));
        fireEvent.focus(window);
        Object.defineProperty(input, "files", { value: [sampleFile()], configurable: true });

        expect(await screen.findByRole("dialog")).not.toBeNull();
    });

    it("emits once with the original image when the crop is cancelled", async (): Promise<void> => {
        const onChange = vi.fn();
        const { container } = render(<PhotoPicker label="Photo" onChange={onChange} />);

        await pickImage(container);
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        await waitFor((): void => {
            expect(onChange).toHaveBeenCalledTimes(1);
        });
        expect(onChange.mock.calls[0][0].cropped).toBe(false);
        expect(onChange.mock.calls[0][0].file.name).toBe("photo.png");
    });

    it("does not emit when the crop dialog is closed", async (): Promise<void> => {
        const onChange = vi.fn();
        const { container } = render(<PhotoPicker label="Photo" onChange={onChange} />);

        await pickImage(container);
        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        await waitFor((): void => {
            expect(screen.queryByRole("dialog")).toBeNull();
        });
        expect(onChange).not.toHaveBeenCalled();
    });

    it("keeps the crop slot inside the dialog", async (): Promise<void> => {
        const { container } = render(
            <PhotoPicker
                label="Photo"
                slots={{
                    crop: (): ReactNode => <p>custom crop</p>,
                }}
            />,
        );

        await pickImage(container);
        const dialog: HTMLElement = screen.getByRole("dialog");

        expect(dialog.textContent).toContain("custom crop");
    });
});
