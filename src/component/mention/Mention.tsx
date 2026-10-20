import {
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type ClipboardEvent as ReactClipboardEvent,
    type DragEvent as ReactDragEvent,
    type FC,
    type FocusEvent as ReactFocusEvent,
    type FormEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type RefObject,
} from "react";
import Dropdown, { DropdownItem } from "../dropdown/Dropdown";
import Spinner from "../progress/Spinner";
import cx from "../foundation/cx";
import Surface from "../surface/Surface";
import type { TextInputSize, TextInputVariant } from "../input/text/TextInput";
// Reuse the TextInput field shell (surface, edge, variants, floating label)
// instead of maintaining a second field look.
import "../input/text/TextInput.css";
import "./Mention.css";

/**
 * One mention suggestion.
 * Type: interface.
 * Fields: id, label, description, avatar.
 * @example
 * const person: MentionItem = { id: "mira", label: "Mira Chen" };
 */
export interface MentionItem {
    id: string;
    label: string;
    description?: string;
    avatar?: string;
}

/**
 * Async or sync loader invoked when an `@` token changes.
 * Type: type alias.
 * Fields: none.
 * @example
 * const search: MentionSearch = async (query) => people.filter(...);
 */
export type MentionSearch = (
    query: string,
    context: { readonly signal: AbortSignal },
) => readonly MentionItem[] | Promise<readonly MentionItem[]>;

/**
 * Visual variant of the mention field; mirrors `TextInput`.
 * Type: type alias.
 * Fields: none.
 * @example
 * const variant: MentionVariant = "fill";
 */
export type MentionVariant = TextInputVariant;

/**
 * Control size of the mention field; mirrors `TextInput`.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: MentionSize = "lg";
 */
export type MentionSize = TextInputSize;

/**
 * One committed mention and the character range it owns in `value`.
 * Type: interface.
 * Fields: item, start, end.
 * @example
 * const token: MentionToken = { item: person, start: 6, end: 16 };
 */
export interface MentionToken {
    item: MentionItem;
    start: number;
    end: number;
}

/**
 * Props for the Material mention input.
 * Type: interface.
 * Fields: value, onChange, onSearch, suggestions, onMention, onOpenChange,
 * multiline, rows, label, hint, error, placeholder, disabled, trigger,
 * minChars, maxSuggestions, variant, size, leading, trailing, required,
 * mentions, onMentionsChange, ariaLabel, className, id.
 * @example
 * <Mention
 *     label="Reply"
 *     value={draft}
 *     variant="fill"
 *     onChange={setDraft}
 *     onSearch={async (query) => searchPeople(query)}
 * />
 */
export interface MentionProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: MentionSearch;
    suggestions?: readonly MentionItem[];
    onMention?: (item: MentionItem) => void;
    onOpenChange?: (open: boolean, query: string) => void;
    multiline?: boolean;
    rows?: number;
    label?: string;
    hint?: string;
    error?: string;
    placeholder?: string;
    disabled?: boolean;
    trigger?: string;
    minChars?: number;
    maxSuggestions?: number;
    variant?: MentionVariant;
    size?: MentionSize;
    leading?: ReactNode;
    trailing?: ReactNode;
    required?: boolean;
    mentions?: readonly MentionToken[];
    onMentionsChange?: (mentions: readonly MentionToken[]) => void;
    ariaLabel?: string;
    className?: string;
    id?: string;
}

/**
 * Internal committed token with a stable DOM key and its serialised text.
 * Type: interface.
 * Fields: key, item, text, start, end.
 * @example
 * const token: EditorToken = { key: "mention-token-1", item: person, text: "@Mira Chen ", start: 0, end: 10 };
 */
interface EditorToken {
    key: string;
    item: MentionItem;
    text: string;
    start: number;
    end: number;
}

/**
 * Serialised editor text together with every token it contains.
 * Type: interface.
 * Fields: value, tokens.
 * @example
 * const snapshot: EditorSnapshot = { value: "@Mira Chen ", tokens: [] };
 */
interface EditorSnapshot {
    value: string;
    tokens: readonly EditorToken[];
}

/**
 * Ordered start and end offsets of the current selection.
 * Type: interface.
 * Fields: start, end.
 * @example
 * const offsets: SelectionOffsets = { start: 2, end: 2 };
 */
interface SelectionOffsets {
    start: number;
    end: number;
}

const TokenSelector: string = "[data-mention-key]";
const RemoveSelector: string = "[data-mention-remove]";

let MentionKeySeed: number = 0;

/**
 * Creates a stable key for a rendered mention token.
 * @param none - No parameters.
 * @example
 * const key = createTokenKey();
 * @returns A unique token key.
 */
const createTokenKey: () => string = (): string => {
    MentionKeySeed += 1;
    return `mention-token-${MentionKeySeed}`;
};

/**
 * Serialises a DOM node to the plain text stored in `value`; token elements
 * contribute their full serialised text, including the trailing space.
 * @param node - Node to serialise.
 * @example
 * const text = serialiseNode(editor);
 * @returns Plain text for the node.
 */
const serialiseNode: (node: Node) => string = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue ?? "";
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        const element: HTMLElement = node as HTMLElement;
        const tokenText: string | undefined = element.dataset.mentionText;

        if (tokenText !== (void 0)) {
            return tokenText;
        }

        if (element.tagName === "BR") {
            return "\n";
        }
    }

    let text: string = "";

    for (const child of Array.from(node.childNodes)) {
        text += serialiseNode(child);
    }

    return text;
};

/**
 * Measures the serialised text before a node inside an editor.
 * @param editor - Editor root.
 * @param target - Node to measure to.
 * @example
 * const offset = serialisedOffsetOfNode(editor, token);
 * @returns Character offset of the node start.
 */
const serialisedOffsetOfNode: (editor: HTMLElement, target: Node) => number = (
    editor: HTMLElement,
    target: Node,
): number => {
    let total: number = 0;
    let node: Node = target;

    while (node !== editor && node.parentNode !== null) {
        let sibling: Node | null = node.previousSibling;

        while (sibling !== null) {
            total += serialiseNode(sibling).length;
            sibling = sibling.previousSibling;
        }

        node = node.parentNode;
    }

    return total;
};

/**
 * Measures the serialised text before a point inside one node.
 * @param node - Container of the point.
 * @param offset - Text offset for text nodes, child index for elements.
 * @example
 * const offset = serialisedOffsetWithin(textNode, 4);
 * @returns Character offset inside the node.
 */
