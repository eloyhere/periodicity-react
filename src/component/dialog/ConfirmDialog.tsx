import type { FC, ReactElement, ReactNode } from "react";
import Button from "../button/Button";
import cx from "../foundation/cx";
import Dialog from "./Dialog";
import "./ConfirmDialog.css";

/**
 * Visual tone of the confirmation action.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: ConfirmDialogTone = "danger";
 */
export type ConfirmDialogTone = "default" | "danger";

/**
 * Props for the confirmation dialog.
 * Type: interface.
 * Fields: open, onClose, onConfirm, title, description, confirmLabel, cancelLabel, tone, loading.
 * @example
 * <ConfirmDialog
 *     open={open}
 *     onClose={close}
 *     onConfirm={remove}
 *     title="Delete ritual?"
 *     tone="danger"
 * />
 */
export interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: ConfirmDialogTone;
    loading?: boolean;
}

/**
 * Renders a destructive or neutral confirmation with an alert dialog role.
 * @param props - Open state, callbacks, copy, tone, and loading flag.
 * @example
 * <ConfirmDialog
 *     open={open}
 *     onClose={close}
 *     onConfirm={confirm}
 *     title="Archive this ritual?"
 *     confirmLabel="Archive"
 * />
 * @returns An alert dialog element.
 */
const ConfirmDialog: FC<ConfirmDialogProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    tone = "default",
    loading = false,
}: ConfirmDialogProps): ReactElement => {
    const isDanger: boolean = tone === "danger";
    const cancelFocus: string | void = isDanger ? "true" : (void 0);
    const confirmFocus: string | void = isDanger ? (void 0) : "true";

    const handleConfirm: () => void = (): void => {
        if (loading) {
            return;
        }

        onConfirm();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={title}
            description={description}
            className="confirm-dialog"
            size="sm"
            role="alertdialog"
            footer={
                <>
                    <Button variant="ghost" data-autofocus={cancelFocus} onClick={onClose}>
                        {cancelLabel}
                    </Button>
                    <Button
                        className={cx("confirm-dialog__confirm", isDanger && "confirm-dialog__confirm--danger")}
                        data-autofocus={confirmFocus}
                        disabled={loading}
                        aria-busy={loading}
                        onClick={handleConfirm}
                    >
                        {loading ? <span className="confirm-dialog__spinner" aria-hidden="true" /> : null}
                        {confirmLabel}
                    </Button>
                    <span className="visually-hidden" role="status">
                        {loading ? "Processing" : ""}
                    </span>
                </>
            }
        >
            {null}
        </Dialog>
    );
};

export default ConfirmDialog;
