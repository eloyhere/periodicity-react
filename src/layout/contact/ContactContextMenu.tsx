import type { FC, HTMLAttributes, ReactNode, Ref } from "react";
import ContextMenu, { ContextMenuItem } from "../../component/context/ContextMenu";
import type { IconName } from "../../component/icon/Icon";
import cx from "../../component/foundation/cx";
import type { ContactAction, ContactItem } from "./adapter";
import {
    useInternational,
    type CommonMessageKey,
    type InternationalContextValue,
} from "../../international";
import "./Contact.css";

/**
 * Presentation of one contact menu action.
 * Type: interface.
 * Fields: icon, labelKey, danger.
 * @example
 * const definition: ContactActionDefinition = ContactActionDefinitions.profile;
 */
interface ContactActionDefinition {
    icon: IconName;
    labelKey: CommonMessageKey;
    danger?: boolean;
}

/**
 * Canonical order of the contact menu actions.
 * Type: constant.
 * Fields: none.
 * @example
 * const actions = ContactActionOrder;
 */
const ContactActionOrder: readonly ContactAction[] = ["profile", "chat", "delete", "block"];

/**
 * Icon, label key, and tone of every contact menu action.
 * Type: constant.
 * Fields: profile, chat, delete, block.
 * @example
 * <ContextMenuItem icon={ContactActionDefinitions.profile.icon}>{t("profile")}</ContextMenuItem>
 */
const ContactActionDefinitions: Record<ContactAction, ContactActionDefinition> = {
    profile: { icon: "Profile", labelKey: "profile" },
    chat: { icon: "Chat", labelKey: "chat" },
    delete: { icon: "Close", labelKey: "delete", danger: true },
    block: { icon: "RemoveUser", labelKey: "block" },
};

/**
 * Props for the contact context-menu wrapper.
 * Type: interface.
 * Fields: contact, onAction, actions, disabled, open, defaultOpen, onOpenChange, longPress,
 * longPressDelay, header, empty, closeOnSelect, className, menuClassName, ariaLabel, children,
 * ref, plus native div attributes and events.
 * @example
 * <ContactContextMenu contact={contact} onAction={act}>...</ContactContextMenu>
 */
export interface ContactContextMenuProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    contact: ContactItem;
    onAction: (action: ContactAction, contact: ContactItem) => void;
    actions?: readonly ContactAction[];
    disabled?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    longPress?: boolean;
    longPressDelay?: number;
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
 * Wraps a contact row in the shared ContextMenu and supplies its menu slot.
 * @param props - Contact, action handler, menu content, menu state, and native zone attributes.
 * @example
 * <ContactContextMenu contact={contact} onAction={act}>...</ContactContextMenu>
 * @returns A right-click and long-press contact zone.
 */
const ContactContextMenu: FC<ContactContextMenuProps> = ({
    contact,
    onAction,
    actions = ContactActionOrder,
    disabled = false,
    open,
    defaultOpen,
    onOpenChange,
    longPress = true,
    longPressDelay,
    header,
    empty,
    closeOnSelect,
    className = "",
    menuClassName = "",
    ariaLabel,
    children,
    ref,
    ...rest
}: ContactContextMenuProps) => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedAriaLabel: string = ariaLabel ?? t("contactActions");
    const available: readonly ContactAction[] = ContactActionOrder.filter(
        (action: ContactAction): boolean => actions.includes(action),
    );
    const menu: ReactNode =
        available.length === 0
            ? (void 0)
            : available.map((action: ContactAction): ReactNode => {
                  const definition: ContactActionDefinition = ContactActionDefinitions[action];

                  return (
                      <ContextMenuItem
                          key={action}
                          icon={definition.icon}
                          danger={definition.danger === true}
                          onSelect={(): void => onAction(action, contact)}
                      >
                          {t(definition.labelKey)}
                      </ContextMenuItem>
                  );
              });

    return (
        <ContextMenu
            {...rest}
            ref={ref}
            className={cx("contact-menu-zone", className)}
            menuClassName={cx("contact-menu", menuClassName)}
            menu={menu}
            header={header ?? contact.name}
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

export default ContactContextMenu;
