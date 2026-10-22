/**
 * TeX-to-MathML renderer for the read-only TeX preview.
 *
 * The renderer translates the maths subset used by documents into native
 * MathML, so the browser performs the layout and the result stays selectable,
 * scalable, and accessible. It never emits raw source HTML: text is escaped and
 * only the elements generated here reach the document.
 *
 * Supported constructs: groups, sub- and superscripts, fractions, binomials,
 * roots, text, font variants, Greek letters, operators and relations, large
 * operators with limits, functions, accents, over- and underlines, delimiters,
 * spacing commands, matrices, cases, aligned and gather environments, and the
 * common display maths environments.
 *
 * Type: module.
 * Fields: TexOptions, renderTex.
 * @example
 * const html: string = renderTex("\\frac{a}{b} = \\sqrt{c}");
 */

/**
 * Options for the TeX renderer.
 * Type: interface.
 * Fields: display.
 * @example
 * const options: TexOptions = { display: true };
 */
export interface TexOptions {
    /** Render as display maths (`display="block"`) instead of inline maths. */
    display?: boolean;
}

interface TexSymbol {
    readonly char: string;
    readonly kind: "mi" | "mo";
    readonly upright?: boolean;
}

interface TexFunction {
    readonly limits: boolean;
}

interface TexLargeOperator {
    readonly char: string;
    readonly limits: boolean;
}

interface TexCursor {
    source: string;
    index: number;
}

interface TexAtom {
    markup: string;
    limits: boolean;
}

export const escapeHtml: (value: string) => string = (value: string): string =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const greekSymbols: ReadonlyArray<readonly [string, string]> = [
    ["alpha", "α"],
    ["beta", "β"],
    ["gamma", "γ"],
    ["delta", "δ"],
    ["epsilon", "ϵ"],
    ["varepsilon", "ε"],
    ["zeta", "ζ"],
    ["eta", "η"],
    ["theta", "θ"],
    ["vartheta", "ϑ"],
    ["iota", "ι"],
    ["kappa", "κ"],
    ["lambda", "λ"],
    ["mu", "μ"],
    ["nu", "ν"],
    ["xi", "ξ"],
    ["omicron", "ο"],
    ["pi", "π"],
    ["varpi", "ϖ"],
    ["rho", "ρ"],
    ["varrho", "ϱ"],
    ["sigma", "σ"],
    ["varsigma", "ς"],
    ["tau", "τ"],
    ["upsilon", "υ"],
    ["phi", "φ"],
    ["varphi", "ϕ"],
    ["chi", "χ"],
    ["psi", "ψ"],
    ["omega", "ω"],
];

const upperGreekSymbols: ReadonlyArray<readonly [string, string]> = [
    ["Gamma", "Γ"],
    ["Delta", "Δ"],
    ["Theta", "Θ"],
    ["Lambda", "Λ"],
    ["Xi", "Ξ"],
    ["Pi", "Π"],
    ["Sigma", "Σ"],
    ["Upsilon", "Υ"],
    ["Phi", "Φ"],
    ["Psi", "Ψ"],
    ["Omega", "Ω"],
];

