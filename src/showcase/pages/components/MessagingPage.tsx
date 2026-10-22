import {
    useState,
    type Dispatch,
    type FC,
    type ReactNode,
    type SetStateAction,
} from "react";
import { Columns, Stack } from "../../../arrange/layout";
import {
    Chat,
    Contact,
    defaultMessageReactions,
    MessageList,
    VirtualChat,
    VirtualContact,
    VirtualMessageList,
} from "../../../component";
import Text from "../../../component/text/Text";
import { useToast } from "../../../component/toast/ToastContext";
import type { ToastApi } from "../../../component/toast/ToastContext";
import Demo from "../../Demo";
import type {
    ChatConversation,
    ChatMessage,
    ContactAction,
    ContactItem,
    MessageAction,
    MessageItem,
} from "../../../component";
import {
    chatContacts,
    chatConversations,
    chatMessages,
    virtualChatContacts,
    virtualChatMessages,
} from "../../samples";
import { AgentChatDemo, VirtualAgentChatDemo } from "./AgentChatDemo";

const contactsCode: string = `<Columns count={2} gap="lg">
    <Stack gap="sm">
        <Text variant="label" tone="muted">Contact</Text>
        <Contact contacts={chatContacts} defaultValue="mira" />
    </Stack>
    <Stack gap="sm">
        <Text variant="label" tone="muted">Contact · virtual</Text>
        <VirtualContact
            contacts={virtualChatContacts}
            defaultValue="person-0"
            height={240}
            itemHeight={76}
        />
    </Stack>
</Columns>`;

const messagesCode: string = `<Columns count={2} gap="lg">
    <Stack gap="sm">
        <Text variant="label" tone="muted">Message list</Text>
        <MessageList
            messages={chatMessages}
            currentUser="You"
            defaultReactions={{
                "message-1": "like",
                "message-2": "love",
                "message-4": "fire",
            }}
            reactions={defaultMessageReactions}
        />
    </Stack>
    <Stack gap="sm">
        <Text variant="label" tone="muted">Message list · virtual</Text>
        <VirtualMessageList
            messages={virtualChatMessages}
            currentUser="You"
            height={360}
            defaultReactions={{
                "virtual-message-78": "like",
                "virtual-message-79": "party",
            }}
            reactions={defaultMessageReactions}
        />
    </Stack>
</Columns>`;

const chatCode: string = `<Chat
    conversations={conversations}
    messages={messages}
    defaultValue="mira"
    currentUser="You"
    reactions={defaultMessageReactions}
    onContactAction={handleContactAction}
    onMessageAction={handleMessageAction}
    onSend={sendMessage}
    onSendFiles={sendFiles}
/>

<VirtualChat
    contacts={virtualContacts}
    messages={virtualMessages}
    defaultValue="person-0"
    currentUser="You"
    contactHeight={280}
    messageHeight={300}
    reactions={defaultMessageReactions}
    onContactAction={handleVirtualContactAction}
    onMessageAction={handleVirtualMessageAction}
    onSend={sendVirtualMessage}
    onSendFiles={sendVirtualFiles}
/>`;

const agentChatCode: string = `<AgentChat
    agent={agentProfile}
    sessions={agentSessions}
    messages={agentMessages}
    currentUser="You"
    onSend={(body) => {
        toast.show({ title: "Agent message sent", description: body });
    }}
/>

<VirtualAgentChat
    agent={agentProfile}
    sessions={virtualAgentSessions}
    messages={virtualAgentMessages}
    currentUser="You"
    messageHeight={360}
    onSend={(body) => {
        toast.show({ title: "Virtual agent message sent", description: body });
    }}
/>`;

/**
 * Initial reactions for the direct transcript.
 * Type: Readonly<Record<string, string>>.
 */
const chatReactionDefaults: Readonly<Record<string, string>> = Object.fromEntries([
    ["message-1", "like"],
    ["message-2", "love"],
    ["message-4", "fire"],
]);

/**
 * Initial reactions for the virtual transcript's latest rows.
 * Type: Readonly<Record<string, string>>.
 */
const virtualReactionDefaults: Readonly<Record<string, string>> = Object.fromEntries([
    ["virtual-message-78", "like"],
    ["virtual-message-79", "party"],
]);

/**
 * Documents contacts, message transcripts, and the conversation layout.
 * @example
 * <MessagingPage />
 * @returns The Messaging entry.
 */
