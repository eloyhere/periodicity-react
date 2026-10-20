/**
 * Recursive dictionary of translated messages.
 * Nested groups may be addressed with dot keys such as `account.save`.
 * Type: interface.
 * Fields: none.
 * @example
 * const messages: MessageDictionary = {
 *     account: { save: "Save changes" },
 *     greeting: "Hello {name}",
 * };
 */
export interface MessageDictionary {
    readonly [key: string]: string | MessageDictionary;
}

/**
 * Message dictionaries grouped by locale tag.
 * Type: type alias.
 * Fields: none.
 * @example
 * const messages: InternationalMessages = {
 *     "en-GB": { greeting: "Hello {name}" },
 *     "fr-FR": { greeting: "Bonjour {name}" },
 * };
 */
export type InternationalMessages = Readonly<Record<string, MessageDictionary>>;

/**
 * Values substituted into `{name}` placeholders.
 * Type: type alias.
 * Fields: none.
 * @example
 * const variables: MessageVariables = { name: "Ada", count: 2 };
 */
export type MessageVariables = Readonly<Record<string, string | number>>;

/**
 * Active and fallback dictionaries resolved for one locale pair.
 * Type: interface.
 * @param active - Dictionary for the requested locale, when available.
 * @param fallback - Dictionary for the fallback locale, when available.
 * @example
 * const resolved: ResolvedMessages = { active: (void 0), fallback: (void 0) };
 */
export interface ResolvedMessages {
    readonly active: MessageDictionary | void;
    readonly fallback: MessageDictionary | void;
}

const PlaceholderPattern: RegExp = /\{([^{}]+)\}/g;

/**
 * Reads an own property, ignoring inherited object members.
 * @param dictionary - Dictionary to inspect.
 * @param key - Property name.
 * @example
 * const value = getOwnProperty(dictionary, "greeting");
 * @returns The own value, or `(void 0)` when the key is absent.
 */
const getOwnProperty: (dictionary: MessageDictionary, key: string) => string | MessageDictionary | void = (
    dictionary: MessageDictionary,
    key: string,
): string | MessageDictionary | void =>
    Object.prototype.hasOwnProperty.call(dictionary, key) ? dictionary[key] : (void 0);

/**
 * Narrows a message value to a nested dictionary.
 * @param value - Value read from a dictionary.
 * @example
 * const nested = isMessageDictionary(value);
 * @returns Whether the value is a nested message group.
 */
const isMessageDictionary: (value: string | MessageDictionary | void) => value is MessageDictionary = (
    value: string | MessageDictionary | void,
): value is MessageDictionary =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Resolves the active and fallback dictionaries from a message source.
 * A source keyed by locale is recognised when the active or fallback locale
 * holds a nested dictionary; otherwise the source is treated as a flat
 * dictionary for the active locale.
 * @param messages - Flat dictionary or locale-keyed dictionary map.
 * @param locale - Requested locale.
 * @param fallbackLocale - Locale used when the active locale has no message.
 * @example
 * const resolved = resolveMessages({ "en-GB": { hello: "Hello" } }, "en-GB", (void 0));
 * @returns The active and fallback dictionaries.
 */
export const resolveMessages: (
    messages: MessageDictionary,
    locale: string,
    fallbackLocale: string | void,
) => ResolvedMessages = (
    messages: MessageDictionary,
    locale: string,
    fallbackLocale: string | void,
): ResolvedMessages => {
    const activeCandidate: string | MessageDictionary | void = getOwnProperty(messages, locale);
    const fallbackCandidate: string | MessageDictionary | void =
        fallbackLocale === (void 0) ? (void 0) : getOwnProperty(messages, fallbackLocale);
    const hasLocaleEntry: boolean =
        isMessageDictionary(activeCandidate) || isMessageDictionary(fallbackCandidate);
    const hasOnlyDictionaries: boolean = Object.keys(messages).every(
        (key: string): boolean => isMessageDictionary(messages[key]),
    );
    const isLocaleMap: boolean = hasLocaleEntry && hasOnlyDictionaries;

    if (!isLocaleMap) {
        return { active: messages, fallback: (void 0) };
    }

    return {
        active: isMessageDictionary(activeCandidate) ? activeCandidate : (void 0),
        fallback: isMessageDictionary(fallbackCandidate) ? fallbackCandidate : (void 0),
    };
};

