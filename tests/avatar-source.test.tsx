import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Avatar from "../src/component/thumb/Avatar";

const dataUri: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("avatar sources", (): void => {
    it("renders a URL string as the image source", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Avatar name="Mira Chen" src="https://example.com/mira.png" />,
        );
        const image: HTMLImageElement | null =
            container.querySelector<HTMLImageElement>(".avatar__image");

        expect(image).not.toBeNull();
        expect(image?.getAttribute("src")).toBe("https://example.com/mira.png");
        expect(image?.getAttribute("alt")).toBe("");
    });

    it("renders a base64 data URI as the image source", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Avatar name="Mira Chen" src={dataUri} />,
        );
        const image: HTMLImageElement | null =
            container.querySelector<HTMLImageElement>(".avatar__image");

        expect(image?.getAttribute("src")).toBe(dataUri);
    });

    it("renders an inline SVG node instead of an image", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Avatar
                name="Mira Chen"
                src={
                    <svg data-testid="avatar-mark" viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="14" />
                    </svg>
                }
            />,
        );

        expect(container.querySelector(".avatar__custom svg")).not.toBeNull();
        expect(container.querySelector("img")).toBeNull();
        expect(screen.getByTestId("avatar-mark")).not.toBeNull();
        expect(screen.getByRole("img", { name: "Mira Chen" })).not.toBeNull();
    });

    it("falls back to initials when the image fails to load", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Avatar name="Mira Chen" src="/missing.png" />,
        );
        const image: HTMLImageElement | null =
            container.querySelector<HTMLImageElement>(".avatar__image");

        if (image === null) {
            throw new Error("Avatar image is missing.");
        }

        fireEvent.error(image);

        expect(container.querySelector("img")).toBeNull();
        expect(container.querySelector(".avatar__initials")?.textContent).toBe("MC");
    });

    it("keeps the initials fallback when no source is supplied", (): void => {
        const { container }: { container: HTMLElement } = render(<Avatar name="Ada Lovelace" />);

        expect(container.querySelector("img")).toBeNull();
        expect(container.querySelector(".avatar__initials")?.textContent).toBe("AL");
    });
});
