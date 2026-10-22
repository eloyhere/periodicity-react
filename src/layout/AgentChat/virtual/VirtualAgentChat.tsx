import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { ContactItem } from "../../contact/adapter";
import type { MessageItem } from "../../message/adapter";
import cx from "../../../component/foundation/cx";
import VirtualChat, { type VirtualChatProps } from "../../chat/virtual/VirtualChat";
import type { ChatSlots } from "../../chat/slots";
import { defaultMessageReactions } from "../../message";
import { useInternational, type InternationalContextValue } from "../../../international";
import { createAgentSlots } from "../AgentSlots";
import { AgentThinkingSelect } from "../AgentParts";
import type {
    AgentChatSharedProps,
    AgentMessageItem,
    AgentSession,
    AgentThinkingLevel,
} from "../model";

/**
 * Props for the virtualised agent conversation layout.
 * Type: interface.
 * Extends VirtualChat props while replacing contacts with session history and agent messages.
 * Fields: agent, sessions, messages, historyTitle, historyLabel, thinkingLabel, typingSpeed.
 * @example
 * <VirtualAgentChat agent={agent} sessions={sessions} messages={messages} />
 */
export interface VirtualAgentChatProps
    extends Omit<
            VirtualChatProps,
            "contacts" | "messages" | "adapter" | "contactsTitle" | "contactsLabel"
        >,
        AgentChatSharedProps {}

/**
 * Renders the virtualised agent conversation with the same history, markdown, and reasoning views.
 * @param props - Agent identity, sessions, messages, and the forwarded virtual chat props.
 * @example
 * <VirtualAgentChat agent={agent} sessions={sessions} messages={messages} />
 * @returns A virtualised agent conversation layout.
 */
const VirtualAgentChat: (props: VirtualAgentChatProps) => ReactNode = ({
    agent,
    sessions = [],
    messages = [],
    historyTitle,
    historyLabel,
    thinkingLabel,
    thinkingLevel,
    defaultThinkingLevel = "medium",
    onThinkingLevelChange,
    typingSpeed = 24,
    messageItemHeight = 240,
    slots,
    placeholder,
    className = "",
    disabled = false,
    reactions = defaultMessageReactions,
    ...rest
}: VirtualAgentChatProps): ReactNode => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedHistoryTitle: ReactNode = historyTitle ?? t("agentHistory");
    const resolvedHistoryLabel: string = historyLabel ?? t("agentHistory");
    const resolvedThinkingLabel: string = thinkingLabel ?? t("thinking");
    const [internalThinkingLevel, setInternalThinkingLevel]: [
        AgentThinkingLevel,
        Dispatch<SetStateAction<AgentThinkingLevel>>,
    ] = useState<AgentThinkingLevel>(defaultThinkingLevel);
    const resolvedThinkingLevel: AgentThinkingLevel =
        thinkingLevel ?? internalThinkingLevel;

    const changeThinkingLevel: (level: AgentThinkingLevel) => void = (
        level: AgentThinkingLevel,
    ): void => {
        if (thinkingLevel === (void 0)) {
            setInternalThinkingLevel(level);
        }

        onThinkingLevelChange?.(level);
    };

    const contacts: readonly ContactItem[] = useMemo(
        (): readonly ContactItem[] =>
            sessions.map(
                (session: AgentSession): ContactItem => ({
                    id: session.id,
                    name: session.title,
                    description: session.preview,
                    avatar: session.avatar,
                    disabled: session.disabled,
                }),
            ),
        [sessions],
    );
    const mappedMessages: readonly MessageItem[] = useMemo(
        (): readonly MessageItem[] =>
            messages.map(
                (message: AgentMessageItem): MessageItem => ({
                    ...message,
                    contactId: message.sessionId,
                }),
            ),
        [messages],
    );
    const sessionById: ReadonlyMap<string, AgentSession> = useMemo(
        (): ReadonlyMap<string, AgentSession> =>
            new Map<string, AgentSession>(
                sessions.map((session: AgentSession): [string, AgentSession] => [
                    session.id,
                    session,
                ]),
            ),
        [sessions],
    );
    const agentSlots: ChatSlots = useMemo(
        () =>
            createAgentSlots({
                agent,
                sessionById,
                slots,
                thinkingLabel: resolvedThinkingLabel,
                typingSpeed,
            }),
        [agent, sessionById, slots, resolvedThinkingLabel, typingSpeed],
    );

    return (
        <VirtualChat
            {...rest}
            className={cx("agent-chat", className)}
            disabled={disabled}
            contacts={contacts}
            messages={mappedMessages}
            contactsTitle={resolvedHistoryTitle}
            contactsLabel={resolvedHistoryLabel}
            contactsSearchPlaceholder={t("searchSessions")}
            contactsSearchLabel={t("searchSessions")}
            reactions={reactions}
            placeholder={placeholder ?? t("messagePlaceholder", { name: agent.name })}
            composerAccessory={
                <AgentThinkingSelect
                    disabled={disabled}
                    value={resolvedThinkingLevel}
                    onChange={changeThinkingLevel}
                />
            }
            messageItemHeight={messageItemHeight}
            slots={agentSlots}
        />
    );
};

export default VirtualAgentChat;
