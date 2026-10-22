/**
 * LaTeX document renderer for the read-only TeX preview.
 *
 * A source that contains `\begin{document}` is treated as a complete document:
 * the preamble contributes the title, author, date, and local macro
 * definitions, while the body is rendered as an HTML article with sections,
 * lists, tables, figures, footnotes, citations, and embedded MathML formulas.
 * Sources without a document environment stay in maths mode and are handled by
 * `renderTex`.
 *
 * The renderer never emits raw source markup: text is escaped, URLs are limited
 * to safe schemes, and every generated attribute comes from an internal table.
 *
 * Type: module.
 * Fields: isLatexDocument, renderLatexDocument.
 * @example
 * const html: string = renderLatexDocument("\\begin{document}Hello\\end{document}");
 */

import { escapeHtml, renderTex } from "./render";

interface GroupResult {
    readonly value: string;
    readonly next: number;
}

interface CommandResult {
    readonly name: string;
    readonly next: number;
}

interface EnvironmentResult {
    readonly content: string;
    readonly next: number;
}

interface MacroDefinition {
    readonly args: number;
    readonly optional: string | null;
    readonly body: string;
}

interface LabelTarget {
    readonly kind: "section" | "figure" | "table" | "equation" | "theorem";
    readonly number: string;
    readonly id: string;
}

interface TocEntry {
    readonly level: number;
    readonly number: string;
    readonly title: string;
    readonly id: string;
}

interface LatexMeta {
    readonly title: string;
    readonly author: string;
    readonly date: string | null;
}

interface DocumentParts {
    readonly preamble: string;
    readonly body: string;
}

interface DefinitionResult {
    readonly macros: ReadonlyMap<string, MacroDefinition>;
    readonly source: string;
}

type CounterName =
    | "part"
    | "chapter"
    | "section"
    | "subsection"
    | "subsubsection"
    | "paragraph"
    | "subparagraph"
    | "figure"
    | "table"
    | "equation"
    | "theorem";

interface LatexState {
    readonly meta: LatexMeta;
    readonly bibNumbers: ReadonlyMap<string, number>;
    readonly knownLabels: ReadonlyMap<string, LabelTarget>;
    readonly knownHeadings: readonly TocEntry[];
    labels: Map<string, LabelTarget>;
    headings: TocEntry[];
    footnotes: string[];
    counters: Record<CounterName, number>;
    appendix: boolean;
    sectionTarget: LabelTarget | null;
    labelTarget: LabelTarget | null;
    headingCount: number;
    unnumberedCount: number;
}

interface InlineResult {
    readonly html: string;
    readonly next: number;
}

interface AccentMark {
    readonly mark: string;
    readonly literal: string;
}

const headingLevels: ReadonlyMap<string, number> = new Map<string, number>([
    ["part", 2],
    ["chapter", 2],
    ["section", 2],
    ["subsection", 3],
    ["subsubsection", 4],
    ["paragraph", 5],
    ["subparagraph", 6],
]);

const tocLevels: ReadonlyMap<string, number> = new Map<string, number>([
    ["part", 1],
    ["chapter", 1],
    ["section", 1],
    ["subsection", 2],
    ["subsubsection", 3],
    ["paragraph", 4],
    ["subparagraph", 4],
]);

const sectionCommands: readonly string[] = [
    "part",
    "chapter",
    "section",
    "subsection",
    "subsubsection",
    "paragraph",
    "subparagraph",
];

const sectionPattern: RegExp =
    /^\\(part|chapter|section|subsection|subsubsection|paragraph|subparagraph)\b/;

const stylePrefix: RegExp =
    /^\\(?:noindent|centering|raggedright|raggedleft|small|footnotesize|scriptsize|tiny|large|Large|LARGE|huge|Huge|normalsize|mdseries|upshape|rmfamily|sffamily|normalfont|selectfont)\b\s*/;

const ignoredBlockPattern: RegExp =
    /^\\(?:newpage|clearpage|pagebreak|linebreak|vspace|hspace|setlength|addtolength|setcounter|addtocounter|pagestyle|thispagestyle|pagenumbering|bibliographystyle|bibliography|printbibliography|graphicspath|hypersetup|captionsetup|sisetup|lstset|urlstyle|geometry|linespread|fontsize|selectfont|listoffigures|listoftables|printindex|markboth|markright|addcontentsline|addtocontents|setmainfont|setsansfont|setmonofont)\b/;

const declarationFormats: ReadonlyMap<string, readonly [string, string]> = new Map<
    string,
    readonly [string, string]
>([
    ["bf", ["<strong>", "</strong>"]],
    ["bfseries", ["<strong>", "</strong>"]],
    ["it", ["<em>", "</em>"]],
    ["itshape", ["<em>", "</em>"]],
    ["em", ["<em>", "</em>"]],
    ["sl", ["<em>", "</em>"]],
    ["slshape", ["<em>", "</em>"]],
    ["tt", ["<code>", "</code>"]],
    ["ttfamily", ["<code>", "</code>"]],
    ["sc", ['<span class="latex__smallcaps">', "</span>"]],
    ["scshape", ['<span class="latex__smallcaps">', "</span>"]],
]);

const theoremNames: ReadonlyMap<string, string> = new Map<string, string>([
    ["theorem", "Theorem"],
    ["lemma", "Lemma"],
    ["corollary", "Corollary"],
    ["proposition", "Proposition"],
    ["definition", "Definition"],
    ["example", "Example"],
    ["remark", "Remark"],
    ["claim", "Claim"],
    ["assumption", "Assumption"],
    ["conjecture", "Conjecture"],
    ["exercise", "Exercise"],
]);

const theoremEnvironments: ReadonlySet<string> = new Set<string>([
    ...theoremNames.keys(),
    "proof",
]);

const mathEnvironments: ReadonlySet<string> = new Set<string>([
    "equation",
    "align",
    "alignat",
    "gather",
    "multline",
    "eqnarray",
    "displaymath",
    "math",
]);

const inlineFormats: ReadonlyMap<string, readonly [string, string]> = new Map<
    string,
    readonly [string, string]
>([
    ["textbf", ["<strong>", "</strong>"]],
    ["textit", ["<em>", "</em>"]],
    ["emph", ["<em>", "</em>"]],
    ["textsl", ["<em>", "</em>"]],
    ["underline", ["<u>", "</u>"]],
    ["uline", ["<u>", "</u>"]],
    ["sout", ["<del>", "</del>"]],
    ["xout", ["<del>", "</del>"]],
    ["texttt", ["<code>", "</code>"]],
    ["textsc", ['<span class="latex__smallcaps">', "</span>"]],
    ["textsuperscript", ["<sup>", "</sup>"]],
    ["textsubscript", ["<sub>", "</sub>"]],
]);

const plainFormatCommands: ReadonlySet<string> = new Set<string>([
    "text",
    "textrm",
    "textsf",
    "textnormal",
    "textup",
    "textmd",
    "mbox",
    "hbox",
    "operatorname",
    "texorpdfstring",
]);

const ignoredArgCommands: ReadonlyMap<string, number> = new Map<string, number>([
    ["vspace", 1],
    ["hspace", 1],
    ["vskip", 1],
    ["hskip", 1],
    ["setlength", 2],
    ["addtolength", 2],
    ["setcounter", 2],
    ["addtocounter", 2],
    ["pagestyle", 1],
    ["thispagestyle", 1],
    ["pagenumbering", 1],
    ["bibliographystyle", 1],
    ["bibliography", 1],
    ["printbibliography", 0],
    ["graphicspath", 1],
    ["hypersetup", 1],
    ["captionsetup", 1],
    ["sisetup", 1],
    ["lstset", 1],
    ["urlstyle", 1],
    ["geometry", 1],
    ["linespread", 1],
    ["fontsize", 2],
    ["selectfont", 0],
    ["definecolor", 3],
    ["pagecolor", 1],
    ["color", 1],
    ["cline", 1],
    ["rule", 2],
    ["addlinespace", 0],
    ["rowcolor", 1],
    ["cellcolor", 1],
    ["arrayrulecolor", 1],
    ["index", 1],
    ["glossary", 1],
    ["footnotetext", 1],
    ["nocite", 1],
    ["input", 1],
    ["include", 1],
    ["addcontentsline", 3],
    ["addtocontents", 2],
    ["markboth", 2],
    ["markright", 1],
    ["phantom", 1],
    ["hphantom", 1],
    ["vphantom", 1],
    ["title", 1],
    ["author", 1],
    ["date", 1],
    ["documentclass", 1],
    ["usepackage", 1],
    ["setmainfont", 1],
    ["setsansfont", 1],
    ["setmonofont", 1],
    ["marginpar", 1],
    ["todo", 1],
    ["listoffigures", 0],
    ["listoftables", 0],
    ["printindex", 0],
]);

const accentMarks: ReadonlyMap<string, AccentMark> = new Map<string, AccentMark>([
    ["'", { mark: "\u0301", literal: "´" }],
    ["`", { mark: "\u0300", literal: "`" }],
    ["^", { mark: "\u0302", literal: "^" }],
    ['"', { mark: "\u0308", literal: "¨" }],
    ["~", { mark: "\u0303", literal: "~" }],
    ["=", { mark: "\u0304", literal: "=" }],
    [".", { mark: "\u0307", literal: "." }],
    ["c", { mark: "\u0327", literal: "" }],
    ["v", { mark: "\u030C", literal: "" }],
    ["u", { mark: "\u0306", literal: "" }],
    ["H", { mark: "\u030B", literal: "" }],
    ["k", { mark: "\u0328", literal: "" }],
    ["r", { mark: "\u030A", literal: "" }],
    ["d", { mark: "\u0323", literal: "" }],
    ["b", { mark: "\u0331", literal: "" }],
]);

const specialLetters: ReadonlyMap<string, string> = new Map<string, string>([
    ["i", "i"],
    ["j", "j"],
    ["o", "o"],
    ["O", "O"],
    ["aa", "å"],
    ["AA", "Å"],
    ["ae", "æ"],
    ["AE", "Æ"],
    ["oe", "œ"],
    ["OE", "Œ"],
    ["ss", "ß"],
    ["l", "ł"],
    ["L", "Ł"],
]);

const textSymbols: ReadonlyMap<string, string> = new Map<string, string>([
    ["%", "%"],
    ["&", "&"],
    ["_", "_"],
    ["#", "#"],
    ["$", "$"],
    ["{", "{"],
    ["}", "}"],
    ["textbackslash", "\\"],
    ["textasciitilde", "~"],
    ["textasciicircum", "^"],
    ["textbar", "|"],
    ["textless", "<"],
    ["textgreater", ">"],
    ["textunderscore", "_"],
    ["ldots", "…"],
    ["dots", "…"],
    ["textellipsis", "…"],
    ["copyright", "©"],
    ["textcopyright", "©"],
    ["textregistered", "®"],
    ["texttrademark", "™"],
    ["S", "§"],
    ["P", "¶"],
    ["pounds", "£"],
    ["textsterling", "£"],
    ["euro", "€"],
    ["texteuro", "€"],
    ["textyen", "¥"],
    ["textcent", "¢"],
    ["textdegree", "°"],
    ["degree", "°"],
    ["textmu", "µ"],
    ["textpm", "±"],
    ["texttimes", "×"],
    ["textdiv", "÷"],
    ["textendash", "–"],
    ["textemdash", "—"],
    ["textquoteleft", "‘"],
    ["textquoteright", "’"],
    ["textquotedblleft", "“"],
    ["textquotedblright", "”"],
    ["TeX", "TeX"],
    ["LaTeX", "LaTeX"],
    ["XeLaTeX", "XeLaTeX"],
    ["LuaLaTeX", "LuaLaTeX"],
    ["BibTeX", "BibTeX"],
    ["and", " · "],
    ["i", "ı"],
    ["j", "ȷ"],
    ["o", "ø"],
    ["O", "Ø"],
    ["ss", "ß"],
    ["aa", "å"],
    ["AA", "Å"],
    ["ae", "æ"],
    ["AE", "Æ"],
    ["oe", "œ"],
    ["OE", "Œ"],
    ["l", "ł"],
    ["L", "Ł"],
    ["slash", "/"],
    ["textbullet", "•"],
    ["dag", "†"],
    ["ddag", "‡"],
    ["textperiodcentered", "·"],
    ["textsection", "§"],
    ["textparagraph", "¶"],
    ["textordfeminine", "ª"],
    ["textordmasculine", "º"],
    ["textnumero", "№"],
]);

const spacingSymbols: ReadonlyMap<string, string> = new Map<string, string>([
    [",", "\u2009"],
    [":", "\u2005"],
    [";", "\u2005"],
    ["!", ""],
    ["/", ""],
    ["-", ""],
    [" ", "\u00A0"],
    ["quad", "\u2003"],
    ["qquad", "\u2003\u2003"],
    ["enspace", "\u2002"],
    ["thinspace", "\u2009"],
    ["medspace", "\u2005"],
    ["thickspace", "\u2005"],
    ["negthinspace", ""],
    ["hfill", " "],
    ["dotfill", ""],
    ["hrulefill", ""],
    ["smallskip", ""],
    ["medskip", ""],
    ["bigskip", ""],
    ["vfill", ""],
    ["break", ""],
    ["nobreak", ""],
    ["allowbreak", ""],
    ["nopagebreak", ""],
]);

/**
 * Reports whether a source contains a complete LaTeX document.
 * @param source - LaTeX source.
 * @example
 * isLatexDocument("\\begin{document}x\\end{document}"); // true
 * @returns True when the source has a document environment.
 */
export const isLatexDocument: (source: string) => boolean = (source: string): boolean =>
    /\\begin\s*\{document\}/.test(source);

/**
 * Renders a complete LaTeX document as an HTML article with embedded MathML.
 * @param source - LaTeX source including `\begin{document}` and `\end{document}`.
 * @example
 * const html: string = renderLatexDocument(source);
 * @returns The article markup, or an escaped fallback when no body is found.
 */
