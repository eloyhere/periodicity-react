/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Markdown from "../src/component/markdown/Markdown";
import { renderMarkdown } from "../src/component/markdown/render";
import Tex from "../src/component/tex/Tex";
import { renderTex } from "../src/component/tex/render";
import DocumentsPage from "../src/showcase/pages/components/DocumentsPage";

describe("Markdown preview", (): void => {
    it("renders headings, emphasis, lists, tables, quotes, and code", (): void => {
        const html = renderMarkdown(
            [
                "# Title",
                "",
                "A **bold** and *italic* paragraph with `code`.",
                "",
                "> Quoted line",
                "",
                "- one",
                "- two",
                "  - nested",
                "",
                "| Key | Value |",
                "| :--- | ---: |",
                "| a | 1 |",
                "",
                "```ts",
                "const x = 1;",
                "```",
            ].join("\n"),
        );

        expect(html).toContain("<h1>Title</h1>");
        expect(html).toContain("<strong>bold</strong>");
        expect(html).toContain("<em>italic</em>");
        expect(html).toContain("<code>code</code>");
        expect(html).toContain("<blockquote");
        expect(html).toContain("<ul");
        expect(html).toContain("nested");
        expect(html).toContain("<table");
        expect(html).toContain("markdown__cell--right");
        expect(html).toContain('class="language-ts"');
    });

    it("escapes raw markup and rejects unsafe URLs", (): void => {
        const html = renderMarkdown(
            [
                "<script>alert(1)</script>",
                "",
                "[click](javascript:void(0))",
                "",
                "![image](javascript:alert(1))",
            ].join("\n"),
        );

        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
        expect(html).not.toContain("javascript:");
        expect(html).not.toContain("<img");
        expect(html).toContain("click");
    });

    it("renders links and images with safe schemes", (): void => {
        const html = renderMarkdown(
            "[docs](https://example.com) ![logo](/logo.png) <https://example.com>",
        );

        expect(html).toContain('<a href="https://example.com">docs</a>');
        expect(html).toContain('<img src="/logo.png" alt="logo"');
        expect(html).toContain('<a href="https://example.com">https://example.com</a>');
    });

    it("keeps soft breaks by default and honours the breaks option", (): void => {
        expect(renderMarkdown("one\ntwo")).toContain("<p>one two</p>");
        expect(renderMarkdown("one\ntwo", { breaks: true })).toContain("<p>one<br />two</p>");
        expect(renderMarkdown("one  \ntwo")).toContain("<p>one<br />two</p>");
    });

    it("keeps intraword underscores literal", (): void => {
        const html: string = renderMarkdown("A snake_case_name and a _real emphasis_.");

        expect(html).toContain("snake_case_name");
        expect(html).toContain("<em>real emphasis</em>");
    });

    it("renders task list items without interactive controls", (): void => {
        const html = renderMarkdown("- [x] done\n- [ ] open");

        expect(html).toContain("markdown__task--done");
        expect(html).toContain("markdown__task");
        expect(html).not.toContain("<input");
    });

    it("renders the component with native attributes and content", (): void => {
        const { container } = render(
            <Markdown source={"## Notes\n\nRead **only**."} className="doc" data-testid="md" />,
        );
        const root: Element | null = container.querySelector(".markdown");

        expect(root).not.toBeNull();
        expect(root?.getAttribute("data-testid")).toBe("md");
        expect(root?.classList.contains("doc")).toBe(true);
        expect(root?.querySelector("h2")?.textContent).toBe("Notes");
        expect(root?.querySelector("strong")?.textContent).toBe("only");
    });
});

describe("TeX preview", (): void => {
    it("renders scripts, fractions, and roots as MathML", (): void => {
        const script: string = renderTex("E = mc^2");

        expect(script).toContain("<math");
        expect(script).toContain("<msup>");
        expect(script).toContain("<mi>E</mi>");
        expect(script).toContain("<mo>=</mo>");
        expect(renderTex("\\frac{a}{b}")).toContain("<mfrac>");
        expect(renderTex("\\sqrt{x}")).toContain("<msqrt>");
    });

    it("renders limits on large operators", (): void => {
        const html: string = renderTex("\\sum_{k=1}^{n} k");

        expect(html).toContain("<munderover>");
        expect(html).toContain("largeop");
    });

    it("renders matrices, cases, and delimiters", (): void => {
        const matrix: string = renderTex(
            "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
        );
        const cases: string = renderTex(
            "f(x) = \\begin{cases} x & x \\ge 0 \\\\ -x & x < 0 \\end{cases}",
        );
        const delimited: string = renderTex("\\left( \\frac{a}{b} \\right)");

        expect(matrix).toContain("<mtable>");
        expect(matrix).toContain("<mtr>");
        expect(matrix).toContain('<mo fence="true" stretchy="true">(</mo>');
        expect(cases).toContain('columnalign="left left"');
        expect(delimited).toContain('<mo fence="true" stretchy="true">(</mo>');
        expect(delimited).toContain("<mfrac>");
    });

    it("escapes text and keeps unknown commands harmless", (): void => {
        const html: string = renderTex("\\text{<script>alert(1)</script>}");

        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
        expect((): string => renderTex("\\unknown{a}")).not.toThrow();
    });

    it("supports inline and display modes", (): void => {
        expect(renderTex("x", { display: false })).toContain('display="inline"');
        expect(renderTex("x")).toContain('display="block"');

        const { container } = render(<Tex source="x^2" display={false} />);
        const math: Element | null = container.querySelector("math");

        expect(math).not.toBeNull();
        expect(math?.getAttribute("display")).toBe("inline");
        expect(container.querySelector(".tex--inline")).not.toBeNull();
    });
});

describe("Documents showcase page", (): void => {
    it("renders the Markdown preview and the maths examples", (): void => {
        const { container } = render(<DocumentsPage />);

        expect(container.querySelectorAll(".markdown").length).toBe(1);
        expect(container.querySelectorAll("math").length).toBeGreaterThan(4);
        expect(container.textContent).toContain("Field notes");
    });
});
