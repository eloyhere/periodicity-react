export type RitualTone = "lime" | "mint" | "violet" | "amber";

export interface Ritual {
    id: string;
    time: string;
    title: string;
    detail: string;
    duration: string;
    tone: RitualTone;
    done: boolean;
}

export interface MomentumPoint {
    day: string;
    value: number;
}

export const initialRituals: Ritual[] = [
    {
        id: "morning-pages",
        time: "07:30",
        title: "Morning pages",
        detail: "Three pages, no editing",
        duration: "20 min",
        tone: "lime",
        done: true,
    },
    {
        id: "deep-work",
        time: "09:00",
        title: "Deep work block",
        detail: "Product systems · Studio",
        duration: "90 min",
        tone: "mint",
        done: true,
    },
    {
        id: "long-walk",
        time: "13:15",
        title: "Long walk",
        detail: "No headphones, just the city",
        duration: "35 min",
        tone: "amber",
        done: false,
    },
    {
        id: "evening-review",
        time: "17:30",
        title: "Evening review",
        detail: "Close loops, set tomorrow",
        duration: "15 min",
        tone: "violet",
        done: false,
    },
];

export const momentum: MomentumPoint[] = [
    { day: "Mon", value: 44 },
    { day: "Tue", value: 62 },
    { day: "Wed", value: 51 },
    { day: "Thu", value: 78 },
    { day: "Fri", value: 69 },
    { day: "Sat", value: 86 },
    { day: "Sun", value: 58 },
];
