import { createContext, useContext, type Context } from "react";
import { resolveLocaleMessages } from "./builtInMessages";
import { defaultLocale, resolveLocaleDirection, type LocaleDirection } from "./locales";
import {
    translateMessage,
    type MessageDictionary,
    type MessageVariables,
    type ResolvedMessages,
} from "./messages";

/**
 * Controller returned by `useInternational`.
 * Type: interface.
 * @param locale - Active locale for the subtree.
 * @param fallbackLocale - Locale consulted when a key is missing; defaults to `en-GB`.
 * @param direction - Resolved text direction for the active locale.
 * @param dir - Alias of `direction`, ready to spread onto an element or layout primitive.
 * @param messages - Raw message source shared with nested providers.
 * @param setLocale - Requests a locale change from a descendant.
 * @param setMessages - Requests a new message source from a descendant.
 * @param setFallbackLocale - Requests a fallback locale from a descendant.
 * @param t - Resolves a message by flat key or nested dot path.
 * @param formatNumber - Formats a number with the active locale.
 * @param formatDate - Formats a date with the active locale.
 * @example
 * const { locale, direction, t, formatNumber }: InternationalContextValue = useInternational();
 */
export interface InternationalContextValue {
    locale: string;
    fallbackLocale: string | void;
    direction: LocaleDirection;
    dir: LocaleDirection;
    messages: MessageDictionary;
    setLocale: (locale: string) => void;
    setMessages: (messages: MessageDictionary) => void;
    setFallbackLocale: (locale: string) => void;
    t: (key: string, variables?: MessageVariables) => string;
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
    formatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
}

const DefaultDirection: LocaleDirection = resolveLocaleDirection(defaultLocale);
const emptyMessages: MessageDictionary = {};
const defaultResolvedMessages: ResolvedMessages = resolveLocaleMessages(defaultLocale);

const noopSetLocale: (locale: string) => void = (): void => {};
const noopSetMessages: (messages: MessageDictionary) => void = (): void => {};
const noopSetFallbackLocale: (locale: string) => void = (): void => {};

const defaultTranslation: (key: string, variables?: MessageVariables) => string = (
    key: string,
    variables?: MessageVariables,
): string => translateMessage(defaultResolvedMessages, key, variables);

const defaultFormatNumber: (value: number, options?: Intl.NumberFormatOptions) => string = (
    value: number,
    options?: Intl.NumberFormatOptions,
): string => new Intl.NumberFormat(defaultLocale, options).format(value);

const defaultFormatDate: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string = (
    value: Date | number,
    options?: Intl.DateTimeFormatOptions,
): string => new Intl.DateTimeFormat(defaultLocale, options).format(value);

/**
 * Fallback used when `useInternational` is called outside a provider.
 * Type: constant.
 * Fields: locale, fallbackLocale, direction, dir, messages, setLocale, setMessages, setFallbackLocale, t,
 * formatNumber, formatDate.
 * @example
 * const fallback: InternationalContextValue = DefaultInternationalContext;
 */
export const DefaultInternationalContext: InternationalContextValue = {
    locale: defaultLocale,
    fallbackLocale: defaultLocale,
    direction: DefaultDirection,
    dir: DefaultDirection,
    messages: emptyMessages,
    setLocale: noopSetLocale,
    setMessages: noopSetMessages,
    setFallbackLocale: noopSetFallbackLocale,
    t: defaultTranslation,
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
 * const { t, direction, formatDate } = useInternational();
 * const label = t("account.saved", { name: "Ada" });
 * @returns The current locale controller, or a sensible British-English default outside a provider.
 */
export const useInternational: () => InternationalContextValue = (): InternationalContextValue =>
    useContext(InternationalContext);
