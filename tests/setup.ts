import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach((): void => {
    cleanup();
});

if (typeof HTMLDialogElement !== "undefined") {
    const prototype: HTMLDialogElement = HTMLDialogElement.prototype;

    if (typeof prototype.showModal !== "function") {
        prototype.showModal = function showModal(this: HTMLDialogElement): void {
            this.setAttribute("open", "");
        };
    }

    if (typeof prototype.close !== "function") {
        prototype.close = function close(this: HTMLDialogElement): void {
            this.removeAttribute("open");
        };
    }
}
