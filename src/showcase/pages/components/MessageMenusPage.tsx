import type { FC } from "react";
import { Stack } from "../../../arrange/layout";
import { ContactContextMenu, MessageContextMenu, Surface, Text } from "../../../component";
import type {
    ContactAction,
    ContactItem,
    MessageAction,
    MessageItem,
    ToastApi,
} from "../../../component";
import { useToast } from "../../../component/toast/ToastContext";
import Demo from "../../Demo";
import { chatContacts, chatMessages } from "../../samples";

const contactMenuCode: string = `const contact = chatContacts[0];

<ContactContextMenu
    contact={contact}
    onAction={(action, item) => toast.show({ title: \`\${action} \${item.name}\` })}
>
    <Surface className="showcase__context-zone" elevation={1} shape="sm">
        <Stack gap="xs">
            <Text variant="label">{contact.name}</Text>
            <Text variant="body-sm" tone="muted">
                Right-click for profile, chat, delete, and block.
            </Text>
        </Stack>
    </Surface>
</ContactContextMenu>`;

const messageMenuCode: string = `const message = chatMessages[0];

<MessageContextMenu
    message={message}
    self={false}
    onAction={(action, item) => toast.show({ title: \`\${action} \${item.id}\` })}
>
    <Surface className="showcase__context-zone" elevation={1} shape="sm">
        <Stack gap="xs">
            <Text variant="label">{message.author}</Text>
            <Text variant="body-sm" tone="muted">
                Right-click for copy, forward, favourite, quote, and delete.
            </Text>
        </Stack>
    </Surface>
</MessageContextMenu>`;

/**
 * Documents the context-menu wrappers specialised for contact and message rows.
 * Both previews open on right-click or long-press, exactly like the wrappers
 * used inside the messaging layouts.
 * @example
 * <MessageMenusPage />
 * @returns Contact and message context-menu demos.
 */
const MessageMenusPage: FC = () => {
    const toast: ToastApi = useToast();
    const contact: ContactItem = chatContacts[0];
    const message: MessageItem = chatMessages[0];

    const handleContactAction: (action: ContactAction, item: ContactItem) => void = (
        action: ContactAction,
        item: ContactItem,
    ): void => {
        toast.show({ title: `${action} · ${item.name}` });
    };

    const handleMessageAction: (action: MessageAction, item: MessageItem) => void = (
        action: MessageAction,
        item: MessageItem,
    ): void => {
        toast.show({ title: `${action} · ${item.id}` });
    };

    return (
        <>
            <Demo
                title="Contact context menu"
                description="A contact row wrapped in the shared context menu, with its four contact actions."
                code={contactMenuCode}
            >
                <ContactContextMenu contact={contact} onAction={handleContactAction}>
                    <Surface className="showcase__context-zone" elevation={1} shape="sm">
                        <Stack gap="xs">
                            <Text variant="label">{contact.name}</Text>
                            <Text variant="body-sm" tone="muted">
                                Right-click for profile, chat, delete, and block.
                            </Text>
                        </Stack>
                    </Surface>
                </ContactContextMenu>
            </Demo>

            <Demo
                title="Message context menu"
                description="A message row wrapped in the shared context menu, with copy, forward, and delete."
                code={messageMenuCode}
            >
                <MessageContextMenu message={message} self={false} onAction={handleMessageAction}>
                    <Surface className="showcase__context-zone" elevation={1} shape="sm">
                        <Stack gap="xs">
                            <Text variant="label">{message.author}</Text>
                            <Text variant="body-sm" tone="muted">
                                Right-click for copy, forward, favourite, quote, and delete.
                            </Text>
                        </Stack>
                    </Surface>
                </MessageContextMenu>
            </Demo>
        </>
    );
};

export default MessageMenusPage;
