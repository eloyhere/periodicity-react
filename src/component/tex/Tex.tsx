import { useMemo, type FC, type HTMLAttributes, type Ref } from "react";
import cx from "../foundation/cx";
import { isLatexDocument, renderLatexDocument } from "./document";
import { renderTex } from "./render";
import "./Tex.css";
import "./Latex.css";

/**
 * Props for the TeX preview component.
 * Type: interface.
 * Extends the native `span` attributes for maths and `div` attributes for
 * documents, so `id`, `style`, `title`, `aria-*`, and `data-*` are forwarded to
 * the preview element.
 * Fields: source, display, className, ref.
 * @example
 * <PeriodicityTex source={"E = mc^2"} />
 * @example
 * <PeriodicityTex source={"\\begin{document}Hello\\end{document}"} />
 */
export interface TexProps
    extends Omit<HTMLAttributes<HTMLElement>, "children" | "className" | "dangerouslySetInnerHTML"> {
    /**
     * TeX source. Maths such as `E = mc^2` (without surrounding dollar signs) is
     * rendered as MathML; a source containing `\begin{document}` is rendered as a
     * complete LaTeX article with headings, lists, tables, figures, references,
     * and embedded MathML.
     */
    source: string;
    /**
     * Render maths as display maths instead of inline maths. Defaults to `true`.
     * Ignored when the source is a complete LaTeX document.
     */
    display?: boolean;
    className?: string;
    ref?: Ref<HTMLElement>;
}

/**
 * Renders read-only TeX as native MathML, and complete LaTeX documents as an
 * HTML article. The browser lays out the maths, so formulas stay selectable,
 * scalable, and accessible to screen readers.
 * @param props - TeX source, display mode, class name, and native attributes.
 * @example
 * <Tex display={false} source={"a^2 + b^2 = c^2"} />
 * @returns A preview element containing MathML or a rendered article.
 */
const Tex: FC<TexProps> = ({
    source,
    display = true,
    className = "",
    ref,
    ...rest
}: TexProps) => {
    const document: boolean = useMemo((): boolean => isLatexDocument(source), [source]);
    const html: string = useMemo(
        (): string => (document ? renderLatexDocument(source) : renderTex(source, { display })),
        [source, display, document],
    );

    if (document) {
        return (
            <div
                {...rest}
                ref={ref as Ref<HTMLDivElement>}
                className={cx("tex", "tex--document", className)}
                data-tex="document"
                dangerouslySetInnerHTML={{ ["__html"]: html }}
            />
        );
    }

    return (
        <span
            {...rest}
            ref={ref as Ref<HTMLSpanElement>}
            className={cx("tex", display ? "tex--block" : "tex--inline", className)}
            data-tex="true"
            dangerouslySetInnerHTML={{ ["__html"]: html }}
        />
    );
};

export default Tex;
