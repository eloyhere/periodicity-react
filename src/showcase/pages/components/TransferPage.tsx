import {
    useState,
    type Dispatch,
    type FC,
    type SetStateAction,
} from "react";
import { Columns, Stack } from "../../../arrange/layout";
import { Transfer } from "../../../component";
import Text from "../../../component/text/Text";
import Demo from "../../Demo";
import { transferItems, virtualTransferItems } from "../../samples";

const transferCode: string = `<Transfer
    items={transferItems}
    value={assigned}
    onChange={(next) => setAssigned([...next])}
    titles={["Available", "Assigned"]}
/>

<Transfer
    items={virtualTransferItems}
    value={virtualAssigned}
    onChange={(next) => setVirtualAssigned([...next])}
    titles={["Available · virtual", "Assigned · virtual"]}
    virtual
    listHeight={240}
/>`;

const statesCode: string = `<Transfer
    items={transferItems}
    value={assigned}
    onChange={(next) => setAssigned([...next])}
    titles={["Available", "Assigned"]}
    disabled
/>

<Transfer
    items={[]}
    value={[]}
    onChange={() => {}}
    titles={["Source", "Target"]}
    searchable={false}
    emptySource="No people available"
    emptyTarget="No people selected"
/>`;

/**
 * Documents two-pane selection backed by list adapters.
 * @example
 * <TransferPage />
 * @returns The Transfer entry.
 */
const TransferPage: FC = () => {
    const [assigned, setAssigned]: [string[], Dispatch<SetStateAction<string[]>>] = useState<string[]>([
        "mira",
        "jonah",
    ]);
    const [virtualAssigned, setVirtualAssigned]: [string[], Dispatch<SetStateAction<string[]>>] =
        useState<string[]>([]);

    return (
        <>
            <Demo
                title="Transfer"
                description="Move items between two panes. The virtual variant keeps long lists windowed."
                code={transferCode}
            >
                <Transfer
                    items={transferItems}
                    value={assigned}
                    onChange={(next: readonly string[]): void => setAssigned([...next])}
                    titles={["Available", "Assigned"]}
                />
                <Transfer
                    items={virtualTransferItems}
                    value={virtualAssigned}
                    onChange={(next: readonly string[]): void => setVirtualAssigned([...next])}
                    titles={["Available · virtual", "Assigned · virtual"]}
                    virtual
                    listHeight={240}
                />
            </Demo>

            <Demo
                title="Disabled and empty"
                description="A disabled transfer, and one with an empty source and target."
                code={statesCode}
            >
                <Columns className="showcase__fields" count={2} gap="lg">
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Disabled
                        </Text>
                        <Transfer
                            items={transferItems}
                            value={assigned}
                            onChange={(next: readonly string[]): void => setAssigned([...next])}
                            titles={["Available", "Assigned"]}
                            disabled
                        />
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Empty and non-searchable
                        </Text>
                        <Transfer
                            items={[]}
                            value={[]}
                            onChange={(): void => {}}
                            titles={["Source", "Target"]}
                            searchable={false}
                            emptySource="No people available"
                            emptyTarget="No people selected"
                        />
                    </Stack>
                </Columns>
            </Demo>
        </>
    );
};

export default TransferPage;
