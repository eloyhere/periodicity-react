import {
    useMemo,
    useState,
    type ChangeEvent,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    type Ref,
} from "react";
import Button from "../../../component/button/Button";
import Dialog from "../../../component/dialog/Dialog";
import Icon from "../../../component/icon/Icon";
import Avatar from "../../../component/thumb/Avatar";
import VirtualContact from "../../contact/virtual/VirtualContact";
import VirtualMessageList from "../../message/virtual/VirtualMessageList";
import cx from "../../../component/foundation/cx";
import type { ContactAction, ContactItem } from "../../contact/adapter";
import type { ListEntry } from "../../list/adapter";
import type { MessageAction, MessageAdapter, MessageItem } from "../../message/adapter";
import type { ChatAdapter } from "../adapter";
import { conversationMessages, createChatAdapter } from "../adapter";
import "../Chat.css";

/**
 * Props for the virtual chat layout.
 * Type: interface.
 * Fields: contacts, messages, adapter, value, defaultValue, onValueChange, onContactSelect,
 * onContactAction, onMessageAction, onQuote, onForward, onDelete, onRecall, onFavourite,
 * onCopyMessage, onSend, onDraftChange, onQuoteCancel, currentUser, contactsTitle,
 * contactsLabel, conversationLabel, empty, messageEmpty, placeholder, composerLabel, sendLabel,
 * contactHeight, contactItemHeight, messageHeight, messageItemHeight, contactsLoading, loading,
 * sending, disabled, className, ref, plus native div attributes and events.
 * @example
 * <VirtualChat contacts={contacts} messages={messages} height={320} />
 */
export interface VirtualChatProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    contacts?: readonly ContactItem[];
    messages?: readonly MessageItem[];
    adapter?: ChatAdapter;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string, contact: ContactItem | null) => void;
    onContactSelect?: (contact: ContactItem) => void;
    onContactAction?: (action: ContactAction, contact: ContactItem) => void;
    onMessageAction?: (action: MessageAction, message: MessageItem) => void;
    onQuote?: (message: MessageItem) => void;
    onForward?: (messages: readonly MessageItem[], contact: ContactItem) => void;
    onDelete?: (messages: readonly MessageItem[]) => void;
    onRecall?: (message: MessageItem) => void;
    onFavourite?: (message: MessageItem) => void;
    onCopyMessage?: (message: MessageItem, content: string) => void;
    onSend?: (body: string, contact: ContactItem) => void;
    onDraftChange?: (draft: string) => void;
    onQuoteCancel?: () => void;
    currentUser?: string;
    contactsTitle?: ReactNode;
    contactsLabel?: string;
    conversationLabel?: string;
    empty?: ReactNode;
    messageEmpty?: ReactNode;
    placeholder?: string;
    composerLabel?: string;
    sendLabel?: string;
    contactHeight?: number;
    contactItemHeight?: number;
    messageHeight?: number;
    messageItemHeight?: number;
    contactsLoading?: boolean;
    loading?: boolean;
    sending?: boolean;
    disabled?: boolean;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a two-pane chat with virtual contact and message windows.
 * @param props - Contacts, messages, active conversation, composer options, and window sizing.
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
    onValueChange,
    onContactSelect,
    onContactAction,
    onMessageAction,
    onQuote,
    onForward,
    onDelete,
    onRecall,
    onFavourite,
    onCopyMessage,
    onSend,
    onDraftChange,
    onQuoteCancel,
    currentUser = "",
    contactsTitle = "Conversations",
    contactsLabel = "Conversations",
    conversationLabel = "Conversation",
    empty = "Select a conversation",
    messageEmpty = "Start the conversation",
    placeholder,
    composerLabel = "Message",
    sendLabel = "Send message",
    contactHeight = 320,
    contactItemHeight = 76,
    messageHeight = 360,
    messageItemHeight = 84,
    contactsLoading = false,
    loading = false,
    sending = false,
    disabled = false,
    className = "",
    "aria-label": ariaLabel,
    ref,
    ...rest
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
        if (disabled) {
            return;
        }

        if (active !== contact.id) {
            if (value === (void 0)) {
                setInternalValue(contact.id);
            }

            onValueChange?.(contact.id, contact);
        }

        onContactSelect?.(contact);
    };

    const send: () => void = (): void => {
        if (disabled || sending || draft.trim().length === 0 || activeContact === null) {
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

    const cancelQuote: () => void = (): void => {
        setQuoted(null);
        onQuoteCancel?.();
    };

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("chat", "chat--virtual", className)}
            aria-label={ariaLabel ?? "Chat"}
            aria-busy={loading ? "true" : (void 0)}
            aria-disabled={disabled ? "true" : (void 0)}
        >
            <aside className="chat__contacts" aria-label={contactsLabel}>
                <VirtualContact
                    adapter={source.contacts}
                    value={active}
                    onSelect={choose}
                    onContactAction={onContactAction}
                    title={contactsTitle}
                    aria-label={contactsLabel}
                    listLabel={contactsLabel}
                    height={contactHeight}
                    itemHeight={contactItemHeight}
                    loading={contactsLoading}
                    disabled={disabled}
                />
            </aside>
            <section className="chat__main" aria-label={conversationLabel}>
                {activeContact === null ? (
                    <div className="chat__empty">{empty}</div>
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
                                height={messageHeight}
                                itemHeight={messageItemHeight}
                                loading={loading}
                                disabled={disabled}
                                empty={messageEmpty}
                                onMessageAction={onMessageAction}
                                onQuote={(message: MessageItem): void => {
                                    setQuoted(message);
                                    onQuote?.(message);
                                }}
                                onForward={setForwarding}
                                onDelete={onDelete}
                                onRecall={onRecall}
                                onFavourite={onFavourite}
                                onCopyMessage={onCopyMessage}
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
                                            disabled={disabled}
                                            onClick={cancelQuote}
                                        >
                                            <Icon name="Close" size={13} />
                                        </button>
                                    </div>
                                )}
                                <textarea
                                    className="chat__input"
                                    rows={2}
                                    value={draft}
                                    placeholder={placeholder ?? `Message ${activeContact.name}`}
                                    aria-label={composerLabel}
                                    disabled={disabled}
                                    onChange={(
                                        event: ChangeEvent<HTMLTextAreaElement>,
                                    ): void => {
                                        const next: string = event.target.value;
                                        setDraft(next);
                                        onDraftChange?.(next);
                                    }}
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
                                aria-label={sendLabel}
                                onClick={send}
                                disabled={disabled || sending || draft.trim().length === 0}
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