const serialisedOffsetWithin: (node: Node, offset: number) => number = (
    node: Node,
    offset: number,
): number => {
    if (node.nodeType === Node.TEXT_NODE) {
        return Math.min(offset, (node.nodeValue ?? "").length);
    }

    let total: number = 0;
    const children: readonly Node[] = Array.from(node.childNodes);

    for (let index: number = 0; index < offset && index < children.length; index += 1) {
        total += serialiseNode(children[index]).length;
    }

    return total;
};

/**
 * Measures the serialised text before a DOM point inside an editor.
 * @param editor - Editor root.
 * @param container - Point container.
 * @param offset - Point offset.
 * @example
 * const offset = serialisedOffsetOfPoint(editor, textNode, 3);
 * @returns Character offset of the point.
 */
const serialisedOffsetOfPoint: (editor: HTMLElement, container: Node, offset: number) => number = (
    editor: HTMLElement,
    container: Node,
    offset: number,
): number => serialisedOffsetOfNode(editor, container) + serialisedOffsetWithin(container, offset);

/**
 * Finds the mention token that contains a node.
 * @param editor - Editor root.
 * @param node - Node to inspect.
 * @example
 * const token = tokenAncestor(editor, selection.anchorNode);
 * @returns The token element, or `null` when the node is outside a token.
 */
const tokenAncestor: (editor: HTMLElement, node: Node) => HTMLElement | null = (
    editor: HTMLElement,
    node: Node,
): HTMLElement | null => {
    const element: Element | null =
        node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;

    if (element === null) {
        return null;
    }

    const token: HTMLElement | null = element.closest<HTMLElement>(TokenSelector);

    return token !== null && editor.contains(token) ? token : null;
};

/**
 * Reads the current value and token layout from the editor DOM.
 * @param editor - Editor root.
 * @param items - Item lookup populated when tokens were rendered.
 * @example
 * const snapshot = readEditorSnapshot(editor, items);
 * @returns Serialised value and token records.
 */
const readEditorSnapshot: (
    editor: HTMLElement,
    items: ReadonlyMap<string, MentionItem>,
) => EditorSnapshot = (editor: HTMLElement, items: ReadonlyMap<string, MentionItem>): EditorSnapshot => {
    let value: string = "";
    const tokens: EditorToken[] = [];

    const visit: (node: Node) => void = (node: Node): void => {
        if (node.nodeType === Node.TEXT_NODE) {
            value += node.nodeValue ?? "";
            return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const element: HTMLElement = node as HTMLElement;
            const key: string | undefined = element.dataset.mentionKey;
            const text: string | undefined = element.dataset.mentionText;

            if (key !== (void 0) && text !== (void 0)) {
                const item: MentionItem =
                    items.get(key) ?? { id: key, label: element.dataset.mentionLabel ?? "" };

                tokens.push({ key, item, text, start: value.length, end: value.length + text.length });
                value += text;
                return;
            }

            if (element.tagName === "BR") {
                value += "\n";
                return;
            }
        }

        for (const child of Array.from(node.childNodes)) {
            visit(child);
        }
    };

    visit(editor);

    return { value, tokens };
};

/**
 * Rebuilds the editor DOM from a value and its token ranges.
 * @param editor - Editor root.
 * @param value - Serialised text to render.
 * @param tokens - Token records to render in place of their text ranges.
 * @param disabled - Whether remove buttons should be disabled.
 * @example
 * const items = renderEditor(editor, value, tokens, false);
 * @returns The item lookup for the rendered tokens.
 */
const renderEditor: (
    editor: HTMLElement,
    value: string,
    tokens: readonly EditorToken[],
    disabled: boolean,
) => Map<string, MentionItem> = (
    editor: HTMLElement,
    value: string,
    tokens: readonly EditorToken[],
    disabled: boolean,
): Map<string, MentionItem> => {
    const items: Map<string, MentionItem> = new Map<string, MentionItem>();
    let cursor: number = 0;

    editor.replaceChildren();

    for (const token of tokens) {
        if (token.start < cursor || token.end > value.length || token.end <= token.start) {
            continue;
        }

        if (token.start > cursor) {
            editor.append(document.createTextNode(value.slice(cursor, token.start)));
        }

        editor.append(createTokenNode(token, disabled));
        items.set(token.key, token.item);
        cursor = token.end;
    }

    if (cursor < value.length) {
        editor.append(document.createTextNode(value.slice(cursor)));
    }

    return items;
};

/**
 * Creates the rounded token element with its avatar, label, and close button.
 * @param token - Token record to render.
 * @param disabled - Whether the close button is disabled.
 * @example
 * const node = createTokenNode(token, false);
 * @returns A token element ready to insert into the editor.
 */
const createTokenNode: (token: EditorToken, disabled: boolean) => HTMLElement = (
    token: EditorToken,
    disabled: boolean,
): HTMLElement => {
    const element: HTMLSpanElement = document.createElement("span");
    const avatar: HTMLSpanElement = document.createElement("span");
    const label: HTMLSpanElement = document.createElement("span");
    const remove: HTMLButtonElement = document.createElement("button");

    element.className = "mention__token";
    element.setAttribute("contenteditable", "false");
    element.dataset.mentionKey = token.key;
    element.dataset.mentionText = token.text;
    element.dataset.mentionLabel = token.item.label;

    avatar.className = "mention__token-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = token.item.label.charAt(0).toUpperCase();

    label.className = "mention__token-label";
    label.textContent = token.item.label;

    remove.type = "button";
    remove.className = "mention__token-remove";
    remove.dataset.mentionRemove = token.key;
    remove.setAttribute("aria-label", `Remove mention ${token.item.label}`);
    remove.disabled = disabled;
    remove.tabIndex = disabled ? -1 : 0;

    element.append(avatar, label, remove);

    return element;
};

/**
 * Removes or shifts token records after a text replacement.
 * @param tokens - Existing token records.
 * @param start - Start of the replaced character range.
 * @param end - End of the replaced character range.
 * @param shift - Length delta applied to tokens after the range.
 * @example
 * const next = spliceTokenRecords(tokens, 4, 9, -5);
 * @returns Token records outside the replaced range, with shifted offsets.
 */
const spliceTokenRecords: (
    tokens: readonly EditorToken[],
    start: number,
    end: number,
    shift: number,
) => EditorToken[] = (
    tokens: readonly EditorToken[],
    start: number,
    end: number,
    shift: number,
): EditorToken[] => {
    const next: EditorToken[] = [];

    for (const token of tokens) {
        if (token.end <= start) {
            next.push(token);
            continue;
        }

        if (token.start >= end) {
            next.push({ ...token, start: token.start + shift, end: token.end + shift });
        }
    }

    return next;
};

