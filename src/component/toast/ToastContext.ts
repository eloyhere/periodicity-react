import { createContext, useContext, type Context } from "react";

/**
 * Semantic tone of a toast notification.
 * Type: type alias.
 * @example
 * const tone: ToastTone = "success";
 */
export type ToastTone = "neutral" | "success" | "danger" | "warning";

/**
 * Optional action rendered inside a toast.
 * Type: interface.
 * @param label - Visible action label.
 * @param onClick - Runs when the action is activated; the toast then dismisses.
 * @example
 * const action: ToastAction = { label: "Undo", onClick: undo };
 */
export interface ToastAction {
    label: string;
    onClick: () => void;
}

/**
 * Content and behaviour of one toast notification.
 * Type: interface.
 * @param title - Short summary announced by assistive technology.
 * @param description - Optional supporting sentence.
 * @param tone - Semantic tone; defaults to `neutral`.
 * @param duration - Lifetime in milliseconds; zero keeps the toast until dismissed.
 * @param action - Optional single action such as Undo.
 * @example
 * const options: ToastOptions = { title: "Task archived", action: { label: "Undo", onClick: undo } };
 */
export interface ToastOptions {
    title: string;
    description?: string;
    tone?: ToastTone;
    duration?: number;
    action?: ToastAction;
}

/**
 * Controller returned by `useToast`.
 * Type: interface.
 * @param show - Enqueues a toast and returns its identifier.
 * @param dismiss - Closes the identified toast, queued or visible.
 * @example
 * const { show, dismiss }: ToastApi = useToast();
 */
export interface ToastApi {
    show: (options: ToastOptions) => string;
    dismiss: (id: string) => void;
}

/**
 * Context carrying the toast controller to descendants.
 * @example
 * const api = useContext(ToastContext);
 */
export const ToastContext: Context<ToastApi | null> = createContext<ToastApi | null>(null);

/**
 * Reads the toast controller from the nearest provider.
 * @example
 * const toast = useToast();
 * const id = toast.show({ title: "Saved", tone: "success" });
 * @returns The show and dismiss functions.
 */
export const useToast: () => ToastApi = (): ToastApi => {
    const api: ToastApi | null = useContext(ToastContext);

    if (api === null) {
        throw new Error("useToast must be called inside a ToastProvider.");
    }

    return api;
};
