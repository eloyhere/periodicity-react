import type { Extension } from "./extension";
import type { Language } from "./language";
import type { PackageManager } from "./manager";

/**
 * Kind of node held by a project tree.
 * Type: type alias.
 * Fields: none.
 * @example
 * const kind: FileKind = "directory";
 */
export type FileKind = "file" | "directory";

/**
 * One file or directory node in a project.
 * Type: interface.
 * Fields: id, name, path, kind, content, language, extension, children, layer,
 * references.
 * @example
 * const file: FileNode = { id: "src", name: "src", path: "src", kind: "directory" };
 */
export interface FileNode {
    id: string;
    name: string;
    path: string;
    kind: FileKind;
    content?: string;
    language?: Language;
    extension?: Extension;
    children?: readonly FileNode[];
    layer?: string;
    references?: readonly string[];
}

/**
 * A project loaded into the manager.
 * Type: interface.
 * Fields: id, name, description, manager, language, root, entry, files.
 * @example
 * const project: Project = {
 *     id: "app",
 *     name: "App",
 *     manager: "pnpm",
 *     language: "TypeScript",
 *     root: "app",
 *     files: [],
 * };
 */
export interface Project {
    id: string;
    name: string;
    description?: string;
    manager: PackageManager;
    language: Language;
    root: string;
    entry?: string;
    files: readonly FileNode[];
}

/**
 * A management view shown by the project pager.
 * Type: type alias.
 * Fields: none.
 * @example
 * const mode: ProjectMode = "dependencies";
 */
export type ProjectMode =
    | "files"
    | "preview"
    | "edit"
    | "architecture"
    | "dependencies"
    | "imports"
    | "exports";

/**
 * Flattens a file tree into depth-first order.
 * @param files - Root nodes.
 * @example
 * const all = flattenFiles(project.files);
 * @returns Every file and directory node.
 */
export const flattenFiles: (files: readonly FileNode[]) => readonly FileNode[] = (
    files: readonly FileNode[],
): readonly FileNode[] => {
    const result: FileNode[] = [];
    const stack: FileNode[] = [...files].reverse();

    while (stack.length > 0) {
        const node: FileNode = stack.pop() as FileNode;
        result.push(node);

        const children: readonly FileNode[] = node.children ?? [];

        for (let index: number = children.length - 1; index >= 0; index -= 1) {
            stack.push(children[index]);
        }
    }

    return result;
};

/**
 * Finds a node by id.
 * @param files - Root nodes.
 * @param id - Node id.
 * @example
 * const file = findFile(project.files, "src/App.tsx");
 * @returns The node, or null.
 */
export const findFile: (files: readonly FileNode[], id: string) => FileNode | null = (
    files: readonly FileNode[],
    id: string,
): FileNode | null =>
    flattenFiles(files).find((node: FileNode): boolean => node.id === id) ?? null;

/**
 * Collects ids of every directory node for default expansion.
 * @param files - Root nodes.
 * @example
 * const expanded = directoryKeys(project.files);
 * @returns Directory ids.
 */
export const directoryKeys: (files: readonly FileNode[]) => ReadonlySet<string> = (
    files: readonly FileNode[],
): ReadonlySet<string> =>
    new Set<string>(
        flattenFiles(files)
            .filter((node: FileNode): boolean => node.kind === "directory")
            .map((node: FileNode): string => node.id),
    );

/**
 * Infers a coarse architecture layer from a path.
 * @param path - Project-relative path.
 * @example
 * const layer = inferLayer("src/component/Button.tsx");
 * @returns A layer label.
 */
export const inferLayer: (path: string) => string = (path: string): string => {
    const lower: string = path.toLowerCase();

    if (lower.includes("layout")) {
        return "Layout";
    }

    if (lower.includes("component")) {
        return "Components";
    }

    if (lower.includes("data") || lower.includes("adapter")) {
        return "Data";
    }

    if (lower.includes("chapter") || lower.includes("part") || lower.includes("book")) {
        return "Manuscript";
    }

    if (lower.includes("test")) {
        return "Tests";
    }

    return "Source";
};

/**
 * Updates one file node without mutating the tree.
 * @param files - Root nodes.
 * @param id - File id to update.
 * @param content - Replacement content.
 * @example
 * const next = updateFileContent(project.files, "src/App.tsx", source);
 * @returns A new file tree.
 */
export const updateFileContent: (
    files: readonly FileNode[],
    id: string,
    content: string,
) => readonly FileNode[] = (
    files: readonly FileNode[],
    id: string,
    content: string,
): readonly FileNode[] =>
    files.map((node: FileNode): FileNode => {
        if (node.id === id) {
            return { ...node, content };
        }

        if (node.children === (void 0)) {
            return node;
        }

        return { ...node, children: updateFileContent(node.children, id, content) };
    });
