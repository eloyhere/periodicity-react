import type { FC, HTMLAttributes, ReactNode, Ref } from "react";
import ContextMenu, {
    ContextMenuGroup,
    ContextMenuItem,
} from "../../component/context/ContextMenu";
import type { IconName } from "../../component/icon/Icon";
import cx from "../../component/foundation/cx";
import type { MessageAction, MessageItem } from "./adapter";
import {
    useInternational,
    type CommonMessageKey,
    type InternationalContextValue,
} from "../../international";
import "./Message.css";

/**
 * Presentation of one message menu action.
 * Type: interface.
 * Fields: icon, labelKey, danger.
 * @example
 * const definition: MessageActionDefinition = MessageActionDefinitions.copy;
 */
interface MessageActionDefinition {
    icon: IconName;
    labelKey: CommonMessageKey;
    danger?: boolean;
}

/**
 * Canonical order of the message menu actions.
 * Type: constant.
 * Fields: none.
 * @example
 * const actions = MessageActionOrder;
 */
const MessageActionOrder: readonly MessageAction[] = [
    "recall",
    "copy",
    "forward",
    "favourite",
    "select",
    "quote",
    "delete",
];

/**
 * Icon, label key, and tone of every message menu action.
 * Type: constant.
 * Fields: recall, copy, forward, favourite, select, quote, delete.
 * @example
 * <ContextMenuItem icon={MessageActionDefinitions.copy.icon}>{t("copy")}</ContextMenuItem>
 */
const MessageActionDefinitions: Record<MessageAction, MessageActionDefinition> = {
    recall: { icon: "Refresh", labelKey: "recall" },
    copy: { icon: "Clipboard", labelKey: "copy" },
    ["copy-text"]: { icon: "Document", labelKey: "copy" },
    ["copy-markdown"]: { icon: "Markdown", labelKey: "copy" },
    forward: { icon: "Forward", labelKey: "forward" },
    favourite: { icon: "Star", labelKey: "favourite" },
    select: { icon: "Select", labelKey: "multiSelect" },
    quote: { icon: "Reply", labelKey: "quote" },
    delete: { icon: "Close", labelKey: "delete", danger: true },
};

/**
 * Props for the message context-menu wrapper.
 * Type: interface.
 * Fields: message, self, onAction, actions, disabled, open, defaultOpen, onOpenChange, longPress,
 * longPressDelay, menu, header, empty, closeOnSelect, className, menuClassName, ariaLabel, children,
 * ref, plus native div attributes and events.
 * @example
 * <MessageContextMenu message={message} self={false} onAction={act}>...</MessageContextMenu>
 */
export interface MessageContextMenuProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    message: MessageItem;
    self: boolean;
    onAction: (action: MessageAction, message: MessageItem) => void;
    actions?: readonly MessageAction[];
    disabled?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    longPress?: boolean;
    longPressDelay?: number;
    /** Replaces the default action menu contents. */
    menu?: ReactNode;
    header?: ReactNode;
    empty?: ReactNode;
    closeOnSelect?: boolean;
    className?: string;
    menuClassName?: string;
    ariaLabel?: string;
    children: ReactNode;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Wraps a message row in the shared ContextMenu and supplies its menu slot.
 * @param props - Message, ownership, action handler, menu content, and native zone attributes.
 * @example
 * <MessageContextMenu message={message} self onAction={act}>...</MessageContextMenu>
 * @returns A right-click and long-press message zone.
 */
const MessageContextMenu: FC<MessageContextMenuProps> = ({
    message,
    self,
    onAction,
    actions = MessageActionOrder,
    disabled = false,
    open,
    defaultOpen,
    onOpenChange,
    longPress = true,
    longPressDelay,
    menu,
    header,
    empty,
    closeOnSelect,
    className = "",
    menuClassName = "",
    ariaLabel,
    children,
    ref,
    ...rest
}: MessageContextMenuProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedAriaLabel: string = ariaLabel ?? t("messageActions");
    const canCopyText: boolean =
        actions.includes("copy") || actions.includes("copy-text");
    const canCopyMarkdown: boolean =
        actions.includes("copy") || actions.includes("copy-markdown");
    const menuActions: readonly MessageAction[] = MessageActionOrder.filter(
        (action: MessageAction): boolean =>
            actions.includes(action) &&
            action !== "copy" &&
            action !== "copy-text" &&
            action !== "copy-markdown" &&
            action !== "recall" &&
            action !== "delete",
    );
    const dangerActions: readonly MessageAction[] = MessageActionOrder.filter(
        (action: MessageAction): boolean =>
            (action === "recall" || action === "delete") &&
            actions.includes(action) &&
            (action !== "recall" || self),
    );
    const renderAction: (action: MessageAction) => ReactNode = (
        action: MessageAction,
    ): ReactNode => {
        const definition: MessageActionDefinition = MessageActionDefinitions[action];

        return (
            <ContextMenuItem
                key={action}
                icon={definition.icon}
                danger={definition.danger === true}
                onSelect={(): void => onAction(action, message)}
            >
                {t(definition.labelKey)}
            </ContextMenuItem>
        );
    };
    const defaultMenu: ReactNode =
        !canCopyText && !canCopyMarkdown && menuActions.length === 0 && dangerActions.length === 0
            ? (void 0)
            : (
                  <>
                      {!canCopyText && !canCopyMarkdown ? null : (
                          <ContextMenuGroup label={t("copy")}>
                              {canCopyText ? (
                                  <ContextMenuItem
                                      icon="Document"
                                      onSelect={(): void => onAction("copy-text", message)}
                                  >
                                      {t("text")}
                                  </ContextMenuItem>
                              ) : null}
                              {canCopyMarkdown ? (
                                  <ContextMenuItem
                                      icon="Markdown"
                                      onSelect={(): void => onAction("copy-markdown", message)}
                                  >
                                      {t("markdown")}
                                  </ContextMenuItem>
                              ) : null}
                          </ContextMenuGroup>
                      )}
                      {menuActions.length === 0 ? null : (
                          <ContextMenuGroup label={t("actionsGroup")}>
                              {menuActions.map(renderAction)}
                          </ContextMenuGroup>
                      )}
                      {dangerActions.length === 0 ? null : (
                          <ContextMenuGroup label={t("danger")}>
                              {dangerActions.map(renderAction)}
                          </ContextMenuGroup>
                      )}
                  </>
              );

    return (
        <ContextMenu
            {...rest}
            ref={ref}
            className={cx("message-menu-zone", className)}
            menuClassName={cx("message-menu", menuClassName)}
            menu={menu ?? defaultMenu}
            header={header ?? (self ? t("yourMessage") : t("message"))}
            empty={empty}
            disabled={disabled}
            open={open}
            defaultOpen={defaultOpen}
            onOpenChange={onOpenChange}
            longPress={longPress}
            longPressDelay={longPressDelay}
            closeOnSelect={closeOnSelect}
            ariaLabel={resolvedAriaLabel}
        >
            {children}
        </ContextMenu>
    );
};

export default MessageContextMenu;
