import type { Extension } from "./extension";
import { extensionOf } from "./extension";
import type { FileNode } from "./project";

/**
 * Kind of node in a parsed document or source outline.
 * Type: type alias.
 * Fields: none.
 * @example
 * const kind: StructureKind = "section";
 */
export type StructureKind =
    | "file"
    | "tag"
    | "attribute"
    | "section"
    | "paragraph"
    | "sentence"
    | "function"
    | "class"
    | "method"
    | "property"
    | "comment"
    | "constant"
    | "type"
    | "interface";

/**
 * One node in a file's structure outline.
 * Type: interface.
 * Fields: id, label, kind, line, children.
 * @example
 * const node: StructureNode = { id: "f:0", label: "Button", kind: "function" };
 */
export interface StructureNode {
    id: string;
    label: string;
    kind: StructureKind;
    line?: number;
    children?: readonly StructureNode[];
}

const lineAt: (content: string, index: number) => number = (
    content: string,
    index: number,
): number => content.slice(0, index).split("\n").length;

const makeNode: (
    file: FileNode,
    index: number,
    label: string,
    kind: StructureKind,
    line?: number,
    children?: readonly StructureNode[],
) => StructureNode = (
    file: FileNode,
    index: number,
    label: string,
    kind: StructureKind,
    line?: number,
    children?: readonly StructureNode[],
): StructureNode => ({
    id: `${file.id}:${kind}:${index}`,
    label,
    kind,
    line,
    children,
});

const codeExtension: (extension: Extension) => boolean = (extension: Extension): boolean =>
    ["js", "mjs", "jsx", "ts", "mts", "tsx", "py", "rs", "c", "h", "cpp", "hpp"].includes(
        extension,
    );

const parseComments: (file: FileNode, lines: readonly string[]) => StructureNode[] = (
    file: FileNode,
    lines: readonly string[],
): StructureNode[] => {
    const comments: StructureNode[] = [];

    for (let index: number = 0; index < lines.length; index += 1) {
        const trimmed: string = lines[index].trim();

        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
            comments.push(
                makeNode(file, index, trimmed.slice(0, 80), "comment", index + 1),
            );
        }
    }

    return comments;
};

