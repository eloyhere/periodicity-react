import type { FC, HTMLAttributes, ReactNode, Ref } from "react";
import cx from "../../component/foundation/cx";
import "./Form.css";

/**
 * Alignment of the actions inside a form footer.
 * Type: type alias.
 * Fields: none.
 * @example
 * const align: FormActionsAlign = "end";
 */
export type FormActionsAlign = "start" | "center" | "end" | "between";

/**
 * Props for a form action row.
 * Type: interface.
 * Fields: children, align, className, ref, plus native div attributes.
 * @example
 * <FormActions align="end"><Button type="submit">Save</Button></FormActions>
 */
export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    align?: FormActionsAlign;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Lays out submit and cancel actions at the end of a form.
 * @param props - Actions, alignment, and native div attributes.
 * @example
 * <FormActions align="end"><Button type="submit">Save</Button></FormActions>
 * @returns A flex action row.
 */
const FormActions: FC<FormActionsProps> = ({
    children,
    align = "end",
    className = "",
    ref,
    ...rest
}: FormActionsProps) => {
    return (
        <div
            {...rest}
            ref={ref}
            className={cx("form-actions", `form-actions--${align}`, className)}
        >
            {children}
        </div>
    );
};

export default FormActions;
