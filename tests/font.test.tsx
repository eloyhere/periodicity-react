import { render, screen } from "@testing-library/react";
import { useRef, type FC, type RefObject } from "react";
import { describe, expect, it } from "vitest";
import Font from "../src/component/font/Font";
import { useFont, type FontInfo } from "../src/component/font/useFont";

const readVariable: (element: HTMLElement, name: string) => string = (
    element: HTMLElement,
    name: string,
): string => element.style.getPropertyValue(name);

describe("Font", (): void => {
    it("writes the hierarchy and font metadata to CSS variables", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Font
                level="h2"
                scale={1.25}
                family="mono"
                color="rebeccapurple"
                weight="semibold"
                lineHeight="snug"
                letterSpacing="wide"
                transform="uppercase"
                align="center"
                truncate
            >
                <span>Content</span>
            </Font>,
        );
        const font: HTMLElement | null = container.querySelector(".font");

        if (font === null) {
            throw new Error("Font root is missing.");
        }

        expect(font.classList.contains("font--level-h2")).toBe(true);
        expect(font.classList.contains("font--truncate")).toBe(true);
        expect(readVariable(font, "--font-size-current")).toBe("var(--type-h2)");
        expect(readVariable(font, "--font-scale")).toBe("1.25");
        expect(readVariable(font, "--type-display")).toBe(
            "calc(var(--type-base-display) * 1.25)",
        );
        expect(readVariable(font, "--type-mono")).toBe("calc(var(--type-base-mono) * 1.25)");
        expect(readVariable(font, "--font-family-current")).toBe("var(--font-mono)");
        expect(readVariable(font, "--font-color-current")).toBe("rebeccapurple");
        expect(readVariable(font, "--font-weight-current")).toBe("var(--weight-semibold)");
        expect(readVariable(font, "--font-leading-current")).toBe("var(--leading-snug)");
        expect(readVariable(font, "--font-tracking-current")).toBe("var(--tracking-wide)");
        expect(readVariable(font, "--font-transform-current")).toBe("uppercase");
        expect(readVariable(font, "--font-align-current")).toBe("center");
    });

    it("inherits family, colour, and level across nested scopes", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Font level="h3" family="display" color="tomato">
                <Font level="body" scale={0.5}>
                    <span>Inner</span>
                </Font>
            </Font>,
        );
        const fonts: NodeListOf<HTMLElement> = container.querySelectorAll<HTMLElement>(".font");
        const inner: HTMLElement | null = fonts.item(1);

        if (inner === null) {
            throw new Error("Nested Font root is missing.");
        }

        expect(fonts).toHaveLength(2);
        expect(inner.classList.contains("font--level-body")).toBe(true);
        expect(readVariable(inner, "--font-scale")).toBe("1");
        expect(readVariable(inner, "--type-body")).toBe("calc(var(--type-base-body) * 1)");
        expect(readVariable(inner, "--font-family-current")).toBe("var(--font-display)");
        expect(readVariable(inner, "--font-color-current")).toBe("tomato");
    });

    it("exposes italic and a minimum scale of one", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Font scale={0.25} italic>
                <span>Italic</span>
            </Font>,
        );
        const font: HTMLElement | null = container.querySelector(".font");

        if (font === null) {
            throw new Error("Font root is missing.");
        }

        expect(readVariable(font, "--font-scale")).toBe("1");
        expect(readVariable(font, "--font-style-current")).toBe("italic");
    });
});

interface ProbeProps {
    target: RefObject<HTMLElement | null>;
}

const Probe: FC<ProbeProps> = ({ target }: ProbeProps) => {
    const font: FontInfo = useFont(target);

    return (
        <output data-testid="probe">
            {`${font.family}|${font.size}|${font.color}|${font.weight}|${font.lineHeight}|${font.letterSpacing}|${font.transform}`}
        </output>
    );
};

describe("useFont", (): void => {
    it("reads the computed font metadata of the reference", (): void => {
        const Harness: FC = () => {
            const ref: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

            return (
                <>
                    <div
                        ref={ref}
                        style={{
                            fontFamily: "monospace",
                            fontSize: "18px",
                            color: "rgb(1, 2, 3)",
                            fontWeight: "600",
                            lineHeight: "1.5",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        }}
                    >
                        Measured
                    </div>
                    <Probe target={ref} />
                </>
            );
        };

        render(<Harness />);

        expect(screen.getByTestId("probe").textContent).toContain("monospace");
        expect(screen.getByTestId("probe").textContent).toContain("18px");
        expect(screen.getByTestId("probe").textContent).toContain("rgb(1, 2, 3)");
        expect(screen.getByTestId("probe").textContent).toContain("600");
        expect(screen.getByTestId("probe").textContent).toContain("1.5");
        expect(screen.getByTestId("probe").textContent).toContain("1px");
        expect(screen.getByTestId("probe").textContent).toContain("uppercase");
    });

    it("falls back to the nearest Font context before a ref mounts", (): void => {
        const NullProbe: FC = () => {
            const ref: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
            const font: FontInfo = useFont(ref);

            return (
                <output data-testid="fallback">
                    {`${font.family}|${font.size}|${font.color}`}
                </output>
            );
        };

        render(
            <Font level="h4" family="mono" color="var(--accent)">
                <NullProbe />
            </Font>,
        );

        expect(screen.getByTestId("fallback").textContent).toBe(
            "var(--font-mono)|var(--type-h4)|var(--accent)",
        );
    });
});
