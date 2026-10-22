import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import type { FormFieldControlProps, TableColumn } from "../src/component";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import {
    PeriodicityAlert,
    PeriodicityBadge,
    PeriodicityButton,
    PeriodicityCalendar,
    PeriodicityForm,
    PeriodicityFormField,
    PeriodicityList,
    PeriodicityMention,
    PeriodicitySelect,
    PeriodicityTable,
    PeriodicityTag,
    PeriodicityToolbar,
    PeriodicityTree,
} from "../src/component";

const rules: axe.RunOptions["rules"] = {
    ["color-contrast"]: { enabled: false },
};

const audit: (container: HTMLElement) => Promise<void> = async (container: HTMLElement): Promise<void> => {
    const results: axe.AxeResults = await axe.run(container, { rules });

    expect(
        results.violations.map((violation: axe.Result): string => violation.id),
        results.violations.map((violation: axe.Result): string => violation.help).join("\n"),
    ).toEqual([]);
};

interface Person {
    id: string;
    name: string;
}
const people: readonly Person[] = [
    { id: "mira", name: "Mira Chen" },
    { id: "ada", name: "Ada Lovelace" },
];

interface TreeItem {
    id: string;
    label: string;
}
const treeItems: readonly TreeItem[] = [{ id: "root", label: "Root" }];

const tableColumns: readonly TableColumn<Person>[] = [
    { id: "name", header: "Name", cell: (person: { name: string }): string => person.name },
];

describe("accessibility smoke tests", (): void => {
    it("audits the native form and labelled field", async (): Promise<void> => {
        const { container }: { container: HTMLElement } = render(
            <PeriodicityForm>
                <PeriodicityFormField label="Email" name="email" hint="We never share it." required>
                    {(field: FormFieldControlProps): ReactNode => <input {...field} type="email" />}
                </PeriodicityFormField>
                <PeriodicityButton type="submit">Subscribe</PeriodicityButton>
            </PeriodicityForm>,
        );

        await audit(container);
    });

    it("audits status components with their second channel", async (): Promise<void> => {
        const { container }: { container: HTMLElement } = render(
            <div>
                <PeriodicityAlert tone="success" title="Saved" description="Your changes are ready." />
                <PeriodicityTag tone="warning">Review</PeriodicityTag>
                <PeriodicityBadge tone="danger" count={3} aria-label="3 errors" />
                <PeriodicityBadge dot tone="danger" aria-label="Offline" />
            </div>,
        );

        await audit(container);
    });

    it("audits the toolbar and calendar", async (): Promise<void> => {
        const { container }: { container: HTMLElement } = render(
            <div>
                <PeriodicityToolbar title="Design system" navigationIcon="←" actions={<button type="button">Share</button>} />
                <PeriodicityCalendar value="2026-10-20" label="Delivery date" />
            </div>,
        );

        await audit(container);
    });

    it("audits the mention field", async (): Promise<void> => {
        const { container }: { container: HTMLElement } = render(
            <PeriodicityMention
                label="Reply"
                prefix="Mention"
                message="Type @ to mention someone."
                onChange={(): void => {}}
            />,
        );

        await audit(container);
    });

    it("audits adapter collections", async (): Promise<void> => {
        const { container }: { container: HTMLElement } = render(
            <div>
                <PeriodicityList
                    items={people}
                    getKey={(person: { id: string }): string => person.id}
                    selectionMode="single"
                    renderItem={(person: { name: string }): string => person.name}
                />
                <PeriodicityTree
                    items={treeItems}
                    getKey={(item: { id: string }): string => item.id}
                    renderItem={(item: { label: string }): string => item.label}
                />
                <PeriodicityTable
                    columns={tableColumns}
                    rows={people}
                    rowKey={(person: { id: string }): string => person.id}
                    caption="People"
                />
                <PeriodicitySelect
                    label="Team"
                    options={[
                        { value: "one", label: "One" },
                        { value: "two", label: "Two" },
                    ]}
                    value="one"
                    onChange={(): void => {}}
                />
            </div>,
        );

        await audit(container);
    });
});
