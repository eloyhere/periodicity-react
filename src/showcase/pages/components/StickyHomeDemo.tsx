import { useEffect, useState, type Dispatch, type FC, type SetStateAction } from "react";
import { Inline } from "../../../arrange/layout";
import {
    Anchor,
    Badge,
    Button,
    ProgressRing,
    Sticky,
    StickyPage as StickyPageSurface,
    Text,
} from "../../../component";
import "./StickyHomeDemo.css";

/**
 * Visual tone of a stacked homepage panel.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: StickyHomeTone = "ink";
 */
type StickyHomeTone = "ink" | "paper" | "accent";

/**
 * Layout family used by one homepage route.
 * Type: type alias.
 * Fields: none.
 * @example
 * const variant: StickyHomeVariant = "stacked";
 */
type StickyHomeVariant = "stacked" | "split" | "pricing";

/**
 * One feature block in the scrolling column beside the sticky media.
 * Type: interface.
 * Fields: id, title, body.
 * @example
 * const feature: StickyHomeFeature = { id: "plan", title: "Plan", body: "…" };
 */
interface StickyHomeFeature {
    id: string;
    title: string;
    body: string;
}

/**
 * One full-height statement panel that stacks over the panel before it.
 * Type: interface.
 * Fields: id, eyebrow, title, body, tone, metric, metricLabel.
 * @example
 * const panel: StickyHomePanel = { id: "signal", eyebrow: "Manifesto", ... };
 */
interface StickyHomePanel {
    id: string;
    eyebrow: string;
    title: string;
    body: string;
    tone: StickyHomeTone;
    metric: string;
    metricLabel: string;
}

/**
 * One routed homepage.
 * Type: interface.
 * Fields: value, label, eyebrow, title, lead, primaryAction, variant, panels, features.
 * @example
 * const route: StickyHomeRoute = { value: "launch", label: "Launch", ... };
 */
interface StickyHomeRoute {
    value: string;
    label: string;
    eyebrow: string;
    title: string;
    lead: string;
    primaryAction: string;
    variant: StickyHomeVariant;
    panels: readonly StickyHomePanel[];
    features: readonly StickyHomeFeature[];
}

const homeRoutes: readonly StickyHomeRoute[] = [
    {
        value: "launch",
        label: "Launch",
        eyebrow: "A calmer operating system",
        title: "Make room for the work that matters.",
        lead: "Plan the loops that repeat, protect the time they need, and let everything else stay quiet.",
        primaryAction: "Start free",
        variant: "stacked",
        panels: [
            {
                id: "signal",
                eyebrow: "The manifesto",
                title: "Less noise. More signal.",
                body: "No feeds, no unread badges, no urgency invented by the tool. One surface for the rituals that actually shape the week.",
                tone: "ink",
                metric: "03",
                metricLabel: "loops a day",
            },
            {
                id: "home",
                eyebrow: "One home",
                title: "Every loop in one quiet place.",
                body: "Capture, shape, tend, and review without changing context. The interface disappears behind the work.",
                tone: "accent",
                metric: "12",
                metricLabel: "weeks a season",
            },
        ],
        features: [
            {
                id: "plan",
                title: "Plan the week",
                body: "A short weekly review turns a loose list into three deliberate loops.",
            },
            {
                id: "protect",
                title: "Protect the block",
                body: "Focus sessions keep their shape; the rest of the day waits.",
            },
            {
                id: "close",
                title: "Close the loop",
                body: "A two-minute review records what worked and what to drop.",
            },
        ],
    },
    {
        value: "features",
        label: "Features",
        eyebrow: "Product",
        title: "Built for the work between the work.",
        lead: "The small transitions that decide whether a day feels light or heavy.",
        primaryAction: "Take the tour",
        variant: "split",
        panels: [],
        features: [
            {
                id: "canvas",
                title: "A weekly canvas",
                body: "Three columns: now, next, and the season. Drag a loop between them.",
            },
            {
                id: "focus",
                title: "Focus that holds",
                body: "One deep block at a time, with a gentle pause before the next.",
            },
            {
                id: "review",
                title: "A quiet review",
                body: "The last five minutes of the day close the loop without a dashboard.",
            },
            {
                id: "rooms",
                title: "Rooms for context",
                body: "Work, home, and the long project each get their own rhythm.",
            },
        ],
    },
    {
        value: "pricing",
        label: "Pricing",
        eyebrow: "Pricing",
        title: "Pay for the calm, not the seats.",
        lead: "One simple plan for individuals and small studios. Cancel whenever the season changes.",
        primaryAction: "Start free",
        variant: "pricing",
        panels: [],
        features: [
            {
                id: "free",
                title: "Everything in the free plan",
                body: "Unlimited loops, the weekly canvas, and the evening review.",
            },
            {
                id: "focus",
                title: "Focus sessions",
                body: "Timed blocks, pauses, and a weekly total without a leaderboard.",
            },
            {
                id: "studios",
                title: "Shared studios",
                body: "Invite a small team and keep each person's rhythm private.",
            },
            {
                id: "cancel",
                title: "Cancel anytime",
                body: "No annual lock-in; the season is yours to end.",
            },
        ],
    },
];

