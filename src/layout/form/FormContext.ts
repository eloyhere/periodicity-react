import { createContext, useContext } from "react";
import type { ReactNode } from "react";

/**
 * One value collected from a form control.
 * Type: type alias.
 * Fields: none.
 * @example
 * const value: FormValue = "mira@example.com";
 */
export type FormValue = FormDataEntryValue | readonly FormDataEntryValue[];

/**
 * Values collected from the form, keyed by control name. Repeated names, such as
 * a checkbox group, collect into an array.
 * Type: type alias.
 * Fields: none.
 * @example
 * const values: FormValues = { email: "mira@example.com", topics: ["design"] };
 */
export type FormValues = Readonly<Record<string, FormValue>>;

/**
 * Field errors, keyed by control name. A present message marks that field invalid.
 * Type: type alias.
 * Fields: none.
 * @example
 * const errors: FormErrors = { email: "Enter a work address." };
 */
export type FormErrors = Readonly<Record<string, ReactNode>>;

/**
 * State shared by the fields, submit button, and message inside a form.
 * Type: interface.
 * Fields: disabled, name, errors, pending, submitError.
 * @example
 * const { errors, pending } = useFormContext();
 */
export interface FormContextValue {
    disabled: boolean;
    name?: string;
    errors: FormErrors;
    pending: boolean;
    submitError?: ReactNode;
}

const emptyErrors: FormErrors = {};

export const FormContext: ReturnType<typeof createContext<FormContextValue | null>> =
    createContext<FormContextValue | null>(null);

/**
 * Reads the nearest form context.
 * @returns The form state, or a neutral state outside a form.
 * @example
 * const form = useFormContext();
 */
export const useFormContext: () => FormContextValue = (): FormContextValue =>
    useContext(FormContext) ?? { disabled: false, errors: emptyErrors, pending: false };
