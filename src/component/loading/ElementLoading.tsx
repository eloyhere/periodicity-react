import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type FC,
    type RefObject,
} from "react";
import Portal from "../foundation/Portal";
import CircularProgress from "../progress/CircularProgress";
import "./ElementLoading.css";

/**
 * Rectangle measured from the bound element.
 * Type: interface.
 * Fields: top, left, width, height.
 * @example
 * const rect: LoadingRect = { top: 0, left: 0, width: 320, height: 180 };
 */
interface LoadingRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

/**
 * Props for an element-bound loading overlay.
 * Type: interface.
 * Fields: loading, target, label, className.
 * @example
 * <ElementLoading loading={saving} target={panelRef} />
 */
export interface ElementLoadingProps {
    loading: boolean;
    target: RefObject<HTMLElement | null> | string;
    label?: string;
    className?: string;
}

/**
 * Mounts an overlay and spinner directly on top of a referenced element.
 * @param props - Loading state and target element.
 * @example
 * <ElementLoading loading={loading} target={panelRef} label="Saving" />
 * @returns A portalled loading overlay, or null when inactive.
 */
const ElementLoading: FC<ElementLoadingProps> = ({
    loading,
    target,
    label = "Loading",
    className = "",
}: ElementLoadingProps) => {
    const [rect, setRect]: [LoadingRect | null, (next: LoadingRect | null) => void] =
        useState<LoadingRect | null>(null);
    const frameRef: RefObject<number | null> = useRef<number | null>(null);

    useLayoutEffect((): (() => void) | void => {
        if (!loading) {
            return;
        }

        const resolveTarget: () => HTMLElement | null = (): HTMLElement | null =>
            typeof target === "string"
                ? document.querySelector<HTMLElement>(target)
                : target.current;

        const measure: () => void = (): void => {
            const node: HTMLElement | null = resolveTarget();

            if (node === null) {
                return;
            }

            const bounds: DOMRect = node.getBoundingClientRect();
            setRect({
                top: bounds.top,
                left: bounds.left,
                width: bounds.width,
                height: bounds.height,
            });
        };

        measure();
        frameRef.current = window.requestAnimationFrame(measure);

        const observer: ResizeObserver | null =
            typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
        const node: HTMLElement | null = resolveTarget();

        if (node !== null) {
            observer?.observe(node);
        }

        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);

        return (): void => {
            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current);
            }

            observer?.disconnect();
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
        };
    }, [loading, target]);

    useEffect(
        (): (() => void) => (): void => {
            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current);
            }
        },
        [],
    );

    if (!loading || rect === null) {
        return null;
    }

    return (
        <Portal>
            <div
                className={`element-loading ${className}`.trim()}
                style={{
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                }}
                role="status"
                aria-label={label}
                aria-live="polite"
            >
                <CircularProgress size={40} label={label} />
            </div>
        </Portal>
    );
};

export default ElementLoading;