export const renderLatexDocument: (source: string) => string = (source: string): string => {
    const normalized: string = source.replace(/\r\n?/g, "\n");
    const definitions: DefinitionResult = parseDefinitions(normalized);
    const document: DocumentParts | null = extractDocument(definitions.source);

    if (document === null) {
        return `<article class="latex"><pre class="latex__verbatim"><code>${escapeHtml(source)}</code></pre></article>`;
    }

    const meta: LatexMeta = parseMeta(document.preamble, definitions.macros);
    const body: string = expandMacros(document.body, definitions.macros, 0).trim();
    const bibNumbers: ReadonlyMap<string, number> = collectBibNumbers(body);
    const first: LatexState = createState(meta, bibNumbers, new Map(), []);
    renderBlocks(body, first);

    const state: LatexState = createState(meta, bibNumbers, first.labels, first.headings);
    const content: string = renderBlocks(body, state);
    const notes: string = renderNotes(state);

    return `<article class="latex">${content}${notes}</article>`;
};

/**
 * Escapes a regular expression fragment.
 * @param value - Literal text.
 * @example
 * escapeRegExp("a.b"); // "a\\.b"
 * @returns The escaped fragment.
 */
const escapeRegExp: (value: string) => string = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const skipSpaces: (source: string, index: number) => number = (
    source: string,
    index: number,
): number => {
    let cursor: number = index;

    while (cursor < source.length) {
        const char: string = source.charAt(cursor);

        if (char === " " || char === "\t" || char === "\n" || char === "\r") {
            cursor += 1;
            continue;
        }

        break;
    }

    return cursor;
};

/**
 * Reads a balanced braced group.
 * @param source - Source text.
 * @param index - Start index.
 * @example
 * readGroup(" {a{b}}", 0);
 * @returns The contents without braces, or null when no group starts here.
 */
const readGroup: (source: string, index: number) => GroupResult | null = (
    source: string,
    index: number,
): GroupResult | null => {
    let cursor: number = skipSpaces(source, index);

    if (source.charAt(cursor) !== "{") {
        return null;
    }

    const start: number = cursor + 1;
    let depth: number = 1;
    cursor = start;

    while (cursor < source.length) {
        const char: string = source.charAt(cursor);

        if (char === "\\") {
            cursor += 2;
            continue;
        }

        if (char === "{") {
            depth += 1;
        } else if (char === "}") {
            depth -= 1;

            if (depth === 0) {
                return { value: source.slice(start, cursor), next: cursor + 1 };
            }
        }

        cursor += 1;
    }

    return { value: source.slice(start), next: source.length };
};

/**
 * Reads a balanced bracketed optional argument.
 * @param source - Source text.
 * @param index - Start index.
 * @example
 * readOptionalGroup("[a=1]{x}", 0);
 * @returns The contents without brackets, or null when no argument starts here.
 */
const readOptionalGroup: (source: string, index: number) => GroupResult | null = (
    source: string,
    index: number,
): GroupResult | null => {
    let cursor: number = skipSpaces(source, index);

    if (source.charAt(cursor) !== "[") {
        return null;
    }

    const start: number = cursor + 1;
    let depth: number = 1;
    let braces: number = 0;
    cursor = start;

    while (cursor < source.length) {
        const char: string = source.charAt(cursor);

        if (char === "\\") {
            cursor += 2;
            continue;
        }

        if (char === "{") {
            braces += 1;
        } else if (char === "}") {
            braces = Math.max(0, braces - 1);
        } else if (char === "[" && braces === 0) {
            depth += 1;
        } else if (char === "]" && braces === 0) {
            depth -= 1;

            if (depth === 0) {
                return { value: source.slice(start, cursor), next: cursor + 1 };
            }
        }

        cursor += 1;
    }

    return { value: source.slice(start), next: source.length };
};

/**
 * Reads a command name.
 * @param source - Source text.
 * @param index - Index of the backslash.
 * @example
 * readCommandName("\\section{x}", 0); // { name: "section", next: 8 }
 * @returns The command name and the index after it.
 */
const readCommandName: (source: string, index: number) => CommandResult = (
    source: string,
    index: number,
): CommandResult => {
    if (source.charAt(index) !== "\\") {
        return { name: "", next: index };
    }

    let cursor: number = index + 1;

    if (cursor >= source.length) {
        return { name: "", next: cursor };
    }

    const first: string = source.charAt(cursor);

    if (!/[A-Za-z]/.test(first)) {
        return { name: first, next: cursor + 1 };
    }

    const start: number = cursor;

    while (cursor < source.length && /[A-Za-z]/.test(source.charAt(cursor))) {
        cursor += 1;
    }

    return { name: source.slice(start, cursor), next: cursor };
};

/**
 * Reports whether a command line has a balanced required argument.
 * @param source - Command source.
 * @example
 * hasBalancedGroup("\\section{One}"); // true
 * @returns True when braces balance and a group was seen.
 */
const hasBalancedGroup: (source: string) => boolean = (source: string): boolean => {
    let depth: number = 0;
    let seen: boolean = false;

    for (let index: number = 0; index < source.length; index += 1) {
        const char: string = source.charAt(index);

        if (char === "\\") {
            index += 1;
            continue;
        }

        if (char === "{") {
            depth += 1;
            seen = true;
        } else if (char === "}") {
            depth -= 1;
        }
    }

    return seen && depth <= 0;
};

/**
 * Removes TeX comments while preserving escaped percent signs.
 * @param source - Preamble source.
 * @example
 * stripComments("50\\% % note"); // "50\\% "
 * @returns Source without comments.
 */
const stripComments: (source: string) => string = (source: string): string => {
    const output: string[] = [];
    let index: number = 0;

    while (index < source.length) {
        const char: string = source.charAt(index);

        if (char === "\\") {
            output.push(source.slice(index, index + 2));
            index += 2;
            continue;
        }

        if (char === "%") {
            const newline: number = source.indexOf("\n", index);
            output.push("\n");
            index = newline === -1 ? source.length : newline + 1;
            continue;
        }

        output.push(char);
        index += 1;
    }

    return output.join("");
};

/**
 * Reads a command name and its first required argument.
 * @param source - Source text.
 * @param index - Index of the backslash.
 * @example
 * readCommandArg("\\label{sec:intro}", 0); // "sec:intro"
 * @returns The argument, or null when no argument follows.
 */
const readCommandArg: (source: string, index: number) => string | null = (
    source: string,
    index: number,
): string | null => {
    const command: CommandResult = readCommandName(source, index);
    let cursor: number = command.next;

    if (source.charAt(cursor) === "*") {
        cursor += 1;
    }

    const optional: GroupResult | null = readOptionalGroup(source, cursor);

    if (optional !== null) {
        cursor = optional.next;
    }

    const group: GroupResult | null = readGroup(source, cursor);

    return group === null ? null : group.value;
};

/**
 * Extracts the first occurrence of a command with an optional and required argument.
 * @param source - Source text.
 * @param name - Command name without the backslash.
 * @example
 * extractCommand("\\caption{A}", "caption");
 * @returns The argument, or null, plus the source with the command removed.
 */
const extractCommand: (
    source: string,
    name: string,
) => { value: string | null; rest: string } = (
    source: string,
    name: string,
): { value: string | null; rest: string } => {
    const pattern: RegExp = new RegExp(`\\\\${name}\\*?\\s*(?:\\[[^\\]]*\\]\\s*)?\\{`);
    const match: RegExpExecArray | null = pattern.exec(source);

    if (match === null) {
        return { value: null, rest: source };
    }

    const group: GroupResult | null = readGroup(source, match.index + match[0].length - 1);

    if (group === null) {
        return { value: null, rest: source };
    }

    return {
        value: group.value,
        rest: source.slice(0, match.index) + source.slice(group.next),
    };
};

/**
 * Extracts a `\tag` or `\tag*` argument.
 * @param source - Equation source.
 * @example
 * extractTag("x \\tag{1}");
 * @returns The tag text, whether it was starred, and the remaining source.
 */
const extractTag: (
    source: string,
) => { value: string | null; starred: boolean; rest: string } = (
    source: string,
): { value: string | null; starred: boolean; rest: string } => {
    const pattern: RegExp = /\\tag(\*)?\s*(?:\[[^\]]*\]\s*)?\{/;
    const match: RegExpExecArray | null = pattern.exec(source);

    if (match === null) {
        return { value: null, starred: false, rest: source };
    }

    const group: GroupResult | null = readGroup(source, match.index + match[0].length - 1);

    if (group === null) {
        return { value: null, starred: false, rest: source };
    }

    return {
        value: group.value,
        starred: match[1] === "*",
        rest: source.slice(0, match.index) + source.slice(group.next),
    };
};

/**
 * Removes all `\label` commands from a fragment.
 * @param source - Source fragment.
 * @example
 * extractLabels("\\label{eq:1} x"); // { labels: ["eq:1"], rest: " x" }
 * @returns The labels and the remaining source.
 */
const extractLabels: (source: string) => { labels: string[]; rest: string } = (
    source: string,
): { labels: string[]; rest: string } => {
    const labels: string[] = [];
    let rest: string = source;
    let match: RegExpExecArray | null = /\\label\s*\{([^}]*)\}/.exec(rest);

    while (match !== null) {
        labels.push(match[1].trim());
        rest = rest.slice(0, match.index) + rest.slice(match.index + match[0].length);
        match = /\\label\s*\{([^}]*)\}/.exec(rest);
    }

    return { labels, rest };
};

/**
 * Splits the source at the document environment.
 * @param source - LaTeX source with definitions removed.
 * @example
 * extractDocument("\\documentclass{article}\\begin{document}x\\end{document}");
 * @returns Preamble and body, or null when no document environment exists.
 */
const extractDocument: (source: string) => DocumentParts | null = (
    source: string,
): DocumentParts | null => {
    const begin: RegExpExecArray | null = /\\begin\s*\{document\}/.exec(source);

    if (begin === null) {
        return null;
    }

    const after: number = begin.index + begin[0].length;
    const end: RegExpExecArray | null = /\\end\s*\{document\}/.exec(source.slice(after));

    return {
        preamble: source.slice(0, begin.index),
        body: end === null ? source.slice(after) : source.slice(after, after + end.index),
    };
};

/**
 * Finds the end of a verbatim region so definitions and macros leave it alone.
 * @param source - Source text.
 * @param index - Index of `\begin{verbatim}` or `\verb`.
 * @param marker - The matched opening marker.
 * @example
 * findVerbatimRegion(source, 0, "\\begin{verbatim}");
 * @returns The index after the region.
 */
const findVerbatimRegion: (source: string, index: number, marker: string) => number = (
    source: string,
    index: number,
    marker: string,
): number => {
    if (marker.startsWith("\\verb")) {
        let cursor: number = index + marker.length;

        if (source.charAt(cursor) === "*") {
            cursor += 1;
        }

        const delimiter: string = source.charAt(cursor);

        if (delimiter.length === 0) {
            return source.length;
        }

        const end: number = source.indexOf(delimiter, cursor + 1);

        return end === -1 ? source.length : end + 1;
    }

    const nameMatch: RegExpExecArray | null = /\\begin\s*\{([^}]+)\}/.exec(marker);
    const name: string = nameMatch === null ? "verbatim" : nameMatch[1];
    const endText: string = `\\end{${name}}`;
    const end: number = source.indexOf(endText, index);

    return end === -1 ? source.length : end + endText.length;
};

/**
 * Parses `\newcommand`, `\renewcommand`, `\providecommand`, `\def`, and
 * `\DeclareMathOperator` definitions and removes them from the source.
 * @param source - LaTeX source.
 * @example
 * const result: DefinitionResult = parseDefinitions(source);
 * @returns The macro table and the source without definitions.
 */
const parseDefinitions: (source: string) => DefinitionResult = (
    source: string,
): DefinitionResult => {
    const macros: Map<string, MacroDefinition> = new Map<string, MacroDefinition>();
    const output: string[] = [];
    let index: number = 0;

    while (index < source.length) {
        const rest: string = source.slice(index);
        const verbatim: RegExpExecArray | null =
            /^\\(?:begin\s*\{(?:verbatim\*?|Verbatim|lstlisting|minted)\}|verb\b)/.exec(rest);

        if (verbatim !== null) {
            const end: number = findVerbatimRegion(source, index, verbatim[0]);
            output.push(source.slice(index, end));
            index = end;
            continue;
        }

        if (source.charAt(index) === "%") {
            const newline: number = source.indexOf("\n", index);
            const end: number = newline === -1 ? source.length : newline + 1;
            output.push(source.slice(index, end));
            index = end;
            continue;
        }

        const definition: RegExpExecArray | null =
            /^\\(newcommand|renewcommand|providecommand|DeclareMathOperator\*?|def)\b/.exec(rest);

        if (definition === null) {
            output.push(source.charAt(index));
            index += 1;
            continue;
        }

        const parsed: { name: string; macro: MacroDefinition; next: number } | null =
            parseDefinition(source, index, definition[1]);

        if (parsed === null) {
            output.push(source.charAt(index));
            index += 1;
            continue;
        }

        macros.set(parsed.name, parsed.macro);
        output.push(source.slice(index, parsed.next).replace(/[^\n]/g, ""));
        index = parsed.next;
    }

    return { macros, source: output.join("") };
};

/**
 * Parses one macro definition.
 * @param source - Source text.
 * @param index - Definition start.
 * @param kind - Matched command name.
 * @example
 * parseDefinition(source, 0, "newcommand");
 * @returns The name, macro, and next index, or null when malformed.
 */
