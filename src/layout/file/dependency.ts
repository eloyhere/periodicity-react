import type { PackageManager } from "./manager";
import type { FileNode } from "./project";
import { flattenFiles } from "./project";
import type { ImportRecord } from "./importation";
import { parseImports, resolveImport } from "./importation";

/**
 * Kind of external project dependency.
 * Type: type alias.
 * Fields: none.
 * @example
 * const kind: DependencyKind = "reference";
 */
export type DependencyKind = "package" | "reference";

/**
 * A package or bibliography dependency held by a project.
 * Type: interface.
 * Fields: id, name, kind, version, manager, source, reference.
 * @example
 * const dependency: ProjectDependency = {
 *     id: "react",
 *     name: "react",
 *     version: "^19.0.0",
 *     kind: "package",
 * };
 */
export interface ProjectDependency {
    id: string;
    name: string;
    kind: DependencyKind;
    version?: string;
    manager?: PackageManager;
    source?: string;
    reference?: string;
}

/**
 * Kind of node in the combined dependency graph.
 * Type: type alias.
 * Fields: none.
 * @example
 * const kind: DependencyNodeKind = "package";
 */
export type DependencyNodeKind = "file" | "package" | "reference";

/**
 * One node in the dependency graph.
 * Type: interface.
 * Fields: id, label, kind, path, version, source.
 * @example
 * const node: DependencyNode = { id: "react", label: "react", kind: "package" };
 */
export interface DependencyNode {
    id: string;
    label: string;
    kind: DependencyNodeKind;
    path?: string;
    version?: string;
    source?: string;
}

/**
 * One directed dependency edge.
 * Type: interface.
 * Fields: id, from, to, specifier, kind.
 * @example
 * const edge: DependencyEdge = {
 *     id: "edge-1",
 *     from: "src/App.tsx",
 *     to: "src/Button.tsx",
 *     specifier: "./Button",
 *     kind: "import",
 * };
 */
export interface DependencyEdge {
    id: string;
    from: string;
    to: string;
    specifier: string;
    kind: "import" | "export" | "package" | "reference";
}

/**
 * Read-only dependency graph shared by the dependency and architecture views.
 * Type: interface.
 * Fields: nodes, edges, outgoing, incoming.
 * @example
 * const graph = createDependencyGraph(project.files, dependencies);
 */
export interface DependencyGraph {
    readonly nodes: readonly DependencyNode[];
    readonly edges: readonly DependencyEdge[];
    outgoing(id: string): readonly DependencyEdge[];
    incoming(id: string): readonly DependencyEdge[];
}

/**
 * Builds a graph from file imports, explicit packages, and references.
 * @param files - Project file roots.
 * @param dependencies - Package and bibliography dependencies.
 * @example
 * const graph = createDependencyGraph(project.files, dependencies);
 * @returns A dependency graph.
 */
export const createDependencyGraph: (
    files: readonly FileNode[],
    dependencies?: readonly ProjectDependency[],
) => DependencyGraph = (
    files: readonly FileNode[],
    dependencies: readonly ProjectDependency[] = [],
): DependencyGraph => {
    const fileNodes: readonly FileNode[] = flattenFiles(files).filter(
        (node: FileNode): boolean => node.kind === "file",
    );
    const nodes: Map<string, DependencyNode> = new Map<string, DependencyNode>();
    const edges: DependencyEdge[] = [];

    for (const file of fileNodes) {
        nodes.set(file.id, {
            id: file.id,
            label: file.name,
            kind: "file",
            path: file.path,
        });
    }

    for (const dependency of dependencies) {
        nodes.set(dependency.id, {
            id: dependency.id,
            label: dependency.name,
            kind: dependency.kind,
            path: dependency.source,
            version: dependency.version,
            source: dependency.reference,
        });
    }

    const addPackage: (specifier: string) => string = (specifier: string): string => {
        const id: string = `package:${specifier}`;

        if (!nodes.has(id)) {
            nodes.set(id, {
                id,
                label: specifier,
                kind: "package",
                version: (void 0),
            });
        }

        return id;
    };

    for (const file of fileNodes) {
        const imports: readonly ImportRecord[] = parseImports(file);

        for (const record of imports) {
            const target: FileNode | null = resolveImport(file, record.specifier, files);

            if (target !== null) {
                edges.push({
                    id: `${record.id}:edge`,
                    from: file.id,
                    to: target.id,
                    specifier: record.specifier,
                    kind: record.kind === "export" ? "export" : "import",
                });
            } else if (!record.specifier.startsWith(".")) {
                edges.push({
                    id: `${record.id}:edge`,
                    from: file.id,
                    to: addPackage(record.specifier),
                    specifier: record.specifier,
                    kind: "package",
                });
            }
        }

        for (const reference of file.references ?? []) {
            const id: string = `reference:${reference}`;

            if (!nodes.has(id)) {
                nodes.set(id, {
                    id,
                    label: reference,
                    kind: "reference",
                    version: (void 0),
                });
            }

            edges.push({
                id: `${file.id}:reference:${reference}`,
                from: file.id,
                to: id,
                specifier: reference,
                kind: "reference",
            });
        }
    }

    return {
        nodes: [...nodes.values()],
        edges,
        outgoing: (id: string): readonly DependencyEdge[] =>
            edges.filter((edge: DependencyEdge): boolean => edge.from === id),
        incoming: (id: string): readonly DependencyEdge[] =>
            edges.filter((edge: DependencyEdge): boolean => edge.to === id),
    };
};
