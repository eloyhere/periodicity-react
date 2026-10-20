import type {
    FC,
    HTMLAttributes,
    MouseEvent as ReactMouseEvent,
    ReactNode,
    Ref,
} from "react";
import cx from "../../component/foundation/cx";
import Button from "../../component/button/Button";
import "../coordinator/Coordinator.css";
import { useInternational, type InternationalContextValue } from "../../international";

/**
 * Props for a Material toolbar row.
 * Type: interface.
 * Fields: navigationIcon, navigationLabel, onNavigationClick, title, subtitle, actions,
 * children, ariaLabel, className, ref, plus native header attributes.
 * @example
 * <Toolbar title="Explore" navigationIcon="←" actions={<Button>Save</Button>} />
 */
export interface ToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
    navigationIcon?: ReactNode;
    navigationLabel?: string;
    onNavigationClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
    title?: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
    ariaLabel?: string;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a navigation action, title block, flexible content, and trailing
 * actions for a Material top app bar.
 * @param props - Navigation, title, actions, and native header attributes.
 * @example
 * <Toolbar title="Explore" navigationIcon="←" actions={<Button>Save</Button>} />
 * @returns A toolbar header.
 */
const Toolbar: FC<ToolbarProps> = ({
    navigationIcon,
    navigationLabel,
    onNavigationClick,
    title,
    subtitle,
    actions,
    children,
    ariaLabel,
    className = "",
    ref,
    ...rest
}: ToolbarProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedNavigationLabel: string = navigationLabel ?? t("back");

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("toolbar", className)}
            role="toolbar"
            aria-label={ariaLabel ?? (typeof title === "string" ? title : (void 0))}
        >
            {navigationIcon === (void 0) ? null : (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="toolbar__navigation"
                    aria-label={resolvedNavigationLabel}
                    onClick={onNavigationClick}
                >
                    {navigationIcon}
                </Button>
            )}
            <div className="toolbar__titles">
                {title === (void 0) ? null : <span className="toolbar__title">{title}</span>}
                {subtitle === (void 0) ? null : (
                    <span className="toolbar__subtitle">{subtitle}</span>
                )}
            </div>
            {children === (void 0) ? null : <div className="toolbar__content">{children}</div>}
            {actions === (void 0) ? null : <div className="toolbar__actions">{actions}</div>}
        </div>
    );
};

export default Toolbar;
