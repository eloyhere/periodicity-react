import {
    type AriaRole,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
import cx from "../foundation/cx";
import useControllableState from "../foundation/useControllableState";
import Icon, { type IconName } from "../icon/Icon";
import VisuallyHidden from "../foundation/VisuallyHidden";
import Surface, { type SurfaceTone } from "../surface/Surface";
import { useInternational, type InternationalContextValue } from "../../international";
import "./Alert.css";

/**
 * Semantic tone of an alert.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: AlertTone = "warning";
 */
export type AlertTone = "neutral" | "accent" | "success" | "warning" | "danger";

/**
 * Why an alert was dismissed.
 * Type: type alias.
 * Fields: none.
 * @example
 * const reason: AlertDismissReason = "button";
 */
export type AlertDismissReason = "button";

/**
 * Props for the Alert and Banner components.
 * Type: interface.
 * Fields: tone, title, description, icon, action, dismissible, onDismiss, visible, defaultVisible,
 * onVisibleChange, className, role, ref, plus native div attributes.
 * The native `title` tooltip attribute is omitted because `title` carries the alert heading;
 * other native attributes are forwarded to the alert body element.
 * @example
 * <Alert tone="success" title="Ritual saved" description="It now repeats every morning." />
 */
export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
    tone?: AlertTone;
    title: ReactNode;
    description?: ReactNode;
    icon?: IconName;
    action?: ReactNode;
    dismissible?: boolean;
    /** Called with the reason when the dismiss button hides the alert. */
    onDismiss?: (reason: AlertDismissReason) => void;
    /** Controlled visibility; omit to let the alert manage its own state. */
    visible?: boolean;
    /** Initial visibility when uncontrolled; defaults to `true`. */
    defaultVisible?: boolean;
    /** Called with the requested visibility whenever the alert hides. */
    onVisibleChange?: (visible: boolean) => void;
    className?: string;
    role?: AriaRole;
    /** Ref for the alert surface element. */
    ref?: Ref<HTMLDivElement>;
}

const SurfaceTones: Record<AlertTone, SurfaceTone> = {
    neutral: "neutral",
    accent: "accent",
    success: "mint",
    warning: "amber",
    danger: "danger",
};

const DefaultIcons: Record<AlertTone, IconName> = {
    neutral: "Info",
    accent: "Sparkle",
    success: "Success",
    warning: "Warning",
    danger: "Error",
};

/**
 * Renders a tone-tinted Surface with an icon, title, description, action, and optional dismissal.
 * @param props - Tone, title, description, icon, action, dismissal, visibility, and native attributes.
 * @example
 * <Alert tone="warning" title="Storage almost full" dismissible onDismiss={hide} />
 * @returns An alert element, or null once dismissed.
 */
const Alert: FC<AlertProps> = ({
    tone = "neutral",
    title,
    description,
    icon,
    action,
    dismissible = false,
    onDismiss,
    visible: visibleProp,
    defaultVisible = true,
    onVisibleChange,
    className = "",
    role: roleProp,
    ref,
    onClick,
    onContextMenu,
    onKeyDown,
    onPointerDown,
    onPointerEnter,
    style,
    tabIndex,
    ...rest
}: AlertProps) => {
    const { t }: InternationalContextValue = useInternational();
    const [visible, setVisible]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: visibleProp,
        defaultValue: defaultVisible,
        onChange: onVisibleChange,
    });
    const surfaceTone: SurfaceTone = SurfaceTones[tone];
    const iconName: IconName = icon ?? DefaultIcons[tone];
    const role: AriaRole = roleProp ?? (tone === "danger" ? "alert" : "status");
    const statusLabel: string | undefined =
        tone === "success"
            ? t("success")
            : tone === "warning"
              ? t("warning")
              : tone === "danger"
                ? t("error")
                : (void 0);

    const handleDismiss: () => void = (): void => {
        setVisible(false);
        onDismiss?.("button");
    };

    if (!visible) {
        return null;
    }

    return (
        <Surface
            ref={ref}
            className={cx("alert", `alert--${tone}`, className)}
            style={style}
            tabIndex={tabIndex}
            tone={surfaceTone}
            background={<span className="alert__wash" />}
            foreground={<span className="alert__edge" />}
            onClick={onClick}
            onContextMenu={onContextMenu}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerEnter={onPointerEnter}
        >
            <div className="alert__layout">
                <div className="alert__body" role={role} {...rest}>
                    <span className="alert__icon" aria-hidden="true">
                        <Icon name={iconName} size={17} />
                    </span>
                    <div className="alert__copy">
                        <div className="alert__title">
                            {statusLabel === (void 0) ? null : (
                                <VisuallyHidden>{`${statusLabel}: `}</VisuallyHidden>
                            )}
                            {title}
                        </div>
                        {description === (void 0) || description === null || description === false ? null : (
                            <div className="alert__description">{description}</div>
                        )}
                        {action === (void 0) || action === null || action === false ? null : (
                            <div className="alert__action">{action}</div>
                        )}
                    </div>
                </div>
                {dismissible ? (
                    <button
                        type="button"
                        className="alert__dismiss"
                        aria-label={t("dismiss")}
                        onClick={handleDismiss}
                    >
                        <Icon name="Close" size={14} />
                    </button>
                ) : null}
            </div>
        </Surface>
    );
};

export default Alert;
