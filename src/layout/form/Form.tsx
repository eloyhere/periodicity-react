import {
    useRef,
    useState,
    type FC,
    type FormEventHandler,
    type FormHTMLAttributes,
    type ReactNode,
    type Ref,
    type RefCallback,
    type RefObject,
    type SubmitEvent as ReactSubmitEvent,
    type SubmitEventHandler,
} from "react";
import { flushSync } from "react-dom";
import cx from "../../component/foundation/cx";
import useControllableState, { type Updater } from "../../component/foundation/useControllableState";
import useMergedRef from "../../component/foundation/useMergedRef";
import { FormContext, type FormContextValue, type FormErrors, type FormValues, type FormValue } from "./FormContext";
import "./Form.css";

/**
 * Controller handed to the submit callbacks.
 * Type: interface.
 * @param form - The submitted form element.
 * @param event - The submit event, for native `FormData` or `formAction` access.
 * @param values - Values collected from the form controls.
 * @param setErrors - Replaces the field error map, for server-side validation results.
 * @param setPending - Toggles the submitting state.
 * @example
 * const submit = async (values: FormValues, api: FormSubmitApi): Promise<void> => {
 *     const result = await save(values);
 *     api.setErrors(result.errors);
 * };
 */
export interface FormSubmitApi {
    readonly form: HTMLFormElement;
    readonly event: ReactSubmitEvent<HTMLFormElement>;
    readonly values: FormValues;
    setErrors: (errors: FormErrors) => void;
    setPending: (pending: boolean) => void;
}

/**
 * Props for the native form wrapper.
 * Type: interface.
 * Native submission, reset, method, action, enctype, and autocomplete attributes still work. The added props
 * run a validation and submission pipeline on top of that behaviour.
 * @param children - Fields, actions, and messages.
 * @param disabled - Disables the fieldset and marks the form busy for its controls.
 * @param errors - Controlled field errors, keyed by control name.
 * @param defaultErrors - Initial field errors when the form is uncontrolled.
 * @param onErrorsChange - Called whenever the field errors change.
 * @param validate - Collects values and returns the field errors to display; may be async.
 * @param onValidSubmit - Called with the collected values once validation passes; may be async, which keeps the
 * form busy until it settles.
 * @param onInvalidSubmit - Called with the field errors when validation blocks a submission.
 * @param onSubmitError - Called when `onValidSubmit` rejects; the message is shown through `FormMessage`.
 * @param pending - Controlled submitting state.
 * @param defaultPending - Initial submitting state when the form is uncontrolled.
 * @param onPendingChange - Called whenever the submitting state changes.
 * @param className - Extra class names applied to the form element.
 * @param ref - Ref forwarded to the form element.
 * @example
 * <Form
 *     validate={(values) => (values.email === "" ? { email: "Enter an email." } : {})}
 *     onValidSubmit={async (values, api) => save(values)}
 * >
 *     <FormField label="Email" name="email">{(field) => <input {...field} />}</FormField>
 *     <FormActions align="end"><FormSubmit content="Save" /></FormActions>
 * </Form>
 */
export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "children" | "className"> {
    children?: ReactNode;
    disabled?: boolean;
    errors?: FormErrors;
    defaultErrors?: FormErrors;
    onErrorsChange?: (errors: FormErrors) => void;
    validate?: (values: FormValues) => FormErrors | Promise<FormErrors>;
    onValidSubmit?: (values: FormValues, api: FormSubmitApi) => void | Promise<void>;
    onInvalidSubmit?: (errors: FormErrors, values: FormValues) => void;
    onSubmitError?: (error: unknown, api: FormSubmitApi) => void;
    pending?: boolean;
    defaultPending?: boolean;
    onPendingChange?: (pending: boolean) => void;
    className?: string;
    ref?: Ref<HTMLFormElement>;
}

const emptyErrors: FormErrors = {};
const DefaultFailure: string = "Submission failed. Please try again.";

/**
 * Collects form values, folding repeated names into arrays.
 * @param form - Form element to read.
 * @example
 * const values: FormValues = collectValues(form);
 * @returns Values keyed by control name.
 */
