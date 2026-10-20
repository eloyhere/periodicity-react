/**
 * Message shown when an email address is incomplete or malformed.
 * Type: constant.
 * Fields: none.
 * @example
 * const message = EmailInvalidMessage;
 */
const EmailInvalidMessage: string = "Enter a complete email address, for example name@example.com.";

/**
 * Message shown when a required email field is left empty.
 * Type: constant.
 * Fields: none.
 * @example
 * const message = EmailRequiredMessage;
 */
const EmailRequiredMessage: string = "Enter an email address, for example name@example.com.";

/**
 * Characters accepted in the local part: the RFC 5322 dot-atom text characters.
 * Type: constant.
 * Fields: none.
 * @example
 * const accepted = EmailLocalCharacters.includes("+");
 */
const EmailLocalCharacters: string =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-/=?^_`{|}~.";

/**
 * Characters accepted in the domain part: ASCII letters, digits, and hyphens.
 * Type: constant.
 * Fields: none.
 * @example
 * const accepted = EmailDomainCharacters.includes("-");
 */
const EmailDomainCharacters: string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-";

/**
 * Whitespace recognised by the email filter.
 * Type: constant.
 * Fields: none.
 * @example
 * const isWhitespace = WhitespacePattern.test(" ");
 */
const WhitespacePattern: RegExp = /\s/;

/**
 * Local-part fragment shared by the validator and the native pattern attribute.
 * The punctuation is escaped so the pattern is valid with the HTML `v` flag.
 * Type: constant.
 * Fields: none.
 * @example
 * const local = EmailLocalClass;
 */
const EmailLocalClass: string = "A-Za-z0-9!#$%&'*+\\/=?^_`\\{\\|\\}~\\-";

/**
 * Domain-label fragment shared by the validator and the native pattern attribute.
 * Type: constant.
 * Fields: none.
 * @example
 * const label = EmailDomainLabelSource;
 */
const EmailDomainLabelSource: string = "[A-Za-z0-9](?:[A-Za-z0-9\\-]{0,61}[A-Za-z0-9])?";

/**
 * Top-level-domain fragment shared by the validator and the native pattern attribute.
 * A top-level label needs at least two characters and at least one letter.
 * Type: constant.
 * Fields: none.
 * @example
 * const topLevel = EmailTopLabelSource;
 */
const EmailTopLabelSource: string =
    "(?=[A-Za-z0-9\\-]*[A-Za-z])[A-Za-z0-9](?:[A-Za-z0-9\\-]{0,61}[A-Za-z0-9])";

/**
 * Local-part pattern source built from the accepted local characters.
 * Type: constant.
 * Fields: none.
 * @example
 * const local = EmailLocalSource;
 */
const EmailLocalSource: string = `[${EmailLocalClass}]+(?:\\.[${EmailLocalClass}]+)*`;

/**
 * Domain pattern source built from one or more domain labels.
 * Type: constant.
 * Fields: none.
 * @example
 * const domain = EmailDomainSource;
 */
const EmailDomainSource: string = `(?:${EmailDomainLabelSource}\\.)+${EmailTopLabelSource}`;

/**
 * Practical email pattern used by the validator and the native pattern attribute.
 * Type: constant.
 * Fields: none.
 * @example
 * const source = EmailPatternSource;
 */
export const EmailPatternSource: string = `${EmailLocalSource}@${EmailDomainSource}`;

/**
 * Complete-address pattern compiled from the shared pattern source.
 * Type: constant.
 * Fields: none.
 * @example
 * const valid = EmailPattern.test("name@example.com");
 */
const EmailPattern: RegExp = new RegExp(`^(?:${EmailPatternSource})$`, "u");

/**
 * Result of filtering a raw email string and its caret offset.
 * Type: interface.
 * Fields: value, caret.
 * @example
 * const result: SanitisedEmailText = { value: "name@example.com", caret: 16 };
 */
export interface SanitisedEmailText {
    value: string;
    caret: number;
}

/**
 * One accepted character together with its position in the raw input.
 * Type: interface.
 * Fields: character, index.
 * @example
 * const kept: KeptCharacter = { character: "a", index: 0 };
 */
