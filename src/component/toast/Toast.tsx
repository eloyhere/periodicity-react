import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type FC,
    type MutableRefObject,
    type ReactNode,
    type SetStateAction,
} from "react";
import Button from "../button/Button";
import Portal from "../foundation/Portal";
import Icon, { type IconName } from "../icon/Icon";
import Surface from "../surface/Surface";
import Text from "../text/Text";
import {
    ToastContext,
    type ToastAction,
    type ToastApi,
    type ToastOptions,
    type ToastTone,
} from "./ToastContext";
import "./Toast.css";

/**
 * Props for the toast queue provider.
 * Type: interface.
 * @param children - Application subtree that can call `useToast`.
 * @param max - Maximum simultaneously visible toasts; defaults to three.
 * @param duration - Default lifetime in milliseconds; defaults to 4000.
 * @example
 * <ToastProvider max={3} duration={4000}><App /></ToastProvider>
 */
export interface ToastProviderProps {
    children: ReactNode;
    max?: number;
    duration?: number;
}

/**
 * One toast held by the provider.
 * Type: interface.
 * @param id - Stable identifier returned by `show`.
 * @param options - Content and behaviour supplied by the caller.
 * @param duration - Resolved lifetime in milliseconds.
 * @param leaving - Whether the exit animation is running.
 * @example
 * const record: ToastRecord = { id: "1", options: { title: "Saved" }, duration: 4000, leaving: false };
 */
interface ToastRecord {
    readonly id: string;
    readonly options: ToastOptions;
    readonly duration: number;
    readonly leaving: boolean;
}

/**
 * Visible and pending toast lists.
 * Type: interface.
 * @param active - Toasts currently rendered.
 * @param queued - Toasts waiting for a free slot.
 * @example
 * const state: ToastQueueState = { active: [], queued: [] };
 */
interface ToastQueueState {
    readonly active: readonly ToastRecord[];
    readonly queued: readonly ToastRecord[];
}

/**
 * Props for one rendered toast.
 * Type: interface.
 * @param toast - Record with content, tone, duration, and leaving state.
 * @param onDismiss - Requests dismissal by identifier.
 * @example
 * <ToastItem toast={record} onDismiss={dismiss} />
 */
interface ToastItemProps {
    toast: ToastRecord;
    onDismiss: (id: string) => void;
}

const ToastExitDelay: number = 220;

const ToastToneIcons: Record<ToastTone, IconName> = {
    neutral: "Info",
    success: "Success",
    danger: "Error",
    warning: "Warning",
};

/**
 * Renders a toast row with a tone icon, optional action, and accessible close button.
 * @param props - Toast record and dismissal callback.
 * @example
 * <ToastItem toast={record} onDismiss={dismiss} />
 * @returns A status-role toast slot.
 */
const ToastItem: FC<ToastItemProps> = ({ toast, onDismiss }: ToastItemProps) => {
    const tone: ToastTone = toast.options.tone ?? "neutral";
    const action: ToastAction | void = toast.options.action;

    useEffect((): (() => void) | void => {
        if (toast.leaving || toast.duration <= 0) {
            return;
        }

        const timer: number = window.setTimeout((): void => {
            onDismiss(toast.id);
        }, toast.duration);

        return (): void => {
            window.clearTimeout(timer);
        };
    }, [onDismiss, toast.duration, toast.id, toast.leaving]);

    const handleDismiss: () => void = (): void => {
        onDismiss(toast.id);
    };

    const handleAction: () => void = (): void => {
        action?.onClick();
        onDismiss(toast.id);
    };

    return (
        <div
            className="toast"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-tone={tone}
            data-state={toast.leaving ? "leaving" : "visible"}
        >
            <Surface
                className="toast__surface"
                elevation={2}
                shape="md"
                foreground={<span className="toast__stripe" />}
            >
                <div className="toast__row">
                    <span className="toast__icon" aria-hidden="true">
                        <Icon name={ToastToneIcons[tone]} size={16} />
                    </span>
                    <div className="toast__content">
                        <Text as="p" variant="body-sm" className="toast__title">
                            {toast.options.title}
                        </Text>
                        {toast.options.description === (void 0) ||
                        toast.options.description.length === 0 ? null : (
                            <Text as="p" variant="body-sm" tone="soft" className="toast__description">
                                {toast.options.description}
                            </Text>
                        )}
                    </div>
                    <div className="toast__actions">
                        {action === (void 0) ? null : (
                            <Button
                                className="toast__action"
                                variant="quiet"
                                size="sm"
                                onClick={handleAction}
                            >
                                {action.label}
                            </Button>
                        )}
                        <Button
                            className="toast__close"
                            variant="quiet"
                            size="sm"
                            icon="Close"
                            aria-label="Dismiss notification"
                            onClick={handleDismiss}
                        />
                    </div>
                </div>
            </Surface>
        </div>
    );
};

