import {
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FC,
    type ReactNode,
    type RefObject,
} from "react";
import Badge from "../../component/badge/Badge";
import Button from "../../component/button/Button";
import Icon, { type IconName } from "../../component/icon/Icon";
import Text from "../../component/text/Text";
import cx from "../../component/foundation/cx";
import Tree from "../tree/Tree";
import NavigationView, { type NavigationItem } from "../navigation/NavigationView";
import Pager, { PagerPage } from "../pager/Pager";
import type { Project, FileNode, ProjectMode } from "./project";
import {
    directoryKeys,
    findFile,
    flattenFiles,
    inferLayer,
    updateFileContent,
} from "./project";
import type { ProjectDependency, DependencyGraph, DependencyEdge } from "./dependency";
import { createDependencyGraph } from "./dependency";
import { dependenciesFromFiles } from "./manager";
import type { ImportRecord } from "./importation";
import { parseImports, resolveImport } from "./importation";
import type { ExportRecord } from "./exportation";
import { parseExports } from "./exportation";
import type { StructureNode } from "./structure";
import { parseStructure } from "./structure";
import type { RenderedFile } from "./render";
import { renderFile } from "./render";
import "./ProjectManager.css";

/**
 * Props for the generic project manager.
 * Type: interface.
 * Fields: project, dependencies, onFileChange, onProjectImport, onProjectExport,
 * defaultMode, className.
 * @example
 * <ProjectManager project={project} dependencies={dependencies} />
 */
export interface ProjectManagerProps {
    project: Project;
    dependencies?: readonly ProjectDependency[];
    onFileChange?: (file: FileNode, content: string) => void;
    onProjectImport?: (project: Project) => void;
    onProjectExport?: (project: Project) => void;
    defaultMode?: ProjectMode;
    className?: string;
}

const modes: readonly NavigationItem[] = [
    { value: "files", label: "Files", icon: "Folder" },
    { value: "preview", label: "Preview", icon: "View" },
    { value: "edit", label: "Edit", icon: "Pencil" },
    { value: "architecture", label: "Architecture", icon: "Tree" },
    { value: "dependencies", label: "Dependencies", icon: "Link" },
    { value: "imports", label: "Imports", icon: "Download" },
    { value: "exports", label: "Exports", icon: "Upload" },
];

const modeSet: ReadonlySet<string> = new Set<string>(
    modes.map((item: NavigationItem): string => item.value),
);

/**
 * Chooses a file icon from the node kind and language.
 * @param file - Project file node.
 * @example
 * const icon = fileIcon(file);
 * @returns An icon name.
 */
const fileIcon: (file: FileNode) => IconName = (file: FileNode): IconName => {
    if (file.kind === "directory") {
        return "Folder";
    }

    if (file.language === "Literature") {
        return "Book";
    }

    if (file.language === "Tex" || file.language === "Mathematics") {
        return "Article";
    }

    return "File";
};

interface ProjectFileTreeProps {
    files: readonly FileNode[];
    selectedId: string;
    expanded: ReadonlySet<string>;
    onExpandedChange: (keys: ReadonlySet<string>) => void;
    onSelect: (id: string) => void;
}

/**
 * Reusable project file tree used by the Files and Architecture pages.
 * @param props - Files, selection, and expansion state.
 * @example
 * <ProjectFileTree files={files} selectedId={id} expanded={keys} />
 * @returns A project tree.
 */
const ProjectFileTree: FC<ProjectFileTreeProps> = ({
    files,
    selectedId,
    expanded,
    onExpandedChange,
    onSelect,
}: ProjectFileTreeProps) => (
    <Tree
        items={files}
        getKey={(file: FileNode): string => file.id}
        getChildren={(file: FileNode): readonly FileNode[] => file.children ?? []}
        selectionMode="single"
        selectedKeys={selectedId.length > 0 ? [selectedId] : []}
        expandedKeys={expanded}
        onExpandedChange={onExpandedChange}
        onSelectionChange={(keys: readonly string[]): void => {
            if (keys[0] !== (void 0)) {
                onSelect(keys[0]);
            }
        }}
        renderItem={(file: FileNode): ReactNode => (
            <span className="project-manager__file">
                <Icon name={fileIcon(file)} size={14} />
                <span className="project-manager__file-name">{file.name}</span>
            </span>
        )}
    />
);

