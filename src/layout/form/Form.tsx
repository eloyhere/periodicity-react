import {
    type FC,
    type FormHTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
import cx from "../../component/foundation/cx";
import { FormContext } from "./FormContext";
import "./Form.css";

/**
 * Props for the native form wrapper.
 * Type: interface.
 * Fields: children, disabled, className, ref, plus native form attributes.
 * @example
 * <Form onSubmit={save}><FormField label="Email" name="email">...</FormField></Form>
 */
export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
    children?: ReactNode;
    disabled?: boolean;
    className?: string;
    ref?: Ref<HTMLFormElement>;
}

/**
 * Renders a native form element and shares disabled/name state with its fields.
 * Native submission, validation, reset, method, action, and autocomplete
 * behaviour remain the browser's responsibility.
 * @param props - Form contents, disabled state, and native form attributes.
 * @example
 * <Form action="/subscribe" method="post" onSubmit={handleSubmit}>
 *     <FormField label="Email" name="email">
 *         {(field) => <input {...field} type="email" required />}
 *     </FormField>
 * </Form>
 * @returns A native form element.
 */
const Form: FC<FormProps> = ({
    children,
    disabled = false,
    className = "",
    ref,
    ...rest
}: FormProps) => {
    return (
        <form
            {...rest}
            ref={ref}
            className={cx("form", className)}
            aria-disabled={disabled ? "true" : (void 0)}
            data-disabled={disabled ? "true" : "false"}
            noValidate={rest.noValidate}
        >
            <FormContext.Provider value={{ disabled, name: rest.name }}>
                <fieldset className="form__fieldset" disabled={disabled}>
                    {children}
                </fieldset>
            </FormContext.Provider>
        </form>
    );
};

export default Form;
