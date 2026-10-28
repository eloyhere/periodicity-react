import {
    useRef,
    useState,
    type Dispatch,
    type FC,
    type RefObject,
    type SetStateAction,
} from "react";
import { Inline, Stack } from "../../../arrange/layout";
import { Badge, Button, Sticky, Tabs, Text, type TabItem } from "../../../component";
import Demo from "../../Demo";
import "./StickyPage.css";

/**
 * One section inside a Sticky sub-page.
 * Type: interface.
 * Fields: id, heading, paragraphs.
 * @example
 * const section: StickySection = { id: "pin", heading: "What stays put", paragraphs: [] };
 */
interface StickySection {
    id: string;
    heading: string;
    paragraphs: readonly string[];
}

/**
 * One internal page rendered inside the Sticky demo frame.
 * Type: interface.
 * Fields: value, label, eyebrow, title, lead, sections.
 * @example
 * const page: StickySubPage = { value: "overview", label: "Overview", ... };
 */
interface StickySubPage {
    value: string;
    label: string;
    eyebrow: string;
    title: string;
    lead: string;
    sections: readonly StickySection[];
}

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

const stickySubPages: readonly StickySubPage[] = [
    {
        value: "overview",
        label: "Overview",
        eyebrow: "01 · Overview",
        title: "A page inside the page",
        lead: "Three local views share one frame, one scroll port, and one set of sticky offsets.",
        sections: [
            {
                id: "sub-pages",
                heading: "Sub-pages without a router",
                paragraphs: [
                    "Each sub-page is local state inside a single documentation frame. The outer showcase keeps the real route, so switching tabs never changes the address, reloads the frame, or loses the scroll container.",
                    "A product can map the same shape to nested routes: the frame stays mounted while the content slot swaps, and the sticky offsets continue to point at the same edges.",
                ],
            },
            {
                id: "what-stays",
                heading: "What stays put",
                paragraphs: [
                    "The page header pins to the top edge of the panel. The contents rail pins 104 pixels below it, so the two sticky layers stack instead of covering each other.",
                    "The action bar uses the bottom edge. It is pulled up to the bottom of the panel while the sub-page scrolls, then settles into its normal place at the end.",
                ],
            },
            {
                id: "state",
                heading: "The state is reported, not guessed",
                paragraphs: [
                    "Scroll the panel and watch the status chips. They follow onStuckChange rather than a scroll position copied into the demo, so the label matches the actual CSS sticky state.",
                    "Changing sub-page returns the panel to the top and rebuilds the sections, while the frame and its sticky offsets stay unchanged.",
                ],
            },
        ],
    },
    {
        value: "guide",
        label: "Guide",
        eyebrow: "02 · Guide",
        title: "Pinning with offsets",
        lead: "Offsets, stacking, and the difference between the top and bottom edges.",
        sections: [
            {
                id: "top-edge",
                heading: "Start with the top edge",
                paragraphs: [
                    "Edge defaults to top and offset is the distance in pixels between the pinned box and the scroll port edge. A header that already sits at the top needs no offset at all.",
                    "Keep the sticky element opaque. Pinned content overlays the flow underneath it, so a transparent header will show headings scrolling through it.",
                ],
            },
            {
                id: "second-layer",
                heading: "Stacking a second layer",
                paragraphs: [
                    "The contents rail uses offset 104 to clear the header. Any value works as long as the two layers do not overlap at the widths you support.",
                    "Two sticky elements in the same scroll port stack in DOM order. zIndex is available when a later sibling must sit above an earlier one.",
                ],
            },
            {
                id: "bottom-edge",
                heading: "The bottom edge is different",
                paragraphs: [
                    "A bottom-sticky element is pulled up to the bottom edge while the content it follows is still scrolling, then settles into its normal position when the scroll reaches the end. Put it after the content it belongs to.",
                    "For a footer that must stay visible outside a scroll port, use a fixed row instead; Sticky deliberately stays in normal flow.",
                ],
            },
        ],
    },
    {
        value: "reference",
        label: "Reference",
        eyebrow: "03 · Reference",
        title: "The pinning contract",
        lead: "Props, state classes, and the cases where staying put is the better answer.",
        sections: [
            {
                id: "props",
                heading: "Props that matter",
                paragraphs: [
                    "edge, offset, zIndex, disabled, stuckClassName, and onStuckChange cover the pinning contract. Native div attributes and the ref pass through unchanged.",
                    "The component renders a single div, so it composes with flex rows, cards, and list items without a portal or an extra wrapper.",
                ],
            },
            {
                id: "stuck-styling",
                heading: "Stuck styling",
                paragraphs: [
                    "The element always carries sticky and sticky--top or sticky--bottom. While pinned it also carries sticky--stuck plus stuckClassName, and exposes data-stuck for CSS and tests.",
                    "Use the state class for a shadow, a border, or a compressed header; keep layout changes small enough that the stuck threshold does not oscillate.",
                ],
            },
            {
                id: "not-pinned",
                heading: "When not to pin",
                paragraphs: [
                    "Set disabled for print layouts or when the viewport is too short for the content to scroll. The element stays in place and reports the resting state.",
                    "Sticky needs a scroll container. Inside a card with overflow hidden and no scrolling, there is nothing to pin against, so the element simply sits in flow.",
                ],
            },
        ],
    },
];

