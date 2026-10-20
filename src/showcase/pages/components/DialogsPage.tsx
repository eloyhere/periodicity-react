import {
    useState,
    type Dispatch,
    type FC,
    type ReactNode,
    type SetStateAction,
} from "react";
import { Inline, Stack } from "../../../arrange/layout";
import {
    Button,
    ConfirmDialog,
    Dialog,
    Drawer,
    InputDialog,
    MessageDialog,
    Radio,
    RadioGroup,
    Snackbar,
    TextInput,
} from "../../../component";
import Text from "../../../component/text/Text";
import { useToast } from "../../../component/toast/ToastContext";
import type { ToastApi } from "../../../component/toast/ToastContext";
import type { DialogSize, DrawerPlacement, DrawerSize, ToastTone } from "../../../component";
import Demo, { DemoGroup } from "../../Demo";

const dialogCode: string = `<Button onClick={() => setDialogOpen(true)}>Dialog</Button>

<Dialog
    open={dialogOpen}
    onClose={() => setDialogOpen(false)}
    size={dialogSize}
    title="New ritual"
    eyebrow="Ritual builder"
    description="A small loop, repeated with care."
    footer={
        <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Create ritual</Button>
        </>
    }
>
    <TextInput label="Ritual name" variant="outline" hint="Keep it short." autoFocus />
</Dialog>`;

const dialogSizesCode: string = `{["sm", "md", "lg"].map((size) => (
    <Button
        key={size}
        variant="outline"
        onClick={() => {
            setDialogSize(size);
            setDialogOpen(true);
        }}
    >
        {size} dialog
    </Button>
))}`;

const dialogFamilyCode: string = `<Button variant="outline" onClick={() => setConfirmOpen(true)}>Confirm</Button>
<Button variant="outline" onClick={() => setMessageOpen(true)}>Message</Button>
<Button variant="outline" onClick={() => setInputOpen(true)}>Input dialog</Button>

<ConfirmDialog
    open={confirmOpen}
    onClose={() => setConfirmOpen(false)}
    onConfirm={() => {
        setConfirmOpen(false);
        toast.show({ title: "Ritual archived", tone: "danger" });
    }}
    title="Archive this ritual?"
    description="You can restore it later from the archive."
    tone="danger"
    confirmLabel="Archive"
/>

<MessageDialog
    open={messageOpen}
    onClose={() => setMessageOpen(false)}
    title="All caught up"
    actionLabel="Nice"
    onAction={() => setMessageOpen(false)}
>
    <Text variant="body">Nothing else is due today. Rest is part of the rhythm.</Text>
</MessageDialog>

<InputDialog
    open={inputOpen}
    onClose={() => setInputOpen(false)}
    onSubmit={(value) => {
        setInputOpen(false);
        toast.show({ title: \`Added \${value}\` });
    }}
    title="Add a ritual"
    label="Ritual name"
    placeholder="Evening stretch"
    required
/>`;

const drawerCode: string = `<Button variant="outline" onClick={() => setDrawerOpen(true)}>Drawer</Button>

{["left", "right", "bottom"].map((placement) => (
    <Button
        key={placement}
        variant="outline"
        onClick={() => {
            setDrawerPlacement(placement);
            setDrawerOpen(true);
        }}
    >
        {placement}
    </Button>
))}
{["sm", "md", "lg"].map((size) => (
    <Button
        key={size}
        variant="ghost"
        onClick={() => {
            setDrawerSize(size);
            setDrawerOpen(true);
        }}
    >
        Drawer {size}
    </Button>
))}

<Drawer
    open={drawerOpen}
    onClose={() => setDrawerOpen(false)}
    placement={drawerPlacement}
    size={drawerSize}
    title="Ritual details"
    description="Everything about this small loop."
    footer={<Button onClick={() => setDrawerOpen(false)}>Done</Button>}
>
    <Stack gap="md">
        <Text variant="body">Morning pages · 07:30 · 20 min. Three pages, no editing.</Text>
        <RadioGroup label="Cadence" hint="Choose one." value={radioValue} onValueChange={setRadioValue}>
            <Radio value="daily" label="Daily" />
            <Radio value="weekly" label="Weekly" />
        </RadioGroup>
    </Stack>
</Drawer>`;