interface KeptCharacter {
    character: string;
    index: number;
}

/**
 * Reads the last accepted character, or an empty string for an empty value.
 * @param characters - Accepted characters in source order.
 * @example
 * const last = lastCharacter([{ character: "a", index: 0 }]);
 * @returns The final character, or an empty string.
 */
const lastCharacter: (characters: readonly KeptCharacter[]) => string = (
    characters: readonly KeptCharacter[],
): string => characters.at(-1)?.character ?? "";

/**
 * Filters raw email text while keeping the caret aligned with accepted characters.
 * Whitespace is removed, additional `@` characters are discarded, and local and domain
 * character rules are applied as the user types, pastes, or drops text.
 * @param text - Raw text from the input, including incomplete addresses.
 * @param caret - Caret offset within the raw text.
 * @example
 * const result = sanitiseEmailText("name@@example.com", 5);
 * @returns The filtered value and the adjusted caret offset.
 */
export const sanitiseEmailText: (text: string, caret: number) => SanitisedEmailText = (
    text: string,
    caret: number,
): SanitisedEmailText => {
    const limit: number = Math.min(Math.max(caret, 0), text.length);
    const kept: KeptCharacter[] = [];
    let hasAt: boolean = false;

    for (let index: number = 0; index < text.length; index += 1) {
        const character: string = text[index];

        if (WhitespacePattern.test(character)) {
            continue;
        }

        if (character === "@") {
            if (hasAt) {
                continue;
            }

            while (kept.at(-1)?.character === ".") {
                kept.pop();
            }

            hasAt = true;
            kept.push({ character, index });
            continue;
        }

        if (!hasAt) {
            if (!EmailLocalCharacters.includes(character)) {
                continue;
            }

            if (character === ".") {
                const previous: string = lastCharacter(kept);

                if (previous.length === 0 || previous === ".") {
                    continue;
                }
            }

            kept.push({ character, index });
            continue;
        }

        if (!EmailDomainCharacters.includes(character)) {
            continue;
        }

        const previous: string = lastCharacter(kept);

        if (character === "." && (previous.length === 0 || previous === "." || previous === "@")) {
            continue;
        }

        if (character === "-" && (previous.length === 0 || previous === "@" || previous === ".")) {
            continue;
        }

        kept.push({ character, index });
    }

    const boundary: number = kept.findIndex((entry: KeptCharacter): boolean => entry.index >= limit);
    const value: string = kept.map((entry: KeptCharacter): string => entry.character).join("");

    return {
        value,
        caret: boundary === -1 ? kept.length : boundary,
    };
};

/**
 * Filters raw email text without tracking a caret.
 * @param value - Raw email text.
 * @example
 * const filtered = sanitiseEmailInput("  name@@example.com ");
 * @returns The filtered email value.
 */
export const sanitiseEmailInput: (value: string) => string = (value: string): string =>
    sanitiseEmailText(value, value.length).value;

/**
 * Validates a complete email address with the practical dot-atom rules used by the field.
 * An empty optional value is accepted; an empty required value returns a required message.
 * @param value - Email value to validate.
 * @param required - Whether an empty value should be reported as an error.
 * @example
 * const error = validateEmail("name@example.com");
 * @returns An error message, or (void 0) when the value is acceptable.
 */
export const validateEmail: (value: string, required?: boolean) => string | void = (
    value: string,
    required: boolean = false,
): string | void => {
    if (value.length === 0) {
        return required ? EmailRequiredMessage : (void 0);
    }

    if (WhitespacePattern.test(value)) {
        return EmailInvalidMessage;
    }

    const atIndex: number = value.indexOf("@");
    const lastAtIndex: number = value.lastIndexOf("@");

    if (atIndex !== lastAtIndex || atIndex <= 0) {
        return EmailInvalidMessage;
    }

    const localPart: string = value.slice(0, atIndex);
    const domainPart: string = value.slice(atIndex + 1);

    if (localPart.length > 64 || domainPart.length > 253 || value.length > 254) {
        return EmailInvalidMessage;
    }

    return EmailPattern.test(value) ? (void 0) : EmailInvalidMessage;
};
