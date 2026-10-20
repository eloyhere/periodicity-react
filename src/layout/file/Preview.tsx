import { useMemo, useState, type FC, type HTMLAttributes, type ReactNode, type Ref } from "react";
import Badge from "../../component/badge/Badge";
import Button from "../../component/button/Button";
import Icon from "../../component/icon/Icon";
import cx from "../../component/foundation/cx";
import type { FileNode } from "./project";
import type { RenderedFile } from "./render";
import { renderFile } from "./render";
import type { StructureKind, StructureNode } from "./structure";
import { parseStructure } from "./structure";
import { useInternational, type InternationalContextValue } from "../../international";
import "./FileTools.css";

/**
 * Outer presentation selected for a preview: rendered output or raw source.
 * Type: type alias.
 * Fields: none.
 * @example
 * const view: PreviewView = "source";
 */
export type PreviewView = "rendered" | "source";

/**
 * Inner presentation selected for source files: parsed structure or code.
 * Type: type alias.
 * Fields: none.
 * @example
 * const codeView: PreviewCodeView = "structure";
 */
export type PreviewCodeView = "structure" | "code";

/**
 * Props for the read-only file preview.
 * Type: interface.
 * Fields: file, view, defaultView, onViewChange, codeView, defaultCodeView,
 * onCodeViewChange, onCopyFile, onCopySuccess, onCopyError, copyLabel,
 * renderedLabel, sourceLabel, structureLabel, codeLabel, showCopy,
 * showViewSwitch, showCodeViewSwitch, className, ref.
 * Native section attributes and events are forwarded to the root element.
 * @example
 * <Preview
 *     file={file}
 *     view={view}
 *     onViewChange={(next, current) => setView(next)}
 *     onCopyFile={(current, content) => notify(current, content)}
 * />
 */
export interface PreviewProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
    file: FileNode;
    view?: PreviewView;
    defaultView?: PreviewView;
    onViewChange?: (view: PreviewView, file: FileNode) => void;
    codeView?: PreviewCodeView;
    defaultCodeView?: PreviewCodeView;
    onCodeViewChange?: (codeView: PreviewCodeView, file: FileNode) => void;
    onCopyFile?: (file: FileNode, content: string) => void;
    onCopySuccess?: (file: FileNode, content: string) => void;
    onCopyError?: (error: unknown, file: FileNode) => void;
    /** Copy button label; defaults to the localised Copy label. */
    copyLabel?: string;
    renderedLabel?: string;
    sourceLabel?: string;
    structureLabel?: string;
    codeLabel?: string;
    showCopy?: boolean;
    showViewSwitch?: boolean;
    showCodeViewSwitch?: boolean;
    className?: string;
    ref?: Ref<HTMLElement>;
}

interface StructureBranchProps {
    node: StructureNode;
    depth: number;
}

const kindLabels: Readonly<Record<StructureKind, string>> = {
    file: "file",
    tag: "tag",
    attribute: "attr",
    section: "section",
    paragraph: "text",
    sentence: "sentence",
    function: "function",
    class: "class",
    method: "method",
    property: "property",
    comment: "comment",
    constant: "variable",
    type: "type",
    interface: "interface",
};

const summaryKinds: readonly StructureKind[] = [
    "function",
    "class",
    "method",
    "property",
    "constant",
];

const countKinds: (node: StructureNode) => Readonly<Record<string, number>> = (
    node: StructureNode,
): Readonly<Record<string, number>> => {
    const counts: Record<string, number> = {};

    const visit: (current: StructureNode) => void = (current: StructureNode): void => {
        counts[current.kind] = (counts[current.kind] ?? 0) + 1;
        current.children?.forEach(visit);
    };

    visit(node);

    return counts;
};

/**
 * Renders one parsed structure branch with tree semantics.
 * @param props - Node and visual depth.
 * @example
 * <StructureBranch node={node} depth={0} />
 * @returns A nested structure list item.
 */
const StructureBranch: FC<StructureBranchProps> = ({
    node,
    depth,
}: StructureBranchProps) => {
    const children: readonly StructureNode[] = node.children ?? [];

    return (
        <li
            className="file-structure__branch"
            data-depth={depth}
            role="treeitem"
            aria-level={depth + 1}
            aria-expanded={children.length > 0 ? true : (void 0)}
        >
            <div className="file-structure__row" data-kind={node.kind}>
                <span className="file-structure__kind">{kindLabels[node.kind]}</span>
                <span className="file-structure__label">{node.label}</span>
                {node.line === (void 0) ? null : (
                    <span className="file-structure__line">L{node.line}</span>
                )}
            </div>
            {children.length === 0 ? null : (
                <ul className="file-structure__children" role="group">
                    {children.map(
                        (child: StructureNode): ReactNode => (
                            <StructureBranch key={child.id} node={child} depth={depth + 1} />
                        ),
                    )}
                </ul>
            )}
        </li>
    );
};

/**
 * Renders Markdown/HTML as HTML, and code as a structural outline of
 * functions, classes, methods, properties, and variables. Rendered source is
 * sanitised by `renderFile`; the Preview adds no input or form elements.
 * @param props - File node, view controls, copy callbacks, and native attributes.
 * @example
 * <Preview file={selected} defaultCodeView="code" onCopyFile={copy} />
 * @returns A rendered, structural, or source preview.
 */