const HomeEntryId: string = "sticky";
const HomeDefaultRoute: string = "launch";

/**
 * Reads the first hash segment, which identifies the showcase entry.
 * @example
 * const entry: string = readRouteEntry();
 */
const readRouteEntry: () => string = (): string => {
    if (typeof window === "undefined") {
        return "";
    }

    const segments: readonly string[] = window.location.hash.replace(/^#/, "").split("/");

    return (segments[0] ?? "").trim().toLowerCase();
};

/**
 * Resolves the homepage route from the second hash segment.
 * @example
 * const route: string = readHomeRoute();
 */
const readHomeRoute: () => string = (): string => {
    if (typeof window === "undefined") {
        return HomeDefaultRoute;
    }

    const segments: readonly string[] = window.location.hash.replace(/^#/, "").split("/");

    if ((segments[0] ?? "").trim().toLowerCase() !== HomeEntryId) {
        return HomeDefaultRoute;
    }

    const candidate: string = (segments[1] ?? "").trim().toLowerCase();

    return homeRoutes.some((route: StickyHomeRoute): boolean => route.value === candidate)
        ? candidate
        : HomeDefaultRoute;
};

/**
 * Sticky site navigation shared by every homepage route.
 * @example
 * <HomeNav active="launch" />
 */
const HomeNav: FC<{ active: string }> = ({ active }: { active: string }) => (
    <Sticky
        offset={0}
        zIndex={30}
        className="sticky-home__nav"
        stuckClassName="is-stuck"
    >
        <span className="sticky-home__brand">
            <span className="sticky-home__mark" aria-hidden="true" />
            <Text as="span" variant="h4" className="sticky-home__wordmark">
                Periodica
            </Text>
        </span>
        <nav className="sticky-home__links" aria-label="Homepage routes">
            {homeRoutes.map((route: StickyHomeRoute) => (
                <Anchor
                    key={route.value}
                    href={`#${HomeEntryId}/${route.value}`}
                    active={route.value === active}
                >
                    {route.label}
                </Anchor>
            ))}
        </nav>
        <Button size="sm" className="sticky-home__nav-cta">
            Start free
        </Button>
    </Sticky>
);

/**
 * Sticky hero panel with the product orbit.
 * @example
 * <HomeHero route={homeRoutes[0]} />
 */
const HomeHero: FC<{ route: StickyHomeRoute }> = ({ route }: { route: StickyHomeRoute }) => (
    <Sticky
        offset={56}
        zIndex={1}
        className={`sticky-home__hero ${
            route.variant === "stacked" ? "sticky-home__hero--tall" : "sticky-home__hero--compact"
        }`.trim()}
    >
        <div className="sticky-home__hero-copy">
            <Text className="sticky-home__eyebrow" variant="label">
                {route.eyebrow}
            </Text>
            <Text as="h3" variant="h1" className="sticky-home__hero-title">
                {route.title}
            </Text>
            <Text className="sticky-home__hero-lead" variant="body">
                {route.lead}
            </Text>
            <Inline gap="sm" wrap>
                <Button className="sticky-home__hero-primary">{route.primaryAction}</Button>
                <Button variant="outline" className="sticky-home__hero-secondary">
                    See the tour
                </Button>
            </Inline>
            <Inline gap="sm" className="sticky-home__proof">
                <Badge tone="mint">New</Badge>
                <Text variant="body-sm">A quieter rhythm for the season.</Text>
            </Inline>
        </div>
        <div className="sticky-home__orb" aria-hidden="true">
            <span className="sticky-home__orb-ring" />
            <span className="sticky-home__orb-core" />
            <div className="sticky-home__float">
                <Text variant="label">Cycle 04</Text>
                <ProgressRing value={68} size={86} stroke={7} label="cycle" />
                <Text variant="body-sm">Day 17 of 28</Text>
            </div>
        </div>
    </Sticky>
);

/**
 * One sticky statement panel that slides over the panel before it.
 * @example
 * <HomePanel panel={route.panels[0]} index={0} />
 */
const HomePanel: FC<{ panel: StickyHomePanel; index: number }> = ({
    panel,
    index,
}: {
    panel: StickyHomePanel;
    index: number;
}) => (
    <Sticky
        offset={56}
        zIndex={2 + index}
        className={`sticky-home__panel sticky-home__panel--${panel.tone}`}
    >
        <div className="sticky-home__panel-copy">
            <Text className="sticky-home__eyebrow" variant="label">
                {panel.eyebrow}
            </Text>
            <Text as="h4" variant="h2" className="sticky-home__panel-title">
                {panel.title}
            </Text>
            <Text variant="body" className="sticky-home__panel-body">
                {panel.body}
            </Text>
        </div>
        <div className="sticky-home__panel-metric">
            <span className="sticky-home__metric">{panel.metric}</span>
            <span className="sticky-home__metric-label">{panel.metricLabel}</span>
        </div>
    </Sticky>
);

/**
 * Decorative product window used as the sticky media column.
 * @example
 * <HomeProductMock />
 */
const HomeProductMock: FC = () => (
    <div className="sticky-home__mock" aria-hidden="true">
        <div className="sticky-home__mock-bar">
            <span />
            <span />
            <span />
            <em>Today</em>
        </div>
        <div className="sticky-home__mock-body">
            <div className="sticky-home__mock-ring">
                <ProgressRing value={68} size={84} stroke={7} label="cycle" />
            </div>
            <div className="sticky-home__mock-list">
                {["Morning pages", "Deep work", "Evening review"].map(
                    (item: string, index: number) => (
                        <div className="sticky-home__mock-row" key={item}>
                            <span
                                className="sticky-home__mock-dot"
                                data-tone={["mint", "accent", "amber"][index]}
                            />
                            <span className="sticky-home__mock-name">{item}</span>
                            <span className="sticky-home__mock-time">
                                {["07:30", "09:00", "18:40"][index]}
                            </span>
                        </div>
                    ),
                )}
            </div>
        </div>
        <div className="sticky-home__mock-foot">
            <span>3 loops</span>
            <span>1 deep block</span>
        </div>
    </div>
);

/**
 * Scrolls feature copy beside a sticky product window.
 * @example
 * <HomeSplit route={homeRoutes[1]} />
 */
const HomeSplit: FC<{ route: StickyHomeRoute }> = ({ route }: { route: StickyHomeRoute }) => (
    <section className="sticky-home__split" aria-labelledby={`home-${route.value}-features`}>
        <Sticky offset={72} zIndex={6} className="sticky-home__media">
            <HomeProductMock />
        </Sticky>
        <div className="sticky-home__features">
            <Text as="h4" variant="h2" id={`home-${route.value}-features`}>
                A calmer way to work
            </Text>
            {route.features.map((feature: StickyHomeFeature, index: number) => (
                <article className="sticky-home__feature" key={feature.id}>
                    <span className="sticky-home__feature-index" aria-hidden="true">
                        {`0${index + 1}`}
                    </span>
                    <Text as="h4" variant="h4">
                        {feature.title}
                    </Text>
                    <Text variant="body" tone="soft">
                        {feature.body}
                    </Text>
                </article>
            ))}
        </div>
    </section>
);

/**
 * Pricing page with a sticky plan card and a scrolling inclusion list.
 * @example
 * <HomePricing route={homeRoutes[2]} />
 */
const HomePricing: FC<{ route: StickyHomeRoute }> = ({ route }: { route: StickyHomeRoute }) => (
    <section className="sticky-home__pricing" aria-labelledby={`home-${route.value}-features`}>
        <header className="sticky-home__pricing-intro">
            <Text className="sticky-home__eyebrow" variant="label">
                {route.eyebrow}
            </Text>
            <Text as="h3" variant="h1" className="sticky-home__pricing-title">
                {route.title}
            </Text>
            <Text variant="body" tone="soft" className="sticky-home__pricing-lead">
                {route.lead}
            </Text>
        </header>
        <div className="sticky-home__pricing-body">
            <Sticky offset={72} zIndex={6} className="sticky-home__plan">
                <div className="sticky-home__plan-head">
                    <Text variant="label" tone="accent">
                        Solo
                    </Text>
                    <Badge tone="mint">Most calm</Badge>
                </div>
                <div className="sticky-home__price">
                    <span className="sticky-home__price-value">$12</span>
                    <span className="sticky-home__price-unit">/ month</span>
                </div>
                <Text variant="body" className="sticky-home__plan-lead">
                    Everything for one calm practice.
                </Text>
                <Button className="sticky-home__plan-cta">Start the 14-day trial</Button>
                <Text variant="body-sm" className="sticky-home__plan-note">
                    No card required. Cancel whenever.
                </Text>
            </Sticky>
            <div className="sticky-home__features">
                <Text as="h4" variant="h2" id={`home-${route.value}-features`}>
                    Simple by default
                </Text>
                {route.features.map((feature: StickyHomeFeature, index: number) => (
                    <article className="sticky-home__feature" key={feature.id}>
                        <span className="sticky-home__feature-index" aria-hidden="true">
                            {`0${index + 1}`}
                        </span>
                        <Text as="h4" variant="h4">
                            {feature.title}
                        </Text>
                        <Text variant="body" tone="soft">
                            {feature.body}
                        </Text>
                    </article>
                ))}
            </div>
        </div>
    </section>
);

/**
 * Closing call to action.
 * @example
 * <HomeFooter />
 */
const HomeFooter: FC = () => (
    <footer className="sticky-home__footer">
        <Text as="h4" variant="h2">
            Start with one loop.
        </Text>
        <Text variant="body" className="sticky-home__footer-lead">
            The season can wait. Pick the smallest thing worth repeating.
        </Text>
        <Button className="sticky-home__footer-cta">Begin free</Button>
    </footer>
);

/**
 * One routed homepage inside a StickyPage/Scroll viewport.
 * @example
 * <StickyHomeView route={homeRoutes[0]} />
 */
const StickyHomeView: FC<{ route: StickyHomeRoute }> = ({ route }: { route: StickyHomeRoute }) => (
    <StickyPageSurface
        className="sticky-home"
        height={560}
        ariaLabel={`${route.label} homepage`}
    >
        <HomeNav active={route.value} />
        {route.variant === "pricing" ? null : <HomeHero route={route} />}
        {route.variant === "stacked"
            ? route.panels.map((panel: StickyHomePanel, index: number) => (
                  <HomePanel key={panel.id} panel={panel} index={index} />
              ))
            : null}
        {route.variant === "pricing" ? (
            <HomePricing route={route} />
        ) : (
            <HomeSplit route={route} />
        )}
        <HomeFooter />
    </StickyPageSurface>
);

/**
 * Routed homepage demo. The hash route selects the homepage variant, and each
 * variant is a StickyPage whose Scroll viewport contains the sticky nav, hero,
 * panels, and media layers.
 * @example
 * <StickyHomeDemo />
 * @returns The interactive homepage demo.
 */
const StickyHomeDemo: FC = () => {
    const [routeValue, setRouteValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>(readHomeRoute);

    useEffect((): (() => void) => {
        const handleHashChange: () => void = (): void => {
            setRouteValue(readHomeRoute());
        };

        window.addEventListener("hashchange", handleHashChange);

        return (): void => {
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, []);

    useEffect((): void => {
        if (readRouteEntry() !== HomeEntryId) {
            return;
        }

        const target: string = `#${HomeEntryId}/${routeValue}`;

        if (window.location.hash !== target) {
            window.history.replaceState(null, "", target);
        }
    }, [routeValue]);

    const activeIndex: number = Math.max(
        homeRoutes.findIndex((route: StickyHomeRoute): boolean => route.value === routeValue),
        0,
    );
    const activeRoute: StickyHomeRoute = homeRoutes[activeIndex] as StickyHomeRoute;

    return (
        <div className="sticky-home-demo">
            <div className="sticky-home-demo__chrome">
                <span className="sticky-home-demo__dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </span>
                <span className="sticky-home-demo__address">
                    {`#${HomeEntryId}/${activeRoute.value}`}
                </span>
                <span className="sticky-home-demo__count" aria-hidden="true">
                    {`${activeIndex + 1} / ${homeRoutes.length}`}
                </span>
            </div>
            <StickyHomeView key={activeRoute.value} route={activeRoute} />
        </div>
    );
};

export default StickyHomeDemo;
