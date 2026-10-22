/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Chat from "../src/layout/chat/normal/Chat";
import type { ContactItem } from "../src/layout/contact/adapter";
import type { MessageItem } from "../src/layout/message/adapter";

vi.mock("../src/component/picker/file/useFilePick", () => ({
    useFilePick: () => async () => [new File(["note"], "note.txt", { type: "text/plain" })],
}));

const contacts: readonly ContactItem[] = [
    { id: "mira", name: "Mira Chen", description: "Product", presence: "online" },
];

const messages: readonly MessageItem[] = [
    { id: "m1", author: "Mira", content: "Hello", timestamp: "09:41" },
];

const renderChat = (onSend = vi.fn(), onSendFiles = vi.fn()) => {
    const view = render(
        <Chat
            contacts={contacts}
            messages={messages}
            defaultValue="mira"
            currentUser="You"
            onSend={onSend}
            onSendFiles={onSendFiles}
        />,
    );

    return { ...view, onSend, onSendFiles };
};

describe("chat composer", (): void => {
    it("renders a borderless textarea and three toolbar icons inside the card", (): void => {
        const { container } = renderChat();
        const card = container.querySelector(".chat__composer-card");

        expect(card).not.toBeNull();
        expect(card?.querySelector(".chat__composer-input")).not.toBeNull();
        expect(card?.querySelectorAll(".chat__composer-action")).toHaveLength(3);
        expect(screen.getByLabelText("Emoji")).not.toBeNull();
        expect(screen.getByLabelText("Files")).not.toBeNull();
        expect(screen.getByLabelText("Screenshot")).not.toBeNull();
    });

    it("opens an emoji popover and inserts the chosen emoji at the caret", (): void => {
        renderChat();
        const input = screen.getByRole("textbox") as HTMLTextAreaElement;

        fireEvent.change(input, { target: { value: "Hi" } });
        input.setSelectionRange(2, 2);

        fireEvent.click(screen.getByLabelText("Emoji"));

        const grid = document.querySelector(".chat__emoji-grid");

        expect(grid).not.toBeNull();

        fireEvent.click(screen.getByText("😀"));

        expect(input.value).toBe("Hi😀");
        expect(document.querySelector(".chat__emoji-grid")).toBeNull();
    });

    it("sends chosen files through onSendFiles", async (): Promise<void> => {
        const { onSendFiles } = renderChat();

        fireEvent.click(screen.getByLabelText("Files"));

        await waitFor((): void => {
            expect(onSendFiles).toHaveBeenCalledTimes(1);
        });

        const [files, contact] = onSendFiles.mock.calls[0] as [readonly File[], ContactItem];

        expect(files[0].name).toBe("note.txt");
        expect(contact.id).toBe("mira");
    });

    it("sends the typed draft from the send button", (): void => {
        const { onSend } = renderChat();
        const input = screen.getByRole("textbox");
        const send = screen.getByLabelText("Send message") as HTMLButtonElement;

        expect(send.disabled).toBe(true);

        fireEvent.change(input, { target: { value: "On my way" } });
        expect(send.disabled).toBe(false);

        fireEvent.click(send);

        expect(onSend).toHaveBeenCalledWith("On my way", expect.objectContaining({ id: "mira" }));
    });
});
