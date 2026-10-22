/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    AgentChat,
    VirtualAgentChat,
    type AgentMessageItem,
    type AgentProfile,
    type AgentSession,
} from "../src/layout/AgentChat";
import { International } from "../src/international";

const agent: AgentProfile = {
    name: "Periodicity Agent",
    model: "DeepSeek V3",
    presence: "online",
};

const sessions: AgentSession[] = [
    {
        id: "s1",
        title: "Cycle brief",
        preview: "Turn the notes into a brief",
        timestamp: "Today",
        unread: 2,
    },
    {
        id: "s2",
        title: "Release checklist",
        preview: "Draft the rollout steps",
        timestamp: "Yesterday",
    },
];

const messages: AgentMessageItem[] = [
    {
        id: "m1",
        sessionId: "s1",
        author: "You",
        content: "Turn the notes into a short brief.",
        timestamp: "09:40",
        self: true,
        role: "user",
        status: "read",
    },
    {
        id: "m2",
        sessionId: "s1",
        author: "Periodicity Agent",
        content: "## Brief\n\nThe **weekly rhythm** should be obvious.",
        timestamp: "09:41",
        thinking: "The user wants a short, decision-ready brief.",
        thinkingDuration: "6s",
    },
    {
        id: "m3",
        sessionId: "s2",
        author: "Periodicity Agent",
        content: "Release **checklist** for 0.2.",
        timestamp: "Yesterday",
    },
];

afterEach((): void => {
    vi.useRealTimers();
});

describe("agent chat", (): void => {
    it("renders the agent header, history sessions, markdown answers, and reasoning view", (): void => {
        const { container } = render(
            <AgentChat
                agent={agent}
                sessions={sessions}
                messages={messages}
                currentUser="You"
            />,
        );

        expect(screen.getByRole("heading", { name: "History" })).not.toBeNull();
        expect(container.querySelector(".agent-chat__name")?.textContent).toBe(
            "Periodicity Agent",
        );
        expect(screen.getAllByText("Cycle brief").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Release checklist").length).toBeGreaterThan(0);

        const markdown: Element | null = container.querySelector(".agent-chat__markdown");
        const thinking: Element | null = container.querySelector(".agent-chat__thinking");

        expect(markdown?.querySelector("h2")?.textContent).toBe("Brief");
        expect(markdown?.closest(".message__bubble")).not.toBeNull();
        expect(thinking?.closest(".message__bubble")).toBeNull();
        expect(thinking?.closest(".message__body")).not.toBeNull();
        expect(thinking?.textContent).toContain("decision-ready");

        const toggle: HTMLElement = screen.getByRole("button", { name: /Thinking/ });
        const panel: HTMLElement | null = container.querySelector(".agent-chat__thinking-panel");

        expect(toggle.getAttribute("aria-expanded")).toBe("false");
        expect(panel?.getAttribute("aria-hidden")).toBe("true");

        fireEvent.click(toggle);

        expect(toggle.getAttribute("aria-expanded")).toBe("true");
        expect(panel?.getAttribute("aria-hidden")).toBeNull();
        expect(
            toggle.closest(".agent-chat__thinking")?.classList.contains(
                "agent-chat__thinking--open",
            ),
        ).toBe(true);
        expect(container.querySelector(".agent-chat")).not.toBeNull();
    });

    it("switches the transcript when a history session is selected", (): void => {
        const { container } = render(
            <AgentChat
                agent={agent}
                sessions={sessions}
                messages={messages}
                currentUser="You"
            />,
        );

        expect(container.textContent).toContain("The weekly rhythm should be obvious.");

        fireEvent.click(screen.getAllByText("Release checklist")[0]);

        expect(container.textContent).toContain("Release checklist for 0.2.");
        expect(container.textContent).not.toContain("The weekly rhythm should be obvious.");
    });

    it("types a streaming answer and shows the streaming caret", async (): Promise<void> => {
        const streaming: AgentMessageItem = {
            id: "stream",
            sessionId: "s1",
            author: "Periodicity Agent",
            content: "Streamed answer",
            timestamp: "09:42",
            streaming: true,
        };
        const { container } = render(
            <AgentChat
                agent={agent}
                sessions={sessions}
                messages={[streaming]}
                currentUser="You"
                typingSpeed={16}
            />,
        );

        expect(container.querySelector(".agent-chat__typing")).not.toBeNull();
        expect(container.querySelector(".agent-chat__caret")).not.toBeNull();
        expect(await screen.findByText("Streamed answer")).not.toBeNull();
        expect(container.querySelector(".agent-chat__caret")).toBeNull();
        expect(container.querySelector('.agent-chat__bubble[data-streaming="true"]')).toBeNull();
    });

    it("changes the inference level through the shared Select component", (): void => {
        const onThinkingLevelChange = vi.fn();

        render(
            <AgentChat
                agent={agent}
                sessions={sessions}
                messages={messages}
                currentUser="You"
                onThinkingLevelChange={onThinkingLevelChange}
            />,
        );

        const select: HTMLElement = screen.getByRole("combobox", { name: "Inference" });

        expect(select.textContent).toContain("Medium");

        fireEvent.click(select);
        fireEvent.click(screen.getByRole("option", { name: "Maximum" }));

        expect(onThinkingLevelChange).toHaveBeenCalledWith("maximum");
        expect(
            screen.getByRole("combobox", { name: "Inference" }).textContent,
        ).toContain("Maximum");
    });

    it("localizes the agent workspace labels", (): void => {
        render(
            <International locale="zh-CN">
                <AgentChat
                    agent={agent}
                    sessions={sessions}
                    messages={messages}
                    currentUser="You"
                />
            </International>,
        );

        expect(screen.getByRole("heading", { name: "历史" })).not.toBeNull();
        expect(screen.getAllByLabelText("回应").length).toBeGreaterThan(0);
        expect(screen.getAllByRole("button", { name: "更多回应" }).length).toBeGreaterThan(0);

        const select: HTMLElement = screen.getByRole("combobox", { name: "推理等级" });

        expect(select.textContent).toContain("中等");

        fireEvent.click(screen.getByRole("button", { name: /思考/ }));

        expect(screen.getByRole("button", { name: /思考/ }).getAttribute("aria-expanded")).toBe(
            "true",
        );
    });

    it("renders the virtual agent transcript with history and reasoning", (): void => {
        const { container } = render(
            <VirtualAgentChat
                agent={agent}
                sessions={sessions}
                messages={messages}
                currentUser="You"
                messageHeight={320}
            />,
        );

        expect(screen.getByRole("heading", { name: "History" })).not.toBeNull();
        expect(container.querySelector(".agent-chat__name")?.textContent).toBe(
            "Periodicity Agent",
        );
        expect(container.querySelector(".agent-chat__markdown")).not.toBeNull();
        expect(
            container.querySelector<HTMLElement>(".message-list--virtual .message")?.style.height,
        ).toBe("240px");
    });
});
