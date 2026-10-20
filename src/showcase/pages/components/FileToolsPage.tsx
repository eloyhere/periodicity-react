import type { FC } from "react";
import { Columns, Stack } from "../../../arrange/layout";
import { Editor, Preview } from "../../../component";
import type { FileNode } from "../../../component";
import Text from "../../../component/text/Text";
import { useToast } from "../../../component/toast/ToastContext";
import type { ToastApi } from "../../../component/toast/ToastContext";
import Demo from "../../Demo";
import { previewArticleSample, previewCodeSample } from "../../samples";

const previewCode: string = `<Columns count={2} gap="lg">
    <Stack gap="sm">
        <Text variant="label" tone="muted">Preview · TypeScript</Text>
        <Preview file={previewCodeSample} />
    </Stack>
    <Stack gap="sm">
        <Text variant="label" tone="muted">Preview · article</Text>
        <Preview file={previewArticleSample} />
    </Stack>
</Columns>`;

const editorCode: string = `<Editor
    file={previewCodeSample}
    onSave={(file, content) => {
        toast.show({
            title: \`Saved \${file.name}\`,
            description: \`\${content.length} characters\`,
        });
    }}
/>`;

/**
 * Documents tokenised file previews and the CodeMirror editor.
 * @example
 * <FileToolsPage />
 * @returns The Preview & editor entry.
 */
const FileToolsPage: FC = () => {
    const toast: ToastApi = useToast();

    return (
        <>
            <Demo
                title="Preview"
                description="Rendered prose and markup with a source toggle, syntax tokens, and copy."
                code={previewCode}
            >
                <Columns className="showcase__fields" count={2} gap="lg">
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Preview · TypeScript
                        </Text>
                        <Preview file={previewCodeSample} />
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Preview · article
                        </Text>
                        <Preview file={previewArticleSample} />
                    </Stack>
                </Columns>
            </Demo>

            <Demo
                title="Editor"
                description="CodeMirror editing with syntax highlighting, line numbers, history, search, and bracket handling. Completion is intentionally left to professional editor integrations."
                code={editorCode}
            >
                <Stack gap="sm">
                    <Text variant="label" tone="muted">
                        Editor
                    </Text>
                    <Editor
                        file={previewCodeSample}
                        onSave={(file: FileNode, content: string): void => {
                            toast.show({
                                title: `Saved ${file.name}`,
                                description: `${content.length} characters`,
                            });
                        }}
                    />
                </Stack>
            </Demo>
        </>
    );
};

export default FileToolsPage;
