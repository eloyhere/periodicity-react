import { useState, type Dispatch, type FC, type SetStateAction } from "react";
import { Inline, Stack } from "../../../arrange/layout";
import { Badge, Button, Sticky, StickyPage as StickyPageSurface, Text } from "../../../component";
import Demo from "../../Demo";
import StickyHomeDemo from "./StickyHomeDemo";
import "./StickyPage.css";

/**
 * One pane in the offset comparison demo.
 * Type: interface.
 * Fields: id, label, offset, note.
 * @example
 * const pane: StickyOffsetPane = { id: "flush", label: "offset = 0", offset: 0, note: "Flush" };
 */
interface StickyOffsetPane {
    id: string;
    label: string;
    offset: number;
    note: string;
}

const slotRows: readonly string[] = [
    "The slot accepts any number of children, not just sticky layers.",
    "A Sticky child can appear anywhere between ordinary sections.",
    "Offsets let a pinned toolbar clear another pinned layer above it.",
    "The page frame owns the height; children own the content.",
    "Sticky layers stay in flow, so the slot keeps its natural height.",
    "A bottom Sticky layer joins the lower edge of the page viewport.",
    "Nested content can still scroll its own inner lists and tables.",
    "Change the height prop to fit a taller or shorter page.",
];

const stickyOffsetPanes: readonly StickyOffsetPane[] = [
    {
        id: "flush",
        label: "offset = 0",
        offset: 0,
        note: "Flush with the edge",
    },
    {
        id: "inset",
        label: "offset = 16",
        offset: 16,
        note: "A small breathing space",
    },
];

const stickyOffsetRows: readonly string[] = [
    "Audit the focus ring against the pinned header.",
    "Measure the header once, then keep the offset stable.",
    "Reserve space for the scrolled content in normal flow.",
    "Keep the pinned surface opaque so text cannot bleed through.",
    "Release the pin when the scroll container ends.",
    "Prefer tokens over raw pixel values for the offset.",
    "Test at 320 pixels wide before shipping the layout.",
    "Check reduced motion when a stuck state animates a shadow.",
];

const bottomRows: readonly string[] = [
    "Sticky reports its pinned state through onStuckChange.",
    "Offsets accept any non-negative pixel distance.",
    "stuckClassName and data-stuck share one source of truth.",
    "The contents rail is a second sticky layer in the same port.",
    "A bottom bar pins only while its normal box crosses the edge.",
    "Disabling the component keeps the box and drops the pin.",
];

const homeCode: string = `<StickyPage height={560} ariaLabel="Launch homepage">
    <Sticky offset={0} zIndex={30}>
        <SiteNav />
    </Sticky>

    <Sticky offset={56} zIndex={1}>
        <Hero />
    </Sticky>
    <Sticky offset={56} zIndex={2}>
        <Manifesto />
    </Sticky>

    <section className="split">
        <Sticky offset={72} zIndex={6}>
            <ProductMedia />
        </Sticky>
        <FeatureCopy />
    </section>
</StickyPage>`;

const slotCode: string = `<StickyPage height={320} ariaLabel="Sticky page slot">
    <PageIntro />
    <Sticky offset={0}>
        <Toolbar title="Pinned toolbar" />
    </Sticky>
    <ContentRows />
    <Sticky edge="bottom" offset={0}>
        <ActionBar />
    </Sticky>
</StickyPage>`;

const offsetsCode: string = `<div className="sticky-offset">
    <div className="sticky-offset__pane">
        <Sticky offset={0} onStuckChange={setFlushStuck}>
            <Inline justify="between">
                <Text variant="label">offset = 0</Text>
                <Badge tone={flushStuck ? "mint" : "neutral"}>
                    {flushStuck ? "stuck" : "resting"}
                </Badge>
            </Inline>
        </Sticky>
        <ol>{rows.map((row) => <li key={row}>{row}</li>)}</ol>
    </div>

    <div className="sticky-offset__pane">
        <Sticky offset={16} onStuckChange={setInsetStuck}>
            <Text variant="label">offset = 16</Text>
        </Sticky>
        <ol>{rows.map((row) => <li key={row}>{row}</li>)}</ol>
    </div>
</div>`;

