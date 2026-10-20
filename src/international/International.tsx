import {
    useCallback,
    useContext,
    useMemo,
    useState,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type SetStateAction,
} from "react";
import cx from "../component/foundation/cx";
import {
    InternationalContext,
    type InternationalContextValue,
} from "./InternationalContext";
import {
    resolveMessages,
    translateMessage,
    type MessageDictionary,
    type MessageVariables,
    type ResolvedMessages,
} from "./messages";
import "./International.css";

/**
 * Props for the scoped International provider.
 * Type: interface.
 * @param children - Subtree that receives the scoped locale and helpers.
 * @param locale - Controlled locale tag such as `en-GB`; omit to inherit the nearest provider.
 * @param defaultLocale - Initial locale when the provider is uncontrolled.
 * @param messages - Message dictionary, either flat or keyed by locale tag.
 * @param fallbackLocale - Locale consulted when a key is missing.
 * @param onLocaleChange - Called whenever a descendant requests a new locale.
 * @param className - Additional class name for the layout-transparent wrapper.
 * @example
 * <International
 *     locale="fr-FR"
 *     fallbackLocale="en-GB"
 *     messages={{
 *         "en-GB": { greeting: "Hello {name}" },
 *         "fr-FR": { greeting: "Bonjour {name}" },
 *     }}
 * >
 *     <App />
 * </International>
 * @example
 * <International locale="en-GB" messages={{ greeting: "Hello {name}" }}>
 *     <Greeting />
 * </International>
 */
export interface InternationalProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "lang"> {
    children?: ReactNode;
    locale?: string;
    defaultLocale?: string;
    messages: MessageDictionary;
    fallbackLocale?: string;
    onLocaleChange?: (locale: string) => void;
    className?: string;
}

/**
 * Provides scoped locale, translations, and number or date formatters to descendants.
 * Type: function component.
 * @param props - Children, locale controls, messages, fallback locale, and native attributes.
 * @example
 * <International locale="en-GB" messages={{ greeting: "Hello {name}" }}>
 *     <Greeting name="Ada" />
 * </International>
 * @returns A language-tagged wrapper with a provider for `useInternational`.
 */
const International: FC<InternationalProps> = ({
    children,
    locale,
    defaultLocale,
    messages,
    fallbackLocale,
    onLocaleChange,
    className = "",
    ...rest
}: InternationalProps) => {
    const parent: InternationalContextValue = useContext(InternationalContext);
    const [internalLocale, setInternalLocale]: [string | null, Dispatch<SetStateAction<string | null>>] =
        useState<string | null>(defaultLocale ?? null);
    const activeLocale: string = locale ?? internalLocale ?? parent.locale;
    const activeFallbackLocale: string | void = fallbackLocale ?? parent.fallbackLocale;
    const dictionaries: ResolvedMessages = useMemo<ResolvedMessages>(
        () => resolveMessages(messages, activeLocale, activeFallbackLocale),
        [messages, activeLocale, activeFallbackLocale],
    );

    const setLocale: (locale: string) => void = useCallback(
        (next: string): void => {
            if (next === activeLocale) {
                return;
            }

            if (locale === (void 0)) {
                setInternalLocale(next);
            }

            onLocaleChange?.(next);
        },
        [activeLocale, locale, onLocaleChange],
    );

    const t: (key: string, variables?: MessageVariables) => string = useCallback(
        (key: string, variables?: MessageVariables): string =>
            translateMessage(dictionaries, key, variables),
        [dictionaries],
    );

    const formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string = useCallback(
        (value: number, options?: Intl.NumberFormatOptions): string =>
            new Intl.NumberFormat(activeLocale, options).format(value),
        [activeLocale],
    );

    const formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string = useCallback(
        (value: Date | number, options?: Intl.DateTimeFormatOptions): string =>
            new Intl.DateTimeFormat(activeLocale, options).format(value),
        [activeLocale],
    );

    const contextValue: InternationalContextValue = useMemo<InternationalContextValue>(
        () => ({
            locale: activeLocale,
            fallbackLocale: activeFallbackLocale,
            setLocale,
            t,
            formatNumber,
            formatDate,
        }),
        [activeFallbackLocale, activeLocale, formatDate, formatNumber, setLocale, t],
    );

    return (
        <InternationalContext.Provider value={contextValue}>
            <div
                {...rest}
                className={cx("international", className)}
                lang={activeLocale}
                data-locale={activeLocale}
                data-fallback-locale={activeFallbackLocale}
            >
                {children}
            </div>
        </InternationalContext.Provider>
    );
};

export default International;
