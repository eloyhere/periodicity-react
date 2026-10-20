import { useEffect, useRef, type FC, type RefObject, type SyntheticEvent } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import CircularProgress from "../progress/CircularProgress";
import Portal from "../foundation/Portal";
import Text from "../text/Text";
import "./FullscreenLoading.css";

/**
 * Props for the native-dialog fullscreen loader.
 * Type: interface.
 * Fields: open, label, description, className.
 * @example
 * <FullscreenLoading open={saving} label="Saving" />
 */
export interface FullscreenLoadingProps {
    open: boolean;
    label?: string;
    description?: string;
    duration?: number;
    onClose?: () => void;
    className?: string;
}

/**
 * Options for the promise-based fullscreen loader.
 * Type: interface.
 * Fields: label, description, duration, className.
 * @example
 * await showFullscreenLoading({ label: "Preparing workspace", duration: 3000 });
 */
export interface FullscreenLoadingOptions {
    label?: string;
    description?: string;
    duration?: number;
    className?: string;
}

/**
 * Fullscreen loading layer built on the native dialog top layer.
 * @param props - Open state and optional copy.
 * @example
 * <FullscreenLoading open={busy} label="Preparing workspace" />
 * @returns A native dialog loader.
 */
const FullscreenLoading: FC<FullscreenLoadingProps> = ({
    open,
    label = "Loading",
    description,
    duration,
    onClose,
    className = "",
}: FullscreenLoadingProps) => {
    const dialogRef: RefObject<HTMLDialogElement | null> = useRef<HTMLDialogElement | null>(null);

    useEffect((): void => {
        const dialog: HTMLDialogElement | null = dialogRef.current;

        if (dialog === null) {
            return;
        }

        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    useEffect((): (() => void) | void => {
        if (!open || duration === (void 0)) {
            return;
        }

        const timer: number = window.setTimeout((): void => {
            onClose?.();
        }, Math.max(0, duration));

        return (): void => {
            window.clearTimeout(timer);
        };
    }, [open, duration, onClose]);

    return (
        <Portal>
            <dialog
                ref={dialogRef}
                className={`fullscreen-loading ${className}`.trim()}
                aria-label={label}
                aria-busy="true"
                role="status"
                onCancel={(event: SyntheticEvent<HTMLDialogElement>): void =>
                    event.preventDefault()
                }
            >
                <div className="fullscreen-loading__content">
                    <CircularProgress size={56} label={label} />
                    <Text as="p" variant="h4">
                        {label}
                    </Text>
                    {description === (void 0) ? null : (
                        <Text as="p" variant="body-sm" tone="muted">
                            {description}
                        </Text>
                    )}
                </div>
            </dialog>
        </Portal>
    );
};

let activeClose: (() => void) | null = null;

/**
 * Opens a transient fullscreen loader and resolves when it closes.
 * @param options - Copy, duration, and optional class.
 * @example
 * await showFullscreenLoading({ label: "Preparing workspace", duration: 3000 });
 * @returns A promise resolved after the loader closes.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const showFullscreenLoading: (
    options?: FullscreenLoadingOptions,
) => Promise<void> = (
    options: FullscreenLoadingOptions = {},
): Promise<void> => {
    if (typeof document === "undefined") {
        return Promise.resolve();
    }

    activeClose?.();

    const host: HTMLDivElement = document.createElement("div");
    host.setAttribute("data-fullscreen-loading", "");
    document.body.append(host);
    const root: Root = createRoot(host);

    return new Promise<void>((resolve: () => void): void => {
        let settled: boolean = false;
        const close: () => void = (): void => {
            if (settled) {
                return;
            }

            settled = true;
            activeClose = null;
            root.unmount();
            host.remove();
            resolve();
        };

        activeClose = close;
        root.render(
            <FullscreenLoading
                open
                label={options.label ?? "Loading"}
                description={options.description}
                duration={options.duration ?? 3000}
                className={options.className}
                onClose={close}
            />,
        );
    });
};

/**
 * FullscreenLoading with the promise service attached as `show`.
 * @example
 * await FullscreenLoading.show({ duration: 3000 });
 */
const FullscreenLoadingService: typeof FullscreenLoading & {
    show: typeof showFullscreenLoading;
} = Object.assign(FullscreenLoading, { show: showFullscreenLoading });

export default FullscreenLoadingService;
