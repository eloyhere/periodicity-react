import type { FC, ReactNode } from "react";
import cx from "./cx";
import { useInternational, type InternationalContextValue } from "../../international";
import "./Field.css";

/**
 * Arrangement of a field label and its control.
 * Type: type alias.
 * Fields: none.
 * @example
 * const layout: FieldLayout = "inline";
 */
export type FieldLayout = "stacked" | "inline";
/**
 * Size step of a field.
 * Type: type alias.
 * Fields: none.
 * @example
 * const size: FieldSize = "md";
 */
export type FieldSize = "sm" | "md" | "lg";

/**
 * Presentational props for the field shell.
 * Type: interface.
 * Fields: children, label, hint, error, counter, required, optional, htmlFor, labelAs, layout, size, hideLabel, invalid, disabled, hintId, errorId, className.
 * @example
 * <Field label="Name" hint="Required"><input /></Field>
 */
export interface FieldProps {
    children: ReactNode;
    label?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    counter?: ReactNode;
    required?: boolean;
    optional?: boolean;
    htmlFor?: string;
    labelAs?: "label" | "span";
    layout?: FieldLayout;
    size?: FieldSize;
    hideLabel?: boolean;
    invalid?: boolean;
    disabled?: boolean;
    hintId?: string;
    errorId?: string;
    className?: string;
}

/**
 * Renders a label, control slot, hint, error, and counter.
 * @param props - Label, hint, error, counter, state, and layout.
 * @example
 * <Field label="Email" error="Enter a valid address"><input aria-invalid /></Field>
 * @returns A field shell element.
 */
const Field: FC<FieldProps> = ({
    children,
    label,
    hint,
    error,
    counter,
    required = false,
    optional = false,
    htmlFor,
    labelAs = "label",
    layout = "stacked",
    size = "md",
    hideLabel = false,
    invalid = false,
    disabled = false,
    hintId,
    errorId,
    className = "",
}: FieldProps) => {
    const { t }: InternationalContextValue = useInternational();
    const hasError: boolean = invalid && error !== (void 0) && error !== null && error !== false;
    const hasHint: boolean = hint !== (void 0) && hint !== null && hint !== false;
    const hasLabel: boolean = label !== (void 0) && label !== null && label !== false;
    const hasSupport: boolean = hasError || hasHint || counter !== (void 0);

    const labelClassName: string = cx("field__label", hideLabel && "visually-hidden");
    const labelContent: ReactNode = (
        <>
            {label}
            {required ? (
                <span className="field__required" aria-hidden="true">
                    *
                </span>
            ) : null}
            {optional ? <span className="field__optional">{t("optional")}</span> : null}
        </>
    );

    return (
        <div
            className={cx("field", `field--${layout}`, `field--${size}`, className)}
            data-invalid={invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
        >
            {hasLabel ? (
                labelAs === "label" ? (
                    <label className={labelClassName} htmlFor={htmlFor}>
                        {labelContent}
                    </label>
                ) : (
                    <span className={labelClassName}>{labelContent}</span>
                )
            ) : null}

            <div className="field__control">{children}</div>

            {hasSupport ? (
                <div className="field__support">
                    <span className="field__messages">
                        {hasHint ? (
                            <span className="field__hint" id={hintId}>
                                {hint}
                            </span>
                        ) : null}
                        {hasError ? (
                            <span className="field__error" id={errorId} aria-live="polite">
                                {error}
                            </span>
                        ) : null}
                    </span>
                    {counter === (void 0) ? null : <span className="field__counter">{counter}</span>}
                </div>
            ) : null}
        </div>
    );
};

export default Field;
