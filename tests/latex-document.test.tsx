import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Tex from "../src/component/tex/Tex";
import { isLatexDocument, renderLatexDocument } from "../src/component/tex/document";

const parse: (html: string) => Document = (html: string): Document =>
    new DOMParser().parseFromString(html, "text/html");

const article: (source: string) => Document = (source: string): Document =>
    parse(renderLatexDocument(source));

const documentSource: string = String.raw`\documentclass{article}
\title{Test Paper}
\author{Mira Chen \and Ada Lovelace}
\date{2026}
\begin{document}
\maketitle
\begin{abstract}
A short abstract with $E = mc^2$.
\end{abstract}
\tableofcontents
\section{Introduction}\label{sec:intro}
See Section~\ref{sec:intro}.
\subsection{Details}
Detail text.
\section{Conclusion}
Done.
\end{document}`;

describe("LaTeX documents", (): void => {
    it("renders the title, authors, date, abstract, sections, and contents", (): void => {
        const parsed: Document = article(documentSource);

        expect(parsed.querySelector("h1")?.textContent).toBe("Test Paper");
        expect(parsed.querySelector(".latex__authors")?.textContent).toContain("Mira Chen");
        expect(parsed.querySelector(".latex__authors")?.textContent).toContain("Ada Lovelace");
        expect(parsed.querySelector(".latex__date")?.textContent).toBe("2026");
        expect(parsed.querySelector(".latex__abstract")?.textContent).toContain(
            "A short abstract",
        );
        expect(parsed.querySelectorAll(".latex__heading--section").length).toBe(2);
        expect(parsed.querySelectorAll(".latex__heading--subsection").length).toBe(1);
        expect(parsed.querySelectorAll(".latex__toc-item").length).toBe(3);
        expect(parsed.querySelector(".latex__heading-number")?.textContent).toBe("1");
        expect(
            parsed.querySelector('.latex__reference[href="#sec-1"]')?.textContent,
        ).toBe("1");
        expect(parsed.querySelectorAll("math").length).toBe(1);
    });

    it("numbers equations and resolves labels and forwards references", (): void => {
        const source: string = String.raw`\begin{document}
\section{One}
See \ref{fig:later} and \eqref{eq:sum}.
\begin{equation}
\label{eq:sum}
[a,b] \subset \mathbb{R}
\end{equation}
\begin{figure}
\caption{Later}
\label{fig:later}
\end{figure}
\end{document}`;
        const parsed: Document = article(source);

        expect(
            parsed.querySelector('.latex__reference[href="#fig-1"]')?.textContent,
        ).toBe("1");
        expect(
            parsed.querySelector('.latex__reference[href="#eq-1"]')?.textContent,
        ).toBe("(1)");
        expect(parsed.querySelector(".latex__equation-number")?.textContent).toBe("(1)");
        expect(parsed.querySelector(".latex__equation math")?.textContent).toContain("[");
        expect(parsed.querySelector("#fig-1")).not.toBeNull();
    });

    it("renders nested lists, descriptions, quotes, and verbatim code", (): void => {
        const source: string = String.raw`\begin{document}
\begin{itemize}
  \item One with \textbf{bold}
  \item Two
  \begin{enumerate}
    \item Nested
  \end{enumerate}
\end{itemize}
\begin{description}
  \item[Term] Definition
\end{description}
\begin{quote}
Quoted line.
\end{quote}
\begin{verbatim}
<script>alert(1)</script>
\end{verbatim}
\begin{minted}{python}
print("hello")
\end{minted}
\begin{lstlisting}[language=Python]
print("world")
\end{lstlisting}
\end{document}`;
        const parsed: Document = article(source);

        expect(parsed.querySelectorAll("ul.latex__list > li").length).toBe(2);
        expect(parsed.querySelector("ol.latex__list li")?.textContent).toContain("Nested");
        expect(parsed.querySelector("strong")?.textContent).toBe("bold");
        expect(parsed.querySelector("dt")?.textContent).toBe("Term");
        expect(parsed.querySelector("dd")?.textContent).toContain("Definition");
        expect(parsed.querySelector("blockquote")?.textContent).toContain("Quoted line");
        expect(parsed.querySelectorAll("pre.latex__verbatim").length).toBe(3);
        expect(parsed.querySelectorAll("pre code")[0].textContent).toContain(
            "<script>alert(1)</script>",
        );
        expect(parsed.querySelectorAll("pre code")[1].getAttribute("class")).toBe(
            "language-python",
        );
        expect(parsed.querySelectorAll("pre code")[2].getAttribute("class")).toBe(
            "language-Python",
        );
        expect(parsed.querySelector("script")).toBeNull();
        expect(parsed.querySelector("body > script")).toBeNull();
    });

    it("renders tables, figures, captions, and image widths", (): void => {
        const source: string = String.raw`\begin{document}
\begin{table}
\centering
\caption{Numbers}
\label{tab:numbers}
\begin{tabular}{lcr}
\hline
Name & Value & Note \\
\hline
Alpha & 1 & First \\
\hline
\end{tabular}
\end{table}
\begin{figure}
\includegraphics[width=0.5\textwidth]{plot.png}
\caption{A plot}
\label{fig:plot}
\end{figure}
See Table~\ref{tab:numbers} and Figure~\ref{fig:plot}.
\end{document}`;
        const parsed: Document = article(source);
        const image: HTMLImageElement | null = parsed.querySelector(".latex__image");
        const tableCaption: Element | null = parsed.querySelector(
            ".latex__float--table .latex__caption",
        );

        expect(parsed.querySelectorAll(".latex__float").length).toBe(2);
        expect(parsed.querySelectorAll(".latex__tabular td").length).toBe(6);
        expect(parsed.querySelector("td.latex__cell--center")?.textContent).toBe("Value");
        expect(tableCaption?.textContent).toContain("Table 1.");
        expect(tableCaption?.textContent).toContain("Numbers");
        expect(image?.getAttribute("src")).toBe("plot.png");
        expect(image?.getAttribute("style")).toContain("width: 50%");
        expect(parsed.querySelector(".latex__float--figure .latex__caption")?.textContent).toContain(
            "Figure 1.",
        );
        expect(
            parsed.querySelector('.latex__reference[href="#tab-1"]')?.textContent,
        ).toBe("1");
        expect(
            parsed.querySelector('.latex__reference[href="#fig-1"]')?.textContent,
        ).toBe("1");
    });

    it("renders footnotes, citations, and the bibliography", (): void => {
        const source: string = String.raw`\begin{document}
\section{Notes}
Text.\footnote{A note with \cite{knuth}.}
\begin{thebibliography}{9}
\bibitem{knuth} Donald Knuth. \emph{The TeXbook}. 1984.
\end{thebibliography}
\end{document}`;
        const parsed: Document = article(source);

        expect(parsed.querySelector(".latex__note-ref")?.textContent).toBe("1");
        expect(parsed.querySelectorAll(".latex__note").length).toBe(1);
        expect(parsed.querySelector(".latex__note")?.textContent).toContain(
            "A note with",
        );
        expect(
            parsed.querySelector('.latex__citation-link[href="#bib-knuth"]')?.textContent,
        ).toBe("1");
        expect(parsed.querySelector(".latex__bib-item")?.textContent).toContain(
            "The TeXbook",
        );
    });

    it("renders theorems, proofs, and appendix numbering", (): void => {
        const source: string = String.raw`\begin{document}
\begin{theorem}[Pythagoras]
\label{thm:pyth}
For a right triangle, $a^2 + b^2 = c^2$.
\end{theorem}
\begin{proof}
By construction.
\end{proof}
See \ref{thm:pyth} and \autoref{thm:pyth}.
\appendix
\section{Extra}\label{app:extra}
See Appendix~\ref{app:extra}.
\end{document}`;
        const parsed: Document = article(source);

        expect(parsed.querySelector(".latex__theorem-name")?.textContent).toContain(
            "Theorem 1",
        );
        expect(parsed.querySelector(".latex__theorem-title")?.textContent).toContain(
            "Pythagoras",
        );
        expect(parsed.querySelector(".latex__theorem-note")?.textContent).toContain(
            "Pythagoras",
        );
        expect(parsed.querySelector(".latex__theorem--proof .latex__qed")?.textContent).toBe("∎");
        expect(
            parsed.querySelector('.latex__reference[href="#thm-1"]')?.textContent,
        ).toBe("1");
        const appendixReference: Element | undefined = Array.from(
            parsed.querySelectorAll(".latex__reference"),
        ).find((element: Element): boolean => element.textContent === "A");

        expect(appendixReference).not.toBeUndefined();
        expect(parsed.querySelector(".latex__heading-number")?.textContent).toBe("A");
    });

    it("expands user macros and renders dashes and quotes", (): void => {
        const source: string = String.raw`\documentclass{article}
\newcommand{\R}{\mathbb{R}}
\newcommand{\vect}[1]{\mathbf{#1}}
\newcommand{\pair}[2][x]{#1 and #2}
\DeclareMathOperator{\argmax}{arg\,max}
\begin{document}
$\R^n$, $\vect{v}$, and $\argmax_x f(x)$.
\pair{y} and \pair[a]{z}.
\enquote{Quoted} --- dash -- end. \SI{3.2}{m}. \SIrange{1}{2}{s}.
\end{document}`;
        const parsed: Document = article(source);
        const text: string = parsed.body.textContent ?? "";

        expect(text).toContain("x and y");
        expect(text).toContain("a and z");
        expect(text).toContain("“Quoted”");
        expect(text).toContain("— dash – end");
        expect(text).toContain("3.2");
        expect(text).toContain("1–2");
        expect(text).toContain("arg max");
        expect(
            parsed.querySelectorAll('mi[mathvariant="double-struck"]').length,
        ).toBeGreaterThan(0);
        expect(parsed.querySelectorAll('mi[mathvariant="bold"]').length).toBeGreaterThan(0);
    });

    it("keeps starred sections out of the contents and leaves out an empty date", (): void => {
        const source: string = String.raw`\documentclass{article}
\title{Untitled}
\date{}
\begin{document}
\maketitle
\section*{Preface}
\section{Numbered}
\end{document}`;
        const parsed: Document = article(source);

        expect(parsed.querySelector(".latex__date")).toBeNull();
        expect(parsed.querySelectorAll(".latex__toc-item").length).toBe(0);
        expect(parsed.querySelector(".latex__heading-number")?.textContent).toBe("1");
    });

    it("renders aligned mathematics and custom equation tags", (): void => {
        const source: string = String.raw`\begin{document}
\begin{align}
a &= b \\
c &= d
\end{align}
\begin{equation}\tag{A}
x = 1
\end{equation}
\end{document}`;
        const parsed: Document = article(source);

        expect(parsed.querySelectorAll(".latex__equation").length).toBe(2);
        expect(parsed.querySelector(".latex__equation-number")?.textContent).toBe("(A)");
        expect(parsed.querySelector("mtable")).not.toBeNull();
        expect(parsed.querySelector(".latex__equation--unnumbered")).not.toBeNull();
    });

    it("renders booktabs rules and repeated column specifications", (): void => {
        const source: string = String.raw`\begin{document}
\begin{tabular}{l*{2}{c}}
\toprule[0.5pt]
Name & A & B \\
\midrule
\cmidrule(lr){2-3}
Alpha & 1 & 2 \\
\bottomrule
\end{tabular}
\end{document}`;
        const parsed: Document = article(source);
        const text: string = parsed.body.textContent ?? "";

        expect(parsed.querySelectorAll("td").length).toBe(6);
        expect(parsed.querySelectorAll(".latex__cell--center").length).toBe(4);
        expect(text).not.toContain("toprule");
        expect(text).not.toContain("midrule");
        expect(text).not.toContain("cmidrule");
        expect(text).not.toContain("bottomrule");
    });

    it("keeps unknown commands and environments harmless", (): void => {
        const source: string = String.raw`\begin{document}
\unknown{text} and \begin{unknownenv}Body\end{unknownenv}.
\end{document}`;
        const parsed: Document = article(source);
        const text: string = parsed.body.textContent ?? "";

        expect(text).toContain("text");
        expect(text).toContain("Body");
        expect(parsed.querySelector("script")).toBeNull();
    });

    it("detects documents and keeps maths mode for formulas", (): void => {
        expect(isLatexDocument(documentSource)).toBe(true);
        expect(isLatexDocument("E = mc^2")).toBe(false);

        const renderedDocument: { container: HTMLElement } = render(<Tex source={documentSource} />);
        const renderedMath: { container: HTMLElement } = render(<Tex source="E = mc^2" />);

        expect(renderedDocument.container.querySelector(".tex--document")).not.toBeNull();
        expect(renderedDocument.container.querySelector("article.latex")).not.toBeNull();
        expect(renderedDocument.container.querySelector("h1")?.textContent).toBe("Test Paper");
        expect(renderedMath.container.querySelector("span.tex--block")).not.toBeNull();
        expect(renderedMath.container.querySelector("math")).not.toBeNull();
    });
});
