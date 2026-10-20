/* eslint-disable @typescript-eslint/naming-convention -- CodeMirror theme selector keys. */
import {
    useEffect,
    useRef,
    useState,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
} from "react";
import { minimalSetup } from "codemirror";
import { Compartment, EditorState, Prec, type Extension, type Line } from "@codemirror/state";
import {
    EditorView,
    highlightActiveLine,
    highlightActiveLineGutter,
    keymap,
    lineNumbers,
    type ViewUpdate,
} from "@codemirror/view";
import { indentWithTab, redo, redoDepth, undo, undoDepth } from "@codemirror/commands";
import { bracketMatching, foldGutter, indentOnInput } from "@codemirror/language";
import { searchKeymap } from "@codemirror/search";
import Badge from "../../component/badge/Badge";
import Button from "../../component/button/Button";
import cx from "../../component/foundation/cx";
import useMergedRef from "../../component/foundation/useMergedRef";
import type { Extension as FileExtension } from "./extension";
import { extensionOf } from "./extension";
import type { FileNode } from "./project";
import { languageExtension } from "./editor/language";
import "./FileTools.css";

/**
 * Cursor and selection anchors reported by the editor.
 * Type: interface.
 * Fields: line, column, head, anchor, selectionLength.
 * @example
 * const cursor: EditorCursor = { line: 1, column: 1, head: 0, anchor: 0, selectionLength: 0 };
 */
export interface EditorCursor {
    line: number;
    column: number;
    head: number;
    anchor: number;
    selectionLength: number;
}

/**
 * Selected text reported by the editor.
 * Type: interface.
 * Fields: from, to, text, empty.
 * @example
 * const selection: EditorSelection = { from: 0, to: 0, text: "", empty: true };
 */
export interface EditorSelection {
    from: number;
    to: number;
    text: string;
    empty: boolean;
}

/**
 * Props for the CodeMirror-backed file editor.
 * Type: interface.
 * Fields: file, onSave, onChange, onEditorFocus, onEditorBlur, onEditorKeyDown,
 * onCursorChange, onSelectionChange, onViewReady, viewRef, readOnly, wrap,
 * tabSize, autoFocus, saveLabel, className, ref.
 * Native section attributes and events are forwarded to the root element.
 * @example
 * <Editor
 *     file={file}
 *     onSave={(next, content) => save(next, content)}
 *     onEditorKeyDown={(event, view) => event.key === "Escape" && view.contentDOM.blur()}
 * />
 */
export interface EditorProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "onChange"> {
    file: FileNode;
    onSave?: (file: FileNode, content: string) => void;
    onChange?: (content: string, file: FileNode) => void;
    onEditorFocus?: (view: EditorView, file: FileNode) => void;
    onEditorBlur?: (view: EditorView, file: FileNode) => void;
    onEditorKeyDown?: (event: KeyboardEvent, view: EditorView, file: FileNode) => boolean | void;
    onCursorChange?: (cursor: EditorCursor, file: FileNode) => void;
    onSelectionChange?: (selection: EditorSelection, file: FileNode) => void;
    onViewReady?: (view: EditorView) => void;
    viewRef?: Ref<EditorView | null>;
    readOnly?: boolean;
    wrap?: boolean;
    tabSize?: number;
    autoFocus?: boolean;
    saveLabel?: string;
    className?: string;
    ref?: Ref<HTMLElement>;
}

interface EditorCallbacks {
    onSave?: EditorProps["onSave"];
    onChange?: EditorProps["onChange"];
    onEditorFocus?: EditorProps["onEditorFocus"];
    onEditorBlur?: EditorProps["onEditorBlur"];
    onEditorKeyDown?: EditorProps["onEditorKeyDown"];
    onCursorChange?: EditorProps["onCursorChange"];
    onSelectionChange?: EditorProps["onSelectionChange"];
    onViewReady?: EditorProps["onViewReady"];
}

interface CursorStatus {
    line: number;
    column: number;
}

const editorTheme: Extension = EditorView.theme({
    "&": {
        height: "100%",
        backgroundColor: "transparent",
        color: "var(--text)",
        fontSize: "12px",
    },
    ".cm-scroller": {
        fontFamily: "var(--font-mono)",
        lineHeight: "1.6",
        overflow: "auto",
    },
    ".cm-content": {
        padding: "16px 0",
        caretColor: "var(--color-primary)",
    },
    ".cm-line": {
        padding: "0 16px",
    },
    ".cm-gutters": {
        backgroundColor: "var(--color-surface-container-lowest)",
        borderRight: "1px solid var(--line)",
        color: "var(--faint)",
        fontFamily: "var(--font-mono)",
        minWidth: "52px",
    },
    ".cm-lineNumbers .cm-gutterElement": {
        padding: "0 8px 0 4px",
    },
    ".cm-activeLine": {
        backgroundColor: "var(--color-surface-container-low)",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "transparent",
        color: "var(--color-primary)",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
        backgroundColor: "var(--color-primary-container)",
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--color-primary)",
    },
    "&.cm-focused": {
        outline: "none",
    },
});

