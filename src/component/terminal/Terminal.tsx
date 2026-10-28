import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type ChangeEvent,
    type FC,
    type HTMLAttributes,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    type Ref,
    type RefObject,
} from "react";
import Button from "../button/Button";
import cx from "../foundation/cx";
import "./Terminal.css";

/**
 * Colour role of one terminal line.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: TerminalTone = "success";
 */
export type TerminalTone =
    | "default"
    | "muted"
    | "primary"
    | "secondary"
    | "tertiary"
    | "success"
    | "warning"
    | "danger";

/**
 * One line of terminal output.
 * Type: interface.
 * @param text - Line content, painted with preserved spacing.
 * @param tone - Semantic colour role of the text; defaults to `default`.
 * @param prompt - Shell prompt painted before the text; always uses the primary role.
 * @param meta - Muted annotation aligned to the end of the line, such as a duration or an exit code.
 * @example
 * const line: TerminalLine = { text: "built in 1.42s", tone: "success", meta: "exit 0" };
 */
export interface TerminalLine {
    readonly text: string;
    readonly tone?: TerminalTone;
    readonly prompt?: string;
    readonly meta?: string;
}

/**
 * Props for the Terminal component.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `style`, `aria-*`, `data-*`, and pointer, mouse,
 * keyboard, focus, and selection handlers are forwarded to the root element. `title` is the console
 * label rather than a tooltip, and `aria-label` overrides the label derived from it.
 * Native `onChange` and `onInput` are replaced by command callbacks: `onInput` reports every edit and
 * `onChange` reports the non-empty command submitted with Enter or the send button. The component
 * never executes a command; the caller runs it and appends the resulting output to `lines`.
 * @param lines - Transcript lines, either plain text or complete records.
 * @param title - Console label rendered in the chrome bar.
 * @param prompt - Prompt painted before transcript and command text; defaults to `$`.
 * @param busy - Disables the command input and shows a blinking cursor while a command runs.
 * @param wrap - Soft-wraps long lines instead of scrolling horizontally.
 * @param maxHeight - Height cap in pixels or any CSS length; the viewport then scrolls.
 * @param autoScroll - Keeps the newest line in view whenever the transcript grows.
 * @param live - Announces new lines politely through the log region.
 * @param controls - Paints the three decorative window dots in the chrome bar.
 * @param editable - Shows the command row; defaults to `true`.
 * @param value - Controlled command text.
 * @param defaultValue - Initial command text for an uncontrolled terminal.
 * @param history - Command history, oldest first, navigated with ArrowUp and ArrowDown.
 * @param onInput - Receives the current command text after every edit or history recall.
 * @param onChange - Receives the non-empty command submitted with Enter or the send button.
 * @param onHistoryChange - Receives the next history after a submission; omit to keep it internal.
 * @param inputLabel - Accessible name of the command input.
 * @param sendLabel - Accessible name of the icon-only send button; defaults to `Send command`.
 * @param children - Slot rendered after the transcript, before the command row.
 * @param className - Extra class names applied to the root element.
 * @param ref - Ref forwarded to the root element.
 * @example
 * <Terminal
 *     title="periodicity — dev"
 *     controls
 *     maxHeight={280}
 *     lines={lines}
 *     value={command}
 *     history={history}
 *     onInput={setCommand}
 *     onChange={runCommand}
 *     onHistoryChange={setHistory}
 *     sendLabel="Run command"
 * />
 * @example
 * <Terminal lines={["$ npm test", "12 passed", "0 failed"]} editable={false} aria-label="Test output" />
 */
export interface TerminalProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title" | "onChange" | "onInput"> {
    lines?: readonly (string | TerminalLine)[];
    title?: ReactNode;
    prompt?: string;
    busy?: boolean;
    wrap?: boolean;
    maxHeight?: number | string;
    autoScroll?: boolean;
    live?: boolean;
    controls?: boolean;
    editable?: boolean;
    value?: string;
    defaultValue?: string;
    history?: readonly string[];
    onInput?: (value: string) => void;
    onChange?: (command: string) => void;
    onHistoryChange?: (history: readonly string[]) => void;
    inputLabel?: string;
    sendLabel?: string;
    children?: ReactNode;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Style object that carries the viewport height cap next to native declarations.
 * Type: interface.
 * @param --terminal-max-height - Read by the scroll viewport as its `max-height`.
 * @example
 * const style: TerminalStyle = { "--terminal-max-height": "280px" };
 */
interface TerminalStyle extends CSSProperties {
    "--terminal-max-height"?: string;
}

/**
 * Prompt painted on the live row when the caller does not supply one.
 * Type: constant.
 * Fields: none.
 * @example
 * const prompt: string = DefaultPrompt;
 */
const DefaultPrompt: string = "$";

/**
 * Line list used when a Terminal renders only slot content.
 * Type: constant.
 * Fields: none.
 * @example
 * const lines: readonly (string | TerminalLine)[] = emptyLines;
 */
