import type { Extension } from "./extension";
import { extensionOf } from "./extension";
import type { FileNode } from "./project";
import { flattenFiles } from "./project";

/**
 * Kind of import relationship found in a file.
 * Type: type alias.
 * Fields: none.
 * @example
 * const kind: ImportKind = "static";
 */
export type ImportKind = "static" | "dynamic" | "export" | "include" | "use" | "reference";

/**
 * One import relationship in a file.
 * Type: interface.
 * Fields: id, from, specifier, names, kind, typeOnly.
 * @example
 * const record: ImportRecord = {
 *     id: "src/App.tsx:0",
 *     from: "src/App.tsx",
 *     specifier: "./Button",
 *     names: ["Button"],
 *     kind: "static",
 * };
 */
export interface ImportRecord {
    id: string;
    from: string;
    specifier: string;
    names: readonly string[];
    kind: ImportKind;
    typeOnly?: boolean;
}

const javascriptExtensions: readonly Extension[] = ["js", "mjs", "jsx", "ts", "mts", "tsx"];

/**
 * Extracts named bindings from an import clause.
 * @param clause - Text between `import` and `from`.
 * @example
 * const names = importNames("{ Button, Card as Panel }, React");
 * @returns Imported binding names.
 */
const importNames: (clause: string) => readonly string[] = (
    clause: string,
): readonly string[] => {
    const names: string[] = [];
    const braces: RegExpMatchArray | null = clause.match(/\{([^}]*)\}/);

    if (braces !== null) {
        for (const part of braces[1].split(",")) {
            const name: string = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];

            if (name.length > 0) {
                names.push(name);
            }
        }
    }

    const prefix: string = clause.replace(/\{[^}]*\}/, "").replace(/,/g, " ").trim();

    if (prefix.length > 0) {
        names.push(prefix.replace(/^\*\s+as\s+/, ""));
    }

    return names;
};

/**
 * Parses source-level imports for a project file.
 * @param file - File node with optional content.
 * @example
 * const imports = parseImports(file);
 * @returns Import relationships in source order.
 */
export const parseImports: (file: FileNode) => readonly ImportRecord[] = (
    file: FileNode,
): readonly ImportRecord[] => {
    const content: string = file.content ?? "";
    const extension: Extension = file.extension ?? extensionOf(file.name);
    const records: ImportRecord[] = [];

    if (file.kind !== "file" || content.length === 0) {
        return records;
    }

    if (javascriptExtensions.includes(extension)) {
        const staticPattern: RegExp =
            /^\s*import\s+([^\n;]*?)\s+from\s+["']([^"']+)["']/gm;

        for (const match of content.matchAll(staticPattern)) {
            records.push({
                id: `${file.id}:import:${records.length}`,
                from: file.path,
                specifier: match[2],
                names: importNames(match[1]),
                kind: "static",
                typeOnly: /^\s*import\s+type\b/.test(match[0]),
            });
        }

        const sideEffectPattern: RegExp = /^\s*import\s+["']([^"']+)["']/gm;

        for (const match of content.matchAll(sideEffectPattern)) {
            records.push({
                id: `${file.id}:import:${records.length}`,
                from: file.path,
                specifier: match[1],
                names: [],
                kind: "static",
            });
        }

        const exportFromPattern: RegExp =
            /^\s*export\s+([^\n;]*?)\s+from\s+["']([^"']+)["']/gm;

        for (const match of content.matchAll(exportFromPattern)) {
            records.push({
                id: `${file.id}:import:${records.length}`,
                from: file.path,
                specifier: match[2],
                names: importNames(match[1]),
                kind: "export",
            });
        }

        const dynamicPattern: RegExp = /\bimport\(\s*["']([^"']+)["']\s*\)/g;

        for (const match of content.matchAll(dynamicPattern)) {
            records.push({
                id: `${file.id}:import:${records.length}`,
                from: file.path,
                specifier: match[1],
                names: [],
                kind: "dynamic",
            });
        }
    } else if (extension === "py") {
        const fromPattern: RegExp = /^\s*from\s+([.\w]+)\s+import\s+([^\n]+)/gm;

        for (const match of content.matchAll(fromPattern)) {
            records.push({
                id: `${file.id}:import:${records.length}`,
                from: file.path,
                specifier: match[1],
                names: match[2]
                    .split(",")
                    .map((name: string): string => name.trim().split(/\s+as\s+/)[0]),
                kind: "static",
            });
        }

        const plainPattern: RegExp = /^\s*import\s+([^\n]+)/gm;

        for (const match of content.matchAll(plainPattern)) {
            records.push({
                id: `${file.id}:import:${records.length}`,
                from: file.path,
                specifier: match[1].split(",")[0].trim(),
                names: [],
                kind: "static",
            });
        }
    } else if (
        extension === "c"
        || extension === "h"
        || extension === "cpp"
        || extension === "hpp"
    ) {
        const includePattern: RegExp = /#\s*include\s+[<"]([^">]+)[">]/g;

        for (const match of content.matchAll(includePattern)) {
            records.push({
                id: `${file.id}:import:${records.length}`,
                from: file.path,
                specifier: match[1],
                names: [],
                kind: "include",
            });
        }
    } else if (extension === "rs") {
        const usePattern: RegExp = /^\s*use\s+([^;]+);/gm;

        for (const match of content.matchAll(usePattern)) {
            records.push({
                id: `${file.id}:import:${records.length}`,
                from: file.path,
                specifier: match[1].trim(),
                names: [],
                kind: "use",
            });
        }
    } else if (extension === "tex") {
        const inputPattern: RegExp = /\\(?:input|include|bibliography)\{([^}]+)\}/g;

        for (const match of content.matchAll(inputPattern)) {
            records.push({
                id: `${file.id}:import:${records.length}`,
                from: file.path,
                specifier: match[1],
                names: [],
                kind: "reference",
            });
        }
    }

    return records;
};