const operatorSymbols: ReadonlyArray<readonly [string, string]> = [
    ["pm", "±"],
    ["mp", "∓"],
    ["times", "×"],
    ["div", "÷"],
    ["cdot", "⋅"],
    ["ast", "∗"],
    ["star", "⋆"],
    ["circ", "∘"],
    ["bullet", "•"],
    ["oplus", "⊕"],
    ["ominus", "⊖"],
    ["otimes", "⊗"],
    ["odot", "⊙"],
    ["le", "≤"],
    ["leq", "≤"],
    ["ge", "≥"],
    ["geq", "≥"],
    ["ne", "≠"],
    ["neq", "≠"],
    ["approx", "≈"],
    ["equiv", "≡"],
    ["sim", "∼"],
    ["simeq", "≃"],
    ["cong", "≅"],
    ["propto", "∝"],
    ["ll", "≪"],
    ["gg", "≫"],
    ["in", "∈"],
    ["notin", "∉"],
    ["ni", "∋"],
    ["subset", "⊂"],
    ["supset", "⊃"],
    ["subseteq", "⊆"],
    ["supseteq", "⊇"],
    ["nsubseteq", "⊈"],
    ["cup", "∪"],
    ["cap", "∩"],
    ["setminus", "∖"],
    ["emptyset", "∅"],
    ["varnothing", "∅"],
    ["forall", "∀"],
    ["exists", "∃"],
    ["nexists", "∄"],
    ["neg", "¬"],
    ["land", "∧"],
    ["lor", "∨"],
    ["to", "→"],
    ["rightarrow", "→"],
    ["leftarrow", "←"],
    ["leftrightarrow", "↔"],
    ["Rightarrow", "⇒"],
    ["Leftarrow", "⇐"],
    ["Leftrightarrow", "⇔"],
    ["mapsto", "↦"],
    ["uparrow", "↑"],
    ["downarrow", "↓"],
    ["infty", "∞"],
    ["partial", "∂"],
    ["nabla", "∇"],
    ["hbar", "ℏ"],
    ["ell", "ℓ"],
    ["Re", "ℜ"],
    ["Im", "ℑ"],
    ["aleph", "ℵ"],
    ["angle", "∠"],
    ["triangle", "△"],
    ["square", "□"],
    ["therefore", "∴"],
    ["because", "∵"],
    ["ldots", "…"],
    ["cdots", "⋯"],
    ["vdots", "⋮"],
    ["ddots", "⋱"],
    ["prime", "′"],
    ["degree", "°"],
    ["perp", "⊥"],
    ["parallel", "∥"],
    ["mid", "∣"],
    ["nmid", "∤"],
    ["langle", "⟨"],
    ["rangle", "⟩"],
    ["lceil", "⌈"],
    ["rceil", "⌉"],
    ["lfloor", "⌊"],
    ["rfloor", "⌋"],
    ["lbrace", "{"],
    ["rbrace", "}"],
    ["vert", "|"],
    ["Vert", "‖"],
    ["backslash", "\\"],
    ["|", "‖"],
    ["{", "{"],
    ["}", "}"],
    ["%", "%"],
    ["$", "$"],
    ["&", "&"],
    ["#", "#"],
    ["_", "_"],
];

const largeOperators: ReadonlyMap<string, TexLargeOperator> = new Map<string, TexLargeOperator>([
    ["sum", { char: "∑", limits: true }],
    ["prod", { char: "∏", limits: true }],
    ["coprod", { char: "∐", limits: true }],
    ["bigcup", { char: "⋃", limits: true }],
    ["bigcap", { char: "⋂", limits: true }],
    ["bigoplus", { char: "⨁", limits: true }],
    ["bigotimes", { char: "⨂", limits: true }],
    ["bigvee", { char: "⋁", limits: true }],
    ["bigwedge", { char: "⋀", limits: true }],
    ["int", { char: "∫", limits: false }],
    ["iint", { char: "∬", limits: false }],
    ["iiint", { char: "∭", limits: false }],
    ["oint", { char: "∮", limits: false }],
]);

const functionNames: ReadonlyArray<readonly [string, boolean]> = [
    ["sin", false],
    ["cos", false],
    ["tan", false],
    ["cot", false],
    ["sec", false],
    ["csc", false],
    ["arcsin", false],
    ["arccos", false],
    ["arctan", false],
    ["sinh", false],
    ["cosh", false],
    ["tanh", false],
    ["coth", false],
    ["log", false],
    ["ln", false],
    ["lg", false],
    ["exp", false],
    ["lim", true],
    ["limsup", true],
    ["liminf", true],
    ["max", true],
    ["min", true],
    ["sup", true],
    ["inf", true],
    ["det", true],
    ["gcd", true],
    ["Pr", true],
    ["dim", false],
    ["ker", false],
    ["hom", false],
    ["arg", false],
    ["deg", false],
    ["mod", false],
];