const emptyLines: readonly (string | TerminalLine)[] = [];

/**
 * Shared empty style object, so the merge below allocates only when a cap is set.
 * Type: constant.
 * Fields: none.
 * @example
 * const style: CSSProperties = emptyStyle;
 */
const emptyStyle: CSSProperties = {};

/**
 * Widens a shorthand line into the full record the renderer reads.
 * @param line - Plain text or a complete line record.
 * @example
 * const line: TerminalLine = normaliseLine("done");
 * @returns The line as a record.
 */
const normaliseLine: (line: string | TerminalLine) => TerminalLine = (
    line: string | TerminalLine,
): TerminalLine => (typeof line === "string" ? { text: line } : line);

/**
 * Renders a themed console transcript with an optional command row.
 *
 * The component owns no shell: it reports edits through `onInput` and non-empty submissions through
 * `onChange`, while the caller executes the command and appends its output to `lines`. Pass `history`
 * (oldest first) to navigate previous commands with ArrowUp and ArrowDown, and `onHistoryChange` to
 * persist the next history. Every surface, border, prompt, cursor, and line tone is painted with a
 * semantic colour role, so a light, dark, or named theme preset repaints the whole console.
 * The transcript is exposed as a labelled `log` region: new lines are announced only when `live` is
 * set, because streaming build output would otherwise flood assistive technology.
 * @param props - Transcript lines, command value and history, handlers, chrome label, prompt,
 * appearance flags, height cap, live mode, slot content, class names, and native div attributes.
 * @example
 * <Terminal title="build" controls lines={log} onChange={runCommand} history={history} busy={running} />
 * @returns A themed console panel with a scrollable transcript and command row.
 */