const parseDefinition: (
    source: string,
    index: number,
    kind: string,
) => { name: string; macro: MacroDefinition; next: number } | null = (
    source: string,
    index: number,
    kind: string,
): { name: string; macro: MacroDefinition; next: number } | null => {
    let cursor: number = skipSpaces(source, index + 1 + kind.length);

    if (source.charAt(cursor) === "*") {
        cursor += 1;
    }

    if (kind.startsWith("DeclareMathOperator")) {
        const nameGroup: GroupResult | null = readGroup(source, cursor);

        if (nameGroup === null) {
            return null;
        }

        const nameCommand: CommandResult = readCommandName(nameGroup.value, 0);
        const bodyGroup: GroupResult | null = readGroup(source, nameGroup.next);

        if (bodyGroup === null || nameCommand.name.length === 0) {
            return null;
        }

        const operator: string = bodyGroup.value
            .replace(/\\[,;:!]/g, " ")
            .replace(/\\ /g, " ")
            .trim();

        return {
            name: nameCommand.name,
            macro: { args: 0, optional: null, body: `\\operatorname{${operator}}` },
            next: bodyGroup.next,
        };
    }

    let name: string;

    if (source.charAt(cursor) === "{") {
        const nameGroup: GroupResult | null = readGroup(source, cursor);

        if (nameGroup === null) {
            return null;
        }

        const nameCommand: CommandResult = readCommandName(nameGroup.value, 0);

        if (nameCommand.name.length === 0) {
            return null;
        }

        name = nameCommand.name;
        cursor = nameGroup.next;
    } else {
        const nameCommand: CommandResult = readCommandName(source, cursor);

        if (nameCommand.name.length === 0) {
            return null;
        }

        name = nameCommand.name;
        cursor = nameCommand.next;
    }

    let args: number = 0;
    let optional: string | null = null;

    if (kind === "def") {
        const bodyGroup: GroupResult | null = readGroup(source, cursor);

        if (bodyGroup === null || bodyGroup.value.includes("#")) {
            return null;
        }

        return { name, macro: { args: 0, optional: null, body: bodyGroup.value }, next: bodyGroup.next };
    }

    const argumentCount: GroupResult | null = readOptionalGroup(source, cursor);

    if (argumentCount !== null) {
        const parsed: number = Number.parseInt(argumentCount.value, 10);

        if (Number.isFinite(parsed) && parsed > 0) {
            args = parsed;
        }

        cursor = argumentCount.next;
    }

    const defaultArgument: GroupResult | null = readOptionalGroup(source, cursor);

    if (defaultArgument !== null) {
        optional = defaultArgument.value;
        args = Math.max(1, args);
        cursor = defaultArgument.next;
    }

    const bodyGroup: GroupResult | null = readGroup(source, cursor);

    if (bodyGroup === null) {
        return null;
    }

    return {
        name,
        macro: { args, optional, body: bodyGroup.value },
        next: bodyGroup.next,
    };
};

/**
 * Expands user macros outside verbatim regions.
 * @param source - Source text.
 * @param macros - Macro table.
 * @param depth - Current expansion depth.
 * @example
 * expandMacros("\\R", macros, 0);
 * @returns Source with macros expanded.
 */
const expandMacros: (
    source: string,
    macros: ReadonlyMap<string, MacroDefinition>,
    depth: number,
) => string = (
    source: string,
    macros: ReadonlyMap<string, MacroDefinition>,
    depth: number,
): string => {
    if (macros.size === 0 || depth > 8 || source.length > 2_000_000) {
        return source;
    }

    const output: string[] = [];
    let index: number = 0;

    while (index < source.length) {
        const rest: string = source.slice(index);
        const verbatim: RegExpExecArray | null =
            /^\\(?:begin\s*\{(?:verbatim\*?|Verbatim|lstlisting|minted)\}|verb\b)/.exec(rest);

        if (verbatim !== null) {
            const end: number = findVerbatimRegion(source, index, verbatim[0]);
            output.push(source.slice(index, end));
            index = end;
            continue;
        }

        if (rest.startsWith("%")) {
            const newline: number = source.indexOf("\n", index);
            const end: number = newline === -1 ? source.length : newline + 1;
            output.push(source.slice(index, end));
            index = end;
            continue;
        }

        if (rest.startsWith("\\\\")) {
            output.push("\\\\");
            index += 2;
            continue;
        }

        if (rest.startsWith("\\")) {
            const command: CommandResult = readCommandName(source, index);
            const macro: MacroDefinition | void = macros.get(command.name);

            if (macro !== (void 0)) {
                let cursor: number = command.next;
                const args: string[] = [];
                let failed: boolean = false;

                if (macro.optional !== null) {
                    const optional: GroupResult | null = readOptionalGroup(source, cursor);

                    if (optional === null) {
                        args.push(macro.optional);
                    } else {
                        args.push(optional.value);
                        cursor = optional.next;
                    }
                }

                const required: number = macro.args - (macro.optional === null ? 0 : 1);

                for (let count: number = 0; count < required; count += 1) {
                    const group: GroupResult | null = readGroup(source, cursor);

                    if (group === null) {
                        failed = true;
                        break;
                    }

                    args.push(group.value);
                    cursor = group.next;
                }

                if (!failed) {
                    const substituted: string = substituteMacro(macro.body, args);
                    output.push(expandMacros(substituted, macros, depth + 1));
                    index = cursor;
                    continue;
                }
            }

            output.push(source.slice(index, command.next));
            index = command.next;
            continue;
        }

        output.push(source.charAt(index));
        index += 1;
    }

    return output.join("");
};

/**
 * Substitutes `#1` ... `#9` in a macro body.
 * @param body - Macro body.
 * @param args - Arguments in order.
 * @example
 * substituteMacro("\\textbf{#1}", ["Hi"]);
 * @returns The substituted body.
 */
const substituteMacro: (body: string, args: readonly string[]) => string = (
    body: string,
    args: readonly string[],
): string => {
    let result: string = body.replace(/##/g, "\uE100");

    for (let index: number = 1; index <= 9; index += 1) {
        result = result.split(`#${index}`).join(args[index - 1] ?? "");
    }

    return result.replace(/\uE100/g, "#");
};

/**
 * Extracts a metadata command from the preamble.
 * @param source - Preamble source.
 * @param name - Command name.
 * @example
 * findMeta("\\title{Hello}", "title");
 * @returns Presence and raw argument.
 */
const findMeta: (source: string, name: string) => { present: boolean; value: string } = (
    source: string,
    name: string,
): { present: boolean; value: string } => {
    const pattern: RegExp = new RegExp(`\\\\${name}\\b`, "g");
    const match: RegExpExecArray | null = pattern.exec(source);

    if (match === null) {
        return { present: false, value: "" };
    }

    let cursor: number = match.index + match[0].length;

    if (source.charAt(cursor) === "*") {
        cursor += 1;
    }

    const optional: GroupResult | null = readOptionalGroup(source, cursor);

    if (optional !== null) {
        cursor = optional.next;
    }

    const group: GroupResult | null = readGroup(source, cursor);

    return group === null ? { present: true, value: "" } : { present: true, value: group.value };
};

/**
 * Parses title, author, and date from the preamble.
 * @param preamble - Preamble source.
 * @param macros - Macro table for expanding metadata.
 * @example
 * parseMeta(preamble, macros);
 * @returns Document metadata.
 */
const parseMeta: (
    preamble: string,
    macros: ReadonlyMap<string, MacroDefinition>,
) => LatexMeta = (
    preamble: string,
    macros: ReadonlyMap<string, MacroDefinition>,
): LatexMeta => {
    const cleaned: string = stripComments(preamble);
    const title: { present: boolean; value: string } = findMeta(cleaned, "title");
    const author: { present: boolean; value: string } = findMeta(cleaned, "author");
    const date: { present: boolean; value: string } = findMeta(cleaned, "date");
    let dateValue: string | null;

    if (date.present) {
        dateValue = date.value.trim().length === 0 ? null : expandMacros(date.value, macros, 0).trim();
    } else {
        dateValue = "\\today";
    }

    return {
        title: expandMacros(title.value, macros, 0).trim(),
        author: expandMacros(author.value, macros, 0).trim(),
        date: dateValue,
    };
};

/**
 * Creates a fresh rendering state.
 * @param meta - Document metadata.
 * @param bibNumbers - Citation numbers keyed by bibliography key.
 * @param knownLabels - Labels collected by the first pass.
 * @param knownHeadings - Headings collected by the first pass.
 * @example
 * createState(meta, bibNumbers, new Map(), []);
 * @returns The state for one rendering pass.
 */
const createState: (
    meta: LatexMeta,
    bibNumbers: ReadonlyMap<string, number>,
    knownLabels: ReadonlyMap<string, LabelTarget>,
    knownHeadings: readonly TocEntry[],
) => LatexState = (
    meta: LatexMeta,
    bibNumbers: ReadonlyMap<string, number>,
    knownLabels: ReadonlyMap<string, LabelTarget>,
    knownHeadings: readonly TocEntry[],
): LatexState => ({
    meta,
    bibNumbers,
    knownLabels,
    knownHeadings,
    labels: new Map<string, LabelTarget>(),
    headings: [],
    footnotes: [],
    counters: {
        part: 0,
        chapter: 0,
        section: 0,
        subsection: 0,
        subsubsection: 0,
        paragraph: 0,
        subparagraph: 0,
        figure: 0,
        table: 0,
        equation: 0,
        theorem: 0,
    },
    appendix: false,
    sectionTarget: null,
    labelTarget: null,
    headingCount: 0,
    unnumberedCount: 0,
});

/**
 * Collects bibliography numbers in source order.
 * @param source - Document body.
 * @example
 * collectBibNumbers("\\bibitem{a} A");
 * @returns Citation numbers keyed by bibliography key.
 */
const collectBibNumbers: (source: string) => ReadonlyMap<string, number> = (
    source: string,
): ReadonlyMap<string, number> => {
    const numbers: Map<string, number> = new Map<string, number>();
    const pattern: RegExp = /\\bibitem\s*(?:\[[^\]]*\])?\s*\{([^}]+)\}/g;
    let match: RegExpExecArray | null = pattern.exec(source);
    let number: number = 0;

    while (match !== null) {
        number += 1;

        if (!numbers.has(match[1].trim())) {
            numbers.set(match[1].trim(), number);
        }

        match = pattern.exec(source);
    }

    return numbers;
};

/**
 * Converts a number to uppercase letters.
 * @param value - Positive number.
 * @example
 * letter(27); // "AA"
 * @returns The letter label.
 */
const letter: (value: number) => string = (value: number): string => {
    let number: number = value;
    let result: string = "";

    while (number > 0) {
        const remainder: number = (number - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        number = Math.floor((number - 1) / 26);
    }

    return result;
};

/**
 * Converts a number to Roman numerals.
 * @param value - Positive number.
 * @example
 * roman(9); // "IX"
 * @returns The Roman numeral.
 */
const roman: (value: number) => string = (value: number): string => {
    const table: ReadonlyArray<readonly [number, string]> = [
        [1000, "M"],
        [900, "CM"],
        [500, "D"],
        [400, "CD"],
        [100, "C"],
        [90, "XC"],
        [50, "L"],
        [40, "XL"],
        [10, "X"],
        [9, "IX"],
        [5, "V"],
        [4, "IV"],
        [1, "I"],
    ];
    let remaining: number = value;
    let result: string = "";

    for (const entry of table) {
        while (remaining >= entry[0]) {
            result += entry[1];
            remaining -= entry[0];
        }
    }

    return result;
};

/**
 * Formats today's date for `\today`.
 * @example
 * formatToday();
 * @returns A long English date.
 */
const formatToday: () => string = (): string =>
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

/**
 * Converts a heading or tag with commands into plain text.
 * @param source - Inline source.
 * @example
 * plainText("\\textbf{Hello}"); // "Hello"
 * @returns The text content.
 */
const plainText: (source: string) => string = (source: string): string =>
    source
        .replace(/\\label\s*\{[^}]*\}/g, "")
        .replace(/\\footnote\s*\{[^}]*\}/g, "")
        .replace(/\\thanks\s*\{[^}]*\}/g, "")
        .replace(/\\[A-Za-z]+\*?/g, "")
        .replace(/\\[^A-Za-z]/g, " ")
        .replace(/[${}]/g, "")
        .replace(/\s+/g, " ")
        .trim();

/**
 * Escapes text for use in an HTML attribute.
 * @param value - Attribute value.
 * @example
 * escapeAttribute("a\"b"); // "a&quot;b"
 * @returns The escaped value.
 */
const escapeAttribute: (value: string) => string = (value: string): string => escapeHtml(value);

/**
 * Checks a value for control characters.
 * @param value - Any string.
 * @example
 * hasControlCharacter("a"); // false
 * @returns True when a C0 or DEL character is present.
 */
const hasControlCharacter: (value: string) => boolean = (value: string): boolean => {
    for (let index: number = 0; index < value.length; index += 1) {
        const code: number = value.charCodeAt(index);

        if (code < 32 || code === 127) {
            return true;
        }
    }

    return false;
};

/**
 * Checks whether a document URL is safe to emit.
 * @param value - URL candidate.
 * @param allowMailto - Whether `mailto:` is permitted.
 * @example
 * safeDocumentUrl("javascript:x", false); // false
 * @returns True for http(s), relative URLs, and optionally mailto.
 */
const safeDocumentUrl: (value: string, allowMailto: boolean) => boolean = (
    value: string,
    allowMailto: boolean,
): boolean => {
    const trimmed: string = value.trim();

    if (trimmed.length === 0 || hasControlCharacter(trimmed)) {
        return false;
    }

    const lower: string = trimmed.toLowerCase();
    const scheme: RegExpExecArray | null = /^[a-z][a-z0-9+.-]*:/.exec(lower);

    if (scheme === null) {
        return true;
    }

    if (lower.startsWith("http://") || lower.startsWith("https://")) {
        return true;
    }

    return allowMailto && lower.startsWith("mailto:");
};

/**
 * Sanitises an identifier for use in `id` and `href` attributes.
 * @param value - Raw key.
 * @example
 * sanitizeId("sec:intro"); // "sec:intro"
 * @returns A safe identifier fragment.
 */
const sanitizeId: (value: string) => string = (value: string): string => {
    const sanitized: string = value
        .trim()
        .replace(/[^A-Za-z0-9_.:-]+/g, "-")
        .replace(/^[-.]+|[-.]+$/g, "");

    return sanitized.length > 0 ? sanitized : "item";
};

/**
 * Reads the base character for an accent command.
 * @param source - Source text.
 * @param index - Index after the accent command.
 * @example
 * readAccentBase("\\'{e}", 2);
 * @returns The base text and next index.
 */
const readAccentBase: (source: string, index: number) => { value: string; next: number } = (
    source: string,
    index: number,
): { value: string; next: number } => {
    const cursor: number = index;

    if (source.charAt(cursor) === "{") {
        const group: GroupResult | null = readGroup(source, cursor);

        if (group !== null) {
            return { value: group.value, next: group.next };
        }
    }

    if (source.charAt(cursor) === "\\") {
        const command: CommandResult = readCommandName(source, cursor);

        return { value: specialLetters.get(command.name) ?? "", next: command.next };
    }

    const char: string = source.charAt(cursor);

    return { value: char, next: char.length > 0 ? cursor + 1 : cursor };
};

/**
 * Applies a combining accent mark.
 * @param base - Base text.
 * @param accent - Accent definition.
 * @example
 * applyAccent("e", accentMarks.get("'"));
 * @returns The escaped accented text.
 */
