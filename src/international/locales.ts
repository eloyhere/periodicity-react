/**
 * Built-in locale codes supported by the internationalisation provider.
 * Type: type alias.
 * Fields: none.
 * @example
 * const locale: LocaleCode = "zh-CN";
 */
export type LocaleCode =
    | "en-GB"
    | "en-US"
    | "zh-CN"
    | "zh-SG"
    | "zh-HK"
    | "zh-TW"
    | "ja-JP"
    | "ko-KR"
    | "es-ES"
    | "es-MX"
    | "pt-PT"
    | "pt-BR";

/**
 * Locale tag accepted by the provider: a built-in code or an arbitrary custom tag.
 * The intersection preserves editor completion for built-in codes while still accepting tags such as `fr-CA`.
 * Type: type alias.
 * Fields: none.
 * @example
 * const builtIn: LocaleTag = "ja-JP";
 * const custom: LocaleTag = "fr-CA";
 */
export type LocaleTag = LocaleCode | (string & {});

/**
 * Text direction for a locale.
 * Type: type alias.
 * Fields: none.
 * @example
 * const direction: LocaleDirection = "rtl";
 */
export type LocaleDirection = "ltr" | "rtl";

/**
 * Display metadata for one built-in locale.
 * Type: interface.
 * @param code - Canonical locale code such as `en-GB`.
 * @param label - English label suitable for a settings list.
 * @param nativeLabel - Label written in the locale's own language.
 * @param direction - Resolved text direction, derived from the locale rather than assumed.
 * @example
 * const option: LocaleOption = {
 *     code: "en-GB",
 *     label: "English (United Kingdom)",
 *     nativeLabel: "English (UK)",
 *     direction: "ltr",
 * };
 */
export interface LocaleOption {
    readonly code: LocaleCode;
    readonly label: string;
    readonly nativeLabel: string;
    readonly direction: LocaleDirection;
}

/**
 * Locale used when a provider receives no locale, and the final translation fallback.
 * Type: constant.
 * Fields: none.
 * @example
 * const locale: LocaleCode = defaultLocale;
 */
export const defaultLocale: LocaleCode = "en-GB";

/**
 * Languages whose default script is written right to left.
 * Used only when the runtime cannot report text direction itself.
 */
const RightToLeftLanguages: ReadonlySet<string> = new Set<string>([
    "ar",
    "arc",
    "ckb",
    "dv",
    "fa",
    "he",
    "khw",
    "ks",
    "lrc",
    "mzn",
    "nqo",
    "prs",
    "ps",
    "sd",
    "syr",
    "ug",
    "ur",
    "yi",
]);

/**
 * Scripts written right to left, matched against an explicit script subtag such as `Arab` in `az-Arab`.
 */
const RightToLeftScripts: ReadonlySet<string> = new Set<string>([
    "Adlm",
    "Arab",
    "Aran",
    "Armi",
    "Avst",
    "Chrs",
    "Cprt",
    "Elym",
    "Hatr",
    "Hebr",
    "Hung",
    "Khar",
    "Lydi",
    "Mand",
    "Mani",
    "Mend",
    "Merc",
    "Mero",
    "Narb",
    "Nbat",
    "Nkoo",
    "Orkh",
    "Palm",
    "Phli",
    "Phlp",
    "Phnx",
    "Prti",
    "Rohg",
    "Samr",
    "Sarb",
    "Sogd",
    "Sogo",
    "Syrc",
    "Thaa",
    "Todr",
    "Yezi",
]);

/**
 * Shape of the optional `Intl.Locale#getTextInfo` result.
 */
interface DirectionalTextInfo {
    readonly direction?: string;
}

/**
 * Optional capability exposed by newer ECMA-402 runtimes.
 */
interface DirectionalLocale {
    getTextInfo?: () => DirectionalTextInfo;
}

/**
 * Reads the direction reported by `Intl.Locale` when the runtime supports it.
 * @param locale - Locale tag to inspect.
 * @example
 * const direction = readIntlDirection("ar-EG");
 * @returns The reported direction, or `(void 0)` when the runtime cannot answer.
 */
const readIntlDirection: (locale: string) => LocaleDirection | void = (
    locale: string,
): LocaleDirection | void => {
    if (typeof Intl === "undefined" || typeof Intl.Locale !== "function") {
        return (void 0);
    }

    try {
        const parsed: Intl.Locale = new Intl.Locale(locale);
        const textInfo: DirectionalTextInfo | void = (parsed as unknown as DirectionalLocale).getTextInfo?.();
        const direction: string | void = textInfo?.direction;

        return direction === "ltr" || direction === "rtl" ? direction : (void 0);
    } catch {
        return (void 0);
    }
};

/**
 * Splits a locale tag into lower-level subtags, accepting hyphens and underscores.
 * @param locale - Locale tag to split.
 * @example
 * const subtags = splitLocaleSubtags("zh-Hant-HK");
 * @returns The non-empty subtags.
 */
const splitLocaleSubtags: (locale: string) => readonly string[] = (locale: string): readonly string[] =>
    locale
        .trim()
        .split(/[-_]/)
        .filter((subtag: string): boolean => subtag.length > 0);

