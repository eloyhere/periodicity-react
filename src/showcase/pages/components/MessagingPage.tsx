import type { FC } from "react";
import { Columns, Stack } from "../../../arrange/layout";
import {
    Chat,
    Contact,
    MessageList,
    VirtualChat,
    VirtualContact,
    VirtualMessageList,
} from "../../../component";
import Text from "../../../component/text/Text";
import { useToast } from "../../../component/toast/ToastContext";
import type { ToastApi } from "../../../component/toast/ToastContext";
import Demo from "../../Demo";
import {
    chatContacts,
    chatMessages,
    virtualChatContacts,
    virtualChatMessages,
} from "../../samples";

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
        <MessageList messages={chatMessages} currentUser="You" />
    </Stack>
    <Stack gap="sm">
        <Text variant="label" tone="muted">Message list · virtual</Text>
        <VirtualMessageList messages={virtualChatMessages} currentUser="You" height={280} />
    </Stack>
</Columns>`;

const chatCode: string = `<Chat
    contacts={chatContacts}
    messages={chatMessages}
    defaultValue="mira"
    currentUser="You"
    onSend={(body) => {
        toast.show({ title: "Message sent", description: body });
    }}
/>

<VirtualChat
    contacts={virtualChatContacts}
    messages={virtualChatMessages}
    defaultValue="person-0"
    currentUser="You"
    contactHeight={280}
    messageHeight={300}
    onSend={(body) => {
        toast.show({ title: "Virtual message sent", description: body });
    }}
/>`;

/**
 * Documents contacts, message transcripts, and the conversation layout.
 * @example
 * <MessagingPage />
 * @returns The Messaging entry.
 */
const MessagingPage: FC = () => {
    const toast: ToastApi = useToast();

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
                description="Self and other messages with status, rendered directly or windowed."
                code={messagesCode}
            >
                <Columns className="showcase__fields" count={2} gap="lg">
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Message list
                        </Text>
                        <MessageList messages={chatMessages} currentUser="You" />
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Message list · virtual
                        </Text>
                        <VirtualMessageList
                            messages={virtualChatMessages}
                            currentUser="You"
                            height={280}
                        />
                    </Stack>
                </Columns>
            </Demo>

            <Demo
                title="Chat"
                description="The full conversation layout, combining contacts, a transcript, and a composer."
                code={chatCode}
            >
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        Chat
                    </Text>
                    <Chat
                        contacts={chatContacts}
                        messages={chatMessages}
                        defaultValue="mira"
                        currentUser="You"
                        onSend={(body: string): void => {
                            toast.show({ title: "Message sent", description: body });
                        }}
                    />
                </Stack>
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        Chat · virtual
                    </Text>
                    <VirtualChat
                        contacts={virtualChatContacts}
                        messages={virtualChatMessages}
                        defaultValue="person-0"
                        currentUser="You"
                        contactHeight={280}
                        messageHeight={300}
                        onSend={(body: string): void => {
                            toast.show({ title: "Virtual message sent", description: body });
                        }}
                    />
                </Stack>
            </Demo>
        </>
    );
};

export default MessagingPage;