const applyAccent: (base: string, accent: AccentMark) => string = (
    base: string,
    accent: AccentMark,
): string => {
    if (base.length === 0) {
        return escapeHtml(accent.literal);
    }

    const first: string = base.charAt(0);
    const rest: string = base.slice(1);

    return escapeHtml((first + accent.mark).normalize("NFC") + rest);
};

/**
 * Reads inline maths delimited by dollars.
 * @param source - Source text.
 * @param index - Index of the dollar sign.
 * @example
 * readDollarMath("$x$", 0);
 * @returns The maths source, display flag, and next index, or null when unterminated.
 */
const readDollarMath: (
    source: string,
    index: number,
) => { value: string; display: boolean; next: number } | null = (
    source: string,
    index: number,
): { value: string; display: boolean; next: number } | null => {
    if (source.charAt(index) !== "$") {
        return null;
    }

    const display: boolean = source.startsWith("$$", index);
    const open: number = display ? 2 : 1;
    let cursor: number = index + open;

    while (cursor < source.length) {
        const char: string = source.charAt(cursor);

        if (char === "\\") {
            cursor += 2;
            continue;
        }

        if (display && source.startsWith("$$", cursor)) {
            return { value: source.slice(index + open, cursor), display: true, next: cursor + 2 };
        }

        if (!display && char === "$") {
            return { value: source.slice(index + open, cursor), display: false, next: cursor + 1 };
        }

        cursor += 1;
    }

    return null;
};

/**
 * Reads inline maths delimited by `\\(` or `\\[`.
 * @param source - Source text.
 * @param index - Index of the opening delimiter.
 * @param open - Opening delimiter.
 * @param close - Closing delimiter.
 * @example
 * readDelimitedMath(source, 0, "\\(", "\\)");
 * @returns The maths source, display flag, and next index, or null when unterminated.
 */
const readDelimitedMath: (
    source: string,
    index: number,
    open: string,
    close: string,
) => { value: string; display: boolean; next: number } | null = (
    source: string,
    index: number,
    open: string,
    close: string,
): { value: string; display: boolean; next: number } | null => {
    let cursor: number = index + open.length;

    while (cursor < source.length) {
        const char: string = source.charAt(cursor);

        if (char === "\\") {
            if (source.startsWith(close, cursor)) {
                return {
                    value: source.slice(index + open.length, cursor),
                    display: open === "\\[",
                    next: cursor + close.length,
                };
            }

            cursor += 2;
            continue;
        }

        cursor += 1;
    }

    return null;
};

/**
 * Renders the document body as blocks.
 * @param source - Body source.
 * @param state - Rendering state.
 * @example
 * renderBlocks(source, state);
 * @returns The body HTML.
 */
const renderBlocks: (source: string, state: LatexState) => string = (
    source: string,
    state: LatexState,
): string => {
    const lines: string[] = source.split("\n");
    const output: string[] = [];
    let paragraph: string[] = [];
    let index: number = 0;

    const flush: () => void = (): void => {
        if (paragraph.length === 0) {
            return;
        }

        const html: string = renderInline(paragraph.join("\n"), state).trim();

        if (html.length > 0) {
            output.push(`<p>${html}</p>`);
        }

        paragraph = [];
    };

    while (index < lines.length) {
        const raw: string = lines[index];
        let line: string = raw.trim();

        while (stylePrefix.test(line)) {
            line = line.replace(stylePrefix, "").trim();
        }

        if (line.length === 0) {
            flush();
            index += 1;
            continue;
        }

        if (line.startsWith("%")) {
            index += 1;
            continue;
        }

        if (line.startsWith("\\[") || line.startsWith("$$")) {
            flush();
            const block: { html: string; next: number } = renderDisplayMath(lines, index, state);
            output.push(block.html);
            index = block.next;
            continue;
        }

        const sectionMatch: RegExpExecArray | null = sectionPattern.exec(line);

        if (sectionMatch !== null) {
            flush();
            const heading: { html: string; next: number } = renderSection(
                lines,
                index,
                sectionMatch[1],
                state,
            );
            output.push(heading.html);
            index = heading.next;
            continue;
        }

        if (/^\\begin\s*\{/.test(line)) {
            flush();
            const environment: { html: string; next: number } = renderEnvironment(lines, index, state);
            output.push(environment.html);
            index = environment.next;
            continue;
        }

        if (/^\\maketitle\b/.test(line)) {
            flush();
            output.push(renderTitle(state));
            index += 1;
            continue;
        }

        if (/^\\tableofcontents\b/.test(line)) {
            flush();
            output.push(renderToc(state));
            index += 1;
            continue;
        }

        if (/^\\appendix\b/.test(line)) {
            flush();
            state.appendix = true;
            state.counters.chapter = 0;
            state.counters.section = 0;
            state.counters.subsection = 0;
            state.counters.subsubsection = 0;
            state.counters.paragraph = 0;
            state.counters.subparagraph = 0;
            index += 1;
            continue;
        }

        if (/^\\par\b/.test(line)) {
            flush();
            const remainder: string = line.replace(/^\\par\b\s*/, "");

            if (remainder.length > 0) {
                paragraph.push(remainder);
            }

            index += 1;
            continue;
        }

        if (ignoredBlockPattern.test(line)) {
            flush();
            index += 1;
            continue;
        }

        if (/^\\label\b/.test(line)) {
            const label: string | null = readCommandArg(line, 0);

            if (label !== null) {
                registerLabel(state, label);
            }

            index += 1;
            continue;
        }

        if (/^\\caption\b/.test(line)) {
            flush();
            const caption: string | null = readCommandArg(line, 0);

            if (caption !== null) {
                output.push(`<p class="latex__caption">${renderInline(caption, state)}</p>`);
            }

            index += 1;
            continue;
        }

        if (/^\\item\b/.test(line) || /^\\end\s*\{/.test(line)) {
            index += 1;
            continue;
        }

        paragraph.push(line);
        index += 1;
    }

    flush();

    return output.join("\n");
};

/**
 * Renders a sectioning command and registers its number.
 * @param lines - Document lines.
 * @param index - Start line.
 * @param name - Sectioning command.
 * @param state - Rendering state.
 * @example
 * renderSection(lines, 0, "section", state);
 * @returns The heading HTML and next line index.
 */
const renderSection: (
    lines: string[],
    index: number,
    name: string,
    state: LatexState,
) => { html: string; next: number } = (
    lines: string[],
    index: number,
    name: string,
    state: LatexState,
): { html: string; next: number } => {
    let text: string = lines[index].trim();
    let next: number = index + 1;
    let guard: number = 0;

    while (!hasBalancedGroup(text) && next < lines.length && guard < 100) {
        text += `\n${lines[next].trim()}`;
        next += 1;
        guard += 1;
    }

    const command: CommandResult = readCommandName(text, 0);
    let cursor: number = command.next;
    const starred: boolean = text.charAt(cursor) === "*";

    if (starred) {
        cursor += 1;
    }

    const optional: GroupResult | null = readOptionalGroup(text, cursor);
    const short: string = optional === null ? "" : optional.value;

    if (optional !== null) {
        cursor = optional.next;
    }

    const group: GroupResult | null = readGroup(text, cursor);
    const title: string = group === null ? "" : group.value;

    incrementSection(name, starred, state);

    const number: string = starred ? "" : sectionNumber(name, state);
    state.headingCount += 1;

    const id: string = `sec-${state.headingCount}`;
    const target: LabelTarget = { kind: "section", number, id };
    state.labelTarget = target;
    state.sectionTarget = target;

    const level: number = headingLevels.get(name) ?? 2;
    const tocLevel: number = tocLevels.get(name) ?? 1;
    const trailing: { labels: string[]; rest: string } = extractLabels(
        text.slice(group === null ? text.length : group.next),
    );

    for (const label of trailing.labels) {
        registerLabel(state, label);
    }

    const rendered: string = renderInline(title, state);

    if (!starred && tocLevel <= 3) {
        state.headings.push({
            level: tocLevel,
            number,
            title: plainText(short.length > 0 ? short : title),
            id,
        });
    }

    const numberHtml: string =
        number.length > 0 ? `<span class="latex__heading-number">${escapeHtml(number)}</span>` : "";

    return {
        html: `<h${level} id="${escapeAttribute(id)}" class="latex__heading latex__heading--${name}">${numberHtml}${rendered}</h${level}>`,
        next,
    };
};

/**
 * Increments the relevant section counter.
 * @param name - Sectioning command.
 * @param starred - Whether the heading is starred.
 * @param state - Rendering state.
 * @example
 * incrementSection("section", false, state);
 */
const incrementSection: (name: string, starred: boolean, state: LatexState) => void = (
    name: string,
    starred: boolean,
    state: LatexState,
): void => {
    if (starred) {
        return;
    }

    if (name === "part") {
        state.counters.part += 1;
        return;
    }

    if (name === "chapter") {
        state.counters.chapter += 1;
        state.counters.section = 0;
        state.counters.subsection = 0;
        state.counters.subsubsection = 0;
        state.counters.paragraph = 0;
        state.counters.subparagraph = 0;
        return;
    }

    if (name === "section") {
        state.counters.section += 1;
        state.counters.subsection = 0;
        state.counters.subsubsection = 0;
        state.counters.paragraph = 0;
        state.counters.subparagraph = 0;
        return;
    }

    if (name === "subsection") {
        state.counters.subsection += 1;
        state.counters.subsubsection = 0;
        state.counters.paragraph = 0;
        state.counters.subparagraph = 0;
        return;
    }

    if (name === "subsubsection") {
        state.counters.subsubsection += 1;
        state.counters.paragraph = 0;
        state.counters.subparagraph = 0;
        return;
    }

    if (name === "paragraph") {
        state.counters.paragraph += 1;
        state.counters.subparagraph = 0;
        return;
    }

    state.counters.subparagraph += 1;
};

/**
 * Computes a section number from the current counters.
 * @param name - Sectioning command.
 * @param state - Rendering state.
 * @example
 * sectionNumber("subsection", state); // "2.1"
 * @returns The number, including appendix letters where applicable.
 */
const sectionNumber: (name: string, state: LatexState) => string = (
    name: string,
    state: LatexState,
): string => {
    if (name === "part") {
        return roman(state.counters.part);
    }

    if (name === "chapter") {
        return state.appendix
            ? letter(state.counters.chapter)
            : `${state.counters.chapter}`;
    }

    if (name === "section") {
        if (state.appendix) {
            return state.counters.chapter > 0
                ? `${letter(state.counters.chapter)}.${letter(state.counters.section)}`
                : letter(state.counters.section);
        }

        return state.counters.chapter > 0
            ? `${state.counters.chapter}.${state.counters.section}`
            : `${state.counters.section}`;
    }

    if (name === "subsection") {
        return `${sectionNumber("section", state)}.${state.counters.subsection}`;
    }

    if (name === "subsubsection") {
        return `${sectionNumber("subsection", state)}.${state.counters.subsubsection}`;
    }

    if (name === "paragraph") {
        return `${sectionNumber("subsubsection", state)}.${state.counters.paragraph}`;
    }

    return `${sectionNumber("paragraph", state)}.${state.counters.subparagraph}`;
};

/**
 * Renders the title block for `\maketitle`.
 * @param state - Rendering state.
 * @example
 * renderTitle(state);
 * @returns The title header, or an empty string.
 */
const renderTitle: (state: LatexState) => string = (state: LatexState): string => {
    const meta: LatexMeta = state.meta;

    if (meta.title.length === 0 && meta.author.length === 0 && meta.date === null) {
        return "";
    }

    const titleHtml: string =
        meta.title.length > 0
            ? `<h1 class="latex__title-text">${renderInline(meta.title, state)}</h1>`
            : "";
    const authors: string[] = meta.author
        .split(/\s*\\and\s*/)
        .map((author: string): string => author.trim())
        .filter((author: string): boolean => author.length > 0);
    const authorHtml: string =
        authors.length > 0
            ? `<p class="latex__authors">${authors
                  .map((author: string): string => `<span class="latex__author">${renderInline(author, state)}</span>`)
                  .join('<span class="latex__author-separator"> · </span>')}</p>`
            : "";
    const dateHtml: string =
        meta.date === null ? "" : `<p class="latex__date">${renderInline(meta.date, state)}</p>`;

    return `<header class="latex__title">${titleHtml}${authorHtml}${dateHtml}</header>`;
};

/**
 * Renders the table of contents from the collected headings.
 * @param state - Rendering state.
 * @example
 * renderToc(state);
 * @returns The contents navigation, or an empty string.
 */
const renderToc: (state: LatexState) => string = (state: LatexState): string => {
    const headings: readonly TocEntry[] =
        state.knownHeadings.length > 0 ? state.knownHeadings : state.headings;
    const visible: TocEntry[] = headings.filter((entry: TocEntry): boolean => entry.level <= 3);

    if (visible.length === 0) {
        return "";
    }

    const items: string = visible
        .map((entry: TocEntry): string => {
            const numberHtml: string =
                entry.number.length > 0
                    ? `<span class="latex__toc-number">${escapeHtml(entry.number)}</span>`
                    : "";

            return `<li class="latex__toc-item latex__toc-item--${entry.level}"><a href="#${escapeAttribute(entry.id)}">${numberHtml}${escapeHtml(entry.title)}</a></li>`;
        })
        .join("");

    return `<nav class="latex__toc" aria-label="Contents"><h2 class="latex__toc-title">Contents</h2><ol class="latex__toc-list">${items}</ol></nav>`;
};

/**
 * Renders the footnote section.
 * @param state - Rendering state.
 * @example
 * renderNotes(state);
 * @returns The notes section, or an empty string.
 */
const renderNotes: (state: LatexState) => string = (state: LatexState): string => {
    if (state.footnotes.length === 0) {
        return "";
    }

    const items: string = state.footnotes
        .map(
            (note: string, index: number): string =>
                `<li class="latex__note" id="fn-${index + 1}">${note} <a class="latex__note-back" href="#fnref-${index + 1}" aria-label="Back to content">↩</a></li>`,
        )
        .join("");

    return `<section class="latex__notes" aria-label="Footnotes"><h2 class="latex__notes-title">Notes</h2><ol class="latex__notes-list">${items}</ol></section>`;
};

/**
 * Registers a label against the current target.
 * @param state - Rendering state.
 * @param key - Label key.
 * @example
 * registerLabel(state, "sec:intro");
 */
const registerLabel: (state: LatexState, key: string) => void = (
    state: LatexState,
    key: string,
): void => {
    const trimmed: string = key.trim();
    const target: LabelTarget | null = state.labelTarget ?? state.sectionTarget;

    if (trimmed.length === 0 || target === null || state.labels.has(trimmed)) {
        return;
    }

    state.labels.set(trimmed, target);
};

/**
 * Looks up a label in either pass.
 * @param state - Rendering state.
 * @param key - Label key.
 * @example
 * lookupLabel(state, "sec:intro");
 * @returns The label target, or void when unknown.
 */
const lookupLabel: (state: LatexState, key: string) => LabelTarget | void = (
    state: LatexState,
    key: string,
): LabelTarget | void =>
    state.knownLabels.get(key.trim()) ?? state.labels.get(key.trim());

/**
 * Returns a reference number for use inside maths.
 * @param state - Rendering state.
 * @param key - Label key.
 * @example
 * referenceNumber(state, "eq:1"); // "1"
 * @returns The number or "??".
 */
const referenceNumber: (state: LatexState, key: string) => string = (
    state: LatexState,
    key: string,
): string => {
    const target: LabelTarget | void = lookupLabel(state, key);

    return target === (void 0) || target.number.length === 0 ? "??" : target.number;
};

/**
 * Returns citation numbers for use inside maths.
 * @param state - Rendering state.
 * @param keys - Comma separated citation keys.
 * @example
 * citationNumbers(state, "a,b"); // "1, 2"
 * @returns The numbers or question marks.
 */
const citationNumbers: (state: LatexState, keys: string) => string = (
    state: LatexState,
    keys: string,
): string =>
    keys
        .split(",")
        .map((key: string): string => {
            const number: number | void = state.bibNumbers.get(key.trim());

            return number === (void 0) ? "?" : `${number}`;
        })
        .join(", ");

const referenceNames: ReadonlyMap<string, string> = new Map<string, string>([
    ["section", "Section"],
    ["figure", "Figure"],
    ["table", "Table"],
    ["equation", "Equation"],
    ["theorem", "Theorem"],
]);

/**
 * Renders a text reference.
 * @param state - Rendering state.
 * @param key - Label key.
 * @param mode - Reference style.
 * @example
 * renderReference(state, "fig:1", "ref");
 * @returns The reference link, or a missing marker.
 */
const renderReference: (state: LatexState, key: string, mode: string) => string = (
    state: LatexState,
    key: string,
    mode: string,
): string => {
    const target: LabelTarget | void = lookupLabel(state, key);

    if (target === (void 0) || target.number.length === 0) {
        return '<span class="latex__reference latex__reference--missing">??</span>';
    }

    let label: string = target.number;

    if (mode === "eqref") {
        label = `(${target.number})`;
    } else if (mode === "autoref") {
        label = `${referenceNames.get(target.kind) ?? "Section"} ${target.number}`;
    } else if (mode === "cref") {
        label = `${(referenceNames.get(target.kind) ?? "Section").toLowerCase()} ${target.number}`;
    } else if (mode === "Cref") {
        label = `${referenceNames.get(target.kind) ?? "Section"} ${target.number}`;
    }

    return `<a class="latex__reference" href="#${escapeAttribute(target.id)}">${escapeHtml(label)}</a>`;
};

/**
 * Renders a citation marker.
 * @param state - Rendering state.
 * @param keys - Comma separated keys.
 * @example
 * renderCitation(state, "knuth1984");
 * @returns The citation markup.
 */
const renderCitation: (state: LatexState, keys: string) => string = (
    state: LatexState,
    keys: string,
): string => {
    const parts: string[] = keys
        .split(",")
        .map((key: string): string => key.trim())
        .filter((key: string): boolean => key.length > 0)
        .map((key: string): string => {
            const number: number | void = state.bibNumbers.get(key);

            if (number === (void 0)) {
                return escapeHtml(key);
            }

            return `<a class="latex__citation-link" href="#bib-${escapeAttribute(sanitizeId(key))}">${number}</a>`;
        });

    return parts.length === 0 ? "" : `<span class="latex__citation">[${parts.join(", ")}]</span>`;
};

/**
 * Renders a footnote marker and records the note.
 * @param content - Footnote source.
 * @param state - Rendering state.
 * @example
 * renderFootnote("A note.", state);
 * @returns The marker markup.
 */
const renderFootnote: (content: string, state: LatexState) => string = (
    content: string,
    state: LatexState,
): string => {
    state.footnotes.push("");
    const number: number = state.footnotes.length;
    const html: string = renderInline(content, state);
    state.footnotes[number - 1] = html;

    return `<sup class="latex__note-ref" id="fnref-${number}"><a href="#fn-${number}" aria-label="Footnote ${number}">${number}</a></sup>`;
};

/**
 * Renders display maths from `\\[` or `$$`.
 * @param lines - Document lines.
 * @param index - Start line.
 * @param state - Rendering state.
 * @example
 * renderDisplayMath(lines, 0, state);
 * @returns The maths block and next line index.
 */
const renderDisplayMath: (lines: string[], index: number, state: LatexState) => { html: string; next: number } = (
    lines: string[],
    index: number,
    state: LatexState,
): { html: string; next: number } => {
    const first: string = lines[index].trim();
    const open: string = first.startsWith("\\[") ? "\\[" : "$$";
    const close: string = open === "\\[" ? "\\]" : "$$";
    let text: string = first;
    let next: number = index + 1;

    while (text.indexOf(close, open.length) === -1 && next < lines.length) {
        text += `\n${lines[next]}`;
        next += 1;
    }

    const openIndex: number = text.indexOf(open);
    const closeIndex: number = text.indexOf(close, openIndex + open.length);
    const value: string = text.slice(openIndex + open.length, closeIndex === -1 ? text.length : closeIndex);

    return { html: renderMathBlock(value, state, null, null), next };
};

/**
 * Renders a maths block with an optional number.
 * @param source - Maths source.
 * @param state - Rendering state.
 * @param number - Number HTML, or null when unnumbered.
 * @param id - Element id, or null.
 * @example
 * renderMathBlock("x", state, "(1)", "eq-1");
 * @returns The equation block.
 */
const renderMathBlock: (source: string, state: LatexState, number: string | null, id: string | null) => string = (
    source: string,
    state: LatexState,
    number: string | null,
    id: string | null,
): string => {
    const math: string = renderMath(source, state, true);
    const idAttribute: string = id === null ? "" : ` id="${escapeAttribute(id)}"`;
    const numberHtml: string = number === null ? "" : `<span class="latex__equation-number">${number}</span>`;

    return `<div class="latex__equation${number === null ? " latex__equation--unnumbered" : ""}"${idAttribute}><div class="latex__equation-body">${math}</div>${numberHtml}</div>`;
};

/**
 * Replaces every match of a capturing pattern with a computed value.
 * @param source - Source text.
 * @param pattern - Global pattern with the key in group 1.
 * @param replacement - Receives the first capture.
 * @example
 * substitutePattern("\\ref{a}", /\\ref\{([^}]*)\}/g, (key) => key); // "a"
 * @returns The substituted text.
 */
const substitutePattern: (
    source: string,
    pattern: RegExp,
    replacement: (key: string) => string,
) => string = (
    source: string,
    pattern: RegExp,
    replacement: (key: string) => string,
): string => {
    let result: string = "";
    let lastIndex: number = 0;
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null = pattern.exec(source);

    while (match !== null) {
        result += source.slice(lastIndex, match.index) + replacement(match[1] ?? "");
        lastIndex = match.index + match[0].length;
        match = pattern.exec(source);
    }

    return result + source.slice(lastIndex);
};

/**
 * Renders maths source with references substituted.
 * @param source - Maths source.
 * @param state - Rendering state.
 * @param display - Whether to use display maths.
 * @example
 * renderMath("\\ref{eq:1}", state, false);
 * @returns The MathML markup.
 */
const renderMath: (source: string, state: LatexState, display: boolean) => string = (
    source: string,
    state: LatexState,
    display: boolean,
): string => {
    let prepared: string = source
        .replace(/\\label\s*\{[^}]*\}/g, "")
        .replace(/\\tag\*?\s*\{[^}]*\}/g, "");

    prepared = substitutePattern(
        prepared,
        /\\eqref\s*\{([^}]*)\}/g,
        (key: string): string => `(${referenceNumber(state, key)})`,
    );
    prepared = substitutePattern(
        prepared,
        /\\(?:autoref|cref|Cref)\s*\{([^}]*)\}/g,
        (key: string): string => referenceNumber(state, key),
    );
    prepared = substitutePattern(
        prepared,
        /\\ref\s*\{([^}]*)\}/g,
        (key: string): string => referenceNumber(state, key),
    );
    prepared = substitutePattern(
        prepared,
        /\\(?:cite|citep|citet|citealp|citealt)\s*(?:\[[^\]]*\]\s*){0,2}\{([^}]*)\}/g,
        (key: string): string => `[${citationNumbers(state, key)}]`,
    );

    return renderTex(prepared, { display });
};

