import { OrderedMap, Queue, Stack } from "../../structure";
import type { Extension } from "./extension";
import { extensionOf } from "./extension";
import type { FileNode } from "./project";

/**
 * Rendering mode chosen for a file.
 * Type: type alias.
 * Fields: none.
 * @example
 * const mode: RenderMode = "document";
 */
export type RenderMode = "document" | "markup" | "code";

/**
 * Result of rendering a project file.
 * Type: interface.
 * Fields: html, mode, language.
 * @example
 * const rendered: RenderedFile = renderFile(file);
 */
export interface RenderedFile {
    html: string;
    mode: RenderMode;
    language: string;
}

const escapeHtml: (value: string) => string = (value: string): string =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const inline: (value: string) => string = (value: string): string => {
    const escaped: string = escapeHtml(value);

    return escaped
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
};

const renderMarkdown: (content: string) => string = (
    content: string,
): string => {
    const lines: Queue<string> = new Queue<string>();
    const listStack: Stack<"ul" | "ol"> = new Stack<"ul" | "ol">();
    const output: string[] = [];
    let paragraph: string[] = [];
    let code: string[] = [];
    let inCode: boolean = false;

    for (const line of content.split("\n")) {
        lines.enqueue(line);
    }

    const flushParagraph: () => void = (): void => {
        if (paragraph.length > 0) {
            output.push(`<p>${inline(paragraph.join(" "))}</p>`);
            paragraph = [];
        }
    };

    const closeLists: () => void = (): void => {
        while (!listStack.isEmpty()) {
            output.push(`</${listStack.pop()}>`);
        }
    };

    while (!lines.isEmpty()) {
        const line: string = lines.dequeue();

        if (line.trim().startsWith("```")) {
            flushParagraph();
            closeLists();

            if (inCode) {
                output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
                code = [];
                inCode = false;
            } else {
                inCode = true;
            }

            continue;
        }

        if (inCode) {
            code.push(line);
            continue;
        }

        if (line.trim().length === 0) {
            flushParagraph();
            closeLists();
            continue;
        }

        const heading: RegExpMatchArray | null = line.match(/^(#{1,6})\s+(.+)$/);

        if (heading !== null) {
            flushParagraph();
            closeLists();
            const level: number = Math.min(6, heading[1].length);
            output.push(`<h${level}>${inline(heading[2])}</h${level}>`);
            continue;
        }

        const unordered: RegExpMatchArray | null = line.match(/^\s*[-*+]\s+(.+)$/);

        if (unordered !== null) {
            flushParagraph();

            if (listStack.isEmpty() || listStack.peek() !== "ul") {
                closeLists();
                listStack.push("ul");
                output.push("<ul>");
            }

            output.push(`<li>${inline(unordered[1])}</li>`);
            continue;
        }

        const ordered: RegExpMatchArray | null = line.match(/^\s*\d+[.)]\s+(.+)$/);

        if (ordered !== null) {
            flushParagraph();

            if (listStack.isEmpty() || listStack.peek() !== "ol") {
                closeLists();
                listStack.push("ol");
                output.push("<ol>");
            }

            output.push(`<li>${inline(ordered[1])}</li>`);
            continue;
        }

        if (line.startsWith(">")) {
            flushParagraph();
            closeLists();
            output.push(`<blockquote>${inline(line.replace(/^>\s?/, ""))}</blockquote>`);
            continue;
        }

        paragraph.push(line.trim());
    }

    flushParagraph();
    closeLists();

    if (inCode) {
        output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    }

    return output.join("\n");
};

const renderArticle: (content: string) => string = (content: string): string => {
    const paragraphs: string[] = content.split(/\n\s*\n/);
    const rendered: string[] = paragraphs
        .map((paragraph: string): string => paragraph.trim())
        .filter((paragraph: string): boolean => paragraph.length > 0)
        .map((paragraph: string): string => {
            const lines: string[] = paragraph.split("\n");
            const first: string = lines[0] ?? "";
            const heading: RegExpMatchArray | null = first.match(/^(#{1,6})\s+(.+)$/);

            if (heading !== null && lines.length === 1) {
                return `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
            }

            return `<p>${lines.map((line: string): string => inline(line)).join("<br />")}</p>`;
        });

    return rendered.join("\n");
};

const tokenPattern: RegExp =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:as|async|await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|false|finally|for|from|function|if|implements|import|in|interface|let|new|null|package|private|protected|public|readonly|return|static|super|switch|this|throw|true|try|type|typeof|var|void|while|with|yield)\b)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\s*\()/g;

const tokenClasses: OrderedMap<string, string> = new OrderedMap<string, string>();
tokenClasses.set("comment", "token-comment");
tokenClasses.set("string", "token-string");
tokenClasses.set("keyword", "token-keyword");
tokenClasses.set("number", "token-number");
tokenClasses.set("function", "token-function");

const highlightCode: (source: string) => string = (source: string): string => {
    const output: string[] = [];
    let cursor: number = 0;
    let match: RegExpExecArray | null;

    tokenPattern.lastIndex = 0;

    while ((match = tokenPattern.exec(source)) !== null) {
        output.push(escapeHtml(source.slice(cursor, match.index)));

        const group: number = match.findIndex(
            (value: string | undefined, index: number): boolean =>
                index > 0 && value !== (void 0),
        );
        const kind: string =
            group === 1 ? "comment" : group === 2 ? "string" : group === 3 ? "keyword" : group === 4 ? "number" : "function";
        const className: string | void = tokenClasses.get(kind);

        output.push(
            `<span class="${className ?? "token"}">${escapeHtml(match[0])}</span>`,
        );
        cursor = match.index + match[0].length;
    }

    output.push(escapeHtml(source.slice(cursor)));

    return output.join("");
};

const allowedTags: ReadonlySet<string> = new Set<string>([
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "section",
    "small",
    "span",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
]);

const allowedAttributes: ReadonlySet<string> = new Set<string>([
    "alt",
    "colspan",
    "href",
    "rowspan",
    "src",
    "title",
]);

const hasControlCharacter: (value: string) => boolean = (value: string): boolean =>
    Array.from(value).some((char: string): boolean => {
        const code: number = char.charCodeAt(0);

        return code < 0x20 || code === 0x7f;
    });

const safeUrl: (value: string) => boolean = (value: string): boolean => {
    const trimmed: string = value.trim().toLowerCase();

    if (hasControlCharacter(trimmed)) {
        return false;
    }

    return (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("./") ||
        trimmed.startsWith("../") ||
        trimmed.startsWith("#")
    );
};

const sanitizeHtml: (source: string) => string = (source: string): string => {
    if (typeof DOMParser === "undefined") {
        return `<pre>${escapeHtml(source)}</pre>`;
    }

    const document: Document = new DOMParser().parseFromString(source, "text/html");

    for (const element of document.body.querySelectorAll("script, style, iframe, object, embed, form")) {
        element.remove();
    }

    const walk: (node: Element) => void = (node: Element): void => {
        for (const child of Array.from(node.children)) {
            const tag: string = child.tagName.toLowerCase();

            if (!allowedTags.has(tag)) {
                // Clean the subtree before unwrapping it, otherwise allowed
                // descendants move into the body without an attribute pass.
                walk(child);
                child.replaceWith(...Array.from(child.childNodes));
                continue;
            }

            for (const attribute of Array.from(child.attributes)) {
                const name: string = attribute.name.toLowerCase();
                const unsafe: boolean =
                    !allowedAttributes.has(name) ||
                    ((name === "href" || name === "src") && !safeUrl(attribute.value));

                if (unsafe) {
                    child.removeAttribute(attribute.name);
                }
            }

            walk(child);
        }
    };

    walk(document.body);

    return document.body.innerHTML;
};

const extensionOfFile: (file: FileNode) => Extension = (file: FileNode): Extension =>
    file.extension ?? extensionOf(file.name);

/**
 * Renders a file according to its extension. HTML is sanitised into safe markup,
 * Markdown and text become structured articles, and source files become
 * highlighted code.
 * @param file - File node with optional content.
 * @example
 * const rendered = renderFile(file);
 * @returns HTML, mode, and language metadata.
 */
export const renderFile: (file: FileNode) => RenderedFile = (
    file: FileNode,
): RenderedFile => {
    const content: string = file.content ?? "";
    const extension: Extension = extensionOfFile(file);

    if (extension === "html" || extension === "htm") {
        return {
            html: sanitizeHtml(content),
            mode: "markup",
            language: "HTML",
        };
    }

    if (extension === "md") {
        return {
            html: renderMarkdown(content),
            mode: "document",
            language: "Markdown",
        };
    }

    if (extension === "txt") {
        return {
            html: renderArticle(content),
            mode: "document",
            language: "Plain text",
        };
    }

    if (extension === "json") {
        try {
            return {
                html: highlightCode(JSON.stringify(JSON.parse(content), null, 2)),
                mode: "code",
                language: "JSON",
            };
        } catch {
            return {
                html: highlightCode(content),
                mode: "code",
                language: "JSON",
            };
        }
    }

    if (extension === "tex" || extension === "bib") {
        return {
            html: highlightCode(content),
            mode: "code",
            language: extension === "bib" ? "BibTeX" : "TeX",
        };
    }

    if (extension === "css") {
        return {
            html: highlightCode(content),
            mode: "code",
            language: "CSS",
        };
    }

    if (
        [
            "js",
            "mjs",
            "jsx",
            "ts",
            "mts",
            "tsx",
            "py",
            "rs",
            "c",
            "h",
            "cpp",
            "hpp",
            "java",
            "kt",
            "go",
            "cs",
            "php",
            "swift",
            "rb",
            "yaml",
            "toml",
        ].includes(extension)
    ) {
        return {
            html: highlightCode(content),
            mode: "code",
            language: file.language ?? "Source",
        };
    }

    return {
        html: renderArticle(content),
        mode: "document",
        language: file.language ?? "Document",
    };
};
