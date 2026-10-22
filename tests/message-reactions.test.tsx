/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Chat from "../src/layout/chat/normal/Chat";
import VirtualChat from "../src/layout/chat/virtual/VirtualChat";
import type { ContactItem } from "../src/layout/contact/adapter";
import { defaultMessageReactions } from "../src/layout/message";
import type { MessageItem } from "../src/layout/message/adapter";
import MessageList from "../src/layout/message/normal/MessageList";
import VirtualMessageList from "../src/layout/message/virtual/VirtualMessageList";

const message: MessageItem = {
    id: "message-1",
    author: "You",
    content: "The new cycle view is ready for a first look.",
    timestamp: "09:34",
    self: true,
    status: "read",
};

describe("message reactions", (): void => {
    it("renders an inline radio group and reports the selected reaction", (): void => {
        const onReactionChange = vi.fn();

        render(
            <MessageList
                messages={[message]}
                currentUser="You"
                reactions={defaultMessageReactions}
                defaultReactions={{ [message.id]: "love" }}
                onReactionChange={onReactionChange}
            />,
        );

        const group: HTMLElement = screen.getByRole("radiogroup", { name: "Reactions" });
        const radios: HTMLElement[] = within(group).getAllByRole("radio");

        expect(radios).toHaveLength(6);
        expect(group.closest(".message__meta")).not.toBeNull();
        expect((screen.getByLabelText("Love") as HTMLInputElement).checked).toBe(true);
        expect((screen.getByLabelText("Like") as HTMLInputElement).checked).toBe(false);

        fireEvent.click(screen.getByLabelText("Like"));

        expect((screen.getByLabelText("Like") as HTMLInputElement).checked).toBe(true);
        expect((screen.getByLabelText("Love") as HTMLInputElement).checked).toBe(false);
        expect(onReactionChange).toHaveBeenCalledWith(message, "like");
    });

    it("opens the emoji picker and moves a chosen reaction into the inline group", (): void => {
        const onReactionChange = vi.fn();

        render(
            <MessageList
                messages={[message]}
                currentUser="You"
                reactions={defaultMessageReactions}
                onReactionChange={onReactionChange}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "More reactions" }));

        const picker: HTMLElement = screen.getByRole("radiogroup", {
            name: "More reactions",
        });

        expect(within(picker).getAllByRole("radio")).toHaveLength(
            defaultMessageReactions.length - 6,
        );

        fireEvent.click(within(picker).getByLabelText("Party"));

        expect(screen.queryByRole("radiogroup", { name: "More reactions" })).toBeNull();
        expect(onReactionChange).toHaveBeenCalledWith(message, "party");

        const group: HTMLElement = screen.getByRole("radiogroup", { name: "Reactions" });

        expect(within(group).getAllByRole("radio")).toHaveLength(7);
        expect((within(group).getByLabelText("Party") as HTMLInputElement).checked).toBe(true);
    });

    it("keeps virtual rows tall enough for timestamps and delivery state", (): void => {
        const { container, rerender } = render(
            <VirtualMessageList messages={[message]} currentUser="You" height={240} />,
        );

        expect(container.querySelector<HTMLElement>(".message")?.style.height).toBe("136px");
        expect(screen.getByLabelText("Read")).not.toBeNull();

        rerender(
            <VirtualMessageList
                messages={[message]}
                currentUser="You"
                height={240}
                reactions={defaultMessageReactions}
            />,
        );

        expect(container.querySelector<HTMLElement>(".message")?.style.height).toBe("136px");
        expect(screen.getByRole("radiogroup", { name: "Reactions" })).not.toBeNull();
    });

    it("keeps virtual reaction controls clickable without selecting the message", (): void => {
        const onMessageClick = vi.fn();
        const onReactionChange = vi.fn();

        render(
            <VirtualMessageList
                messages={[message]}
                currentUser="You"
                height={240}
                reactions={defaultMessageReactions}
                defaultReactions={{ [message.id]: "like" }}
                onMessageClick={onMessageClick}
                onReactionChange={onReactionChange}
            />,
        );

        fireEvent.click(screen.getByLabelText("Dislike"));

        expect(onReactionChange).toHaveBeenCalledWith(message, "dislike");
        expect(onMessageClick).not.toHaveBeenCalled();
    });

    it("forwards reactions into the chat transcript", (): void => {
        const contact: ContactItem = {
            id: "mira",
            name: "Mira Chen",
            description: "Product",
        };
        const chatMessage: MessageItem = {
            ...message,
            contactId: "mira",
        };
        const onReactionChange = vi.fn();

        render(
            <Chat
                contacts={[contact]}
                messages={[chatMessage]}
                defaultValue="mira"
                currentUser="You"
                reactions={defaultMessageReactions}
                defaultReactions={{ [chatMessage.id]: "like" }}
                onReactionChange={onReactionChange}
            />,
        );

        fireEvent.click(screen.getByLabelText("Dislike"));

        expect(onReactionChange).toHaveBeenCalledWith(chatMessage, "dislike");
    });

    it("keeps virtual chat timestamps visible at the default row height", (): void => {
        const contact: ContactItem = {
            id: "mira",
            name: "Mira Chen",
            description: "Product",
        };
        const peerMessage: MessageItem = {
            ...message,
            author: "Mira Chen",
            contactId: "mira",
            self: false,
            status: (void 0),
        };

        const { container } = render(
            <VirtualChat
                contacts={[contact]}
                messages={[peerMessage]}
                defaultValue="mira"
                currentUser="You"
                messageHeight={300}
            />,
        );

        const row: HTMLElement | null = container.querySelector<HTMLElement>(
            ".message-list--virtual .message",
        );

        expect(row?.style.height).toBe("136px");
        expect(row?.textContent).toContain("09:34");
    });
});