const accentCommands: ReadonlyMap<string, string> = new Map<string, string>([
    ["hat", "^"],
    ["widehat", "^"],
    ["check", "ˇ"],
    ["tilde", "~"],
    ["widetilde", "~"],
    ["acute", "´"],
    ["grave", "`"],
    ["dot", "."],
    ["ddot", ".."],
    ["breve", "˘"],
    ["bar", "¯"],
    ["vec", "→"],
]);

const textCommands: ReadonlySet<string> = new Set<string>([
    "text",
    "textrm",
    "textnormal",
    "mbox",
    "hbox",
]);

const variantCommands: ReadonlyMap<string, string> = new Map<string, string>([
    ["mathrm", "normal"],
    ["mathbf", "bold"],
    ["mathit", "italic"],
    ["mathsf", "sans-serif"],
    ["mathtt", "monospace"],
    ["mathbb", "double-struck"],
    ["mathcal", "script"],
    ["mathfrak", "fraktur"],
    ["boldsymbol", "bold-italic"],
    ["bm", "bold-italic"],
]);

const spacingCommands: ReadonlyMap<string, string> = new Map<string, string>([
    [",", "0.167em"],
    [":", "0.222em"],
    [";", "0.278em"],
    ["!", "-0.167em"],
    ["quad", "1em"],
    ["qquad", "2em"],
    [" ", "0.25em"],
    ["enspace", "0.5em"],
    ["thinspace", "0.167em"],
    ["medspace", "0.222em"],
    ["thickspace", "0.278em"],
]);

const ignoredCommands: ReadonlySet<string> = new Set<string>([
    "displaystyle",
    "textstyle",
    "scriptstyle",
    "scriptscriptstyle",
    "nonumber",
    "notag",
    "label",
    "left.",
    "right.",
    "limits",
    "nolimits",
]);

const plainEnvironments: ReadonlySet<string> = new Set<string>([
    "equation",
    "equation*",
    "displaymath",
    "math",
]);

const fenceEnvironments: ReadonlyMap<string, readonly [string, string]> = new Map<
    string,
    readonly [string, string]
>([
    ["pmatrix", ["(", ")"]],
    ["bmatrix", ["[", "]"]],
    ["Bmatrix", ["{", "}"]],
    ["vmatrix", ["|", "|"]],
    ["Vmatrix", ["‖", "‖"]],
]);

const texSymbols: Map<string, TexSymbol> = new Map<string, TexSymbol>();

greekSymbols.forEach(([name, char]: readonly [string, string]): void => {
    texSymbols.set(name, { char, kind: "mi" });
});

upperGreekSymbols.forEach(([name, char]: readonly [string, string]): void => {
    texSymbols.set(name, { char, kind: "mi", upright: true });
});

operatorSymbols.forEach(([name, char]: readonly [string, string]): void => {
    texSymbols.set(name, { char, kind: "mo" });
});

const texFunctions: Map<string, TexFunction> = new Map<string, TexFunction>();

functionNames.forEach(([name, limits]: readonly [string, boolean]): void => {
    texFunctions.set(name, { limits });
});

const isSpace: (char: string) => boolean = (char: string): boolean =>
    char === " " || char === "\t" || char === "\n" || char === "\r";

/**
 * Skips whitespace and TeX comments.
 * @param cursor - Parser cursor.
 * @example
 * skipTrivia(cursor);
 */
const skipTrivia: (cursor: TexCursor) => void = (cursor: TexCursor): void => {
    while (cursor.index < cursor.source.length) {
        const char: string = cursor.source.charAt(cursor.index);

        if (isSpace(char)) {
            cursor.index += 1;
            continue;
        }

        if (char === "%") {
            const end: number = cursor.source.indexOf("\n", cursor.index);
            cursor.index = end === -1 ? cursor.source.length : end + 1;
            continue;
        }

        break;
    }
};

/**
 * Reads a control sequence name without the leading backslash.
 * @param cursor - Parser cursor positioned on a backslash.
 * @example
 * const name: string = readCommand(cursor);
 * @returns The command name, or an empty string when no command starts here.
 */
