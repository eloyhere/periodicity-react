import {
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
    type RefObject,
} from "react";
import Badge from "../../component/badge/Badge";
import Button from "../../component/button/Button";
import Icon, { type IconName } from "../../component/icon/Icon";
import Text from "../../component/text/Text";
import cx from "../../component/foundation/cx";
import Tree from "../tree/Tree";
import NavigationView, { type NavigationItem } from "../navigation/NavigationView";
import Pager, { Page } from "../pager/Pager";
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
import Preview from "./Preview";
import Editor from "./Editor";
import {
    useInternational,
    type CommonMessageKey,
    type InternationalContextValue,
} from "../../international";
import "./ProjectManager.css";

/**
 * Props for the generic project manager.
 * Type: interface.
 * Fields: project, files, defaultFiles, dependencies, mode, defaultMode,
 * selectedId, defaultSelectedId, expandedKeys, defaultExpandedKeys,
 * onFileChange, onFileSave, onFilesChange, onProjectChange, onModeChange,
 * onSelectedChange, onExpandedChange, onProjectImport, onProjectImportError,
 * onProjectExport, onProjectDownload, downloadExport, exportFileName,
 * importAccept, className, ref.
 * `project` supplies metadata and the initial tree; pass `files` to control the tree.
 * Native container attributes and events are forwarded to the root element.
 * @example
 * <ProjectManager
 *     project={project}
 *     files={files}
 *     mode={mode}
 *     onModeChange={setMode}
 *     onFileChange={(file, content) => save(file, content)}
 * />
 */
export interface ProjectManagerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    project: Project;
    files?: readonly FileNode[];
    defaultFiles?: readonly FileNode[];
    dependencies?: readonly ProjectDependency[];
    mode?: ProjectMode;
    defaultMode?: ProjectMode;
    selectedId?: string;
    defaultSelectedId?: string;
    expandedKeys?: ReadonlySet<string>;
    defaultExpandedKeys?: ReadonlySet<string>;
    onFileChange?: (file: FileNode, content: string) => void;
    onFileSave?: (file: FileNode, content: string) => void;
    onFilesChange?: (files: readonly FileNode[]) => void;
    onProjectChange?: (project: Project) => void;
    onModeChange?: (mode: ProjectMode) => void;
    onSelectedChange?: (id: string, file: FileNode | null) => void;
    onExpandedChange?: (keys: ReadonlySet<string>) => void;
    onProjectImport?: (project: Project) => void;
    onProjectImportError?: (error: unknown, source: File) => void;
    onProjectExport?: (project: Project) => void;
    onProjectDownload?: (project: Project, blob: Blob, fileName: string) => void;
    downloadExport?: boolean;
    exportFileName?: string;
    importAccept?: string;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

interface ProjectModeOption extends Omit<NavigationItem, "label"> {
    label: CommonMessageKey;
}

const modes: readonly ProjectModeOption[] = [
    { value: "files", label: "files", icon: "Folder" },
    { value: "preview", label: "preview", icon: "View" },
    { value: "edit", label: "edit", icon: "Pencil" },
    { value: "architecture", label: "architecture", icon: "Tree" },
    { value: "dependencies", label: "dependencies", icon: "Link" },
    { value: "imports", label: "imports", icon: "Download" },
    { value: "exports", label: "exports", icon: "Upload" },
];

