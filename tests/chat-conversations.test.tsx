import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Chat from "../src/layout/chat/normal/Chat";
import type { ChatConversation, ChatMessage } from "../src/layout/chat/model";
import { createChatDataSource } from "../src/layout/chat/model";

const conversations: readonly ChatConversation[] = [
    {
        id: "mira",
        name: "Mira Chen",
        presence: "online",
        preview: "Ready for review",
        timestamp: "10:07",
        unread: 3,
    },
    {
        id: "jonah",
        name: "Jonah Reed",
        preview: "Deploy finished",
        timestamp: "Yesterday",
    },
];

const messages: readonly ChatMessage[] = [
    {
        id: "m1",
        conversationId: "mira",
        author: "Mira Chen",
        content: "The cycle view is ready.",
        timestamp: "10:05",
    },
    {
        id: "m2",
        conversationId: "jonah",
        author: "Jonah Reed",
        content: "Deploy finished, logs attached.",
        timestamp: "Yesterday",
    },
];

describe("chat conversations", (): void => {
    it("renders previews, timestamps, and unread badges in the sidebar", (): void => {
        render(<Chat conversations={conversations} messages={messages} defaultValue="mira" />);

        expect(screen.getByText("Ready for review")).not.toBeNull();
        expect(screen.getByText("10:07")).not.toBeNull();
        expect(screen.getByText("3")).not.toBeNull();
        expect(screen.getByText("Yesterday")).not.toBeNull();
    });

    it("filters the transcript by conversationId", (): void => {
        render(<Chat conversations={conversations} messages={messages} defaultValue="mira" />);

        expect(screen.getByText("The cycle view is ready.")).not.toBeNull();
        expect(screen.queryByText("Deploy finished, logs attached.")).toBeNull();

        fireEvent.click(screen.getByRole("option", { name: /Jonah Reed/ }));

        expect(screen.getByText("Deploy finished, logs attached.")).not.toBeNull();
        expect(screen.queryByText("The cycle view is ready.")).toBeNull();
    });

    it("accepts an indexed data source", (): void => {
        render(
            <Chat
                dataSource={createChatDataSource(conversations, messages)}
                defaultValue="jonah"
            />,
        );

        expect(screen.getByText("Deploy finished, logs attached.")).not.toBeNull();
        expect(screen.getByText("Ready for review")).not.toBeNull();
    });

    it("forwards the contact context-menu choice", (): void => {
        const onContactAction: ReturnType<typeof vi.fn> = vi.fn();

        render(
            <Chat
                conversations={conversations}
                messages={messages}
                defaultValue="mira"
                onContactAction={onContactAction}
            />,
        );

        fireEvent.contextMenu(screen.getByRole("option", { name: /Mira Chen/ }));
        fireEvent.click(screen.getByText("Delete"));

        expect(onContactAction).toHaveBeenCalledWith(
            "delete",
            expect.objectContaining({ id: "mira" }),
        );
    });

    it("forwards the message context-menu choice", (): void => {
        const onMessageAction: ReturnType<typeof vi.fn> = vi.fn();

        render(
            <Chat
                conversations={conversations}
                messages={messages}
                defaultValue="mira"
                onMessageAction={onMessageAction}
            />,
        );

        fireEvent.contextMenu(screen.getByText("The cycle view is ready."));
        fireEvent.click(screen.getByText("Text"));

        expect(onMessageAction).toHaveBeenCalledWith(
            "copy-text",
            expect.objectContaining({ id: "m1" }),
        );
    });

    it("closes the message menu when the outside is pressed", (): void => {
        render(
            <Chat
                conversations={conversations}
                messages={messages}
                defaultValue="mira"
            />,
        );

        fireEvent.contextMenu(screen.getByText("The cycle view is ready."));

        expect(screen.getByRole("menu")).not.toBeNull();

        fireEvent.pointerDown(document.body);

        expect(screen.queryByRole("menu")).toBeNull();
    });
});
