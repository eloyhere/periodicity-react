import {
    useMemo,
    useState,
    type ChangeEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
} from "react";
import Button from "../../../component/button/Button";
import Dialog from "../../../component/dialog/Dialog";
import Icon from "../../../component/icon/Icon";
import Avatar from "../../../component/thumb/Avatar";
import VirtualContact from "../../contact/virtual/VirtualContact";
import VirtualMessageList from "../../message/virtual/VirtualMessageList";
import cx from "../../../component/foundation/cx";
import type { ContactItem } from "../../contact/adapter";
import type { ListEntry } from "../../list/adapter";
import type { MessageAdapter, MessageItem } from "../../message/adapter";
import type { ChatAdapter } from "../adapter";
import { conversationMessages, createChatAdapter } from "../adapter";
import "../Chat.css";

/**
 * Props for the virtual chat layout.
 * Type: interface.
 * Fields: contacts, messages, adapter, value, defaultValue, onContactSelect,
 * onSend, onForward, currentUser, contactHeight, contactItemHeight, messageHeight,
 * messageItemHeight, className.
 * @example
 * <VirtualChat contacts={contacts} messages={messages} height={320} />
 */
export interface VirtualChatProps {
    contacts?: readonly ContactItem[];
    messages?: readonly MessageItem[];
    adapter?: ChatAdapter;
    value?: string;
    defaultValue?: string;
    onContactSelect?: (contact: ContactItem) => void;
    onSend?: (body: string, contact: ContactItem) => void;
    onForward?: (messages: readonly MessageItem[], contact: ContactItem) => void;
    currentUser?: string;
    contactHeight?: number;
    contactItemHeight?: number;
    messageHeight?: number;
    messageItemHeight?: number;
    className?: string;
}

/**
 * Renders a two-pane chat with virtual contact and message windows.
 * @param props - Contacts, messages, active conversation, and window sizing.
 * @example
 * <VirtualChat contacts={contacts} messages={messages} />
 * @returns A virtualised chat layout.
 */