/**
 * Owns the toast queue, timers, live region, and portal rendering.
 * @param props - Children plus optional queue size and default duration.
 * @example
 * <ToastProvider>
 *     <App />
 * </ToastProvider>
 * @returns A context provider with a fixed toast region.
 */
const ToastProvider: FC<ToastProviderProps> = ({
    children,
    max = 3,
    duration = 4000,
}: ToastProviderProps) => {
    const [queue, setQueue]: [ToastQueueState, Dispatch<SetStateAction<ToastQueueState>>] =
        useState<ToastQueueState>({ active: [], queued: [] });
    const timersRef: MutableRefObject<Record<string, number>> = useRef<Record<string, number>>({});
    const capacity: number = max > 0 ? max : 1;

    const remove: (id: string) => void = useCallback((id: string): void => {
        delete timersRef.current[id];
        setQueue((current: ToastQueueState): ToastQueueState => {
            const active: readonly ToastRecord[] = current.active.filter(
                (toast: ToastRecord): boolean => toast.id !== id,
            );

            if (active.length === current.active.length) {
                return current;
            }

            const promoted: ToastRecord | void = current.queued[0];

            if (promoted === (void 0)) {
                return { active, queued: current.queued };
            }

            return {
                active: [...active, { ...promoted, leaving: false }],
                queued: current.queued.slice(1),
            };
        });
    }, []);

    const requestDismiss: (id: string) => void = useCallback(
        (id: string): void => {
            setQueue((current: ToastQueueState): ToastQueueState => {
                const visible: ToastRecord | void = current.active.find(
                    (toast: ToastRecord): boolean => toast.id === id,
                );

                if (visible !== (void 0)) {
                    if (visible.leaving) {
                        return current;
                    }

                    return {
                        active: current.active.map(
                            (toast: ToastRecord): ToastRecord =>
                                toast.id === id ? { ...toast, leaving: true } : toast,
                        ),
                        queued: current.queued,
                    };
                }

                const pending: ToastRecord | void = current.queued.find(
                    (toast: ToastRecord): boolean => toast.id === id,
                );

                if (pending === (void 0)) {
                    return current;
                }

                return {
                    active: current.active,
                    queued: current.queued.filter(
                        (toast: ToastRecord): boolean => toast.id !== id,
                    ),
                };
            });

            if (timersRef.current[id] === (void 0)) {
                timersRef.current[id] = window.setTimeout((): void => {
                    remove(id);
                }, ToastExitDelay);
            }
        },
        [remove],
    );

    const show: (options: ToastOptions) => string = useCallback(
        (options: ToastOptions): string => {
            const id: string = crypto.randomUUID();
            const record: ToastRecord = {
                id,
                options,
                duration: options.duration ?? duration,
                leaving: false,
            };

            setQueue((current: ToastQueueState): ToastQueueState =>
                current.active.length < capacity
                    ? { active: [...current.active, record], queued: current.queued }
                    : { active: current.active, queued: [...current.queued, record] },
            );

            return id;
        },
        [capacity, duration],
    );

    useEffect((): (() => void) => (): void => {
        const timers: Record<string, number> = timersRef.current;

        Object.keys(timers).forEach((id: string): void => {
            window.clearTimeout(timers[id]);
        });
    }, []);

    const api: ToastApi = useMemo<ToastApi>(
        () => ({ show, dismiss: requestDismiss }),
        [requestDismiss, show],
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            {queue.active.length === 0 ? null : (
                <Portal>
                    <div className="toast-region" role="region" aria-label="Notifications">
                        {queue.active.map(
                            (toast: ToastRecord): ReactNode => (
                                <ToastItem key={toast.id} toast={toast} onDismiss={requestDismiss} />
                            ),
                        )}
                    </div>
                </Portal>
            )}
        </ToastContext.Provider>
    );
};

export default ToastProvider;