const readCommand: (cursor: TexCursor) => string = (cursor: TexCursor): string => {
    if (cursor.source.charAt(cursor.index) !== "\\") {
        return "";
    }

    cursor.index += 1;

    if (cursor.index >= cursor.source.length) {
        return "";
    }

    const first: string = cursor.source.charAt(cursor.index);

    if (!/[A-Za-z]/.test(first)) {
        cursor.index += 1;
        return first;
    }

    const start: number = cursor.index;

    while (cursor.index < cursor.source.length) {
        const char: string = cursor.source.charAt(cursor.index);

        if (!/[A-Za-z]/.test(char)) {
            break;
        }

        cursor.index += 1;
    }

    return cursor.source.slice(start, cursor.index);
};

/**
 * Reads a balanced braced group as raw text.
 * @param cursor - Parser cursor.
 * @example
 * const name: string = readRawGroup(cursor);
 * @returns The group contents without the outer braces.
 */
const readRawGroup: (cursor: TexCursor) => string = (cursor: TexCursor): string => {
    skipTrivia(cursor);

    if (cursor.source.charAt(cursor.index) !== "{") {
        const char: string = cursor.source.charAt(cursor.index);
        cursor.index += char.length > 0 ? 1 : 0;
        return char;
    }

    cursor.index += 1;
    const start: number = cursor.index;
    let depth: number = 1;

    while (cursor.index < cursor.source.length) {
        const char: string = cursor.source.charAt(cursor.index);

        if (char === "\\") {
            cursor.index += 2;
            continue;
        }

        if (char === "{") {
            depth += 1;
        } else if (char === "}") {
            depth -= 1;

            if (depth === 0) {
                const value: string = cursor.source.slice(start, cursor.index);
                cursor.index += 1;
                return value;
            }
        }

        cursor.index += 1;
    }

    return cursor.source.slice(start);
};

/**
 * Converts escaped text characters into their literal form.
 * @param value - Raw text group contents.
 * @example
 * const text: string = unescapeText("50\\%");
 * @returns The literal text.
 */