/**
 * Normalises a project-relative path without Node's path module.
 * @param value - Path to normalise.
 * @example
 * const path = normalizePath("src/../src/App.tsx");
 * @returns A normalised path.
 */
const normalizePath: (value: string) => string = (value: string): string => {
    const parts: string[] = [];

    for (const part of value.replace(/\\/g, "/").split("/")) {
        if (part === "" || part === ".") {
            continue;
        }

        if (part === "..") {
            parts.pop();
        } else {
            parts.push(part);
        }
    }

    return parts.join("/");
};

/**
 * Resolves a relative specifier against a source file and project tree.
 * @param file - Importing file.
 * @param specifier - Import specifier.
 * @param files - Root file nodes.
 * @example
 * const target = resolveImport(file, "./Button", project.files);
 * @returns The matching file node, or null for an external package.
 */
export const resolveImport: (
    file: FileNode,
    specifier: string,
    files: readonly FileNode[],
) => FileNode | null = (
    file: FileNode,
    specifier: string,
    files: readonly FileNode[],
): FileNode | null => {
    if (!specifier.startsWith(".")) {
        return null;
    }

    const directory: string = file.path.slice(0, Math.max(0, file.path.lastIndexOf("/")));
    const base: string = normalizePath(`${directory}/${specifier}`);
    const candidates: string[] = [
        base,
        ...["ts", "tsx", "mts", "js", "mjs", "jsx", "md", "txt", "tex", "bib"].map(
            (extension: string): string => `${base}.${extension}`,
        ),
        ...[
            "ts",
            "tsx",
            "mts",
            "js",
            "mjs",
            "jsx",
        ].map((extension: string): string => `${base}/index.${extension}`),
    ];
    const all: readonly FileNode[] = flattenFiles(files);
    const target: FileNode | null =
        all.find((node: FileNode): boolean => node.path === base && node.kind === "file") ?? null;

    if (target !== null) {
        return target;
    }

    for (const candidate of candidates) {
        const match: FileNode | null =
            all.find(
                (node: FileNode): boolean => node.path === candidate && node.kind === "file",
            ) ?? null;

        if (match !== null) {
            return match;
        }
    }

    return null;
};
