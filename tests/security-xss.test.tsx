import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Markdown from "../src/component/markdown/Markdown";
import { renderMarkdown } from "../src/component/markdown/render";
import Tex from "../src/component/tex/Tex";
import { renderTex } from "../src/component/tex/render";
import type { FileNode } from "../src/layout/file/project";
import { renderFile } from "../src/layout/file/render";
import { renderLatexDocument } from "../src/component/tex/document";

const forbiddenTags: readonly string[] = [
    "script",
    "iframe",
    "object",
    "embed",
    "form",
    "base",
    "meta",
    "link",
    "style",
];

const normalizedUrl: (value: string) => string = (value: string): string =>
    Array.from(value)
        .filter((char: string): boolean => {
            const code: number = char.charCodeAt(0);

            return code > 0x20 && code !== 0x7f;
        })
        .join("")
        .toLowerCase();

const unsafeUrl: (value: string) => boolean = (value: string): boolean => {
    const url: string = normalizedUrl(value);

    return (
        url.startsWith("javascript:") ||
        url.startsWith("vbscript:") ||
        url.startsWith("data:")
    );
};

const unsafeAttributes: (element: Element) => readonly string[] = (
    element: Element,
): readonly string[] =>
    Array.from(element.attributes)
        .filter((attribute: Attr): boolean => {
            const name: string = attribute.name.toLowerCase();

            return (
                name.startsWith("on") ||
                name === "srcdoc" ||
                name === "formaction" ||
                name === "xlink:href" ||
                ((name === "href" || name === "src") && unsafeUrl(attribute.value))
            );
        })
        .map((attribute: Attr): string => attribute.name);

const auditHtml: (html: string) => void = (html: string): void => {
    const parsed: Document = new DOMParser().parseFromString(html, "text/html");

    for (const tag of forbiddenTags) {
        expect(parsed.querySelector(tag), `forbidden <${tag}> in: ${html}`).toBeNull();
    }

    for (const element of Array.from(parsed.body.querySelectorAll("*"))) {
        expect(
            unsafeAttributes(element),
            `${element.tagName} carried an unsafe attribute in: ${html}`,
        ).toEqual([]);
    }
};

const markdownPayloads: readonly string[] = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "<svg onload=alert(1)></svg>",
    "<a href=\"javascript:alert(1)\">x</a>",
    "<!-- <script>alert(1)</script> -->",
    "[x](javascript:alert(1))",
    "[x](JaVaScRiPt:alert(1))",
    "[x](vbscript:msgbox(1))",
    "[x](data:text/html,<script>alert(1)</script>)",
    "[x](  javascript:alert(1))",
    "[x](java\tscript:alert(1))",
    "[x](https://example.com/%22%20onmouseover%3Dalert(1))",
    '[x](https://example.com" onmouseover="alert(1))',
    "![x](javascript:alert(1))",
    "![x](data:image/svg+xml,<svg onload=alert(1)>)",
    '<https://example.com/"><script>alert(1)</script>>',
    "`<script>alert(1)</script>`",
    "```html\n<script>alert(1)</script>\n```",
    "| <script> | x |\n| --- | --- |\n| <img src=x onerror=alert(1)> | y |",
];

const texPayloads: readonly string[] = [
    "\\text{<script>alert(1)</script>}",
    "\\text{</mtext><img src=x onerror=alert(1)>}",
    "\\operatorname{<img src=x onerror=alert(1)>}",
    '\\left( \\text{"><script>alert(1)</script>} \\right)',
    '\\unknown{" onmouseover="alert(1)}',
    "\\begin{pmatrix} <script>alert(1)</script> & x \\\\ y & z \\end{pmatrix}",
    "\\href{javascript:alert(1)}{x}",
    "\\text{\u0000<script>alert(1)</script>}",
];

const fileNode: (name: string, content: string) => FileNode = (
    name: string,
    content: string,
): FileNode => ({
    id: name,
    name,
    path: name,
    kind: "file",
    content,
});

