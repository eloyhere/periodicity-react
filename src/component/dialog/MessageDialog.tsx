import type { FC, ReactElement, ReactNode } from "react";
import Button from "../button/Button";
import cx from "../foundation/cx";
import Dialog, { type DialogProps } from "./Dialog";
import { useInternational, type InternationalContextValue } from "../../international";
import "./MessageDialog.css";

/**
 * Props for the information dialog with one optional action.
 * Type: interface.
 * Fields: open, defaultOpen, onOpenChange, onClose, title, children, actionLabel, onAction,
 * className, plus all remaining dialog props and native dialog attributes.
 * @example
 * <MessageDialog open={open} onClose={close} title="Ritual saved" actionLabel="Got it">
 *     Your morning ritual is now on the calendar.
 * </MessageDialog>
 */
export interface MessageDialogProps
    extends Omit<DialogProps, "role" | "size" | "title" | "children" | "footer"> {
    title: string;
    children: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * Renders a short message with a single acknowledgement action.
 * The action calls `onAction`, when provided, and then asks the dialog to close.
 * Remaining dialog props (open state, close rules, native attributes, and refs) pass through
 * to the underlying dialog.
 * @param props - Open state, copy, and optional action callback.
 * @example
 * <MessageDialog open={open} onClose={close} title="Saved">
 *     The ritual is now on your calendar.
 * </MessageDialog>
 * @returns A dialog element.
 */
const MessageDialog: FC<MessageDialogProps> = ({
    open,
    onClose,
    title,
    children,
    actionLabel,
    onAction,
    className = "",
    ...rest
}: MessageDialogProps): ReactElement => {
    const { t }: InternationalContextValue = useInternational();
    const hasAction: boolean = actionLabel !== (void 0) || onAction !== (void 0);
    const actionText: string = actionLabel ?? t("ok");

    const handleAction: () => void = (): void => {
        if (onAction !== (void 0)) {
            onAction();
        }

        onClose("close-button");
    };

    return (
        <Dialog
            {...rest}
            open={open}
            onClose={onClose}
            title={title}
            className={cx("message-dialog", className)}
            size="sm"
            footer={
                hasAction ? (
                    <Button className="message-dialog__action" data-autofocus="true" onClick={handleAction}>
                        {actionText}
                    </Button>
                ) : (void 0)
            }
        >
            {children}
        </Dialog>
    );
};

export default MessageDialog;
