import type { FC, HTMLAttributes, ReactNode, Ref } from "react";
import cx from "../../component/foundation/cx";
import { panelDomId, tabDomId } from "./ids";
import "./Tabs.css";

/**
 * Props for the panel paired with a tab.
 * Type: interface.
 * Fields:
 * - `value`: Value of the tab that owns this panel.
 * - `activeValue`: Currently selected tab value.
 * - `children`: Panel content.
 * - `className`: Extra class names for the panel element.
 * - `ref`: Ref forwarded to the panel element.
 * @example
 * <TabPanel value="today" activeValue="today" data-testid="today-panel">Today's focus</TabPanel>
 */
export interface TabPanelProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "hidden"> {
    value: string;
    activeValue: string;
    children: ReactNode;
    className?: string;
    ref?: Ref<HTMLDivElement>;
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Renders the panel associated with a tab value and hides it while inactive.
 * @param props - Panel value, active tab value, content, class name, and native panel attributes.
 * @example
 * <TabPanel value="today" activeValue={value}>Today's focus</TabPanel>
 * @returns A tabpanel element linked to its trigger.
 */
const TabPanel: FC<TabPanelProps> = ({
    value,
    activeValue,
    children,
    className = "",
    ref,
    id,
    tabIndex = 0,
    ...rest
}: TabPanelProps): ReactNode => {
    const isActive: boolean = value === activeValue;

    return (
        <div
            {...rest}
            ref={ref}
            id={id ?? panelDomId(value)}
            role="tabpanel"
            aria-labelledby={tabDomId(value)}
            hidden={!isActive}
            tabIndex={tabIndex}
            className={cx("tabs__panel", className)}
        >
            {children}
        </div>
    );
};

export default TabPanel;
