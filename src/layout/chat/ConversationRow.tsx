import type { FC } from "react";
import Avatar from "../../component/thumb/Avatar";
import type { ChatConversation } from "./model";
import "./Chat.css";

/**
 * Props for one recent-conversation row.
 * Type: interface.
 * Fields: conversation.
 * @example
 * <ConversationRow conversation={{ id: "mira", name: "Mira Chen" }} />
 */
export interface ConversationRowProps {
    conversation: ChatConversation;
}

/**
 * Renders a WeChat-style recent conversation: avatar, name, last-message preview,
 * last activity, and an unread badge.
 * @param props - Conversation metadata.
 * @example
 * <ConversationRow conversation={conversation} />
 * @returns A conversation row.
 */
const ConversationRow: FC<ConversationRowProps> = ({ conversation }: ConversationRowProps) => {
    const unread: number = conversation.unread ?? 0;

    return (
        <span
            className="chat__conversation"
            data-pinned={conversation.pinned === true ? "true" : "false"}
            data-muted={conversation.muted === true ? "true" : "false"}
        >
            <Avatar name={conversation.name} src={conversation.avatar} size="sm" />
            <span className="chat__conversation-body">
                <span className="chat__conversation-head">
                    <span className="chat__conversation-name">{conversation.name}</span>
                    {conversation.timestamp === (void 0) ? null : (
                        <span className="chat__conversation-time">{conversation.timestamp}</span>
                    )}
                </span>
                <span className="chat__conversation-foot">
                    <span className="chat__conversation-preview">
                        {conversation.preview ?? conversation.description ?? ""}
                    </span>
                    {unread > 0 ? (
                        <span className="chat__conversation-unread">
                            {unread > 99 ? "99+" : unread}
                        </span>
                    ) : null}
                </span>
            </span>
        </span>
    );
};

export default ConversationRow;
