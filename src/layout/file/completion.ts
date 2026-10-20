import { OrderedMap } from "../../structure";

/**
 * One N-gram completion candidate.
 * Type: interface.
 * Fields: value, score.
 * @example
 * const suggestion: CompletionSuggestion = { value: "useState", score: 0.42 };
 */
export interface CompletionSuggestion {
    value: string;
    score: number;
}

/**
 * Next-token counts indexed by context.
 * Type: type alias.
 * Fields: none.
 * @example
 * const model: NgramModel = buildNgramModel(source);
 */
export type NgramModel = OrderedMap<string, OrderedMap<string, number>>;

const tokenPattern: RegExp = /[\p{L}\p{N}_$]+/gu;

/**
 * Splits text into word-like tokens.
 * @param text - Source text.
 * @example
 * const tokens = tokenize("const value = 1;");
 * @returns Tokens in source order.
 */
export const tokenize: (text: string) => readonly string[] = (text: string): readonly string[] =>
    text.match(tokenPattern) ?? [];

/**
 * Builds a trigram model over a document.
 * @param text - Document used as the completion corpus.
 * @param order - Maximum context length.
 * @example
 * const model = buildNgramModel(source);
 * @returns Context-to-next-token counts.
 */
export const buildNgramModel: (text: string, order?: number) => NgramModel = (
    text: string,
    order: number = 3,
): NgramModel => {
    const tokens: readonly string[] = tokenize(text);
    const model: NgramModel = new OrderedMap<string, OrderedMap<string, number>>();

    for (let index: number = 0; index < tokens.length; index += 1) {
        for (let size: number = 1; size <= Math.min(order, index); size += 1) {
            const context: string = tokens.slice(index - size, index).join(" ");
            const next: OrderedMap<string, number> =
                model.get(context) ?? new OrderedMap<string, number>();
            const token: string = tokens[index];
            next.set(token, (next.get(token) ?? 0) + 1);

            if (!model.has(context)) {
                model.set(context, next);
            }
        }
    }

    return model;
};

/**
 * Contributes candidate counts from the longest usable context.
 * @param model - N-gram model.
 * @param context - Context tokens.
 * @param candidates - Mutable candidate counts.
 * @example
 * collect(model, ["const", "value"], counts);
 */
const collect: (
    model: NgramModel,
    context: readonly string[],
    candidates: Map<string, number>,
) => void = (
    model: NgramModel,
    context: readonly string[],
    candidates: Map<string, number>,
): void => {
    for (let size: number = context.length; size > 0; size -= 1) {
        const key: string = context.slice(context.length - size).join(" ");
        const counts: OrderedMap<string, number> | void = model.get(key);

        if (counts === (void 0)) {
            continue;
        }

        for (const [token, count] of counts) {
            candidates.set(token, (candidates.get(token) ?? 0) + count);
        }

        if (candidates.size > 0) {
            return;
        }
    }
};

/**
 * Suggests the next token from a trigram model.
 * @param text - Current editor text.
 * @param caret - Caret offset.
 * @param model - N-gram model built from the document.
 * @param limit - Maximum suggestion count.
 * @example
 * const suggestions = getCompletions(source, caret, model);
 * @returns Ranked suggestions, excluding the current prefix.
 */
export const getCompletions: (
    text: string,
    caret: number,
    model: NgramModel,
    limit?: number,
) => readonly CompletionSuggestion[] = (
    text: string,
    caret: number,
    model: NgramModel,
    limit: number = 6,
): readonly CompletionSuggestion[] => {
    const before: string = text.slice(0, caret);
    const prefixMatch: RegExpMatchArray | null = before.match(/[\p{L}\p{N}_$]+$/u);
    const prefix: string = prefixMatch?.[0] ?? "";
    const tokens: readonly string[] = tokenize(before);
    const context: readonly string[] = prefix.length > 0 ? tokens.slice(0, -1) : tokens;
    const candidates: Map<string, number> = new Map<string, number>();

    collect(model, context, candidates);

    return [...candidates.entries()]
        .filter(
            ([value]: readonly [string, number]): boolean =>
                value !== prefix && value.toLowerCase().startsWith(prefix.toLowerCase()),
        )
        .sort(
            (
                first: readonly [string, number],
                second: readonly [string, number],
            ): number => second[1] - first[1] || first[0].localeCompare(second[0]),
        )
        .slice(0, limit)
        .map(([value, score]: readonly [string, number]): CompletionSuggestion => ({
            value,
            score,
        }));
};