/**
 * Renders maths environments such as equation and align.
 * @param name - Environment name without a star.
 * @param starred - Whether the environment is starred.
 * @param content - Environment content.
 * @param state - Rendering state.
 * @example
 * renderMathEnvironment("equation", false, "x=1", state);
 * @returns The equation block.
 */
const renderMathEnvironment: (
    name: string,
    starred: boolean,
    content: string,
    state: LatexState,
) => string = (
    name: string,
    starred: boolean,
    content: string,
    state: LatexState,
): string => {
    const acceptsPlacement: boolean =
        name === "align" ||
        name === "alignat" ||
        name === "gather" ||
        name === "multline" ||
        name === "eqnarray";
    const optional: GroupResult | null = acceptsPlacement ? readOptionalGroup(content, 0) : null;
    const withoutOptional: string = optional === null ? content : content.slice(optional.next);
    const labels: { labels: string[]; rest: string } = extractLabels(withoutOptional);
    const tag: { value: string | null; starred: boolean; rest: string } = extractTag(labels.rest);
    let mathSource: string = tag.rest;

    if (name === "alignat" || name === "alignedat") {
        const spec: GroupResult | null = readGroup(mathSource, 0);
        mathSource = spec === null ? mathSource : mathSource.slice(spec.next);
    }

    state.counters.equation += 1;
    const counter: number = state.counters.equation;
    const tagText: string = tag.value === null ? "" : plainText(tag.value);
    const hasTag: boolean = tagText.length > 0;
    const suppress: boolean = /\\notag\b|\\nonumber\b/.test(mathSource);
    const numbered: boolean = !starred && name === "equation" && !suppress;
    const number: string = hasTag ? tagText : numbered ? `${counter}` : "";
    const target: LabelTarget = {
        kind: "equation",
        number: number.length > 0 ? number : `${counter}`,
        id: `eq-${counter}`,
    };

    state.labelTarget = target;

    for (const label of labels.labels) {
        registerLabel(state, label);
    }

    const tableEnvironment: boolean =
        name === "align" ||
        name === "alignat" ||
        name === "gather" ||
        name === "multline" ||
        name === "eqnarray";
    const mathInput: string = tableEnvironment
        ? `\\begin{${name}}${mathSource}\\end{${name}}`
        : mathSource;
    const math: string = renderMath(mathInput, state, true);
    state.labelTarget = state.sectionTarget;

    let numberHtml: string = "";

    if (hasTag) {
        const wrapped: boolean =
            tag.starred || (tagText.startsWith("(") && tagText.endsWith(")"));

        numberHtml = wrapped ? escapeHtml(tagText) : `(${escapeHtml(tagText)})`;
    } else if (numbered) {
        numberHtml = `(${escapeHtml(number)})`;
    }

    return `<div class="latex__equation${numberHtml.length > 0 ? "" : " latex__equation--unnumbered"}" id="eq-${counter}"><div class="latex__equation-body">${math}</div>${numberHtml.length > 0 ? `<span class="latex__equation-number">${numberHtml}</span>` : ""}</div>`;
};

/**
 * Renders one environment from the document.
 * @param lines - Document lines.
 * @param index - Start line.
 * @param state - Rendering state.
 * @example
 * renderEnvironment(lines, 0, state);
 * @returns The environment HTML and next line index.
 */
const renderEnvironment: (lines: string[], index: number, state: LatexState) => { html: string; next: number } = (
    lines: string[],
    index: number,
    state: LatexState,
): { html: string; next: number } => {
    const line: string = lines[index].trim();
    const match: RegExpExecArray | null = /^\\begin\s*\{([^}]+)\}/.exec(line);

    if (match === null) {
        return { html: "", next: index + 1 };
    }

    const rawName: string = match[1];
    const environment: EnvironmentResult = readEnvironment(lines, index, rawName);
    const html: string = renderEnvironmentContent(rawName, environment.content, state);

    return { html, next: environment.next };
};

/**
 * Reads an environment body and the index of the next line.
 * @param lines - Document lines.
 * @param start - Line containing `\begin`.
 * @param name - Environment name.
 * @example
 * readEnvironment(lines, 0, "itemize");
 * @returns The body and next line index.
 */
const readEnvironment: (lines: string[], start: number, name: string) => EnvironmentResult = (
    lines: string[],
    start: number,
    name: string,
): EnvironmentResult => {
    const source: string = lines.slice(start).join("\n");
    const escaped: string = escapeRegExp(name);
    const beginPattern: RegExp = new RegExp(`\\\\begin\\s*\\{${escaped}\\}`, "g");
    const endPattern: RegExp = new RegExp(`\\\\end\\s*\\{${escaped}\\}`, "g");
    const begin: RegExpExecArray | null = beginPattern.exec(source);

    if (begin === null) {
        return { content: "", next: start + 1 };
    }

    const contentStart: number = begin.index + begin[0].length;
    let depth: number = 1;
    let cursor: number = contentStart;
    let contentEnd: number = source.length;
    let consumedEnd: number = source.length;

    while (cursor < source.length) {
        endPattern.lastIndex = cursor;
        const end: RegExpExecArray | null = endPattern.exec(source);

        if (end === null) {
            break;
        }

        beginPattern.lastIndex = cursor;
        const nested: RegExpExecArray | null = beginPattern.exec(source);

        if (nested !== null && nested.index < end.index) {
            depth += 1;
            cursor = nested.index + nested[0].length;
            continue;
        }

        depth -= 1;
        cursor = end.index + end[0].length;

        if (depth === 0) {
            contentEnd = end.index;
            consumedEnd = cursor;
            break;
        }
    }

    const consumed: string = source.slice(0, consumedEnd);
    const newlines: number = (consumed.match(/\n/g) ?? []).length;
    const next: number = consumedEnd >= source.length ? lines.length : start + newlines + 1;

    return { content: source.slice(contentStart, contentEnd), next };
};

