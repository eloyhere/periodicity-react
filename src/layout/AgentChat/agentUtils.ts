import type { MessageItem } from "../message/adapter";
import type { AgentMessageItem } from "./model";

/**
 * Reports whether a message belongs to the agent side.
 * @param message - Agent message.
 * @example
 * const agent = isAgentMessage(message);
 * @returns True for agent answers and reasoning.
 */
export const isAgentMessage: (message: AgentMessageItem) => boolean = (
    message: AgentMessageItem,
): boolean =>
    message.role === "agent" || (message.role === (void 0) && message.self !== true);

/**
 * Casts a generic message slot argument to the agent message shape.
 * @param message - Message passed by MessageList.
 * @example
 * const agentMessage = asAgentMessage(message);
 * @returns The same message with agent fields available.
 */
export const asAgentMessage: (message: MessageItem) => AgentMessageItem = (
    message: MessageItem,
): AgentMessageItem => message as AgentMessageItem;
