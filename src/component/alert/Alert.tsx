import { useState, type Dispatch, type FC, type ReactNode, type SetStateAction } from "react";
import cx from "../foundation/cx";
import Icon, { type IconName } from "../icon/Icon";
import Surface, { type SurfaceTone } from "../surface/Surface";
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
 * Props for the Alert and Banner components.
 * Type: interface.
 * Fields: tone, title, description, icon, action, dismissible, onDismiss, className.
 * @example
 * <Alert tone="success" title="Ritual saved" description="It now repeats every morning." />
 */
export interface AlertProps {
    tone?: AlertTone;
    title: ReactNode;
    description?: ReactNode;
    icon?: IconName;
    action?: ReactNode;
    dismissible?: boolean;
    onDismiss?: () => void;
    className?: string;
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

const DismissLabels: Record<AlertTone, string> = {
    neutral: "Dismiss message",
    accent: "Dismiss message",
    success: "Dismiss message",
    warning: "Dismiss warning",
    danger: "Dismiss error",
};

/**
 * Renders a tone-tinted Surface with an icon, title, description, action, and optional dismissal.
 * @param props - Tone, title, description, icon, action, dismissal, and class name.
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
    className = "",
}: AlertProps) => {
    const [visible, setVisible]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(true);
    const surfaceTone: SurfaceTone = SurfaceTones[tone];
    const iconName: IconName = icon ?? DefaultIcons[tone];
    const role: "status" | "alert" = tone === "danger" ? "alert" : "status";

    const handleDismiss: () => void = (): void => {
        onDismiss?.();
        setVisible(false);
    };

    if (!visible) {
        return null;
    }

    return (
        <Surface
            className={cx("alert", `alert--${tone}`, className)}
            tone={surfaceTone}
            background={<span className="alert__wash" />}
            foreground={<span className="alert__edge" />}
        >
            <div className="alert__layout">
                <div className="alert__body" role={role}>
                    <span className="alert__icon" aria-hidden="true">
                        <Icon name={iconName} size={17} />
                    </span>
                    <div className="alert__copy">
                        <div className="alert__title">{title}</div>
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
                        aria-label={DismissLabels[tone]}
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