/**
 * Dispatches an environment to its renderer.
 * @param rawName - Environment name, possibly starred.
 * @param content - Environment content.
 * @param state - Rendering state.
 * @example
 * renderEnvironmentContent("itemize", content, state);
 * @returns The environment HTML.
 */
const renderEnvironmentContent: (rawName: string, content: string, state: LatexState) => string = (
    rawName: string,
    content: string,
    state: LatexState,
): string => {
    const name: string = rawName.replace(/\*+$/, "");
    const starred: boolean = name !== rawName;

    if (name === "document") {
        return renderBlocks(content, state);
    }

    if (name === "comment" || name === "theindex" || name === "filecontents") {
        return "";
    }

    if (name === "verbatim" || name === "Verbatim" || name === "alltt") {
        const optional: GroupResult | null = readOptionalGroup(content, 0);
        return renderCode(optional === null ? content : content.slice(optional.next), "");
    }

    if (name === "lstlisting") {
        const optional: GroupResult | null = readOptionalGroup(content, 0);
        const options: string = optional === null ? "" : optional.value;
        const languageMatch: RegExpExecArray | null = /language\s*=\s*([A-Za-z0-9+#.-]+)/.exec(options);

        return renderCode(
            optional === null ? content : content.slice(optional.next),
            languageMatch === null ? "" : languageMatch[1],
        );
    }

    if (name === "minted") {
        const optional: GroupResult | null = readOptionalGroup(content, 0);
        const afterOptional: string = optional === null ? content : content.slice(optional.next);
        const language: GroupResult | null = readGroup(afterOptional, 0);

        return renderCode(
            language === null ? afterOptional : afterOptional.slice(language.next),
            language === null ? "" : language.value.trim(),
        );
    }

    if (name === "figure" || name === "table") {
        const optional: GroupResult | null = readOptionalGroup(content, 0);

        return renderFloat(name, optional === null ? content : content.slice(optional.next), state);
    }

    if (name === "tabular" || name === "longtable") {
        const spec: GroupResult | null = readGroup(content, 0);

        return spec === null ? "" : renderTabular(content.slice(spec.next), spec.value, state);
    }

    if (name === "tabularx" || name === "tabulary") {
        const width: GroupResult | null = readGroup(content, 0);
        const spec: GroupResult | null = width === null ? null : readGroup(content, width.next);

        return spec === null ? "" : renderTabular(content.slice(spec.next), spec.value, state);
    }

    if (name === "itemize" || name === "enumerate" || name === "description") {
        const optional: GroupResult | null = readOptionalGroup(content, 0);

        return renderList(name, optional === null ? content : content.slice(optional.next), state);
    }

    if (name === "quote" || name === "quotation" || name === "verse") {
        return `<blockquote class="latex__quote">${renderBlocks(content, state)}</blockquote>`;
    }

    if (name === "abstract") {
        return `<section class="latex__abstract"><h2 class="latex__abstract-title">Abstract</h2>${renderBlocks(content, state)}</section>`;
    }

    if (name === "center" || name === "flushleft" || name === "flushright") {
        return `<div class="latex__${name}">${renderBlocks(content, state)}</div>`;
    }

    if (name === "thebibliography") {
        return renderBibliography(content, state);
    }

    if (name === "minipage") {
        const optional: GroupResult | null = readOptionalGroup(content, 0);
        const afterOptional: string = optional === null ? content : content.slice(optional.next);
        const width: GroupResult | null = readGroup(afterOptional, 0);

        return renderBlocks(width === null ? afterOptional : afterOptional.slice(width.next), state);
    }

    if (name === "wrapfigure" || name === "wraptable") {
        const lineHeight: GroupResult | null = readOptionalGroup(content, 0);
        let rest: string = lineHeight === null ? content : content.slice(lineHeight.next);
        const placement: GroupResult | null = readGroup(rest, 0);

        if (placement !== null) {
            rest = rest.slice(placement.next);
        }

        const overhang: GroupResult | null = readOptionalGroup(rest, 0);

        if (overhang !== null) {
            rest = rest.slice(overhang.next);
        }

        const width: GroupResult | null = readGroup(rest, 0);

        return renderBlocks(width === null ? rest : rest.slice(width.next), state);
    }

    if (name === "multicols") {
        const columns: GroupResult | null = readGroup(content, 0);

        return renderBlocks(columns === null ? content : content.slice(columns.next), state);
    }

    if (mathEnvironments.has(name)) {
        return renderMathEnvironment(name, starred, content, state);
    }

    if (theoremEnvironments.has(name)) {
        return renderTheorem(name, starred, content, state);
    }

    if (/^\s*\\item\b/m.test(content)) {
        return renderList("itemize", content, state);
    }

    return renderBlocks(content, state);
};

/**
 * Renders a code block.
 * @param content - Raw code.
 * @param language - Optional language token.
 * @example
 * renderCode("x = 1", "python");
 * @returns The preformatted block.
 */
const renderCode: (content: string, language: string) => string = (
    content: string,
    language: string,
): string => {
    const code: string = content.replace(/^\n/, "").replace(/\s+$/, "");
    const className: string =
        language.length > 0 ? ` class="language-${escapeAttribute(language)}"` : "";

    return `<pre class="latex__verbatim"><code${className}>${escapeHtml(code)}</code></pre>`;
};

/**
 * Renders a figure or table float.
 * @param kind - Float kind.
 * @param content - Float content.
 * @param state - Rendering state.
 * @example
 * renderFloat("figure", content, state);
 * @returns The figure markup.
 */
const renderFloat: (kind: "figure" | "table", content: string, state: LatexState) => string = (
    kind: "figure" | "table",
    content: string,
    state: LatexState,
): string => {
    const labels: { labels: string[]; rest: string } = extractLabels(content);
    const caption: { value: string | null; rest: string } = extractCommand(labels.rest, "caption");
    state.counters[kind] += 1;
    const number: string = `${state.counters[kind]}`;
    const id: string = `${kind === "figure" ? "fig" : "tab"}-${number}`;
    const target: LabelTarget = { kind, number, id };

    state.labelTarget = target;

    for (const label of labels.labels) {
        registerLabel(state, label);
    }

    const captionHtml: string =
        caption.value === null
            ? ""
            : `<figcaption class="latex__caption"><span class="latex__float-number">${kind === "figure" ? "Figure" : "Table"} ${escapeHtml(number)}.</span> ${renderInline(caption.value, state)}</figcaption>`;
    const bodyHtml: string = renderBlocks(caption.rest, state);

    state.labelTarget = state.sectionTarget;

    if (bodyHtml.length === 0 && captionHtml.length === 0) {
        return "";
    }

    return `<figure class="latex__float latex__float--${kind}" id="${escapeAttribute(id)}"><div class="latex__float-body">${bodyHtml}</div>${captionHtml}</figure>`;
};

/**
 * Renders a list environment.
 * @param name - itemize, enumerate, or description.
 * @param content - List content.
 * @param state - Rendering state.
 * @example
 * renderList("itemize", content, state);
 * @returns The list markup.
 */
const renderList: (name: string, content: string, state: LatexState) => string = (
    name: string,
    content: string,
    state: LatexState,
): string => {
    const items: string[] = splitItems(content);
    const rendered: string[] = [];

    for (const rawItem of items) {
        const item: string = rawItem.trim();

        if (item.length === 0) {
            continue;
        }

        const optional: GroupResult | null = readOptionalGroup(item, 0);
        const label: string = optional === null ? "" : optional.value.trim();
        const itemContent: string = optional === null ? item : item.slice(optional.next);
        const blocks: string = renderBlocks(itemContent, state);

        if (blocks.length === 0 && label.length === 0) {
            continue;
        }

        if (name === "description") {
            if (label.length > 0) {
                rendered.push(
                    `<dt class="latex__description-term">${renderInline(label, state)}</dt>`,
                );
            }

            rendered.push(`<dd class="latex__description-detail">${blocks}</dd>`);
            continue;
        }

        const labelHtml: string =
            label.length > 0
                ? `<span class="latex__item-label">${renderInline(label, state)}</span>`
                : "";
        const labelClass: string = label.length > 0 ? " latex__list-item--labeled" : "";

        rendered.push(`<li class="latex__list-item${labelClass}">${labelHtml}${blocks}</li>`);
    }

    if (rendered.length === 0) {
        return "";
    }

    if (name === "description") {
        return `<dl class="latex__description">${rendered.join("")}</dl>`;
    }

    const tag: string = name === "enumerate" ? "ol" : "ul";

    return `<${tag} class="latex__list">${rendered.join("")}</${tag}>`;
};

/**
 * Splits a list environment body at top-level `\item` commands.
 * @param content - List body.
 * @example
 * splitItems("\\item one \\item two");
 * @returns The item sources.
 */
const splitItems: (content: string) => string[] = (content: string): string[] => {
    const items: string[] = [];
    let index: number = 0;
    let start: number = 0;
    let depth: number = 0;
    let braces: number = 0;
    let math: boolean = false;

    while (index < content.length) {
        if (content.startsWith("\\begin", index)) {
            const begin: RegExpExecArray | null = /^\\begin\s*\{([^}]+)\}/.exec(
                content.slice(index),
            );

            if (begin !== null) {
                depth += 1;
                index += begin[0].length;
                continue;
            }
        }

        if (content.startsWith("\\end", index)) {
            const end: RegExpExecArray | null = /^\\end\s*\{([^}]+)\}/.exec(content.slice(index));

            if (end !== null) {
                depth = Math.max(0, depth - 1);
                index += end[0].length;
                continue;
            }
        }

        if (content.startsWith("\\item", index) && depth === 0 && braces === 0 && !math) {
            const after: string = content.charAt(index + 5);

            if (!/[A-Za-z]/.test(after)) {
                items.push(content.slice(start, index));
                index += 5;
                start = index;
                continue;
            }
        }

        const char: string = content.charAt(index);

        if (char === "\\") {
            index += 2;
            continue;
        }

        if (char === "%") {
            const newline: number = content.indexOf("\n", index);
            index = newline === -1 ? content.length : newline + 1;
            continue;
        }

        if (content.startsWith("$$", index)) {
            math = !math;
            index += 2;
            continue;
        }

        if (char === "$") {
            math = !math;
            index += 1;
            continue;
        }

        if (!math) {
            if (char === "{") {
                braces += 1;
            } else if (char === "}") {
                braces = Math.max(0, braces - 1);
            }
        }

        index += 1;
    }

    items.push(content.slice(start));

    return items;
};

/**
 * Renders a tabular environment.
 * @param content - Table body without the column spec.
 * @param spec - Column specification.
 * @param state - Rendering state.
 * @example
 * renderTabular("a & b \\\\ c & d", "cc", state);
 * @returns The table markup.
 */
const renderTabular: (content: string, spec: string, state: LatexState) => string = (
    content: string,
    spec: string,
    state: LatexState,
): string => {
    const alignments: string[] = parseColumnSpec(spec);
    const cleaned: string = content
        .replace(/\\(?:hline|toprule|midrule|bottomrule|addlinespace)\b\s*(?:\[[^\]]*\])?/g, "")
        .replace(/\\cmidrule\s*(?:\([^)]*\))?\s*(?:\[[^\]]*\])?\s*\{[^}]*\}/g, "")
        .replace(/\\cline\s*\{[^}]*\}/g, "")
        .replace(/\\(?:rowcolor|cellcolor|arrayrulecolor)\s*(?:\[[^\]]*\])?\s*\{[^}]*\}/g, "")
        .replace(/\\specialrule\s*\{[^}]*\}\s*\{[^}]*\}\s*\{[^}]*\}/g, "");
    const rows: string[] = splitTopLevel(cleaned, "\\\\")
        .map((row: string): string => row.replace(/^\s*\[[^\]]*\]/, "").trim())
        .filter((row: string): boolean => row.length > 0);

    if (rows.length === 0) {
        return "";
    }

    const body: string = rows
        .map((row: string): string => {
            const cells: string[] = splitTopLevel(row, "&");
            const rendered: string = cells
                .map((cell: string, column: number): string =>
                    renderTableCell(cell.trim(), alignments[column] ?? "left", state),
                )
                .join("");

            return `<tr>${rendered}</tr>`;
        })
        .join("");

    return `<div class="latex__table-wrap"><table class="latex__tabular"><tbody>${body}</tbody></table></div>`;
};

/**
 * Renders one table cell, including multicolumn and multirow spans.
 * @param cell - Cell source.
 * @param alignment - Fallback alignment.
 * @param state - Rendering state.
 * @example
 * renderTableCell("a", "left", state);
 * @returns The cell markup.
 */
const renderTableCell: (cell: string, alignment: string, state: LatexState) => string = (
    cell: string,
    alignment: string,
    state: LatexState,
): string => {
    const multicolumn: RegExpExecArray | null = /^\\multicolumn\s*\{(\d+)\}\s*/.exec(cell);

    if (multicolumn !== null) {
        const spec: GroupResult | null = readGroup(cell, multicolumn[0].length);
        const text: GroupResult | null = spec === null ? null : readGroup(cell, spec.next);
        const colspan: number = Number.parseInt(multicolumn[1], 10);
        const cellAlignment: string =
            spec === null ? alignment : alignmentFromSpec(spec.value, alignment);

        return `<td class="latex__cell latex__cell--${cellAlignment}" colspan="${colspan}">${renderInline(text === null ? "" : text.value, state)}</td>`;
    }

    const multirow: RegExpExecArray | null = /^\\multirow\s*\{(\d+)\}\s*/.exec(cell);

    if (multirow !== null) {
        let cursor: number = multirow[0].length;
        const optional: GroupResult | null = readOptionalGroup(cell, cursor);

        if (optional !== null) {
            cursor = optional.next;
        }

        const width: GroupResult | null = readGroup(cell, cursor);

        if (width !== null) {
            cursor = width.next;
        }

        const text: GroupResult | null = readGroup(cell, cursor);
        const rowspan: number = Number.parseInt(multirow[1], 10);

        return `<td class="latex__cell latex__cell--${alignment}" rowspan="${rowspan}">${renderInline(text === null ? "" : text.value, state)}</td>`;
    }

    return `<td class="latex__cell latex__cell--${alignment}">${renderInline(cell, state)}</td>`;
};

