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
 * Documents tokenised file previews and the completion editor.
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
                description="Tokenised file previews for source and prose, with line numbers and language hints."
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
                description="A 500ms debounced N-gram completion editor with an explicit save callback."
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
