import { createRoot } from "react-dom/client";
import type { ReactNode, RefObject } from "react";
import type { Root } from "react-dom/client";
import ElementLoading from "./ElementLoading";
import FullscreenLoading from "./FullscreenLoading";

/**
 * Handle returned by {@link useLoad}.
 * Type: interface.
 * Fields: close, closed.
 * @example
 * const load = await useLoad(3000);
 * load.close();
 */
export interface Load {
    close: () => void;
    readonly closed: Promise<void>;
}

/**
 * Element or ref that receives a local loading overlay.
 * Type: type alias.
 * Fields: none.
 * @example
 * const target: LoadReference = panelRef;
 */
export type LoadReference = HTMLElement | RefObject<HTMLElement | null>;

interface Host {
    host: HTMLDivElement;
    close: () => void;
    closed: Promise<void>;
}

/**
 * Creates a detached React host for an imperative loading surface.
 * @param render - Render callback that receives the close function.
 * @example
 * const host = createHost((close) => <ElementLoading ... />);
 * @returns Host element, close function, and completion promise.
 */
const createHost: (render: (close: () => void) => ReactNode) => Host = (
    render: (close: () => void) => ReactNode,
): Host => {
    const host: HTMLDivElement = document.createElement("div");
    host.setAttribute("data-loading-host", "");
    document.body.append(host);
    const root: Root = createRoot(host);
    let settled: boolean = false;
    let resolve: () => void = (): void => {};
    const closed: Promise<void> = new Promise<void>((next: () => void): void => {
        resolve = next;
    });
    const close: () => void = (): void => {
        if (settled) {
            return;
        }

        settled = true;
        root.unmount();
        host.remove();
        resolve();
    };

    root.render(render(close));

    return { host, close, closed };
};

/**
 * Shows a loading overlay and returns a handle immediately.
 *
 * Overloads:
 * - `useLoad(reference, delay)` binds the overlay to an element.
 * - `useLoad(delay)` covers the viewport.
 * - `useLoad(promise)` keeps the viewport overlay until the promise settles.
 * @param first - Element/ref, delay in milliseconds, or promise to await.
 * @param delay - Duration for the element overload.
 * @example
 * const local = await useLoad(panelRef, 1200);
 * await useLoad(3000);
 * await useLoad(saveChanges());
 * @returns A promise resolving to a close handle.
 */
export function useLoad<T>(promise: Promise<T>): Promise<Load>;
export function useLoad(target: LoadReference, delay: number): Promise<Load>;
export function useLoad(delay: number): Promise<Load>;
export function useLoad<T>(
    first: LoadReference | number | Promise<T>,
    delay?: number,
): Promise<Load> {
    if (typeof document === "undefined") {
        return Promise.resolve({
            close: (): void => {},
            closed: Promise.resolve(),
        });
    }

    if (typeof first === "number") {
        const host: Host = createHost(
            (close: () => void): ReactNode => (
                <FullscreenLoading
                    open
                    duration={first}
                    onClose={close}
                />
            ),
        );

        return Promise.resolve({ close: host.close, closed: host.closed });
    }

    if (first instanceof Promise) {
        const host: Host = createHost(
            (close: () => void): ReactNode => (
                <FullscreenLoading open onClose={close} />
            ),
        );

        void first.then(host.close, host.close);

        return Promise.resolve({ close: host.close, closed: host.closed });
    }

    const target: LoadReference = first;
    const wait: number = Math.max(0, delay ?? 3000);
    const targetRef: RefObject<HTMLElement | null> =
        target instanceof HTMLElement ? { current: target } : target;
    const host: Host = createHost(
        (): ReactNode => <ElementLoading loading target={targetRef} />,
    );
    const timer: number = window.setTimeout(host.close, wait);

    return Promise.resolve({
        close: (): void => {
            window.clearTimeout(timer);
            host.close();
        },
        closed: host.closed,
    });
}

export default useLoad;