/**
 * Expands a character range so that it never cuts through a mention token.
 * @param tokens - Token records sorted by start offset.
 * @param start - Requested range start.
 * @param end - Requested range end.
 * @example
 * const range = expandTokenRange(tokens, 7, 8);
 * @returns A range covering whole tokens.
 */
const expandTokenRange: (tokens: readonly EditorToken[], start: number, end: number) => SelectionOffsets = (
    tokens: readonly EditorToken[],
    start: number,
    end: number,
): SelectionOffsets => {
    let nextStart: number = start;
    let nextEnd: number = end;

    for (const token of tokens) {
        if (token.start < nextEnd && token.end > nextStart) {
            nextStart = Math.min(nextStart, token.start);
            nextEnd = Math.max(nextEnd, token.end);
        }
    }

    return { start: nextStart, end: nextEnd };
};

/**
 * Validates caller-supplied token ranges against a value.
 * @param value - Current serialised value.
 * @param tokens - Caller-supplied tokens.
 * @example
 * const records = resolveProvidedTokens(value, mentions);
 * @returns Valid, non-overlapping token records.
 */
const resolveProvidedTokens: (value: string, tokens: readonly MentionToken[]) => EditorToken[] = (
    value: string,
    tokens: readonly MentionToken[],
): EditorToken[] => {
    const sorted: readonly MentionToken[] = [...tokens].sort(
        (left: MentionToken, right: MentionToken): number => left.start - right.start,
    );
    const records: EditorToken[] = [];
    let cursor: number = 0;

    for (const token of sorted) {
        if (
            !Number.isInteger(token.start) ||
            !Number.isInteger(token.end) ||
            token.start < cursor ||
            token.end <= token.start ||
            token.end > value.length
        ) {
            continue;
        }

        records.push({
            key: createTokenKey(),
            item: token.item,
            text: value.slice(token.start, token.end),
            start: token.start,
            end: token.end,
        });
        cursor = token.end;
    }

    return records;
};

/**
 * Re-finds existing token records in a value that changed outside the editor.
 * @param value - New serialised value.
 * @param tokens - Previous internal token records.
 * @example
 * const records = reconcileTokens(value, previous);
 * @returns Token records whose text still exists, in order.
 */
const reconcileTokens: (value: string, tokens: readonly EditorToken[]) => EditorToken[] = (
    value: string,
    tokens: readonly EditorToken[],
): EditorToken[] => {
    const records: EditorToken[] = [];
    let cursor: number = 0;

    for (const token of tokens) {
        if (token.text.length === 0) {
            continue;
        }

        const start: number = value.indexOf(token.text, cursor);

        if (start < 0) {
            continue;
        }

        const end: number = start + token.text.length;
        records.push({ key: token.key, item: token.item, text: token.text, start, end });
        cursor = end;
    }

    return records;
};

/**
 * Converts internal records to the public token shape.
 * @param tokens - Internal token records.
 * @example
 * const publicTokens = toPublicTokens(tokens);
 * @returns Public tokens without DOM keys or serialised text.
 */
const toPublicTokens: (tokens: readonly EditorToken[]) => MentionToken[] = (
    tokens: readonly EditorToken[],
): MentionToken[] =>
    tokens.map((token: EditorToken): MentionToken => ({
        item: token.item,
        start: token.start,
        end: token.end,
    }));

/**
 * Checks whether two token lists describe the same ranges and items.
 * @param left - First token list.
 * @param right - Second token list.
 * @example
 * const equal = sameTokenLayout(current, provided);
 * @returns True when positions, ids, and labels match.
 */
const sameTokenLayout: (left: readonly EditorToken[], right: readonly EditorToken[]) => boolean = (
    left: readonly EditorToken[],
    right: readonly EditorToken[],
): boolean => {
    if (left.length !== right.length) {
        return false;
    }

    for (let index: number = 0; index < left.length; index += 1) {
        const current: EditorToken = left[index];
        const expected: EditorToken = right[index];

        if (
            current.start !== expected.start ||
            current.end !== expected.end ||
            current.item.id !== expected.item.id ||
            current.item.label !== expected.item.label
        ) {
            return false;
        }
    }

    return true;
};

/**
 * Reads the selection range as serialised character offsets, snapping
 * selection points that fall inside a token to the whole token.
 * @param editor - Editor root.
 * @example
 * const offsets = getSelectionOffsets(editor);
 * @returns Ordered offsets, or `null` when the selection is outside the editor.
 */
const getSelectionOffsets: (editor: HTMLElement) => SelectionOffsets | null = (
    editor: HTMLElement,
): SelectionOffsets | null => {
    const selection: Selection | null = window.getSelection();

    if (selection === null || selection.rangeCount === 0) {
        return null;
    }

    const range: Range = selection.getRangeAt(0);

    if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) {
        return null;
    }

    const startToken: HTMLElement | null = tokenAncestor(editor, range.startContainer);
    const endToken: HTMLElement | null = tokenAncestor(editor, range.endContainer);
    const start: number =
        startToken === null
            ? serialisedOffsetOfPoint(editor, range.startContainer, range.startOffset)
            : serialisedOffsetOfNode(editor, startToken);
    const end: number =
        endToken === null
            ? serialisedOffsetOfPoint(editor, range.endContainer, range.endOffset)
            : serialisedOffsetOfNode(editor, endToken) +
              (endToken.dataset.mentionText ?? "").length;

    return { start: Math.min(start, end), end: Math.max(start, end) };
};

/**
 * Applies a selection range to the document.
 * @param range - Range to select.
 * @example
 * applySelection(range);
 * @returns Nothing.
 */
const applySelection: (range: Range) => void = (range: Range): void => {
    const selection: Selection | null = window.getSelection();

    if (selection === null) {
        return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
};

/**
 * Places the caret at a serialised character offset, snapping into a token to
 * its start and after a token to its end.
 * @param editor - Editor root.
 * @param index - Serialised character offset.
 * @example
 * placeCaretAtIndex(editor, 12);
 * @returns Nothing.
 */
const placeCaretAtIndex: (editor: HTMLElement, index: number) => void = (
    editor: HTMLElement,
    index: number,
): void => {
    let remaining: number = Math.max(0, index);

    const place: (node: Node) => boolean = (node: Node): boolean => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text: string = node.nodeValue ?? "";

            if (remaining <= text.length) {
                const range: Range = document.createRange();
                range.setStart(node, remaining);
                range.collapse(true);
                applySelection(range);
                return true;
            }

            remaining -= text.length;
            return false;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        const element: HTMLElement = node as HTMLElement;
        const tokenText: string | undefined = element.dataset.mentionText;

        if (tokenText !== (void 0)) {
            const range: Range = document.createRange();

            if (remaining < tokenText.length) {
                range.setStartBefore(element);
                range.collapse(true);
                applySelection(range);
                return true;
            }

            if (remaining === tokenText.length) {
                range.setStartAfter(element);
                range.collapse(true);
                applySelection(range);
                return true;
            }

            remaining -= tokenText.length;
            return false;
        }

        if (element.tagName === "BR") {
            if (remaining <= 0) {
                const range: Range = document.createRange();
                range.setStartBefore(element);
                range.collapse(true);
                applySelection(range);
                return true;
            }

            remaining -= 1;
            return false;
        }

        for (const child of Array.from(element.childNodes)) {
            if (place(child)) {
                return true;
            }
        }

        return false;
    };

    if (!place(editor)) {
        const range: Range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        applySelection(range);
    }
};

