import type {
    FC,
    HTMLAttributes,
    MouseEvent as ReactMouseEvent,
    ReactNode,
    Ref,
} from "react";
import cx from "../../component/foundation/cx";
import Button from "../../component/button/Button";
import Icon, { type IconName } from "../../component/icon/Icon";
import "../coordinator/Coordinator.css";
import "./Toolbar.css";
import { useInternational, type InternationalContextValue } from "../../international";

/**
 * Props for a Material toolbar row.
 * Type: interface.
 * Fields: prefix, content, suffix, navigationIcon, navigationLabel, onNavigationClick, title,
 * subtitle, actions, children, ariaLabel, className, ref, plus native header attributes.
 * When `prefix`, `content`, or `suffix` is supplied, the toolbar uses the three-slot layout.
 * @example
 * <Toolbar prefix={<Icon name="Menu" />} content="Explore" suffix={<Button>Save</Button>} />
 */
export interface ToolbarProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "prefix" | "content"> {
    prefix?: ReactNode;
    content?: ReactNode;
    suffix?: ReactNode;
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
const hasSlotContent: (slot: ReactNode) => boolean = (slot: ReactNode): boolean =>
    slot !== (void 0) && slot !== null && slot !== false && slot !== "";

const renderToolbarDecoration: (slot: ReactNode) => ReactNode = (slot: ReactNode): ReactNode =>
    typeof slot === "string" ? <Icon name={slot as IconName} size={18} /> : slot;

const Toolbar: FC<ToolbarProps> = ({
    prefix,
    content,
    suffix,
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
    const slotted: boolean = prefix !== (void 0) || content !== (void 0) || suffix !== (void 0);

    if (slotted) {
        return (
            <div
                {...rest}
                ref={ref}
                className={cx("toolbar", "toolbar--slots", className)}
                role="toolbar"
                aria-label={ariaLabel ?? (typeof content === "string" ? content : (void 0))}
            >
                {hasSlotContent(prefix) ? (
                    <div className="toolbar__slot toolbar__slot--prefix">
                        {renderToolbarDecoration(prefix)}
                    </div>
                ) : null}
                {hasSlotContent(content) ? (
                    <div className="toolbar__slot toolbar__slot--content">{content}</div>
                ) : null}
                {hasSlotContent(suffix) ? (
                    <div className="toolbar__slot toolbar__slot--suffix">
                        {renderToolbarDecoration(suffix)}
                    </div>
                ) : null}
            </div>
        );
    }

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
