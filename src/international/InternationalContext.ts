import { createContext, useContext, type Context } from "react";
import type { MessageDictionary, MessageVariables } from "./messages";

/**
 * Controller returned by `useInternational`.
 * Type: interface.
 * @param locale - Active locale for the subtree.
 * @param fallbackLocale - Locale consulted when a key is missing; may be absent.
 * @param messages - Raw message source shared with nested providers.
 * @param setLocale - Requests a locale change from a descendant.
 * @param setMessages - Requests a new message source from a descendant.
 * @param setFallbackLocale - Requests a fallback locale from a descendant.
 * @param t - Resolves a message by flat key or nested dot path.
 * @param formatNumber - Formats a number with the active locale.
 * @param formatDate - Formats a date with the active locale.
 * @example
 * const { locale, t, formatNumber }: InternationalContextValue = useInternational();
 */
export interface InternationalContextValue {
    locale: string;
    fallbackLocale: string | void;
    messages: MessageDictionary;
    setLocale: (locale: string) => void;
    setMessages: (messages: MessageDictionary) => void;
    setFallbackLocale: (locale: string) => void;
    t: (key: string, variables?: MessageVariables) => string;
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
    formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
}

const DefaultLocale: string = "en-GB";
const emptyMessages: MessageDictionary = {};

const noopSetLocale: (locale: string) => void = (): void => {};
const noopSetMessages: (messages: MessageDictionary) => void = (): void => {};
const noopSetFallbackLocale: (locale: string) => void = (): void => {};

const identityTranslation: (key: string, variables?: MessageVariables) => string = (
    key: string,
): string => key;

const defaultFormatNumber: (value: number, options?: Intl.NumberFormatOptions) => string = (
    value: number,
    options?: Intl.NumberFormatOptions,
): string => new Intl.NumberFormat(DefaultLocale, options).format(value);

const defaultFormatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string = (
    value: Date | number,
    options?: Intl.DateTimeFormatOptions,
): string => new Intl.DateTimeFormat(DefaultLocale, options).format(value);

/**
 * Fallback used when `useInternational` is called outside a provider.
 * Type: constant.
 * Fields: locale, fallbackLocale, messages, setLocale, setMessages, setFallbackLocale, t, formatNumber,
 * formatDate.
 * @example
 * const fallback: InternationalContextValue = DefaultInternationalContext;
 */
export const DefaultInternationalContext: InternationalContextValue = {
    locale: DefaultLocale,
    fallbackLocale: (void 0),
    messages: emptyMessages,
    setLocale: noopSetLocale,
    setMessages: noopSetMessages,
    setFallbackLocale: noopSetFallbackLocale,
    t: identityTranslation,
    formatNumber: defaultFormatNumber,
    formatDate: defaultFormatDate,
};

/**
 * Context carrying the scoped locale and translation helpers to descendants.
 * @example
 * const international: InternationalContextValue = useContext(InternationalContext);
 */
export const InternationalContext: Context<InternationalContextValue> =
    createContext<InternationalContextValue>(DefaultInternationalContext);

/**
 * Reads the nearest International configuration.
 * Type: hook.
 * @example
 * const { t, formatDate } = useInternational();
 * const label = t("account.saved", { name: "Ada" });
 * @returns The current locale controller, or a sensible British-English default outside a provider.
 */
export const useInternational: () => InternationalContextValue = (): InternationalContextValue =>
    useContext(InternationalContext);
