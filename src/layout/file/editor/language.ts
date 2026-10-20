import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import type { Extension } from "@codemirror/state";
import type { Extension as FileExtension } from "../extension";

/**
 * Chooses a CodeMirror language extension for a file extension.
 * @param extension - Project file extension.
 * @example
 * const language = languageExtension("tsx");
 * @returns A CodeMirror language extension, or an empty extension.
 */
export const languageExtension: (extension: FileExtension) => Extension = (
    extension: FileExtension,
): Extension => {
    if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(extension)) {
        return javascript({
            typescript: extension === "ts" || extension === "tsx",
            jsx: extension === "jsx" || extension === "tsx",
        });
    }

    if (["html", "htm"].includes(extension)) {
        return html();
    }

    if (extension === "css") {
        return css();
    }

    if (extension === "json") {
        return json();
    }

    if (extension === "md" || extension === "txt") {
        return markdown();
    }

    if (extension === "py") {
        return python();
    }

    return [];
};
