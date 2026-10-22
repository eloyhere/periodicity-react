import {
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type MutableRefObject,
    type ReactNode,
    type SetStateAction,
} from "react";
import {
    AgentChat,
    VirtualAgentChat,
    type AgentMessageItem,
    type AgentProfile,
    type AgentSession,
} from "../../../component";
import type { ContactItem } from "../../../component";
import { agentMessages, agentProfile, agentSessions, virtualAgentMessages, virtualAgentSessions } from "../../samples";

/**
 * State returned by the agent-chat mock.
 * Type: interface.
 * Fields: sessions, messages, send, select.
 */
interface AgentMockState {
    sessions: readonly AgentSession[];
    messages: readonly AgentMessageItem[];
    send: (body: string, contact: ContactItem) => void;
    select: (id: string) => void;
}

/**
 * Builds a short Markdown answer for a mock agent request.
 * @param body - User message.
 * @example
 * const answer = mockAnswer("Draft a brief");
 * @returns Markdown source.
 */
const mockAnswer: (body: string) => string = (body: string): string =>
    `## Draft

I would start from **${body}** and keep the first pass small.

- Confirm the success metric.
- Ship a narrow slice.
- Review the evidence tomorrow.

| Next step | Owner |
| --- | --- |
| Draft the slice | You |
| Review evidence | Agent |

> Small enough to review, complete enough to learn from.`;

/**
 * Creates interactive mock sessions and streams a mock agent reply after each send.
 * @param initialSessions - Session fixtures.
 * @param initialMessages - Message fixtures.
 * @example
 * const mock = useAgentMock(agentSessions, agentMessages);
 * @returns Session state plus send and select handlers.
 */
const useAgentMock: (
    initialSessions: readonly AgentSession[],
    initialMessages: readonly AgentMessageItem[],
) => AgentMockState = (
    initialSessions: readonly AgentSession[],
    initialMessages: readonly AgentMessageItem[],
): AgentMockState => {
    const [sessions, setSessions]: [
        readonly AgentSession[],
        Dispatch<SetStateAction<readonly AgentSession[]>>,
    ] = useState<readonly AgentSession[]>(initialSessions);
    const [messages, setMessages]: [
        readonly AgentMessageItem[],
        Dispatch<SetStateAction<readonly AgentMessageItem[]>>,
    ] = useState<readonly AgentMessageItem[]>(initialMessages);
    const timers: MutableRefObject<number[]> = useRef<number[]>([]);

    useEffect(
        (): (() => void) => (): void => {
            for (const timer of timers.current) {
                window.clearTimeout(timer);
                window.clearInterval(timer);
            }
        },
        [],
    );

    const select: (id: string) => void = (id: string): void => {
        setSessions(
            (current: readonly AgentSession[]): readonly AgentSession[] =>
                current.map(
                    (session: AgentSession): AgentSession =>
                        session.id === id ? { ...session, unread: 0 } : session,
                ),
        );
    };

    const send: (body: string, contact: ContactItem) => void = (
        body: string,
        contact: ContactItem,
    ): void => {
        const sessionId: string = contact.id;
        const now: string = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        const userId: string = `mock-user-${Date.now()}`;
        const replyId: string = `mock-agent-${Date.now()}`;
        const answer: string = mockAnswer(body);
        const userMessage: AgentMessageItem = {
            id: userId,
            sessionId,
            author: "You",
            content: body,
            timestamp: now,
            self: true,
            role: "user",
            status: "read",
        };
        const reply: AgentMessageItem = {
            id: replyId,
            sessionId,
            author: agentProfile.name,
            content: "",
            timestamp: now,
            thinking: `The request is about **${body}**. I will keep the answer short, propose a narrow first pass, and leave a clear next step.`,
            thinkingStreaming: true,
            streaming: true,
        };

        setMessages(
            (current: readonly AgentMessageItem[]): readonly AgentMessageItem[] => [
                ...current,
                userMessage,
                reply,
            ],
        );
        setSessions(
            (current: readonly AgentSession[]): readonly AgentSession[] =>
                current.map(
                    (session: AgentSession): AgentSession =>
                        session.id === sessionId
                            ? { ...session, preview: body, timestamp: "Now", unread: 0 }
                            : session,
                ),
        );

        timers.current.push(
            window.setTimeout((): void => {
                setMessages(
                    (current: readonly AgentMessageItem[]): readonly AgentMessageItem[] =>
                        current.map(
                            (message: AgentMessageItem): AgentMessageItem =>
                                message.id === replyId
                                    ? { ...message, thinkingStreaming: false }
                                    : message,
                        ),
                );
            }, 700),
        );

        let revealed: number = 0;
        const interval: number = window.setInterval((): void => {
            revealed = Math.min(revealed + 8, answer.length);
            const complete: boolean = revealed >= answer.length;

            setMessages(
                (current: readonly AgentMessageItem[]): readonly AgentMessageItem[] =>
                    current.map(
                        (message: AgentMessageItem): AgentMessageItem =>
                            message.id === replyId
                                ? {
                                      ...message,
                                      content: answer.slice(0, revealed),
                                      streaming: !complete,
                                  }
                                : message,
                    ),
            );

            if (complete) {
                window.clearInterval(interval);
            }
        }, 50);
        timers.current.push(interval);
    };

    return { sessions, messages, send, select };
};

/**
 * Interactive normal agent-chat demo backed by mock sessions and a streamed reply.
 * @example
 * <AgentChatDemo />
 * @returns The agent chat.
 */
export const AgentChatDemo: () => ReactNode = (): ReactNode => {
    const mock: AgentMockState = useAgentMock(agentSessions, agentMessages);

    return (
        <AgentChat
            agent={agentProfile satisfies AgentProfile}
            sessions={mock.sessions}
            messages={mock.messages}
            currentUser="You"
            onValueChange={(value: string, contact: ContactItem | null): void => {
                void value;
                if (contact !== null) {
                    mock.select(contact.id);
                }
            }}
            onSend={mock.send}
        />
    );
};

/**
 * Interactive virtual agent-chat demo backed by mock sessions and a streamed reply.
 * @example
 * <VirtualAgentChatDemo />
 * @returns The virtual agent chat.
 */
export const VirtualAgentChatDemo: () => ReactNode = (): ReactNode => {
    const mock: AgentMockState = useAgentMock(virtualAgentSessions, virtualAgentMessages);

    return (
        <VirtualAgentChat
            agent={agentProfile}
            sessions={mock.sessions}
            messages={mock.messages}
            currentUser="You"
            messageHeight={360}
            onValueChange={(value: string, contact: ContactItem | null): void => {
                void value;
                if (contact !== null) {
                    mock.select(contact.id);
                }
            }}
            onSend={mock.send}
        />
    );
};