const unescapeText: (value: string) => string = (value: string): string =>
    value.replace(/\\([{}%$&#_\\])/g, "$1");

const isStop: (cursor: TexCursor, stops: ReadonlySet<string>) => boolean = (
    cursor: TexCursor,
    stops: ReadonlySet<string>,
): boolean => {
    const rest: string = cursor.source.slice(cursor.index);

    if (cursor.index >= cursor.source.length) {
        return true;
    }

    if (rest.startsWith("}") && stops.has("brace")) {
        return true;
    }

    if (rest.startsWith("\\right") && stops.has("right")) {
        return true;
    }

    if (rest.startsWith("&") && stops.has("cell")) {
        return true;
    }

    if (rest.startsWith("\\\\") && stops.has("row")) {
        return true;
    }

    if (rest.startsWith("\\end") && stops.has("end")) {
        return true;
    }

    return false;
};

/**
 * Reads a delimiter after `\left` or `\right`.
 * @param cursor - Parser cursor.
 * @example
 * const fence: string = readDelimiter(cursor);
 * @returns The delimiter character, or an empty string for a null delimiter.
 */
const readDelimiter: (cursor: TexCursor) => string = (cursor: TexCursor): string => {
    skipTrivia(cursor);
    const char: string = cursor.source.charAt(cursor.index);

    if (char !== "\\") {
        cursor.index += char.length > 0 ? 1 : 0;
        return char === "." ? "" : char;
    }

    const name: string = readCommand(cursor);
    const symbol: TexSymbol | void = texSymbols.get(name);

    if (name === ".") {
        return "";
    }

    if (name === "langle") {
        return "⟨";
    }

    if (name === "rangle") {
        return "⟩";
    }

    if (symbol !== (void 0)) {
        return symbol.char;
    }

    return name;
};

/**
 * Wraps a fence character in a stretchy MathML operator.
 * @param char - Delimiter character.
 * @example
 * const fence: string = fenceMarkup("(");
 * @returns The fence markup, or an empty string for a null delimiter.
 */
const fenceMarkup: (char: string) => string = (char: string): string =>
    char.length === 0
        ? ""
        : `<mo fence="true" stretchy="true">${escapeHtml(char)}</mo>`;

/**
 * Applies a MathML font variant to token elements without one.
 * @param markup - Generated MathML.
 * @param variant - MathML mathvariant value.
 * @example
 * const bold: string = applyVariant("<mi>x</mi>", "bold");
 * @returns Markup with the variant applied.
 */
const applyVariant: (markup: string, variant: string) => string = (
    markup: string,
    variant: string,
): string => markup.replace(/<(mi|mn)(>)/g, `<$1 mathvariant="${variant}"$2`);

const subscriptStop: ReadonlySet<string> = new Set<string>(["brace"]);

/**
 * Renders a formula sequence until a stop token is reached.
 * @param cursor - Parser cursor.
 * @param stops - Stop tokens that end the sequence.
 * @example
 * const markup: string = parseSequence(cursor, new Set(["brace"]));
 * @returns The sequence markup.
 */
const parseSequence: (cursor: TexCursor, stops: ReadonlySet<string>) => string = (
    cursor: TexCursor,
    stops: ReadonlySet<string>,
): string => {
    const output: string[] = [];

    while (cursor.index < cursor.source.length) {
        skipTrivia(cursor);

        if (isStop(cursor, stops)) {
            break;
        }

        const before: number = cursor.index;
        const atom: string = parseAtomWithScripts(cursor);

        if (atom.length === 0) {
            if (cursor.index === before) {
                cursor.index += 1;
            }

            continue;
        }

        output.push(atom);
    }

    return output.join("");
};

/**
 * Renders one atom together with any sub- or superscripts.
 * @param cursor - Parser cursor.
 * @example
 * const markup: string = parseAtomWithScripts(cursor);
 * @returns The atom markup.
 */
const parseAtomWithScripts: (cursor: TexCursor) => string = (cursor: TexCursor): string => {
    const atom: TexAtom | null = parseAtom(cursor);

    if (atom === null) {
        return "";
    }

    let base: string = atom.markup;
    let limits: boolean = atom.limits;
    let sub: string | null = null;
    let sup: string | null = null;

    while (cursor.index < cursor.source.length) {
        skipTrivia(cursor);
        const rest: string = cursor.source.slice(cursor.index);

        if (rest.startsWith("\\limits")) {
            cursor.index += "\\limits".length;
            limits = true;
            continue;
        }

        if (rest.startsWith("\\nolimits")) {
            cursor.index += "\\nolimits".length;
            limits = false;
            continue;
        }

        const char: string = cursor.source.charAt(cursor.index);

        if (char !== "^" && char !== "_") {
            break;
        }

        cursor.index += 1;
        const script: string = readArgument(cursor);

        if (char === "^") {
            sup = script;
        } else {
            sub = script;
        }
    }

    if (sub !== null && sup !== null) {
        base = limits
            ? `<munderover>${base}${sub}${sup}</munderover>`
            : `<msubsup>${base}${sub}${sup}</msubsup>`;
    } else if (sub !== null) {
        base = limits ? `<munder>${base}${sub}</munder>` : `<msub>${base}${sub}</msub>`;
    } else if (sup !== null) {
        base = limits ? `<mover>${base}${sup}</mover>` : `<msup>${base}${sup}</msup>`;
    }

    return base;
};

/**
 * Reads one command argument, either a braced group or a single atom.
 * @param cursor - Parser cursor.
 * @example
 * const argument: string = readArgument(cursor);
 * @returns The argument markup.
 */
const readArgument: (cursor: TexCursor) => string = (cursor: TexCursor): string => {
    skipTrivia(cursor);

    if (cursor.source.charAt(cursor.index) === "{") {
        cursor.index += 1;
        const inner: string = parseSequence(cursor, subscriptStop);

        if (cursor.source.charAt(cursor.index) === "}") {
            cursor.index += 1;
        }

        return `<mrow>${inner}</mrow>`;
    }

    const atom: string = parseAtomWithScripts(cursor);

    return atom.length === 0 ? "<mrow></mrow>" : atom;
};

/**
 * Parses an environment, including matrices and aligned blocks.
 * @param cursor - Parser cursor positioned after `\begin`.
 * @example
 * const markup: string = parseEnvironment(cursor);
 * @returns The environment markup.
 */
const parseEnvironment: (cursor: TexCursor) => string = (cursor: TexCursor): string => {
    const name: string = readRawGroup(cursor).trim();

    if (name === "array") {
        readRawGroup(cursor);
    }

    if (plainEnvironments.has(name)) {
        const inner: string = parseSequence(cursor, new Set<string>(["end"]));

        if (cursor.source.slice(cursor.index).startsWith("\\end")) {
            cursor.index += "\\end".length;
            readRawGroup(cursor);
        }

        return `<mrow>${inner}</mrow>`;
    }

    const rows: string[][] = [];
    let cells: string[] = [];
    const stops: ReadonlySet<string> = new Set<string>(["cell", "row", "end"]);

    while (cursor.index < cursor.source.length) {
        const cell: string = parseSequence(cursor, stops);
        cells.push(cell);
        skipTrivia(cursor);
        const rest: string = cursor.source.slice(cursor.index);

        if (rest.startsWith("&")) {
            cursor.index += 1;
            continue;
        }

        if (rest.startsWith("\\\\")) {
            cursor.index += 2;
            rows.push(cells);
            cells = [];
            continue;
        }

        if (rest.startsWith("\\end")) {
            cursor.index += "\\end".length;
            readRawGroup(cursor);
            rows.push(cells);
            break;
        }

        rows.push(cells);
        break;
    }

    const body: string = rows
        .filter(
            (row: string[]): boolean =>
                row.length > 1 || (row[0] ?? "").trim().length > 0,
        )
        .map(
            (row: string[]): string =>
                `<mtr>${row.map((cell: string): string => `<mtd>${cell}</mtd>`).join("")}</mtr>`,
        )
        .join("");

    if (name === "cases") {
        return `<mrow><mo fence="true" stretchy="true">{</mo><mtable columnspacing="1em" columnalign="left left">${body}</mtable></mrow>`;
    }

    const fences: readonly [string, string] | void = fenceEnvironments.get(name);
    const alignment: string =
        name === "aligned" || name === "align" || name === "align*" || name === "split"
            ? ' columnalign="right left"'
            : "";

    if (fences !== (void 0)) {
        return `<mrow>${fenceMarkup(fences[0])}<mtable${alignment}>${body}</mtable>${fenceMarkup(fences[1])}</mrow>`;
    }

    return `<mtable${alignment}>${body}</mtable>`;
};

/**
 * Parses a single atom, including commands that consume arguments.
 * @param cursor - Parser cursor.
 * @example
 * const atom: TexAtom | null = parseAtom(cursor);
 * @returns The atom markup and whether it accepts limits.
 */
const parseAtom: (cursor: TexCursor) => TexAtom | null = (cursor: TexCursor): TexAtom | null => {
    skipTrivia(cursor);

    if (cursor.index >= cursor.source.length) {
        return null;
    }

    const char: string = cursor.source.charAt(cursor.index);

    if (char === "{") {
        cursor.index += 1;
        const inner: string = parseSequence(cursor, subscriptStop);

        if (cursor.source.charAt(cursor.index) === "}") {
            cursor.index += 1;
        }

        return { markup: `<mrow>${inner}</mrow>`, limits: false };
    }

    if (char === "\\") {
        const name: string = readCommand(cursor);
        const symbol: TexSymbol | void = texSymbols.get(name);

        if (name === "frac" || name === "dfrac" || name === "tfrac") {
            const numerator: string = readArgument(cursor);
            const denominator: string = readArgument(cursor);

            return {
                markup: `<mfrac>${numerator}${denominator}</mfrac>`,
                limits: false,
            };
        }

        if (name === "binom") {
            const top: string = readArgument(cursor);
            const bottom: string = readArgument(cursor);

            return {
                markup: `<mrow><mo fence="true" stretchy="true">(</mo><mfrac linethickness="0">${top}${bottom}</mfrac><mo fence="true" stretchy="true">)</mo></mrow>`,
                limits: false,
            };
        }

        if (name === "sqrt") {
            skipTrivia(cursor);
            let index: string = "";

            if (cursor.source.charAt(cursor.index) === "[") {
                const end: number = cursor.source.indexOf("]", cursor.index);
                const raw: string = end === -1 ? "" : cursor.source.slice(cursor.index + 1, end);
                cursor.index = end === -1 ? cursor.source.length : end + 1;

                if (raw.trim().length > 0) {
                    index = `<mrow>${parseSource(raw)}</mrow>`;
                }
            }

            const radicand: string = readArgument(cursor);

            return {
                markup:
                    index.length > 0
                        ? `<mroot>${radicand}${index}</mroot>`
                        : `<msqrt>${radicand}</msqrt>`,
                limits: false,
            };
        }

        if (textCommands.has(name)) {
            const raw: string = readRawGroup(cursor);
            const text: string = escapeHtml(unescapeText(raw)).replace(/ /g, "\u00a0");

            return { markup: `<mtext>${text}</mtext>`, limits: false };
        }

        if (name === "operatorname") {
            const raw: string = readRawGroup(cursor);

            return {
                markup: `<mi mathvariant="normal">${escapeHtml(unescapeText(raw))}</mi>`,
                limits: false,
            };
        }

        const variant: string | void = variantCommands.get(name);

        if (variant !== (void 0)) {
            const inner: string = readArgument(cursor);

            return { markup: applyVariant(inner, variant), limits: false };
        }

        const accent: string | void = accentCommands.get(name);

        if (accent !== (void 0)) {
            const base: string = readArgument(cursor);

            return {
                markup: `<mover accent="true">${base}<mo>${escapeHtml(accent)}</mo></mover>`,
                limits: false,
            };
        }

        if (name === "overline") {
            const base: string = readArgument(cursor);

            return {
                markup: `<mover>${base}<mo stretchy="true">‾</mo></mover>`,
                limits: false,
            };
        }

        if (name === "underline") {
            const base: string = readArgument(cursor);

            return {
                markup: `<munder>${base}<mo stretchy="true">_</mo></munder>`,
                limits: false,
            };
        }

        if (name === "left") {
            const open: string = readDelimiter(cursor);
            const inner: string = parseSequence(cursor, new Set<string>(["right"]));
            let close: string = "";

            if (cursor.source.slice(cursor.index).startsWith("\\right")) {
                cursor.index += "\\right".length;
                close = readDelimiter(cursor);
            }

            return {
                markup: `<mrow>${fenceMarkup(open)}${inner}${fenceMarkup(close)}</mrow>`,
                limits: false,
            };
        }

        if (name === "begin") {
            return { markup: parseEnvironment(cursor), limits: false };
        }

        if (name === "phantom" || name === "hphantom" || name === "vphantom") {
            const inner: string = readArgument(cursor);

            return { markup: `<mphantom>${inner}</mphantom>`, limits: false };
        }

        if (name === "color") {
            readRawGroup(cursor);

            return { markup: readArgument(cursor), limits: false };
        }

        if (name === "not") {
            skipTrivia(cursor);
            const rest: string = cursor.source.slice(cursor.index);
            const negations: ReadonlyArray<readonly [string, string]> = [
                ["=", "≠"],
                ["<", "≮"],
                [">", "≯"],
                ["\\in", "∉"],
                ["\\subset", "⊄"],
                ["\\le", "≰"],
                ["\\ge", "≱"],
            ];
            const negation: readonly [string, string] | void = negations.find(
                ([token]: readonly [string, string]): boolean => rest.startsWith(token),
            );

            if (negation !== (void 0)) {
                cursor.index += negation[0].length;
                return { markup: `<mo>${negation[1]}</mo>`, limits: false };
            }

            const next: TexAtom | null = parseAtom(cursor);

            return {
                markup: next === null ? "<mo>≠</mo>" : `<mrow><mo>/</mo>${next.markup}</mrow>`,
                limits: false,
            };
        }

        if (name === "\\" || name === "newline") {
            return { markup: '<mspace linebreak="newline"></mspace>', limits: false };
        }

        const spacing: string | void = spacingCommands.get(name);

        if (spacing !== (void 0)) {
            return { markup: `<mspace width="${spacing}"></mspace>`, limits: false };
        }

        if (name === "label" || name === "tag") {
            skipTrivia(cursor);

            if (cursor.source.charAt(cursor.index) === "*") {
                cursor.index += 1;
            }

            readRawGroup(cursor);

            return { markup: "", limits: false };
        }

        if (ignoredCommands.has(name)) {
            return { markup: "", limits: false };
        }

        const large: TexLargeOperator | void = largeOperators.get(name);

        if (large !== (void 0)) {
            return {
                markup: `<mo largeop="true" movablelimits="true">${escapeHtml(large.char)}</mo>`,
                limits: large.limits,
            };
        }

        const func: TexFunction | void = texFunctions.get(name);

        if (func !== (void 0)) {
            return {
                markup:
                    func.limits
                        ? `<mi mathvariant="normal">${escapeHtml(name)}</mi>`
                        : `<mi mathvariant="normal">${escapeHtml(name)}</mi><mo>&#x2061;</mo>`,
                limits: func.limits,
            };
        }

        if (symbol !== (void 0)) {
            if (symbol.kind === "mo") {
                return {
                    markup: `<mo>${escapeHtml(symbol.char)}</mo>`,
                    limits: false,
                };
            }

            return {
                markup:
                    symbol.upright === true
                        ? `<mi mathvariant="normal">${escapeHtml(symbol.char)}</mi>`
                        : `<mi>${escapeHtml(symbol.char)}</mi>`,
                limits: false,
            };
        }

        if (name.length === 0) {
            return null;
        }

        return {
            markup: `<mtext>${escapeHtml(`\\${name}`)}</mtext>`,
            limits: false,
        };
    }

    if (/[0-9]/.test(char)) {
        const start: number = cursor.index;

        while (cursor.index < cursor.source.length && /[0-9]/.test(cursor.source.charAt(cursor.index))) {
            cursor.index += 1;
        }

        if (
            cursor.source.charAt(cursor.index) === "." &&
            /[0-9]/.test(cursor.source.charAt(cursor.index + 1))
        ) {
            cursor.index += 1;

            while (cursor.index < cursor.source.length && /[0-9]/.test(cursor.source.charAt(cursor.index))) {
                cursor.index += 1;
            }
        }

        return {
            markup: `<mn>${escapeHtml(cursor.source.slice(start, cursor.index))}</mn>`,
            limits: false,
        };
    }

    if (/[A-Za-z]/.test(char)) {
        cursor.index += 1;
        return { markup: `<mi>${escapeHtml(char)}</mi>`, limits: false };
    }

    cursor.index += 1;

    if (char === "-") {
        return { markup: "<mo>−</mo>", limits: false };
    }

    if (char === "*") {
        return { markup: "<mo>∗</mo>", limits: false };
    }

    if (char === "'") {
        return { markup: "<mo>′</mo>", limits: false };
    }

    if (char === "~") {
        return { markup: '<mspace width="0.25em"></mspace>', limits: false };
    }

    return { markup: `<mo>${escapeHtml(char)}</mo>`, limits: false };
};

/**
 * Parses a detached TeX fragment.
 * @param source - TeX source fragment.
 * @example
 * const markup: string = parseSource("x^2");
 * @returns The MathML markup.
 */
const parseSource: (source: string) => string = (source: string): string => {
    const cursor: TexCursor = { source, index: 0 };

    return parseSequence(cursor, new Set<string>());
};

/**
 * Renders TeX maths source to native MathML.
 * @param source - TeX maths source, without surrounding dollar signs.
 * @param options - Display or inline rendering.
 * @example
 * const html: string = renderTex("E = mc^2", { display: true });
 * @returns A `<math>` element as an HTML string.
 */
export const renderTex: (source: string, options?: TexOptions) => string = (
    source: string,
    options: TexOptions = {},
): string => {
    const display: boolean = options.display ?? true;
    const body: string = parseSource(source.replace(/\r\n?/g, "\n"));

    return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="${display ? "block" : "inline"}"><mrow>${body}</mrow></math>`;
};