const filePayloads: readonly string[] = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    '<a href="javascript:alert(1)">x</a>',
    '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    '<a href="vbscript:msgbox(1)">x</a>',
    '<svg><a href="javascript:alert(1)">x</a></svg>',
    "<svg><img src=x onerror=alert(1)></svg>",
    '<marquee><a href="javascript:alert(1)">x</a></marquee>',
    "<details><img src=x onerror=alert(1)></details>",
    '<math><mtext><a href="javascript:alert(1)">x</a></mtext></math>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<svg><animate attributeName="href" values="javascript:alert(1)"/></svg>',
    '<math><annotation-xml encoding="text/html"><script>alert(1)</script></annotation-xml></math>',
    '<base href="javascript:alert(1)//">',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
    '<form action="javascript:alert(1)"><button>x</button></form>',
    '<div style="background:url(javascript:alert(1))">x</div>',
    '<a href="&#106;avascript:alert(1)">x</a>',
    '<a href="jav&#x09;ascript:alert(1)">x</a>',
    "<noscript><img src=x onerror=alert(1)></noscript>",
    "<template><script>alert(1)</script></template>",
    '<img src="x" title=\'a" onmouseover="alert(1)\'>',
    '<img src="/x" alt=\'a" onerror="alert(1)\'>',
];

describe("Markdown XSS review", (): void => {
    it("keeps every hostile payload inert", (): void => {
        for (const payload of markdownPayloads) {
            auditHtml(renderMarkdown(payload));
        }
    });

    it("keeps the rendered component free of executable markup", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Markdown source={markdownPayloads.join("\n\n")} data-testid="markdown" />,
        );

        for (const tag of forbiddenTags) {
            expect(container.querySelector(tag)).toBeNull();
        }

        for (const element of Array.from(container.querySelectorAll("*"))) {
            expect(
                unsafeAttributes(element),
                `${element.tagName} carried an unsafe attribute`,
            ).toEqual([]);
        }
    });

    it("still renders safe links and images", (): void => {
        const parsed: Document = new DOMParser().parseFromString(
            renderMarkdown("[docs](https://example.com) ![logo](/logo.png)"),
            "text/html",
        );

        expect(parsed.querySelector("a")?.getAttribute("href")).toBe("https://example.com");
        expect(parsed.querySelector("img")?.getAttribute("src")).toBe("/logo.png");
    });
});

describe("TeX XSS review", (): void => {
    it("keeps every hostile payload inert", (): void => {
        for (const payload of texPayloads) {
            auditHtml(renderTex(payload));
        }
    });

    it("keeps the rendered component free of executable markup", (): void => {
        const { container }: { container: HTMLElement } = render(
            <Tex source={texPayloads.join(" \\quad ")} />,
        );

        for (const tag of forbiddenTags) {
            expect(container.querySelector(tag)).toBeNull();
        }

        for (const element of Array.from(container.querySelectorAll("*"))) {
            expect(
                unsafeAttributes(element),
                `${element.tagName} carried an unsafe attribute`,
            ).toEqual([]);
        }

        expect(container.querySelector("math")).not.toBeNull();
    });
});

