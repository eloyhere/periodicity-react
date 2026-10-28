/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Terminal from "../src/component/terminal/Terminal";
import { demoAnchor } from "../src/showcase/anchors";
import { topLevelComponents } from "../src/showcase/componentCatalogue";
import DocumentsPage from "../src/showcase/pages/components/DocumentsPage";

describe("Terminal", (): void => {
    it("renders one row per line with its prompt, tone, and annotation", (): void => {
        const { container } = render(
            <Terminal
                title="build"
                lines={[
                    { text: "npm run build", prompt: "$" },
                    { text: "built in 1.42s", tone: "success", meta: "1.42s" },
                ]}
            />,
        );
        const rows: NodeListOf<Element> = container.querySelectorAll(
            ".terminal__line:not(.terminal__line--command)",
        );

        expect(rows).toHaveLength(2);
        expect(rows[1].getAttribute("data-tone")).toBe("success");
        expect(container.querySelector(".terminal__prompt")?.textContent).toBe("$");
        expect(container.querySelector(".terminal__meta")?.textContent).toBe("1.42s");
        expect(container.querySelector(".terminal__title")?.textContent).toBe("build");
    });

    it("accepts plain strings and paints the live row only while busy", (): void => {
        const { container, rerender } = render(
            <Terminal lines={["first", "second"]} prompt="~" busy />,
        );

        expect(container.querySelectorAll(".terminal__text")).toHaveLength(2);
        expect(container.querySelector(".terminal__cursor")).not.toBeNull();
        expect(screen.getByText("~").className).toBe("terminal__prompt");

        rerender(<Terminal lines={["first", "second"]} />);

        expect(container.querySelector(".terminal__cursor")).toBeNull();
    });

    it("merges the class name, forwards the root ref, and caps the viewport", (): void => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(
            <Terminal ref={ref} className="custom" wrap maxHeight={240} lines={["one"]} />,
        );
        const root: HTMLDivElement = container.querySelector(".terminal") as HTMLDivElement;
        const viewport: HTMLElement = container.querySelector(".terminal__viewport") as HTMLElement;

        expect(ref.current).toBe(root);
        expect(root.classList.contains("custom")).toBe(true);
        expect(root.classList.contains("terminal--wrap")).toBe(true);
        expect(root.style.getPropertyValue("--terminal-max-height")).toBe("240px");
        expect(viewport.tabIndex).toBe(0);
    });

    it("exposes the transcript as a labelled log region", (): void => {
        const { container, rerender } = render(<Terminal title="deploy" lines={["one"]} />);
        const log: HTMLElement = container.querySelector(".terminal__viewport") as HTMLElement;

        expect(log.getAttribute("role")).toBe("log");
        expect(log.getAttribute("aria-live")).toBe("off");
        expect(log.getAttribute("aria-label")).toBe("deploy");
        expect(log.getAttribute("tabindex")).toBeNull();

        rerender(<Terminal lines={["one"]} live maxHeight="40vh" />);

        expect(log.getAttribute("aria-live")).toBe("polite");
        expect(log.getAttribute("aria-label")).toBeNull();
        expect(log.getAttribute("tabindex")).toBe("0");
    });

    it("keeps the newest line in view unless autoScroll is off", (): void => {
        const first = render(<Terminal lines={["one"]} maxHeight={120} />);
        const viewport: HTMLElement = first.container.querySelector(
            ".terminal__viewport",
        ) as HTMLElement;
        let offset = 0;

        Object.defineProperty(viewport, "scrollTop", {
            configurable: true,
            get: (): number => offset,
            set: (value: number): void => {
                offset = value;
            },
        });
        Object.defineProperty(viewport, "scrollHeight", {
            configurable: true,
            get: (): number => 480,
        });

        first.rerender(<Terminal lines={["one", "two"]} maxHeight={120} />);

        expect(offset).toBe(480);

        const pinned = render(<Terminal lines={["one"]} maxHeight={120} autoScroll={false} />);
        const pinnedViewport: HTMLElement = pinned.container.querySelector(
            ".terminal__viewport",
        ) as HTMLElement;
        let pinnedOffset = 0;

        Object.defineProperty(pinnedViewport, "scrollTop", {
            configurable: true,
            get: (): number => pinnedOffset,
            set: (value: number): void => {
                pinnedOffset = value;
            },
        });
        Object.defineProperty(pinnedViewport, "scrollHeight", {
            configurable: true,
            get: (): number => 480,
        });

        pinned.rerender(<Terminal lines={["one", "two"]} maxHeight={120} autoScroll={false} />);

        expect(pinnedOffset).toBe(0);
    });

    it("reports command input and non-empty submissions", (): void => {
        const onInput = vi.fn();
        const onChange = vi.fn();
        render(<Terminal title="shell" lines={["ready"]} onInput={onInput} onChange={onChange} />);
        const input: HTMLInputElement = screen.getByRole("textbox", {
            name: "shell command",
        }) as HTMLInputElement;

        fireEvent.change(input, { target: { value: "echo hello" } });

        expect(onInput).toHaveBeenLastCalledWith("echo hello");
        expect(input.value).toBe("echo hello");

        fireEvent.keyDown(input, { key: "Enter" });

        expect(onChange).toHaveBeenCalledWith("echo hello");
        expect(input.value).toBe("");

        fireEvent.keyDown(input, { key: "Enter" });

        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("submits through the icon-only send button", (): void => {
        const onChange = vi.fn();
        render(<Terminal onChange={onChange} />);
        const input: HTMLInputElement = screen.getByRole("textbox") as HTMLInputElement;
        const send: HTMLButtonElement = screen.getByRole("button", {
            name: "Send command",
        }) as HTMLButtonElement;

        expect(send.disabled).toBe(true);

        fireEvent.change(input, { target: { value: "pwd" } });

        expect(send.disabled).toBe(false);

        fireEvent.click(send);

        expect(onChange).toHaveBeenCalledWith("pwd");
        expect(input.value).toBe("");
    });

    it("binds submitted commands and recalls them with the arrow keys", (): void => {
        const onHistoryChange = vi.fn();
        render(<Terminal onHistoryChange={onHistoryChange} />);
        const input: HTMLInputElement = screen.getByRole("textbox") as HTMLInputElement;

        fireEvent.change(input, { target: { value: "pwd" } });
        fireEvent.keyDown(input, { key: "Enter" });
        fireEvent.change(input, { target: { value: "ls" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onHistoryChange).toHaveBeenNthCalledWith(1, ["pwd"]);
        expect(onHistoryChange).toHaveBeenNthCalledWith(2, ["pwd", "ls"]);

        fireEvent.keyDown(input, { key: "ArrowUp" });
        expect(input.value).toBe("ls");

        fireEvent.keyDown(input, { key: "ArrowUp" });
        expect(input.value).toBe("pwd");

        fireEvent.keyDown(input, { key: "ArrowDown" });
        expect(input.value).toBe("ls");

        fireEvent.keyDown(input, { key: "ArrowDown" });
        expect(input.value).toBe("");
    });

    it("navigates controlled history and reports the next history", (): void => {
        const onHistoryChange = vi.fn();
        render(
            <Terminal
                history={["build", "test"]}
                onHistoryChange={onHistoryChange}
                onChange={vi.fn()}
            />,
        );
        const input: HTMLInputElement = screen.getByRole("textbox") as HTMLInputElement;

        fireEvent.keyDown(input, { key: "ArrowUp" });
        expect(input.value).toBe("test");

        fireEvent.keyDown(input, { key: "ArrowUp" });
        expect(input.value).toBe("build");

        fireEvent.change(input, { target: { value: "deploy" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onHistoryChange).toHaveBeenCalledWith(["build", "test", "deploy"]);
    });

    it("keeps a controlled command until the caller updates it", (): void => {
        const onInput = vi.fn();
        const { rerender } = render(<Terminal value="ec" onInput={onInput} />);
        const input: HTMLInputElement = screen.getByRole("textbox") as HTMLInputElement;

        fireEvent.change(input, { target: { value: "echo" } });

        expect(onInput).toHaveBeenCalledWith("echo");
        expect(input.value).toBe("ec");

        rerender(<Terminal value="echo" onInput={onInput} />);

        expect(input.value).toBe("echo");
    });

    it("hides the command input while a command is running", (): void => {
        const { container } = render(<Terminal onChange={vi.fn()} busy />);

        expect(screen.queryByRole("textbox")).toBeNull();
        expect(container.querySelector(".terminal__cursor")).not.toBeNull();
    });

    it("is documented by the documents family entry", (): void => {
        const entry = topLevelComponents.find(
            (component: { id: string }): boolean => component.id === "terminal",
        );

        expect(entry?.family).toBe("documents");
        expect(demoAnchor(entry?.demo ?? "")).toBe("demo-terminal-output");

        const { container } = render(<DocumentsPage />);

        expect(container.querySelector("#demo-terminal-output")).not.toBeNull();
    });
});
