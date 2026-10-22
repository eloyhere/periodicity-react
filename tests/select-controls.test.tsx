/* eslint-disable @typescript-eslint/typedef -- Test fixtures are intentionally concise. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Select from "../src/component/input/select/list/normal/Select";
import TreeSelect from "../src/component/input/select/tree/TreeSelect";
import type { TreeSelectOption } from "../src/component/input/select/tree/TreeSelect";

const options = [
    { value: "everyday", label: "Everyday" },
    { value: "weekly", label: "Weekly" },
];

const treeOptions: readonly TreeSelectOption[] = [
    {
        value: "design",
        label: "Design",
        children: [
            { value: "design-system", label: "Design system" },
            { value: "research", label: "Research" },
        ],
    },
    { value: "engineering", label: "Engineering" },
];

describe("select controls", (): void => {
    it("opens the list select and reports the chosen option", (): void => {
        const onChange = vi.fn();
        render(<Select label="Cadence" options={options} onChange={onChange} />);
        const trigger: HTMLElement = screen.getByRole("combobox");

        fireEvent.click(trigger);
        fireEvent.click(screen.getByText("Weekly"));

        expect(onChange).toHaveBeenCalledWith("weekly");
        expect(trigger.textContent).toContain("Weekly");
    });

    it("uses a parent click for expansion instead of selection", (): void => {
        const onChange = vi.fn();
        render(<TreeSelect label="Workspace" options={treeOptions} onChange={onChange} />);

        fireEvent.click(screen.getByRole("combobox"));
        fireEvent.click(screen.getByText("Design"));

        expect(onChange).not.toHaveBeenCalled();
        expect(screen.queryByText("Design system")).toBeNull();

        fireEvent.click(screen.getByText("Design"));
        expect(screen.getByText("Design system")).not.toBeNull();
    });

    it("opens the tree select and reports the chosen leaf", (): void => {
        const onChange = vi.fn();
        render(<TreeSelect label="Workspace" options={treeOptions} onChange={onChange} />);
        const trigger: HTMLElement = screen.getByRole("combobox");

        fireEvent.click(trigger);
        expect(screen.getByRole("tree")).not.toBeNull();
        fireEvent.click(screen.getByText("Design system"));

        expect(onChange).toHaveBeenCalledWith("design-system");
        expect(trigger.textContent).toContain("Design system");
    });
});
