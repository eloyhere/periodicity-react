import { useState, type Dispatch, type SetStateAction } from "react";
import type { MessageItem } from "./adapter";

/**
 * Options for the message selection state.
 * Type: interface.
 * Fields: rows, selectMode, defaultSelectMode, onSelectModeChange, selectedIds,
 * defaultSelectedIds, onSelectionChange.
 * @example
 * const selection = useMessageSelection({ rows, defaultSelectMode: false });
 */
export interface MessageSelectionOptions {
    rows: readonly MessageItem[];
    selectMode?: boolean;
    defaultSelectMode?: boolean;
    onSelectModeChange?: (selectMode: boolean) => void;
    selectedIds?: readonly string[];
    defaultSelectedIds?: readonly string[];
    onSelectionChange?: (ids: readonly string[], messages: readonly MessageItem[]) => void;
}

/**
 * Current selection state and the operations that change it.
 * Type: interface.
 * Fields: selectMode, selectedIds, setSelectMode, selectOnly, toggle, clear.
 * @example
 * selection.toggle(message.id);
 */
export interface MessageSelection {
    selectMode: boolean;
    selectedIds: ReadonlySet<string>;
    setSelectMode: (selectMode: boolean) => void;
    selectOnly: (id: string) => void;
    toggle: (id: string) => void;
    clear: () => void;
}

/**
 * Manages the controlled or uncontrolled selection mode and selected message ids.
 * @param options - Rows, controlled values, and selection callbacks.
 * @example
 * const selection = useMessageSelection({ rows });
 * @returns The selection state and its operations.
 */
export const useMessageSelection: (options: MessageSelectionOptions) => MessageSelection = ({
    rows,
    selectMode: selectModeProp,
    defaultSelectMode = false,
    onSelectModeChange,
    selectedIds: selectedIdsProp,
    defaultSelectedIds,
    onSelectionChange,
}: MessageSelectionOptions): MessageSelection => {
    const [internalSelectMode, setInternalSelectMode]: [
        boolean,
        Dispatch<SetStateAction<boolean>>,
    ] = useState<boolean>(defaultSelectMode);
    const [internalSelectedIds, setInternalSelectedIds]: [
        ReadonlySet<string>,
        Dispatch<SetStateAction<ReadonlySet<string>>>,
    ] = useState<ReadonlySet<string>>(
        (): ReadonlySet<string> => new Set<string>(defaultSelectedIds ?? []),
    );
    const selectMode: boolean = selectModeProp === (void 0) ? internalSelectMode : selectModeProp;
    const selectedIds: ReadonlySet<string> =
        selectedIdsProp === (void 0)
            ? internalSelectedIds
            : new Set<string>(selectedIdsProp);

    const changeSelectMode: (next: boolean) => void = (next: boolean): void => {
        if (selectModeProp === (void 0)) {
            setInternalSelectMode(next);
        }

        onSelectModeChange?.(next);
    };

    const changeSelectedIds: (next: ReadonlySet<string>) => void = (
        next: ReadonlySet<string>,
    ): void => {
        if (selectedIdsProp === (void 0)) {
            setInternalSelectedIds(next);
        }

        const messages: MessageItem[] = rows.filter((message: MessageItem): boolean =>
            next.has(message.id),
        );
        onSelectionChange?.([...next], messages);
    };

    const toggle: (id: string) => void = (id: string): void => {
        const next: Set<string> = new Set<string>(selectedIds);

        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }

        changeSelectedIds(next);
    };

    const selectOnly: (id: string) => void = (id: string): void => {
        changeSelectedIds(new Set<string>([id]));
    };

    const clear: () => void = (): void => {
        changeSelectMode(false);
        changeSelectedIds(new Set<string>());
    };

    return {
        selectMode,
        selectedIds,
        setSelectMode: changeSelectMode,
        selectOnly,
        toggle,
        clear,
    };
};

export default useMessageSelection;