const stickyPageItems: readonly TabItem[] = stickySubPages.map(
    (page: StickySubPage): TabItem => ({ value: page.value, label: page.label }),
);

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

const subPagesCode: string = `const [page, setPage] = useState("overview");
const [stuck, setStuck] = useState(false);

<div className="sticky-page__scroller">
    <Sticky offset={0} onStuckChange={setStuck}>
        <Tabs
            items={pages}
            value={page}
            onValueChange={setPage}
            ariaLabel="Sticky sub-pages"
        />
    </Sticky>

    <div className="sticky-page__body">
        <Sticky offset={104}>
            <Text variant="label">On this page</Text>
        </Sticky>
        <article>{pageCopy}</article>
    </div>

    <Sticky edge="bottom" offset={0}>
        <Button size="sm">Back to top</Button>
    </Sticky>
</div>`;

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
 * Documents Sticky through a self-contained mini site.
 *
 * The first demo is the component entry: its panel has internal sub-pages,
 * a sticky page header, a sticky contents rail, and a bottom-sticky action bar.
 * The other demos isolate the offset comparison and the bottom edge so each
 * behaviour can be inspected without the frame around it.
 * @example
 * <StickyPage />
 * @returns The Sticky documentation entry.
 */
const StickyPage: FC = () => {
    const [pageValue, setPageValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("overview");
    const [headerStuck, setHeaderStuck]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [footerStuck, setFooterStuck]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [paneStuck, setPaneStuck]: [
        Readonly<Record<string, boolean>>,
        Dispatch<SetStateAction<Readonly<Record<string, boolean>>>>,
    ] = useState<Readonly<Record<string, boolean>>>({});
    const [bottomStuck, setBottomStuck]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const scrollerRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const activeIndex: number = Math.max(
        stickySubPages.findIndex((page: StickySubPage): boolean => page.value === pageValue),
        0,
    );
    const activePage: StickySubPage = stickySubPages[activeIndex] as StickySubPage;

    /**
     * Switches the internal page and returns the shared scroll port to the top.
     * @param value - Value of the selected sub-page.
     * @example
     * <Tabs onValueChange={handlePageChange} />
     */
    const handlePageChange: (value: string) => void = (value: string): void => {
        setPageValue(value);
        scrollerRef.current?.scrollTo({ top: 0, behavior: "auto" });
    };

    /**
     * Scrolls the mini site to a section without touching the outer hash route.
     * @param anchor - DOM id of the target section.
     * @example
     * onClick={() => handleSectionJump("sticky-overview-top-edge")}
     */
    const handleSectionJump: (anchor: string) => void = (anchor: string): void => {
        const scroller: HTMLDivElement | null = scrollerRef.current;

        if (scroller === null) {
            return;
        }

        const target: HTMLElement | null = scroller.querySelector<HTMLElement>(`#${anchor}`);

        if (target === null) {
            return;
        }

        const top: number =
            target.getBoundingClientRect().top -
            scroller.getBoundingClientRect().top +
            scroller.scrollTop -
            112;

        scroller.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    };

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

    const handleBackToTop: () => void = (): void => {
        scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <>
            <Demo
                title="Sticky sub-pages"
                description="A small documentation site with its own sub-pages and scroll port: the page header pins to the top, the contents rail pins below it, and the action bar is held against the bottom edge."
                code={subPagesCode}
            >
                <div className="sticky-page">
                    <div className="sticky-page__chrome">
                        <span className="sticky-page__dots" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </span>
                        <span className="sticky-page__address">{`sticky://${activePage.value}`}</span>
                        <span className="sticky-page__count" aria-hidden="true">
                            {`${activeIndex + 1} / ${stickySubPages.length}`}
                        </span>
                    </div>
                    <div
                        className="sticky-page__scroller"
                        ref={scrollerRef}
                        role="region"
                        tabIndex={0}
                        aria-label="Sticky sub-page demo"
                    >
                        <Sticky
                            offset={0}
                            className="sticky-page__header"
                            stuckClassName="is-stuck"
                            onStuckChange={setHeaderStuck}
                        >
                            <Inline gap="md" align="center" justify="between" wrap>
                                <Inline gap="sm" align="center">
                                    <span className="sticky-page__mark" aria-hidden="true">
                                        {`0${activeIndex + 1}`}
                                    </span>
                                    <Stack gap="xs">
                                        <Text variant="label" tone="accent">
                                            {activePage.eyebrow}
                                        </Text>
                                        <Text as="h3" variant="h4">
                                            {activePage.title}
                                        </Text>
                                    </Stack>
                                </Inline>
                                <Tabs
                                    items={stickyPageItems}
                                    value={pageValue}
                                    onValueChange={handlePageChange}
                                    size="sm"
                                    variant="pill"
                                    ariaLabel="Sticky sub-pages"
                                />
                            </Inline>
                            <Text variant="body-sm" tone="muted">
                                {headerStuck
                                    ? "Header pinned · the contents rail is pinned at offset 104"
                                    : "Header at rest · scroll the panel to pin it"}
                            </Text>
                        </Sticky>
                        <div className="sticky-page__body">
                            <Sticky
                                offset={104}
                                className="sticky-page__aside"
                                stuckClassName="is-stuck"
                            >
                                <Text variant="label" tone="muted">
                                    On this page
                                </Text>
                                <nav className="sticky-page__toc" aria-label="Sections of this sub-page">
                                    {activePage.sections.map(
                                        (section: StickySection, index: number) => (
                                            <button
                                                key={section.id}
                                                type="button"
                                                className="sticky-page__toc-link"
                                                onClick={(): void =>
                                                    handleSectionJump(
                                                        `sticky-${activePage.value}-${section.id}`,
                                                    )
                                                }
                                            >
                                                <span
                                                    className="sticky-page__toc-mark"
                                                    aria-hidden="true"
                                                />
                                                <span>{`${index + 1}. ${section.heading}`}</span>
                                            </button>
                                        ),
                                    )}
                                </nav>
                                <div className="sticky-page__aside-note">
                                    <Text variant="body-sm" tone="muted">
                                        Three local sub-pages share one scroll port.
                                    </Text>
                                    <Badge tone="neutral">{`${activeIndex + 1} / ${stickySubPages.length}`}</Badge>
                                </div>
                            </Sticky>
                            <article className="sticky-page__article" key={activePage.value}>
                                <Text className="sticky-page__lead" variant="body" tone="soft">
                                    {activePage.lead}
                                </Text>
                                {activePage.sections.map(
                                    (section: StickySection, index: number) => (
                                        <section
                                            key={section.id}
                                            className="sticky-page__section"
                                            id={`sticky-${activePage.value}-${section.id}`}
                                        >
                                            <Text as="h4" variant="h4">
                                                {`${index + 1}. ${section.heading}`}
                                            </Text>
                                            {section.paragraphs.map(
                                                (paragraph: string, paragraphIndex: number) => (
                                                    <Text
                                                        key={`${section.id}-${paragraphIndex}`}
                                                        variant="body"
                                                        tone="soft"
                                                    >
                                                        {paragraph}
                                                    </Text>
                                                ),
                                            )}
                                        </section>
                                    ),
                                )}
                            </article>
                        </div>
                        <Sticky
                            edge="bottom"
                            offset={0}
                            className="sticky-page__actionbar"
                            stuckClassName="is-stuck"
                            onStuckChange={setFooterStuck}
                        >
                            <Inline className="sticky-page__actionbar-copy" gap="sm" align="center" wrap>
                                <span
                                    className={`sticky-page__signal ${footerStuck ? "is-on" : ""}`.trim()}
                                    aria-hidden="true"
                                />
                                <Text variant="body-sm" tone="muted">
                                    {footerStuck ? "Action bar pinned" : "Action bar at rest"}
                                </Text>
                                <Badge tone={headerStuck ? "mint" : "neutral"}>
                                    {headerStuck ? "header pinned" : "header idle"}
                                </Badge>
                            </Inline>
                            <Button size="sm" variant="outline" onClick={handleBackToTop}>
                                Back to top
                            </Button>
                        </Sticky>
                    </div>
                </div>
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
                                className={`sticky-page__signal ${bottomStuck ? "is-on" : ""}`.trim()}
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
