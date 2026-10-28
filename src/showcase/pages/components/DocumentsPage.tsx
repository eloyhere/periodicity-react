import {
    useState,
    type Dispatch,
    type FC,
    type SetStateAction,
} from "react";
import { Inline, Stack } from "../../../arrange/layout";
import Markdown from "../../../component/markdown/Markdown";
import Terminal, { type TerminalLine } from "../../../component/terminal/Terminal";
import Tex from "../../../component/tex/Tex";
import Text from "../../../component/text/Text";
import Demo from "../../Demo";

const markdownCode: string = `<Markdown source={releaseNotes} />`;

const texCode: string = `<Tex source={waveEquation} />
<Tex display={false} source="E = mc^2" />
<Tex source={determinant} />`;

const latexDocumentCode: string = `<Tex source={paper} />`;

const terminalCode: string = `const [command, setCommand] = useState("");
const [history, setHistory] = useState<string[]>(["help", "status"]);
const [lines, setLines] = useState<readonly TerminalLine[]>(deployLog);

const runCommand = (submitted: string): void => {
    setCommand("");
    setLines((current) => [
        ...current,
        { text: submitted, prompt: "~" },
        { text: "✓ all systems nominal", tone: "success" },
    ]);
};

<Terminal
    title="periodicity — deploy"
    controls
    maxHeight={220}
    prompt="~"
    lines={lines}
    value={command}
    onInput={setCommand}
    onChange={runCommand}
    history={history}
    onHistoryChange={setHistory}
    sendLabel="Run command"
/>

<Terminal lines={wrappedLog} wrap maxHeight={150} editable={false} aria-label="Wrapped output" />`;

const deployLog: readonly TerminalLine[] = [
    { text: "periodicity deploy --production", prompt: "~" },
    { text: "resolving workspace packages", tone: "muted" },
    { text: "✓ 14 packages linked", tone: "success" },
    { text: "→ uploading dist (4.2 MB)", tone: "primary", meta: "42%" },
    { text: "→ uploading assets (18 files)", tone: "primary", meta: "88%" },
    { text: "warn  cache age above 7 days; expect a cold start", tone: "warning" },
    { text: "✓ deployed to https://periodicity.example.com", tone: "success", meta: "6.1s" },
    { text: "3 snapshots kept for rollback", tone: "tertiary" },
];

const wrappedLog: readonly TerminalLine[] = [
    { text: "cat release-notes.md | head -n 2", prompt: "$" },
    {
        text: "The transcript keeps its own width by default, so a long line scrolls sideways; wrap hands the width back to the viewport and breaks the line instead.",
        tone: "secondary",
    },
    { text: "every tone above comes from a semantic role in the theme", tone: "muted", meta: "wrap" },
];

const releaseNotes: string = [
    "# Field notes",
    "",
    "A read-only preview turns a document into **semantic HTML** without letting the",
    "source inject markup, scripts, or event handlers.",
    "",
    "## What the renderer covers",
    "",
    "- Headings, paragraphs, and `inline code`",
    "- Nested lists, tables, quotes, and fenced code",
    "- Links and images limited to safe URL schemes",
    "",
    "> The preview is selectable and follows the surrounding type hierarchy.",
    "",
    "| Block | Supported |",
    "| :--- | ---: |",
    "| Markdown | yes |",
    "| Raw HTML | escaped |",
    "",
    "```ts",
    "const html = renderMarkdown(\"# Title\");",
    "```",
].join("\n");

const waveEquation: string =
    "\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u";

const gaussianSum: string =
    "\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}";

const quadratic: string =
    "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}";

const determinant: string =
    "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc";

const cases: string =
    "f(x) = \\begin{cases} x^2 & x \\ge 0 \\\\ -x & x < 0 \\end{cases}";