const modeSet: ReadonlySet<string> = new Set<string>(
    modes.map((item: ProjectModeOption): string => item.value),
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

/**
 * Checks whether a value is a well-formed project file node.
 * @param value - Candidate value.
 * @example
 * const valid = isFileNode({ id: "a", name: "a.txt", path: "a.txt", kind: "file" });
 * @returns True for a file or directory node with valid children.
 */
const isFileNode: (value: unknown) => value is FileNode = (value: unknown): value is FileNode => {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const record: Record<string, unknown> = value as Record<string, unknown>;

    if (
        typeof record.id !== "string" ||
        typeof record.name !== "string" ||
        typeof record.path !== "string" ||
        (record.kind !== "file" && record.kind !== "directory")
    ) {
        return false;
    }

    if (record.children === (void 0)) {
        return true;
    }

    return Array.isArray(record.children) && record.children.every(isFileNode);
};

/**
 * Checks whether a value is a project that can be imported safely.
 * @param value - Candidate value.
 * @example
 * const valid = isProject(JSON.parse(text));
 * @returns True for a project with string metadata and valid file nodes.
 */
const isProject: (value: unknown) => value is Project = (value: unknown): value is Project => {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const record: Record<string, unknown> = value as Record<string, unknown>;

    return (
        typeof record.id === "string" &&
        typeof record.name === "string" &&
        typeof record.root === "string" &&
        typeof record.manager === "string" &&
        typeof record.language === "string" &&
        (record.entry === (void 0) || typeof record.entry === "string") &&
        Array.isArray(record.files) &&
        record.files.every(isFileNode)
    );
};

/**
 * Resolves the initial selected file id from an explicit entry or the first file.
 * @param files - Project root nodes.
 * @param project - Project metadata providing the optional entry id.
 * @example
 * const id = initialSelection(project.files, project);
 * @returns A node id, or an empty string when the project has no files.
 */
const initialSelection: (files: readonly FileNode[], project: Project) => string = (
    files: readonly FileNode[],
    project: Project,
): string => {
    if (project.entry !== (void 0)) {
        const entry: FileNode | null = findFile(files, project.entry);

        if (entry !== null) {
            return entry.id;
        }
    }

    return (
        flattenFiles(files).find((node: FileNode): boolean => node.kind === "file")?.id ?? ""
    );
};

interface ProjectFileTreeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    files: readonly FileNode[];
    selectedId: string;
    expanded: ReadonlySet<string>;
    onExpandedChange: (keys: ReadonlySet<string>) => void;
    onFileSelect: (id: string) => void;
    className?: string;
}

/**
 * Reusable project file tree used by the Files and Architecture pages.
 * Native container attributes are forwarded to the wrapping tree region.
 * @param props - Files, selection, expansion state, and native attributes.
 * @example
 * <ProjectFileTree files={files} selectedId={id} expanded={keys} onFileSelect={select} />
 * @returns A project tree.
 */
const ProjectFileTree: FC<ProjectFileTreeProps> = ({
    files,
    selectedId,
    expanded,
    onExpandedChange,
    onFileSelect,
    className = "",
    ...rest
}: ProjectFileTreeProps) => (
    <div {...rest} className={cx("project-manager__tree", className)}>
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
                    onFileSelect(keys[0]);
                }
            }}
            renderItem={(file: FileNode): ReactNode => (
                <span className="project-manager__file">
                    <Icon name={fileIcon(file)} size={14} />
                    <span className="project-manager__file-name">{file.name}</span>
                </span>
            )}
        />
    </div>
);

interface StructureOutlineItemProps {
    node: StructureNode;
    depth: number;
}

/**
 * Renders one parsed structure node with tree semantics.
 * @param props - Node and visual depth.
 * @example
 * <StructureOutlineItem node={node} depth={0} />
 * @returns A nested outline item.
 */
const StructureOutlineItem: FC<StructureOutlineItemProps> = ({
    node,
    depth,
}: StructureOutlineItemProps) => {
    const children: readonly StructureNode[] = node.children ?? [];

    return (
        <li
            className="project-manager__outline-item"
            data-depth={depth}
            role="treeitem"
            aria-level={depth + 1}
            aria-expanded={children.length > 0 ? true : (void 0)}
        >
            <div className="project-manager__outline-row" data-kind={node.kind}>
                <span className="project-manager__outline-kind">{node.kind}</span>
                <span className="project-manager__outline-label">{node.label}</span>
                {node.line === (void 0) ? null : (
                    <span className="project-manager__outline-line">L{node.line}</span>
                )}
            </div>
            {children.length === 0 ? null : (
                <ul className="project-manager__outline" role="group">
                    {children.map(
                        (child: StructureNode): ReactNode => (
                            <StructureOutlineItem key={child.id} node={child} depth={depth + 1} />
                        ),
                    )}
                </ul>
            )}
        </li>
    );
};

