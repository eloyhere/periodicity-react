/**
 * Localisable validation messages for telephone fields.
 * Type: interface.
 * Fields: required, shape, parentheses, digits.
 * @example
 * const messages: TelephoneValidationMessages = { required: "Required", shape: "Digits only", parentheses: "Close parentheses", digits: "5-15 digits" };
 */
export interface TelephoneValidationMessages {
    required: string;
    shape: string;
    parentheses: string;
    digits: string;
}

/**
 * Default messages used when a caller does not supply localised copy.
 * Type: constant.
 * Fields: required, shape, parentheses, digits.
 * @example
 * const message = DefaultTelephoneValidationMessages.required;
 */
const DefaultTelephoneValidationMessages: TelephoneValidationMessages = {
    required: "Enter a telephone number, for example +44 7700 900000.",
    shape: "Use only digits, spaces, hyphens, and parentheses, with an optional leading +.",
    parentheses: "Close the parentheses in the telephone number, for example +1 (555) 123-4567.",
    digits: "Enter a telephone number with 5 to 15 digits, for example +44 7700 900000.",
};

/**
 * Whitespace recognised by the telephone filter.
 * Type: constant.
 * Fields: none.
 * @example
 * const isWhitespace = WhitespacePattern.test(" ");
 */
const WhitespacePattern: RegExp = /\s/;

/**
 * Unicode dashes normalised to an ASCII hyphen.
 * Type: constant.
 * Fields: none.
 * @example
 * const isDash = TelephoneDashPattern.test("–");
 */
const TelephoneDashPattern: RegExp = /[\u2010-\u2015\u2212]/;

/**
 * Parenthesis-balance body shared by the validator and the native pattern attribute.
 * Type: constant.
 * Fields: none.
 * @example
 * const source = TelephoneParenthesesBodySource;
 */
const TelephoneParenthesesBodySource: string = "(?:[^\\(\\)]*\\([^\\(\\)]*\\))*[^\\(\\)]*";

/**
 * Parenthesis-balance lookahead used by the native pattern attribute.
 * Type: constant.
 * Fields: none.
 * @example
 * const source = TelephoneParenthesesSource;
 */
const TelephoneParenthesesSource: string = `(?=${TelephoneParenthesesBodySource}$)`;

/**
 * Digit-count body shared by the validator and the native pattern attribute.
 * Type: constant.
 * Fields: none.
 * @example
 * const source = TelephoneDigitBodySource;
 */
const TelephoneDigitBodySource: string = "(?:\\D*\\d){5,15}\\D*";

/**
 * Digit-count lookahead used by the native pattern attribute.
 * Type: constant.
 * Fields: none.
 * @example
 * const source = TelephoneDigitsSource;
 */
const TelephoneDigitsSource: string = `(?=${TelephoneDigitBodySource}$)`;

/**
 * Character fragment used by the validator and the native pattern attribute.
 * Type: constant.
 * Fields: none.
 * @example
 * const source = TelephoneCharacterSource;
 */
const TelephoneCharacterSource: string = "\\+?[0-9 \\(\\)\\-]*";

/**
 * Practical telephone pattern used by the native pattern attribute.
 * Type: constant.
 * Fields: none.
 * @example
 * const source = TelephonePatternSource;
 */
export const TelephonePatternSource: string =
    `${TelephoneParenthesesSource}${TelephoneDigitsSource}${TelephoneCharacterSource}`;

/**
 * Parenthesis-balance pattern compiled from the shared body.
 * Type: constant.
 * Fields: none.
 * @example
 * const valid = TelephoneParenthesesPattern.test("+1 (555) 123-4567");
 */
const TelephoneParenthesesPattern: RegExp = new RegExp(`^(?:${TelephoneParenthesesBodySource})$`, "u");

/**
 * Shape and character pattern compiled from the shared fragment.
 * Type: constant.
 * Fields: none.
 * @example
 * const valid = TelephoneShapePattern.test("+44 7700 900000");
 */
const TelephoneShapePattern: RegExp = new RegExp(`^(?:${TelephoneCharacterSource})$`, "u");

/**
 * Digit-count pattern compiled from the shared fragment.
 * Type: constant.
 * Fields: none.
 * @example
 * const valid = TelephoneDigitPattern.test("+44 7700 900000");
 */
const TelephoneDigitPattern: RegExp = new RegExp(`^(?:${TelephoneDigitBodySource})$`, "u");

/**
 * Result of filtering a raw telephone string and its caret offset.
 * Type: interface.
 * Fields: value, caret.
 * @example
 * const result: SanitisedTelephoneText = { value: "+44 7700 900000", caret: 15 };
 */
export interface SanitisedTelephoneText {
    value: string;
    caret: number;
}