/**
 * Looks up a message by flat key or nested dot path.
 * @param dictionary - Dictionary to search.
 * @param key - Flat key such as `save` or nested path such as `account.save`.
 * @example
 * const message = lookupMessage(dictionary, "account.save");
 * @returns The raw message template, or `(void 0)` when no message exists.
 */
export const lookupMessage: (dictionary: MessageDictionary | void, key: string) => string | void = (
    dictionary: MessageDictionary | void,
    key: string,
): string | void => {
    if (dictionary === (void 0)) {
        return (void 0);
    }

    const direct: string | MessageDictionary | void = getOwnProperty(dictionary, key);

    if (typeof direct === "string") {
        return direct;
    }

    const segments: readonly string[] = key.split(".");
    let current: string | MessageDictionary | void = dictionary;

    for (const segment of segments) {
        if (!isMessageDictionary(current)) {
            return (void 0);
        }

        current = getOwnProperty(current, segment);
    }

    return typeof current === "string" ? current : (void 0);
};

/**
 * Substitutes `{name}` placeholders with variable values.
 * Unknown placeholders are left untouched.
 * @param template - Message template containing optional placeholders.
 * @param variables - Values keyed by placeholder name.
 * @example
 * const text = interpolateMessage("Hello {name}", { name: "Ada" });
 * @returns The interpolated message.
 */
export const interpolateMessage: (template: string, variables?: MessageVariables) => string = (
    template: string,
    variables?: MessageVariables,
): string => {
    if (variables === (void 0)) {
        return template;
    }

    return template.replace(PlaceholderPattern, (placeholder: string, name: string): string => {
        const value: string | number | void = variables[name];

        return value === (void 0) ? placeholder : `${value}`;
    });
};

/**
 * Merges a lower-priority dictionary with a caller-provided override.
 * Nested groups are merged recursively, and every caller value wins over the base value.
 * @param base - Lower-priority dictionary, usually a built-in locale dictionary.
 * @param override - Higher-priority caller dictionary.
 * @example
 * const merged = mergeMessages({ save: "Save" }, { save: "Store" });
 * @returns A merged dictionary, or whichever input is available when the other is absent.
 */
export const mergeMessages: (
    base: MessageDictionary | void,
    override: MessageDictionary | void,
) => MessageDictionary = (
    base: MessageDictionary | void,
    override: MessageDictionary | void,
): MessageDictionary => {
    if (base === (void 0)) {
        return override === (void 0) ? {} : override;
    }

    if (override === (void 0)) {
        return base;
    }

    const merged: Record<string, string | MessageDictionary> = { ...base };

    for (const key of Object.keys(override)) {
        const baseValue: string | MessageDictionary | void = getOwnProperty(base, key);
        const overrideValue: string | MessageDictionary = override[key];

        merged[key] =
            isMessageDictionary(baseValue) && isMessageDictionary(overrideValue)
                ? mergeMessages(baseValue, overrideValue)
                : overrideValue;
    }

    return merged;
};

/**
 * Resolves, interpolates, and falls back a translation.
 * Lookup order is active locale, fallback locale, then the key itself.
 * @param dictionaries - Resolved active and fallback dictionaries.
 * @param key - Flat key or nested dot path.
 * @param variables - Values keyed by placeholder name.
 * @example
 * const text = translateMessage(dictionaries, "greeting", { name: "Ada" });
 * @returns The translated message, or the key when no message exists.
 */
export const translateMessage: (
    dictionaries: ResolvedMessages,
    key: string,
    variables?: MessageVariables,
) => string = (
    dictionaries: ResolvedMessages,
    key: string,
    variables?: MessageVariables,
): string => {
    const active: string | void = lookupMessage(dictionaries.active, key);

    if (active !== (void 0)) {
        return interpolateMessage(active, variables);
    }

    const fallback: string | void = lookupMessage(dictionaries.fallback, key);

    if (fallback !== (void 0)) {
        return interpolateMessage(fallback, variables);
    }

    return key;
};
