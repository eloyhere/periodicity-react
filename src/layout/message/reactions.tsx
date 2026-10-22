import {
    useId,
    useRef,
    useState,
    type Dispatch,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type RefObject,
    type SetStateAction,
} from "react";
import Icon from "../../component/icon/Icon";
import cx from "../../component/foundation/cx";
import Popover from "../../component/popover/Popover";
import { useInternational, type InternationalContextValue } from "../../international";
import {
    groupReactions,
    type MessageReactionOption,
    type ReactionGroup,
} from "./reactionOptions";

/**
 * Props for the message reaction bar.
 * Type: interface.
 * Fields: options, quickCount, selected, self, disabled, onChange.
 */
export interface MessageReactionsProps {
    /** Complete reaction set; the first choices stay inline. */
    options: readonly MessageReactionOption[];
    /** Number of inline choices, defaulting to six. */
    quickCount?: number;
    /** Currently selected reaction value. */
    selected?: string;
    /** Whether the owning message is on the current user's side. */
    self?: boolean;
    /** Disables every reaction control. */
    disabled?: boolean;
    /** Reports the newly selected reaction. */
    onChange: (value: string) => void;
}

/**
 * Props for one inline reaction radio.
 * Type: interface.
 * Fields: option, name, checked, disabled, onChange.
 */
interface ReactionRadioProps {
    option: MessageReactionOption;
    name: string;
    label: string;
    checked: boolean;
    disabled: boolean;
    onChange: (value: string) => void;
}

/**
 * Renders a single native radio backed by a native emoji.
 * @param props - Option, radio group name, selection state, disabled state, and change handler.
 * @example
 * <ReactionRadio option={option} name="reaction-1" checked={false} disabled={false} onChange={setReaction} />
 * @returns A label wrapping a visually hidden radio and its emoji.
 */
const ReactionRadio: (props: ReactionRadioProps) => ReactNode = ({
    option,
    name,
    label,
    checked,
    disabled,
    onChange,
}: ReactionRadioProps): ReactNode => (
    <label
        className={cx(
            "message-reactions__option",
            checked && "message-reactions__option--active",
        )}
        title={label}
    >
        <input
            className="message-reactions__input"
            type="radio"
            name={name}
            value={option.value}
            checked={checked}
            disabled={disabled}
            aria-label={label}
            onChange={(): void => onChange(option.value)}
        />
        <span className="message-reactions__emoji" aria-hidden="true">
            {option.emoji}
        </span>
    </label>
);

/**
 * Renders the Telegram-style reaction row under a bubble: a native radio group for
 * quick choices and a more button that opens the remaining emoji reactions.
 * @param props - Reaction choices, selected value, ownership, disabled state, and change handler.
 * @example
 * <MessageReactions options={defaultMessageReactions} selected="like" onChange={setReaction} />
 * @returns The reaction bar, including its portal-rendered picker when open.
 */
const MessageReactions: (props: MessageReactionsProps) => ReactNode = ({
    options,
    quickCount = 6,
    selected,
    self = false,
    disabled = false,
    onChange,
}: MessageReactionsProps): ReactNode => {
    const { t }: InternationalContextValue = useInternational();
    const radioName: string = useId();
    const moreRef: RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement>(null);
    const [open, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const inlineCount: number = Math.max(0, Math.min(quickCount, options.length));
    const quickOptions: readonly MessageReactionOption[] = options.slice(0, inlineCount);
    const selectedOption: MessageReactionOption | undefined = options.find(
        (option: MessageReactionOption): boolean => option.value === selected,
    );
    const barOptions: readonly MessageReactionOption[] =
        selectedOption !== (void 0) &&
        !quickOptions.some(
            (option: MessageReactionOption): boolean => option.value === selectedOption.value,
        )
            ? [...quickOptions, selectedOption]
            : quickOptions;
    const barValues: ReadonlySet<string> = new Set(
        barOptions.map((option: MessageReactionOption): string => option.value),
    );
    const remaining: readonly MessageReactionOption[] = options.filter(
        (option: MessageReactionOption): boolean => !barValues.has(option.value),
    );
    const remainingGroups: readonly ReactionGroup[] = groupReactions(remaining);
    const resolveLabel: (option: MessageReactionOption) => string = (
        option: MessageReactionOption,
    ): string =>
        option.labelKey === (void 0)
            ? (option.label ?? option.emoji)
            : t(option.labelKey);

    if (options.length === 0) {
        return null;
    }

    const select: (value: string) => void = (value: string): void => {
        onChange(value);
        setOpen(false);
    };

    const stopPropagation: (event: ReactMouseEvent<HTMLDivElement>) => void = (
        event: ReactMouseEvent<HTMLDivElement>,
    ): void => {
        event.stopPropagation();
    };

    return (
        <div className="message-reactions" onClick={stopPropagation}>
            <div
                className="message-reactions__group"
                role="radiogroup"
                aria-label={t("reactions")}
            >
                {barOptions.map((option: MessageReactionOption): ReactNode => (
                    <ReactionRadio
                        key={option.value}
                        option={option}
                        name={radioName}
                        label={resolveLabel(option)}
                        checked={option.value === selected}
                        disabled={disabled}
                        onChange={select}
                    />
                ))}
            </div>
            {remaining.length === 0 ? null : (
                <button
                    ref={moreRef}
                    type="button"
                    className="message-reactions__more"
                    aria-label={t("moreReactions")}
                    title={t("moreReactions")}
                    disabled={disabled}
                    onClick={(): void =>
                        setOpen((previous: boolean): boolean => !previous)
                    }
                >
                    <Icon name="More" size={14} aria-hidden="true" />
                </button>
            )}
            {remaining.length === 0 ? null : (
                <Popover
                    open={open}
                    onOpenChange={setOpen}
                    anchorRef={moreRef}
                    placement={self ? "top-end" : "top-start"}
                    className="message-reactions__panel"
                    role="group"
                    ariaLabel={t("moreReactions")}
                    surface={false}
                >
                    <div
                        className="message-reactions__picker"
                        role="radiogroup"
                        aria-label={t("moreReactions")}
                    >
                        {remainingGroups.map((group: ReactionGroup): ReactNode => {
                            const groupLabel: string =
                                group.labelKey === (void 0)
                                    ? (group.label ?? t("more"))
                                    : t(group.labelKey);

                            return (
                                <div
                                    className="message-reactions__pack"
                                    key={group.labelKey ?? group.label ?? "more"}
                                >
                                    <span className="message-reactions__pack-label">
                                        {groupLabel}
                                    </span>
                                    <div className="message-reactions__grid">
                                        {group.options.map(
                                            (option: MessageReactionOption): ReactNode => (
                                                <ReactionRadio
                                                    key={option.value}
                                                    option={option}
                                                    name={radioName}
                                                    label={resolveLabel(option)}
                                                    checked={option.value === selected}
                                                    disabled={disabled}
                                                    onChange={select}
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Popover>
            )}
        </div>
    );
};

export default MessageReactions;
