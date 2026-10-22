import {
    useState,
    type Dispatch,
    type FC,
    type ReactNode,
    type SetStateAction,
} from "react";
import { Inline } from "../../../arrange/layout";
import { Badge, CommentThread, Mention } from "../../../component";
import Text from "../../../component/text/Text";
import { useToast } from "../../../component/toast/ToastContext";
import type { ToastApi } from "../../../component/toast/ToastContext";
import Demo, { DemoGroup } from "../../Demo";
import { commentData, mentionPeople } from "../../samples";
import type { CommentData, MentionItem } from "../../../component";

const threadCode: string = `<CommentThread
    comments={commentData}
    currentUser="Mira Chen"
    header={
        <Inline gap="sm" align="center">
            <Text variant="label">Cycle 04 discussion</Text>
            <Badge tone="neutral">{commentData.length} threads</Badge>
        </Inline>
    }
    footer={
        <Text variant="body-sm" tone="muted">
            Threaded comments · references stay linked
        </Text>
    }
    slots={{
        actions: (comment) => (comment.resolved ? <Badge tone="mint">Resolved</Badge> : null),
    }}
    onReply={(parent, body) => {
        toast.show({ title: \`Reply to \${parent.author}\`, description: body });
    }}
    onReference={(from, target) => {
        toast.show({
            title: "Reference followed",
            description: \`\${from.author} referenced \${target.author}.\`,
        });
    }}
    mentionSearch={searchMentionPeople}
    onMention={(parent, item) => {
        toast.show({
            title: \`Mentioned \${item.label}\`,
            description: \`In reply to \${parent.author}.\`,
        });
    }}
/>`;

const mentionCode: string = `<Mention
    label="Mention someone"
    value={mentionValue}
    onChange={setMentionValue}
    placeholder="Write a note, then type @"
    prefix="Mention"
    message="The loader is supplied by the caller."
    onSearch={searchMentionPeople}
    onMention={(item) => {
        toast.show({ title: \`Mentioned \${item.label}\` });
    }}
/>`;

const emptyCode: string = `<CommentThread comments={[]} empty="No comments yet — the empty slot." />`;

/**
 * Documents threaded comments, references, and the mention input.
 * @example
 * <DiscussionPage />
 * @returns The Discussion entry.
 */
const DiscussionPage: FC = () => {
    const toast: ToastApi = useToast();
    const [mentionValue, setMentionValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("");

    const searchMentionPeople: (query: string) => Promise<readonly MentionItem[]> = async (
        query: string,
    ): Promise<readonly MentionItem[]> => {
        await new Promise((resolve: (value: void) => void): void => {
            window.setTimeout(resolve, 220);
        });

        return mentionPeople.filter((person: MentionItem): boolean =>
            person.label.toLowerCase().includes(query.toLowerCase()),
        );
    };

    return (
        <>
            <Demo
                title="Threaded comments"
                description="Nested replies, reference links that stay connected, and an action slot per comment."
                code={threadCode}
            >
                <CommentThread
                    comments={commentData}
                    currentUser="Mira Chen"
                    header={
                        <Inline gap="sm" align="center">
                            <Text variant="label">Cycle 04 discussion</Text>
                            <Badge tone="neutral">{commentData.length} threads</Badge>
                        </Inline>
                    }
                    footer={
                        <Text variant="body-sm" tone="muted">
                            Threaded comments · references stay linked
                        </Text>
                    }
                    slots={{
                        actions: (comment: CommentData): ReactNode =>
                            comment.resolved ? <Badge tone="mint">Resolved</Badge> : null,
                    }}
                    onReply={(parent: CommentData, body: string): void => {
                        toast.show({
                            title: `Reply to ${parent.author}`,
                            description: body,
                        });
                    }}
                    onReference={(from: CommentData, target: CommentData): void => {
                        toast.show({
                            title: "Reference followed",
                            description: `${from.author} referenced ${target.author}.`,
                        });
                    }}
                    mentionSearch={searchMentionPeople}
                    onMention={(parent: CommentData, item: MentionItem): void => {
                        toast.show({
                            title: `Mentioned ${item.label}`,
                            description: `In reply to ${parent.author}.`,
                        });
                    }}
                />
            </Demo>

            <Demo
                title="Mention input"
                description="Typing @ opens a searchable mention list; the field keeps the same prefix, hint, message, limitation, error, and suffix slots as TextInput."
                code={mentionCode}
            >
                <DemoGroup label="Mention input">
                    <Mention
                        label="Mention someone"
                        value={mentionValue}
                        onChange={setMentionValue}
                        placeholder="Write a note, then type @"
                        prefix="Mention"
                        message="The loader is supplied by the caller."
                        onSearch={searchMentionPeople}
                        onMention={(item: MentionItem): void => {
                            toast.show({ title: `Mentioned ${item.label}` });
                        }}
                    />
                </DemoGroup>
            </Demo>

            <Demo title="Empty thread" description="The empty slot is part of the contract." code={emptyCode}>
                <CommentThread comments={[]} empty="No comments yet — the empty slot." />
            </Demo>
        </>
    );
};

export default DiscussionPage;
