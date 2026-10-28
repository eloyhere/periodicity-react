import {
    useEffect,
    useRef,
    type AriaRole,
    type DialogHTMLAttributes,
    type FC,
    type ReactEventHandler,
    type Ref,
    type RefCallback,
    type RefObject,
    type SyntheticEvent,
} from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { useInternational, type InternationalContextValue } from "../../international";
import cx from "../foundation/cx";
import useControllableState from "../foundation/useControllableState";
import useMergedRef from "../foundation/useMergedRef";
import Ring from "../ring/Ring";
import Portal from "../foundation/Portal";
import Text from "../text/Text";
import "./FullscreenLoading.css";

/**
 * Why the fullscreen loader asked to close.
 * Type: type alias.
 * Fields: none.
 * @example
 * const reason: FullscreenLoadingCloseReason = "duration";
 */
export type FullscreenLoadingCloseReason = "duration" | "escape";

/**
 * Props for the native-dialog fullscreen loader.
 * Type: interface.
 * Fields: open, defaultOpen, onOpenChange, label, description, duration, onClose, closeOnEscape,
 * className, role, ref, plus native dialog attributes.
 * @example
 * <FullscreenLoading open={saving} label="Saving" />
 */
export interface FullscreenLoadingProps
    extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "open" | "onClose"> {
    /** Controlled open state; omit to let the loader manage its own state. */
    open?: boolean;
    /** Initial open state when uncontrolled; defaults to `false`. */
    defaultOpen?: boolean;
    /** Called with the requested open state whenever the loader opens or closes. */
    onOpenChange?: (open: boolean) => void;
    label?: string;
    description?: string;
    duration?: number;
    /** Called with the reason whenever the loader asks to close. */
    onClose?: (reason: FullscreenLoadingCloseReason) => void;
    /** Whether Escape asks the loader to close; defaults to `false`. */
    closeOnEscape?: boolean;
    className?: string;
    role?: AriaRole;
    /** Ref for the native dialog element. */
    ref?: Ref<HTMLDialogElement>;
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
 * Native dialog attributes and handlers are forwarded to the underlying dialog.
 * @param props - Open state, copy, duration, and native dialog attributes.
 * @example
 * <FullscreenLoading open={busy} label="Preparing workspace" />
 * @returns A native dialog loader.
 */
const FullscreenLoading: FC<FullscreenLoadingProps> = ({
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    label,
    description,
    duration,
    onClose,
    closeOnEscape = false,
    className = "",
    role = "status",
    ref,
    onCancel,
    "aria-label": ariaLabel,
    ...rest
}: FullscreenLoadingProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedLabel: string = label ?? t("loading");
    const dialogRef: RefObject<HTMLDialogElement | null> = useRef<HTMLDialogElement | null>(null);
    const [open, setOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: openProp,
        defaultValue: defaultOpen,
        onChange: onOpenChange,
    });
    const mergedRef: RefCallback<HTMLDialogElement> = useMergedRef<HTMLDialogElement>(dialogRef, ref);

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
            setOpen(false);
            onClose?.("duration");
        }, Math.max(0, duration));

        return (): void => {
            window.clearTimeout(timer);
        };
    }, [duration, onClose, open, setOpen]);

    const handleCancel: ReactEventHandler<HTMLDialogElement> = (
        event: SyntheticEvent<HTMLDialogElement>,
    ): void => {
        event.preventDefault();

        if (closeOnEscape) {
            setOpen(false);
            onClose?.("escape");
        }

        onCancel?.(event);
    };

    return (
        <Portal>
            <dialog
                {...rest}
                ref={mergedRef}
                className={cx("fullscreen-loading", className)}
                aria-label={ariaLabel ?? resolvedLabel}
                aria-busy="true"
                role={role}
                onCancel={handleCancel}
            >
                <div className="fullscreen-loading__content">
                    <Ring size={56} label={resolvedLabel} />
                    <Text as="p" variant="h4">
                        {resolvedLabel}
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
                label={options.label}
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
