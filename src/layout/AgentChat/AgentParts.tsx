import {
    useId,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from "react";
import Avatar from "../../component/thumb/Avatar";
import Icon from "../../component/icon/Icon";
import Markdown from "../../component/markdown/Markdown";
import cx from "../../component/foundation/cx";
import Select from "../../component/input/select/list/normal/Select";
import { useInternational, type InternationalContextValue } from "../../international";
import type {
    AgentMessageItem,
    AgentProfile,
    AgentSession,
    AgentThinkingLevel,
} from "./model";
import { isAgentMessage } from "./agentUtils";
import useTypewriter from "./useTypewriter";
import "./AgentChat.css";

/**
 * Three-dot streaming indicator.
 * @param props - Optional compact size.
 * @example
 * <TypingDots />
 * @returns An animated indicator hidden from assistive technology.
 */
const TypingDots: (props: { small?: boolean }) => ReactNode = ({
    small = false,
}: {
    small?: boolean;
}): ReactNode => (
    <span
        className={small ? "agent-chat__typing agent-chat__typing--small" : "agent-chat__typing"}
        aria-hidden="true"
    >
        <span />
        <span />
        <span />
    </span>
);

const ThinkingLevels: readonly AgentThinkingLevel[] = [
    "off",
    "minimum",
    "medium",
    "maximum",
];

/**
 * Compact inference-level select placed beside the composer send button.
 * Uses the shared Select component rather than a native select.
 * @param props - Current level, disabled state, and change handler.
 * @example
 * <AgentThinkingSelect value="medium" onChange={setLevel} />
 * @returns A select control.
 */
export const AgentThinkingSelect: (props: {
    value: AgentThinkingLevel;
    disabled?: boolean;
    onChange: (level: AgentThinkingLevel) => void;
}) => ReactNode = ({
    value,
    disabled = false,
    onChange,
}: {
    value: AgentThinkingLevel;
    disabled?: boolean;
    onChange: (level: AgentThinkingLevel) => void;
}): ReactNode => {
    const { t }: InternationalContextValue = useInternational();
    const levelLabel: Record<AgentThinkingLevel, string> = {
        off: t("thinkingOff"),
        minimum: t("thinkingMinimum"),
        medium: t("thinkingMedium"),
        maximum: t("thinkingMaximum"),
    };

    return (
        <Select
            className="agent-chat__thinking-level"
            disabled={disabled}
            label={t("inference")}
            options={ThinkingLevels.map(
                (level: AgentThinkingLevel): { value: string; label: string } => ({
                    value: level,
                    label: levelLabel[level],
                }),
            )}
            size="sm"
            value={value}
            variant="outline"
            onChange={(next: string): void => onChange(next as AgentThinkingLevel)}
        />
    );
};

/**
 * Header identity for the active agent.
 * @param props - Agent profile.
 * @example
 * <AgentHeader agent={agent} />
 * @returns The agent identity row.
 */
export const AgentHeader: (props: { agent: AgentProfile }) => ReactNode = ({
    agent,
}: {
    agent: AgentProfile;
}): ReactNode => {
    const { t }: InternationalContextValue = useInternational();

    return (
        <div className="agent-chat__header">
            <Avatar
                name={agent.name}
                src={
                    agent.avatar === (void 0) ? (
                        <Icon name="Agent" size={18} aria-hidden="true" />
                    ) : (
                        agent.avatar
                    )
                }
                size="md"
            />
            <span className="agent-chat__identity">
                <span className="agent-chat__name">{agent.name}</span>
                {agent.model === (void 0) && agent.description === (void 0) ? null : (
                    <span className="agent-chat__detail">
                        {agent.model ?? agent.description}
                    </span>
                )}
            </span>
            {agent.presence === (void 0) ? null : (
                <span className="agent-chat__presence" data-presence={agent.presence}>
                    {t(agent.presence)}
                </span>
            )}
        </div>
    );
};

/**
 * One history row in the left session list.
 * @param props - Historical session.
 * @example
 * <AgentSessionRow session={session} />
 * @returns A session title, preview, time, and unread badge.
 */
export const AgentSessionRow: (props: { session: AgentSession }) => ReactNode = ({
    session,
}: {
    session: AgentSession;
}): ReactNode => (
    <>
        <span className="agent-chat__session-icon" aria-hidden="true">
            <Icon name="History" size={16} />
        </span>
        <span className="contact__copy">
            <span className="contact__name">{session.title}</span>
            {session.preview === (void 0) ? null : (
                <span className="contact__description">{session.preview}</span>
            )}
        </span>
        <span className="agent-chat__session-meta">
            {session.timestamp === (void 0) ? null : (
                <span className="agent-chat__session-time">{session.timestamp}</span>
            )}
            {session.unread === (void 0) || session.unread <= 0 ? null : (
                <span className="agent-chat__session-unread">{session.unread}</span>
            )}
        </span>
    </>
);

/**
 * Message avatar: agent messages use the agent mark, user messages keep their own avatar.
 * @param props - Message.
 * @example
 * <AgentAvatar message={message} />
 * @returns A size-small Avatar.
 */
export const AgentAvatar: (props: { message: AgentMessageItem }) => ReactNode = ({
    message,
}: {
    message: AgentMessageItem;
}): ReactNode => (
    <Avatar
        name={message.author}
        src={
            isAgentMessage(message) ? (
                <Icon name="Agent" size={16} aria-hidden="true" />
            ) : (
                message.avatar
            )
        }
        size="sm"
    />
);

/**
 * Markdown answer for an agent message with optional typewriter streaming.
 * @param props - Message and typewriter speed.
 * @example
 * <AgentBubble message={message} typingSpeed={24} />
 * @returns Markdown for the agent, or the original content for the user.
 */
export const AgentBubble: (props: { message: AgentMessageItem; typingSpeed: number }) => ReactNode = ({
    message,
    typingSpeed,
}: {
    message: AgentMessageItem;
    typingSpeed: number;
}): ReactNode => {
    const streaming: boolean = message.streaming === true;
    const visible: string = useTypewriter(message.content, streaming, typingSpeed);
    const revealing: boolean = streaming && visible !== message.content;
    const waiting: boolean = streaming && visible.length === 0;

    if (!isAgentMessage(message)) {
        return <>{message.content}</>;
    }

    return (
        <div
            className="agent-chat__bubble"
            data-streaming={revealing && visible.length > 0 ? "true" : (void 0)}
            aria-busy={streaming ? "true" : (void 0)}
        >
            {waiting ? (
                <TypingDots />
            ) : (
                <Markdown className="agent-chat__markdown" source={visible} />
            )}
            {waiting && message.content.length > 0 ? (
                <span className="agent-chat__caret" aria-hidden="true" />
            ) : null}
        </div>
    );
};

/**
 * Reasoning trace rendered outside the answer bubble in its own disclosure view.
 * @param props - Message, label, and typewriter speed.
 * @example
 * <AgentThinking message={message} label="Thinking" typingSpeed={24} />
 * @returns A collapsible reasoning panel, or null when the message has no reasoning.
 */
export const AgentThinking: (props: {
    message: AgentMessageItem;
    label: string;
    typingSpeed: number;
}) => ReactNode = ({
    message,
    label,
    typingSpeed,
}: {
    message: AgentMessageItem;
    label: string;
    typingSpeed: number;
}): ReactNode => {
    const thinking: string = message.thinking ?? "";
    const thinkingStreaming: boolean = message.thinkingStreaming === true;
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(thinkingStreaming);
    const panelId: string = useId();
    const visible: string = useTypewriter(thinking, thinkingStreaming, typingSpeed);

    if (!isAgentMessage(message) || thinking.length === 0) {
        return null;
    }

    return (
        <div
            className={cx(
                "agent-chat__thinking",
                open && "agent-chat__thinking--open",
            )}
        >
            <button
                type="button"
                className="agent-chat__thinking-summary"
                aria-controls={panelId}
                aria-expanded={open}
                onClick={(): void =>
                    setOpen((previous: boolean): boolean => !previous)
                }
            >
                <Icon name="Sparkle" size={14} aria-hidden="true" />
                <span className="agent-chat__thinking-label">{label}</span>
                {thinkingStreaming ? <TypingDots small /> : null}
                {message.thinkingDuration === (void 0) ? null : (
                    <span className="agent-chat__thinking-duration">
                        {message.thinkingDuration}
                    </span>
                )}
                <Icon
                    className="agent-chat__thinking-chevron"
                    name="ChevronDown"
                    size={14}
                    aria-hidden="true"
                />
            </button>
            <div
                className="agent-chat__thinking-panel"
                id={panelId}
                role="region"
                aria-label={label}
                aria-hidden={open ? (void 0) : "true"}
                inert={open ? (void 0) : true}
            >
                <div className="agent-chat__thinking-clip">
                    <div className="agent-chat__thinking-body">
                        <Markdown source={visible} />
                    </div>
                </div>
            </div>
        </div>
    );
};
