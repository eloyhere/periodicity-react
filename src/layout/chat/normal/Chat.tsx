import {
    useMemo,
    useState,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
import Button from "../../../component/button/Button";
import Dialog from "../../../component/dialog/Dialog";
import Avatar from "../../../component/thumb/Avatar";
import Contact from "../../contact/normal/Contact";
import MessageList from "../../message/normal/MessageList";
import type { MessageReactionOption } from "../../message/reactionOptions";
import cx from "../../../component/foundation/cx";
import type { ContactAction, ContactItem } from "../../contact/adapter";
import type { ListEntry } from "../../list/adapter";
import type { MessageAction, MessageAdapter, MessageItem } from "../../message/adapter";
import type { ChatAdapter } from "../adapter";
import { conversationMessages } from "../adapter";
import ChatComposer, { type ChatComposerAction } from "../ChatComposer";
import ConversationRow from "../ConversationRow";
import type {
    ChatConversation,
    ChatDataSource,
    ChatDataSourceAdapter,
} from "../model";
import { useChatSource, type ChatSource } from "../useChatSource";
import type { ChatSlots } from "../slots";
import type { ContactSlots } from "../../contact/slots";
import type { MessageSlots } from "../../message/slots";
import { useInternational, type InternationalContextValue } from "../../../international";
import "../Chat.css";

/**
 * Props for the normal chat layout.
 * Type: interface.
 * Fields: contacts, messages, adapter, value, defaultValue, onValueChange, onContactSelect,
 * onContactAction, onMessageAction, onQuote, onForward, onDelete, onRecall, onFavourite,
 * onCopyMessage, onSend, onDraftChange, onQuoteCancel, currentUser, contactsTitle,
 * contactsLabel, conversationLabel, empty, messageEmpty, placeholder, composerLabel, sendLabel,
 * reactions, quickReactionCount, defaultReactions, onReactionChange, onComposerAction,
 * contactsLoading, loading, sending, disabled, slots, className, ref, plus native div attributes and
 * events.
 * @example
 * <Chat contacts={contacts} messages={messages} onSend={sendMessage} />
 */
export interface ChatProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    contacts?: readonly ContactItem[];
    /** Recent conversations shown on the left; replaces `contacts` when supplied. */
    conversations?: readonly ChatConversation[];
    messages?: readonly MessageItem[];
    /** Plain or indexed chat data source; wins over `conversations` and `messages`. */
    dataSource?: ChatDataSource | ChatDataSourceAdapter;
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
    /** Called with files chosen from the composer, including captured screenshots. */
    onSendFiles?: (files: readonly File[], contact: ContactItem) => void;
    onDraftChange?: (draft: string) => void;
    onQuoteCancel?: () => void;
    currentUser?: string;
    /** Heading above the contact column; defaults to the localised Conversations label. */
    contactsTitle?: ReactNode;
    /** Accessible name of the contact column; defaults to the localised Conversations label. */
    contactsLabel?: string;
    /** Search placeholder in the contact or history pane. */
    contactsSearchPlaceholder?: string;
    /** Accessible name of the contact or history search field. */
    contactsSearchLabel?: string;
    /** Accessible name of the conversation pane; defaults to the localised Conversation label. */
    conversationLabel?: string;
    /** Empty conversation pane copy; defaults to the localised Select a conversation label. */
    empty?: ReactNode;
    /** Copy for a conversation without messages; defaults to the localised Start the conversation label. */
    messageEmpty?: ReactNode;
    /** Composer placeholder; defaults to the localised Message template filled with the contact name. */
    placeholder?: string;
    /** Accessible name of the composer; defaults to the localised Message label. */
    composerLabel?: string;
    /** Accessible name of the send button; defaults to the localised Send message label. */
    sendLabel?: string;
    /** Reaction choices forwarded to the transcript; omit to hide reactions. */
    reactions?: readonly MessageReactionOption[];
    /** Number of reaction choices kept inline before the more button. Defaults to 6. */
    quickReactionCount?: number;
    /** Initial reaction values keyed by message id for uncontrolled transcripts. */
    defaultReactions?: Readonly<Record<string, string>>;
    /** Reports a reaction change for one transcript message. */
    onReactionChange?: (message: MessageItem, reaction: string) => void;
    /** Called when one of the composer toolbar icons is activated. */
    onComposerAction?: (action: ChatComposerAction) => void;
    /** Optional control rendered immediately before the send button. */
    composerAccessory?: ReactNode;
    contactsLoading?: boolean;
    loading?: boolean;
    sending?: boolean;
    disabled?: boolean;
    /** Contact and message render slots; forwarded to the contact pane and transcript. */
    slots?: ChatSlots;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a two-pane chat with contacts, transcript, and composer.
 * @param props - Contacts, messages, active conversation, composer options, and send handler.
 * @example
 * <Chat contacts={contacts} messages={messages} onSend={sendMessage} />
 * @returns A chat layout.
 */
const Chat: (props: ChatProps) => ReactNode = ({
    contacts = [],
    conversations,
    messages = [],
    dataSource,
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
    onSendFiles,
    onDraftChange,
    onQuoteCancel,
    currentUser = "",
    contactsTitle,
    contactsLabel,
    contactsSearchPlaceholder,
    contactsSearchLabel,
    conversationLabel,
    empty,
    messageEmpty,
    placeholder,
    composerLabel,
    sendLabel,
    reactions,
    quickReactionCount = 6,
    defaultReactions,
    onReactionChange,
    onComposerAction,
    composerAccessory,
    contactsLoading = false,
    loading = false,
    sending = false,
    disabled = false,
    slots,
    className = "",
    "aria-label": ariaLabel,
    ref,
    ...rest
}: ChatProps): ReactNode => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedContactsTitle: ReactNode = contactsTitle ?? t("conversations");
    const resolvedContactsLabel: string = contactsLabel ?? t("conversations");
    const resolvedConversationLabel: string = conversationLabel ?? t("conversation");
    const resolvedSendLabel: string = sendLabel ?? t("sendMessage");
    const resolvedEmpty: ReactNode = empty ?? t("selectConversation");
    const resolvedMessageEmpty: ReactNode = messageEmpty ?? t("startConversation");
    const resolvedComposerLabel: string = composerLabel ?? t("message");
    const chatSource: ChatSource = useChatSource({
        dataSource,
        conversations,
        messages,
        contacts,
        adapter,
    });
    const source: ChatAdapter = chatSource.adapter;
    const { conversationById }: ChatSource = chatSource;
    const firstKey: string =
        source.contacts.size > 0 ? source.contacts.getKey(0) : "";
    const [internalValue, setInternalValue]: [string, (next: string) => void] =
        useState<string>(defaultValue ?? firstKey);
    const active: string = value ?? internalValue;
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
    const conversationSlot: (index: number, contact: ContactItem) => ReactNode = (
        index: number,
        contact: ContactItem,
    ): ReactNode => {
        void index;
        const conversation: ChatConversation | undefined = conversationById.get(contact.id);

        return conversation === (void 0) ? (
            <>{contact.name}</>
        ) : (
            <ConversationRow conversation={conversation} />
        );
    };
    const contactSlot: ((index: number, contact: ContactItem) => ReactNode) | void =
        slots?.contact ?? (conversationById.size > 0 ? conversationSlot : (void 0));
    const contactSlots: ContactSlots | undefined =
        contactSlot === (void 0) && slots?.contactContext === (void 0)
            ? (void 0)
            : {
                  contact: contactSlot === (void 0) ? (void 0) : contactSlot,
                  context: slots?.contactContext,
              };

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("chat", className)}
            aria-label={ariaLabel ?? t("chat")}
            aria-busy={loading ? "true" : (void 0)}
            aria-disabled={disabled ? "true" : (void 0)}
        >
            <aside className="chat__contacts" aria-label={resolvedContactsLabel}>
                <Contact
                    adapter={source.contacts}
                    value={active}
                    onSelect={choose}
                    onContactAction={onContactAction}
                    title={resolvedContactsTitle}
                    aria-label={resolvedContactsLabel}
                    listLabel={resolvedContactsLabel}
                    searchPlaceholder={contactsSearchPlaceholder}
                    searchLabel={contactsSearchLabel}
                    loading={contactsLoading}
                    disabled={disabled}
                    slots={contactSlots}
                />
            </aside>
            <section className="chat__main" aria-label={resolvedConversationLabel}>
                {activeContact === null ? (
                    <div className="chat__empty">{resolvedEmpty}</div>
                ) : (
                    <>
                        <header className="chat__header">
                            {slots?.header === (void 0) ? (
                                <>
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
                                        {t(activeContact.presence ?? "offline")}
                                    </span>
                                </>
                            ) : (
                                slots.header(activeContact)
                            )}
                        </header>

                        <div className="chat__transcript">
                            <MessageList
                                messages={transcript}
                                currentUser={currentUser}
                                reactions={reactions}
                                quickReactionCount={quickReactionCount}
                                defaultReactions={defaultReactions}
                                onReactionChange={onReactionChange}
                                loading={loading}
                                disabled={disabled}
                                empty={resolvedMessageEmpty}
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
                                slots={
                                    slots === (void 0)
                                        ? (void 0)
                                        : {
                                              message: slots.message,
                                              beforeMessage: slots.beforeMessage,
                                              messageContext: slots.messageContext,
                                              avatar: slots.avatar,
                                          } satisfies MessageSlots
                                }
                            />
                        </div>

                        <ChatComposer
                            value={draft}
                            placeholder={
                                placeholder ??
                                t("messagePlaceholder", { name: activeContact.name })
                            }
                            label={resolvedComposerLabel}
                            sendLabel={resolvedSendLabel}
                            quoted={
                                quoted === null
                                    ? null
                                    : {
                                          author: quoted.author,
                                          text: textOf(quoted.content),
                                      }
                            }
                            disabled={disabled}
                            sending={sending}
                            onDraftChange={(next: string): void => {
                                setDraft(next);
                                onDraftChange?.(next);
                            }}
                            onSend={send}
                            onQuoteCancel={cancelQuote}
                            onSendFiles={(files: readonly File[]): void => {
                                if (activeContact !== null) {
                                    onSendFiles?.(files, activeContact);
                                }
                            }}
                            onComposerAction={onComposerAction}
                            accessory={composerAccessory}
                        />
                    </>
                )}
            </section>

            <Dialog
                open={forwarding !== null}
                onClose={(): void => setForwarding(null)}
                title={t("forwardMessage")}
                footer={
                    <Button variant="ghost" onClick={(): void => setForwarding(null)}>
                        {t("cancel")}
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

export default Chat;