const paper: string = String.raw`\documentclass[11pt]{article}
\title{Field notes}
\author{Mira Chen \and Ada Lovelace}
\date{2026}
\newcommand{\R}{\mathbb{R}}
\begin{document}
\maketitle
\begin{abstract}
A short paper with inline maths $E = mc^2$, a numbered equation, and a table.
\end{abstract}
\tableofcontents
\section{Introduction}\label{sec:intro}
The document preview keeps the surrounding type tokens and the maths stays
selectable: $x \in \R^n$. See Section~\ref{sec:data} and \cite{periodicity}.
\section{Data}\label{sec:data}
\begin{itemize}
  \item A list item with \textbf{bold text}.
  \item A second item with $a^2 + b^2 = c^2$.
\end{itemize}
\begin{equation}\label{eq:sum}
\sum_{k=1}^{n} k = \frac{n(n+1)}{2}
\end{equation}
\begin{table}
\caption{Measurements}
\begin{tabular}{lcr}
\hline
Name & Value & Unit \\
\hline
Alpha & 1.2 & m \\
Beta & 3.4 & s \\
\hline
\end{tabular}
\end{table}
A footnote.\footnote{Notes are collected at the end of the document.}
\begin{thebibliography}{9}
\bibitem{periodicity} Periodicity. \emph{Design tokens and components}. 2026.
\end{thebibliography}
\end{document}`;

/**
 * Interactive console demo: the caller owns execution and appends the output.
 * @example
 * <TerminalDemo />
 * @returns The terminal demo stack.
 */
const TerminalDemo: FC = () => {
    const [command, setCommand]: [string, (next: string) => void] = useState<string>("");
    const [history, setHistory]: [
        readonly string[],
        (next: readonly string[]) => void,
    ] = useState<readonly string[]>(["help", "status"]);
    const [lines, setLines]: [
        readonly TerminalLine[],
        Dispatch<SetStateAction<readonly TerminalLine[]>>,
    ] = useState<readonly TerminalLine[]>(deployLog);

    const runCommand: (submitted: string) => void = (submitted: string): void => {
        setCommand("");
        setLines((current: readonly TerminalLine[]): readonly TerminalLine[] => [
            ...current,
            { text: submitted, prompt: "~" },
            { text: "✓ all systems nominal", tone: "success" },
        ]);
    };

    return (
        <Stack gap="lg">
            <Terminal
                title="periodicity — deploy"
                controls
                maxHeight={220}
                prompt="~"
                lines={lines}
                value={command}
                onInput={setCommand}
                onChange={runCommand}
                history={history}
                onHistoryChange={setHistory}
                sendLabel="Run command"
            />
            <Terminal
                lines={wrappedLog}
                wrap
                maxHeight={150}
                editable={false}
                aria-label="Wrapped output"
            />
        </Stack>
    );
};

/**
 * Documents the Markdown, TeX, and interactive Terminal components.
 * @example
 * <DocumentsPage />
 * @returns The Documents entry.
 */
const DocumentsPage: FC = () => (
    <>
        <Demo
            title="Markdown document"
            description="Markdown becomes sanitised, semantic HTML; the preview stays selectable and never executes source markup."
            code={markdownCode}
        >
            <Markdown source={releaseNotes} />
        </Demo>

        <Demo
            title="TeX mathematics"
            description="TeX maths is translated into native MathML, so the browser lays out the formula and assistive technology can read it."
            code={texCode}
        >
            <Stack gap="lg">
                <Text variant="body">
                    Inline maths such as <Tex display={false} source="E = mc^2" /> and{" "}
                    <Tex display={false} source="e^{i\\pi} + 1 = 0" /> sits inside a paragraph
                    without breaking the line height.
                </Text>
                <Tex source={waveEquation} />
                <Tex source={gaussianSum} />
                <Tex source={quadratic} />
                <Tex source={determinant} />
                <Tex source={cases} />
                <Inline gap="sm" align="center" wrap>
                    <Text variant="label">Limits</Text>
                    <Tex display={false} source="\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1" />
                    <Text variant="label">Integral</Text>
                    <Tex display={false} source="\\int_0^1 x^2 \\, dx = \\frac{1}{3}" />
                </Inline>
            </Stack>
        </Demo>

        <Demo
            title="LaTeX document"
            description="A complete LaTeX document renders as an HTML article: title, abstract, numbered sections, tables, equations, footnotes, citations, and cross-references."
            code={latexDocumentCode}
        >
            <Tex source={paper} />
        </Demo>

        <Demo
            title="Terminal output"
            description="An interactive console: the caller owns command execution, appends output lines, and persists the ArrowUp/ArrowDown history. The send control is an icon button."
            code={terminalCode}
        >
            <TerminalDemo />
        </Demo>
    </>
);

export default DocumentsPage;
