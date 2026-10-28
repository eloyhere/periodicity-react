import {
    useRef,
    useState,
    type Dispatch,
    type FC,
    type ReactNode,
    type RefObject,
    type SetStateAction,
} from "react";
import { Columns, Inline, Stack } from "../../../arrange/layout";
import {
    Alert,
    Avatar,
    AvatarGroup,
    Badge,
    Banner,
    Button,
    Chip,
    Divider,
    ElementLoading,
    EmptyState,
    Progress,
    Rate,
    Ring,
    Skeleton,
    Spinner,
    Tag,
    Timeline,
} from "../../../component";
import Text from "../../../component/text/Text";
import useLoad from "../../../component/loading/useLoad";
import { useToast } from "../../../component/toast/ToastContext";
import type { ToastApi } from "../../../component/toast/ToastContext";
import type { AvatarSize } from "../../../component";
import Demo, { DemoGroup } from "../../Demo";
import { timelineItems } from "../../samples";

const identityCode: string = `<Inline gap="sm" wrap>
    <Chip label="Assist" icon="Sparkle" />
    <Chip
        label="Filter"
        variant="filter"
        selected={chipSelected}
        onClick={() => setChipSelected(!chipSelected)}
    />
    <Chip
        label="Removable"
        variant="input"
        onRemove={() => toast.show({ title: "Chip removed" })}
    />
    <Chip label="Disabled" disabled />
</Inline>

<Inline gap="sm" wrap>
    <Tag label="Draft" />
    <Tag label="Published" tone="success" />
    <Tag label="Review" tone="warning" variant="outlined" removable />
    <Tag label="Blocked" tone="danger" disabled />
</Inline>

<Inline gap="md" align="center" wrap>
    <Avatar name="Mira Chen" size="lg" status="online" tone="accent" />
    <Avatar name="Jonah Reed" size="md" tone="mint" />
    <Avatar name="Ada Lin" size="md" tone="violet" status="busy" />
    <AvatarGroup max={2}>
        <Avatar name="Mira Chen" tone="accent" />
        <Avatar name="Jonah Reed" tone="mint" />
        <Avatar name="Ada Lin" tone="violet" />
        <Avatar name="Sam Park" tone="amber" />
    </AvatarGroup>
    <Badge tone="lime">Active</Badge>
    <Badge tone="danger" count={128} max={99} />
    <Badge dot tone="mint" aria-label="Online" />
</Inline>

<Divider />`;

const progressCode: string = `<Columns count={3} gap="lg">
    <Stack gap="sm">
        <Text variant="label" tone="muted">Progress</Text>
        <Inline gap="md" align="center">
            <Progress value={68} label="Cycle" showValue />
            <Ring value={68} size={72} showValue label="Cycle" />
            <Ring label="Unknown progress" />
            <Ring size="lg" tone="mint" label="Syncing" />
        </Inline>
        <Progress label="Loading" />
    </Stack>
    <Stack gap="sm">
        <Text variant="label" tone="muted">Spinner and skeleton</Text>
        <Inline gap="md" align="center">
            <Spinner />
            <Stack gap="xs" className="showcase__skeleton">
                <Skeleton variant="text" lines={3} />
            </Stack>
        </Inline>
    </Stack>
    <Stack gap="sm">
        <Text variant="label" tone="muted">Empty state</Text>
        <EmptyState
            title="Nothing here yet"
            description="Start with one small ritual."
            action={<Button size="sm" icon="Plus">Add ritual</Button>}
        />
    </Stack>
</Columns>`;

const alertsCode: string = `<Alert
    tone="warning"
    title="A gentle nudge"
    description="Your evening review is in twenty minutes."
    dismissible
    onDismiss={() => toast.show({ title: "Alert dismissed" })}
/>

<Banner
    tone="success"
    title="All systems quiet"
    description="Nothing needs your attention right now."
/>`;

