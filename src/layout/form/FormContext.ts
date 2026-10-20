import { createContext, useContext } from "react";

/**
 * State shared by the fields inside a form.
 * Type: interface.
 * Fields: disabled, name.
 * @example
 * const { disabled } = useFormContext();
 */
export interface FormContextValue {
    disabled: boolean;
    name?: string;
}

export const FormContext: ReturnType<typeof createContext<FormContextValue | null>> =
    createContext<FormContextValue | null>(null);

/**
 * Reads the nearest form context.
 * @returns The form state, or a neutral state outside a form.
 * @example
 * const form = useFormContext();
 */
export const useFormContext: () => FormContextValue = (): FormContextValue =>
    useContext(FormContext) ?? { disabled: false };
