/**
 * Markdown-to-HTML renderer for the read-only Markdown preview.
 *
 * The renderer deliberately never passes raw source HTML through: every text
 * run is escaped and only the elements generated here reach the DOM. Links and
 * images are limited to safe URL schemes, so a document cannot inject scripts,
 * event handlers, or `javascript:` URLs into the host page.
 *
 * Supported blocks: ATX and setext headings, paragraphs, fenced code, block
 * quotes, ordered and unordered lists (with nesting), GFM tables, horizontal
 * rules, and task-list items. Supported inline spans: code, emphasis, strong,
 * strikethrough, links, images, autolinks, escapes, and hard line breaks.
 *
 * Type: module.
 * Fields: MarkdownOptions, renderMarkdown.
 * @example
 * const html: string = renderMarkdown("# Title\n\nSome **bold** text.");
 */

/**
 * Options that change how a document is rendered.
 * Type: interface.
 * Fields: breaks.
 * @example
 * const options: MarkdownOptions = { breaks: true };
 */
export interface MarkdownOptions {
    /** Render single newlines inside a paragraph as `<br />` elements. */
    breaks?: boolean;
}

const escapeHtml: (value: string) => string = (value: string): string =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

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
        trimmed.startsWith("mailto:") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("./") ||
        trimmed.startsWith("../") ||
        trimmed.startsWith("#")
    );
};

const hardBreakMarker: string = "\uE000";

const isBlank: (line: string) => boolean = (line: string): boolean => line.trim().length === 0;