/**
 * Derives an alignment from a column specification.
 * @param spec - Column spec such as `c` or `p{3cm}`.
 * @param fallback - Alignment when the spec is empty.
 * @example
 * alignmentFromSpec("c", "left"); // "center"
 * @returns left, center, or right.
 */
const alignmentFromSpec: (spec: string, fallback: string) => string = (
    spec: string,
    fallback: string,
): string => {
    const value: string = spec
        .replace(/[|@!<>]\{[^}]*\}/g, "")
        .replace(/\|/g, "")
        .trim();
    const first: string = value.charAt(0);

    if (first === "c") {
        return "center";
    }

    if (first === "r") {
        return "right";
    }

    if (first === "l" || first === "p" || first === "m" || first === "b") {
        return "left";
    }

    return fallback;
};

/**
 * Parses a tabular column specification.
 * @param spec - Column spec.
 * @example
 * parseColumnSpec("|l|c|r|"); // ["left", "center", "right"]
 * @returns One alignment per column.
 */
const parseColumnSpec: (spec: string) => string[] = (spec: string): string[] => {
    const alignments: string[] = [];
    let index: number = 0;

    while (index < spec.length) {
        const char: string = spec.charAt(index);

        if (char === "l" || char === "c" || char === "r") {
            alignments.push(char === "c" ? "center" : char === "r" ? "right" : "left");
            index += 1;
            continue;
        }

        if (char === "p" || char === "m" || char === "b") {
            alignments.push("left");
            index += 1;
            const group: GroupResult | null = readGroup(spec, index);

            if (group !== null) {
                index = group.next;
            }

            continue;
        }

        if (char === "@" || char === "!" || char === ">" || char === "<") {
            index += 1;
            const group: GroupResult | null = readGroup(spec, index);

            if (group !== null) {
                index = group.next;
            }

            continue;
        }

        if (char === "*") {
            index += 1;
            const count: GroupResult | null = readGroup(spec, index);
            const repeated: GroupResult | null = count === null ? null : readGroup(spec, count.next);

            if (count !== null && repeated !== null) {
                const times: number = Number.parseInt(count.value, 10);
                const inner: string[] = parseColumnSpec(repeated.value);

                for (let step: number = 0; step < times; step += 1) {
                    alignments.push(...inner);
                }

                index = repeated.next;
                continue;
            }

            index += 1;
            continue;
        }

        index += 1;
    }

    return alignments;
};

/**
 * Splits a table fragment at top-level separators.
 * @param source - Fragment source.
 * @param separator - `&` for cells or `\\\\` for rows.
 * @example
 * splitTopLevel("a & b", "&");
 * @returns The split fragments.
 */
const splitTopLevel: (source: string, separator: string) => string[] = (
    source: string,
    separator: string,
): string[] => {
    const parts: string[] = [];
    let depth: number = 0;
    let math: boolean = false;
    let start: number = 0;
    let index: number = 0;

    while (index < source.length) {
        const char: string = source.charAt(index);

        if (char === "\\") {
            if (math === false && depth === 0 && source.startsWith(separator, index)) {
                parts.push(source.slice(start, index));
                index += separator.length;
                start = index;
                continue;
            }

            index += 2;
            continue;
        }

        if (char === "%") {
            const newline: number = source.indexOf("\n", index);
            index = newline === -1 ? source.length : newline + 1;
            continue;
        }

        if (source.startsWith("$$", index)) {
            math = !math;
            index += 2;
            continue;
        }

        if (char === "$") {
            math = !math;
            index += 1;
            continue;
        }

        if (math === false) {
            if (char === "{") {
                depth += 1;
            } else if (char === "}") {
                depth = Math.max(0, depth - 1);
            } else if (char === separator && depth === 0) {
                parts.push(source.slice(start, index));
                index += 1;
                start = index;
                continue;
            }
        }

        index += 1;
    }

    parts.push(source.slice(start));

    return parts;
};

/**
 * Renders a theorem-like environment.
 * @param name - Environment name.
 * @param starred - Whether the environment is unnumbered.
 * @param content - Environment content.
 * @param state - Rendering state.
 * @example
 * renderTheorem("theorem", false, content, state);
 * @returns The theorem markup.
 */
const renderTheorem: (name: string, starred: boolean, content: string, state: LatexState) => string = (
    name: string,
    starred: boolean,
    content: string,
    state: LatexState,
): string => {
    const optional: GroupResult | null = readOptionalGroup(content, 0);
    const note: string = optional === null ? "" : optional.value.trim();
    const body: string = optional === null ? content : content.slice(optional.next);

    if (name === "proof") {
        const title: string = note.length > 0 ? `Proof (${renderInline(note, state)}).` : "Proof.";

        return `<div class="latex__theorem latex__theorem--proof"><p class="latex__theorem-title">${title}</p><div class="latex__theorem-body">${renderBlocks(body, state)}</div><span class="latex__qed" aria-hidden="true">∎</span></div>`;
    }

    const display: string = theoremNames.get(name) ?? "Theorem";
    const number: string = starred ? "" : nextTheoremNumber(state);
    let id: string = `thm-${number}`;

    if (number.length === 0) {
        state.unnumberedCount += 1;
        id = `thm-s-${state.unnumberedCount}`;
    }

    const target: LabelTarget = { kind: "theorem", number, id };

    state.labelTarget = target;
    const blocks: string = renderBlocks(body, state);
    const noteHtml: string =
        note.length > 0 ? ` <span class="latex__theorem-note">(${renderInline(note, state)})</span>` : "";
    state.labelTarget = state.sectionTarget;

    const numberHtml: string = number.length > 0 ? ` ${escapeHtml(number)}` : "";

    return `<div class="latex__theorem latex__theorem--${name}" id="${escapeAttribute(id)}"><p class="latex__theorem-title"><span class="latex__theorem-name">${escapeHtml(display)}${numberHtml}</span>${noteHtml}.</p><div class="latex__theorem-body">${blocks}</div></div>`;
};

/**
 * Increments and returns the shared theorem counter.
 * @param state - Rendering state.
 * @example
 * nextTheoremNumber(state); // "1"
 * @returns The number.
 */
const nextTheoremNumber: (state: LatexState) => string = (state: LatexState): string => {
    state.counters.theorem += 1;

    return `${state.counters.theorem}`;
};

/**
 * Renders a bibliography environment.
 * @param content - Bibliography content.
 * @param state - Rendering state.
 * @example
 * renderBibliography(content, state);
 * @returns The references section.
 */
const renderBibliography: (content: string, state: LatexState) => string = (
    content: string,
    state: LatexState,
): string => {
    const widest: GroupResult | null = readGroup(content, 0);
    const body: string = widest === null ? content : content.slice(widest.next);
    const pattern: RegExp = /\\bibitem\s*(?:\[[^\]]*\])?\s*\{([^}]+)\}/g;
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null = pattern.exec(body);

    while (match !== null) {
        matches.push(match);
        match = pattern.exec(body);
    }

    if (matches.length === 0) {
        return `<section class="latex__bibliography"><h2 class="latex__bibliography-title">References</h2>${renderBlocks(body, state)}</section>`;
    }

    const items: string[] = matches.map((entry: RegExpExecArray, index: number): string => {
        const key: string = entry[1].trim();
        const start: number = entry.index + entry[0].length;
        const end: number = index + 1 < matches.length ? matches[index + 1].index : body.length;
        const text: string = body.slice(start, end).trim();
        const number: number | void = state.bibNumbers.get(key);
        const label: number = number === (void 0) ? index + 1 : number;

        return `<li class="latex__bib-item" id="bib-${escapeAttribute(sanitizeId(key))}"><span class="latex__bib-number">[${label}]</span> ${renderInline(text, state)}</li>`;
    });

    return `<section class="latex__bibliography"><h2 class="latex__bibliography-title">References</h2><ol class="latex__bibliography-list">${items.join("")}</ol></section>`;
};

/**
 * Renders inline LaTeX content.
 * @param source - Inline source.
 * @param state - Rendering state.
 * @example
 * renderInline("Hello \\textbf{world}", state);
 * @returns The inline HTML.
 */
