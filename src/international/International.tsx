import {
    useCallback,
    useContext,
    useMemo,
    useState,
    type Dispatch,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
    type SetStateAction,
} from "react";
import cx from "../component/foundation/cx";
import { resolveLocaleMessages, type BuiltInMessages } from "./builtInMessages";
import {
    InternationalContext,
    type InternationalContextValue,
} from "./InternationalContext";
import {
    defaultLocale as DefaultLocale,
    resolveLocaleDirection,
    type LocaleDirection,
    type LocaleTag,
} from "./locales";
import {
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
 * @param locale - Controlled locale tag such as `en-GB` or a custom BCP 47 tag; omit to inherit the nearest provider.
 * @param defaultLocale - Initial built-in or custom locale when the provider is uncontrolled.
 * @param onLocaleChange - Called whenever a descendant requests a new locale.
 * @param messages - Caller dictionary, flat or keyed by locale tag, or a built-in dictionary; built-ins are merged
 * underneath it and caller values always win.
 * @param defaultMessages - Initial caller dictionary when the provider is uncontrolled.
 * @param onMessagesChange - Called whenever a descendant requests a new message dictionary.
 * @param fallbackLocale - Controlled locale consulted when a key is missing; the built-in chain ends at `en-GB`.
 * @param defaultFallbackLocale - Initial fallback locale when the provider is uncontrolled.
 * @param onFallbackLocaleChange - Called whenever a descendant requests a new fallback locale.
 * @param lang - Native language tag override for the wrapper; defaults to the active locale.
 * @param dir - Text direction override for the wrapper; defaults to the resolved locale direction.
 * @param className - Additional class name for the layout-transparent wrapper.
 * @param ref - Reference to the wrapper element.
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
 * <International locale="zh-CN" messages={{ save: "存檔" }}>
 *     <App />
 * </International>
 */
export interface InternationalProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "lang"> {
    children?: ReactNode;
    locale?: LocaleTag;
    defaultLocale?: LocaleTag;
    onLocaleChange?: (locale: string) => void;
    messages?: MessageDictionary | BuiltInMessages;
    defaultMessages?: MessageDictionary | BuiltInMessages;
    onMessagesChange?: (messages: MessageDictionary) => void;
    fallbackLocale?: LocaleTag;
    defaultFallbackLocale?: LocaleTag;
    onFallbackLocaleChange?: (locale: string) => void;
    lang?: string;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Provides scoped locale, translations, and number or date formatters to descendants.
 * Type: function component.
 * @param props - Children, controlled or uncontrolled locale, messages, fallback locale, callbacks, and native
 * div attributes or events.
 * @example
 * <International locale="en-GB" messages={{ greeting: "Hello {name}" }}>
 *     <Greeting name="Ada" />
 * </International>
 * @returns A language- and direction-tagged wrapper with a provider for `useInternational`.
 */
const International: FC<InternationalProps> = ({
    children,
    locale,
    defaultLocale,
    onLocaleChange,
    messages,
    defaultMessages,
    onMessagesChange,
    fallbackLocale,
    defaultFallbackLocale,
    onFallbackLocaleChange,
    lang,
    dir,
    className = "",
    ref,
    ...rest
}: InternationalProps) => {
    const parent: InternationalContextValue = useContext(InternationalContext);
    const [internalLocale, setInternalLocale]: [string | null, Dispatch<SetStateAction<string | null>>] =
        useState<string | null>(defaultLocale ?? null);
    const [internalMessages, setInternalMessages]: [
        MessageDictionary | null,
        Dispatch<SetStateAction<MessageDictionary | null>>,
    ] = useState<MessageDictionary | null>(defaultMessages ?? null);
    const [internalFallbackLocale, setInternalFallbackLocale]: [
        string | null,
        Dispatch<SetStateAction<string | null>>,
    ] = useState<string | null>(defaultFallbackLocale ?? null);
    const activeLocale: string = locale ?? internalLocale ?? parent.locale;
    const activeMessages: MessageDictionary = messages ?? internalMessages ?? parent.messages;
    const activeFallbackLocale: string =
        fallbackLocale ?? internalFallbackLocale ?? parent.fallbackLocale ?? DefaultLocale;
    const activeDirection: LocaleDirection = useMemo<LocaleDirection>(
        () => resolveLocaleDirection(activeLocale),
        [activeLocale],
    );
    const dictionaries: ResolvedMessages = useMemo<ResolvedMessages>(
        () => resolveLocaleMessages(activeLocale, activeMessages, activeFallbackLocale),
        [activeFallbackLocale, activeLocale, activeMessages],
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

    const setMessages: (messages: MessageDictionary) => void = useCallback(
        (next: MessageDictionary): void => {
            if (messages === (void 0)) {
                setInternalMessages(next);
            }

            onMessagesChange?.(next);
        },
        [messages, onMessagesChange],
    );

    const setFallbackLocale: (locale: string) => void = useCallback(
        (next: string): void => {
            if (fallbackLocale === (void 0)) {
                setInternalFallbackLocale(next);
            }

            onFallbackLocaleChange?.(next);
        },
        [fallbackLocale, onFallbackLocaleChange],
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
            direction: activeDirection,
            dir: activeDirection,
            messages: activeMessages,
            setLocale,
            setMessages,
            setFallbackLocale,
            t,
            formatNumber,
            formatDate,
        }),
        [
            activeDirection,
            activeFallbackLocale,
            activeLocale,
            activeMessages,
            formatDate,
            formatNumber,
            setFallbackLocale,
            setLocale,
            setMessages,
            t,
        ],
    );

    return (
        <InternationalContext.Provider value={contextValue}>
            <div
                {...rest}
                ref={ref}
                className={cx("international", className)}
                lang={lang ?? activeLocale}
                dir={dir ?? activeDirection}
                data-locale={activeLocale}
                data-fallback-locale={activeFallbackLocale}
                data-direction={activeDirection}
            >
                {children}
            </div>
        </InternationalContext.Provider>
    );
};

export default International;
