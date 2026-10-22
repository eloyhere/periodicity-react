import type { ReactNode } from "react";
import type { ContactPresence } from "../contact/adapter";
import type { MessageItem } from "../message/adapter";

/**
 * Identity of the agent shown in the conversation header.
 * Type: interface.
 * Fields: name, avatar, description, model, presence.
 * @example
 * const agent: AgentProfile = { name: "Periodicity Agent", model: "DeepSeek V3" };
 */
export interface AgentProfile {
    /** Display name used in the header and as the message author. */
    name: string;
    /** Optional avatar URL or data URI. */
    avatar?: string;
    /** Short description shown when no model label is provided. */
    description?: string;
    /** Model label shown under the agent name. */
    model?: string;
    /** Optional presence indicator. */
    presence?: ContactPresence;
}

/**
 * One historical conversation with the agent.
 * The left pane of `AgentChat` lists these sessions rather than contacts.
 * Type: interface.
 * Fields: id, title, preview, timestamp, unread, pinned, avatar, disabled.
 * @example
 * const session: AgentSession = {
 *     id: "s1",
 *     title: "Release checklist",
 *     preview: "Draft the rollout steps",
 *     timestamp: "Yesterday",
 * };
 */
export interface AgentSession {
    id: string;
    /** Session title shown in the history list. */
    title: string;
    /** Last-message preview shown under the title. */
    preview?: string;
    /** Last activity label, such as a time or "Yesterday". */
    timestamp?: string;
    /** Unread count; zero or absent hides the badge. */
    unread?: number;
    pinned?: boolean;
    avatar?: string;
    disabled?: boolean;
}

/**
 * One agent-chat message. Agent answers are Markdown and may carry a separate reasoning trace.
 * Type: interface.
 * Extends `MessageItem`; `content` is narrowed to Markdown source.
 * Fields: sessionId, content, thinking, thinkingStreaming, thinkingDuration, streaming, role.
 * @example
 * const message: AgentMessageItem = {
 *     id: "m1",
 *     sessionId: "s1",
 *     author: "Periodicity Agent",
 *     content: "## Brief\n\n- Ship the cycle view",
 *     thinking: "The user asked for a short brief.",
 * };
 */
export interface AgentMessageItem extends Omit<MessageItem, "content"> {
    /** Session that owns the message. */
    sessionId: string;
    /** Markdown answer for agent messages, plain text for user messages. */
    content: string;
    /** Reasoning Markdown rendered in a separate collapsible view. */
    thinking?: string;
    /** Whether the reasoning trace is still streaming. */
    thinkingStreaming?: boolean;
    /** Reasoning duration label, for example "6s". */
    thinkingDuration?: string;
    /** Whether the answer is still streaming; enables the typewriter and caret. */
    streaming?: boolean;
    /** Explicit role; defaults to `self ? "user" : "agent"`. */
    role?: "user" | "agent";
}

/**
 * Reasoning effort requested from the agent.
 * Type: type alias.
 * Fields: none.
 * @example
 * const level: AgentThinkingLevel = "medium";
 */
export type AgentThinkingLevel = "off" | "minimum" | "medium" | "maximum";

/**
 * Props shared by the agent-chat layouts.
 * Type: interface.
 * Fields: agent, sessions, messages, historyTitle, historyLabel, thinkingLabel, thinkingLevel,
 * defaultThinkingLevel, onThinkingLevelChange, typingSpeed.
 * @example
 * <AgentChat agent={agent} sessions={sessions} messages={messages} />
 */
export interface AgentChatSharedProps {
    /** Agent identity shown in the conversation header. */
    agent: AgentProfile;
    /** Historical sessions listed on the left. */
    sessions?: readonly AgentSession[];
    /** Messages across every session. */
    messages?: readonly AgentMessageItem[];
    /** Heading above the session history; defaults to History. */
    historyTitle?: ReactNode;
    /** Accessible name of the session history; defaults to History. */
    historyLabel?: string;
    /** Label for the separate reasoning view; defaults to Thinking. */
    thinkingLabel?: string;
    /** Controlled inference level shown in the composer. */
    thinkingLevel?: AgentThinkingLevel;
    /** Initial inference level when uncontrolled; defaults to medium. */
    defaultThinkingLevel?: AgentThinkingLevel;
    /** Reports a changed inference level. */
    onThinkingLevelChange?: (level: AgentThinkingLevel) => void;
    /** Typewriter delay in milliseconds; defaults to 24. */
    typingSpeed?: number;
}
