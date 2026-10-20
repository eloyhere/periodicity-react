import type { FileNode } from "./project";

/**
 * Kind of exported symbol or document section.
 * Type: type alias.
 * Fields: none.
 * @example
 * const kind: ExportKind = "function";
 */
export type ExportKind =
    | "function"
    | "class"
    | "const"
    | "type"
    | "interface"
    | "default"
    | "re-export"
    | "section"
    | "reference";

/**
 * One exported symbol or literature section.
 * Type: interface.
 * Fields: id, from, name, kind, line.
 * @example
 * const record: ExportRecord = {
 *     id: "src/App.tsx:0",
 *     from: "src/App.tsx",
 *     name: "App",
 *     kind: "function",
 * };
 */
export interface ExportRecord {
    id: string;
    from: string;
    name: string;
    kind: ExportKind;
    line?: number;
}

const lineAt: (content: string, index: number) => number = (
    content: string,
    index: number,
): number => content.slice(0, index).split("\n").length;

/**
 * Parses exported symbols and document sections for a project file.
 * @param file - File node with optional content.
 * @example
 * const exports = parseExports(file);
 * @returns Export relationships in source order.
 */
export const parseExports: (file: FileNode) => readonly ExportRecord[] = (
    file: FileNode,
): readonly ExportRecord[] => {
    const content: string = file.content ?? "";
    const records: ExportRecord[] = [];

    if (file.kind !== "file" || content.length === 0) {
        return records;
    }

    const push: (name: string, kind: ExportKind, index: number) => void = (
        name: string,
        kind: ExportKind,
        index: number,
    ): void => {
        const cleaned: string = name.trim();

        if (cleaned.length > 0) {
            records.push({
                id: `${file.id}:export:${records.length}`,
                from: file.path,
                name: cleaned,
                kind,
                line: lineAt(content, index),
            });
        }
    };

    const declarationPattern: RegExp =
        /^\s*export\s+(?:default\s+)?(?:async\s+)?(function|class|const|let|var|type|interface)\s+([A-Za-z_$][\w$]*)/gm;

    for (const match of content.matchAll(declarationPattern)) {
        const kind: ExportKind =
            match[1] === "let" || match[1] === "var" ? "const" : (match[1] as ExportKind);
        push(match[2], kind, match.index ?? 0);
    }

    const defaultPattern: RegExp = /^\s*export\s+default\s+(?!function|class)([A-Za-z_$][\w$]*)/gm;

    for (const match of content.matchAll(defaultPattern)) {
        push(match[1], "default", match.index ?? 0);
    }

    const namedPattern: RegExp = /^\s*export\s*\{([^}]*)\}(?!\s*from)/gm;

    for (const match of content.matchAll(namedPattern)) {
        for (const part of match[1].split(",")) {
            const name: string = part.trim().split(/\s+as\s+/)[0];
            push(name, "re-export", match.index ?? 0);
        }
    }

    const reExportPattern: RegExp = /^\s*export\s+([^;]*?)\s+from\s+["'][^"']+["']/gm;

    for (const match of content.matchAll(reExportPattern)) {
        for (const part of match[1].replace(/[{}*]/g, "").split(",")) {
            const name: string = part.trim().split(/\s+as\s+/)[0];
            push(name, "re-export", match.index ?? 0);
        }
    }

    if (file.extension === "py") {
        const pythonPattern: RegExp = /^\s*(?:async\s+)?(def|class)\s+([A-Za-z_]\w*)/gm;

        for (const match of content.matchAll(pythonPattern)) {
            push(match[2], match[1] === "def" ? "function" : "class", match.index ?? 0);
        }
    }

    if (file.extension === "rs") {
        const rustPattern: RegExp = /^\s*pub\s+(?:async\s+)?(fn|struct|enum|trait|const|type)\s+([A-Za-z_]\w*)/gm;

        for (const match of content.matchAll(rustPattern)) {
            const kind: ExportKind =
                match[1] === "fn" ? "function" : match[1] === "struct" || match[1] === "enum" ? "class" : match[1] === "trait" ? "interface" : "type";
            push(match[2], kind, match.index ?? 0);
        }
    }

    if (file.extension === "md" || file.extension === "txt") {
        const headingPattern: RegExp = /^(#{1,6})\s+(.+)$/gm;

        for (const match of content.matchAll(headingPattern)) {
            push(match[2], "section", match.index ?? 0);
        }
    }

    if (file.extension === "tex") {
        const sectionPattern: RegExp = /\\(?:chapter|section|subsection|subsubsection)\{([^}]+)\}/g;

        for (const match of content.matchAll(sectionPattern)) {
            push(match[1], "section", match.index ?? 0);
        }
    }

    if (file.extension === "bib") {
        const entryPattern: RegExp = /@\w+\s*\{\s*([^,\s]+)/g;

        for (const match of content.matchAll(entryPattern)) {
            push(match[1], "reference", match.index ?? 0);
        }
    }

    return records;
};