interface StructureOutlineProps {
    nodes: readonly StructureNode[];
    depth?: number;
}

/**
 * Renders a parsed file outline with kind labels and recursive children.
 * @param props - Structure nodes and current depth.
 * @example
 * <StructureOutline nodes={parseStructure(file).children ?? []} />
 * @returns A nested outline.
 */
const StructureOutline: FC<StructureOutlineProps> = ({
    nodes,
    depth = 0,
}: StructureOutlineProps) => (
    <ul className="project-manager__outline" data-depth={depth}>
        {nodes.map((node: StructureNode): ReactNode => (
            <li key={node.id} className="project-manager__outline-item">
                <div className="project-manager__outline-row">
                    <span className="project-manager__outline-kind">{node.kind}</span>
                    <span className="project-manager__outline-label">{node.label}</span>
                    {node.line === (void 0) ? null : (
                        <span className="project-manager__outline-line">L{node.line}</span>
                    )}
                </div>
                {node.children === (void 0) || node.children.length === 0 ? null : (
                    <StructureOutline nodes={node.children} depth={depth + 1} />
                )}
            </li>
        ))}
    </ul>
);

/**
 * Renders the project file tree, view navigation, pager pages, dependency graph,
 * preview, editor, architecture, imports, exports, and project import/export.
 * @param props - Project, dependency metadata, and change callbacks.
 * @example
 * <ProjectManager project={project} dependencies={dependencies} />
 * @returns A complete project manager.
 */