const parseCode: (file: FileNode, content: string) => StructureNode[] = (
    file: FileNode,
    content: string,
): StructureNode[] => {
    const lines: string[] = content.split("\n");
    const nodes: StructureNode[] = [];
    let index: number = 0;

    while (index < lines.length) {
        const line: string = lines[index];
        const trimmed: string = line.trim();

        if (trimmed.length === 0) {
            index += 1;
            continue;
        }

        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
            nodes.push(makeNode(file, index, trimmed.slice(0, 80), "comment", index + 1));
            index += 1;
            continue;
        }

        const classMatch: RegExpMatchArray | null = trimmed.match(
            /^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/,
        );

        if (classMatch !== null) {
            const start: number = index;
            let depth: number = 0;
            const body: string[] = [];
            let bodyIndex: number = start;

            for (; bodyIndex < lines.length; bodyIndex += 1) {
                const current: string = lines[bodyIndex];
                body.push(current);

                for (const character of current) {
                    if (character === "{") {
                        depth += 1;
                    } else if (character === "}") {
                        depth -= 1;
                    }
                }

                if (depth === 0 && bodyIndex > start) {
                    break;
                }
            }

            const members: StructureNode[] = [];

            for (let memberIndex: number = start + 1; memberIndex < bodyIndex; memberIndex += 1) {
                const member: string = lines[memberIndex].trim();

                if (member.length === 0 || member.startsWith("//")) {
                    continue;
                }

                const methodMatch: RegExpMatchArray | null = member.match(
                    /^(?:(?:public|private|protected|static|async|readonly)\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::\s*[^{]+)?\{/,
                );

                if (methodMatch !== null) {
                    members.push(
                        makeNode(
                            file,
                            memberIndex,
                            methodMatch[1],
                            "method",
                            memberIndex + 1,
                        ),
                    );
                    continue;
                }

                const propertyMatch: RegExpMatchArray | null = member.match(
                    /^(?:(?:public|private|protected|static|readonly)\s+)*([A-Za-z_$][\w$]*)\s*[:=]/,
                );

                if (propertyMatch !== null) {
                    members.push(
                        makeNode(
                            file,
                            memberIndex,
                            propertyMatch[1],
                            "property",
                            memberIndex + 1,
                        ),
                    );
                }
            }

            nodes.push(
                makeNode(file, start, classMatch[1], "class", start + 1, members),
            );
            index = bodyIndex + 1;
            continue;
        }

        const functionMatch: RegExpMatchArray | null = trimmed.match(
            /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/,
        );

        if (functionMatch !== null) {
            nodes.push(
                makeNode(file, index, functionMatch[1], "function", index + 1),
            );
            index += 1;
            continue;
        }

        const declarationMatch: RegExpMatchArray | null = trimmed.match(
            /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=/,
        );

        if (declarationMatch !== null) {
            const isFunction: boolean = trimmed.includes("=>") || trimmed.includes("function");
            nodes.push(
                makeNode(
                    file,
                    index,
                    declarationMatch[1],
                    isFunction ? "function" : "constant",
                    index + 1,
                ),
            );
            index += 1;
            continue;
        }

        const typeMatch: RegExpMatchArray | null = trimmed.match(
            /^(?:export\s+)?(interface|type)\s+([A-Za-z_$][\w$]*)/,
        );

        if (typeMatch !== null) {
            nodes.push(
                makeNode(
                    file,
                    index,
                    typeMatch[2],
                    typeMatch[1] === "interface" ? "interface" : "type",
                    index + 1,
                ),
            );
        }

        index += 1;
    }

    return nodes;
};

type HtmlFrame = {
    tag: string;
    node: StructureNode;
    children: StructureNode[];
};

type MarkdownSection = {
    level: number;
    node: StructureNode;
    children: StructureNode[];
};

const parseHtml: (file: FileNode, content: string) => StructureNode[] = (
    file: FileNode,
    content: string,
): StructureNode[] => {
    const roots: StructureNode[] = [];
    const stack: HtmlFrame[] = [];
    const voidTags: ReadonlySet<string> = new Set<string>([
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    ]);
    const tagPattern: RegExp = /<\/?([a-zA-Z][\w-]*)([^>]*)>/g;
    let match: RegExpExecArray | null;

    while ((match = tagPattern.exec(content)) !== null) {
        const full: string = match[0];
        const tag: string = match[1].toLowerCase();

        if (full.startsWith("</")) {
            const openIndex: number = stack.map(
                (entry: HtmlFrame): string => entry.tag,
            ).lastIndexOf(tag);

            if (openIndex >= 0) {
                stack.splice(openIndex, 1);
            }

            continue;
        }

        const attributes: StructureNode[] = [];
        const attributePattern: RegExp = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
        let attributeMatch: RegExpExecArray | null;

        while ((attributeMatch = attributePattern.exec(match[2])) !== null) {
            const name: string = attributeMatch[1];

            if (name.length > 0) {
                attributes.push(
                    makeNode(file, attributes.length, name, "attribute"),
                );
            }
        }

        const node: StructureNode = makeNode(
            file,
            stack.length,
            `<${tag}>`,
            "tag",
            lineAt(content, match.index),
            attributes,
        );
        const parent: HtmlFrame | undefined = stack[stack.length - 1];

        if (parent === (void 0)) {
            roots.push(node);
        } else {
            parent.children.push(node);
        }

        if (!voidTags.has(tag) && !full.endsWith("/>")) {
            stack.push({ tag, node, children: [...attributes] });
        }
    }

    return roots;
};

const splitSentences: (file: FileNode, text: string, start: number) => StructureNode[] = (
    file: FileNode,
    text: string,
    start: number,
): StructureNode[] => {
    const sentences: string[] = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [];

    return sentences
        .map((sentence: string): string => sentence.trim())
        .filter((sentence: string): boolean => sentence.length > 0)
        .map((sentence: string, index: number): StructureNode =>
            makeNode(file, start + index, sentence, "sentence"),
        );
};

const parseMarkdown: (file: FileNode, content: string) => StructureNode[] = (
    file: FileNode,
    content: string,
): StructureNode[] => {
    const lines: string[] = content.split("\n");
    const roots: StructureNode[] = [];
    const sections: MarkdownSection[] = [];
    let paragraph: string[] = [];
    let paragraphStart: number = 0;
    let paragraphIndex: number = 0;

    const flushParagraph: () => void = (): void => {
        if (paragraph.length === 0) {
            return;
        }

        const text: string = paragraph.join(" ").trim();
        const parent: MarkdownSection | undefined = sections[sections.length - 1];
        const sentenceNodes: StructureNode[] = splitSentences(file, text, paragraphStart);
        const node: StructureNode = makeNode(
            file,
            paragraphIndex,
            text.length > 90 ? `${text.slice(0, 90)}…` : text,
            "paragraph",
            paragraphStart + 1,
            sentenceNodes,
        );

        if (parent === (void 0)) {
            roots.push(node);
        } else {
            parent.children.push(node);
        }

        paragraph = [];
        paragraphIndex += 1;
    };

    for (let index: number = 0; index < lines.length; index += 1) {
        const line: string = lines[index];
        const heading: RegExpMatchArray | null = line.match(/^(#{1,6})\s+(.+)$/);

        if (heading !== null) {
            flushParagraph();
            const level: number = heading[1].length;
            const node: StructureNode = makeNode(
                file,
                index,
                heading[2].trim(),
                "section",
                index + 1,
                [],
            );

            while (sections.length > 0 && sections[sections.length - 1].level >= level) {
                sections.pop();
            }

            const parent: MarkdownSection | undefined = sections[sections.length - 1];

            if (parent === (void 0)) {
                roots.push(node);
            } else {
                parent.children.push(node);
            }

            sections.push({ level, node, children: [...(node.children ?? [])] });
            continue;
        }

        if (line.trim().length === 0) {
            flushParagraph();
            continue;
        }

        if (paragraph.length === 0) {
            paragraphStart = index;
        }

        paragraph.push(line.trim());
    }

    flushParagraph();

    return roots;
};

const parsePlainText: (file: FileNode, content: string) => StructureNode[] = (
    file: FileNode,
    content: string,
): StructureNode[] => {
    const roots: StructureNode[] = [];
    const paragraphs: string[] = content.split(/\n\s*\n/);

    paragraphs.forEach((paragraph: string, index: number): void => {
        const text: string = paragraph.trim();

        if (text.length === 0) {
            return;
        }

        roots.push(
            makeNode(
                file,
                index,
                text.length > 90 ? `${text.slice(0, 90)}…` : text,
                "paragraph",
                index + 1,
                splitSentences(file, text, index),
            ),
        );
    });

    return roots;
};

/**
 * Parses a file into a structural outline. HTML yields tags and attributes;
 * Markdown and prose yield sections, paragraphs, and sentences; code yields
 * classes, methods, functions, properties, constants, types, and comments.
 * @param file - File node with optional content.
 * @example
 * const outline = parseStructure(file);
 * @returns A root structure node.
 */
export const parseStructure: (file: FileNode) => StructureNode = (
    file: FileNode,
): StructureNode => {
    const content: string = file.content ?? "";
    const extension: Extension = file.extension ?? extensionOf(file.name);
    let children: StructureNode[] = [];

    if (content.length > 0) {
        if (extension === "html" || extension === "htm") {
            children = parseHtml(file, content);
        } else if (codeExtension(extension)) {
            children = parseCode(file, content);
        } else if (extension === "md" || extension === "txt" || file.language === "Literature") {
            children = parseMarkdown(file, content);
        } else if (/<[a-zA-Z][^>]*>/.test(content)) {
            children = parseHtml(file, content);
        } else {
            children = parsePlainText(file, content);
        }

        if (children.length === 0) {
            children = parseComments(file, content.split("\n"));
        }
    }

    return makeNode(file, 0, file.name, "file", 1, children);
};