const badgeTonesCode: string = `<Badge tone="neutral">Neutral</Badge>
<Badge tone="accent">Accent</Badge>
<Badge tone="mint">Mint</Badge>
<Badge tone="violet">Violet</Badge>
<Badge tone="amber">Amber</Badge>
<Badge tone="danger">Danger</Badge>
<Badge tone="lime">Lime</Badge>
<Badge dot tone="danger" aria-label="Alert" />`;

const loadingCode: string = `<Button variant="outline" onClick={() => setElementLoading(!elementLoading)}>
    Element loading
</Button>
<Button variant="outline" onClick={() => useLoad(3000)}>
    Fullscreen loading
</Button>

<div className="showcase__loading-panel" ref={loadingTargetRef}>
    <Text variant="h4">Bound loading target</Text>
    <Text variant="body-sm" tone="muted">
        This panel receives an element-bound overlay while loading.
    </Text>
    <ElementLoading loading={elementLoading} target={loadingTargetRef} label="Loading target" />
</div>`;

const ratingCode: string = `<Rate label="Rating" value={rating} onChange={setRating} />
<Rate label="Half stars" defaultValue={3.5} allowHalf />
<Rate label="Read only" value={4} readOnly />
<Rate label="Small" defaultValue={5} size="sm" />
<Rate label="Invalid" error="Choose a rating." />

<Timeline items={timelineItems} />`;

const avatarSizesCode: string = `<Avatar name="Avatar xs" size="xs" tone="accent" />
<Avatar name="Avatar sm" size="sm" tone="accent" />
<Avatar name="Avatar md" size="md" tone="accent" />
<Avatar name="Avatar lg" size="lg" tone="accent" />
<Avatar name="Avatar xl" size="xl" tone="accent" />

<Avatar name="Online" status="online" />
<Avatar name="Offline" status="offline" />
<Avatar name="Busy" status="busy" />
<Avatar name="Away" status="away" />`;

const alertTonesCode: string = `<Alert tone="neutral" title="Neutral" description="Informational message." />
<Alert tone="accent" title="Accent" description="A highlighted note." />
<Alert tone="success" title="Success" description="The action completed." />
<Alert tone="warning" title="Warning" description="Check before continuing." />
<Alert tone="danger" title="Danger" description="Something needs attention." />`;

const progressTonesCode: string = `<Progress value={42} tone="accent" size="sm" />
<Progress value={62} tone="mint" />
<Progress value={82} tone="violet" size="md" />
<Progress value={34} tone="amber" size="sm" />`;

const skeletonCode: string = `<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
<Skeleton variant="text" lines={2} />
<Skeleton variant="rect" width={120} height={40} />
<Skeleton variant="circle" width={40} height={40} />`;

const dividersCode: string = `<Divider />
<Divider label="Label" />
<Divider inset="both" />`;

const emptyCode: string = `<EmptyState
    title="With an icon"
    description="Empty states can carry an icon and a primary action."
    icon="Sparkle"
    action={<Button size="sm">Create</Button>}
/>`;

const avatarSizes: readonly AvatarSize[] = ["xs", "sm", "md", "lg", "xl"];

/**
 * Documents content, status, loading, and rating feedback components.
 * @example
 * <FeedbackPage />
 * @returns The Feedback entry.
 */