const renderInline: (source: string, state: LatexState) => string = (
    source: string,
    state: LatexState,
): string => {
    const output: string[] = [];
    let index: number = 0;

    while (index < source.length) {
        const rest: string = source.slice(index);

        if (rest.startsWith("\\[")) {
            const math: { value: string; display: boolean; next: number } | null = readDelimitedMath(
                source,
                index,
                "\\[",
                "\\]",
            );

            if (math !== null) {
                output.push(renderInlineMath(math.value, true, state));
                index = math.next;
                continue;
            }
        }

        if (rest.startsWith("\\(")) {
            const math: { value: string; display: boolean; next: number } | null = readDelimitedMath(
                source,
                index,
                "\\(",
                "\\)",
            );

            if (math !== null) {
                output.push(renderInlineMath(math.value, false, state));
                index = math.next;
                continue;
            }
        }

        if (rest.startsWith("$")) {
            const math: { value: string; display: boolean; next: number } | null = readDollarMath(
                source,
                index,
            );

            if (math !== null) {
                output.push(renderInlineMath(math.value, math.display, state));
                index = math.next;
                continue;
            }

            output.push("$");
            index += 1;
            continue;
        }

        if (rest.startsWith("\\\\")) {
            index += 2;
            const optional: GroupResult | null = readOptionalGroup(source, index);

            if (optional !== null) {
                index = optional.next;
            }

            output.push("<br />");
            continue;
        }

        if (rest.startsWith("\\")) {
            const command: CommandResult = readCommandName(source, index);
            const result: InlineResult = renderInlineCommand(
                command.name,
                source,
                command.next,
                state,
            );
            output.push(result.html);
            index = result.next;
            continue;
        }

        if (rest.startsWith("~")) {
            output.push("\u00A0");
            index += 1;
            continue;
        }

        if (rest.startsWith("%")) {
            const newline: number = source.indexOf("\n", index);
            index = newline === -1 ? source.length : newline + 1;
            continue;
        }

        if (rest.startsWith("{")) {
            const group: GroupResult | null = readGroup(source, index);

            if (group !== null) {
                output.push(renderInline(group.value, state));
                index = group.next;
                continue;
            }

            output.push("{");
            index += 1;
            continue;
        }

        if (rest.startsWith("}")) {
            output.push("}");
            index += 1;
            continue;
        }

        if (rest.startsWith("---")) {
            output.push("—");
            index += 3;
            continue;
        }

        if (rest.startsWith("--")) {
            output.push("–");
            index += 2;
            continue;
        }

        if (rest.startsWith("``")) {
            output.push("“");
            index += 2;
            continue;
        }

        if (rest.startsWith("''")) {
            output.push("”");
            index += 2;
            continue;
        }

        if (rest.startsWith("`")) {
            output.push("‘");
            index += 1;
            continue;
        }

        if (rest.startsWith("'")) {
            output.push("’");
            index += 1;
            continue;
        }

        if (rest.startsWith("-")) {
            output.push("-");
            index += 1;
            continue;
        }

        const special: number = rest.search(/[\\$%{}~`'-]/);
        const end: number = special === -1 ? rest.length : special;

        if (end > 0) {
            output.push(renderText(rest.slice(0, end)));
            index += end;
            continue;
        }

        output.push(escapeHtml(rest.charAt(0)));
        index += 1;
    }

    return output.join("");
};

/**
 * Renders inline maths with a wrapper for layout.
 * @param source - Maths source.
 * @param display - Whether to use display maths.
 * @param state - Rendering state.
 * @example
 * renderInlineMath("x^2", false, state);
 * @returns The wrapped MathML.
 */
const renderInlineMath: (source: string, display: boolean, state: LatexState) => string = (
    source: string,
    display: boolean,
    state: LatexState,
): string => {
    const math: string = renderMath(source, state, display);

    return display
        ? `<span class="latex__display-math">${math}</span>`
        : `<span class="latex__math">${math}</span>`;
};

/**
 * Escapes a text run and collapses whitespace.
 * @param value - Plain run.
 * @example
 * renderText("a  b"); // "a b"
 * @returns The escaped HTML.
 */
const renderText: (value: string) => string = (value: string): string =>
    escapeHtml(value.replace(/[ \t\n\r]+/g, " "));

/**
 * Renders one inline command.
 * @param name - Command name.
 * @param source - Inline source.
 * @param index - Index after the command name.
 * @param state - Rendering state.
 * @example
 * renderInlineCommand("textbf", source, index, state);
 * @returns The command HTML and next index.
 */
const renderInlineCommand: (
    name: string,
    source: string,
    index: number,
    state: LatexState,
) => InlineResult = (
    name: string,
    source: string,
    index: number,
    state: LatexState,
): InlineResult => {
    let cursor: number = index;

    const takeArg: () => GroupResult | null = (): GroupResult | null => {
        const group: GroupResult | null = readGroup(source, cursor);

        if (group !== null) {
            cursor = group.next;
        }

        return group;
    };

    const takeOptional: () => GroupResult | null = (): GroupResult | null => {
        const group: GroupResult | null = readOptionalGroup(source, cursor);

        if (group !== null) {
            cursor = group.next;
        }

        return group;
    };

    const accent: AccentMark | void = accentMarks.get(name);

    if (accent !== (void 0)) {
        const base: { value: string; next: number } = readAccentBase(source, cursor);

        return { html: applyAccent(base.value, accent), next: base.next };
    }

    if (name === "verb") {
        return renderVerb(source, cursor);
    }

    if (name === "begin" || name === "end") {
        takeArg();

        return { html: "", next: cursor };
    }

    if (name === "item") {
        takeOptional();

        return { html: "", next: cursor };
    }

    if (name === "caption") {
        const caption: GroupResult | null = takeArg();

        return {
            html:
                caption === null
                    ? ""
                    : `<span class="latex__caption">${renderInline(caption.value, state)}</span>`,
            next: cursor,
        };
    }

    if (sectionCommands.includes(name)) {
        takeOptional();
        const heading: GroupResult | null = takeArg();

        return {
            html:
                heading === null
                    ? ""
                    : `<strong>${renderInline(heading.value, state)}</strong>`,
            next: cursor,
        };
    }

    if (name === "maketitle" || name === "tableofcontents" || name === "appendix") {
        return { html: "", next: cursor };
    }

    if (name === "par") {
        return { html: "<br />", next: cursor };
    }

    if (name === "newline" || name === "linebreak") {
        takeOptional();

        return { html: "<br />", next: cursor };
    }

    if (name === "hspace") {
        if (source.charAt(cursor) === "*") {
            cursor += 1;
        }

        takeArg();

        return { html: "\u2002", next: cursor };
    }

    if (name === "today") {
        return { html: escapeHtml(formatToday()), next: cursor };
    }

    if (name === "href") {
        takeOptional();
        const url: GroupResult | null = takeArg();
        const text: GroupResult | null = takeArg();

        if (url === null || text === null) {
            return { html: "", next: cursor };
        }

        const value: string = url.value.trim();
        const content: string = renderInline(text.value, state);

        return safeDocumentUrl(value, true)
            ? { html: `<a class="latex__link" href="${escapeAttribute(value)}">${content}</a>`, next: cursor }
            : { html: content, next: cursor };
    }

    if (name === "url") {
        const url: GroupResult | null = takeArg();

        if (url === null) {
            return { html: "", next: cursor };
        }

        const value: string = url.value.trim();
        const content: string = escapeHtml(value);

        return safeDocumentUrl(value, true)
            ? { html: `<a class="latex__url" href="${escapeAttribute(value)}">${content}</a>`, next: cursor }
            : { html: content, next: cursor };
    }

    if (name === "nolinkurl") {
        const url: GroupResult | null = takeArg();

        return {
            html: url === null ? "" : `<code>${escapeHtml(url.value.trim())}</code>`,
            next: cursor,
        };
    }

    if (name === "includegraphics") {
        return renderImage(source, cursor);
    }

    if (name === "footnote" || name === "thanks") {
        const note: GroupResult | null = takeArg();

        return {
            html: note === null ? "" : renderFootnote(note.value, state),
            next: cursor,
        };
    }

    if (name === "cite" || name === "citep" || name === "citet" || name === "citealp" || name === "citealt") {
        takeOptional();
        takeOptional();
        const keys: GroupResult | null = takeArg();

        return {
            html: keys === null ? "" : renderCitation(state, keys.value),
            next: cursor,
        };
    }

    if (
        name === "ref" ||
        name === "eqref" ||
        name === "autoref" ||
        name === "cref" ||
        name === "Cref" ||
        name === "pageref"
    ) {
        const key: GroupResult | null = takeArg();

        return {
            html: key === null ? "" : renderReference(state, key.value, name === "pageref" ? "ref" : name),
            next: cursor,
        };
    }

    if (name === "label") {
        const key: GroupResult | null = takeArg();

        if (key !== null) {
            registerLabel(state, key.value);
        }

        return { html: "", next: cursor };
    }

    if (name === "textcolor") {
        takeArg();
        const text: GroupResult | null = takeArg();

        return {
            html: text === null ? "" : renderInline(text.value, state),
            next: cursor,
        };
    }

    if (name === "colorbox") {
        takeArg();
        const text: GroupResult | null = takeArg();

        return {
            html:
                text === null
                    ? ""
                    : `<span class="latex__colorbox">${renderInline(text.value, state)}</span>`,
            next: cursor,
        };
    }

    if (name === "fcolorbox") {
        takeArg();
        takeArg();
        const text: GroupResult | null = takeArg();

        return {
            html:
                text === null
                    ? ""
                    : `<span class="latex__colorbox">${renderInline(text.value, state)}</span>`,
            next: cursor,
        };
    }

    if (name === "raisebox") {
        takeArg();
        takeOptional();
        takeOptional();
        const text: GroupResult | null = takeArg();

        return { html: text === null ? "" : renderInline(text.value, state), next: cursor };
    }

    if (name === "makebox" || name === "framebox") {
        takeOptional();
        takeOptional();
        const text: GroupResult | null = takeArg();

        return { html: text === null ? "" : renderInline(text.value, state), next: cursor };
    }

    if (name === "parbox") {
        takeOptional();
        takeOptional();
        takeOptional();
        takeArg();
        const text: GroupResult | null = takeArg();

        return { html: text === null ? "" : renderInline(text.value, state), next: cursor };
    }

    if (name === "scalebox") {
        takeArg();
        const text: GroupResult | null = takeArg();

        return { html: text === null ? "" : renderInline(text.value, state), next: cursor };
    }

    if (name === "resizebox") {
        takeArg();
        takeArg();
        const text: GroupResult | null = takeArg();

        return { html: text === null ? "" : renderInline(text.value, state), next: cursor };
    }

    if (name === "fbox") {
        const text: GroupResult | null = takeArg();

        return {
            html:
                text === null
                    ? ""
                    : `<span class="latex__box">${renderInline(text.value, state)}</span>`,
            next: cursor,
        };
    }

    if (name === "ensuremath") {
        const math: GroupResult | null = takeArg();

        return {
            html:
                math === null
                    ? ""
                    : renderInlineMath(math.value, false, state),
            next: cursor,
        };
    }

    if (name === "texorpdfstring") {
        const tex: GroupResult | null = takeArg();
        takeArg();

        return { html: tex === null ? "" : renderInline(tex.value, state), next: cursor };
    }

    if (name === "enquote") {
        const text: GroupResult | null = takeArg();

        return {
            html: text === null ? "" : `“${renderInline(text.value, state)}”`,
            next: cursor,
        };
    }

    if (name === "ac" || name === "acs" || name === "acl" || name === "acrshort" || name === "acrlong" || name === "acrfull") {
        const text: GroupResult | null = takeArg();

        return { html: text === null ? "" : renderInline(text.value, state), next: cursor };
    }

    if (name === "gls" || name === "Gls" || name === "glspl" || name === "Glspl") {
        const text: GroupResult | null = takeArg();

        return { html: text === null ? "" : renderInline(text.value, state), next: cursor };
    }

    if (name === "num" || name === "si" || name === "unit") {
        const text: GroupResult | null = takeArg();

        return { html: text === null ? "" : renderInline(text.value, state), next: cursor };
    }

    if (name === "SI" || name === "qty") {
        const value: GroupResult | null = takeArg();
        const unit: GroupResult | null = takeArg();

        return {
            html:
                value === null
                    ? ""
                    : `${renderInline(value.value, state)}${unit === null ? "" : `&nbsp;${renderInline(unit.value, state)}`}`,
            next: cursor,
        };
    }

    if (name === "SIrange") {
        const from: GroupResult | null = takeArg();
        const to: GroupResult | null = takeArg();
        const unit: GroupResult | null = takeArg();

        return {
            html:
                from === null || to === null
                    ? ""
                    : `${renderInline(from.value, state)}–${renderInline(to.value, state)}${unit === null ? "" : `&nbsp;${renderInline(unit.value, state)}`}`,
            next: cursor,
        };
    }

    if (name === "ang") {
        const value: GroupResult | null = takeArg();

        return {
            html: value === null ? "" : `${renderInline(value.value, state)}°`,
            next: cursor,
        };
    }

    if (name === "ce") {
        const value: GroupResult | null = takeArg();

        return { html: value === null ? "" : renderInline(value.value, state), next: cursor };
    }

    const format: readonly [string, string] | void = inlineFormats.get(name);

    if (format !== (void 0)) {
        const text: GroupResult | null = takeArg();

        return {
            html:
                text === null
                    ? ""
                    : `${format[0]}${renderInline(text.value, state)}${format[1]}`,
            next: cursor,
        };
    }

    if (plainFormatCommands.has(name)) {
        const text: GroupResult | null = takeArg();

        return { html: text === null ? "" : renderInline(text.value, state), next: cursor };
    }

    const declaration: readonly [string, string] | void = declarationFormats.get(name);

    if (declaration !== (void 0)) {
        const html: string = renderInline(source.slice(cursor), state);

        return {
            html: `${declaration[0]}${html}${declaration[1]}`,
            next: source.length,
        };
    }

    const ignored: number | void = ignoredArgCommands.get(name);

    if (ignored !== (void 0)) {
        if (source.charAt(cursor) === "*") {
            cursor += 1;
        }

        let optional: GroupResult | null = readOptionalGroup(source, cursor);

        while (optional !== null) {
            cursor = optional.next;
            optional = readOptionalGroup(source, cursor);
        }

        for (let count: number = 0; count < ignored; count += 1) {
            if (takeArg() === null) {
                break;
            }
        }

        return { html: "", next: cursor };
    }

    const space: string | void = spacingSymbols.get(name);

    if (space !== (void 0)) {
        return { html: space, next: cursor };
    }

    const symbol: string | void = textSymbols.get(name);

    if (symbol !== (void 0)) {
        return { html: escapeHtml(symbol), next: cursor };
    }

    if (name === "\\") {
        return { html: "<br />", next: cursor };
    }

    if (name === " " || name === "") {
        return { html: " ", next: cursor };
    }

    const group: GroupResult | null = takeArg();

    return {
        html: group === null ? "" : renderInline(group.value, state),
        next: cursor,
    };
};

/**
 * Renders a `\verb` command.
 * @param source - Inline source.
 * @param index - Index after `\verb`.
 * @example
 * renderVerb("\\verb|x|", 5);
 * @returns The code HTML and next index.
 */
const renderVerb: (source: string, index: number) => InlineResult = (
    source: string,
    index: number,
): InlineResult => {
    let cursor: number = index;

    if (source.charAt(cursor) === "*") {
        cursor += 1;
    }

    const delimiter: string = source.charAt(cursor);

    if (delimiter.length === 0) {
        return { html: "", next: cursor };
    }

    cursor += 1;
    const end: number = source.indexOf(delimiter, cursor);

    if (end === -1) {
        return { html: `<code>${escapeHtml(source.slice(cursor))}</code>`, next: source.length };
    }

    return {
        html: `<code class="latex__verb">${escapeHtml(source.slice(cursor, end))}</code>`,
        next: end + 1,
    };
};

/**
 * Renders an `\includegraphics` command.
 * @param source - Inline source.
 * @param index - Index after the command name.
 * @example
 * renderImage("\\includegraphics[width=0.5\\textwidth]{plot.png}", 16);
 * @returns The image HTML and next index.
 */
const renderImage: (source: string, index: number) => InlineResult = (
    source: string,
    index: number,
): InlineResult => {
    let cursor: number = index;

    if (source.charAt(cursor) === "*") {
        cursor += 1;
    }

    let options: string = "";
    let optional: GroupResult | null = readOptionalGroup(source, cursor);

    while (optional !== null) {
        options += `,${optional.value}`;
        cursor = optional.next;
        optional = readOptionalGroup(source, cursor);
    }

    const path: GroupResult | null = readGroup(source, cursor);

    if (path === null) {
        return { html: "", next: cursor };
    }

    cursor = path.next;
    const url: string = path.value.trim();
    const values: ReadonlyMap<string, string> = parseImageOptions(options);
    const altValue: string | void = values.get("alt");
    const alt: string = altValue === (void 0) ? baseName(url) : altValue;

    if (!safeDocumentUrl(url, false)) {
        return {
            html: `<span class="latex__image-missing">${escapeHtml(alt)}</span>`,
            next: cursor,
        };
    }

    const styles: string[] = [];
    const width: string | void = values.get("width");
    const height: string | void = values.get("height");

    if (width !== (void 0)) {
        const dimension: string | null = imageDimension(width);

        if (dimension !== null) {
            styles.push(`width: ${dimension}`);
        }
    }

    if (height !== (void 0)) {
        const dimension: string | null = imageDimension(height);

        if (dimension !== null) {
            styles.push(`height: ${dimension}`);
        }
    }

    const style: string = styles.length > 0 ? ` style="${escapeAttribute(styles.join("; "))}"` : "";

    return {
        html: `<img class="latex__image" src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}"${style} loading="lazy" />`,
        next: cursor,
    };
};

/**
 * Parses image options into a map.
 * @param options - Comma separated options.
 * @example
 * parseImageOptions("width=0.5\\textwidth");
 * @returns The option map.
 */
const parseImageOptions: (options: string) => ReadonlyMap<string, string> = (
    options: string,
): ReadonlyMap<string, string> => {
    const values: Map<string, string> = new Map<string, string>();

    for (const option of options.split(",")) {
        const equals: number = option.indexOf("=");

        if (equals === -1) {
            continue;
        }

        values.set(option.slice(0, equals).trim(), option.slice(equals + 1).trim());
    }

    return values;
};

/**
 * Converts a LaTeX dimension to a CSS dimension.
 * @param value - Dimension such as `0.5\\textwidth` or `3cm`.
 * @example
 * imageDimension("0.5\\textwidth"); // "50%"
 * @returns The CSS value, or null when unsupported.
 */
const imageDimension: (value: string) => string | null = (value: string): string | null => {
    const source: string = value.trim();

    if (/^\\(?:textwidth|linewidth|columnwidth|paperwidth|textheight)$/.test(source)) {
        return "100%";
    }

    const match: RegExpExecArray | null = /^(\d+(?:\.\d+)?)\s*(\\[A-Za-z]+|[A-Za-z%]+)?$/.exec(
        source,
    );

    if (match === null) {
        return null;
    }

    const amount: string = match[1];
    const unit: string = match[2] ?? "";

    if (unit.length === 0) {
        return `${amount}px`;
    }

    if (unit.startsWith("\\")) {
        return `${parseFloat(amount) * 100}%`;
    }

    if (
        unit === "cm" ||
        unit === "mm" ||
        unit === "in" ||
        unit === "pt" ||
        unit === "em" ||
        unit === "ex" ||
        unit === "%"
    ) {
        return `${amount}${unit}`;
    }

    return null;
};

/**
 * Returns the file name from a path.
 * @param path - Path or URL.
 * @example
 * baseName("figures/plot.png"); // "plot.png"
 * @returns The last path segment.
 */
const baseName: (path: string) => string = (path: string): string => {
    const slashed: string = path.split("/").pop() ?? path;

    return slashed.split("\\").pop() ?? slashed;
};