const MessagingPage: FC = () => {
    const toast: ToastApi = useToast();
    const [conversations, setConversations]: [
        readonly ChatConversation[],
        Dispatch<SetStateAction<readonly ChatConversation[]>>,
    ] = useState<readonly ChatConversation[]>(chatConversations);
    const [messages, setMessages]: [
        readonly ChatMessage[],
        Dispatch<SetStateAction<readonly ChatMessage[]>>,
    ] = useState<readonly ChatMessage[]>(chatMessages);
    const [virtualContacts, setVirtualContacts]: [
        readonly ContactItem[],
        Dispatch<SetStateAction<readonly ContactItem[]>>,
    ] = useState<readonly ContactItem[]>(virtualChatContacts);
    const [virtualMessages, setVirtualMessages]: [
        readonly MessageItem[],
        Dispatch<SetStateAction<readonly MessageItem[]>>,
    ] = useState<readonly MessageItem[]>(virtualChatMessages);

    const stamp: () => string = (): string =>
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const copyText: (content: ReactNode) => void = (content: ReactNode): void => {
        const text: string = typeof content === "string" ? content : "";

        if (text.length > 0 && navigator.clipboard !== (void 0)) {
            void navigator.clipboard.writeText(text).catch((): void => (void 0));
        }
    };

    const handleContactAction: (action: ContactAction, contact: ContactItem) => void = (
        action: ContactAction,
        contact: ContactItem,
    ): void => {
        if (action === "delete" || action === "block") {
            setConversations(
                (current: readonly ChatConversation[]): readonly ChatConversation[] =>
                    current.filter(
                        (conversation: ChatConversation): boolean =>
                            conversation.id !== contact.id,
                    ),
            );
            setMessages(
                (current: readonly ChatMessage[]): readonly ChatMessage[] =>
                    current.filter(
                        (message: ChatMessage): boolean => message.conversationId !== contact.id,
                    ),
            );
        }

        toast.show({
            title:
                action === "delete"
                    ? "Conversation deleted"
                    : action === "block"
                      ? "Contact blocked"
                      : `Contact: ${action}`,
            description: contact.name,
        });
    };

    const handleMessageAction: (action: MessageAction, message: MessageItem) => void = (
        action: MessageAction,
        message: MessageItem,
    ): void => {
        if (action === "delete") {
            setMessages(
                (current: readonly ChatMessage[]): readonly ChatMessage[] =>
                    current.filter((item: ChatMessage): boolean => item.id !== message.id),
            );
            toast.show({ title: "Message deleted" });

            return;
        }

        if (action === "recall") {
            setMessages(
                (current: readonly ChatMessage[]): readonly ChatMessage[] =>
                    current.map(
                        (item: ChatMessage): ChatMessage =>
                            item.id === message.id
                                ? { ...item, content: "This message was recalled." }
                                : item,
                    ),
            );
            toast.show({ title: "Message recalled" });

            return;
        }

        if (action === "copy") {
            copyText(message.content);
        }

        toast.show({ title: `Message: ${action}` });
    };

    const sendMessage: (body: string, contact: ContactItem) => void = (
        body: string,
        contact: ContactItem,
    ): void => {
        const timestamp: string = stamp();

        setMessages(
            (current: readonly ChatMessage[]): readonly ChatMessage[] => [
                ...current,
                {
                    id: `message-${Date.now()}`,
                    conversationId: contact.id,
                    author: "You",
                    content: body,
                    timestamp,
                    self: true,
                    status: "sent",
                },
            ],
        );
        setConversations(
            (current: readonly ChatConversation[]): readonly ChatConversation[] =>
                current.map(
                    (conversation: ChatConversation): ChatConversation =>
                        conversation.id === contact.id
                            ? { ...conversation, preview: body, timestamp, unread: 0 }
                            : conversation,
                ),
        );
        toast.show({ title: "Message sent", description: body });
    };

    const sendFiles: (files: readonly File[], contact: ContactItem) => void = (
        files: readonly File[],
        contact: ContactItem,
    ): void => {
        const names: string = files.map((file: File): string => file.name).join(", ");
        const content: string = `Attached ${names}`;
        const timestamp: string = stamp();

        setMessages(
            (current: readonly ChatMessage[]): readonly ChatMessage[] => [
                ...current,
                {
                    id: `message-${Date.now()}`,
                    conversationId: contact.id,
                    author: "You",
                    content,
                    timestamp,
                    self: true,
                    status: "sent",
                },
            ],
        );
        setConversations(
            (current: readonly ChatConversation[]): readonly ChatConversation[] =>
                current.map(
                    (conversation: ChatConversation): ChatConversation =>
                        conversation.id === contact.id
                            ? { ...conversation, preview: content, timestamp, unread: 0 }
                            : conversation,
                ),
        );
        toast.show({ title: "Files attached", description: names });
    };

    const handleVirtualContactAction: (action: ContactAction, contact: ContactItem) => void = (
        action: ContactAction,
        contact: ContactItem,
    ): void => {
        if (action === "delete" || action === "block") {
            setVirtualContacts(
                (current: readonly ContactItem[]): readonly ContactItem[] =>
                    current.filter((item: ContactItem): boolean => item.id !== contact.id),
            );
            setVirtualMessages(
                (current: readonly MessageItem[]): readonly MessageItem[] =>
                    current.filter(
                        (message: MessageItem): boolean => message.contactId !== contact.id,
                    ),
            );
        }

        toast.show({ title: `Virtual contact: ${action}`, description: contact.name });
    };

    const handleVirtualMessageAction: (action: MessageAction, message: MessageItem) => void = (
        action: MessageAction,
        message: MessageItem,
    ): void => {
        if (action === "delete") {
            setVirtualMessages(
                (current: readonly MessageItem[]): readonly MessageItem[] =>
                    current.filter((item: MessageItem): boolean => item.id !== message.id),
            );
        } else if (action === "recall") {
            setVirtualMessages(
                (current: readonly MessageItem[]): readonly MessageItem[] =>
                    current.map(
                        (item: MessageItem): MessageItem =>
                            item.id === message.id
                                ? { ...item, content: "This message was recalled." }
                                : item,
                    ),
            );
        } else if (action === "copy") {
            copyText(message.content);
        }

        toast.show({ title: `Virtual message: ${action}` });
    };

    const sendVirtualMessage: (body: string, contact: ContactItem) => void = (
        body: string,
        contact: ContactItem,
    ): void => {
        setVirtualMessages(
            (current: readonly MessageItem[]): readonly MessageItem[] => [
                ...current,
                {
                    id: `virtual-message-${Date.now()}`,
                    contactId: contact.id,
                    author: "You",
                    content: body,
                    timestamp: stamp(),
                    self: true,
                    status: "sent",
                },
            ],
        );
        toast.show({ title: "Virtual message sent", description: body });
    };

    const sendVirtualFiles: (files: readonly File[], contact: ContactItem) => void = (
        files: readonly File[],
        contact: ContactItem,
    ): void => {
        const names: string = files.map((file: File): string => file.name).join(", ");

        setVirtualMessages(
            (current: readonly MessageItem[]): readonly MessageItem[] => [
                ...current,
                {
                    id: `virtual-message-${Date.now()}`,
                    contactId: contact.id,
                    author: "You",
                    content: `Attached ${names}`,
                    timestamp: stamp(),
                    self: true,
                    status: "sent",
                },
            ],
        );
        toast.show({ title: "Virtual files attached", description: names });
    };

    return (
        <>
            <Demo
                title="Contacts"
                description="Presence-aware contact lists, with a windowed variant for long rosters."
                code={contactsCode}
            >
                <Columns className="showcase__fields" count={2} gap="lg">
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Contact
                        </Text>
                        <Contact contacts={chatContacts} defaultValue="mira" />
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Contact · virtual
                        </Text>
                        <VirtualContact
                            contacts={virtualChatContacts}
                            defaultValue="person-0"
                            height={240}
                            itemHeight={76}
                        />
                    </Stack>
                </Columns>
            </Demo>

            <Demo
                title="Message transcripts"
                description="Self and other messages with status and Telegram-style icon reactions, rendered directly or windowed."
                code={messagesCode}
            >
                <Columns className="showcase__fields" count={2} gap="lg">
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Message list
                        </Text>
                        <MessageList
                            messages={chatMessages}
                            currentUser="You"
                            defaultReactions={chatReactionDefaults}
                            reactions={defaultMessageReactions}
                        />
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Message list · virtual
                        </Text>
                        <VirtualMessageList
                            messages={virtualChatMessages}
                            currentUser="You"
                            height={360}
                            defaultReactions={virtualReactionDefaults}
                            reactions={defaultMessageReactions}
                        />
                    </Stack>
                </Columns>
            </Demo>

            <Demo
                title="Chat"
                description="The full conversation layout, combining contacts, a transcript with emoji reactions, and a composer."
                code={chatCode}
            >
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        Chat
                    </Text>
                    <Chat
                        conversations={conversations}
                        messages={messages}
                        defaultValue="mira"
                        currentUser="You"
                        defaultReactions={chatReactionDefaults}
                        reactions={defaultMessageReactions}
                        onValueChange={(value: string): void => {
                            setConversations(
                                (
                                    current: readonly ChatConversation[],
                                ): readonly ChatConversation[] =>
                                    current.map(
                                        (
                                            conversation: ChatConversation,
                                        ): ChatConversation =>
                                            conversation.id === value
                                                ? { ...conversation, unread: 0 }
                                                : conversation,
                                    ),
                            );
                        }}
                        onContactAction={handleContactAction}
                        onMessageAction={handleMessageAction}
                        onSend={sendMessage}
                        onSendFiles={sendFiles}
                    />
                </Stack>
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        Chat · virtual
                    </Text>
                    <VirtualChat
                        contacts={virtualContacts}
                        messages={virtualMessages}
                        defaultValue="person-0"
                        currentUser="You"
                        contactHeight={280}
                        messageHeight={300}
                        defaultReactions={virtualReactionDefaults}
                        reactions={defaultMessageReactions}
                        onContactAction={handleVirtualContactAction}
                        onMessageAction={handleVirtualMessageAction}
                        onSend={sendVirtualMessage}
                        onSendFiles={sendVirtualFiles}
                    />
                </Stack>
            </Demo>

            <Demo
                title="Agent chat"
                description="History sessions on the left, markdown answers from an agent, and reasoning in its own view."
                code={agentChatCode}
            >
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        Agent chat
                    </Text>
                    <AgentChatDemo />
                </Stack>
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        Agent chat · virtual
                    </Text>
                    <VirtualAgentChatDemo />
                </Stack>
            </Demo>
        </>
    );
};

export default MessagingPage;
