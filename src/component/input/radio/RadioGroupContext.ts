import { createContext, type Context } from "react";

/**
 * Shared state passed from a RadioGroup to its Radio children.
 * Type: interface.
 * Fields: name, value, disabled, select, describedBy, invalid.
 * @example
 * const context: RadioGroupContextValue = {
 *     name: "plan",
 *     value: "monthly",
 *     disabled: false,
 *     select: () => {},
 *     describedBy: "plan-hint",
 *     invalid: false,
 * };
 */
export interface RadioGroupContextValue {
    name: string;
    value: string;
    disabled: boolean;
    select: (next: string) => void;
    describedBy: string;
    invalid: boolean;
}

/**
 * Context type for the RadioGroup provider.
 * Type: type alias.
 * Fields: none.
 * @example
 * const group = useContext(RadioGroupContext);
 */
export type RadioGroupContextType = Context<RadioGroupContextValue | null>;

/**
 * Carries the selected value, name, and disabled state to descendant radios.
 * @example
 * <RadioGroupContext.Provider value={contextValue}>{children}</RadioGroupContext.Provider>
 * @returns The context used by Radio.
 */
export const RadioGroupContext: RadioGroupContextType = createContext<RadioGroupContextValue | null>(null);