const snackbarCode: string = `<Button variant="outline" onClick={() => setSnackbarOpen(true)}>Snackbar</Button>

<Button
    variant="ghost"
    onClick={() => {
        toast.show({
            title: "Saved quietly",
            description: "Your ritual is part of the rhythm now.",
            tone: "success",
            action: {
                label: "Undo",
                onClick: () => toast.show({ title: "Undone" }),
            },
        });
    }}
>
    Show toast
</Button>

<Snackbar
    open={snackbarOpen}
    message="Saved quietly"
    actionLabel="Undo"
    onAction={() => toast.show({ title: "Snapshot restored" })}
    onClose={() => setSnackbarOpen(false)}
/>`;

const toastTonesCode: string = `{["neutral", "success", "warning", "danger"].map((tone) => (
    <Button
        key={tone}
        variant="ghost"
        onClick={() => {
            toast.show({
                title: \`\${tone} toast\`,
                description: "A brief Material notification.",
                tone,
            });
        }}
    >
        {tone}
    </Button>
))}`;

const dialogSizes: readonly DialogSize[] = ["sm", "md", "lg"];

const drawerPlacements: readonly DrawerPlacement[] = ["left", "right", "bottom"];

const drawerSizes: readonly DrawerSize[] = ["sm", "md", "lg"];

const toastTones: readonly ToastTone[] = ["neutral", "success", "warning", "danger"];

/**
 * Documents modal dialogs, drawers, snackbars, and toast tones.
 * @example
 * <DialogsPage />
 * @returns The Dialogs entry.
 */
