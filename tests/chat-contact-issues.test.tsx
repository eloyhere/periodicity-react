/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Avatar from "../src/component/thumb/Avatar";
import { International } from "../src/international";
import Chat from "../src/layout/chat/normal/Chat";
import Contact from "../src/layout/contact/normal/Contact";

const contacts = [
    {
        id: "lin",
        name: "林晚",
        description: "历法研究 · 节气组",
        presence: "online" as const,
    },
];

describe("chat and contact regressions", (): void => {
    it("uses one character for single-token CJK names", (): void => {
        const { container, rerender } = render(<Avatar name="林晚" />);

        expect(container.querySelector(".avatar__initials")?.textContent).toBe("林");

        rerender(<Avatar name="Mira Chen" />);
        expect(container.querySelector(".avatar__initials")?.textContent).toBe("MC");
    });

    it("localizes the contact presence label", (): void => {
        const { container } = render(
            <International locale="zh-CN">
                <Contact contacts={contacts} />
            </International>,
        );

        expect(container.querySelector(".contact__presence")?.getAttribute("aria-label")).toBe(
            "在线",
        );
    });

    it("localizes the chat header presence label", (): void => {
        const { container } = render(
            <International locale="zh-CN">
                <Chat contacts={contacts} messages={[]} currentUser="我" />
            </International>,
        );

        expect(container.querySelector(".chat__presence")?.textContent).toBe("在线");
    });
});