describe("file preview XSS review", (): void => {
    it("sanitises hostile HTML files", (): void => {
        for (const payload of filePayloads) {
            auditHtml(renderFile(fileNode("hostile.html", payload)).html);
        }
    });

    it("sanitises hostile HTML nested in containers", (): void => {
        const bypasses: readonly string[] = [
            '<svg><a href="javascript:alert(1)">x</a></svg>',
            "<svg><img src=x onerror=alert(1)></svg>",
            '<svg><foreignObject><a href="javascript:alert(1)">x</a></foreignObject></svg>',
            '<svg><a href="https://example.com"><animate attributeName="href" values="javascript:alert(1)"/></a></svg>',
            '<marquee><a href="javascript:alert(1)">x</a></marquee>',
            "<details><img src=x onerror=alert(1)></details>",
            '<math><mtext><a href="javascript:alert(1)">x</a></mtext></math>',
            "<math><mtext><img src=x onerror=alert(1)></mtext></math>",
            '<noscript><a href="javascript:alert(1)">x</a></noscript>',
            "<template><img src=x onerror=alert(1)></template>",
            "<textarea><img src=x onerror=alert(1)></textarea>",
            "<title><img src=x onerror=alert(1)></title>",
            "<xmp><img src=x onerror=alert(1)></xmp>",
            '<svg><a href="data:text/html,<script>alert(1)</script>">x</a></svg>',
            '<svg><a xlink:href="javascript:alert(1)">x</a></svg>',
            '<a href="&#14;javascript:alert(1)">x</a>',
            '<a href="jav&#x0A;ascript:alert(1)">x</a>',
            '<a href="jav&#x0D;ascript:alert(1)">x</a>',
            '<svg></p><style><a id="</style><img src=1 onerror=alert(1)>">',
            '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=1 onerror=alert(1)>">',
            '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
            "<svg><p><style><img src=x onerror=alert(1)></style></p></svg>",
            '<math><annotation-xml encoding="text/html"><svg><a href="javascript:alert(1)">x</a></svg></annotation-xml></math>',
            "<svg><foreignObject><style><img src=x onerror=alert(1)></style></foreignObject></svg>",
        ];

        for (const payload of bypasses) {
            const html: string = renderFile(fileNode("hostile.html", payload)).html;

            auditHtml(html);
        }
    });

    it("keeps Markdown and plain-text previews inert", (): void => {
        for (const payload of markdownPayloads) {
            auditHtml(renderFile(fileNode("hostile.md", payload)).html);
            auditHtml(renderFile(fileNode("hostile.txt", payload)).html);
        }
    });

    it("still renders safe HTML attributes", (): void => {
        const html: string = renderFile(
            fileNode(
                "safe.html",
                '<a href="https://example.com">docs</a><img src="/logo.png" alt="logo"><table><tr><td colspan="2">x</td></tr></table>',
            ),
        ).html;
        const parsed: Document = new DOMParser().parseFromString(html, "text/html");

        expect(parsed.querySelector("a")?.getAttribute("href")).toBe("https://example.com");
        expect(parsed.querySelector("img")?.getAttribute("src")).toBe("/logo.png");
        expect(parsed.querySelector("td")?.getAttribute("colspan")).toBe("2");
    });
});

const latexPayloads: readonly string[] = [
    String.raw`\documentclass{article}
\begin{document}
\section{<script>alert(1)</script>}
\href{javascript:alert(1)}{click}
\url{javascript:alert(1)}
\includegraphics{javascript:alert(1)}
\begin{verbatim}<img src=x onerror=alert(1)></verbatim>
\end{document}`,
    String.raw`\documentclass{article}
\newcommand{\evil}{<script>alert(1)</script>}
\begin{document}
\evil
\end{document}`,
    String.raw`\documentclass{article}
\begin{document}
\begin{tabular}{l}
<script>alert(1)</script> \\
\end{tabular}
\end{document}`,
    String.raw`\documentclass{article}
\begin{document}
\begin{figure}
\caption{<img src=x onerror=alert(1)>}
\label{"><script>alert(1)</script>}
\end{figure}
\end{document}`,
    String.raw`\documentclass{article}
\begin{document}
\textcolor{red}{\href{data:text/html,<script>alert(1)</script>}{x}}
\end{document}`,
];

describe("LaTeX document XSS review", (): void => {
    it("keeps complete documents inert", (): void => {
        for (const payload of latexPayloads) {
            auditHtml(renderLatexDocument(payload));
        }
    });

    it("keeps the rendered document free of executable markup", (): void => {
        const { container }: { container: HTMLElement } = render(<Tex source={latexPayloads[0]} />);

        for (const tag of forbiddenTags) {
            expect(container.querySelector(tag)).toBeNull();
        }

        for (const element of Array.from(container.querySelectorAll("*"))) {
            expect(
                unsafeAttributes(element),
                `${element.tagName} carried an unsafe attribute`,
            ).toEqual([]);
        }

        expect(container.textContent).toContain("click");
        expect(container.querySelector("article.latex")).not.toBeNull();
    });
});

