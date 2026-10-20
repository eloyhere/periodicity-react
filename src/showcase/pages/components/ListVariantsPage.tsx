import {
    useState,
    type Dispatch,
    type FC,
    type SetStateAction,
} from "react";
import { Stack } from "../../../arrange/layout";
import {
    MultipleList,
    NormalList,
    SelectList,
    SelectTree,
    Text,
} from "../../../component";
import type { ListOption } from "../../../component";
import Demo from "../../Demo";
import { listOptions, treeItems, type RitualNode } from "../../samples";

const normalListCode: string = `<NormalList
    items={listOptions}
    getKey={(item) => item.value}
/>`;

const multipleListCode: string = `const [selectedKeys, setSelectedKeys] = useState(["morning-pages"]);

<MultipleList
    items={listOptions}
    getKey={(item) => item.value}
    selectedKeys={selectedKeys}
    onSelectionChange={(keys) => setSelectedKeys([...keys])}
/>`;

const selectListCode: string = `const [selectedKeys, setSelectedKeys] = useState(["deep-work"]);

<SelectList
    items={listOptions}
    getKey={(item) => item.value}
    selectedKeys={selectedKeys}
    onSelectionChange={(keys) => setSelectedKeys([...keys])}
/>`;

const selectTreeCode: string = `const [selectedKeys, setSelectedKeys] = useState(["practice"]);

<SelectTree
    items={treeItems}
    getKey={(item) => item.value}
    getChildren={(item) => item.children ?? []}
    defaultExpandedKeys={new Set(["practice", "review"])}
    selectedKeys={selectedKeys}
    onSelectionChange={(keys) => setSelectedKeys([...keys])}
/>`;

/**
 * Documents the selection presets that wrap List and Tree.
 * The plain List variants keep their own previews here so every preset has
 * live coverage rather than only a mention inside the family page.
 * @example
 * <ListVariantsPage />
 * @returns NormalList, MultipleList, SelectList, and SelectTree demos.
 */
const ListVariantsPage: FC = () => {
    const [multipleKeys, setMultipleKeys]: [string[], Dispatch<SetStateAction<string[]>>] =
        useState<string[]>(["morning-pages"]);
    const [selectKeys, setSelectKeys]: [string[], Dispatch<SetStateAction<string[]>>] =
        useState<string[]>(["deep-work"]);
    const [treeKeys, setTreeKeys]: [string[], Dispatch<SetStateAction<string[]>>] =
        useState<string[]>(["practice"]);

    return (
        <>
            <Demo
                title="Normal list"
                description="A list with no selection mode, for menus of links or read-only rows."
                code={normalListCode}
            >
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        NormalList
                    </Text>
                    <NormalList
                        items={listOptions}
                        getKey={(item: ListOption<string>): string => item.value}
                    />
                </Stack>
            </Demo>

            <Demo
                title="Multiple list"
                description="Toggleable multi-selection with a controlled key set."
                code={multipleListCode}
            >
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        MultipleList
                    </Text>
                    <MultipleList
                        items={listOptions}
                        getKey={(item: ListOption<string>): string => item.value}
                        selectedKeys={multipleKeys}
                        onSelectionChange={(keys: readonly string[]): void =>
                            setMultipleKeys([...keys])
                        }
                    />
                </Stack>
            </Demo>

            <Demo
                title="Select list"
                description="One active row at a time, with the selected key reported to the caller."
                code={selectListCode}
            >
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        SelectList
                    </Text>
                    <SelectList
                        items={listOptions}
                        getKey={(item: ListOption<string>): string => item.value}
                        selectedKeys={selectKeys}
                        onSelectionChange={(keys: readonly string[]): void =>
                            setSelectKeys([...keys])
                        }
                    />
                </Stack>
            </Demo>

            <Demo
                title="Select tree"
                description="A tree with single-node selection, expanded branches, and a controlled key."
                code={selectTreeCode}
            >
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        SelectTree
                    </Text>
                    <SelectTree
                        items={treeItems}
                        getKey={(item: RitualNode): string => item.value}
                        getChildren={(item: RitualNode): readonly RitualNode[] =>
                            item.children ?? []
                        }
                        defaultExpandedKeys={new Set<string>(["practice", "review"])}
                        selectedKeys={treeKeys}
                        onSelectionChange={(keys: readonly string[]): void => setTreeKeys([...keys])}
                    />
                </Stack>
            </Demo>
        </>
    );
};

export default ListVariantsPage;