const Preview: FC<PreviewProps> = ({
    file,
    view,
    defaultView = "rendered",
    onViewChange,
    codeView,
    defaultCodeView = "structure",
    onCodeViewChange,
    onCopyFile,
    onCopySuccess,
    onCopyError,
    copyLabel,
    renderedLabel = "Rendered",
    sourceLabel = "Source",
    structureLabel = "Structure",
    codeLabel = "Code",
    showCopy = true,
    showViewSwitch = true,
    showCodeViewSwitch = true,
    className = "",
    "aria-label": ariaLabel,
    ref,
    ...rest
}: PreviewProps): ReactNode => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedCopyLabel: string = copyLabel ?? t("copy");
    const rendered: RenderedFile = useMemo((): RenderedFile => renderFile(file), [file]);
    const structure: StructureNode = useMemo(
        (): StructureNode => parseStructure(file),
        [file],
    );
    const counts: Readonly<Record<string, number>> = useMemo(
        (): Readonly<Record<string, number>> => countKinds(structure),
        [structure],
    );
    const [internalView, setInternalView]: [PreviewView, (next: PreviewView) => void] =
        useState<PreviewView>(defaultView);
    const [internalCodeView, setInternalCodeView]: [
        PreviewCodeView,
        (next: PreviewCodeView) => void,
    ] = useState<PreviewCodeView>(defaultCodeView);
    const activeView: PreviewView = view ?? internalView;
    const activeCodeView: PreviewCodeView = codeView ?? internalCodeView;
    const content: string = file.content ?? "";
    const isCode: boolean = rendered.mode === "code";
    const showStructure: boolean =
        isCode && activeView === "rendered" && activeCodeView === "structure";
    const children: readonly StructureNode[] = structure.children ?? [];

    const changeView: (next: PreviewView) => void = (next: PreviewView): void => {
        if (next === activeView) {
            return;
        }

        if (view === (void 0)) {
            setInternalView(next);
        }

        onViewChange?.(next, file);
    };

    const changeCodeView: (next: PreviewCodeView) => void = (next: PreviewCodeView): void => {
        if (next === activeCodeView) {
            return;
        }

        if (codeView === (void 0)) {
            setInternalCodeView(next);
        }

        onCodeViewChange?.(next, file);
    };

    const copy: () => void = (): void => {
        onCopyFile?.(file, content);

        if (typeof navigator === "undefined") {
            onCopyError?.(new Error("Clipboard access is unavailable."), file);
            return;
        }

        const clipboard: Clipboard | void = navigator.clipboard;

        if (clipboard === (void 0)) {
            onCopyError?.(new Error("Clipboard access is unavailable."), file);
            return;
        }

        try {
            void clipboard.writeText(content).then(
                (): void => {
                    onCopySuccess?.(file, content);
                },
                (error: unknown): void => {
                    onCopyError?.(error, file);
                },
            );
        } catch (error: unknown) {
            onCopyError?.(error, file);
        }
    };

    const structureBody: ReactNode = (
        <div className="file-structure">
            <div className="file-structure__summary" role="group" aria-label="Structure summary">
                {summaryKinds.map((kind: StructureKind): ReactNode => {
                    const count: number = counts[kind] ?? 0;

                    return count === 0 ? null : (
                        <span key={kind} data-kind={kind}>
                            {count} {kindLabels[kind]}
                            {count === 1 ? "" : "s"}
                        </span>
                    );
                })}
            </div>
            <ul className="file-structure__tree" role="tree" aria-label="File structure">
                {children.map(
                    (node: StructureNode): ReactNode => (
                        <StructureBranch key={node.id} node={node} depth={0} />
                    ),
                )}
            </ul>
            {children.length === 0 ? (
                <p className="file-structure__empty">No structure found.</p>
            ) : null}
        </div>
    );

    const sourceBody: ReactNode = (
        <pre className="file-preview__source">
            <code>{content}</code>
        </pre>
    );

    const renderedBody: ReactNode =
        rendered.mode === "code" ? (
            <pre>
                <code dangerouslySetInnerHTML={{ ["__html"]: rendered.html }} />
            </pre>
        ) : (
            <div
                className="file-preview__html"
                dangerouslySetInnerHTML={{ ["__html"]: rendered.html }}
            />
        );

    const body: ReactNode = showStructure
        ? structureBody
        : activeView === "source"
          ? sourceBody
          : renderedBody;

    return (
        <section
            {...rest}
            ref={ref}
            className={cx("file-preview", "selectable", className)}
            aria-label={ariaLabel ?? `${file.name} preview`}
            data-file-id={file.id}
            data-language={rendered.language}
            data-mode={rendered.mode}
            data-view={activeView}
            data-code-view={isCode ? activeCodeView : (void 0)}
        >
            <header className="file-preview__header">
                <span className="file-preview__name">{file.name}</span>
                <span className="file-preview__meta">{rendered.language}</span>
                <Badge tone="neutral">{rendered.mode}</Badge>
                <div className="file-preview__actions" role="group" aria-label="Preview controls">
                    {showViewSwitch ? (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                aria-pressed={activeView === "rendered"}
                                onClick={(): void => changeView("rendered")}
                            >
                                {renderedLabel}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                aria-pressed={activeView === "source"}
                                onClick={(): void => changeView("source")}
                            >
                                {sourceLabel}
                            </Button>
                        </>
                    ) : null}
                    {isCode && showCodeViewSwitch && activeView === "rendered" ? (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                aria-pressed={activeCodeView === "structure"}
                                onClick={(): void => changeCodeView("structure")}
                            >
                                {structureLabel}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                aria-pressed={activeCodeView === "code"}
                                onClick={(): void => changeCodeView("code")}
                            >
                                {codeLabel}
                            </Button>
                        </>
                    ) : null}
                    {showCopy ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            aria-label={resolvedCopyLabel}
                            onClick={copy}
                        >
                            <Icon name="Clipboard" size={14} />
                        </Button>
                    ) : null}
                </div>
            </header>

            <div className="file-preview__body">{body}</div>
        </section>
    );
};

export default Preview;