/**
 * Builds the read-only and editability extensions for one editor state.
 * @param readOnly - Whether user edits are rejected.
 * @example
 * const extensions = readOnlyExtensions(true);
 * @returns Both facets that together form a read-only editor.
 */
const readOnlyExtensions: (readOnly: boolean) => readonly Extension[] = (
    readOnly: boolean,
): readonly Extension[] => [
    EditorState.readOnly.of(readOnly),
    EditorView.editable.of(!readOnly),
];

/**
 * Renders a CodeMirror 6 editor with language support, history, search,
 * bracket handling, and multiple selections. No completion UI is included.
 * Native section attributes and events are forwarded to the root, while
 * editor-level focus, blur, and keydown callbacks are driven by CodeMirror.
 * Returning `true` from `onEditorKeyDown` prevents CodeMirror's default handling.
 * @param props - File, save/change callbacks, editor configuration, and native attributes.
 * @example
 * <Editor file={file} viewRef={viewRef} onSave={save} />
 * @returns A CodeMirror editor panel.
 */
const Editor: FC<EditorProps> = ({
    file,
    onSave,
    onChange,
    onEditorFocus,
    onEditorBlur,
    onEditorKeyDown,
    onCursorChange,
    onSelectionChange,
    onViewReady,
    viewRef,
    readOnly = false,
    wrap = false,
    tabSize = 4,
    autoFocus = false,
    saveLabel = "Save",
    className = "",
    "aria-label": ariaLabel,
    ref,
    ...rest
}: EditorProps): ReactNode => {
    const extension: FileExtension = file.extension ?? extensionOf(file.name);
    const resolvedTabSize: number =
        Number.isFinite(tabSize) && tabSize > 0 ? Math.floor(tabSize) : 4;
    const hostRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const internalViewRef: RefObject<EditorView | null> = useRef<EditorView | null>(null);
    const mergedViewRef: RefCallback<EditorView | null> = useMergedRef<EditorView | null>(
        internalViewRef,
        viewRef,
    );
    const languageCompartment: RefObject<Compartment> = useRef<Compartment>(
        new Compartment(),
    );
    const readOnlyCompartment: RefObject<Compartment> = useRef<Compartment>(
        new Compartment(),
    );
    const wrapCompartment: RefObject<Compartment> = useRef<Compartment>(
        new Compartment(),
    );
    const tabCompartment: RefObject<Compartment> = useRef<Compartment>(
        new Compartment(),
    );
    const syncingRef: RefObject<boolean> = useRef<boolean>(false);
    const [canUndo, setCanUndo]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const [canRedo, setCanRedo]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const [cursor, setCursor]: [CursorStatus, (next: CursorStatus) => void] =
        useState<CursorStatus>({ line: 1, column: 1 });
    const [characters, setCharacters]: [number, (next: number) => void] = useState<number>(
        file.content?.length ?? 0,
    );

    const callbacksRef: RefObject<EditorCallbacks> = useRef<EditorCallbacks>({
        onSave,
        onChange,
        onEditorFocus,
        onEditorBlur,
        onEditorKeyDown,
        onCursorChange,
        onSelectionChange,
        onViewReady,
    });
    const fileRef: RefObject<FileNode> = useRef(file);

    useEffect((): void => {
        fileRef.current = file;
    }, [file]);

    useEffect((): void => {
        callbacksRef.current = {
            onSave,
            onChange,
            onEditorFocus,
            onEditorBlur,
            onEditorKeyDown,
            onCursorChange,
            onSelectionChange,
            onViewReady,
        };
    });

    useEffect((): (() => void) => {
        const host: HTMLDivElement | null = hostRef.current;

        if (host === null) {
            return (): void => {};
        }

        const extensions: readonly Extension[] = [
            minimalSetup,
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            foldGutter(),
            bracketMatching(),
            indentOnInput(),
            keymap.of(searchKeymap),
            keymap.of([
                {
                    key: "Mod-s",
                    run: (view: EditorView): boolean => {
                        callbacksRef.current.onSave?.(fileRef.current, `${view.state.doc}`);
                        return true;
                    },
                },
                indentWithTab,
            ]),
            languageCompartment.current.of(languageExtension(extension)),
            readOnlyCompartment.current.of(readOnlyExtensions(readOnly)),
            wrapCompartment.current.of(wrap ? EditorView.lineWrapping : []),
            tabCompartment.current.of(EditorState.tabSize.of(resolvedTabSize)),
            editorTheme,
            EditorView.updateListener.of((update: ViewUpdate): void => {
                const callbacks: EditorCallbacks = callbacksRef.current;

                if (update.docChanged) {
                    const content: string = `${update.state.doc}`;

                    if (!syncingRef.current) {
                        callbacks.onChange?.(content, fileRef.current);
                    }

                    setCharacters(content.length);
                }

                if (update.focusChanged) {
                    if (update.view.hasFocus) {
                        callbacks.onEditorFocus?.(update.view, fileRef.current);
                    } else {
                        callbacks.onEditorBlur?.(update.view, fileRef.current);
                    }
                }

                const head: number = update.state.selection.main.head;
                const anchor: number = update.state.selection.main.anchor;
                const line: Line = update.state.doc.lineAt(head);
                const column: number = head - line.from + 1;
                setCanUndo(undoDepth(update.state) > 0);
                setCanRedo(redoDepth(update.state) > 0);
                setCursor({ line: line.number, column });

                if (update.selectionSet) {
                    callbacks.onSelectionChange?.(
                        {
                            from: update.state.selection.main.from,
                            to: update.state.selection.main.to,
                            text: update.state.sliceDoc(
                                update.state.selection.main.from,
                                update.state.selection.main.to,
                            ),
                            empty: update.state.selection.main.from === update.state.selection.main.to,
                        },
                        fileRef.current,
                    );
                }

                if (update.selectionSet || update.docChanged) {
                    callbacks.onCursorChange?.(
                        {
                            line: line.number,
                            column,
                            head,
                            anchor,
                            selectionLength: Math.abs(head - anchor),
                        },
                        fileRef.current,
                    );
                }
            }),
            Prec.highest(
                EditorView.domEventHandlers({
                    keydown: (event: KeyboardEvent, view: EditorView): boolean => {
                        const handler: EditorProps["onEditorKeyDown"] =
                            callbacksRef.current.onEditorKeyDown;

                        return handler === (void 0)
                            ? false
                            : handler(event, view, fileRef.current) === true;
                    },
                }),
            ),
        ];
        const view: EditorView = new EditorView({
            state: EditorState.create({
                doc: file.content ?? "",
                extensions,
            }),
            parent: host,
        });
        internalViewRef.current = view;
        mergedViewRef(view);
        callbacksRef.current.onViewReady?.(view);

        return (): void => {
            mergedViewRef(null);
            view.destroy();
            internalViewRef.current = null;
        };
        // The view is created once; prop changes are applied by reconfigure effects.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect((): void => {
        const view: EditorView | null = internalViewRef.current;

        if (view === null) {
            return;
        }

        const next: string = file.content ?? "";
        const current: string = `${view.state.doc}`;

        if (next !== current) {
            syncingRef.current = true;

            try {
                view.dispatch({
                    changes: { from: 0, to: current.length, insert: next },
                });
            } finally {
                syncingRef.current = false;
            }
        }
    }, [file.content]);

    useEffect((): void => {
        internalViewRef.current?.dispatch({
            effects: languageCompartment.current.reconfigure(languageExtension(extension)),
        });
    }, [extension]);

    useEffect((): void => {
        internalViewRef.current?.dispatch({
            effects: readOnlyCompartment.current.reconfigure(readOnlyExtensions(readOnly)),
        });
    }, [readOnly]);

    useEffect((): void => {
        internalViewRef.current?.dispatch({
            effects: wrapCompartment.current.reconfigure(
                wrap ? EditorView.lineWrapping : [],
            ),
        });
    }, [wrap]);

    useEffect((): void => {
        internalViewRef.current?.dispatch({
            effects: tabCompartment.current.reconfigure(
                EditorState.tabSize.of(resolvedTabSize),
            ),
        });
    }, [resolvedTabSize]);

    useEffect((): void => {
        if (autoFocus) {
            internalViewRef.current?.focus();
        }
    }, [autoFocus]);

    const undoAction: () => void = (): void => {
        const view: EditorView | null = internalViewRef.current;

        if (view !== null) {
            undo(view);
            view.focus();
        }
    };

    const redoAction: () => void = (): void => {
        const view: EditorView | null = internalViewRef.current;

        if (view !== null) {
            redo(view);
            view.focus();
        }
    };

    const save: () => void = (): void => {
        const view: EditorView | null = internalViewRef.current;

        callbacksRef.current.onSave?.(
            fileRef.current,
            view === null ? (fileRef.current.content ?? "") : `${view.state.doc}`,
        );
    };

    return (
        <section
            {...rest}
            ref={ref}
            className={cx("file-editor", "code-editor", className)}
            aria-label={ariaLabel ?? `${file.name} editor`}
            data-file-id={file.id}
            data-language={extension || "text"}
            data-read-only={readOnly ? "true" : "false"}
            data-wrap={wrap ? "true" : "false"}
            data-tab-size={resolvedTabSize}
        >
            <header className="file-editor__header">
                <span className="file-editor__name">{file.name}</span>
                <span className="file-editor__meta">{extension || "text"}</span>
                <Badge tone="neutral">CodeMirror</Badge>
                <div className="file-editor__actions" role="toolbar" aria-label="Editor history">
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={!canUndo || readOnly}
                        onClick={undoAction}
                        aria-label="Undo"
                    >
                        Undo
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={!canRedo || readOnly}
                        onClick={redoAction}
                        aria-label="Redo"
                    >
                        Redo
                    </Button>
                </div>
            </header>
            <div ref={hostRef} className="code-mirror" />
            <footer className="file-editor__footer">
                <span>
                    Ln {cursor.line}, Col {cursor.column}
                </span>
                <span>{characters} characters</span>
                <Button size="sm" onClick={save} aria-label={saveLabel}>
                    {saveLabel}
                </Button>
            </footer>
        </section>
    );
};

export default Editor;