const ProjectManager: FC<ProjectManagerProps> = ({
    project,
    dependencies,
    onFileChange,
    onProjectImport,
    onProjectExport,
    defaultMode = "files",
    className = "",
}: ProjectManagerProps) => {
    const [files, setFiles]: [
        readonly FileNode[],
        (next: readonly FileNode[]) => void,
    ] = useState<readonly FileNode[]>(project.files);
    const [mode, setMode]: [ProjectMode, (next: ProjectMode) => void] =
        useState<ProjectMode>(defaultMode);
    const initialId: string =
        project.entry ?? flattenFiles(files).find((node: FileNode): boolean => node.kind === "file")?.id ?? "";
    const [selectedId, setSelectedId]: [string, (next: string) => void] =
        useState<string>(initialId);
    const selected: FileNode | null = findFile(files, selectedId);
    const [draft, setDraft]: [string, (next: string) => void] = useState<string>(
        selected?.content ?? "",
    );
    const [expanded, setExpanded]: [
        ReadonlySet<string>,
        (next: ReadonlySet<string>) => void,
    ] = useState<ReadonlySet<string>>(directoryKeys(files));
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
    const fileNodes: readonly FileNode[] = useMemo(
        (): readonly FileNode[] =>
            flattenFiles(files).filter((node: FileNode): boolean => node.kind === "file"),
        [files],
    );
    const projectDependencies: readonly ProjectDependency[] = useMemo(
        (): readonly ProjectDependency[] =>
            dependencies ?? dependenciesFromFiles(files, project.manager),
        [dependencies, files, project.manager],
    );
    const graph: DependencyGraph = useMemo(
        () => createDependencyGraph(files, projectDependencies),
        [files, projectDependencies],
    );
    const imports: readonly ImportRecord[] = useMemo(
        () => (selected === null ? [] : parseImports(selected)),
        [selected],
    );
    const exports: readonly ExportRecord[] = useMemo(
        () => (selected === null ? [] : parseExports(selected)),
        [selected],
    );
    const rendered: RenderedFile | null = useMemo(
        (): RenderedFile | null => (selected === null ? null : renderFile(selected)),
        [selected],
    );
    const packageDependencies: readonly ProjectDependency[] = projectDependencies.filter(
        (dependency: ProjectDependency): boolean => dependency.kind === "package",
    );
    const references: readonly ProjectDependency[] = projectDependencies.filter(
        (dependency: ProjectDependency): boolean => dependency.kind === "reference",
    );

    const select: (id: string) => void = (id: string): void => {
        const file: FileNode | null = findFile(files, id);

        if (file === null) {
            return;
        }

        setSelectedId(id);
        setDraft(file.content ?? "");

        if (file.kind === "file") {
            const nextExpanded: Set<string> = new Set<string>(expanded);
            const parent: string = file.path.slice(0, Math.max(0, file.path.lastIndexOf("/")));

            if (parent.length > 0) {
                nextExpanded.add(parent);
            }

            setExpanded(nextExpanded);
        }
    };

    const save: () => void = (): void => {
        if (selected === null) {
            return;
        }

        const next: readonly FileNode[] = updateFileContent(files, selected.id, draft);
        setFiles(next);
        onFileChange?.(selected, draft);
    };

    const importProject: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const file: File | undefined = event.target.files?.[0];

        if (file === (void 0)) {
            return;
        }

        void file.text().then((text: string): void => {
            try {
                const parsed: unknown = JSON.parse(text);

                if (
                    typeof parsed !== "object" ||
                    parsed === null ||
                    !Array.isArray((parsed as Project).files)
                ) {
                    return;
                }

                const imported: Project = parsed as Project;
                const importedEntry: FileNode | null =
                    imported.entry === (void 0)
                        ? flattenFiles(imported.files).find(
                              (node: FileNode): boolean => node.kind === "file",
                          ) ?? null
                        : findFile(imported.files, imported.entry);

                setFiles(imported.files);
                setExpanded(directoryKeys(imported.files));
                setSelectedId(importedEntry?.id ?? "");
                setDraft(importedEntry?.content ?? "");
                onProjectImport?.(imported);
            } catch {
                // An invalid project file is ignored; the current project stays intact.
            }
        });
        event.target.value = "";
    };

    const exportProject: () => void = (): void => {
        const payload: Project = { ...project, files };
        onProjectExport?.(payload);

        if (onProjectExport !== (void 0)) {
            return;
        }

        const blob: Blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
        });
        const url: string = URL.createObjectURL(blob);
        const anchor: HTMLAnchorElement = document.createElement("a");
        anchor.href = url;
        anchor.download = `${project.id}.project.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const renderPageTitle: (title: string, detail: string) => ReactNode = (
        title: string,
        detail: string,
    ): ReactNode => (
        <header className="project-manager__page-header">
            <Text variant="h3">{title}</Text>
            <Text variant="body-sm" tone="muted">
                {detail}
            </Text>
        </header>
    );

    return (
        <div className={cx("project-manager", className)}>
            <aside className="project-manager__modes" aria-label="Project views">
                <NavigationView
                    items={modes}
                    value={mode}
                    onValueChange={(value: string): void => {
                        if (modeSet.has(value)) {
                            setMode(value as ProjectMode);
                        }
                    }}
                    ariaLabel="Project views"
                />
            </aside>

            <main className="project-manager__main">
                <header className="project-manager__toolbar">
                    <div className="project-manager__identity">
                        <span className="project-manager__eyebrow">{project.name}</span>
                        <span className="project-manager__path">
                            {selected === null ? project.root : selected.path}
                        </span>
                    </div>
                    <div className="project-manager__toolbar-actions">
                        <Badge tone="neutral">{project.language}</Badge>
                        <Badge tone="accent">{project.manager}</Badge>
                        <Button
                            size="sm"
                            variant="ghost"
                            icon="Upload"
                            onClick={(): void => inputRef.current?.click()}
                        >
                            Import
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            icon="Download"
                            onClick={exportProject}
                        >
                            Export
                        </Button>
                        <input
                            ref={inputRef}
                            className="visually-hidden"
                            type="file"
                            accept="application/json,.json"
                            onChange={importProject}
                        />
                    </div>
                </header>

                <div className="project-manager__pager">
                    <Pager
                        route={mode}
                        onRouteChange={(route: string): void => {
                            if (modeSet.has(route)) {
                                setMode(route as ProjectMode);
                            }
                        }}
                        ariaLabel="Project views"
                    >
                        <PagerPage route="files">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    "Project files",
                                    `${fileNodes.length} files · ${packageDependencies.length} packages · ${references.length} references`,
                                )}
                                <div className="project-manager__files-layout">
                                    <aside
                                        className="project-manager__files-pane"
                                        aria-label="Project files"
                                    >
                                        <ProjectFileTree
                                            files={files}
                                            selectedId={selectedId}
                                            expanded={expanded}
                                            onExpandedChange={setExpanded}
                                            onSelect={select}
                                        />
                                    </aside>
                                    <div className="project-manager__files-content">
                                <div className="project-manager__stats">
                                    <div className="project-manager__stat">
                                        <span className="project-manager__stat-value">
                                            {fileNodes.length}
                                        </span>
                                        <span className="project-manager__stat-label">Files</span>
                                    </div>
                                    <div className="project-manager__stat">
                                        <span className="project-manager__stat-value">
                                            {graph.edges.length}
                                        </span>
                                        <span className="project-manager__stat-label">Edges</span>
                                    </div>
                                    <div className="project-manager__stat">
                                        <span className="project-manager__stat-value">
                                            {packageDependencies.length}
                                        </span>
                                        <span className="project-manager__stat-label">Packages</span>
                                    </div>
                                    <div className="project-manager__stat">
                                        <span className="project-manager__stat-value">
                                            {references.length}
                                        </span>
                                        <span className="project-manager__stat-label">References</span>
                                    </div>
                                </div>
                                {selected === null ? (
                                    <p className="project-manager__empty">Select a file to begin.</p>
                                ) : (
                                    <div className="project-manager__file-summary">
                                        <div className="project-manager__file-summary-head">
                                            <Icon name={fileIcon(selected)} size={20} />
                                            <Text variant="h4">{selected.name}</Text>
                                        </div>
                                        <dl className="project-manager__facts">
                                            <dt>Path</dt>
                                            <dd>{selected.path}</dd>
                                            <dt>Language</dt>
                                            <dd>{selected.language ?? project.language}</dd>
                                            <dt>Layer</dt>
                                            <dd>{selected.layer ?? inferLayer(selected.path)}</dd>
                                            <dt>Imports</dt>
                                            <dd>{imports.length}</dd>
                                            <dt>Exports</dt>
                                            <dd>{exports.length}</dd>
                                        </dl>
                                    </div>
                                )}
                                    </div>
                                </div>
                            </section>
                        </PagerPage>

                        <PagerPage route="preview">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    "Preview",
                                    selected === null ? "No file selected" : selected.path,
                                )}
                                {selected === null ? (
                                    <p className="project-manager__empty">Select a file to preview.</p>
                                ) : rendered === null ? null : rendered.mode === "code" ? (
                                    <pre className="project-manager__code selectable">
                                        <code
                                            dangerouslySetInnerHTML={{ ["__html"]: rendered.html }}
                                        />
                                    </pre>
                                ) : (
                                    <div
                                        className="project-manager__html selectable"
                                        dangerouslySetInnerHTML={{ ["__html"]: rendered.html }}
                                    />
                                )}
                            </section>
                        </PagerPage>

                        <PagerPage route="edit">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    "Edit",
                                    selected === null ? "No file selected" : selected.path,
                                )}
                                {selected === null ? (
                                    <p className="project-manager__empty">Select a file to edit.</p>
                                ) : (
                                    <>
                                        <textarea
                                            className="project-manager__editor"
                                            value={draft}
                                            spellCheck={false}
                                            onChange={(
                                                event: ChangeEvent<HTMLTextAreaElement>,
                                            ): void => setDraft(event.target.value)}
                                        />
                                        <div className="project-manager__editor-actions">
                                            <Text variant="body-sm" tone="muted">
                                                {draft.length} characters
                                            </Text>
                                            <Button size="sm" onClick={save}>
                                                Save file
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </section>
                        </PagerPage>

                        <PagerPage route="architecture">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    "Architecture",
                                    "Project node tree and the selected file's parsed structure",
                                )}
                                <div className="project-manager__architecture">
                                    <aside
                                        className="project-manager__files-pane"
                                        aria-label="Project structure"
                                    >
                                        <ProjectFileTree
                                            files={files}
                                            selectedId={selectedId}
                                            expanded={expanded}
                                            onExpandedChange={setExpanded}
                                            onSelect={select}
                                        />
                                    </aside>
                                    <div className="project-manager__structure">
                                        {selected === null ? (
                                            <p className="project-manager__empty">
                                                Select a file to inspect its structure.
                                            </p>
                                        ) : (
                                            <>
                                                <h4 className="project-manager__layer-title">
                                                    {selected.path}
                                                </h4>
                                                <StructureOutline
                                                    nodes={
                                                        parseStructure(selected).children ?? []
                                                    }
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </PagerPage>

                        <PagerPage route="dependencies">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    "Dependencies",
                                    "Packages, references, and internal file edges",
                                )}
                                <div className="project-manager__dependency-grid">
                                    <div>
                                        <h4 className="project-manager__layer-title">Packages</h4>
                                        {packageDependencies.length === 0 ? (
                                            <p className="project-manager__empty">No packages.</p>
                                        ) : (
                                            <ul className="project-manager__dependency-list">
                                                {packageDependencies.map(
                                                    (dependency: ProjectDependency): ReactNode => (
                                                        <li key={dependency.id}>
                                                            <Icon name="Link" size={14} />
                                                            <span>{dependency.name}</span>
                                                            <span className="project-manager__muted">
                                                                {dependency.version ?? "—"}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="project-manager__layer-title">References</h4>
                                        {references.length === 0 ? (
                                            <p className="project-manager__empty">No references.</p>
                                        ) : (
                                            <ul className="project-manager__dependency-list">
                                                {references.map(
                                                    (dependency: ProjectDependency): ReactNode => (
                                                        <li key={dependency.id}>
                                                            <Icon name="Book" size={14} />
                                                            <span>{dependency.name}</span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="project-manager__layer-title">File edges</h4>
                                        {graph.edges.length === 0 ? (
                                            <p className="project-manager__empty">No edges.</p>
                                        ) : (
                                            <ul className="project-manager__dependency-list">
                                                {graph.edges.slice(0, 40).map(
                                                    (edge: DependencyEdge): ReactNode => (
                                                        <li key={edge.id}>
                                                            <span>{edge.from}</span>
                                                            <Icon name="ChevronRight" size={12} />
                                                            <span>{edge.to}</span>
                                                            <span className="project-manager__muted">
                                                                {edge.kind}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </PagerPage>

                        <PagerPage route="imports">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    "Imports",
                                    selected === null ? "No file selected" : selected.path,
                                )}
                                {imports.length === 0 ? (
                                    <p className="project-manager__empty">No imports in this file.</p>
                                ) : (
                                    <ul className="project-manager__relationship-list">
                                        {imports.map((record: ImportRecord): ReactNode => {
                                            const target: FileNode | null =
                                                selected === null
                                                    ? null
                                                    : resolveImport(selected, record.specifier, files);

                                            return (
                                                <li key={record.id}>
                                                    <span className="project-manager__relationship-kind">
                                                        {record.kind}
                                                    </span>
                                                    <span>{record.specifier}</span>
                                                    {record.names.length === 0 ? null : (
                                                        <span className="project-manager__muted">
                                                            {record.names.join(", ")}
                                                        </span>
                                                    )}
                                                    {target === null ? null : (
                                                        <button
                                                            type="button"
                                                            className="project-manager__link"
                                                            onClick={(): void => select(target.id)}
                                                        >
                                                            {target.name}
                                                        </button>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </section>
                        </PagerPage>

                        <PagerPage route="exports">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    "Exports",
                                    selected === null ? "No file selected" : selected.path,
                                )}
                                {exports.length === 0 ? (
                                    <p className="project-manager__empty">No exports in this file.</p>
                                ) : (
                                    <ul className="project-manager__relationship-list">
                                        {exports.map((record: ExportRecord): ReactNode => (
                                            <li key={record.id}>
                                                <span className="project-manager__relationship-kind">
                                                    {record.kind}
                                                </span>
                                                <span>{record.name}</span>
                                                {record.line === (void 0) ? null : (
                                                    <span className="project-manager__muted">
                                                        line {record.line}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </PagerPage>
                    </Pager>
                </div>
            </main>
        </div>
    );
};

export default ProjectManager;
