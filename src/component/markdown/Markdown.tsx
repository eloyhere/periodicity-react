import { useMemo, type FC, type HTMLAttributes, type Ref } from "react";
import cx from "../foundation/cx";
import { renderMarkdown } from "./render";
import "./Markdown.css";

/**
 * Props for the Markdown preview component.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `style`, `title`, `aria-*`,
 * `data-*`, and pointer, mouse, keyboard, focus, and selection handlers are
 * forwarded to the preview container.
 * Fields: source, breaks, className, ref.
 * @example
 * <PeriodicityMarkdown source={"# Notes\n\nRead **only**."} />
 */
export interface MarkdownProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "dangerouslySetInnerHTML"> {
    /** Markdown document source. */
    source: string;
    /** Render single newlines inside a paragraph as explicit line breaks. */
    breaks?: boolean;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a read-only Markdown document as semantic, sanitised HTML.
 * The source is never interpreted as raw HTML: text is escaped and only the
 * renderer's own elements reach the document, so untrusted documents cannot
 * inject scripts or event handlers.
 * @param props - Markdown source, break handling, class name, and native div attributes.
 * @example
 * <Markdown source={"## Release notes\n\n- one\n- two"} />
 * @returns A scrollable, selectable document preview.
 */
const Markdown: FC<MarkdownProps> = ({
    source,
    breaks = false,
    className = "",
    ref,
    ...rest
}: MarkdownProps) => {
    const html: string = useMemo(
        (): string => renderMarkdown(source, { breaks }),
        [source, breaks],
    );

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("markdown", className)}
            data-markdown="true"
            dangerouslySetInnerHTML={{ ["__html"]: html }}
        />
    );
};

export default Markdown;
