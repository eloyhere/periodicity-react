/**
 * Known project file extensions.
 * Type: type alias.
 * Fields: none.
 * @example
 * const extension: Extension = "tsx";
 */
export type Extension =
    | "js"
    | "mjs"
    | "jsx"
    | "ts"
    | "mts"
    | "tsx"
    | "java"
    | "kt"
    | "py"
    | "h"
    | "c"
    | "hpp"
    | "cpp"
    | "rs"
    | "go"
    | "cs"
    | "php"
    | "swift"
    | "rb"
    | "html"
    | "htm"
    | "css"
    | "md"
    | "tex"
    | "txt"
    | "bib"
    | "json"
    | "yaml"
    | "toml"
    | "pom"
    | "";

/**
 * Extracts the extension from a file name without its leading dot.
 * @param name - File or directory name.
 * @example
 * const extension = extensionOf("App.tsx");
 * @returns A known extension, or an empty string.
 */
export const extensionOf: (name: string) => Extension = (name: string): Extension => {
    const index: number = name.lastIndexOf(".");

    if (index < 0 || index === name.length - 1) {
        return "";
    }

    const raw: string = name.slice(index + 1).toLowerCase();

    return extensionValues.includes(raw as Extension) ? (raw as Extension) : "";
};

/**
 * Every known extension value.
 * Type: const.
 * @example
 * const supported = extensionValues.includes("tsx");
 */
export const extensionValues: readonly Extension[] = [
    "js",
    "mjs",
    "jsx",
    "ts",
    "mts",
    "tsx",
    "java",
    "kt",
    "py",
    "h",
    "c",
    "hpp",
    "cpp",
    "rs",
    "go",
    "cs",
    "php",
    "swift",
    "rb",
    "html",
    "htm",
    "css",
    "md",
    "tex",
    "txt",
    "bib",
    "json",
    "yaml",
    "toml",
    "pom",
    "",
];