const fencePattern: RegExp = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/;
const atxPattern: RegExp = /^ {0,3}(#{1,6})(?:\s+(.*?))?\s*#*\s*$/;
const setextPattern: RegExp = /^ {0,3}(=+|-+)\s*$/;
const rulePattern: RegExp = /^ {0,3}((?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/;
const quotePattern: RegExp = /^ {0,3}>\s?/;
const itemPattern: RegExp = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const tableDelimiterPattern: RegExp =
    /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const taskPattern: RegExp = /^\[([ xX])\]\s+/;

/**
 * Renders a line of Markdown as inline HTML.
 * @param source - Inline Markdown source.
 * @param options - Break handling options.
 * @example
 * const html: string = renderInline("**ready**", {});
 * @returns The escaped inline HTML.
 */
const renderInline: (source: string, options: MarkdownOptions) => string = (
    source: string,
    options: MarkdownOptions,
): string => {
    const output: string[] = [];
    let index: number = 0;

    while (index < source.length) {
        const rest: string = source.slice(index);

        if (rest.startsWith(hardBreakMarker)) {
            output.push("<br />");
            index += rest.startsWith(`${hardBreakMarker}\n`) ? 2 : 1;
            continue;
        }

        if (rest.startsWith("\n")) {
            output.push(options.breaks === true ? "<br />" : " ");
            index += 1;
            continue;
        }

        const escaped: RegExpExecArray | null = /^\\([\\`*_{}[\]()#+\-.!>~|])/.exec(rest);

        if (escaped !== null) {
            output.push(escapeHtml(escaped[1]));
            index += escaped[0].length;
            continue;
        }

        const code: RegExpExecArray | null = /^(`+)([\s\S]*?)\1/.exec(rest);

        if (code !== null) {
            const value: string = code[2].replace(/\n/g, " ").trim();
            output.push(`<code>${escapeHtml(value)}</code>`);
            index += code[0].length;
            continue;
        }

        const image: RegExpExecArray | null =
            /^!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)/.exec(rest);

        if (image !== null) {
            const url: string = image[2];

            if (safeUrl(url)) {
                const title: string =
                    image[3] === (void 0) ? "" : ` title="${escapeHtml(image[3])}"`;
                output.push(
                    `<img src="${escapeHtml(url.trim())}" alt="${escapeHtml(image[1])}"${title} loading="lazy" />`,
                );
            } else {
                output.push(renderInline(image[1], options));
            }

            index += image[0].length;
            continue;
        }

        const link: RegExpExecArray | null =
            /^\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)/.exec(rest);

        if (link !== null) {
            const url: string = link[2];

            if (safeUrl(url)) {
                const title: string =
                    link[3] === (void 0) ? "" : ` title="${escapeHtml(link[3])}"`;
                output.push(
                    `<a href="${escapeHtml(url.trim())}"${title}>${renderInline(link[1], options)}</a>`,
                );
            } else {
                output.push(renderInline(link[1], options));
            }

            index += link[0].length;
            continue;
        }

        const autolink: RegExpExecArray | null =
            /^<((?:https?:\/\/|mailto:)[^>\s]+)>/.exec(rest);

        if (autolink !== null) {
            output.push(
                `<a href="${escapeHtml(autolink[1])}">${escapeHtml(autolink[1])}</a>`,
            );
            index += autolink[0].length;
            continue;
        }

        const strongEm: RegExpExecArray | null = /^\*\*\*([\s\S]+?)\*\*\*/.exec(rest);

        if (strongEm !== null) {
            output.push(`<strong><em>${renderInline(strongEm[1], options)}</em></strong>`);
            index += strongEm[0].length;
            continue;
        }

        const strong: RegExpExecArray | null = /^\*\*([\s\S]+?)\*\*/.exec(rest);

        if (strong !== null) {
            output.push(`<strong>${renderInline(strong[1], options)}</strong>`);
            index += strong[0].length;
            continue;
        }

        const emphasis: RegExpExecArray | null = /^\*([^*\n]+?)\*/.exec(rest);

        if (emphasis !== null) {
            output.push(`<em>${renderInline(emphasis[1], options)}</em>`);
            index += emphasis[0].length;
            continue;
        }

        if (rest.startsWith("_") && index > 0 && /[A-Za-z0-9]/.test(source.charAt(index - 1))) {
            output.push("_");
            index += 1;
            continue;
        }

        const strongUnder: RegExpExecArray | null = /^__([\s\S]+?)__/.exec(rest);

        if (strongUnder !== null) {
            output.push(`<strong>${renderInline(strongUnder[1], options)}</strong>`);
            index += strongUnder[0].length;
            continue;
        }

        const emphasisUnder: RegExpExecArray | null = /^_([^_\n]+?)_/.exec(rest);

        if (emphasisUnder !== null) {
            output.push(`<em>${renderInline(emphasisUnder[1], options)}</em>`);
            index += emphasisUnder[0].length;
            continue;
        }

        const strike: RegExpExecArray | null = /^~~([\s\S]+?)~~/.exec(rest);

        if (strike !== null) {
            output.push(`<del>${renderInline(strike[1], options)}</del>`);
            index += strike[0].length;
            continue;
        }

        const special: RegExp = /[\\`![<*_~\n\uE000]/g;
        special.lastIndex = 0;
        const next: RegExpExecArray | null = special.exec(rest);
        const end: number = next === null ? rest.length : next.index;

        if (end === 0) {
            output.push(escapeHtml(rest.charAt(0)));
            index += 1;
            continue;
        }

        output.push(escapeHtml(rest.slice(0, end)));
        index += end;
    }

    return output.join("");
};

/**
 * Renders paragraph lines, preserving hard breaks and optional soft breaks.
 * @param lines - Paragraph source lines.
 * @param options - Break handling options.
 * @example
 * const html: string = renderParagraph(["one", "two"], {});
 * @returns The paragraph contents as inline HTML.
 */
const renderParagraph: (lines: string[], options: MarkdownOptions) => string = (
    lines: string[],
    options: MarkdownOptions,
): string => {
    const parts: string[] = lines.map((line: string): string => {
        const hard: boolean = /( {2,}|\\)$/.test(line);
        const text: string = hard ? line.replace(/( {2,}|\\)$/, "") : line;

        return hard ? `${text}${hardBreakMarker}` : text;
    });

    return renderInline(parts.join("\n"), options);
};

/**
 * Splits a table row into trimmed cells, respecting escaped pipes.
 * @param line - Raw table row.
 * @example
 * const cells: string[] = splitTableRow("| a | b |");
 * @returns The cell values.
 */
const splitTableRow: (line: string) => string[] = (line: string): string[] => {
    let value: string = line.trim().replace(/\\\|/g, "\uE001");

    if (value.startsWith("|")) {
        value = value.slice(1);
    }

    if (value.endsWith("|")) {
        value = value.slice(0, -1);
    }

    return value
        .split("|")
        .map((cell: string): string => cell.replace(/\uE001/g, "|").trim());
};

/**
 * Resolves the column alignments declared by a GFM table delimiter row.
 * @param line - Delimiter row source.
 * @example
 * const alignments: string[] = tableAlignments("| :--- | ---: |");
 * @returns One alignment keyword per column.
 */
const tableAlignments: (line: string) => string[] = (line: string): string[] =>
    splitTableRow(line).map((cell: string): string => {
        const left: boolean = cell.startsWith(":");
        const right: boolean = cell.endsWith(":");

        if (left && right) {
            return "center";
        }

        if (right) {
            return "right";
        }

        return "left";
    });

/**
 * Renders a GFM table starting at the supplied line.
 * @param lines - Document lines.
 * @param start - Index of the header row.
 * @param options - Inline rendering options.
 * @example
 * const table = renderTable(lines, 4, {});
 * @returns The table HTML and the next index, or null when no table starts here.
 */
const renderTable: (
    lines: string[],
    start: number,
    options: MarkdownOptions,
) => { html: string; next: number } | null = (
    lines: string[],
    start: number,
    options: MarkdownOptions,
): { html: string; next: number } | null => {
    const header: string = lines[start] ?? "";
    const delimiter: string = lines[start + 1] ?? "";

    if (start + 1 >= lines.length || !header.includes("|") || !tableDelimiterPattern.test(delimiter)) {
        return null;
    }

    const alignments: string[] = tableAlignments(delimiter);
    const heads: string[] = splitTableRow(header);
    let index: number = start + 2;
    const rows: string[] = [];
    const cell: (tag: string, value: string, column: number) => string = (
        tag: string,
        value: string,
        column: number,
    ): string => {
        const alignment: string = alignments[column] ?? "left";

        return `<${tag} class="markdown__cell markdown__cell--${alignment}">${renderInline(value, options)}</${tag}>`;
    };

    while (index < lines.length && !isBlank(lines[index]) && lines[index].includes("|")) {
        const cells: string[] = splitTableRow(lines[index]);
        const rendered: string[] = [];
        for (let column: number = 0; column < heads.length; column += 1) {
            rendered.push(cell("td", cells[column] ?? "", column));
        }

        rows.push(`<tr>${rendered.join("")}</tr>`);
        index += 1;
    }

    const headRow: string = heads
        .map((value: string, column: number): string => cell("th", value, column))
        .join("");

    return {
        html: `<div class="markdown__table-wrap"><table class="markdown__table"><thead><tr>${headRow}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`,
        next: index,
    };
};

interface ListLine {
    indent: number;
    ordered: boolean;
    text: string;
}

interface ListItemNode {
    ordered: boolean;
    text: string;
    children: ListItemNode[];
}

const renderTask: (checked: boolean, text: string, options: MarkdownOptions) => string = (
    checked: boolean,
    text: string,
    options: MarkdownOptions,
): string =>
    `<span class="markdown__task${checked ? " markdown__task--done" : ""}" aria-hidden="true"></span>${renderInline(text, options)}`;

const renderListNodes: (nodes: ListItemNode[], options: MarkdownOptions) => string = (
    nodes: ListItemNode[],
    options: MarkdownOptions,
): string => {
    if (nodes.length === 0) {
        return "";
    }

    const ordered: boolean = nodes[0].ordered;
    const tag: string = ordered ? "ol" : "ul";
    const items: string[] = nodes.map((node: ListItemNode): string => {
        const task: RegExpExecArray | null = taskPattern.exec(node.text);
        const body: string =
            task === null
                ? renderInline(node.text, options)
                : renderTask(task[1].toLowerCase() === "x", node.text.slice(task[0].length), options);

        return `<li>${body}${renderListNodes(node.children, options)}</li>`;
    });

    return `<${tag} class="markdown__list">${items.join("")}</${tag}>`;
};

const renderList: (
    lines: string[],
    start: number,
    options: MarkdownOptions,
) => { html: string; next: number } = (
    lines: string[],
    start: number,
    options: MarkdownOptions,
): { html: string; next: number } => {
    const entries: ListLine[] = [];
    const stack: { indent: number; node: ListItemNode }[] = [];
    const roots: ListItemNode[] = [];
    let index: number = start;

    while (index < lines.length) {
        const line: string = lines[index];

        if (isBlank(line)) {
            let peek: number = index + 1;

            while (peek < lines.length && isBlank(lines[peek])) {
                peek += 1;
            }

            const following: RegExpExecArray | null =
                peek < lines.length ? itemPattern.exec(lines[peek]) : null;

            if (following === null) {
                break;
            }

            index = peek;
            continue;
        }

        const item: RegExpExecArray | null = itemPattern.exec(line);

        if (item !== null) {
            const node: ListItemNode = {
                ordered: /\d/.test(item[2]),
                text: item[3],
                children: [],
            };

            while (stack.length > 0 && stack[stack.length - 1].indent >= item[1].length) {
                stack.pop();
            }

            if (stack.length === 0) {
                roots.push(node);
            } else {
                stack[stack.length - 1].node.children.push(node);
            }

            stack.push({ indent: item[1].length, node });
            entries.push({ indent: item[1].length, ordered: node.ordered, text: node.text });
            index += 1;
            continue;
        }

        const continuation: boolean = /^\s{2,}\S/.test(line) && entries.length > 0;

        if (continuation) {
            const target: ListItemNode =
                stack.length > 0 ? stack[stack.length - 1].node : roots[roots.length - 1];
            target.text = `${target.text}\n${line.trim()}`;
            index += 1;
            continue;
        }

        break;
    }

    return { html: renderListNodes(roots, options), next: index };
};

/**
 * Reports whether a line starts a block that can interrupt a paragraph.
 * @param line - Document line.
 * @param next - The following line, used to detect GFM table headers.
 * @example
 * const interrupt: boolean = isBlockStart("## Next", "");
 * @returns True for headings, fences, rules, quotes, lists, and tables.
 */
const isBlockStart: (line: string, next: string) => boolean = (
    line: string,
    next: string,
): boolean =>
    fencePattern.test(line) ||
    atxPattern.test(line) ||
    rulePattern.test(line) ||
    quotePattern.test(line) ||
    itemPattern.test(line) ||
    (line.includes("|") && tableDelimiterPattern.test(next));

/**
 * Renders a block of Markdown lines to HTML.
 * @param lines - Document lines.
 * @param options - Render options.
 * @example
 * const html: string = renderBlocks(["# Title"], {});
 * @returns The block HTML.
 */
const renderBlocks: (lines: string[], options: MarkdownOptions) => string = (
    lines: string[],
    options: MarkdownOptions,
): string => {
    const output: string[] = [];
    let index: number = 0;

    while (index < lines.length) {
        const line: string = lines[index];

        if (isBlank(line)) {
            index += 1;
            continue;
        }

        const fence: RegExpExecArray | null = fencePattern.exec(line);

        if (fence !== null) {
            const marker: string = fence[1];
            const language: string = fence[2];
            const content: string[] = [];
            let closed: boolean = false;

            index += 1;

            while (index < lines.length) {
                const candidate: string = lines[index];

                if (candidate.trim().startsWith(marker.charAt(0).repeat(marker.length))) {
                    closed = true;
                    index += 1;
                    break;
                }

                content.push(candidate);
                index += 1;
            }

            if (!closed) {
                index = Math.min(index, lines.length);
            }

            const codeClass: string =
                language.length > 0 ? ` class="language-${escapeHtml(language)}"` : "";

            output.push(
                `<pre class="markdown__code"><code${codeClass}>${escapeHtml(content.join("\n"))}</code></pre>`,
            );
            continue;
        }

        const heading: RegExpExecArray | null = atxPattern.exec(line);

        if (heading !== null) {
            const level: number = heading[1].length;
            const text: string = heading[2] ?? "";

            output.push(`<h${level}>${renderInline(text, options)}</h${level}>`);
            index += 1;
            continue;
        }

        const nextLine: string = lines[index + 1] ?? "";
        const setext: RegExpExecArray | null = setextPattern.exec(nextLine);

        if (setext !== null && !rulePattern.test(line) && !itemPattern.test(line)) {
            const level: number = setext[1].startsWith("=") ? 1 : 2;

            output.push(`<h${level}>${renderInline(line.trim(), options)}</h${level}>`);
            index += 2;
            continue;
        }

        if (rulePattern.test(line)) {
            output.push('<hr class="markdown__rule" />');
            index += 1;
            continue;
        }

        if (quotePattern.test(line)) {
            const quoted: string[] = [];

            while (index < lines.length && quotePattern.test(lines[index])) {
                quoted.push(lines[index].replace(quotePattern, ""));
                index += 1;
            }

            output.push(
                `<blockquote class="markdown__quote">${renderBlocks(quoted, options)}</blockquote>`,
            );
            continue;
        }

        const table: { html: string; next: number } | null = renderTable(lines, index, options);

        if (table !== null) {
            output.push(table.html);
            index = table.next;
            continue;
        }

        if (itemPattern.test(line)) {
            const list: { html: string; next: number } = renderList(lines, index, options);

            output.push(list.html);
            index = list.next;
            continue;
        }

        const paragraph: string[] = [];

        while (index < lines.length) {
            const candidate: string = lines[index];

            if (isBlank(candidate)) {
                break;
            }

            if (paragraph.length > 0 && isBlockStart(candidate, lines[index + 1] ?? "")) {
                break;
            }

            paragraph.push(candidate);
            index += 1;
        }

        output.push(`<p>${renderParagraph(paragraph, options)}</p>`);
    }

    return output.join("\n");
};

/**
 * Renders Markdown source to sanitised HTML.
 * @param source - Markdown document source.
 * @param options - Render options such as soft line breaks.
 * @example
 * const html: string = renderMarkdown("# Title\n\nHello **world**.");
 * @returns HTML that is safe to insert into the document.
 */
export const renderMarkdown: (source: string, options?: MarkdownOptions) => string = (
    source: string,
    options: MarkdownOptions = {},
): string => {
    const lines: string[] = source.replace(/\r\n?/g, "\n").split("\n");

    return renderBlocks(lines, options);
};
