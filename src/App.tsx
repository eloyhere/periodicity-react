import {
    useEffect,
    useState,
    type ChangeEvent,
    type CSSProperties,
    type Dispatch,
    type FC,
    type FormEvent,
    type ReactNode,
    type SetStateAction,
} from "react";
import { Columns, Inline, Stack } from "./arrange/layout";
import Badge from "./component/badge/Badge";
import Button from "./component/button/Button";
import Card from "./component/card/Card";
import Dialog from "./component/dialog/Dialog";
import Icon, { type IconName } from "./component/icon/Icon";
import Switch from "./component/input/switch/Switch";
import TextInput from "./component/input/text/TextInput";
import { Select, type SelectOption } from "./component/input/select";
import ProgressRing from "./component/ring/ProgressRing";
import Surface from "./component/surface/Surface";
import { initialRituals, momentum, type MomentumPoint, type Ritual, type RitualTone } from "./data/rituals";
import "./App.css";

type Theme = "dark" | "light";

type NavId = "overview" | "cycles" | "rituals" | "insights";

interface NavItem {
    id: NavId;
    label: string;
    icon: IconName;
}

interface FocusState {
    remaining: number;
    running: boolean;
}

const ThemeKey: string = "periodicity-theme";
const FocusTotal: number = 25 * 60;
const CycleProgress: number = 68;
const CycleDay: number = 17;
const CycleLength: number = 28;
const CycleLeft: number = CycleLength - CycleDay;

const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: "Menu" },
    { id: "cycles", label: "Cycles", icon: "Refresh" },
    { id: "rituals", label: "Rituals", icon: "Plan" },
    { id: "insights", label: "Insights", icon: "Goal" },
];

const cadenceOptions: SelectOption[] = [
    { value: "daily", label: "Daily" },
    { value: "weekdays", label: "Weekdays" },
    { value: "weekly", label: "Weekly" },
];

const ritualTones: RitualTone[] = ["lime", "mint", "violet", "amber"];

const pad: (value: number) => string = (value: number): string => `${value}`.padStart(2, "0");

const readTheme: () => Theme = (): Theme => {
    try {
        const stored: string | null = window.localStorage.getItem(ThemeKey);

        if (stored === "light" || stored === "dark") {
            return stored;
        }
    } catch {
        // Storage can be unavailable in private windows; fall back to the media query.
    }

    const prefersLight: boolean = window.matchMedia("(prefers-color-scheme: light)").matches;

    return prefersLight ? "light" : "dark";
};

const initialTheme: Theme = readTheme();