/**
 * Renders a text field with a floating label, three variants, and atomic
 * mention tokens. Loading stays caller-owned through `onSearch` and its abort
 * signal.
 * @param props - Text value, loaders, tokens, field state, and variant.
 * @example
 * <Mention value={text} onChange={setText} variant="fill" onSearch={loadPeople} />
 * @returns A mention-capable input.
 */
const Mention: FC<MentionProps> = ({
    value,
    onChange,
    onSearch,
    suggestions = [],
    onMention,
    onOpenChange,
    multiline = false,
    rows = 2,
    label,
    hint,
    error,
    placeholder,
    disabled = false,
    trigger = "@",
    minChars = 0,
    maxSuggestions = 8,
    variant = "outline",
    size = "md",
    leading,
    trailing,
    required = false,
    mentions,
    onMentionsChange,
    ariaLabel,
    className = "",
    id,
}: MentionProps) => {
    const generatedId: string = useId();
    const inputId: string = id ?? generatedId;
    const labelId: string = `${inputId}-label`;
    const listboxId: string = `${inputId}-listbox`;
    const hintId: string = `${inputId}-hint`;
    const errorId: string = `${inputId}-error`;
    const fieldRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const editorRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const requestRef: RefObject<number> = useRef<number>(0);
    const abortRef: RefObject<AbortController | null> = useRef<AbortController | null>(null);
    const startRef: RefObject<number> = useRef<number>(-1);
    const caretRef: RefObject<number> = useRef<number>(0);
    const composingRef: RefObject<boolean> = useRef<boolean>(false);
    const lastEmittedRef: RefObject<string> = useRef<string>(value);
    const tokenItemsRef: RefObject<Map<string, MentionItem>> = useRef<Map<string, MentionItem>>(
        new Map<string, MentionItem>(),
    );
    const tokenRecordsRef: RefObject<readonly EditorToken[]> = useRef<readonly EditorToken[]>([]);
    const [open, setOpen]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const [focused, setFocused]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const [query, setQuery]: [string, (next: string) => void] = useState<string>("");
    const [items, setItems]: [readonly MentionItem[], (next: readonly MentionItem[]) => void] =
        useState<readonly MentionItem[]>(suggestions);
    const [loading, setLoading]: [boolean, (next: boolean) => void] = useState<boolean>(false);
    const [activeIndex, setActiveIndex]: [number, (next: number) => void] = useState<number>(-1);
    const hasError: boolean = error !== (void 0) && error.length > 0;
    const hasHint: boolean = hint !== (void 0) && hint.length > 0;
    const describedBy: string = hasError ? errorId : hasHint ? hintId : "";
    const filled: boolean = value.length > 0;
    const mentionsSignature: string =
        mentions === (void 0)
            ? ""
            : mentions
                  .map(
                      (token: MentionToken): string =>
                          `${token.item.id}:${token.start}:${token.end}:${token.item.label}`,
                  )
                  .join("|");
    const previousMentionsSignatureRef: RefObject<string> = useRef<string>(mentionsSignature);
    const previousDisabledRef: RefObject<boolean> = useRef<boolean>(disabled);
    const editorStyle: CSSProperties = { "--mention-rows": `${rows}` } as CSSProperties;
    const status: string = open
        ? loading
            ? "Searching for people."
            : items.length === 0
              ? `No matches for ${trigger}${query}.`
              : activeIndex >= 0 && activeIndex < items.length
                ? `${items.length} suggestions. ${items[activeIndex].label} selected.`
                : `${items.length} suggestions.`
        : "";

    useLayoutEffect((): void => {
        const editor: HTMLDivElement | null = editorRef.current;

        if (editor === null) {
            return;
        }

        const signatureChanged: boolean = previousMentionsSignatureRef.current !== mentionsSignature;
        const disabledChanged: boolean = previousDisabledRef.current !== disabled;
        previousMentionsSignatureRef.current = mentionsSignature;
        previousDisabledRef.current = disabled;
        const snapshot: EditorSnapshot = readEditorSnapshot(editor, tokenItemsRef.current);

        if (snapshot.value === value && !signatureChanged && !disabledChanged) {
            return;
        }

        const providedTokens: readonly EditorToken[] | null =
            mentions === (void 0) ? null : resolveProvidedTokens(value, mentions);
        const layoutMatches: boolean =
            providedTokens !== null &&
            snapshot.value === value &&
            sameTokenLayout(snapshot.tokens, providedTokens);

        if (snapshot.value === value && !disabledChanged && layoutMatches) {
            return;
        }

        const nextTokens: readonly EditorToken[] =
            providedTokens ?? reconcileTokens(value, tokenRecordsRef.current);
        const focused: boolean =
            document.activeElement === editor || editor.contains(document.activeElement);
        const offsets: SelectionOffsets | null = focused ? getSelectionOffsets(editor) : null;
        const caret: number | null =
            offsets === null ? null : Math.min(offsets.end, value.length);

        tokenItemsRef.current = renderEditor(editor, value, nextTokens, disabled);
        tokenRecordsRef.current = nextTokens;
        lastEmittedRef.current = value;

        if (caret !== null && !disabled) {
            caretRef.current = caret;
            editor.focus({ preventScroll: true });
            placeCaretAtIndex(editor, caret);
        }
    }, [value, mentions, mentionsSignature, disabled]);

    /**
     * Closes the suggestion list and clears the active option.
     * @example
     * close();
     * @returns Nothing.
     */
    const close: () => void = (): void => {
        setOpen(false);
        setActiveIndex(-1);
        startRef.current = -1;
        onOpenChange?.(false, "");
    };

    /**
     * Loads suggestions for a query and aborts the previous request.
     * @param nextQuery - Text after the trigger character.
     * @example
     * void load("mi");
     * @returns A promise that settles once the latest request has updated the list.
     */
    const load: (nextQuery: string) => Promise<void> = async (nextQuery: string): Promise<void> => {
        const request: number = requestRef.current + 1;
        requestRef.current = request;
        abortRef.current?.abort();
        const controller: AbortController = new AbortController();
        abortRef.current = controller;

        if (onSearch === (void 0)) {
            const fallback: readonly MentionItem[] = suggestions
                .filter((item: MentionItem): boolean =>
                    item.label.toLowerCase().includes(nextQuery.toLowerCase()),
                )
                .slice(0, maxSuggestions);
            setItems(fallback);
            setActiveIndex(fallback.length > 0 ? 0 : -1);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const loaded: readonly MentionItem[] = await onSearch(nextQuery, {
                signal: controller.signal,
            });

            if (request !== requestRef.current || controller.signal.aborted) {
                return;
            }

            const next: readonly MentionItem[] = loaded.slice(0, maxSuggestions);
            setItems(next);
            setActiveIndex(next.length > 0 ? 0 : -1);
        } catch {
            if (request === requestRef.current && !controller.signal.aborted) {
                setItems([]);
                setActiveIndex(-1);
            }
        } finally {
            if (request === requestRef.current) {
                setLoading(false);
            }
        }
    };

    /**
     * Finds the active trigger before the caret and refreshes the suggestions.
     * @param nextValue - Serialised editor text.
     * @param caret - Caret character offset, or null when unknown.
     * @param records - Token ranges used to ignore triggers inside tokens.
     * @example
     * detect(value, caret, tokens);
     * @returns Nothing.
     */
    const detect: (nextValue: string, caret: number | null, records: readonly EditorToken[]) => void = (
        nextValue: string,
        caret: number | null,
        records: readonly EditorToken[],
    ): void => {
        const position: number = caret ?? nextValue.length;
        const before: string = nextValue.slice(0, position);
        const triggerIndex: number = before.lastIndexOf(trigger);

        if (triggerIndex < 0) {
            if (open) {
                close();
            }

            return;
        }

        const insideToken: boolean = records.some(
            (record: EditorToken): boolean => triggerIndex >= record.start && triggerIndex < record.end,
        );

        if (insideToken) {
            if (open) {
                close();
            }

            return;
        }

        const preceding: string = triggerIndex === 0 ? "" : before[triggerIndex - 1];
        const nextQuery: string = before.slice(triggerIndex + trigger.length);

        if (
            nextQuery.includes(" ") ||
            nextQuery.includes("\n") ||
            (preceding.length > 0 && !/\s/.test(preceding)) ||
            nextQuery.length < minChars
        ) {
            if (open) {
                close();
            }

            return;
        }

        startRef.current = triggerIndex;
        setQuery(nextQuery);
        setOpen(true);
        onOpenChange?.(true, nextQuery);
        void load(nextQuery);
    };

    /**
     * Rebuilds the editor DOM from a new value and token layout.
     * @param editor - Editor root.
     * @param nextValue - Serialised text to render.
     * @param records - Token records to render as chips.
     * @example
     * rebuildEditor(editor, value, tokens);
     * @returns Nothing.
     */
    const rebuildEditor: (
        editor: HTMLDivElement,
        nextValue: string,
        records: readonly EditorToken[],
    ) => void = (
        editor: HTMLDivElement,
        nextValue: string,
        records: readonly EditorToken[],
    ): void => {
        tokenItemsRef.current = renderEditor(editor, nextValue, records, disabled);
        tokenRecordsRef.current = records;
        lastEmittedRef.current = nextValue;
    };

    /**
     * Reads the edited DOM and publishes value, token, and caret changes.
     * @param editor - Editor root.
     * @example
     * emitSnapshot(editor);
     * @returns Nothing.
     */
    const emitSnapshot: (editor: HTMLDivElement) => void = (editor: HTMLDivElement): void => {
        const snapshot: EditorSnapshot = readEditorSnapshot(editor, tokenItemsRef.current);
        tokenRecordsRef.current = snapshot.tokens;

        if (snapshot.value !== lastEmittedRef.current) {
            lastEmittedRef.current = snapshot.value;
            onChange(snapshot.value);
            onMentionsChange?.(toPublicTokens(snapshot.tokens));
        }

        const offsets: SelectionOffsets | null = getSelectionOffsets(editor);
        let caret: number = offsets === null ? snapshot.value.length : offsets.end;

        // Removing the final character can leave an empty text node, which would
        // keep the placeholder hidden because the editor is no longer `:empty`.
        if (snapshot.value.length === 0 && editor.childNodes.length > 0) {
            const focused: boolean = document.activeElement === editor;
            editor.replaceChildren();
            caret = 0;

            if (focused) {
                placeCaretAtIndex(editor, 0);
            }
        }

        caretRef.current = caret;
        detect(snapshot.value, caret, snapshot.tokens);
    };

    /**
     * Replaces a character range with text and optionally a new mention token.
     * @param start - Range start in serialised characters.
     * @param end - Range end in serialised characters.
     * @param text - Replacement text.
     * @param item - Mention to insert, or null for plain text.
     * @param caret - Caret offset after the replacement.
     * @example
     * applyValue(0, 3, "@Mira Chen ", person, 11);
     * @returns Nothing.
     */
    const applyValue: (
        start: number,
        end: number,
        text: string,
        item: MentionItem | null,
        caret: number,
    ) => void = (
        start: number,
        end: number,
        text: string,
        item: MentionItem | null,
        caret: number,
    ): void => {
        const editor: HTMLDivElement | null = editorRef.current;

        if (editor === null) {
            return;
        }

        const snapshot: EditorSnapshot = readEditorSnapshot(editor, tokenItemsRef.current);
        const range: SelectionOffsets = expandTokenRange(snapshot.tokens, start, end);
        const safeStart: number = Math.max(0, Math.min(range.start, snapshot.value.length));
        const safeEnd: number = Math.max(safeStart, Math.min(range.end, snapshot.value.length));
        const nextValue: string = `${snapshot.value.slice(0, safeStart)}${text}${snapshot.value.slice(safeEnd)}`;
        const shift: number = text.length - (safeEnd - safeStart);
        const nextTokens: EditorToken[] = spliceTokenRecords(snapshot.tokens, safeStart, safeEnd, shift);

        if (item !== null && text.length > 0) {
            nextTokens.push({
                key: createTokenKey(),
                item,
                text,
                start: safeStart,
                end: safeStart + text.length,
            });
            nextTokens.sort((left: EditorToken, right: EditorToken): number => left.start - right.start);
        }

        rebuildEditor(editor, nextValue, nextTokens);
        onChange(nextValue);
        onMentionsChange?.(toPublicTokens(nextTokens));
        detect(nextValue, caret, nextTokens);

        if (!disabled) {
            caretRef.current = caret;
            editor.focus({ preventScroll: true });
            placeCaretAtIndex(editor, caret);
        }
    };

    /**
     * Handles Backspace or Delete when the selection touches a token, removing
     * the whole token instead of partial label text.
     * @param direction - `backward` for Backspace, `forward` for Delete.
     * @example
     * const handled = deleteAtomically("backward");
     * @returns True when the event was handled.
     */
    const deleteAtomically: (direction: "backward" | "forward") => boolean = (
        direction: "backward" | "forward",
    ): boolean => {
        const editor: HTMLDivElement | null = editorRef.current;

        if (editor === null) {
            return false;
        }

        const offsets: SelectionOffsets | null = getSelectionOffsets(editor);

        if (offsets === null) {
            return false;
        }

        const snapshot: EditorSnapshot = readEditorSnapshot(editor, tokenItemsRef.current);
        let start: number = offsets.start;
        let end: number = offsets.end;

        if (start === end) {
            const token: EditorToken | undefined = snapshot.tokens.find(
                (record: EditorToken): boolean =>
                    direction === "backward"
                        ? start > record.start && start <= record.end
                        : start >= record.start && start < record.end,
            );

            if (token === (void 0)) {
                return false;
            }

            start = token.start;
            end = token.end;
        } else {
            const expanded: SelectionOffsets = expandTokenRange(snapshot.tokens, start, end);
            start = expanded.start;
            end = expanded.end;
        }

        applyValue(start, end, "", null, start);

        return true;
    };

    /**
     * Replaces the active trigger and query with one atomic mention token.
     * @param item - Selected mention suggestion.
     * @example
     * choose(person);
     * @returns Nothing.
     */
    const choose: (item: MentionItem) => void = (item: MentionItem): void => {
        const editor: HTMLDivElement | null = editorRef.current;

        if (editor === null) {
            return;
        }

        const snapshot: EditorSnapshot = readEditorSnapshot(editor, tokenItemsRef.current);
        const offsets: SelectionOffsets | null = getSelectionOffsets(editor);
        const start: number = startRef.current;
        const caret: number = offsets === null ? caretRef.current : offsets.end;

        if (start < 0 || start > caret || caret > snapshot.value.length) {
            return;
        }

        if (snapshot.value.slice(start, start + trigger.length) !== trigger) {
            return;
        }

        const overlap: boolean = snapshot.tokens.some(
            (record: EditorToken): boolean => record.start < caret && record.end > start,
        );

        if (overlap) {
            return;
        }

        const text: string = `${trigger}${item.label} `;
        applyValue(start, caret, text, item, start + text.length);
        onMention?.(item);
    };

    /**
     * Records the current caret offset so pointer selection of an option can
     * still replace the right trigger range.
     * @example
     * rememberCaret();
     * @returns Nothing.
     */
    const rememberCaret: () => void = (): void => {
        const editor: HTMLDivElement | null = editorRef.current;

        if (editor === null) {
            return;
        }

        const offsets: SelectionOffsets | null = getSelectionOffsets(editor);

        if (offsets !== null) {
            caretRef.current = offsets.end;
        }
    };

    /**
     * Inserts pasted or dropped plain text at the selection.
     * @param text - Plain text to insert.
     * @example
     * pasteText("hello");
     * @returns Nothing.
     */
    const pasteText: (text: string) => void = (text: string): void => {
        const editor: HTMLDivElement | null = editorRef.current;

        if (editor === null) {
            return;
        }

        const normalised: string = multiline ? text : text.replace(/\r\n|\r|\n/g, " ");
        const snapshot: EditorSnapshot = readEditorSnapshot(editor, tokenItemsRef.current);
        const offsets: SelectionOffsets | null = getSelectionOffsets(editor);
        const start: number = offsets === null ? snapshot.value.length : offsets.start;
        const end: number = offsets === null ? snapshot.value.length : offsets.end;

        applyValue(start, end, normalised, null, start + normalised.length);
    };

    /**
     * Publishes the edited DOM after native typing or deletion.
     * @param event - Editor input event.
     * @example
     * <div onInput={handleInput} />
     * @returns Nothing.
     */
    const handleInput: (event: FormEvent<HTMLDivElement>) => void = (
        event: FormEvent<HTMLDivElement>,
    ): void => {
        const native: InputEvent = event.nativeEvent as InputEvent;

        if (composingRef.current || native.isComposing) {
            return;
        }

        emitSnapshot(event.currentTarget);
    };

    /**
     * Enforces atomic deletion and atomic replacement for the mobile input
     * path, where no keydown event is guaranteed.
     * @param event - Editor beforeinput event.
     * @example
     * <div onBeforeInput={handleBeforeInput} />
     * @returns Nothing.
     */
    const handleBeforeInput: (event: FormEvent<HTMLDivElement>) => void = (
        event: FormEvent<HTMLDivElement>,
    ): void => {
        if (composingRef.current) {
            return;
        }

        const native: InputEvent = event.nativeEvent as InputEvent;
        const inputType: string = native.inputType;

        if (inputType === "deleteContentBackward") {
            if (deleteAtomically("backward")) {
                event.preventDefault();
            }

            return;
        }

        if (inputType === "deleteContentForward" && deleteAtomically("forward")) {
            event.preventDefault();
            return;
        }

        if (inputType !== "insertText" && inputType !== "insertReplacementText") {
            return;
        }

        const editor: HTMLDivElement | null = editorRef.current;

        if (editor === null) {
            return;
        }

        const offsets: SelectionOffsets | null = getSelectionOffsets(editor);

        if (offsets === null || offsets.start === offsets.end) {
            return;
        }

        const snapshot: EditorSnapshot = readEditorSnapshot(editor, tokenItemsRef.current);
        const intersects: boolean = snapshot.tokens.some(
            (record: EditorToken): boolean => record.start < offsets.end && record.end > offsets.start,
        );

        if (!intersects) {
            return;
        }

        const text: string = native.data ?? "";
        event.preventDefault();
        applyValue(offsets.start, offsets.end, text, null, offsets.start + text.length);
    };

    /**
     * Keeps the APG combobox keyboard model, atomic token deletion, and
     * multiline Enter behaviour.
     * @param event - Editor keydown event.
     * @example
     * <div onKeyDown={handleKeyDown} />
     * @returns Nothing.
     */
    const handleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        if (event.nativeEvent.isComposing) {
            return;
        }

        const target: EventTarget | null = event.target;

        // A focused close button must keep its native Enter/Space activation.
        if (target instanceof Element && target.closest(RemoveSelector) !== null) {
            return;
        }

        if (open) {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();

                if (items.length === 0) {
                    return;
                }

                const step: number = event.key === "ArrowDown" ? 1 : -1;
                setActiveIndex((activeIndex + step + items.length) % items.length);
                return;
            }

            if (event.key === "Enter" && activeIndex >= 0 && activeIndex < items.length) {
                event.preventDefault();
                choose(items[activeIndex]);
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();
                close();
                return;
            }
        }

        if (event.key === "Backspace" && deleteAtomically("backward")) {
            event.preventDefault();
            return;
        }

        if (event.key === "Delete" && deleteAtomically("forward")) {
            event.preventDefault();
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();

            if (!multiline) {
                return;
            }

            const editor: HTMLDivElement | null = editorRef.current;

            if (editor === null) {
                return;
            }

            const snapshot: EditorSnapshot = readEditorSnapshot(editor, tokenItemsRef.current);
            const offsets: SelectionOffsets | null = getSelectionOffsets(editor);
            const start: number = offsets === null ? snapshot.value.length : offsets.start;
            const end: number = offsets === null ? snapshot.value.length : offsets.end;

            applyValue(start, end, "\n", null, start + 1);
        }
    };

    /**
     * Copies a range containing tokens as serialised `@name` text.
     * @param event - Editor copy event.
     * @example
     * <div onCopy={handleCopy} />
     * @returns Nothing.
     */
    const handleCopy: (event: ReactClipboardEvent<HTMLDivElement>) => void = (
        event: ReactClipboardEvent<HTMLDivElement>,
    ): void => {
        const editor: HTMLDivElement | null = editorRef.current;

        if (editor === null) {
            return;
        }

        const offsets: SelectionOffsets | null = getSelectionOffsets(editor);

        if (offsets === null || offsets.start === offsets.end) {
            return;
        }

        const snapshot: EditorSnapshot = readEditorSnapshot(editor, tokenItemsRef.current);
        const intersects: boolean = snapshot.tokens.some(
            (record: EditorToken): boolean => record.start < offsets.end && record.end > offsets.start,
        );

        if (!intersects) {
            return;
        }

        const expanded: SelectionOffsets = expandTokenRange(snapshot.tokens, offsets.start, offsets.end);
        event.preventDefault();
        event.clipboardData.setData("text/plain", snapshot.value.slice(expanded.start, expanded.end));
    };

    /**
     * Cuts a range containing tokens atomically and copies its serialised text.
     * @param event - Editor cut event.
     * @example
     * <div onCut={handleCut} />
     * @returns Nothing.
     */
    const handleCut: (event: ReactClipboardEvent<HTMLDivElement>) => void = (
        event: ReactClipboardEvent<HTMLDivElement>,
    ): void => {
        if (disabled) {
            return;
        }

        const editor: HTMLDivElement | null = editorRef.current;

        if (editor === null) {
            return;
        }

        const offsets: SelectionOffsets | null = getSelectionOffsets(editor);

        if (offsets === null || offsets.start === offsets.end) {
            return;
        }

        const snapshot: EditorSnapshot = readEditorSnapshot(editor, tokenItemsRef.current);
        const intersects: boolean = snapshot.tokens.some(
            (record: EditorToken): boolean => record.start < offsets.end && record.end > offsets.start,
        );

        if (!intersects) {
            return;
        }

        const expanded: SelectionOffsets = expandTokenRange(snapshot.tokens, offsets.start, offsets.end);
        event.preventDefault();
        event.clipboardData.setData("text/plain", snapshot.value.slice(expanded.start, expanded.end));
        applyValue(expanded.start, expanded.end, "", null, expanded.start);
    };

    /**
     * Inserts clipboard text as plain text so pasted HTML cannot break the
     * editor model.
     * @param event - Editor paste event.
     * @example
     * <div onPaste={handlePaste} />
     * @returns Nothing.
     */
    const handlePaste: (event: ReactClipboardEvent<HTMLDivElement>) => void = (
        event: ReactClipboardEvent<HTMLDivElement>,
    ): void => {
        if (disabled) {
            return;
        }

        event.preventDefault();
        const text: string = event.clipboardData.getData("text/plain");

        if (text.length > 0) {
            pasteText(text);
        }
    };

    /**
     * Inserts dropped plain text at the selection.
     * @param event - Editor drop event.
     * @example
     * <div onDrop={handleDrop} />
     * @returns Nothing.
     */
    const handleDrop: (event: ReactDragEvent<HTMLDivElement>) => void = (
        event: ReactDragEvent<HTMLDivElement>,
    ): void => {
        if (disabled) {
            return;
        }

        event.preventDefault();
        const text: string = event.dataTransfer.getData("text/plain");

        if (text.length > 0) {
            pasteText(text);
        }
    };

    /**
     * Marks the start of an IME composition so intermediate text is not
     * published.
     * @example
     * <div onCompositionStart={handleCompositionStart} />
     * @returns Nothing.
     */
    const handleCompositionStart: () => void = (): void => {
        composingRef.current = true;
    };

    /**
     * Publishes the editor text once an IME composition finishes.
     * @example
     * <div onCompositionEnd={handleCompositionEnd} />
     * @returns Nothing.
     */
    const handleCompositionEnd: () => void = (): void => {
        composingRef.current = false;
        const editor: HTMLDivElement | null = editorRef.current;

        if (editor !== null) {
            emitSnapshot(editor);
        }
    };

    /**
     * Marks the field as focused so the floating label works even when the
     * focused node is a token close button.
     * @example
     * <div onFocus={handleRootFocus} />
     * @returns Nothing.
     */
    const handleRootFocus: () => void = (): void => {
        setFocused(true);
    };

    /**
     * Clears the focused state only when focus leaves the whole field.
     * @param event - Focus event from the field root.
     * @example
     * <div onBlur={handleRootBlur} />
     * @returns Nothing.
     */
    const handleRootBlur: (event: ReactFocusEvent<HTMLDivElement>) => void = (
        event: ReactFocusEvent<HTMLDivElement>,
    ): void => {
        const next: EventTarget | null = event.relatedTarget;

        if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
            setFocused(false);
        }
    };

    /**
     * Removes a token when its circular close button is activated.
     * @param event - Click event from the editor.
     * @example
     * <div onClick={handleEditorClick} />
     * @returns Nothing.
     */
    const handleEditorClick: (event: ReactMouseEvent<HTMLDivElement>) => void = (
        event: ReactMouseEvent<HTMLDivElement>,
    ): void => {
        if (disabled) {
            return;
        }

        const target: EventTarget | null = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        const button: HTMLElement | null = target.closest<HTMLElement>(RemoveSelector);

        if (button === null || !event.currentTarget.contains(button)) {
            return;
        }

        const key: string | undefined = button.dataset.mentionRemove;
        const editor: HTMLDivElement | null = editorRef.current;

        if (key === (void 0) || editor === null) {
            return;
        }

        event.preventDefault();
        const snapshot: EditorSnapshot = readEditorSnapshot(editor, tokenItemsRef.current);
        const token: EditorToken | undefined = snapshot.tokens.find(
            (record: EditorToken): boolean => record.key === key,
        );

        if (token === (void 0)) {
            return;
        }

        applyValue(token.start, token.end, "", null, token.start);
    };

    /**
     * Keeps the caret in the editor when a close button is pressed.
     * @param event - Mouse down event from the editor.
     * @example
     * <div onMouseDown={handleEditorMouseDown} />
     * @returns Nothing.
     */
    const handleEditorMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => void = (
        event: ReactMouseEvent<HTMLDivElement>,
    ): void => {
        const target: EventTarget | null = event.target;

        if (target instanceof Element && target.closest(RemoveSelector) !== null) {
            event.preventDefault();
        }
    };

    /**
     * Moves focus into the editor when the floating label is pressed.
     * @param event - Mouse down event from the label.
     * @example
     * <label onMouseDown={handleLabelMouseDown} />
     * @returns Nothing.
     */
    const handleLabelMouseDown: (event: ReactMouseEvent<HTMLLabelElement>) => void = (
        event: ReactMouseEvent<HTMLLabelElement>,
    ): void => {
        if (disabled) {
            return;
        }

        event.preventDefault();
        editorRef.current?.focus({ preventScroll: true });
    };

    return (
        <div
            ref={fieldRef}
            className={cx(
                "text-field",
                `text-field--${variant}`,
                `text-field--${size}`,
                "mention",
                multiline && "mention--multiline",
                disabled && "mention--disabled",
                filled && "mention--filled",
                focused && "mention--focused",
                hasError && "text-field--invalid",
                leading !== (void 0) && "text-field--leading",
                label !== (void 0) && "mention--has-label",
                className,
            )}
            data-invalid={hasError ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
            data-filled={filled ? "true" : "false"}
            data-open={open ? "true" : "false"}
            onFocus={handleRootFocus}
            onBlur={handleRootBlur}
        >
            <div className="text-field__control">
                <Surface
                    className="text-field__surface"
                    background={<span className="text-field__background" />}
                    foreground={<span className="text-field__edge" />}
                >
                    <div className="text-field__row">
                        {leading === (void 0) ? null : (
                            <span className="text-field__leading" aria-hidden="true">
                                {leading}
                            </span>
                        )}
                        <div
                            ref={editorRef}
                            id={inputId}
                            className="mention__editor"
                            contentEditable={!disabled}
                            suppressContentEditableWarning
                            role="combobox"
                            tabIndex={disabled ? -1 : 0}
                            spellCheck={false}
                            data-placeholder={placeholder}
                            data-filled={filled ? "true" : "false"}
                            data-multiline={multiline ? "true" : "false"}
                            style={multiline ? editorStyle : (void 0)}
                            aria-autocomplete="list"
                            aria-expanded={open}
                            aria-controls={listboxId}
                            aria-haspopup="listbox"
                            aria-multiline={multiline}
                            aria-invalid={hasError}
                            aria-required={required}
                            aria-disabled={disabled}
                            aria-busy={loading}
                            aria-labelledby={label === (void 0) ? (void 0) : labelId}
                            aria-label={label === (void 0) ? (ariaLabel ?? placeholder) : (void 0)}
                            aria-placeholder={placeholder}
                            aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                            onInput={handleInput}
                            onBeforeInput={handleBeforeInput}
                            onKeyDown={handleKeyDown}
                            onKeyUp={rememberCaret}
                            onFocus={rememberCaret}
                            onMouseUp={rememberCaret}
                            onCopy={handleCopy}
                            onCut={handleCut}
                            onPaste={handlePaste}
                            onDrop={handleDrop}
                            onCompositionStart={handleCompositionStart}
                            onCompositionEnd={handleCompositionEnd}
                            onClick={handleEditorClick}
                            onMouseDown={handleEditorMouseDown}
                        />
                        {trailing === (void 0) ? null : (
                            <span className="text-field__trailing" aria-hidden="true">
                                {trailing}
                            </span>
                        )}
                    </div>
                </Surface>

                {label === (void 0) ? null : (
                    <label
                        id={labelId}
                        className="text-field__label"
                        htmlFor={inputId}
                        onMouseDown={handleLabelMouseDown}
                    >
                        {label}
                        {required ? (
                            <span className="text-field__required" aria-hidden="true">
                                *
                            </span>
                        ) : null}
                    </label>
                )}
            </div>

            {hasError ? (
                <p className="text-field__error" id={errorId} aria-live="polite">
                    {error}
                </p>
            ) : hasHint ? (
                <p className="text-field__hint" id={hintId}>
                    {hint}
                </p>
            ) : null}

            <span className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
                {status}
            </span>

            <Dropdown
                open={open}
                onOpenChange={(next: boolean): void => {
                    if (!next) {
                        close();
                    }
                }}
                anchorRef={fieldRef}
                placement="bottom-start"
                matchWidth
                autoFocus={false}
                role="listbox"
                ariaLabel="Mention suggestions"
                isEmpty={loading || items.length === 0}
                empty={
                    <span className="mention__loading">
                        {loading ? (
                            <>
                                <Spinner size="sm" />
                                Searching people…
                            </>
                        ) : (
                            `No matches for ${trigger}${query}`
                        )}
                    </span>
                }
            >
                <div id={listboxId} className="mention__list">
                    {items.map((item: MentionItem, index: number): ReactNode => (
                        <DropdownItem
                            key={item.id}
                            selected={index === activeIndex}
                            role="option"
                            onSelect={(): void => choose(item)}
                        >
                            <span className="mention__option">
                                <span className="mention__avatar">{item.label.charAt(0)}</span>
                                <span className="mention__copy">
                                    <span className="mention__name">{item.label}</span>
                                    {item.description === (void 0) ? null : (
                                        <span className="mention__description">
                                            {item.description}
                                        </span>
                                    )}
                                </span>
                            </span>
                        </DropdownItem>
                    ))}
                </div>
            </Dropdown>
        </div>
    );
};

export default Mention;
