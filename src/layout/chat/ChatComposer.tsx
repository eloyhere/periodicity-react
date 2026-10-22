import {
    useEffect,
    useId,
    useRef,
    useState,
    type ChangeEvent,
    type Dispatch,
    type FC,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    type RefObject,
    type SetStateAction,
} from "react";
import Button from "../../component/button/Button";
import Card from "../../component/card/Card";
import Icon from "../../component/icon/Icon";
import Popover from "../../component/popover/Popover";
import { useFilePick } from "../../component/picker/file/useFilePick";
import { useInternational, type InternationalContextValue } from "../../international";
import { ChatEmojis } from "./emojis";
import "./Chat.css";

/**
 * Toolbar actions exposed by the chat composer.
 * Type: type alias.
 * Fields: none.
 * @example
 * const action: ChatComposerAction = "emoji";
 */
export type ChatComposerAction = "emoji" | "file" | "screenshot";

/**
 * Quoted message shown above the composer input.
 * Type: interface.
 * Fields: author, text.
 * @example
 * const quote: ChatComposerQuote = { author: "Mira", text: "Hello" };
 */
export interface ChatComposerQuote {
    author: string;
    text: string;
}

/**
 * Props for the shared chat composer.
 * Type: interface.
 * Fields: value, placeholder, label, sendLabel, quoted, disabled, sending, onDraftChange,
 * onSend, onSendFiles, onQuoteCancel, onComposerAction.
 * @example
 * <ChatComposer value={draft} placeholder="Message" label="Message" sendLabel="Send"
 *     quoted={null} disabled={false} sending={false} onDraftChange={setDraft}
 *     onSend={send} onSendFiles={uploadFiles} onQuoteCancel={cancelQuote} />
 */
export interface ChatComposerProps {
    value: string;
    placeholder: string;
    label: string;
    sendLabel: string;
    quoted: ChatComposerQuote | null;
    disabled: boolean;
    sending: boolean;
    onDraftChange: (next: string) => void;
    onSend: () => void;
    /** Called with chosen files, or with a captured screenshot, before they are sent. */
    onSendFiles?: (files: readonly File[]) => void;
    onQuoteCancel: () => void;
    onComposerAction?: (action: ChatComposerAction) => void;
    /** Optional control rendered immediately before the send button. */
    accessory?: ReactNode;
}

/**
 * Captures the current screen through the browser display-capture API.
 * @example
 * const file = await captureScreen();
 * @returns A PNG file, or `null` when capture is unavailable or declined.
 */
const captureScreen: () => Promise<File | null> = async (): Promise<File | null> => {
    if (typeof navigator === "undefined" || navigator.mediaDevices === (void 0)) {
        return null;
    }

    const getDisplayMedia: (() => Promise<MediaStream>) | undefined =
        navigator.mediaDevices.getDisplayMedia;

    if (typeof getDisplayMedia !== "function") {
        return null;
    }

    let stream: MediaStream;

    try {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    } catch {
        return null;
    }

    try {
        const video: HTMLVideoElement = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;

        try {
            await video.play();
        } catch {
            // Autoplay may be blocked; the decoded frame is still available below.
        }

        if (video.videoWidth === 0 || video.videoHeight === 0) {
            return null;
        }

        const canvas: HTMLCanvasElement = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context: CanvasRenderingContext2D | null = canvas.getContext("2d");

        if (context === null) {
            return null;
        }

        context.drawImage(video, 0, 0);

        const blob: Blob | null = await new Promise<Blob | null>(
            (resolve: (value: Blob | null) => void): void => {
                canvas.toBlob(resolve, "image/png");
            },
        );

        if (blob === null) {
            return null;
        }

        return new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" });
    } finally {
        for (const track of stream.getTracks()) {
            track.stop();
        }
    }
};

/**
 * Renders the card composer: a borderless native textarea and a toolbar inside one frame,
 * with an emoji popover, native file selection, screen capture, and an icon send button.
 * @param props - Draft value, labels, quoted message, state, and handlers.
 * @example
 * <ChatComposer value={draft} placeholder="Message" label="Message" sendLabel="Send"
 *     quoted={null} disabled={false} sending={false} onDraftChange={setDraft}
 *     onSend={send} onSendFiles={uploadFiles} onQuoteCancel={cancelQuote} />
 * @returns A composer footer.
 */
