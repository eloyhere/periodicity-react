import type { ReactNode } from "react";
import type { ContactItem } from "../contact/adapter";
import type { MessageItem } from "../message/adapter";
import type { ChatSlots } from "../chat/slots";
import {
    AgentAvatar,
    AgentBubble,
    AgentHeader,
    AgentSessionRow,
    AgentThinking,
} from "./AgentParts";
import { asAgentMessage } from "./agentUtils";
import type { AgentProfile, AgentSession } from "./model";

/**
 * Options used to build the agent-specific chat slots.
 * Type: interface.
 * Fields: agent, sessionById, slots, thinkingLabel, typingSpeed.
 */
export interface AgentSlotOptions {
    agent: AgentProfile;
    sessionById: ReadonlyMap<string, AgentSession>;
    slots?: ChatSlots;
    thinkingLabel: string;
    typingSpeed: number;
}

/**
 * Merges caller slots with the agent header, history rows, markdown bubbles, and reasoning view.
 * @param options - Agent identity, session lookup, caller slots, and rendering options.
 * @example
 * const slots = createAgentSlots({ agent, sessionById, thinkingLabel: "Thinking", typingSpeed: 24 });
 * @returns Slots accepted by Chat and VirtualChat.
 */
export const createAgentSlots: (options: AgentSlotOptions) => ChatSlots = (
    options: AgentSlotOptions,
): ChatSlots => {
    const { agent, sessionById, slots, thinkingLabel, typingSpeed }: AgentSlotOptions = options;

    return {
        ...slots,
        header:
            slots?.header ??
            ((): ReactNode => <AgentHeader agent={agent} />),
        contact:
            slots?.contact ??
            ((index: number, contact: ContactItem): ReactNode => {
                void index;
                const session: AgentSession | undefined = sessionById.get(contact.id);

                return session === (void 0) ? <>{contact.name}</> : <AgentSessionRow session={session} />;
            }),
        avatar:
            slots?.avatar ??
            ((index: number, message: MessageItem): ReactNode => {
                void index;
                return <AgentAvatar message={asAgentMessage(message)} />;
            }),
        message:
            slots?.message ??
            ((index: number, message: MessageItem): ReactNode => {
                void index;
                return (
                    <AgentBubble
                        message={asAgentMessage(message)}
                        typingSpeed={typingSpeed}
                    />
                );
            }),
        beforeMessage:
            slots?.beforeMessage ??
            ((index: number, message: MessageItem): ReactNode => {
                void index;
                return (
                    <AgentThinking
                        label={thinkingLabel}
                        message={asAgentMessage(message)}
                        typingSpeed={typingSpeed}
                    />
                );
            }),
    };
};
