import type { Extension } from "./extension";

/**
 * Human-facing language of a project or file.
 * Type: type alias.
 * Fields: none.
 * @example
 * const language: Language = "TypeScript";
 */
export type Language =
    | "JavaScript"
    | "TypeScript"
    | "Rust"
    | "Tex"
    | "Go"
    | "Java"
    | "Kotlin"
    | "C#"
    | ".NET"
    | "PHP"
    | "Swift"
    | "C"
    | "CPP"
    | "Python"
    | "Ruby"
    | "HTML"
    | "CSS"
    | "Literature"
    | "Mathematics";

/**
 * Broad category used by architecture and project summaries.
 * Type: type alias.
 * Fields: none.
 * @example
 * const category: LanguageCategory = "literature";
 */
export type LanguageCategory = "programming" | "literature" | "mathematics";

/**
 * Maps an extension to a language. Literature covers books, articles, and
 * bibliographies; TeX and Mathematics remain distinct.
 * Type: const.
 * @example
 * const language = languageForExtension("md");
 */
export const languageForExtension: Readonly<Partial<Record<Extension, Language>>> = {
    js: "JavaScript",
    mjs: "JavaScript",
    jsx: "JavaScript",
    ts: "TypeScript",
    mts: "TypeScript",
    tsx: "TypeScript",
    java: "Java",
    kt: "Kotlin",
    py: "Python",
    h: "C",
    c: "C",
    hpp: "CPP",
    cpp: "CPP",
    rs: "Rust",
    go: "Go",
    cs: "C#",
    php: "PHP",
    swift: "Swift",
    rb: "Ruby",
    html: "HTML",
    htm: "HTML",
    css: "CSS",
    md: "Literature",
    tex: "Tex",
    txt: "Literature",
    bib: "Literature",
    json: "TypeScript",
    yaml: "TypeScript",
    toml: "TypeScript",
};

/**
 * Returns the broad category of a language.
 * @param language - Project language.
 * @example
 * const category = categoryOf("Literature");
 * @returns Programming, literature, or mathematics.
 */
export const categoryOf: (language: Language) => LanguageCategory = (
    language: Language,
): LanguageCategory => {
    if (language === "Literature") {
        return "literature";
    }

    if (language === "Mathematics") {
        return "mathematics";
    }

    return "programming";
};

/**
 * Checks whether a language represents books, articles, or prose.
 * @param language - Project language.
 * @example
 * const prose = isLiterature("Literature");
 * @returns True for literature projects.
 */
export const isLiterature: (language: Language) => boolean = (language: Language): boolean =>
    categoryOf(language) === "literature";