const ChatComposer: FC<ChatComposerProps> = ({
    value,
    placeholder,
    label,
    sendLabel,
    quoted,
    disabled,
    sending,
    onDraftChange,
    onSend,
    onSendFiles,
    onQuoteCancel,
    onComposerAction,
    accessory,
}: ChatComposerProps) => {
    const { t }: InternationalContextValue = useInternational();
    const inputRef: RefObject<HTMLTextAreaElement | null> = useRef<HTMLTextAreaElement | null>(null);
    const cardRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const emojiButtonRef: RefObject<HTMLButtonElement | null> =
        useRef<HTMLButtonElement | null>(null);
    const emojiPanelId: string = useId();
    const pendingCaretRef: RefObject<number | null> = useRef<number | null>(null);
    const [emojiWidth, setEmojiWidth]: [number | void, Dispatch<SetStateAction<number | void>>] =
        useState<number | void>((void 0));
    const [emojiOpen, setEmojiOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const canSend: boolean = !disabled && !sending && value.trim().length > 0;
    const pickFiles: () => Promise<File[]> = useFilePick((void 0), {
        multiple: true,
        disabled,
    });

    useEffect((): void => {
        const node: HTMLTextAreaElement | null = inputRef.current;

        if (node === null) {
            return;
        }

        node.style.height = "auto";

        if (node.scrollHeight > 0) {
            node.style.height = `${Math.min(node.scrollHeight, 180)}px`;
        }
    }, [value]);

    // Restore the caret after an emoji is inserted into the controlled value.
    useEffect((): void => {
        const node: HTMLTextAreaElement | null = inputRef.current;
        const caret: number | null = pendingCaretRef.current;

        if (node === null || caret === null) {
            return;
        }

        node.focus({ preventScroll: true });
        node.setSelectionRange(caret, caret);
        pendingCaretRef.current = null;
    }, [value]);

    const handleChange: (event: ChangeEvent<HTMLTextAreaElement>) => void = (
        event: ChangeEvent<HTMLTextAreaElement>,
    ): void => {
        onDraftChange(event.target.value);
    };

    const handleKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void = (
        event: ReactKeyboardEvent<HTMLTextAreaElement>,
    ): void => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
        }
    };

    const toggleEmoji: () => void = (): void => {
        const next: boolean = !emojiOpen;

        if (next) {
            const width: number = cardRef.current?.clientWidth ?? 0;

            setEmojiWidth(width > 0 ? width : (void 0));
            onComposerAction?.("emoji");
        }

        setEmojiOpen(next);
    };

    const insertEmoji: (emoji: string) => void = (emoji: string): void => {
        const node: HTMLTextAreaElement | null = inputRef.current;
        const start: number = node === null ? value.length : (node.selectionStart ?? value.length);
        const end: number = node === null ? value.length : (node.selectionEnd ?? start);
        const next: string = `${value.slice(0, start)}${emoji}${value.slice(end)}`;

        pendingCaretRef.current = start + emoji.length;
        setEmojiOpen(false);
        onDraftChange(next);
    };

    const chooseFiles: () => Promise<void> = async (): Promise<void> => {
        const files: readonly File[] = await pickFiles();

        if (files.length > 0) {
            onSendFiles?.(files);
        }
    };

    const takeScreenshot: () => Promise<void> = async (): Promise<void> => {
        const file: File | null = await captureScreen();

        if (file !== null) {
            onSendFiles?.([file]);
        }
    };

    const runFileAction: () => void = (): void => {
        onComposerAction?.("file");
        void chooseFiles();
    };

    const runScreenshotAction: () => void = (): void => {
        onComposerAction?.("screenshot");
        void takeScreenshot();
    };

    return (
        <footer className="chat__composer">
            <Card ref={cardRef} className="chat__composer-card" ripple={false}>
                {quoted === null ? null : (
                    <div className="chat__quote">
                        <Icon name="Reply" size={14} />
                        <span className="chat__quote-author">{quoted.author}</span>
                        <span className="chat__quote-text">{quoted.text}</span>
                        <button
                            type="button"
                            className="chat__quote-close"
                            aria-label={t("cancelQuote")}
                            disabled={disabled}
                            onClick={onQuoteCancel}
                        >
                            <Icon name="Close" size={13} />
                        </button>
                    </div>
                )}
                <textarea
                    ref={inputRef}
                    className="chat__composer-input"
                    rows={3}
                    value={value}
                    placeholder={placeholder}
                    aria-label={label}
                    disabled={disabled}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />
                <div className="chat__composer-toolbar">
                    <div className="chat__composer-actions">
                        <button
                            ref={emojiButtonRef}
                            type="button"
                            className="chat__composer-action"
                            aria-label={t("emoji")}
                            disabled={disabled}
                            onClick={toggleEmoji}
                        >
                            <Icon name="Smile" size={18} />
                        </button>
                        <button
                            type="button"
                            className="chat__composer-action"
                            aria-label={t("files")}
                            disabled={disabled}
                            onClick={runFileAction}
                        >
                            <Icon name="Folder" size={18} />
                        </button>
                        <button
                            type="button"
                            className="chat__composer-action"
                            aria-label={t("screenshot")}
                            disabled={disabled}
                            onClick={runScreenshotAction}
                        >
                            <Icon name="Scissors" size={18} />
                        </button>
                    </div>
                    <div className="chat__composer-right">
                        {accessory}
                        <Button
                            className="chat__composer-send"
                            size="sm"
                            variant="solid"
                            aria-label={sendLabel}
                            disabled={!canSend}
                            onClick={onSend}
                        >
                            <Icon name="Send" size={16} />
                        </Button>
                    </div>
                </div>
            </Card>
            <Popover
                anchorRef={emojiButtonRef}
                open={emojiOpen}
                onOpenChange={setEmojiOpen}
                placement="top-start"
                ariaLabel={t("emoji")}
                className="chat__emoji-popover"
                style={emojiWidth === (void 0) ? (void 0) : { width: emojiWidth }}
            >
                <div className="chat__emoji-grid" id={emojiPanelId} role="group">
                    {ChatEmojis.map(
                        (emoji: string): ReactNode => (
                            <button
                                key={emoji}
                                type="button"
                                className="chat__emoji"
                                onClick={(): void => insertEmoji(emoji)}
                            >
                                {emoji}
                            </button>
                        ),
                    )}
                </div>
            </Popover>
        </footer>
    );
};

export default ChatComposer;