const bottomCode: string = `<div className="sticky-edge">
    <div className="sticky-edge__content">{notes}</div>

    <Sticky edge="bottom" offset={0} onStuckChange={setPinned}>
        <Text variant="body-sm">Release notes</Text>
        <Button size="sm" variant="outline">Review</Button>
    </Sticky>
</div>`;

/**
 * Documents Sticky and StickyPage.
 *
 * The first demo is the component entry: an interactive homepage whose nested
 * routes render a StickyPage with a Scroll viewport, a sticky site navigation,
 * a stacking hero/statement sequence, and a sticky product media column. The
 * second demo isolates the StickyPage slot, and the remaining demos cover
 * offsets and the bottom edge without the homepage frame.
 * @example
 * <StickyPage />
 * @returns The Sticky documentation entry.
 */
const StickyPage: FC = () => {
    const [paneStuck, setPaneStuck]: [
        Readonly<Record<string, boolean>>,
        Dispatch<SetStateAction<Readonly<Record<string, boolean>>>>,
    ] = useState<Readonly<Record<string, boolean>>>({});
    const [bottomStuck, setBottomStuck]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [slotStuck, setSlotStuck]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);

    /**
     * Records the stuck state of one offset pane.
     * @param id - Pane identifier.
     * @param next - Whether the pane is pinned.
     * @example
     * onStuckChange={(next) => handlePaneStuck("flush", next)}
     */
    const handlePaneStuck: (id: string, next: boolean) => void = (
        id: string,
        next: boolean,
    ): void => {
        setPaneStuck(
            (
                current: Readonly<Record<string, boolean>>,
            ): Readonly<Record<string, boolean>> =>
                current[id] === next ? current : { ...current, [id]: next },
        );
    };

    return (
        <>
            <Demo
                title="Sticky homepage"
                description="A landing page inside Scroll: the sticky site navigation, hero, statement panels, and product media hold their position while later sections move over them. Each route swaps the homepage."
                code={homeCode}
            >
                <StickyHomeDemo />
            </Demo>

            <Demo
                title="Sticky page slot"
                description="StickyPage is the outer page wrapper and Scroll makes its slot scrollable. The slot accepts any number of children; the Sticky layers inside pin against the page viewport."
                code={slotCode}
            >
                <StickyPageSurface
                    className="sticky-slot"
                    height={320}
                    ariaLabel="Sticky page slot demo"
                >
                    <div className="sticky-slot__intro">
                        <Text variant="label" tone="accent">
                            Slot children
                        </Text>
                        <Text variant="body" tone="soft">
                            The page wraps four children: an intro, a Sticky toolbar,
                            a long list, and a bottom Sticky action bar. Only the two
                            Sticky children pin; the rest remains ordinary flow.
                        </Text>
                    </div>
                    <Sticky
                        offset={0}
                        className="sticky-slot__toolbar"
                        stuckClassName="is-stuck"
                        onStuckChange={setSlotStuck}
                    >
                        <Inline gap="sm" align="center" justify="between">
                            <Text variant="label">
                                Toolbar pinned while the list scrolls
                            </Text>
                            <Badge tone={slotStuck ? "mint" : "neutral"}>
                                {slotStuck ? "stuck" : "resting"}
                            </Badge>
                        </Inline>
                    </Sticky>
                    <div className="sticky-slot__rows">
                        {slotRows.map((row: string, index: number) => (
                            <div className="sticky-slot__row" key={row}>
                                <span className="sticky-slot__index" aria-hidden="true">
                                    {`${index + 1}`.padStart(2, "0")}
                                </span>
                                <Text variant="body-sm" tone="soft">
                                    {row}
                                </Text>
                            </div>
                        ))}
                    </div>
                    <Sticky
                        edge="bottom"
                        offset={0}
                        className="sticky-slot__actionbar"
                        stuckClassName="is-stuck"
                    >
                        <Inline gap="sm" align="center" justify="between" wrap>
                            <Text variant="body-sm" tone="muted">
                                Bottom Sticky layer inside the same slot
                            </Text>
                            <Button size="sm" variant="outline">
                                Action
                            </Button>
                        </Inline>
                    </Sticky>
                </StickyPageSurface>
            </Demo>

            <Demo
                title="Sticky offsets"
                description="The same pin with a flush edge and a 16px inset. The badge on each pane follows the component's own stuck state."
                code={offsetsCode}
            >
                <div className="sticky-offset">
                    {stickyOffsetPanes.map((pane: StickyOffsetPane) => {
                        const pinned: boolean = paneStuck[pane.id] === true;

                        return (
                            <div className="sticky-offset__pane" key={pane.id}>
                                <Sticky
                                    offset={pane.offset}
                                    className="sticky-offset__bar"
                                    stuckClassName="is-stuck"
                                    onStuckChange={(next: boolean): void =>
                                        handlePaneStuck(pane.id, next)
                                    }
                                >
                                    <Inline gap="sm" align="center" justify="between">
                                        <Stack gap="xs">
                                            <Text variant="label">{pane.label}</Text>
                                            <Text variant="body-sm" tone="muted">
                                                {pane.note}
                                            </Text>
                                        </Stack>
                                        <Badge tone={pinned ? "mint" : "neutral"}>
                                            {pinned ? "stuck" : "resting"}
                                        </Badge>
                                    </Inline>
                                </Sticky>
                                <ol className="sticky-offset__list">
                                    {stickyOffsetRows.map((row: string, index: number) => (
                                        <li key={row}>
                                            <span className="sticky-offset__index" aria-hidden="true">
                                                {`${index + 1}`.padStart(2, "0")}
                                            </span>
                                            <Text variant="body-sm" tone="soft">
                                                {row}
                                            </Text>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        );
                    })}
                </div>
            </Demo>

            <Demo
                title="Bottom action bar"
                description="A bottom-sticky row placed after the content is pulled up to the bottom edge while the panel scrolls, then settles in flow when the scroll reaches the end."
                code={bottomCode}
            >
                <div className="sticky-edge">
                    <div className="sticky-edge__intro">
                        <Text variant="label" tone="accent">
                            Release notes
                        </Text>
                        <Text variant="body" tone="soft">
                            Scroll to the end of this panel. The action bar is held against the
                            bottom edge while the content moves, then settles with the final row.
                        </Text>
                    </div>
                    <div className="sticky-edge__content">
                        {bottomRows.map((row: string, index: number) => (
                            <div className="sticky-edge__row" key={row}>
                                <span className="sticky-edge__index" aria-hidden="true">
                                    {`${index + 1}`.padStart(2, "0")}
                                </span>
                                <Text variant="body-sm" tone="soft">
                                    {row}
                                </Text>
                            </div>
                        ))}
                    </div>
                    <Sticky
                        edge="bottom"
                        offset={0}
                        className="sticky-edge__bar"
                        stuckClassName="is-stuck"
                        onStuckChange={setBottomStuck}
                    >
                        <Inline className="sticky-edge__bar-copy" gap="sm" align="center" wrap>
                            <span
                                className={`sticky-page-demo__signal ${bottomStuck ? "is-on" : ""}`.trim()}
                                aria-hidden="true"
                            />
                            <Text variant="body-sm" tone="muted">
                                {bottomStuck ? "Pinned at the bottom" : "At rest in flow"}
                            </Text>
                        </Inline>
                        <Button size="sm" variant="outline">
                            Review
                        </Button>
                    </Sticky>
                </div>
            </Demo>
        </>
    );
};

export default StickyPage;
