import type { ProjectDependency } from "./dependency";
import type { FileNode } from "./project";
import { flattenFiles } from "./project";

/**
 * Supported project package managers.
 * Type: type alias.
 * Fields: none.
 * @example
 * const manager: PackageManager = "pnpm";
 */
export type PackageManager =
    | "npm"
    | "yarn"
    | "pnpm"
    | "bun"
    | "maven"
    | "pip"
    | "conda"
    | "poetry"
    | "uv"
    | "hatch"
    | "conan"
    | "vcpkg"
    | "hunter"
    | "build2"
    | "xmake"
    | "cargo"
    | "go mod"
    | "nuget"
    | "bundler"
    | "RubyGems"
    | "Composer"
    | "Swift Package Manager";

/**
 * Display and manifest metadata for a package manager.
 * Type: interface.
 * Fields: label, manifest, lockfile.
 * @example
 * const info: PackageManagerInfo = packageManagerInfo.pnpm;
 */
export interface PackageManagerInfo {
    label: string;
    manifest: string;
    lockfile?: string;
}

/**
 * Metadata for every supported package manager.
 * Type: const.
 * @example
 * const manifest = packageManagerInfo.pnpm.manifest;
 */
export const packageManagerInfo: Readonly<Record<PackageManager, PackageManagerInfo>> = {
    npm: { label: "npm", manifest: "package.json", lockfile: "package-lock.json" },
    yarn: { label: "Yarn", manifest: "package.json", lockfile: "yarn.lock" },
    pnpm: { label: "pnpm", manifest: "package.json", lockfile: "pnpm-lock.yaml" },
    bun: { label: "Bun", manifest: "package.json", lockfile: "bun.lockb" },
    maven: { label: "Maven", manifest: "pom.xml" },
    pip: { label: "pip", manifest: "requirements.txt" },
    conda: { label: "Conda", manifest: "environment.yml" },
    poetry: { label: "Poetry", manifest: "pyproject.toml", lockfile: "poetry.lock" },
    uv: { label: "uv", manifest: "pyproject.toml", lockfile: "uv.lock" },
    hatch: { label: "Hatch", manifest: "pyproject.toml" },
    conan: { label: "Conan", manifest: "conanfile.txt" },
    vcpkg: { label: "vcpkg", manifest: "vcpkg.json" },
    hunter: { label: "Hunter", manifest: "CMakeLists.txt" },
    build2: { label: "build2", manifest: "manifest" },
    xmake: { label: "xmake", manifest: "xmake.lua" },
    cargo: { label: "Cargo", manifest: "Cargo.toml", lockfile: "Cargo.lock" },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "go mod": { label: "Go modules", manifest: "go.mod", lockfile: "go.sum" },
    nuget: { label: "NuGet", manifest: "packages.config" },
    bundler: { label: "Bundler", manifest: "Gemfile", lockfile: "Gemfile.lock" },
    RubyGems: { label: "RubyGems", manifest: "gemspec" },
    Composer: { label: "Composer", manifest: "composer.json", lockfile: "composer.lock" },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "Swift Package Manager": { label: "SwiftPM", manifest: "Package.swift" },
};

/**
 * Parses package dependencies from a manifest file.
 * @param file - Manifest file node.
 * @param manager - Active package manager.
 * @example
 * const packages = parseManifest(file, "pnpm");
 * @returns Package dependencies declared by the manifest.
 */
export const parseManifest: (
    file: FileNode,
    manager: PackageManager,
) => readonly ProjectDependency[] = (
    file: FileNode,
    manager: PackageManager,
): readonly ProjectDependency[] => {
    const content: string = file.content ?? "";
    const dependencies: ProjectDependency[] = [];

    if (file.name === "package.json") {
        try {
            const parsed: unknown = JSON.parse(content);

            if (typeof parsed !== "object" || parsed === null) {
                return dependencies;
            }

            const record: Record<string, unknown> = parsed as Record<string, unknown>;

            for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
                const group: unknown = record[section];

                if (typeof group !== "object" || group === null) {
                    continue;
                }

                for (const [name, version] of Object.entries(group as Record<string, unknown>)) {
                    dependencies.push({
                        id: `package:${name}`,
                        name,
                        kind: "package",
                        version: typeof version === "string" ? version : (void 0),
                        manager,
                    });
                }
            }
        } catch {
            return dependencies;
        }
    } else if (file.name === "requirements.txt") {
        for (const line of content.split("\n")) {
            const trimmed: string = line.trim();

            if (trimmed.length === 0 || trimmed.startsWith("#")) {
                continue;
            }

            const parts: string[] = trimmed.split(/[=<>!~]+/);
            const name: string = parts[0] ?? "";
            const version: string | undefined = parts[1];
            dependencies.push({
                id: `package:${name}`,
                name,
                kind: "package",
                version,
                manager,
            });
        }
    } else if (file.name === "Cargo.toml") {
        const sectionPattern: RegExp = /^\s*([A-Za-z0-9_-]+)\s*=\s*(?:["']([^"']+)["']|\{[^}]*version\s*=\s*["']([^"']+)["'])/gm;

        for (const match of content.matchAll(sectionPattern)) {
            dependencies.push({
                id: `package:${match[1]}`,
                name: match[1],
                kind: "package",
                version: match[2] ?? match[3],
                manager,
            });
        }
    }

    return dependencies;
};

/**
 * Collects package and bibliography dependencies from project files.
 * @param files - Project roots.
 * @param manager - Active package manager.
 * @example
 * const dependencies = dependenciesFromFiles(project.files, project.manager);
 * @returns Package and reference dependencies.
 */
export const dependenciesFromFiles: (
    files: readonly FileNode[],
    manager: PackageManager,
) => readonly ProjectDependency[] = (
    files: readonly FileNode[],
    manager: PackageManager,
): readonly ProjectDependency[] => {
    const dependencies: ProjectDependency[] = [];
    const seen: Set<string> = new Set<string>();

    for (const file of flattenFiles(files)) {
        if (file.kind !== "file") {
            continue;
        }

        const found: readonly ProjectDependency[] = parseManifest(file, manager);

        for (const dependency of found) {
            if (!seen.has(dependency.id)) {
                seen.add(dependency.id);
                dependencies.push(dependency);
            }
        }

        if (file.extension === "bib") {
            const entryPattern: RegExp = /@\w+\s*\{\s*([^,\s]+)/g;

            for (const match of file.content?.matchAll(entryPattern) ?? []) {
                const id: string = `reference:${match[1]}`;

                if (!seen.has(id)) {
                    seen.add(id);
                    dependencies.push({
                        id,
                        name: match[1],
                        kind: "reference",
                        source: file.path,
                        reference: match[0],
                    });
                }
            }
        }
    }

    return dependencies;
};