const DialogsPage: FC = () => {
    const toast: ToastApi = useToast();
    const [dialogOpen, setDialogOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [confirmOpen, setConfirmOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [messageOpen, setMessageOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [inputOpen, setInputOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [drawerOpen, setDrawerOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [snackbarOpen, setSnackbarOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [dialogSize, setDialogSize]: [DialogSize, Dispatch<SetStateAction<DialogSize>>] =
        useState<DialogSize>("md");
    const [drawerPlacement, setDrawerPlacement]: [
        DrawerPlacement,
        Dispatch<SetStateAction<DrawerPlacement>>,
    ] = useState<DrawerPlacement>("right");
    const [drawerSize, setDrawerSize]: [DrawerSize, Dispatch<SetStateAction<DrawerSize>>] =
        useState<DrawerSize>("md");
    const [radioValue, setRadioValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("daily");

    return (
        <>
            <Demo
                title="Dialog"
                description="A modal layer with focus management, an eyebrow, and a footer slot."
                code={dialogCode}
            >
                <Inline gap="sm" wrap>
                    <Button onClick={(): void => setDialogOpen(true)}>Dialog</Button>
                </Inline>
            </Demo>

            <Demo title="Dialog sizes" code={dialogSizesCode}>
                <DemoGroup label="Dialog sizes">
                    {dialogSizes.map((size: DialogSize): ReactNode => (
                        <Button
                            key={size}
                            variant="outline"
                            onClick={(): void => {
                                setDialogSize(size);
                                setDialogOpen(true);
                            }}
                        >
                            {size} dialog
                        </Button>
                    ))}
                </DemoGroup>
            </Demo>

            <Demo
                title="Confirm, message, and input dialogs"
                description="Purpose-built modal variants for confirmation, announcements, and one-line input."
                code={dialogFamilyCode}
            >
                <Inline gap="sm" wrap>
                    <Button variant="outline" onClick={(): void => setConfirmOpen(true)}>
                        Confirm
                    </Button>
                    <Button variant="outline" onClick={(): void => setMessageOpen(true)}>
                        Message
                    </Button>
                    <Button variant="outline" onClick={(): void => setInputOpen(true)}>
                        Input dialog
                    </Button>
                </Inline>
            </Demo>

            <Demo
                title="Drawer"
                description="A side or bottom sheet with placement and size controls."
                code={drawerCode}
            >
                <DemoGroup label="Drawer placements and sizes">
                    <Button variant="outline" onClick={(): void => setDrawerOpen(true)}>
                        Drawer
                    </Button>
                    {drawerPlacements.map((placement: DrawerPlacement): ReactNode => (
                        <Button
                            key={placement}
                            variant="outline"
                            onClick={(): void => {
                                setDrawerPlacement(placement);
                                setDrawerOpen(true);
                            }}
                        >
                            {placement}
                        </Button>
                    ))}
                    {drawerSizes.map((size: DrawerSize): ReactNode => (
                        <Button
                            key={size}
                            variant="ghost"
                            onClick={(): void => {
                                setDrawerSize(size);
                                setDrawerOpen(true);
                            }}
                        >
                            Drawer {size}
                        </Button>
                    ))}
                </DemoGroup>
            </Demo>

            <Demo
                title="Snackbar and toasts"
                description="Transient messages with an optional action, plus the four toast tones."
                code={snackbarCode}
            >
                <DemoGroup label="Transient messages">
                    <Button variant="outline" onClick={(): void => setSnackbarOpen(true)}>
                        Snackbar
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={(): void => {
                            toast.show({
                                title: "Saved quietly",
                                description: "Your ritual is part of the rhythm now.",
                                tone: "success",
                                action: {
                                    label: "Undo",
                                    onClick: (): void => {
                                        toast.show({ title: "Undone" });
                                    },
                                },
                            });
                        }}
                    >
                        Show toast
                    </Button>
                </DemoGroup>
            </Demo>

            <Demo title="Toast tones" code={toastTonesCode}>
                <DemoGroup label="Toast tones">
                    {toastTones.map((tone: ToastTone): ReactNode => (
                        <Button
                            key={tone}
                            variant="ghost"
                            onClick={(): void => {
                                toast.show({
                                    title: `${tone} toast`,
                                    description: "A brief Material notification.",
                                    tone,
                                });
                            }}
                        >
                            {tone}
                        </Button>
                    ))}
                </DemoGroup>
            </Demo>

            <Dialog
                open={dialogOpen}
                onClose={(): void => setDialogOpen(false)}
                size={dialogSize}
                title="New ritual"
                eyebrow="Ritual builder"
                description="A small loop, repeated with care."
                footer={
                    <>
                        <Button variant="ghost" onClick={(): void => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={(): void => setDialogOpen(false)}>Create ritual</Button>
                    </>
                }
            >
                <TextInput label="Ritual name" variant="outline" hint="Keep it short." autoFocus />
            </Dialog>

            <ConfirmDialog
                open={confirmOpen}
                onClose={(): void => setConfirmOpen(false)}
                onConfirm={(): void => {
                    setConfirmOpen(false);
                    toast.show({ title: "Ritual archived", tone: "danger" });
                }}
                title="Archive this ritual?"
                description="You can restore it later from the archive."
                tone="danger"
                confirmLabel="Archive"
            />

            <MessageDialog
                open={messageOpen}
                onClose={(): void => setMessageOpen(false)}
                title="All caught up"
                actionLabel="Nice"
                onAction={(): void => setMessageOpen(false)}
            >
                <Text variant="body">Nothing else is due today. Rest is part of the rhythm.</Text>
            </MessageDialog>

            <InputDialog
                open={inputOpen}
                onClose={(): void => setInputOpen(false)}
                onSubmit={(value: string): void => {
                    setInputOpen(false);
                    toast.show({ title: `Added ${value}` });
                }}
                title="Add a ritual"
                label="Ritual name"
                placeholder="Evening stretch"
                required
            />

            <Drawer
                open={drawerOpen}
                onClose={(): void => setDrawerOpen(false)}
                placement={drawerPlacement}
                size={drawerSize}
                title="Ritual details"
                description="Everything about this small loop."
                footer={<Button onClick={(): void => setDrawerOpen(false)}>Done</Button>}
            >
                <Stack gap="md">
                    <Text variant="body">
                        Morning pages · 07:30 · 20 min. Three pages, no editing.
                    </Text>
                    <RadioGroup
                        label="Cadence"
                        hint="Choose one."
                        value={radioValue}
                        onValueChange={setRadioValue}
                    >
                        <Radio value="daily" label="Daily" />
                        <Radio value="weekly" label="Weekly" />
                    </RadioGroup>
                </Stack>
            </Drawer>

            <Snackbar
                open={snackbarOpen}
                message="Saved quietly"
                actionLabel="Undo"
                onAction={(): void => {
                    toast.show({ title: "Snapshot restored" });
                }}
                onClose={(): void => setSnackbarOpen(false)}
            />
        </>
    );
};

export default DialogsPage;
