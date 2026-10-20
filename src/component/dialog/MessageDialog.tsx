import type { FC, ReactElement, ReactNode } from "react";
import Button from "../button/Button";
import Dialog from "./Dialog";
import "./MessageDialog.css";

/**
 * Props for the information dialog with one optional action.
 * Type: interface.
 * Fields: open, onClose, title, children, actionLabel, onAction.
 * @example
 * <MessageDialog open={open} onClose={close} title="Ritual saved" actionLabel="Got it">
 *     Your morning ritual is now on the calendar.
 * </MessageDialog>
 */
export interface MessageDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * Renders a short message with a single acknowledgement action.
 * The action calls `onAction`, when provided, and then closes the dialog.
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
}: MessageDialogProps): ReactElement => {
    const hasAction: boolean = actionLabel !== (void 0) || onAction !== (void 0);
    const actionText: string = actionLabel ?? "OK";

    const handleAction: () => void = (): void => {
        if (onAction !== (void 0)) {
            onAction();
        }

        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={title}
            className="message-dialog"
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