const Terminal: FC<TerminalProps> = ({
    lines = emptyLines,
    title,
    prompt = DefaultPrompt,
    busy = false,
    wrap = false,
    maxHeight,
    autoScroll = true,
    live = false,
    controls = false,
    editable,
    value,
    defaultValue = "",
    history,
    onInput,
    onChange,
    onHistoryChange,
    inputLabel,
    sendLabel,
    children,
    className = "",
    style,
    ref,
    "aria-label": ariaLabel,
    ...rest
}: TerminalProps) => {
    const viewportRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
    const [internalCommand, setInternalCommand]: [string, (next: string) => void] =
        useState<string>(defaultValue);
    const [internalHistory, setInternalHistory]: [
        readonly string[],
        (next: readonly string[]) => void,
    ] = useState<readonly string[]>([]);
    const historyEntries: readonly string[] = history ?? internalHistory;
    const historyIndexRef: RefObject<number> = useRef<number>(historyEntries.length);
    const command: string = value ?? internalCommand;
    const isEditable: boolean = editable ?? true;
    const entries: readonly TerminalLine[] = lines.map(normaliseLine);
    const lineCount: number = entries.length;
    const tail: string = lineCount === 0 ? "" : entries[lineCount - 1].text;
    const hasTitle: boolean =
        title !== (void 0) && title !== null && title !== false && title !== "";
    const label: string | undefined =
        ariaLabel ?? (hasTitle && typeof title === "string" ? title : (void 0));
    const commandLabel: string =
        inputLabel ?? (label === (void 0) ? "Terminal command" : `${label} command`);
    const resolvedSendLabel: string = sendLabel ?? "Send command";
    const cap: string | undefined =
        maxHeight === (void 0)
            ? (void 0)
            : typeof maxHeight === "number"
              ? `${maxHeight}px`
              : maxHeight;
    const terminalStyle: TerminalStyle = {
        ...(style ?? emptyStyle),
        ...(cap === (void 0) ? {} : { "--terminal-max-height": cap }),
    };

    useEffect((): void => {
        historyIndexRef.current = historyEntries.length;
    }, [historyEntries.length]);

    /**
     * Updates the command text and reports the edit to the caller.
     * @param next - New command text.
     * @example
     * updateCommand("ls -la");
     * @returns Nothing.
     */
    const updateCommand: (next: string) => void = (next: string): void => {
        if (value === (void 0)) {
            setInternalCommand(next);
        }

        onInput?.(next);
    };

    /**
     * Mirrors a native text edit into the command state.
     * @param event - Change event from the command input.
     * @example
     * <input onChange={handleCommandChange} />
     * @returns Nothing.
     */
    const handleCommandChange: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        updateCommand(event.target.value);
    };

    /**
     * Submits the current command, appends it to history, and clears an uncontrolled input.
     * @example
     * submitCommand();
     * @returns Nothing.
     */
    const submitCommand: () => void = (): void => {
        const submitted: string = command;

        if (submitted.trim().length === 0) {
            if (value === (void 0)) {
                setInternalCommand("");
            }

            return;
        }

        onChange?.(submitted);

        const last: string | undefined = historyEntries[historyEntries.length - 1];

        if (last !== submitted) {
            const nextHistory: readonly string[] = [...historyEntries, submitted];

            if (history === (void 0)) {
                setInternalHistory(nextHistory);
            }

            onHistoryChange?.(nextHistory);
        }

        if (value === (void 0)) {
            setInternalCommand("");
        }

        inputRef.current?.focus();
    };

    /**
     * Handles command submission and history navigation from the input.
     * @param event - Keyboard event from the command input.
     * @example
     * <input onKeyDown={handleCommandKeyDown} />
     * @returns Nothing.
     */
    const handleCommandKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void = (
        event: ReactKeyboardEvent<HTMLInputElement>,
    ): void => {
        if (event.nativeEvent.isComposing) {
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            submitCommand();
            return;
        }

        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
            return;
        }

        if (historyEntries.length === 0) {
            return;
        }

        event.preventDefault();

        const current: number = historyIndexRef.current;

        if (event.key === "ArrowUp") {
            const next: number = Math.max(0, Math.min(current, historyEntries.length) - 1);
            historyIndexRef.current = next;
            updateCommand(historyEntries[next]);
            return;
        }

        if (current >= historyEntries.length) {
            return;
        }

        const next: number = current + 1;
        historyIndexRef.current = next;
        updateCommand(next >= historyEntries.length ? "" : historyEntries[next]);
    };

    useEffect((): void => {
        const viewport: HTMLDivElement | null = viewportRef.current;

        if (viewport === null || !autoScroll) {
            return;
        }

        viewport.scrollTop = viewport.scrollHeight;
    }, [autoScroll, lineCount, tail]);

    return (
        <div
            {...rest}
            ref={ref}
            className={cx(
                "terminal",
                wrap && "terminal--wrap",
                isEditable && "terminal--editable",
                className,
            )}
            style={terminalStyle}
        >
            {hasTitle || controls ? (
                <div className="terminal__chrome">
                    {controls ? (
                        <span className="terminal__controls" aria-hidden="true">
                            <span className="terminal__dot terminal__dot--danger" />
                            <span className="terminal__dot terminal__dot--warning" />
                            <span className="terminal__dot terminal__dot--success" />
                        </span>
                    ) : null}
                    {hasTitle ? <span className="terminal__title">{title}</span> : null}
                </div>
            ) : null}

            <div
                ref={viewportRef}
                className="terminal__viewport"
                role="log"
                aria-live={live ? "polite" : "off"}
                aria-label={label}
                tabIndex={maxHeight === (void 0) ? (void 0) : 0}
            >
                <div className="terminal__body">
                    {entries.map(
                        (line: TerminalLine, index: number): ReactNode => (
                            <div key={`${index}`} className="terminal__line" data-tone={line.tone ?? "default"}>
                                {line.prompt === (void 0) || line.prompt.length === 0 ? null : (
                                    <span className="terminal__prompt" aria-hidden="true">
                                        {line.prompt}
                                    </span>
                                )}
                                <span className="terminal__text">{line.text}</span>
                                {line.meta === (void 0) || line.meta.length === 0 ? null : (
                                    <span className="terminal__meta">{line.meta}</span>
                                )}
                            </div>
                        ),
                    )}
                    {children}
                    {!isEditable && busy ? (
                        <div className="terminal__line terminal__line--live" data-tone="default">
                            {prompt.length === 0 ? null : (
                                <span className="terminal__prompt" aria-hidden="true">
                                    {prompt}
                                </span>
                            )}
                            <span className="terminal__cursor" aria-hidden="true" />
                        </div>
                    ) : null}
                </div>
            </div>

            {isEditable ? (
                <div className="terminal__command-bar">
                    <div
                        className="terminal__line terminal__line--live terminal__line--command"
                        data-tone="default"
                    >
                        {prompt.length === 0 ? null : (
                            <span className="terminal__prompt" aria-hidden="true">
                                {prompt}
                            </span>
                        )}
                        {busy ? (
                            <>
                                {command.length === 0 ? null : (
                                    <span className="terminal__text">{command}</span>
                                )}
                                <span className="terminal__cursor" aria-hidden="true" />
                            </>
                        ) : (
                            <>
                                <input
                                    ref={inputRef}
                                    className="terminal__input"
                                    type="text"
                                    value={command}
                                    aria-label={commandLabel}
                                    autoComplete="off"
                                    autoCapitalize="off"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    data-terminal-command="true"
                                    onChange={handleCommandChange}
                                    onKeyDown={handleCommandKeyDown}
                                />
                                <Button
                                    className="terminal__send"
                                    variant="quiet"
                                    size="sm"
                                    prefix="Send"
                                    aria-label={resolvedSendLabel}
                                    disabled={command.trim().length === 0}
                                    onClick={submitCommand}
                                />
                            </>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default Terminal;