const FeedbackPage: FC = () => {
    const toast: ToastApi = useToast();
    const [chipSelected, setChipSelected]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    const [rating, setRating]: [number, Dispatch<SetStateAction<number>>] = useState<number>(3);
    const [elementLoading, setElementLoading]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const loadingTargetRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const handleFullscreenLoading: () => void = (): void => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        void useLoad(3000);
    };

    return (
        <>
            <Demo
                title="Chips and identity"
                description="Chips, avatars, avatar groups, badges, and dividers."
                code={identityCode}
            >
                <Inline gap="sm" wrap>
                    <Chip label="Assist" icon="Sparkle" />
                    <Chip
                        label="Filter"
                        variant="filter"
                        selected={chipSelected}
                        onClick={(): void => setChipSelected(!chipSelected)}
                    />
                    <Chip
                        label="Removable"
                        variant="input"
                        onRemove={(): void => {
                            toast.show({ title: "Chip removed" });
                        }}
                    />
                    <Chip label="Disabled" disabled />
                </Inline>
                <Inline gap="sm" wrap>
                    <Tag label="Draft" />
                    <Tag label="Published" tone="success" />
                    <Tag
                        label="Review"
                        tone="warning"
                        variant="outlined"
                        removable
                        onRemove={(): void => {
                            toast.show({ title: "Tag removed" });
                        }}
                    />
                    <Tag label="Blocked" tone="danger" disabled />
                </Inline>
                <Inline gap="md" align="center" wrap>
                    <Avatar name="Mira Chen" size="lg" status="online" tone="accent" />
                    <Avatar name="Jonah Reed" size="md" tone="mint" />
                    <Avatar name="Ada Lin" size="md" tone="violet" status="busy" />
                    <AvatarGroup max={2}>
                        <Avatar name="Mira Chen" tone="accent" />
                        <Avatar name="Jonah Reed" tone="mint" />
                        <Avatar name="Ada Lin" tone="violet" />
                        <Avatar name="Sam Park" tone="amber" />
                    </AvatarGroup>
                    <Badge tone="lime">Active</Badge>
                    <Badge tone="danger" count={128} max={99} />
                    <Badge dot tone="mint" aria-label="Online" />
                </Inline>
                <Divider />
            </Demo>

            <Demo
                title="Progress, spinners, and empty states"
                description="Linear and circular progress, loading indicators, skeletons, and an empty state."
                code={progressCode}
            >
                <Columns className="showcase__fields" count={3} gap="lg">
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Progress
                        </Text>
                        <Inline gap="md" align="center">
                            <Progress value={68} label="Cycle" showValue />
                            <Ring value={68} size={72} showValue label="Cycle" />
                            <Ring label="Unknown progress" />
                            <Ring size="lg" tone="mint" label="Syncing" />
                        </Inline>
                        <Progress label="Loading" />
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Spinner and skeleton
                        </Text>
                        <Inline gap="md" align="center">
                            <Spinner />
                            <Stack gap="xs" className="showcase__skeleton">
                                <Skeleton variant="text" lines={3} />
                            </Stack>
                        </Inline>
                    </Stack>
                    <Stack gap="sm">
                        <Text variant="label" tone="muted">
                            Empty state
                        </Text>
                        <EmptyState
                            title="Nothing here yet"
                            description="Start with one small ritual."
                            action={
                                <Button size="sm" icon="Plus">
                                    Add ritual
                                </Button>
                            }
                        />
                    </Stack>
                </Columns>
            </Demo>

            <Demo title="Alerts and banners" code={alertsCode}>
                <Alert
                    tone="warning"
                    title="A gentle nudge"
                    description="Your evening review is in twenty minutes."
                    dismissible
                    onDismiss={(): void => {
                        toast.show({ title: "Alert dismissed" });
                    }}
                />
                <Banner
                    tone="success"
                    title="All systems quiet"
                    description="Nothing needs your attention right now."
                />
            </Demo>

            <Demo title="Badge tones" code={badgeTonesCode}>
                <DemoGroup label="Badge tones">
                    <Badge tone="neutral">Neutral</Badge>
                    <Badge tone="accent">Accent</Badge>
                    <Badge tone="mint">Mint</Badge>
                    <Badge tone="violet">Violet</Badge>
                    <Badge tone="amber">Amber</Badge>
                    <Badge tone="danger">Danger</Badge>
                    <Badge tone="lime">Lime</Badge>
                    <Badge dot tone="danger" aria-label="Alert" />
                </DemoGroup>
            </Demo>

            <Demo
                title="Element and fullscreen loading"
                description="Loading can be bound to one panel or cover the whole viewport."
                code={loadingCode}
            >
                <DemoGroup label="Loading">
                    <Button
                        variant="outline"
                        onClick={(): void => setElementLoading(!elementLoading)}
                    >
                        Element loading
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleFullscreenLoading}
                    >
                        Fullscreen loading
                    </Button>
                </DemoGroup>
                <div className="showcase__loading-panel" ref={loadingTargetRef}>
                    <Text variant="h4">Bound loading target</Text>
                    <Text variant="body-sm" tone="muted">
                        This panel receives an element-bound overlay while loading.
                    </Text>
                    <ElementLoading
                        loading={elementLoading}
                        target={loadingTargetRef}
                        label="Loading target"
                    />
                </div>
            </Demo>

            <Demo
                title="Rating and timeline"
                description="Stars for quick opinions, then a chronological record of the day."
                code={ratingCode}
            >
                <DemoGroup label="Rating">
                    <Rate label="Rating" value={rating} onChange={setRating} />
                    <Rate label="Half stars" defaultValue={3.5} allowHalf />
                    <Rate label="Read only" value={4} readOnly />
                    <Rate label="Small" defaultValue={5} size="sm" />
                    <Rate label="Invalid" error="Choose a rating." />
                </DemoGroup>
                <Stack gap="sm" className="showcase__timeline">
                    <Text variant="label" tone="muted">
                        Timeline
                    </Text>
                    <Timeline items={timelineItems} />
                </Stack>
            </Demo>

            <Demo title="Avatar sizes and statuses" code={avatarSizesCode}>
                <DemoGroup label="Avatar sizes and statuses">
                    {avatarSizes.map((size: AvatarSize): ReactNode => (
                        <Avatar key={size} name={`Avatar ${size}`} size={size} tone="accent" />
                    ))}
                    <Avatar name="Online" status="online" />
                    <Avatar name="Offline" status="offline" />
                    <Avatar name="Busy" status="busy" />
                    <Avatar name="Away" status="away" />
                </DemoGroup>
            </Demo>

            <Demo title="Alert tones" code={alertTonesCode}>
                <DemoGroup label="Alert tones">
                    <Alert tone="neutral" title="Neutral" description="Informational message." />
                    <Alert tone="accent" title="Accent" description="A highlighted note." />
                    <Alert tone="success" title="Success" description="The action completed." />
                    <Alert tone="warning" title="Warning" description="Check before continuing." />
                    <Alert tone="danger" title="Danger" description="Something needs attention." />
                </DemoGroup>
            </Demo>

            <Demo title="Progress tones and sizes" code={progressTonesCode}>
                <DemoGroup label="Progress tones and sizes">
                    <Progress value={42} tone="accent" size="sm" />
                    <Progress value={62} tone="mint" />
                    <Progress value={82} tone="violet" size="md" />
                    <Progress value={34} tone="amber" size="sm" />
                </DemoGroup>
            </Demo>

            <Demo title="Spinner sizes and skeletons" code={skeletonCode}>
                <DemoGroup label="Spinner sizes and skeletons">
                    <Spinner size="sm" />
                    <Spinner size="md" />
                    <Spinner size="lg" />
                    <Skeleton variant="text" lines={2} />
                    <Skeleton variant="rect" width={120} height={40} />
                    <Skeleton variant="circle" width={40} height={40} />
                </DemoGroup>
            </Demo>

            <Demo title="Dividers" code={dividersCode}>
                <DemoGroup label="Dividers">
                    <Divider />
                    <Divider label="Label" />
                    <Divider inset="both" />
                </DemoGroup>
            </Demo>

            <Demo title="Empty state with an icon" code={emptyCode}>
                <EmptyState
                    title="With an icon"
                    description="Empty states can carry an icon and a primary action."
                    icon="Sparkle"
                    action={
                        <Button size="sm" icon="Plus">
                            Create
                        </Button>
                    }
                />
            </Demo>
        </>
    );
};

export default FeedbackPage;
