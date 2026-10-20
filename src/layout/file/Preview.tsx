import { useMemo, type FC, type ReactNode } from "react";
import Badge from "../../component/badge/Badge";
import cx from "../../component/foundation/cx";
import type { FileNode } from "./project";
import type { RenderedFile } from "./render";
import { renderFile } from "./render";
import "./FileTools.css";

/**
 * Props for the read-only file preview.
 * Type: interface.
 * Fields: file, className.
 * @example
 * <Preview file={file} />
 */
export interface PreviewProps {
    file: FileNode;
    className?: string;
}

/**
 * Renders a file through the extension-driven renderer.
 * @param props - File node and optional class.
 * @example
 * <Preview file={selected} />
 * @returns A preview panel.
 */
const Preview: FC<PreviewProps> = ({ file, className = "" }: PreviewProps): ReactNode => {
    const rendered: RenderedFile = useMemo((): RenderedFile => renderFile(file), [file]);

    return (
        <section className={cx("file-preview", "selectable", className)} data-mode={rendered.mode}>
            <header className="file-preview__header">
                <span className="file-preview__name">{file.name}</span>
                <span className="file-preview__meta">{rendered.language}</span>
                <Badge tone="neutral">{rendered.mode}</Badge>
            </header>
            <div className="file-preview__body">
                {rendered.mode === "code" ? (
                    <pre>
                        <code dangerouslySetInnerHTML={{ ["__html"]: rendered.html }} />
                    </pre>
                ) : (
                    <div
                        className="file-preview__html"
                        dangerouslySetInnerHTML={{ ["__html"]: rendered.html }}
                    />
                )}
            </div>
        </section>
    );
};

export default Preview;
