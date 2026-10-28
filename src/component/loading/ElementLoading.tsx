import { type FC, type HTMLAttributes, type Ref, type RefObject } from "react";
import cx from "../foundation/cx";
import { useInternational, type InternationalContextValue } from "../../international";
import Portal from "../foundation/Portal";
import { useAnchorRect, type AnchorRect } from "../anchor/useAnchorRect";
import Ring from "../ring/Ring";
import "./ElementLoading.css";

/**
 * Props for an element-bound loading overlay.
 * Type: interface.
 * Fields: loading, target, label, className, ref, plus native div attributes.
 * The overlay is announced as a polite status and does not accept `aria-label`, `aria-live`,
 * or `role`, because `label` supplies its accessible name.
 * @example
 * <ElementLoading loading={saving} target={panelRef} />
 */
export interface ElementLoadingProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "aria-label" | "aria-live" | "role"> {
    loading: boolean;
    target: RefObject<HTMLElement | null> | string;
    label?: string;
    className?: string;
    /** Ref for the native loading overlay. */
    ref?: Ref<HTMLDivElement>;
}

/**
 * Mounts an overlay and spinner directly on top of a referenced element.
 * Native attributes and handlers are forwarded to the portalled overlay.
 * @param props - Loading state, target element, and native overlay attributes.
 * @example
 * <ElementLoading loading={loading} target={panelRef} label="Saving" />
 * @returns A portalled loading overlay, or null when inactive.
 */
const ElementLoading: FC<ElementLoadingProps> = ({
    loading,
    target,
    label,
    className = "",
    ref,
    style,
    ...rest
}: ElementLoadingProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedLabel: string = label ?? t("loading");
    const rect: AnchorRect | null = useAnchorRect(target, loading);

    if (!loading || rect === null || !rect.visible) {
        return null;
    }

    return (
        <Portal>
            <div
                {...rest}
                ref={ref}
                className={cx("element-loading", className)}
                style={{
                    ...style,
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                }}
                role="status"
                aria-label={resolvedLabel}
                aria-live="polite"
            >
                <Ring size={40} label={resolvedLabel} />
            </div>
        </Portal>
    );
};

export default ElementLoading;