const VirtualChat: (props: VirtualChatProps) => ReactNode = ({
    contacts = [],
    messages = [],
    adapter,
    value,
    defaultValue,
    onContactSelect,
    onSend,
    onForward,
    currentUser = "",
    contactHeight = 320,
    contactItemHeight = 76,
    messageHeight = 360,
    messageItemHeight = 84,
    className = "",
}: VirtualChatProps): ReactNode => {
    const source: ChatAdapter = useMemo(
        (): ChatAdapter => adapter ?? createChatAdapter(contacts, messages),
        [adapter, contacts, messages],
    );
    const firstKey: string =
        source.contacts.size > 0 ? source.contacts.getKey(0) : "";
    const [internalValue, setInternalValue]: [string, (next: string) => void] =
        useState<string>(defaultValue ?? firstKey);
    // Contacts can arrive after the first render; fall back to the first conversation whenever the stored
    // key is empty or no longer present, so the transcript never stays blank.
    const internalActive: string =
        internalValue.length > 0 && source.contacts.indexOf(internalValue) >= 0
            ? internalValue
            : firstKey;
    const active: string = value ?? internalActive;
    const activeContact: ContactItem | null =
        source.contacts.indexOf(active) >= 0
            ? source.contacts.getItem(source.contacts.indexOf(active))
            : null;
    const transcript: MessageItem[] = useMemo(
        (): MessageItem[] => {
            const adapterForContact: MessageAdapter = conversationMessages(
                source.messages,
                active,
            );

            return adapterForContact
                .getRange(0, adapterForContact.size)
                .map((entry: ListEntry<MessageItem>): MessageItem => entry.item);
        },
        [source.messages, active],
    );
    const [draft, setDraft]: [string, (next: string) => void] = useState<string>("");
    const [quoted, setQuoted]: [
        MessageItem | null,
        (next: MessageItem | null) => void,
    ] = useState<MessageItem | null>(null);
    const [forwarding, setForwarding]: [
        readonly MessageItem[] | null,
        (next: readonly MessageItem[] | null) => void,
    ] = useState<readonly MessageItem[] | null>(null);
    const textOf: (content: ReactNode) => string = (content: ReactNode): string =>
        typeof content === "string" ? content : "";

    const choose: (contact: ContactItem) => void = (contact: ContactItem): void => {
        if (value === (void 0)) {
            setInternalValue(contact.id);
        }

        onContactSelect?.(contact);
    };

    const send: () => void = (): void => {
        if (draft.trim().length === 0 || activeContact === null) {
            return;
        }

        const quote: string =
            quoted === null
                ? ""
                : `> ${quoted.author}: ${textOf(quoted.content)}\n`;
        onSend?.(`${quote}${draft.trim()}`, activeContact);
        setDraft("");
        setQuoted(null);
    };

    return (
        <div className={cx("chat", "chat--virtual", className)}>
            <aside className="chat__contacts" aria-label="Conversations">
                <VirtualContact
                    adapter={source.contacts}
                    value={active}
                    onSelect={choose}
                    title="Conversations"
                    height={contactHeight}
                    itemHeight={contactItemHeight}
                />
            </aside>
            <section className="chat__main" aria-label="Conversation">
                {activeContact === null ? (
                    <div className="chat__empty">Select a conversation</div>
                ) : (
                    <>
                        <header className="chat__header">
                            <span className="chat__identity">
                                <span className="chat__name">{activeContact.name}</span>
                                {activeContact.description === (void 0) ? null : (
                                    <span className="chat__description">
                                        {activeContact.description}
                                    </span>
                                )}
                            </span>
                            <span
                                className="chat__presence"
                                data-presence={activeContact.presence ?? "offline"}
                            >
                                {activeContact.presence ?? "offline"}
                            </span>
                        </header>

                        <div className="chat__transcript">
                            <VirtualMessageList
                                messages={transcript}
                                currentUser={currentUser}
                                empty="Start the conversation"
                                height={messageHeight}
                                itemHeight={messageItemHeight}
                                onQuote={setQuoted}
                                onForward={setForwarding}
                            />
                        </div>

                        <footer className="chat__composer">
                            <div className="chat__compose">
                                {quoted === null ? null : (
                                    <div className="chat__quote">
                                        <Icon name="Reply" size={14} />
                                        <span className="chat__quote-author">
                                            {quoted.author}
                                        </span>
                                        <span className="chat__quote-text">
                                            {textOf(quoted.content)}
                                        </span>
                                        <button
                                            type="button"
                                            className="chat__quote-close"
                                            aria-label="Cancel quote"
                                            onClick={(): void => setQuoted(null)}
                                        >
                                            <Icon name="Close" size={13} />
                                        </button>
                                    </div>
                                )}
                                <textarea
                                    className="chat__input"
                                    rows={2}
                                    value={draft}
                                    placeholder={`Message ${activeContact.name}`}
                                    onChange={(
                                        event: ChangeEvent<HTMLTextAreaElement>,
                                    ): void => setDraft(event.target.value)}
                                    onKeyDown={(
                                        event: ReactKeyboardEvent<HTMLTextAreaElement>,
                                    ): void => {
                                        if (event.key === "Enter" && !event.shiftKey) {
                                            event.preventDefault();
                                            send();
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                size="sm"
                                variant="solid"
                                aria-label="Send message"
                                onClick={send}
                                disabled={draft.trim().length === 0}
                            >
                                <Icon name="Send" size={16} />
                            </Button>
                        </footer>
                    </>
                )}
            </section>

            <Dialog
                open={forwarding !== null}
                onClose={(): void => setForwarding(null)}
                title="Forward message"
                footer={
                    <Button variant="ghost" onClick={(): void => setForwarding(null)}>
                        Cancel
                    </Button>
                }
            >
                <div className="chat__forward-list">
                    {source.contacts
                        .getRange(0, source.contacts.size)
                        .map((entry: ListEntry<ContactItem>): ReactNode => (
                            <button
                                key={entry.key}
                                type="button"
                                className="chat__forward-target"
                                onClick={(): void => {
                                    if (forwarding !== null) {
                                        onForward?.(forwarding, entry.item);
                                    }

                                    setForwarding(null);
                                }}
                            >
                                <Avatar
                                    name={entry.item.name}
                                    src={entry.item.avatar}
                                    size="sm"
                                />
                                <span>{entry.item.name}</span>
                            </button>
                        ))}
                </div>
            </Dialog>
        </div>
    );
};

export default VirtualChat;
