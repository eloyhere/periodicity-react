import type { ExtraMessageKey } from "../../international/extraMessages";

/**
 * One selectable message reaction.
 * Type: interface.
 * Fields: value, emoji, label, labelKey, group, groupKey.
 * @example
 * const reaction: MessageReactionOption = { value: "like", emoji: "👍", label: "Like" };
 */
export interface MessageReactionOption {
    /** Stable identifier reported by `onReactionChange`. */
    value: string;
    /** Native emoji rendered inside the reaction chip. */
    emoji: string;
    /** Accessible label and tooltip for custom options. */
    label?: string;
    /** Built-in translation key for the accessible label and tooltip. */
    labelKey?: ExtraMessageKey;
    /** Optional picker group heading for custom options. */
    group?: string;
    /** Built-in translation key for the picker group heading. */
    groupKey?: ExtraMessageKey;
}

/**
 * Default Telegram-style reaction set. The first six choices stay inline;
 * the rest appear in the picker opened by the more button.
 * @example
 * <MessageList messages={messages} reactions={defaultMessageReactions} />
 */
export const defaultMessageReactions: readonly MessageReactionOption[] = [
    { value: "like", emoji: "👍", labelKey: "reactionLike", groupKey: "reactionGroupGestures" },
    {
        value: "dislike",
        emoji: "👎",
        labelKey: "reactionDislike",
        groupKey: "reactionGroupGestures",
    },
    { value: "love", emoji: "❤️", labelKey: "reactionLove", groupKey: "reactionGroupExpressions" },
    { value: "laugh", emoji: "😂", labelKey: "reactionLaugh", groupKey: "reactionGroupExpressions" },
    {
        value: "surprised",
        emoji: "😮",
        labelKey: "reactionSurprised",
        groupKey: "reactionGroupExpressions",
    },
    { value: "sad", emoji: "😢", labelKey: "reactionSad", groupKey: "reactionGroupExpressions" },
    { value: "happy", emoji: "😊", labelKey: "reactionHappy", groupKey: "reactionGroupExpressions" },
    { value: "smile", emoji: "🙂", labelKey: "reactionSmile", groupKey: "reactionGroupExpressions" },
    { value: "cry", emoji: "😭", labelKey: "reactionCry", groupKey: "reactionGroupExpressions" },
    { value: "angry", emoji: "😠", labelKey: "reactionAngry", groupKey: "reactionGroupExpressions" },
    { value: "wink", emoji: "😉", labelKey: "reactionWink", groupKey: "reactionGroupExpressions" },
    { value: "sleep", emoji: "😴", labelKey: "reactionSleep", groupKey: "reactionGroupExpressions" },
    {
        value: "handshake",
        emoji: "🤝",
        labelKey: "reactionHandshake",
        groupKey: "reactionGroupGestures",
    },
    { value: "wave", emoji: "👋", labelKey: "reactionWave", groupKey: "reactionGroupGestures" },
    {
        value: "party",
        emoji: "🎉",
        labelKey: "reactionParty",
        groupKey: "reactionGroupCelebration",
    },
    {
        value: "firework",
        emoji: "🎆",
        labelKey: "reactionFirework",
        groupKey: "reactionGroupCelebration",
    },
    {
        value: "balloon",
        emoji: "🎈",
        labelKey: "reactionBalloon",
        groupKey: "reactionGroupCelebration",
    },
    {
        value: "sparkle",
        emoji: "✨",
        labelKey: "reactionSparkle",
        groupKey: "reactionGroupCelebration",
    },
    {
        value: "crown",
        emoji: "👑",
        labelKey: "reactionCrown",
        groupKey: "reactionGroupCelebration",
    },
    {
        value: "trophy",
        emoji: "🏆",
        labelKey: "reactionTrophy",
        groupKey: "reactionGroupCelebration",
    },
    { value: "gift", emoji: "🎁", labelKey: "reactionGift", groupKey: "reactionGroupCelebration" },
    { value: "cake", emoji: "🎂", labelKey: "reactionCake", groupKey: "reactionGroupCelebration" },
    {
        value: "rocket",
        emoji: "🚀",
        labelKey: "reactionRocket",
        groupKey: "reactionGroupCelebration",
    },
    { value: "star", emoji: "⭐", labelKey: "reactionStar", groupKey: "reactionGroupSymbols" },
    { value: "check", emoji: "✅", labelKey: "reactionCheck", groupKey: "reactionGroupSymbols" },
    { value: "cross", emoji: "❌", labelKey: "reactionCross", groupKey: "reactionGroupSymbols" },
    { value: "fire", emoji: "🔥", labelKey: "reactionFire", groupKey: "reactionGroupSymbols" },
    { value: "sun", emoji: "☀️", labelKey: "reactionSun", groupKey: "reactionGroupSymbols" },
    { value: "moon", emoji: "🌙", labelKey: "reactionMoon", groupKey: "reactionGroupSymbols" },
];

/**
 * One group of picker choices.
 * Type: interface.
 * Fields: label, labelKey, options.
 */
export interface ReactionGroup {
    label?: string;
    labelKey?: ExtraMessageKey;
    options: readonly MessageReactionOption[];
}

/**
 * Groups picker choices while preserving their declaration order.
 * @param options - Remaining reactions.
 * @example
 * const groups = groupReactions(defaultMessageReactions);
 * @returns Groups with a stable label and member list.
 */
export const groupReactions: (
    options: readonly MessageReactionOption[],
) => ReactionGroup[] = (options: readonly MessageReactionOption[]): ReactionGroup[] => {
    const groups: Map<string, ReactionGroup> = new Map();

    for (const option of options) {
        const groupKey: string = option.groupKey ?? option.group ?? "more";
        const existing: ReactionGroup | undefined = groups.get(groupKey);

        if (existing === (void 0)) {
            groups.set(groupKey, {
                label: option.group,
                labelKey: option.groupKey,
                options: [option],
            });
        } else {
            (existing.options as MessageReactionOption[]).push(option);
        }
    }

    return Array.from(groups.values());
};