/**
 * Detects direction from a language or script subtag without relying on runtime support.
 * @param locale - Locale tag to inspect.
 * @example
 * const direction = resolveDirectionFromSubtags("az-Arab");
 * @returns `rtl` for known right-to-left languages or scripts, otherwise `(void 0)`.
 */
const resolveDirectionFromSubtags: (locale: string) => LocaleDirection | void = (
    locale: string,
): LocaleDirection | void => {
    const subtags: readonly string[] = splitLocaleSubtags(locale);
    const language: string = (subtags[0] ?? "").toLowerCase();

    if (RightToLeftLanguages.has(language)) {
        return "rtl";
    }

    for (const subtag of subtags) {
        if (subtag.length !== 4) {
            continue;
        }

        const script: string = `${subtag.charAt(0).toUpperCase()}${subtag.slice(1).toLowerCase()}`;

        if (RightToLeftScripts.has(script)) {
            return "rtl";
        }
    }

    return (void 0);
};

/**
 * Resolves the text direction for any locale tag, including custom tags outside the built-in catalogue.
 * The runtime's `Intl.Locale` text info is preferred when available, with a script table as a deterministic fallback.
 * @param locale - Locale tag to inspect.
 * @example
 * const direction = resolveLocaleDirection("ar-EG");
 * @returns `rtl` for right-to-left locales, otherwise `ltr`.
 */
export const resolveLocaleDirection: (locale: string) => LocaleDirection = (
    locale: string,
): LocaleDirection => readIntlDirection(locale) ?? resolveDirectionFromSubtags(locale) ?? "ltr";

/**
 * Creates locale metadata and derives its direction instead of hard-coding a value.
 * @param code - Canonical locale code.
 * @param label - English label.
 * @param nativeLabel - Native-language label.
 * @example
 * const option = createLocaleOption("en-GB", "English (United Kingdom)", "English (UK)");
 * @returns Complete locale metadata.
 */
const createLocaleOption: (code: LocaleCode, label: string, nativeLabel: string) => LocaleOption = (
    code: LocaleCode,
    label: string,
    nativeLabel: string,
): LocaleOption => ({
    code,
    label,
    nativeLabel,
    direction: resolveLocaleDirection(code),
});

/**
 * Built-in locales in catalogue order, ready to drive a language picker.
 * Type: constant.
 * Fields: code, label, nativeLabel, direction per entry.
 * @example
 * localeOptions.map((option) => option.code);
 */
export const localeOptions: readonly LocaleOption[] = [
    createLocaleOption("en-GB", "English (United Kingdom)", "English (UK)"),
    createLocaleOption("en-US", "English (United States)", "English (US)"),
    createLocaleOption("zh-CN", "Chinese (Simplified, Mainland China)", "简体中文（中国大陆）"),
    createLocaleOption("zh-SG", "Chinese (Simplified, Singapore)", "简体中文（新加坡）"),
    createLocaleOption("zh-HK", "Chinese (Traditional, Hong Kong)", "繁體中文（香港）"),
    createLocaleOption("zh-TW", "Chinese (Traditional, Taiwan)", "繁體中文（台灣）"),
    createLocaleOption("ja-JP", "Japanese (Japan)", "日本語（日本）"),
    createLocaleOption("ko-KR", "Korean (South Korea)", "한국어（대한민국）"),
    createLocaleOption("es-ES", "Spanish (Spain)", "Español (España)"),
    createLocaleOption("es-MX", "Spanish (Mexico)", "Español (México)"),
    createLocaleOption("pt-PT", "Portuguese (Portugal)", "Português (Portugal)"),
    createLocaleOption("pt-BR", "Portuguese (Brazil)", "Português (Brasil)"),
];

/**
 * Valid canonical locale codes, used by the exact-match type guard.
 */
const BuiltInLocaleCodes: ReadonlySet<string> = new Set<string>(
    localeOptions.map((option: LocaleOption): string => option.code),
);

/**
 * Case-insensitive lookup for the built-in locale codes.
 */
const NormalizedLocaleCodes: ReadonlyMap<string, LocaleCode> = new Map<string, LocaleCode>(
    localeOptions.map((option: LocaleOption): readonly [string, LocaleCode] => [
        option.code.toLowerCase(),
        option.code,
    ]),
);

/**
 * Canonicalises a built-in locale tag, accepting different letter casing.
 * @param locale - Locale tag to canonicalise.
 * @example
 * const code = resolveLocaleCode("en-gb");
 * @returns The canonical built-in code, or `(void 0)` for a custom tag.
 */
export const resolveLocaleCode: (locale: string) => LocaleCode | void = (
    locale: string,
): LocaleCode | void => NormalizedLocaleCodes.get(locale.trim().toLowerCase());

/**
 * Narrows a locale tag to one of the built-in codes.
 * @param locale - Locale tag to test.
 * @example
 * const supported = isLocaleCode("zh-TW");
 * @returns Whether the tag is a built-in locale code.
 */
export const isLocaleCode: (locale: string) => locale is LocaleCode = (
    locale: string,
): locale is LocaleCode => BuiltInLocaleCodes.has(locale);
