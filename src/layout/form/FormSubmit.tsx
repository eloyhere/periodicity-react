import type { FC, ReactNode } from "react";
import Button, { type ButtonProps } from "../../component/button/Button";
import Ring from "../../component/ring/Ring";
import cx from "../../component/foundation/cx";
import { useFormContext, type FormContextValue } from "./FormContext";

/**
 * Props for a form submit button.
 * Type: interface.
 * Extends the Button props, so every variant, size, prefix, and suffix still applies. `type` is fixed to
 * `submit`, and the button disables itself while the form is pending or disabled.
 * @param content - Label shown while idle.
 * @param pendingContent - Label shown while the form is submitting; defaults to `content`.
 * @param className - Extra class names applied to the button.
 * @param ref - Ref forwarded to the button element.
 * @example
 * <FormSubmit content="Save changes" pendingContent="Saving…" />
 */
export interface FormSubmitProps extends Omit<ButtonProps, "type" | "content"> {
    content?: ReactNode;
    pendingContent?: ReactNode;
    className?: string;
}

/**
 * Renders the submit action of a form and mirrors its submitting state.
 *
 * The button stays a native submit control; while `Form` is pending it is disabled, announces `aria-busy`, and
 * swaps in a small `Ring` so the action cannot be fired twice. Outside a `Form` it behaves like a plain submit
 * button.
 * @param props - Idle label, pending label, Button props, class name, and ref.
 * @example
 * <FormActions align="end">
 *     <FormSubmit content="Save" pendingContent="Saving…" />
 * </FormActions>
 * @returns A submit button that follows the form state.
 */
const FormSubmit: FC<FormSubmitProps> = ({
    content,
    pendingContent,
    prefix,
    disabled,
    className = "",
    ...rest
}: FormSubmitProps) => {
    const form: FormContextValue = useFormContext();
    const busy: boolean = form.pending;
    const isDisabled: boolean = disabled === true || form.disabled || busy;

    return (
        <Button
            {...rest}
            type="submit"
            className={cx("form-submit", className)}
            disabled={isDisabled}
            aria-busy={busy ? "true" : (void 0)}
            prefix={busy ? <Ring size={16} aria-hidden="true" label="" /> : prefix}
            content={busy ? (pendingContent ?? content) : content}
        />
    );
};

export default FormSubmit;
