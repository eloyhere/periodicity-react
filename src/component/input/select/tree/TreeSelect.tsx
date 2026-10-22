import { useMemo, useRef } from "react";
import type {
    ButtonHTMLAttributes,
    FC,
    KeyboardEventHandler,
    MouseEventHandler,
    ReactNode,
    Ref,
    RefCallback,
    RefObject,
} from "react";
import Tree from "../../../../layout/tree/Tree";
import Dropdown from "../../../dropdown/Dropdown";
import cx from "../../../foundation/cx";
import useControllableState from "../../../foundation/useControllableState";
import useField, { type FieldState } from "../../../foundation/useField";
import useMergedRef from "../../../foundation/useMergedRef";
import Icon from "../../../icon/Icon";
import type { IconName } from "../../../icon/Icon";
import Surface from "../../../surface/Surface";
import { useInternational, type InternationalContextValue } from "../../../../international";
import "../list/Select.css";

/**
 * One branch or leaf offered by TreeSelect.
 * Type: interface.
 * Fields: value, label, children, disabled, icon.
 * @example
 * const option: TreeSelectOption = { value: "design", label: "Design" };
 */
export interface TreeSelectOption {
    value: string;
    label: string;
    children?: readonly TreeSelectOption[];
    disabled?: boolean;
    icon?: IconName;
}

/**
 * Props for the TreeSelect control.
 * Type: interface.
 * Fields: label, value, defaultValue, options, onChange, variant, size, hint, error,
 * placeholder, disabled, readOnly, open, defaultOpen, onOpenChange, className, id, ref,
 * and native button attributes. Parent nodes toggle expansion; only leaves are selectable.
 * @example
 * <TreeSelect label="Workspace" options={tree} value={value} onChange={setValue} />
 */
export interface TreeSelectProps
    extends Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        "value" | "defaultValue" | "onChange" | "type" | "className" | "children"
    > {
    label: string;
    value?: string;
    defaultValue?: string;
    options: readonly TreeSelectOption[];
    onChange: (value: string) => void;
    variant?: "outline" | "fill" | "standard";
    size?: "sm" | "md" | "lg";
    hint?: string;
    error?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
    id?: string;
    ref?: Ref<HTMLButtonElement>;
}

/**
 * Finds a tree node by value.
 * @param nodes - Tree roots.
 * @param value - Selected value.
 * @example
 * const node = findTreeNode(options, "design");
 * @returns The matching node, if any.
 */
const findTreeNode: (
    nodes: readonly TreeSelectOption[],
    value: string,
) => TreeSelectOption | void = (
    nodes: readonly TreeSelectOption[],
    value: string,
): TreeSelectOption | void => {
    for (const node of nodes) {
        if (node.value === value) {
            return node;
        }

        const child: TreeSelectOption | void = findTreeNode(node.children ?? [], value);

        if (child !== (void 0)) {
            return child;
        }
    }

    return (void 0);
};

/**
 * Renders a select-like trigger backed by a single-select tree.
 * @param props - Field state, tree options, and selection handler.
 * @example
 * <TreeSelect label="Workspace" options={tree} value={value} onChange={setValue} />
 * @returns A tree select control.
 */
