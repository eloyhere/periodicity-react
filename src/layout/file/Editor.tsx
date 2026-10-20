import {
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FC,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type RefObject,
    type SyntheticEvent,
} from "react";
import Badge from "../../component/badge/Badge";
import Button from "../../component/button/Button";
import cx from "../../component/foundation/cx";
import useDebouncedValue from "../../component/foundation/useDebouncedValue";
import type { Extension } from "./extension";
import { extensionOf } from "./extension";
import type { FileNode } from "./project";
import type { CompletionSuggestion, NgramModel } from "./completion";
import type { RenderedFile } from "./render";
import { renderFile } from "./render";
import { buildNgramModel, getCompletions } from "./completion";
import "./FileTools.css";

interface EditorCompletion {
    label: string;
    detail: string;
    insertText: string;
}

/**
 * Props for the file editor.
 * Type: interface.
 * Fields: file, onSave, className.
 * @example
 * <Editor file={file} onSave={(next, content) => save(next, content)} />
 */
export interface EditorProps {
    file: FileNode;
    onSave?: (file: FileNode, content: string) => void;
    className?: string;
}

/**
 * Renders a source editor with syntax highlighting and a 500ms debounced
 * N-gram completion popup with one to five suggestions.
 * @param props - File node and save callback.
 * @example
 * <Editor file={file} />
 * @returns An editable file panel.
 */
const Editor: FC<EditorProps> = ({
    file,
    onSave,
    className = "",
}: EditorProps): ReactNode => {
    const extension: Extension = file.extension ?? extensionOf(file.name);
    const [source, setSource]: [string, (next: string) => void] = useState<string>(file.content ?? "");
    const [caret, setCaret]: [number, (next: number) => void] = useState<number>(source.length);
    const [visited, setVisited]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const [completionIndex, setCompletionIndex]: [number, (next: number) => void] = useState<number>(0);
    const [completionHidden, setCompletionHidden]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const editorRef: RefObject<HTMLTextAreaElement | null> =
        useRef<HTMLTextAreaElement | null>(null);
    const debounced: string = useDebouncedValue(source, 500);
    const settled: boolean = debounced === source;
    const ngram: readonly EditorCompletion[] = useMemo((): readonly EditorCompletion[] => {
        if (!settled) {
            return [];
        }

        const model: NgramModel = buildNgramModel(debounced);
        const suggestions: readonly CompletionSuggestion[] = getCompletions(
            debounced,
            caret,
            model,
            5,
        );

        return suggestions.map(
            (suggestion: CompletionSuggestion): EditorCompletion => ({
                label: suggestion.value,
                detail: `N-gram · ${suggestion.score}`,
                insertText: suggestion.value,
            }),
        );
    }, [settled, debounced, caret]);
    const completions: readonly EditorCompletion[] = ngram.slice(0, 5);
    const activeIndex: number = Math.min(
        Math.max(0, completionIndex),
        Math.max(0, completions.length - 1),
    );
    const showCompletions: boolean =
        visited && settled && !completionHidden && completions.length > 0;
    const highlight: string = useMemo((): string => {
        const rendered: RenderedFile = renderFile({ ...file, content: source });

        return rendered.mode === "code"
            ? `<pre><code>${rendered.html}</code></pre>`
            : rendered.html;
    }, [file, source]);

    const change: (event: ChangeEvent<HTMLTextAreaElement>) => void = (
        event: ChangeEvent<HTMLTextAreaElement>,
    ): void => {
        setSource(event.target.value);
        setCaret(event.target.selectionStart);
        setVisited(true);
        setCompletionHidden(false);
        setCompletionIndex(0);
    };

    const select: (item: EditorCompletion) => void = (item: EditorCompletion): void => {
        const before: string = source.slice(0, caret);
        const word: RegExpMatchArray | null = before.match(/[\p{L}\p{N}_$]+$/u);
        const start: number = caret - (word?.[0].length ?? 0);
        const nextSource: string = `${source.slice(0, start)}${item.insertText}${source.slice(caret)}`;
        const nextCaret: number = start + item.insertText.length;
        setSource(nextSource);
        setCaret(nextCaret);
        setCompletionHidden(true);
        window.requestAnimationFrame((): void => {
            editorRef.current?.focus({ preventScroll: true });
            editorRef.current?.setSelectionRange(nextCaret, nextCaret);
        });
    };

    const keyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void = (
        event: ReactKeyboardEvent<HTMLTextAreaElement>,
    ): void => {
        if (!showCompletions) {
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const step: number = event.key === "ArrowDown" ? 1 : -1;
            setCompletionIndex(
                (activeIndex + step + completions.length) % completions.length,
            );
        } else if (event.key === "Enter" || event.key === "Tab") {
            event.preventDefault();
            select(completions[activeIndex]);
        } else if (event.key === "Escape") {
            event.preventDefault();
            setCompletionHidden(true);
        }
    };

    const save: () => void = (): void => {
        onSave?.(file, source);
    };

    return (
        <section className={cx("file-editor", className)}>
            <header className="file-editor__header">
                <span className="file-editor__name">{file.name}</span>
                <span className="file-editor__meta">{extension || "text"}</span>
                <Badge tone="neutral">Edit</Badge>
            </header>
            <div className="file-editor__body">
                <div className="file-editor__surface">
                    <textarea
                        ref={editorRef}
                        className="file-editor__input"
                        value={source}
                        spellCheck={false}
                        aria-label={`Edit ${file.name}`}
                        onChange={change}
                        onKeyDown={keyDown}
                        onSelect={(event: SyntheticEvent<HTMLTextAreaElement>): void =>
                            setCaret(event.currentTarget.selectionStart)
                        }
                    />
                    <div
                        className="file-editor__highlight"
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{ ["__html"]: highlight }}
                    />
                    {showCompletions ? (
                        <div
                            className="file-editor__completions"
                            role="listbox"
                            aria-label="Completions"
                        >
                            <div className="file-editor__completions-title">
                                N-gram · {completions.length} of 5
                            </div>
                            {completions.map(
                                (item: EditorCompletion, index: number): ReactNode => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        role="option"
                                        aria-selected={index === activeIndex}
                                        className={cx(
                                            "file-editor__completion",
                                            index === activeIndex &&
                                                "file-editor__completion--active",
                                        )}
                                        onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>): void => event.preventDefault()}
                                        onClick={(): void => select(item)}
                                    >
                                        <span>{item.label}</span>
                                        <small>ngram</small>
                                    </button>
                                ),
                            )}
                        </div>
                    ) : null}
                </div>
                <div className="file-editor__footer">
                    <span>{source.length} characters</span>
                    <Button size="sm" onClick={save}>
                        Save
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default Editor;
