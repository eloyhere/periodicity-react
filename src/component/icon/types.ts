import type { ReactNode } from "react";

export interface Icon {
    name: string;
    size: number;
    component: ReactNode;
}

export const createIcon: (name: string, component: ReactNode, size?: number) => Icon = (
    name: string,
    component: ReactNode,
    size: number = 18,
): Icon => ({
    name,
    size,
    component,
});
