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
import VisuallyHidden from "../../component/foundation/VisuallyHidden";
import { useInternational, type InternationalContextValue } from "../../international";
import { useFormContext, type FormContextValue } from "./FormContext";
import "./Form.css";

/**
 * Accessible attributes supplied to a form control render function.
 * Type: interface.
 * Fields: id, name, required, disabled, aria-describedby, aria-invalid,
 * aria-errormessage, aria-required.
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
    "aria-errormessage"?: string;
    "aria-required"?: boolean;
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
 * Checks whether a node renders content for sighted or assistive users.
 * @param value - Node to inspect.
 * @example
 * const hasHint = isPresent(hint);
 * @returns True when the node is not (void 0), null, false, or empty.
 */
const isPresent: (value: ReactNode) => boolean = (value: ReactNode): boolean =>
    value !== (void 0) && value !== null && value !== false && value !== "";

/**
 * Reads a non-empty string prop from a child control.
 * @param value - Raw prop value.
 * @example
 * const childId = readString(childProps.id);
 * @returns The string value, or (void 0) when absent or empty.
 */
const readString: (value: unknown) => string | undefined = (value: unknown): string | undefined =>
    typeof value === "string" && value.length > 0 ? value : (void 0);

/**
 * Reads a native boolean attribute using HTML semantics rather than JavaScript semantics.
 * @param value - Raw prop value.
 * @example
 * const childRequired = hasBooleanAttribute(childProps.required);
 * @returns True for `true`, an empty string, or any present non-false value.
 */
const hasBooleanAttribute: (value: unknown) => boolean = (value: unknown): boolean =>
    value !== (void 0) && value !== null && value !== false;

/**
 * Reads an ARIA boolean attribute, which React accepts as a boolean or a string.
 * @param value - Raw prop value.
 * @example
 * const childInvalid = hasAriaBoolean(childProps["aria-invalid"]);
 * @returns True when the value marks the control as invalid or required.
 */
const hasAriaBoolean: (value: unknown) => boolean = (value: unknown): boolean =>
    value === true || value === "true";

/**
 * Merges space-separated id lists, keeping the first occurrence of every id.
 * @param values - Id lists, any of which may be absent.
 * @example
 * const describedBy = mergeIds([hintId, errorId, childDescribedBy]);
 * @returns A space-separated, duplicate-free id list.
 */
const mergeIds: (values: Array<string | undefined>) => string = (values: Array<string | undefined>): string => {
    const ids: Set<string> = new Set<string>();

    values.forEach((value: string | undefined): void => {
        if (value === (void 0)) {
            return;
        }

        value
            .split(" ")
            .filter((id: string): boolean => id.length > 0)
            .forEach((id: string): void => {
                ids.add(id);
            });
    });

    return [...ids].join(" ");
};

/**
 * Binds a label, hint, and error to a native form control. The generated id is
 * passed to a render function, or cloned onto a single React element, so
 * `label htmlFor`, `name`, `required`, `aria-describedby`, `aria-invalid`, and
 * `aria-errormessage` stay in sync. An explicit `id` wins over the child id,
 * which wins over the generated id. Cloning only supplies defined values, so a
 * child keeps any props this field does not set, and native submission,
 * validation, and reset behaviour remain the browser's responsibility.
 * @param props - Label, validation state, and the control or render function.
 * @example
 * <FormField label="Email" name="email" hint="We never share it." required>
 *     {(field) => <input {...field} type="email" />}
 * </FormField>
 * @returns A field wrapper with an accessible label and description.
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
    const { t }: InternationalContextValue = useInternational();
    const generatedId: string = useId();
    const form: FormContextValue = useFormContext();
    const hasHint: boolean = isPresent(hint);
    const child: ReactElement<Record<string, unknown>> | null = isValidElement<Record<string, unknown>>(children)
        ? children
        : null;
    const childProps: Record<string, unknown> = child === null ? {} : child.props;
    const childId: string | undefined = readString(childProps.id);
    const controlId: string = readString(id) ?? childId ?? generatedId;
    const hintId: string = `${controlId}-hint`;
    const errorId: string = `${controlId}-error`;
    const childRequired: boolean =
        hasBooleanAttribute(childProps.required) || hasAriaBoolean(childProps["aria-required"]);
    const isRequired: boolean = required || childRequired;
    const isDisabled: boolean = disabled || form.disabled || hasBooleanAttribute(childProps.disabled);
    const controlName: string | undefined = readString(name) ?? readString(childProps.name);
    // A form-wide error map (server response or validation) reaches every named field; an explicit prop wins.
    const contextError: ReactNode = controlName === (void 0) ? (void 0) : form.errors[controlName];
    const resolvedError: ReactNode = error ?? contextError;
    const hasError: boolean = isPresent(resolvedError);
    const invalid: boolean = hasError;
    const describedBy: string = mergeIds([
        hasHint ? hintId : (void 0),
        hasError ? errorId : (void 0),
        readString(childProps["aria-describedby"]),
    ]);
    const control: FormFieldControlProps = {
        id: controlId,
        ...(controlName === (void 0) ? {} : { name: controlName }),
        ...(isRequired ? { required: true, "aria-required": true } : {}),
        ...(isDisabled ? { disabled: true } : {}),
        ...(describedBy.length > 0 ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": true, "aria-errormessage": errorId } : {}),
    };
    const labelContent: ReactNode = isRequired ? (
        <>
            {label}
            <VisuallyHidden> ({t("required")})</VisuallyHidden>
        </>
    ) : (
        label
    );

    const content: ReactNode =
        typeof children === "function"
            ? children(control)
            : child === null
              ? children
              : cloneElement(child, control as unknown as Record<string, unknown>);

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("form-field", className)}
            data-disabled={isDisabled ? "true" : "false"}
            data-invalid={invalid ? "true" : "false"}
        >
            <Field
                label={labelContent}
                htmlFor={controlId}
                hint={hint}
                hintId={hintId}
                error={resolvedError}
                errorId={errorId}
                required={isRequired}
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
