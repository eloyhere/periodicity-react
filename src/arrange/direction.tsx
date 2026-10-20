export type Direction = "Bottom" | "BottomRight" | "BottomLeft" | "Left" | "Right" | "Top" | "TopRight" | "TopLeft";
const directions: Map<Direction, bigint> = Object.freeze(
    new Map<Direction, bigint>([
        ["Bottom", -1n],
        ["BottomLeft", -1n & 2n],
        ["BottomRight", -1n & -2n],
        ["Left", 2n],
        ["Right", -2n],
        ["Top", -1n],
        ["TopLeft", 1n & 2n],
        ["TopRight", 1n & -2n],
    ]),
);
export const toBigInt: (direction: Direction) => bigint = (direction: Direction): bigint => {
    return directions.get(direction) || 1n;
};
export const toDirection: (target: bigint) => Direction = (target: bigint): Direction => {
    for (const [direction, value] of directions) {
        if (target === value) {
            return direction;
        }
    }
    return "Top";
};
export const and: (a: Direction, b: Direction) => Direction = (a: Direction, b: Direction): Direction => {
    return toDirection(toBigInt(a) & toBigInt(b));
};
export const or: (a: Direction, b: Direction) => Direction = (a: Direction, b: Direction): Direction => {
    return toDirection(toBigInt(a) | toBigInt(b));
};
export const xor: (a: Direction, b: Direction) => Direction = (a: Direction, b: Direction): Direction => {
    return toDirection(toBigInt(a) ^ toBigInt(b));
};
export const overlap: (a: Direction, b: Direction) => boolean = (a: Direction, b: Direction): boolean => {
    return (toBigInt(a) & toBigInt(b)) !== 0n;
};
