import { fireEvent, render, screen } from "@testing-library/react";
import { useState, type Dispatch, type FC, type SetStateAction } from "react";
import { describe, expect, it } from "vitest";
import { PeriodicityDrawerLayout } from "../src/component/public";

const DrawerHarness: FC = () => {
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);

    return (
        <>
            <button
                data-testid="toggle"
                type="button"
                onClick={(): void => setOpen((value: boolean): boolean => !value)}
            >
                Menu
            </button>
            <PeriodicityDrawerLayout
                leftOpen={open}
                onLeftOpenChange={setOpen}
                left={<nav data-testid="nav">Navigation</nav>}
                centre={<main data-testid="centre">Content</main>}
            />
        </>
    );
};

const leftPane: (container: HTMLElement) => HTMLElement = (container: HTMLElement): HTMLElement => {
    const pane: HTMLElement | null = container.querySelector(".drawer-layout__pane--left");

    if (pane === null) {
        throw new Error("Left drawer pane is missing.");
    }

    return pane;
};

describe("DrawerLayout outside pointer handling", (): void => {
    it("lets an external toggle close and reopen the drawer", (): void => {
        const { container }: { container: HTMLElement } = render(<DrawerHarness />);
        const toggle: HTMLElement = screen.getByTestId("toggle");
        const pane: HTMLElement = leftPane(container);

        expect(pane.getAttribute("data-open")).toBe("true");

        expect(
            fireEvent.pointerDown(toggle, { pointerType: "mouse", button: 0 }),
        ).toBe(true);
        fireEvent.click(toggle);

        expect(pane.getAttribute("data-open")).toBe("false");

        expect(
            fireEvent.pointerDown(toggle, { pointerType: "mouse", button: 0 }),
        ).toBe(true);
        fireEvent.click(toggle);

        expect(pane.getAttribute("data-open")).toBe("true");
    });

    it("still closes when the scrim is clicked", (): void => {
        const { container }: { container: HTMLElement } = render(<DrawerHarness />);
        const pane: HTMLElement = leftPane(container);
        const scrim: HTMLElement | null = container.querySelector(".drawer-layout__scrim");

        if (scrim === null) {
            throw new Error("Drawer scrim is missing.");
        }

        fireEvent.pointerDown(scrim, { pointerType: "mouse", button: 0 });
        fireEvent.click(scrim);

        expect(pane.getAttribute("data-open")).toBe("false");
    });

    it("keeps the drawer open when the open pane is pressed", (): void => {
        const { container }: { container: HTMLElement } = render(<DrawerHarness />);
        const pane: HTMLElement = leftPane(container);
        const nav: HTMLElement = screen.getByTestId("nav");

        fireEvent.pointerDown(nav, { pointerType: "mouse", button: 0 });

        expect(pane.getAttribute("data-open")).toBe("true");
    });

    it("closes when a non-pane area inside the layout is pressed", (): void => {
        const { container }: { container: HTMLElement } = render(<DrawerHarness />);
        const pane: HTMLElement = leftPane(container);
        const centre: HTMLElement = screen.getByTestId("centre");

        fireEvent.pointerDown(centre, { pointerType: "mouse", button: 0 });

        expect(pane.getAttribute("data-open")).toBe("false");
    });
});
