import type { FC, ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Props for the Portal.
 * Type: interface.
 * Fields: children, container.
 * @example
 * <Portal><div className="toast" /></Portal>
 */
export interface PortalProps {
    children: ReactNode;
    container?: HTMLElement | null;
}

const canUseDOM: boolean = typeof document !== "undefined";

/**
 * Renders children into document.body or a supplied container.
 * @param props - Children and an optional container.
 * @example
 * <Portal><Popover /></Portal>
 * @returns A portal element, or null during server rendering.
 */
const Portal: FC<PortalProps> = ({ children, container }: PortalProps) => {
    if (!canUseDOM) {
        return null;
    }

    return createPortal(children, container ?? document.body);
};

export default Portal;
