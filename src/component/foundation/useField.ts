import { useId, type ReactNode } from "react";

/**
 * Options for useField.
 * Type: interface.
 * Fields: id, label, hint, error, required.
 * @example
 * const field = useField({ label: "Name" });
 */
export interface UseFieldOptions {
    id?: string;
    label?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    required?: boolean;
}

/**
 * Presentational props accepted by Field.
 * Type: interface.
 * Fields: label, hint, error, required, htmlFor, hintId, errorId, invalid.
 * @example
 * <Field {...field.fieldProps}><input /></Field>
 */
export interface FieldChromeProps {
    label?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    required?: boolean;
    htmlFor?: string;
    hintId?: string;
    errorId?: string;
    invalid?: boolean;
}

/**
 * Result of useField.
 * Type: interface.
 * Fields: controlId, hintId, errorId, describedBy, invalid, fieldProps.
 * @example
 * const { controlId, describedBy } = useField({ label: "Name" });
 */
export interface FieldState {
    controlId: string;
    hintId: string;
    errorId: string;
    describedBy: string;
    invalid: boolean;
    fieldProps: FieldChromeProps;
}

/**
 * Checks whether a React node has visible content.
 * @param value - Node to inspect.
 * @example
 * const hasHint = isPresent(hint);
 * @returns True when the node has content.
 */
const isPresent: (value: ReactNode) => boolean = (value: ReactNode): boolean =>
    value !== (void 0) && value !== null && value !== false && value !== "";
/**
 * Generates linked ids, description text, and Field props for a form control.
 * @param options - Control id, label, hint, error, and required flag.
 * @example
 * const field = useField({ label: "Email", hint: "name@example.com" });
 * @returns Control id, hint and error ids, description text, and Field props.
 */
export const useField: (options: UseFieldOptions) => FieldState = ({
    id,
    label,
    hint,
    error,
    required = false,
}: UseFieldOptions): FieldState => {
    const generatedId: string = useId();
    const controlId: string = id ?? generatedId;
    const hintId: string = `${controlId}-hint`;
    const errorId: string = `${controlId}-error`;
    const hasHint: boolean = isPresent(hint);
    const hasError: boolean = isPresent(error);

    const describedByIds: string[] = [];

    if (hasHint) {
        describedByIds.push(hintId);
    }

    if (hasError) {
        describedByIds.push(errorId);
    }

    return {
        controlId,
        hintId,
        errorId,
        describedBy: describedByIds.join(" "),
        invalid: hasError,
        fieldProps: {
            label,
            hint,
            error,
            required,
            htmlFor: controlId,
            hintId,
            errorId,
            invalid: hasError,
        },
    };
};

export default useField;
