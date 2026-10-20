import type { FC, ReactNode } from "react";
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
 * @example
 * <TabPanel value="today" activeValue="today">Today's focus</TabPanel>
 */
export interface TabPanelProps {
    value: string;
    activeValue: string;
    children: ReactNode;
    className?: string;
}

/**
 * Renders the panel associated with a tab value and hides it while inactive.
 * @param props - Panel value, active tab value, content, and class name.
 * @example
 * <TabPanel value="today" activeValue={value}>Today's focus</TabPanel>
 * @returns A tabpanel element linked to its trigger.
 */
const TabPanel: FC<TabPanelProps> = ({ value, activeValue, children, className = "" }: TabPanelProps): ReactNode => {
    const isActive: boolean = value === activeValue;

    return (
        <div
            id={panelDomId(value)}
            role="tabpanel"
            aria-labelledby={tabDomId(value)}
            hidden={!isActive}
            tabIndex={0}
            className={cx("tabs__panel", className)}
        >
            {children}
        </div>
    );
};

export default TabPanel;
