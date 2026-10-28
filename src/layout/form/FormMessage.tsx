import { type FC, type HTMLAttributes, type ReactNode } from "react";
import cx from "../../component/foundation/cx";
import { useInternational, type InternationalContextValue } from "../../international";
import { useFormContext, type FormContextValue } from "./FormContext";
import "./Form.css";

/**
 * Props for the form status message.
 * Type: interface.
 * Fields: title, showFields, children, className, ref, plus native div attributes.
 * @example
 * <FormMessage title="Could not save" />
 */
export interface FormMessageProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
    title?: ReactNode;
    showFields?: boolean;
    children?: ReactNode;
    className?: string;
}

/**
 * Renders the submission failure and the current field errors above a form.
 *
 * The region only exists when there is something to report: a rejected submission takes priority, and the field
 * list explains what validation blocked. It is a polite alert with `tabIndex={-1}` and `data-form-message`, so
 * `Form` can move focus here on an invalid submission instead of scrolling to a control the reader has not heard
 * about yet.
 * @param props - Title, field list toggle, extra content, class name, and native div attributes.
 * @example
 * <Form validate={validate} onValidSubmit={save}>
 *     <FormMessage />
 *     <FormField label="Email" name="email">{(field) => <input {...field} />}</FormField>
 * </Form>
 * @returns The message region, or null when the form has nothing to report.
 */
const FormMessage: FC<FormMessageProps> = ({
    title,
    showFields = true,
    children,
    className = "",
    ...rest
}: FormMessageProps) => {
    const { t }: InternationalContextValue = useInternational();
    const form: FormContextValue = useFormContext();
    const fieldErrors: ReactNode[] = showFields ? Object.values(form.errors) : [];
    const hasFailure: boolean = form.submitError !== (void 0) && form.submitError !== null && form.submitError !== false;
    const hasContent: boolean = hasFailure || fieldErrors.length > 0 || children !== (void 0);

    if (!hasContent) {
        return null;
    }

    return (
        <div
            {...rest}
            className={cx("form-message", className)}
            role="alert"
            tabIndex={-1}
            data-form-message="true"
        >
            <p className="form-message__title">{title ?? t("error")}</p>
            {hasFailure ? <p className="form-message__body">{form.submitError}</p> : null}
            {fieldErrors.length > 0 ? (
                <ul className="form-message__list">
                    {fieldErrors.map(
                        (message: ReactNode, index: number): ReactNode => (
                            <li key={`${index}`} className="form-message__item">
                                {message}
                            </li>
                        ),
                    )}
                </ul>
            ) : null}
            {children}
        </div>
    );
};

export default FormMessage;