const TreeSelect: FC<TreeSelectProps> = ({
    label,
    value,
    defaultValue = "",
    options,
    onChange,
    variant = "outline",
    size = "md",
    hint,
    error,
    placeholder,
    disabled = false,
    readOnly = false,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    className = "",
    style,
    id,
    onClick,
    onKeyDown,
    ref,
    ...rest
}: TreeSelectProps) => {
    const { t }: InternationalContextValue = useInternational();
    const fieldState: FieldState = useField({ id, label, hint, error });
    const controlId: string = fieldState.controlId;
    const labelId: string = `${controlId}-label`;
    const treeId: string = `${controlId}-tree`;
    const [selectedValue, setSelectedValue]: readonly [
        string,
        (next: string | ((previous: string) => string)) => void,
    ] = useControllableState<string>({
        value,
        defaultValue,
        onChange,
    });
    const [open, setOpen]: readonly [
        boolean,
        (next: boolean | ((previous: boolean) => boolean)) => void,
    ] = useControllableState<boolean>({
        value: openProp,
        defaultValue: defaultOpen,
        onChange: onOpenChange,
    });
    const hasError: boolean = fieldState.invalid;
    const describedBy: string = hasError
        ? fieldState.errorId
        : hint !== (void 0) && hint.length > 0
          ? fieldState.hintId
          : "";
    const placeholderText: string = placeholder ?? t("select");
    const selectedNode: TreeSelectOption | void = useMemo(
        (): TreeSelectOption | void => findTreeNode(options, selectedValue),
        [options, selectedValue],
    );
    const displayText: string = selectedNode?.label ?? "";
    const hasValue: boolean = displayText.length > 0;
    const defaultExpandedKeys: ReadonlySet<string> = useMemo(
        (): ReadonlySet<string> =>
            new Set<string>(
                options
                    .filter(
                        (option: TreeSelectOption): boolean =>
                            option.children !== (void 0) && option.children.length > 0,
                    )
                    .map((option: TreeSelectOption): string => option.value),
            ),
        [options],
    );
    const triggerRef: RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement | null>(null);
    const mergedTriggerRef: RefCallback<HTMLButtonElement> = useMergedRef<HTMLButtonElement>(
        triggerRef,
        ref,
    );

    const focusTrigger: () => void = (): void => {
        triggerRef.current?.focus({ preventScroll: true });
    };

    const handleOpenChange: (next: boolean) => void = (next: boolean): void => {
        setOpen(next);

        if (!next) {
            focusTrigger();
        }
    };

    const handleSelect: (key: string) => void = (key: string): void => {
        const node: TreeSelectOption | void = findTreeNode(options, key);

        if (node === (void 0) || node.disabled === true || disabled || readOnly) {
            return;
        }

        setSelectedValue(node.value);
        setOpen(false);
        focusTrigger();
    };

    const handleTriggerClick: MouseEventHandler<HTMLButtonElement> = (
        event: Parameters<MouseEventHandler<HTMLButtonElement>>[0],
    ): void => {
        onClick?.(event);

        if (disabled || readOnly || event.defaultPrevented) {
            return;
        }

        setOpen(!open);
    };

    const handleTriggerKeyDown: KeyboardEventHandler<HTMLButtonElement> = (
        event: Parameters<KeyboardEventHandler<HTMLButtonElement>>[0],
    ): void => {
        onKeyDown?.(event);

        if (event.defaultPrevented || disabled || readOnly) {
            return;
        }

        if (
            event.key === "ArrowDown" ||
            event.key === "ArrowUp" ||
            event.key === "Enter" ||
            event.key === " "
        ) {
            event.preventDefault();
            setOpen(true);
        }
    };

    return (
        <div
            className={cx(
                "select-field",
                `select-field--${variant}`,
                `select-field--${size}`,
                open && "select-field--open",
                hasValue && "select-field--filled",
                hasError && "select-field--invalid",
                disabled && "select-field--disabled",
                readOnly && "select-field--readonly",
                className,
            )}
            style={style}
            data-open={open ? "true" : "false"}
            data-invalid={hasError ? "true" : "false"}
            data-disabled={disabled ? "true" : "false"}
            data-readonly={readOnly ? "true" : "false"}
        >
            <Surface
                className="select-field__surface"
                background={<span className="select-field__background" />}
                foreground={<span className="select-field__edge" />}
                ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
            >
                <button
                    {...rest}
                    ref={mergedTriggerRef}
                    id={controlId}
                    type="button"
                    role="combobox"
                    className="select-field__trigger"
                    aria-haspopup="tree"
                    aria-expanded={open}
                    aria-controls={treeId}
                    aria-labelledby={labelId}
                    aria-invalid={hasError}
                    aria-readonly={readOnly ? true : (void 0)}
                    aria-describedby={describedBy.length > 0 ? describedBy : (void 0)}
                    disabled={disabled}
                    onClick={handleTriggerClick}
                    onKeyDown={handleTriggerKeyDown}
                >
                    <span
                        className={cx(
                            "select-field__value",
                            displayText.length === 0 && "select-field__value--placeholder",
                        )}
                    >
                        {displayText.length > 0 ? displayText : open ? placeholderText : ""}
                    </span>
                    <span className="select-field__indicator" aria-hidden="true">
                        <Icon name="ChevronDown" size={18} />
                    </span>
                </button>
            </Surface>

            <label className="select-field__label" id={labelId} htmlFor={controlId}>
                {label}
            </label>

            {hasError ? (
                <p className="select-field__error" id={fieldState.errorId} aria-live="polite">
                    {error}
                </p>
            ) : hint !== (void 0) && hint.length > 0 ? (
                <p className="select-field__hint" id={fieldState.hintId}>
                    {hint}
                </p>
            ) : null}

            <Dropdown
                open={open}
                onOpenChange={handleOpenChange}
                anchorRef={triggerRef}
                placement="bottom-start"
                matchWidth
                role="dialog"
                ariaLabel={label}
                isEmpty={options.length === 0}
                empty={<span id={treeId}>{t("noResults")}</span>}
            >
                <div className="select-field__tree" id={treeId}>
                    <Tree<TreeSelectOption>
                        items={options}
                        aria-label={label}
                        selectionMode="single"
                        defaultExpandedKeys={defaultExpandedKeys}
                        selectedKeys={selectedValue.length > 0 ? [selectedValue] : []}
                        onSelectionChange={(keys: readonly string[]): void => {
                            const next: string | void = keys[0];

                            if (next !== (void 0)) {
                                handleSelect(next);
                            }
                        }}
                        getKey={(item: TreeSelectOption): string => item.value}
                        getChildren={(item: TreeSelectOption): readonly TreeSelectOption[] =>
                            item.children ?? []
                        }
                        isSelectable={(item: TreeSelectOption): boolean =>
                            item.children === (void 0) || item.children.length === 0
                        }
                        isDisabled={(item: TreeSelectOption): boolean => item.disabled === true}
                        renderItem={(item: TreeSelectOption): ReactNode => (
                            <span className="select-field__tree-option">
                                {item.icon === (void 0) ? null : (
                                    <Icon name={item.icon} size={16} />
                                )}
                                {item.label}
                            </span>
                        )}
                        height={280}
                    />
                </div>
            </Dropdown>
        </div>
    );
};

export default TreeSelect;
