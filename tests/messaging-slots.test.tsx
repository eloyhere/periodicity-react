import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Chat from "../src/layout/chat/normal/Chat";
import Contact from "../src/layout/contact/normal/Contact";
import VirtualContact from "../src/layout/contact/virtual/VirtualContact";
import MessageList from "../src/layout/message/normal/MessageList";
import CommentThread from "../src/component/comment/normal/CommentThread";
import VirtualCommentThread from "../src/component/comment/virtual/VirtualCommentThread";
import type { ContactItem } from "../src/layout/contact/adapter";
import type { CommentData } from "../src/component/comment/types";
import type { MessageItem } from "../src/layout/message/adapter";

const contacts: readonly ContactItem[] = [
    { id: "mira", name: "Mira Chen", description: "Product" },
    { id: "jonah", name: "Jonah Reed", description: "Engineering" },
];

const messages: readonly MessageItem[] = [
    { id: "m1", author: "Mira", content: "Hello", timestamp: "09:41" },
    { id: "m2", author: "You", content: "Hi", timestamp: "09:42", self: true },
];

const comments: readonly CommentData[] = [
    { id: "c1", author: "Mira", content: "First note" },
    { id: "c2", author: "Jonah", content: "Second note", references: ["c1"] },
];

describe("messaging render slots", (): void => {
    it("renders contact rows and menus through the contact slots", (): void => {
        render(
            <Contact
                contacts={contacts}
                searchable={false}
                slots={{
                    contact: (index: number, contact: ContactItem) => (
                        <span data-testid={`contact-${index}`}>{`${contact.name} #${index}`}</span>
                    ),
                    context: (index: number, contact: ContactItem) => (
                        <div data-testid={`menu-${index}`}>{`Menu ${contact.name}`}</div>
                    ),
                }}
            />,
        );

        expect(screen.getByTestId("contact-0").textContent).toBe("Mira Chen #0");
        expect(screen.getByTestId("contact-1").textContent).toBe("Jonah Reed #1");

        fireEvent.contextMenu(screen.getByTestId("contact-0"));

        expect(screen.getByTestId("menu-0").textContent).toBe("Menu Mira Chen");
    });

    it("renders virtual contact rows with absolute indexes", (): void => {
        render(
            <VirtualContact
                contacts={contacts}
                searchable={false}
                height={200}
                itemHeight={80}
                slots={{
                    contact: (index: number, contact: ContactItem) => (
                        <span data-testid={`virtual-contact-${index}`}>{contact.name}</span>
                    ),
                }}
            />,
        );

        expect(screen.getByTestId("virtual-contact-0").textContent).toBe("Mira Chen");
        expect(screen.getByTestId("virtual-contact-1").textContent).toBe("Jonah Reed");
    });

    it("renders message avatars, bubbles, and menus through the message slots", (): void => {
        render(
            <MessageList
                messages={messages}
                currentUser="You"
                slots={{
                    avatar: (index: number, message: MessageItem) => (
                        <span data-testid={`avatar-${index}`}>{message.author.slice(0, 1)}</span>
                    ),
                    message: (index: number, message: MessageItem) => (
                        <span data-testid={`bubble-${index}`}>{`Slot ${message.content}`}</span>
                    ),
                    messageContext: (index: number, message: MessageItem) => (
                        <div data-testid={`message-menu-${index}`}>{`Menu ${message.id}`}</div>
                    ),
                }}
            />,
        );

        expect(screen.getByTestId("avatar-0").textContent).toBe("M");
        expect(screen.getByTestId("avatar-1").textContent).toBe("Y");
        expect(screen.getByTestId("bubble-0").textContent).toBe("Slot Hello");

        fireEvent.contextMenu(screen.getByTestId("bubble-0"));

        expect(screen.getByTestId("message-menu-0").textContent).toBe("Menu m1");
    });

    it("forwards contact and message slots through the chat layout", (): void => {
        render(
            <Chat
                contacts={contacts}
                messages={messages}
                defaultValue="mira"
                currentUser="You"
                slots={{
                    contact: (index: number, contact: ContactItem) => (
                        <span data-testid={`chat-contact-${index}`}>{contact.name}</span>
                    ),
                    message: (index: number, message: MessageItem) => (
                        <span data-testid={`chat-message-${index}`}>{message.content}</span>
                    ),
                    avatar: (index: number) => (
                        <span data-testid={`chat-avatar-${index}`} aria-hidden="true" />
                    ),
                }}
            />,
        );

        expect(screen.getByTestId("chat-contact-0").textContent).toBe("Mira Chen");
        expect(screen.getByTestId("chat-message-0").textContent).toBe("Hello");
        expect(screen.getByTestId("chat-avatar-0")).not.toBeNull();
    });

    it("replaces whole comment rows through the comment slot", (): void => {
        render(
            <CommentThread
                comments={comments}
                slots={{
                    comment: (index: number, comment: CommentData) => (
                        <div data-testid={`comment-${index}`}>{`${index}:${comment.author}`}</div>
                    ),
                }}
            />,
        );

        expect(screen.getByTestId("comment-0").textContent).toBe("0:Mira");
        expect(screen.getByTestId("comment-1").textContent).toBe("1:Jonah");
        expect(screen.queryByText("First note")).toBeNull();
    });

    it("renders virtual comment rows through the comment slot", (): void => {
        render(
            <VirtualCommentThread
                comments={comments}
                height={300}
                itemHeight={120}
                slots={{
                    comment: (index: number, comment: CommentData) => (
                        <div data-testid={`virtual-comment-${index}`}>{comment.author}</div>
                    ),
                }}
            />,
        );

        expect(screen.getByTestId("virtual-comment-0").textContent).toBe("Mira");
        expect(screen.getByTestId("virtual-comment-1").textContent).toBe("Jonah");
    });
});