interface StructureOutlineProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
    nodes: readonly StructureNode[];
    className?: string;
}

/**
 * Renders a parsed file outline with kind labels and recursive children.
 * Native list attributes are forwarded to the root list.
 * @param props - Structure nodes, depth, and native attributes.
 * @example
 * <StructureOutline nodes={parseStructure(file).children ?? []} />
 * @returns A nested outline.
 */
const StructureOutline: FC<StructureOutlineProps> = ({
    nodes,
    className = "",
    role = "tree",
    ...rest
}: StructureOutlineProps) => (
    <ul {...rest} role={role} className={cx("project-manager__outline", className)}>
        {nodes.map(
            (node: StructureNode): ReactNode => (
                <StructureOutlineItem key={node.id} node={node} depth={0} />
            ),
        )}
    </ul>
);

/**
 * Renders the project file tree, view navigation, pager pages, dependency graph,
 * preview, editor, architecture, imports, exports, and project import/export.
 * Native container attributes and events are forwarded to the root element.
 * @param props - Project metadata, controlled state, change callbacks, and native attributes.
 * @example
 * <ProjectManager
 *     project={project}
 *     dependencies={dependencies}
 *     onFileChange={(file, content) => save(file, content)}
 * />
 * @returns A complete project manager.
 */
const ProjectManager: FC<ProjectManagerProps> = ({
    project,
    files,
    defaultFiles,
    dependencies,
    mode,
    defaultMode = "files",
    selectedId,
    defaultSelectedId,
    expandedKeys,
    defaultExpandedKeys,
    onFileChange,
    onFileSave,
    onFilesChange,
    onProjectChange,
    onModeChange,
    onSelectedChange,
    onExpandedChange,
    onProjectImport,
    onProjectImportError,
    onProjectExport,
    onProjectDownload,
    downloadExport,
    exportFileName,
    importAccept = "application/json,.json",
    className = "",
    "aria-label": ariaLabel,
    role = "region",
    ref,
    ...rest
}: ProjectManagerProps) => {
    const { t }: InternationalContextValue = useInternational();
    const modeItems: readonly NavigationItem[] = modes.map(
        (item: ProjectModeOption): NavigationItem => ({ ...item, label: t(item.label) }),
    );
    const initialFiles: readonly FileNode[] = files ?? defaultFiles ?? project.files;
    const [internalFiles, setInternalFiles]: [
        readonly FileNode[],
        (next: readonly FileNode[]) => void,
    ] = useState<readonly FileNode[]>(initialFiles);
    const [internalMode, setInternalMode]: [ProjectMode, (next: ProjectMode) => void] =
        useState<ProjectMode>(defaultMode);
    const [internalSelectedId, setInternalSelectedId]: [string, (next: string) => void] =
        useState<string>(defaultSelectedId ?? initialSelection(initialFiles, project));
    const [internalExpanded, setInternalExpanded]: [
        ReadonlySet<string>,
        (next: ReadonlySet<string>) => void,
    ] = useState<ReadonlySet<string>>(
        defaultExpandedKeys ?? directoryKeys(initialFiles),
    );
    const activeFiles: readonly FileNode[] = files ?? internalFiles;
    const activeMode: ProjectMode = mode ?? internalMode;
    const activeSelectedId: string = selectedId ?? internalSelectedId;
    const activeExpanded: ReadonlySet<string> = expandedKeys ?? internalExpanded;
    const selected: FileNode | null = findFile(activeFiles, activeSelectedId);
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
    const fileNodes: readonly FileNode[] = useMemo(
        (): readonly FileNode[] =>
            flattenFiles(activeFiles).filter((node: FileNode): boolean => node.kind === "file"),
        [activeFiles],
    );
    const projectDependencies: readonly ProjectDependency[] = useMemo(
        (): readonly ProjectDependency[] =>
            dependencies ?? dependenciesFromFiles(activeFiles, project.manager),
        [dependencies, activeFiles, project.manager],
    );
    const graph: DependencyGraph = useMemo(
        () => createDependencyGraph(activeFiles, projectDependencies),
        [activeFiles, projectDependencies],
    );
    const imports: readonly ImportRecord[] = useMemo(
        () => (selected === null ? [] : parseImports(selected)),
        [selected],
    );
    const exports: readonly ExportRecord[] = useMemo(
        () => (selected === null ? [] : parseExports(selected)),
        [selected],
    );
    const packageDependencies: readonly ProjectDependency[] = projectDependencies.filter(
        (dependency: ProjectDependency): boolean => dependency.kind === "package",
    );
    const references: readonly ProjectDependency[] = projectDependencies.filter(
        (dependency: ProjectDependency): boolean => dependency.kind === "reference",
    );
    const filesDetail: string = [
        t("detailCount", { label: t("files"), count: fileNodes.length }),
        t("detailCount", { label: t("packages"), count: packageDependencies.length }),
        t("detailCount", { label: t("references"), count: references.length }),
    ].join(" · ");

    const changeMode: (next: ProjectMode) => void = (next: ProjectMode): void => {
        if (!modeSet.has(next)) {
            return;
        }

        if (mode === (void 0)) {
            setInternalMode(next);
        }

        onModeChange?.(next);
    };

    const changeExpanded: (next: ReadonlySet<string>) => void = (
        next: ReadonlySet<string>,
    ): void => {
        if (expandedKeys === (void 0)) {
            setInternalExpanded(next);
        }

        onExpandedChange?.(next);
    };

    const changeSelected: (id: string, file: FileNode | null) => void = (
        id: string,
        file: FileNode | null,
    ): void => {
        if (selectedId === (void 0)) {
            setInternalSelectedId(id);
        }

        onSelectedChange?.(id, file);
    };

    const select: (id: string) => void = (id: string): void => {
        const file: FileNode | null = findFile(activeFiles, id);

        if (file === null) {
            return;
        }

        changeSelected(id, file);

        if (file.kind === "file") {
            const parent: string = file.path.slice(0, Math.max(0, file.path.lastIndexOf("/")));

            if (parent.length > 0 && !activeExpanded.has(parent)) {
                const nextExpanded: Set<string> = new Set<string>(activeExpanded);
                nextExpanded.add(parent);
                changeExpanded(nextExpanded);
            }
        }
    };

    const commitFiles: (next: readonly FileNode[]) => void = (
        next: readonly FileNode[],
    ): void => {
        if (files === (void 0)) {
            setInternalFiles(next);
        }

        onFilesChange?.(next);
        onProjectChange?.({ ...project, files: next });
    };

    const save: (target: FileNode, content: string) => void = (
        target: FileNode,
        content: string,
    ): void => {
        commitFiles(updateFileContent(activeFiles, target.id, content));
        onFileChange?.(target, content);
    };

    const saveFile: (target: FileNode, content: string) => void = (
        target: FileNode,
        content: string,
    ): void => {
        save(target, content);
        onFileSave?.(target, content);
    };

    const applyImportedProject: (imported: Project) => void = (imported: Project): void => {
        commitFiles(imported.files);
        changeExpanded(directoryKeys(imported.files));

        const entryId: string = initialSelection(imported.files, imported);
        const entry: FileNode | null =
            entryId.length === 0 ? null : findFile(imported.files, entryId);
        changeSelected(entryId, entry);
        onProjectImport?.(imported);
    };

    const importProject: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const input: HTMLInputElement = event.target;
        const source: File | void = input.files?.[0];
        input.value = "";

        if (source === (void 0)) {
            return;
        }

        void source
            .text()
            .then((text: string): void => {
                let parsed: unknown;

                try {
                    parsed = JSON.parse(text);
                } catch (error: unknown) {
                    onProjectImportError?.(error, source);
                    return;
                }

                if (!isProject(parsed)) {
                    onProjectImportError?.(
                        new Error("The selected file is not a valid project."),
                        source,
                    );
                    return;
                }

                applyImportedProject(parsed);
            })
            .catch((error: unknown): void => {
                onProjectImportError?.(error, source);
            });
    };

    const exportProject: () => void = (): void => {
        const payload: Project = { ...project, files: activeFiles };
        onProjectExport?.(payload);
        const shouldDownload: boolean =
            downloadExport === (void 0) ? onProjectExport === (void 0) : downloadExport;

        if (!shouldDownload) {
            return;
        }

        const blob: Blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
        });
        const fileName: string = exportFileName ?? `${project.id}.project.json`;
        onProjectDownload?.(payload, blob, fileName);
        const url: string = URL.createObjectURL(blob);
        const anchor: HTMLAnchorElement = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout((): void => {
            URL.revokeObjectURL(url);
        }, 0);
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
        <div
            {...rest}
            ref={ref}
            role={role}
            className={cx("project-manager", className)}
            aria-label={ariaLabel ?? t("projectManager", { name: project.name })}
            data-project={project.id}
            data-mode={activeMode}
            data-selected-id={selected === null ? (void 0) : selected.id}
            data-file-count={fileNodes.length}
        >
            <aside className="project-manager__modes" aria-label={t("projectViews")}>
                <NavigationView
                    items={modeItems}
                    value={activeMode}
                    onValueChange={(value: string): void => {
                        changeMode(value as ProjectMode);
                    }}
                    ariaLabel={t("projectViews")}
                />
            </aside>

            <section className="project-manager__main" aria-label={t("projectWorkspace")}>
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
                            {t("import")}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            icon="Download"
                            onClick={exportProject}
                        >
                            {t("export")}
                        </Button>
                        <input
                            ref={inputRef}
                            className="visually-hidden"
                            type="file"
                            accept={importAccept}
                            aria-label={t("importProjectFile")}
                            onChange={importProject}
                        />
                    </div>
                </header>

                <div className="project-manager__pager">
                    <Pager
                        route={activeMode}
                        onRouteChange={(route: string): void => {
                            changeMode(route as ProjectMode);
                        }}
                        ariaLabel={t("projectViews")}
                    >
                        <Page route="files">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    t("projectFiles"),
                                    filesDetail,
                                )}
                                <div className="project-manager__files-layout">
                                    <aside
                                        className="project-manager__files-pane"
                                        aria-label={t("projectFiles")}
                                    >
                                        <ProjectFileTree
                                            files={activeFiles}
                                            selectedId={activeSelectedId}
                                            expanded={activeExpanded}
                                            onExpandedChange={changeExpanded}
                                            onFileSelect={select}
                                        />
                                    </aside>
                                    <div className="project-manager__files-content">
                                <div className="project-manager__stats">
                                    <div className="project-manager__stat">
                                        <span className="project-manager__stat-value">
                                            {fileNodes.length}
                                        </span>
                                        <span className="project-manager__stat-label">
                                            {t("files")}
                                        </span>
                                    </div>
                                    <div className="project-manager__stat">
                                        <span className="project-manager__stat-value">
                                            {graph.edges.length}
                                        </span>
                                        <span className="project-manager__stat-label">
                                            {t("edges")}
                                        </span>
                                    </div>
                                    <div className="project-manager__stat">
                                        <span className="project-manager__stat-value">
                                            {packageDependencies.length}
                                        </span>
                                        <span className="project-manager__stat-label">
                                            {t("packages")}
                                        </span>
                                    </div>
                                    <div className="project-manager__stat">
                                        <span className="project-manager__stat-value">
                                            {references.length}
                                        </span>
                                        <span className="project-manager__stat-label">
                                            {t("references")}
                                        </span>
                                    </div>
                                </div>
                                {selected === null ? (
                                    <p className="project-manager__empty">{t("selectFile")}</p>
                                ) : (
                                    <div className="project-manager__file-summary">
                                        <div className="project-manager__file-summary-head">
                                            <Icon name={fileIcon(selected)} size={20} />
                                            <Text variant="h4">{selected.name}</Text>
                                        </div>
                                        <dl className="project-manager__facts">
                                            <dt>{t("path")}</dt>
                                            <dd>{selected.path}</dd>
                                            <dt>{t("language")}</dt>
                                            <dd>{selected.language ?? project.language}</dd>
                                            <dt>{t("layer")}</dt>
                                            <dd>{selected.layer ?? inferLayer(selected.path)}</dd>
                                            <dt>{t("imports")}</dt>
                                            <dd>{imports.length}</dd>
                                            <dt>{t("exports")}</dt>
                                            <dd>{exports.length}</dd>
                                        </dl>
                                    </div>
                                )}
                                    </div>
                                </div>
                            </section>
                        </Page>

                        <Page route="preview">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    t("preview"),
                                    selected === null ? t("noFileSelected") : selected.path,
                                )}
                                {selected === null ? (
                                    <p className="project-manager__empty">{t("selectFile")}</p>
                                ) : (
                                    <Preview key={selected.id} file={selected} />
                                )}
                            </section>
                        </Page>

                        <Page route="edit">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    t("edit"),
                                    selected === null ? t("noFileSelected") : selected.path,
                                )}
                                {selected === null ? (
                                    <p className="project-manager__empty">{t("selectFile")}</p>
                                ) : (
                                    <Editor
                                        key={selected.id}
                                        file={selected}
                                        onChange={(content: string, target: FileNode): void =>
                                            save(target, content)
                                        }
                                        onSave={saveFile}
                                    />
                                )}
                            </section>
                        </Page>

                        <Page route="architecture">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    t("architecture"),
                                    t("architectureDetail"),
                                )}
                                <div className="project-manager__architecture">
                                    <aside
                                        className="project-manager__files-pane"
                                        aria-label={t("projectStructure")}
                                    >
                                        <ProjectFileTree
                                            files={activeFiles}
                                            selectedId={activeSelectedId}
                                            expanded={activeExpanded}
                                            onExpandedChange={changeExpanded}
                                            onFileSelect={select}
                                        />
                                    </aside>
                                    <div className="project-manager__structure">
                                        {selected === null ? (
                                            <p className="project-manager__empty">
                                                {t("selectFile")}
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
                                                    aria-label={t("selectedFileStructure")}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </Page>

                        <Page route="dependencies">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    t("dependencies"),
                                    t("dependenciesDetail"),
                                )}
                                <div className="project-manager__dependency-grid">
                                    <div>
                                        <h4 className="project-manager__layer-title">{t("packages")}</h4>
                                        {packageDependencies.length === 0 ? (
                                            <p className="project-manager__empty">{t("noPackages")}</p>
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
                                        <h4 className="project-manager__layer-title">{t("references")}</h4>
                                        {references.length === 0 ? (
                                            <p className="project-manager__empty">{t("noReferences")}</p>
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
                                        <h4 className="project-manager__layer-title">{t("fileEdges")}</h4>
                                        {graph.edges.length === 0 ? (
                                            <p className="project-manager__empty">{t("noEdges")}</p>
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
                        </Page>

                        <Page route="imports">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    t("imports"),
                                    selected === null ? t("noFileSelected") : selected.path,
                                )}
                                {imports.length === 0 ? (
                                    <p className="project-manager__empty">{t("noImports")}</p>
                                ) : (
                                    <ul className="project-manager__relationship-list">
                                        {imports.map((record: ImportRecord): ReactNode => {
                                            const target: FileNode | null =
                                                selected === null
                                                    ? null
                                                    : resolveImport(
                                                          selected,
                                                          record.specifier,
                                                          activeFiles,
                                                      );

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
                        </Page>

                        <Page route="exports">
                            <section className="project-manager__page">
                                {renderPageTitle(
                                    t("exports"),
                                    selected === null ? t("noFileSelected") : selected.path,
                                )}
                                {exports.length === 0 ? (
                                    <p className="project-manager__empty">{t("noExports")}</p>
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
                                                        {t("lineNumber", { line: record.line })}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </Page>
                    </Pager>
                </div>
            </section>
        </div>
    );
};

export default ProjectManager;