const App: FC = () => {
    const [theme, setTheme]: [Theme, Dispatch<SetStateAction<Theme>>] = useState<Theme>(initialTheme);
    const [activeNav, setActiveNav]: [NavId, Dispatch<SetStateAction<NavId>>] = useState<NavId>("overview");
    const [rituals, setRituals]: [Ritual[], Dispatch<SetStateAction<Ritual[]>>] = useState<Ritual[]>(initialRituals);
    const [dialogOpen, setDialogOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [draftTitle, setDraftTitle]: [string, Dispatch<SetStateAction<string>>] = useState<string>("");
    const [draftTime, setDraftTime]: [string, Dispatch<SetStateAction<string>>] = useState<string>("08:00");
    const [cadence, setCadence]: [string, Dispatch<SetStateAction<string>>] = useState<string>("daily");
    const [reminder, setReminder]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(true);
    const [announcement, setAnnouncement]: [string, Dispatch<SetStateAction<string>>] = useState<string>("");
    const [focus, setFocus]: [FocusState, Dispatch<SetStateAction<FocusState>>] = useState<FocusState>({
        remaining: FocusTotal,
        running: false,
    });

    const completedCount: number = rituals.filter((ritual: Ritual): boolean => ritual.done).length;
    const openCount: number = rituals.length - completedCount;
    const focusPercent: number = (focus.remaining / FocusTotal) * 100;
    const focusMinutes: number = Math.floor(focus.remaining / 60);
    const focusSeconds: number = focus.remaining % 60;
    const focusStatus: string = focus.running ? "In session" : focus.remaining === 0 ? "Session complete" : "Paused";
    const cadenceOption: SelectOption | null =
        cadenceOptions.find((option: SelectOption): boolean => option.value === cadence) ?? null;
    const cadenceLabel: string = cadenceOption === null ? "Daily" : cadenceOption.label;
    const peakPoint: MomentumPoint | null = momentum.reduce(
        (best: MomentumPoint | null, point: MomentumPoint): MomentumPoint | null =>
            best === null || point.value > best.value ? point : best,
        null,
    );
    const peakValue: number = peakPoint === null ? 0 : peakPoint.value;
    const averageValue: number = Math.round(
        momentum.reduce((total: number, point: MomentumPoint): number => total + point.value, 0) / momentum.length,
    );

    useEffect((): void => {
        document.documentElement.dataset.theme = theme;

        try {
            window.localStorage.setItem(ThemeKey, theme);
        } catch {
            // The theme still applies for this session when storage is blocked.
        }
    }, [theme]);

    useEffect((): (() => void) | void => {
        if (!focus.running) {
            return;
        }

        const intervalId: number = window.setInterval((): void => {
            setFocus((current: FocusState): FocusState => {
                if (current.remaining <= 1) {
                    return { remaining: 0, running: false };
                }

                return { remaining: current.remaining - 1, running: current.running };
            });
        }, 1000);

        return (): void => {
            window.clearInterval(intervalId);
        };
    }, [focus.running]);

    const handleThemeToggle: () => void = (): void => {
        setTheme((current: Theme): Theme => (current === "dark" ? "light" : "dark"));
    };

    const handleRitualToggle: (ritualId: string) => void = (ritualId: string): void => {
        setRituals((current: Ritual[]): Ritual[] =>
            current.map((ritual: Ritual): Ritual =>
                ritual.id === ritualId ? { ...ritual, done: !ritual.done } : ritual,
            ),
        );
    };

    const handleOpenDialog: () => void = (): void => {
        setDialogOpen(true);
    };

    const handleCloseDialog: () => void = (): void => {
        setDialogOpen(false);
    };

    const handleReviewCycle: () => void = (): void => {
        setActiveNav("cycles");
    };

    const handleTitleChange: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        setDraftTitle(event.target.value);
    };

    const handleTimeChange: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        setDraftTime(event.target.value);
    };

    const handleCadenceChange: (value: string) => void = (value: string): void => {
        setCadence(value);
    };

    const handleReminderChange: (next: boolean) => void = (next: boolean): void => {
        setReminder(next);
    };

    const handleFocusToggle: () => void = (): void => {
        setFocus((current: FocusState): FocusState => {
            if (current.remaining === 0) {
                return { remaining: FocusTotal, running: true };
            }

            return { remaining: current.remaining, running: !current.running };
        });
    };

    const handleFocusReset: () => void = (): void => {
        setFocus({ remaining: FocusTotal, running: false });
    };

    const handleCreateRitual: (event: FormEvent<HTMLFormElement>) => void = (
        event: FormEvent<HTMLFormElement>,
    ): void => {
        event.preventDefault();

        const title: string = draftTitle.trim();

        if (title.length === 0) {
            return;
        }

        const nextRitual: Ritual = {
            id: crypto.randomUUID(),
            time: draftTime.length > 0 ? draftTime : "08:00",
            title,
            detail: `${cadenceLabel} · ${reminder ? "Reminder on" : "No reminder"}`,
            duration: "20 min",
            tone: ritualTones[rituals.length % ritualTones.length],
            done: false,
        };

        setRituals((current: Ritual[]): Ritual[] =>
            [...current, nextRitual].sort((first: Ritual, second: Ritual): number =>
                first.time.localeCompare(second.time),
            ),
        );
        setDraftTitle("");
        setDraftTime("08:00");
        setCadence("daily");
        setReminder(true);
        setDialogOpen(false);
        setAnnouncement(`${title} was added to your rituals.`);
    };

    return (
        <>
            <Inline className="app-shell" gap="xl" align="stretch">
                <aside className="sidebar" aria-label="Workspace">
                    <Stack className="sidebar__inner" gap="lg">
                        <Inline className="brand" gap="sm" align="center">
                            <span className="brand__mark" aria-hidden="true">
                                <span className="brand__orbit" />
                                <span className="brand__orbit brand__orbit--inner" />
                                <span className="brand__core" />
                            </span>
                            <span className="brand__text">
                                <span className="brand__word">Periodicity</span>
                                <span className="brand__tag">Personal OS</span>
                            </span>
                        </Inline>

                        <div className="workspace">
                            <span className="workspace__badge" aria-hidden="true">
                                M
                            </span>
                            <span className="workspace__text">
                                <span className="workspace__name">Mira&apos;s space</span>
                                <span className="workspace__meta">Cycle 04 · Personal</span>
                            </span>
                            <Icon name="ChevronDown" size={14} className="workspace__chevron" />
                        </div>

                        <nav className="nav" aria-label="Primary">
                            <Stack className="nav__list" gap="xs">
                                {navItems.map((item: NavItem): ReactNode => {
                                    const isActive: boolean = item.id === activeNav;

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`nav__item ${isActive ? "is-active" : ""}`.trim()}
                                            aria-current={isActive ? "page" : "false"}
                                            onClick={(): void => setActiveNav(item.id)}
                                        >
                                            <Icon name={item.icon} size={17} />
                                            <span className="nav__label">{item.label}</span>
                                            {item.id === "rituals" ? (
                                                <span className="nav__count">{openCount}</span>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </Stack>
                        </nav>

                        <Surface
                            className="cycle"
                            background={<span className="cycle__wash" />}
                            foreground={<span className="cycle__lines" />}
                        >
                            <Stack className="cycle__content" gap="sm">
                                <Inline justify="between" align="center" gap="sm">
                                    <p className="eyebrow">Cycle 04</p>
                                    <p className="cycle__percent">{CycleProgress}%</p>
                                </Inline>
                                <p className="cycle__title">The Long Now</p>
                                <div
                                    className="cycle__track"
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={CycleLength}
                                    aria-valuenow={CycleDay}
                                    aria-label="Days completed in cycle 04"
                                >
                                    <span
                                        className="cycle__fill"
                                        style={{ width: `${(CycleDay / CycleLength) * 100}%` }}
                                    />
                                </div>
                                <Inline justify="between" align="center" gap="sm">
                                    <span className="cycle__meta">
                                        Day {CycleDay} of {CycleLength}
                                    </span>
                                    <span className="cycle__meta">{CycleLeft} days left</span>
                                </Inline>
                            </Stack>
                        </Surface>

                        <div className="profile">
                            <span className="avatar avatar--lg" aria-hidden="true">
                                MC
                            </span>
                            <span className="profile__text">
                                <span className="profile__name">Mira Chen</span>
                                <span className="profile__meta">Personal workspace</span>
                            </span>
                            <Button variant="quiet" size="sm" icon="Setting" aria-label="Workspace settings" />
                        </div>
                    </Stack>
                </aside>

                <main className="main">
                    <Stack className="main__stack" gap="lg">
                        <Inline className="topbar" justify="between" align="center" gap="md" wrap>
                            <nav className="crumbs" aria-label="Breadcrumb">
                                <ol className="crumbs__list">
                                    <li className="crumbs__item">Personal</li>
                                    <li className="crumbs__item crumbs__item--current" aria-current="page">
                                        Overview
                                    </li>
                                </ol>
                            </nav>
                            <Inline className="topbar__tools" gap="sm" align="center">
                                <span className="topbar__date">
                                    <Icon name="Calendar" size={14} />
                                    20 Oct 2026
                                </span>
                                <Button variant="quiet" size="sm" icon="Search" aria-label="Search rituals and notes" />
                                <Button
                                    variant="quiet"
                                    size="sm"
                                    icon={theme === "dark" ? "Sun" : "Moon"}
                                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                                    onClick={handleThemeToggle}
                                />
                                <Button
                                    variant="quiet"
                                    size="sm"
                                    icon="Bell"
                                    className="notify"
                                    aria-label="Notifications, 3 unread"
                                >
                                    <span className="notify__dot" aria-hidden="true" />
                                </Button>
                                <span className="avatar avatar--top" aria-hidden="true">
                                    MC
                                </span>
                            </Inline>
                        </Inline>

                        <Surface
                            className="hero"
                            background={<span className="hero__wash" />}
                            foreground={
                                <span className="hero__orbits">
                                    <span />
                                    <span />
                                    <span />
                                </span>
                            }
                        >
                            <Inline className="hero__layout" gap="xl" align="center" wrap>
                                <Stack className="hero__copy" gap="md">
                                    <p className="eyebrow">
                                        <span className="hero__pulse" aria-hidden="true" />
                                        Cycle 04 · Day {CycleDay}
                                    </p>
                                    <h1 className="hero__title">
                                        Keep the rhythm, <em>not the rush.</em>
                                    </h1>
                                    <p className="hero__lede">
                                        A quiet operating system for the work that repeats. Tend the small loops with
                                        care and the season looks after itself.
                                    </p>
                                    <Inline className="hero__actions" gap="sm" wrap>
                                        <Button size="lg" icon="Plus" onClick={handleOpenDialog}>
                                            New ritual
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            trailingIcon="ArrowUpRight"
                                            onClick={handleReviewCycle}
                                        >
                                            Review cycle
                                        </Button>
                                    </Inline>
                                </Stack>
                                <Stack className="hero__aside" gap="sm" align="center">
                                    <div className="hero__ring">
                                        <ProgressRing value={CycleProgress} size={176} stroke={10} label="cycle" />
                                        <Badge tone="lime" className="hero__float">
                                            <Icon name="Sparkle" size={11} />
                                            On track
                                        </Badge>
                                    </div>
                                    <p className="hero__days">
                                        <span className="hero__days-value">
                                            {CycleDay} / {CycleLength}
                                        </span>
                                        days
                                    </p>
                                </Stack>
                            </Inline>
                        </Surface>

                        <Columns className="stats" count={3} gap="lg">
                            <div className="stat">
                                <p className="stat__value">
                                    17<span className="stat__unit">/ 28</span>
                                </p>
                                <p className="stat__label">Days in cycle</p>
                                <p className="stat__note">The Long Now · spring</p>
                            </div>
                            <div className="stat">
                                <p className="stat__value">82%</p>
                                <p className="stat__label">Consistency</p>
                                <p className="stat__note stat__note--up">+6% vs last week</p>
                            </div>
                            <div className="stat">
                                <p className="stat__value">
                                    4h<span className="stat__unit">20m</span>
                                </p>
                                <p className="stat__label">Focus this week</p>
                                <p className="stat__note">6 deep sessions</p>
                            </div>
                        </Columns>

                        <Inline className="board-row" gap="lg" align="stretch">
                            <Card
                                className="board__wide rhythm"
                                eyebrow="Wed 20 Oct"
                                title="Today's rhythm"
                                action={
                                    <Badge tone="lime">
                                        {completedCount} of {rituals.length}
                                    </Badge>
                                }
                            >
                                <Stack className="rhythm__list" gap="xs">
                                    {rituals.map((ritual: Ritual): ReactNode => (
                                        <Surface
                                            key={ritual.id}
                                            className={`ritual ritual--${ritual.tone} ${
                                                ritual.done ? "ritual--done" : ""
                                            }`.trim()}
                                            ripple="foreground"
                                        >
                                            <button
                                                type="button"
                                                className="ritual__button"
                                                aria-pressed={ritual.done}
                                                onClick={(): void => handleRitualToggle(ritual.id)}
                                            >
                                                <span className="ritual__dot" aria-hidden="true" />
                                                <span className="ritual__time">{ritual.time}</span>
                                                <span className="ritual__body">
                                                    <span className="ritual__title">{ritual.title}</span>
                                                    <span className="ritual__detail">{ritual.detail}</span>
                                                </span>
                                                <span className="ritual__duration">{ritual.duration}</span>
                                                <span className="ritual__check" aria-hidden="true">
                                                    <Icon name="Check" size={13} />
                                                </span>
                                            </button>
                                        </Surface>
                                    ))}
                                </Stack>
                            </Card>

                            <Card
                                className="board__narrow focus"
                                tone="mint"
                                eyebrow="Deep work"
                                title="Focus session"
                                action={<Badge tone="mint">25 min</Badge>}
                            >
                                <Stack className="focus__body" gap="sm" align="center">
                                    <ProgressRing value={focusPercent} size={128} stroke={8} label="focus" />
                                    <p className="focus__timer" role="timer">
                                        {pad(focusMinutes)}:{pad(focusSeconds)}
                                    </p>
                                    <p className="focus__state">{focusStatus}</p>
                                    <Inline className="focus__actions" gap="sm" align="center">
                                        <Button icon={focus.running ? "Pause" : "Play"} onClick={handleFocusToggle}>
                                            {focus.running ? "Pause" : focus.remaining === 0 ? "Restart" : "Start"}
                                        </Button>
                                        <Button variant="quiet" onClick={handleFocusReset}>
                                            Reset
                                        </Button>
                                    </Inline>
                                </Stack>
                            </Card>
                        </Inline>

                        <Inline className="board-row" gap="lg" align="stretch">
                            <Card
                                className="board__wide momentum"
                                eyebrow="Last 7 days"
                                title="Momentum"
                                action={<Badge tone="mint">+18% vs last week</Badge>}
                            >
                                <p className="chart-intro">Focused minutes across the week.</p>
                                <div
                                    className="chart"
                                    role="group"
                                    aria-label="Focused minutes for each day of the last week"
                                >
                                    {momentum.map((point: MomentumPoint): ReactNode => {
                                        const isPeak: boolean = point.value === peakValue;
                                        const barStyle: CSSProperties = {
                                            height: `${point.value}%`,
                                        };

                                        return (
                                            <div
                                                key={point.day}
                                                className={`chart__col ${isPeak ? "chart__col--peak" : ""}`.trim()}
                                                role="img"
                                                aria-label={`${point.day}: ${point.value} focused minutes`}
                                                title={`${point.day} · ${point.value} focused minutes`}
                                            >
                                                <span className="chart__value">{point.value}</span>
                                                <span className="chart__track">
                                                    <span className="chart__bar" style={barStyle} />
                                                </span>
                                                <span className="chart__day">{point.day}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Inline className="chart__legend" gap="sm" justify="between" align="center" wrap>
                                    <span className="chart__legend-item">
                                        <span className="chart__dot" aria-hidden="true" />
                                        Peak ·{" "}
                                        {peakPoint === null ? "no data" : `${peakPoint.day} ${peakPoint.value} min`}
                                    </span>
                                    <span className="chart__legend-item chart__legend-item--muted">
                                        Avg {averageValue} min
                                    </span>
                                </Inline>
                            </Card>

                            <Card
                                className="board__narrow nextup"
                                eyebrow="Next up"
                                action={<Badge tone="amber">In 2h</Badge>}
                            >
                                <Inline className="nextup__head" gap="md" align="start">
                                    <div className="nextup__date" aria-hidden="true">
                                        <span className="nextup__day">20</span>
                                        <span className="nextup__month">Oct</span>
                                    </div>
                                    <Stack className="nextup__copy" gap="xs">
                                        <h4 className="nextup__title">Design review</h4>
                                        <Inline className="nextup__meta" gap="xs" align="center">
                                            <Icon name="Clock" size={13} />
                                            <span>14:30 – 15:15</span>
                                        </Inline>
                                        <Inline className="nextup__meta" gap="xs" align="center">
                                            <Icon name="Goal" size={13} />
                                            <span>Studio · East table</span>
                                        </Inline>
                                    </Stack>
                                </Inline>
                                <Inline className="nextup__footer" gap="sm" justify="between" align="center">
                                    <div className="avatar-stack" role="img" aria-label="Mira, Jonah and Ada">
                                        <span className="avatar avatar--sm avatar--lime" aria-hidden="true">
                                            MC
                                        </span>
                                        <span className="avatar avatar--sm avatar--mint" aria-hidden="true">
                                            JR
                                        </span>
                                        <span className="avatar avatar--sm avatar--violet" aria-hidden="true">
                                            AL
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        trailingIcon="ArrowUpRight"
                                        aria-label="Open Design review at 14:30"
                                    >
                                        Open
                                    </Button>
                                </Inline>
                            </Card>
                        </Inline>

                        <Inline className="footer-strip" justify="between" align="center" gap="md" wrap>
                            <p className="footer-strip__quote">Small loops, repeated with care.</p>
                            <p className="footer-strip__status">
                                <span className="footer-strip__pulse" aria-hidden="true" />
                                All systems quiet
                            </p>
                        </Inline>
                    </Stack>
                </main>
            </Inline>

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                title="New ritual"
                eyebrow="Ritual builder"
                footer={
                    <>
                        <Button variant="ghost" onClick={handleCloseDialog}>
                            Cancel
                        </Button>
                        <Button type="submit" form="new-ritual-form" disabled={draftTitle.trim().length === 0}>
                            Create ritual
                        </Button>
                    </>
                }
            >
                <form className="ritual-form" id="new-ritual-form" onSubmit={handleCreateRitual}>
                    <TextInput
                        label="Ritual name"
                        value={draftTitle}
                        onChange={handleTitleChange}
                        placeholder="Evening stretch"
                        maxLength={52}
                        autoFocus
                    />
                    <Inline className="ritual-form__row" gap="md" align="end">
                        <Select
                            label="Cadence"
                            value={cadence}
                            options={cadenceOptions}
                            onChange={handleCadenceChange}
                        />
                        <TextInput label="Time" type="time" value={draftTime} onChange={handleTimeChange} />
                    </Inline>
                    <Inline className="ritual-form__switch" gap="md" justify="between" align="center">
                        <span className="ritual-form__switch-copy">
                            <span className="ritual-form__switch-title">Reminder</span>
                            <span className="ritual-form__switch-hint">A quiet nudge ten minutes before.</span>
                        </span>
                        <Switch
                            checked={reminder}
                            onChange={handleReminderChange}
                            label="Remind me before this ritual"
                        />
                    </Inline>
                    <p className="ritual-form__note">
                        {cadenceLabel} · {draftTime.length > 0 ? draftTime : "08:00"} · 20 min
                    </p>
                </form>
            </Dialog>

            <p className="sr-only" role="status" aria-live="polite">
                {announcement}
            </p>
        </>
    );
};

export default App;
