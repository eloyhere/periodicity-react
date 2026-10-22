import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarChart, FilePicker, FieldGroup } from "../src/component";
import { International } from "../src/international";

describe("built-in locales", (): void => {
    it("keeps the English source for English locales", (): void => {
        render(
            <International locale="en-GB">
                <BarChart
                    ariaLabel="Revenue"
                    categories={["Q1"]}
                    series={[{ id: "revenue", label: "Revenue", values: [12] }]}
                />
                <FilePicker label="Attachment" />
                <FieldGroup legend="Notifications" optional>
                    <input type="radio" />
                </FieldGroup>
            </International>,
        );

        expect(screen.getByRole("img", { name: "Revenue" })).not.toBeNull();
        expect(screen.getByText("Category")).not.toBeNull();
        expect(screen.getByRole("list", { name: "Legend" })).not.toBeNull();
        expect(screen.getByText("Choose file")).not.toBeNull();
        expect(screen.getByText("Optional")).not.toBeNull();
    });

    it("renders the Simplified Chinese dictionary for zh-CN", (): void => {
        render(
            <International locale="zh-CN">
                <BarChart
                    ariaLabel="营收"
                    categories={["第一季度"]}
                    series={[{ id: "revenue", label: "营收", values: [12] }]}
                />
                <FilePicker label="附件" />
                <FieldGroup legend="通知" optional>
                    <input type="radio" />
                </FieldGroup>
            </International>,
        );

        expect(screen.getByRole("img", { name: "营收" })).not.toBeNull();
        expect(screen.getByText("类别")).not.toBeNull();
        expect(screen.getByRole("list", { name: "图例" })).not.toBeNull();
        expect(screen.getByText("选择文件")).not.toBeNull();
        expect(screen.getByText("可选")).not.toBeNull();
    });
});