/**
 * One accepted character together with its position in the raw input.
 * Type: interface.
 * Fields: character, index.
 * @example
 * const kept: KeptCharacter = { character: "+", index: 0 };
 */
interface KeptCharacter {
    character: string;
    index: number;
}

/**
 * Reads the last accepted character, or an empty string for an empty value.
 * @param characters - Accepted characters in source order.
 * @example
 * const last = lastCharacter([{ character: "+", index: 0 }]);
 * @returns The final character, or an empty string.
 */
const lastCharacter: (characters: readonly KeptCharacter[]) => string = (
    characters: readonly KeptCharacter[],
): string => characters.at(-1)?.character ?? "";

/**
 * Normalises one raw character to a space, an ASCII hyphen, or itself.
 * @param character - Raw character from the input.
 * @example
 * const normalised = normaliseCharacter("–");
 * @returns The normalised character.
 */
const normaliseCharacter: (character: string) => string = (character: string): string => {
    if (WhitespacePattern.test(character)) {
        return " ";
    }

    return TelephoneDashPattern.test(character) ? "-" : character;
};

/**
 * Filters raw telephone text to an optional leading `+`, digits, spaces, hyphens,
 * and balanced parentheses. Leading whitespace is removed, whitespace runs are
 * collapsed, and the caret is kept aligned with the accepted characters.
 * @param text - Raw text from the input, including pasted or dropped text.
 * @param caret - Caret offset within the raw text.
 * @example
 * const result = sanitiseTelephoneText("+1 (555) 123-4567", 17);
 * @returns The filtered value and the adjusted caret offset.
 */
export const sanitiseTelephoneText: (text: string, caret: number) => SanitisedTelephoneText = (
    text: string,
    caret: number,
): SanitisedTelephoneText => {
    const limit: number = Math.min(Math.max(caret, 0), text.length);
    const kept: KeptCharacter[] = [];
    let hasPlus: boolean = false;
    let hasOpenParenthesis: boolean = false;

    for (let index: number = 0; index < text.length; index += 1) {
        const character: string = normaliseCharacter(text[index]);

        if (character === " ") {
            if (kept.length === 0 || lastCharacter(kept) === " ") {
                continue;
            }

            kept.push({ character, index });
            continue;
        }

        if (character === "+") {
            if (hasPlus || kept.length > 0) {
                continue;
            }

            hasPlus = true;
            kept.push({ character, index });
            continue;
        }

        if (character === "(") {
            if (hasOpenParenthesis) {
                continue;
            }

            hasOpenParenthesis = true;
            kept.push({ character, index });
            continue;
        }

        if (character === ")") {
            if (!hasOpenParenthesis) {
                continue;
            }

            hasOpenParenthesis = false;
            kept.push({ character, index });
            continue;
        }

        if (character === "-") {
            if (kept.length === 0) {
                continue;
            }

            kept.push({ character, index });
            continue;
        }

        if (character >= "0" && character <= "9") {
            kept.push({ character, index });
        }
    }

    const boundary: number = kept.findIndex((entry: KeptCharacter): boolean => entry.index >= limit);
    const value: string = kept.map((entry: KeptCharacter): string => entry.character).join("");

    return {
        value,
        caret: boundary === -1 ? kept.length : boundary,
    };
};

/**
 * Filters raw telephone text without tracking a caret.
 * @param value - Raw telephone text.
 * @example
 * const filtered = sanitiseTelephoneInput("+1 (555) 123-4567");
 * @returns The filtered telephone value.
 */
export const sanitiseTelephoneInput: (value: string) => string = (value: string): string =>
    sanitiseTelephoneText(value, value.length).value;

/**
 * Validates a telephone value with balanced parentheses and a five-to-fifteen digit count.
 * An empty optional value is accepted; an empty required value returns a required message.
 * @param value - Telephone value to validate.
 * @param required - Whether an empty value should be reported as an error.
 * @param messages - Localised validation messages.
 * @example
 * const error = validateTelephone("+44 7700 900000", false, messages);
 * @returns An error message, or (void 0) when the value is acceptable.
 */
export const validateTelephone: (
    value: string,
    required?: boolean,
    messages?: TelephoneValidationMessages,
) => string | void = (
    value: string,
    required: boolean = false,
    messages: TelephoneValidationMessages = DefaultTelephoneValidationMessages,
): string | void => {
    if (value.length === 0) {
        return required ? messages.required : (void 0);
    }

    if (/[\r\n\u2028\u2029]/.test(value)) {
        return messages.shape;
    }

    if (!TelephoneParenthesesPattern.test(value)) {
        return messages.parentheses;
    }

    if (!TelephoneShapePattern.test(value)) {
        return messages.shape;
    }

    return TelephoneDigitPattern.test(value) ? (void 0) : messages.digits;
};
