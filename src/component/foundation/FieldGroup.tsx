import type { FC, ReactNode } from "react";
import cx from "./cx";
import "./Field.css";

/**
 * Props for a grouped set of choice controls.
 * Type: interface.
 * Fields: children, legend, hint, error, required, optional, invalid, disabled, layout, size, hintId, errorId, className.
 * @example
 * <FieldGroup legend="Notifications" hint="Choose one"><Radio /></FieldGroup>
 */
export interface FieldGroupProps {
    children: ReactNode;
    legend: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    required?: boolean;
    optional?: boolean;
    invalid?: boolean;
    disabled?: boolean;
    layout?: "stacked" | "inline";
    size?: "sm" | "md" | "lg";
    hintId?: string;
    errorId?: string;
    className?: string;
}

/**
 * Renders a fieldset and legend around a group of controls.
 * @param props - Legend, hint, error, state, and layout.
 * @example
 * <FieldGroup legend="Notifications"><Radio /></FieldGroup>
 * @returns A grouped field element.
 */
const FieldGroup: FC<FieldGroupProps> = ({
    children,
    legend,
    hint,
    error,
    required = false,
    optional = false,
    invalid = false,
    disabled = false,
    layout = "stacked",
    size = "md",
    hintId,
    errorId,
    className = "",
}: FieldGroupProps) => {
    const hasError: boolean = invalid && error !== (void 0) && error !== null && error !== false;
    const hasHint: boolean = hint !== (void 0) && hint !== null && hint !== false;

    return (
        <fieldset
            className={cx("field", "field--group", `field--${layout}`, `field--${size}`, className)}
            data-invalid={invalid ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
        >
            <legend className="field__label">
                {legend}
                {required ? (
                    <span className="field__required" aria-hidden="true">
                        *
                    </span>
                ) : null}
                {optional ? <span className="field__optional">Optional</span> : null}
            </legend>

            <div className="field__control">{children}</div>

            {hasError || hasHint ? (
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
                </div>
            ) : null}
        </fieldset>
    );
};

export default FieldGroup;
