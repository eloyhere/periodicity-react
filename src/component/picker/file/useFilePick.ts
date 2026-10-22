import {
    useCallback,
    useEffect,
    useRef,
    type MutableRefObject,
    type RefObject,
} from "react";

/**
 * Accepted file types for a picker.
 * Type: type alias.
 * Values: an `accept` attribute string, or a list of MIME types and extensions joined with commas.
 * @example
 * const accept: FilePickAccept = ["image/png", ".jpg"];
 */
export type FilePickAccept = string | readonly string[];

/**
 * Presentation options for `useFilePick`.
 * Type: interface.
 * @param multiple - Whether the native dialog may return more than one file.
 * @param capture - Preferred camera when the device has one.
 * @param disabled - Forces an empty result instead of opening the native dialog.
 * @param inputRef - Native file input rendered by the caller; a temporary input is
 * created and cleaned up when the ref is omitted or empty.
 * @example
 * const options: UseFilePickOptions = { multiple: true, inputRef };
 */
export interface UseFilePickOptions {
    multiple?: boolean;
    capture?: "user" | "environment";
    disabled?: boolean;
    inputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Imperative file picker returned by the hook.
 * Type: type alias.
 * @example
 * const files: File[] = await pick();
 */
export type FilePick = () => Promise<File[]>;

/**
 * Normalises the accepted types into a native `accept` attribute.
 * @param accept - Accepted MIME types, extensions, or a ready-made attribute string.
 * @example
 * const accept = resolveFileAccept(["image/png", ".jpg"]);
 * @returns A comma-separated accept value, or the catch-all wildcard when nothing was supplied.
 */
export const resolveFileAccept: (accept?: FilePickAccept) => string = (
    accept?: FilePickAccept,
): string => (accept === (void 0) ? "*/*" : typeof accept === "string" ? accept : accept.join(","));

/**
 * Reports whether the browser exposes the DOM needed to open a file dialog.
 * @example
 * const ready = canPickFiles();
 * @returns Whether the native file dialog can be opened.
 */
const canPickFiles: () => boolean = (): boolean =>
    typeof document !== "undefined" && typeof window !== "undefined";

/**
 * Opens a native file input and resolves with the chosen files.
 * The hook drives the `input[type="file"]` supplied through `inputRef`, which is
 * what every picker renders; when the ref is absent or empty it creates, mounts,
 * and removes a temporary native input instead so the hook still works alone.
 * The dialog is opened inside the calling user gesture, so browsers allow it.
 * Cancelling the dialog resolves with an empty list; a newer `pick` call cancels
 * the previous unresolved promise. Unmounting the owning component also settles
 * a pending promise with an empty list, so callers never await forever.
 * @param accept - Accepted MIME types or extensions; defaults to every file type.
 * @param options - Multiple/capture preferences and the rendered native input.
 * @example
 * const inputRef = useRef<HTMLInputElement | null>(null);
 * const pick = useFilePick("image/*", { inputRef });
 * const files = await pick();
 * @returns A stable function resolving with the selected files.
 */
export const useFilePick: (accept?: FilePickAccept, options?: UseFilePickOptions) => FilePick = (
    accept?: FilePickAccept,
    options?: UseFilePickOptions,
): FilePick => {
    const multiple: boolean = options?.multiple ?? false;
    const capture: "user" | "environment" | void = options?.capture;
    const disabled: boolean = options?.disabled ?? false;
    const inputRef: RefObject<HTMLInputElement | null> | null = options?.inputRef ?? null;
    const acceptValue: string = resolveFileAccept(accept);
    const pendingRef: MutableRefObject<(() => void) | null> = useRef<(() => void) | null>(null);

    useEffect((): (() => void) => {
        return (): void => {
            pendingRef.current?.();
            pendingRef.current = null;
        };
    }, []);

    const pick: FilePick = useCallback((): Promise<File[]> => {
        if (disabled || !canPickFiles()) {
            return Promise.resolve<File[]>([]);
        }

        pendingRef.current?.();
        pendingRef.current = null;

        return new Promise<File[]>((resolve: (files: File[]) => void): void => {
            const provided: HTMLInputElement | null =
                inputRef === null ? null : inputRef.current;
            const owned: boolean = provided === null;
            const input: HTMLInputElement = provided ?? document.createElement("input");
            let settled: boolean = false;
            let focusTimer: number | null = null;
            let detach: () => void = (): void => {};

            const settlePending: () => void = (): void => {
                settle([]);
            };

            const settle: (files: File[]) => void = (files: File[]): void => {
                if (settled) {
                    return;
                }

                settled = true;
                detach();

                if (owned) {
                    input.remove();
                }

                if (pendingRef.current === settlePending) {
                    pendingRef.current = null;
                }

                resolve(files);
            };

            const handleChange: (event: Event) => void = (event: Event): void => {
                // The picker publishes its own bubbling `change` event with the
                // resolved files, so the raw input event must not escape twice.
                event.stopPropagation();
                settle(Array.from(input.files ?? []));
            };

            const handleCancel: (event: Event) => void = (event: Event): void => {
                event.stopPropagation();
                settle([]);
            };

            const handleInputClick: (event: Event) => void = (event: Event): void => {
                // Opening the dialog must not look like a second click on the
                // picker root; the visible trigger already owns that gesture.
                event.stopPropagation();
            };

            const handleWindowFocus: () => void = (): void => {
                // Older browsers do not emit `cancel`; the returning window focus
                // is the fallback signal. The timeout lets the pending `change`
                // event settle first.
                focusTimer = window.setTimeout((): void => {
                    focusTimer = null;

                    if (!settled && (input.files === null || input.files.length === 0)) {
                        settle([]);
                    }
                }, 0);
            };

            detach = (): void => {
                input.removeEventListener("click", handleInputClick);
                input.removeEventListener("change", handleChange);
                input.removeEventListener("cancel", handleCancel);
                window.removeEventListener("focus", handleWindowFocus);

                if (focusTimer !== null) {
                    window.clearTimeout(focusTimer);
                    focusTimer = null;
                }
            };

            input.accept = acceptValue;
            input.multiple = multiple;

            if (capture !== (void 0)) {
                input.capture = capture;
            }

            if (owned) {
                input.type = "file";
                input.tabIndex = -1;
                input.setAttribute("aria-hidden", "true");
                input.setAttribute("data-file-pick", "true");
                input.style.position = "fixed";
                input.style.top = "0";
                input.style.left = "0";
                input.style.width = "1px";
                input.style.height = "1px";
                input.style.opacity = "0";
                input.style.pointerEvents = "none";
            }

            const body: HTMLElement | null = document.body;

            if (owned && body === null) {
                settle([]);
                return;
            }

            input.addEventListener("click", handleInputClick);
            input.addEventListener("change", handleChange);
            input.addEventListener("cancel", handleCancel);
            window.addEventListener("focus", handleWindowFocus);
            pendingRef.current = settlePending;

            if (owned && body !== null) {
                body.appendChild(input);
            }

            // Clearing the value first lets the user choose the same file twice
            // and still receive a native change event.
            input.value = "";
            input.click();
        });
    }, [acceptValue, multiple, capture, disabled, inputRef]);

    return pick;
};

export default useFilePick;