const collectValues: (form: HTMLFormElement) => FormValues = (form: HTMLFormElement): FormValues => {
    const data: FormData = new FormData(form);
    const values: Record<string, FormValue> = {};

    data.forEach((value: FormDataEntryValue, key: string): void => {
        const existing: FormValue | undefined = values[key];

        if (existing === (void 0)) {
            values[key] = value;

            return;
        }

        values[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    });

    return values;
};

/**
 * Moves focus to the form message, or to the first invalid control.
 * @param form - Form that was submitted.
 * @param errors - Field errors reported by validation.
 * @example
 * focusFirstInvalid(form, { email: "Required" });
 * @returns Nothing.
 */
const focusFirstInvalid: (form: HTMLFormElement, errors: FormErrors) => void = (
    form: HTMLFormElement,
    errors: FormErrors,
): void => {
    const message: HTMLElement | null = form.querySelector<HTMLElement>("[data-form-message='true']");

    if (message !== null) {
        message.focus();

        return;
    }

    const first: string | undefined = Object.keys(errors)[0];

    if (first === (void 0)) {
        return;
    }

    const control: Element | RadioNodeList | null = form.elements.namedItem(first);

    if (control instanceof HTMLElement) {
        control.focus();
    }
};

/**
 * Renders a native form and adds a validation and submission pipeline.
 *
 * The element stays a real `<form>`: native submit, reset, validation, method, action, and autocomplete keep
 * working, and `onSubmit` / `onReset` still receive their native events. On top of that, `validate` collects the
 * form values and returns field errors, `onValidSubmit` runs only when validation passes, `pending` tracks an
 * async submission, and the error map is shared with every `FormField` so one server response can mark all
 * fields. Invalid submissions focus the `FormMessage` when one is rendered, otherwise the first invalid control.
 * @param props - Children, disabled state, error and pending state, validation and submission callbacks, class
 * name, and native form attributes.
 * @example
 * <Form validate={validateValues} onValidSubmit={save}>
 *     <FormField label="Email" name="email">{(field) => <input {...field} />}</FormField>
 *     <FormActions align="end"><FormSubmit content="Save" /></FormActions>
 * </Form>
 * @returns A native form element with shared validation and submission state.
 */
const Form: FC<FormProps> = ({
    children,
    disabled = false,
    errors: errorsProp,
    defaultErrors = emptyErrors,
    onErrorsChange,
    validate,
    onValidSubmit,
    onInvalidSubmit,
    onSubmitError,
    pending: pendingProp,
    defaultPending = false,
    onPendingChange,
    className = "",
    onSubmit,
    onReset,
    ref,
    ...rest
}: FormProps) => {
    const internalRef: RefObject<HTMLFormElement | null> = useRef<HTMLFormElement | null>(null);
    const mergedRef: RefCallback<HTMLFormElement> = useMergedRef<HTMLFormElement>(ref, internalRef);
    const [errors, setErrors]: readonly [FormErrors, (next: Updater<FormErrors>) => void] =
        useControllableState<FormErrors>({
        value: errorsProp,
        defaultValue: defaultErrors,
        onChange: onErrorsChange,
    });
    const [pending, setPending]: readonly [boolean, (next: Updater<boolean>) => void] = useControllableState<boolean>({
        value: pendingProp,
        defaultValue: defaultPending,
        onChange: onPendingChange,
    });
    const [submitError, setSubmitError]: [ReactNode, (next: ReactNode) => void] = useState<ReactNode>((void 0));
    const hasPipeline: boolean = validate !== (void 0) || onValidSubmit !== (void 0);

    const runSubmit: (
        form: HTMLFormElement,
        event: ReactSubmitEvent<HTMLFormElement>,
        values: FormValues,
    ) => Promise<void> = async (
        form: HTMLFormElement,
        event: ReactSubmitEvent<HTMLFormElement>,
        values: FormValues,
    ): Promise<void> => {
            const api: FormSubmitApi = { form, event, values, setErrors, setPending };

            setPending(true);
            setSubmitError((void 0));

            try {
                const nextErrors: FormErrors =
                    validate === (void 0) ? emptyErrors : await validate(values);

                // Validation errors must be committed before focus moves, so the message region exists.
                flushSync((): void => {
                    setErrors(nextErrors);
                });

                if (Object.keys(nextErrors).length > 0) {
                    onInvalidSubmit?.(nextErrors, values);
                    focusFirstInvalid(form, nextErrors);

                    return;
                }

                await onValidSubmit?.(values, api);
            } catch (error: unknown) {
                setSubmitError(error instanceof Error && error.message.length > 0 ? error.message : DefaultFailure);
                onSubmitError?.(error, api);
            } finally {
                setPending(false);
            }
        };

    const handleSubmit: SubmitEventHandler<HTMLFormElement> = (
        event: ReactSubmitEvent<HTMLFormElement>,
    ): void => {
        onSubmit?.(event);

        if (event.defaultPrevented || !hasPipeline) {
            return;
        }

        event.preventDefault();

        const form: HTMLFormElement = event.currentTarget;
        const values: FormValues = collectValues(form);

        void runSubmit(form, event, values);
    };

    const handleReset: FormEventHandler<HTMLFormElement> = (
        event: ReactSubmitEvent<HTMLFormElement>,
    ): void => {
        onReset?.(event);

        if (event.defaultPrevented) {
            return;
        }

        setErrors(emptyErrors);
        setSubmitError((void 0));
        setPending(false);
    };

    const contextValue: FormContextValue = {
        disabled,
        ...(rest.name === (void 0) ? {} : { name: rest.name }),
        errors,
        pending,
        ...(submitError === (void 0) ? {} : { submitError }),
    };

    return (
        <form
            {...rest}
            ref={mergedRef}
            className={cx("form", className)}
            aria-disabled={disabled ? "true" : (void 0)}
            aria-busy={pending ? "true" : (void 0)}
            data-disabled={disabled ? "true" : "false"}
            data-pending={pending ? "true" : "false"}
            onSubmit={handleSubmit}
            onReset={handleReset}
        >
            <FormContext.Provider value={contextValue}>
                <fieldset className="form__fieldset" disabled={disabled}>
                    {children}
                </fieldset>
            </FormContext.Provider>
        </form>
    );
};

export default Form;
