import {
    cloneElement,
    isValidElement,
    useId,
    type FC,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
    type Ref,
} from "react";
import cx from "../../component/foundation/cx";
import Field from "../../component/foundation/Field";
import { useFormContext, type FormContextValue } from "./FormContext";
import "./Form.css";

/**
 * Accessible attributes supplied to a form control render function.
 * Type: interface.
 * Fields: id, name, required, disabled, aria-describedby, aria-invalid.
 * @example
 * <FormField label="Email" name="email">
 *     {(field) => <input {...field} type="email" />}
 * </FormField>
 */
export interface FormFieldControlProps {
    id: string;
    name?: string;
    required?: boolean;
    disabled?: boolean;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
}

/**
 * Props for a labelled form field.
 * Type: interface.
 * Fields: label, name, id, hint, error, required, optional, disabled, children,
 * className, ref, plus native div attributes.
 * @example
 * <FormField label="Email" name="email" hint="We never share it.">
 *     {(field) => <input {...field} type="email" />}
 * </FormField>
 */
export interface FormFieldProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    label: ReactNode;
    name?: string;
    id?: string;
    hint?: ReactNode;
    error?: ReactNode;
    required?: boolean;
    optional?: boolean;
    disabled?: boolean;
    children: ReactNode | ((field: FormFieldControlProps) => ReactNode);
    ref?: Ref<HTMLDivElement>;
}

/**
 * Binds a label, hint, and error to a native form control. The generated id is
 * passed to a render function, or cloned onto a single React element, so
 * `label htmlFor`, `aria-describedby`, and `aria-invalid` stay in sync.
 * @param props - Label, validation state, and the control or render function.
 * @example
 * <FormField label="Email" name="email">
 *     {(field) => <input {...field} type="email" required />}
 * </FormField>
 * @returns A field wrapper with an accessible label.
 */
const FormField: FC<FormFieldProps> = ({
    label,
    name,
    id,
    hint,
    error,
    required = false,
    optional = false,
    disabled = false,
    children,
    className = "",
    ref,
    ...rest
}: FormFieldProps) => {
    const generatedId: string = useId();
    const form: FormContextValue = useFormContext();
    const controlId: string = id ?? generatedId;
    const hintId: string = `${controlId}-hint`;
    const errorId: string = `${controlId}-error`;
    const invalid: boolean = error !== (void 0) && error !== null && error !== false;
    const isDisabled: boolean = disabled || form.disabled;
    const describedBy: string | undefined = invalid
        ? errorId
        : hint !== (void 0) && hint !== null && hint !== false
          ? hintId
          : (void 0);
    const control: FormFieldControlProps = {
        id: controlId,
        ...(name === (void 0) ? {} : { name }),
        ...(required ? { required: true } : {}),
        ...(isDisabled ? { disabled: true } : {}),
        ...(describedBy === (void 0) ? {} : { "aria-describedby": describedBy }),
        ...(invalid ? { "aria-invalid": true } : {}),
    };

    const content: ReactNode =
        typeof children === "function"
            ? children(control)
            : isValidElement(children)
              ? cloneElement(
                    children as ReactElement<Record<string, unknown>>,
                    control as unknown as Record<string, unknown>,
                )
              : children;

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("form-field", className)}
            data-disabled={isDisabled ? "true" : "false"}
            data-invalid={invalid ? "true" : "false"}
        >
            <Field
                label={label}
                htmlFor={controlId}
                hint={hint}
                hintId={hintId}
                error={error}
                errorId={errorId}
                required={required}
                optional={optional}
                invalid={invalid}
                disabled={isDisabled}
            >
                {content}
            </Field>
        </div>
    );
};

export default FormField;
