import { createIcon, type Icon } from "../types";

/**
 * Mathematical icon names used by formulas, calculators, and data tools.
 * Type: type alias.
 * Fields: none.
 * @example
 * const name: MathIconName = "Sum";
 */
export type MathIconName =
    | "Equal"
    | "NotEqual"
    | "LessThan"
    | "GreaterThan"
    | "Sum"
    | "Pi"
    | "Infinity"
    | "SquareRoot"
    | "Fraction"
    | "Percent"
    | "Integral"
    | "Function"
    | "Matrix"
    | "Angle"
    | "Delta"
    | "Partial"
    | "Nabla"
    | "Product"
    | "Factorial"
    | "Union"
    | "Intersection"
    | "ElementOf"
    | "NotElementOf"
    | "Subset"
    | "ForAll"
    | "Exists"
    | "PlusMinus"
    | "Approximately"
    | "Degree"
    | "Proportional"
    | "Therefore"
    | "Because"
    | "Vector"
    | "Coordinate"
    | "Integer"
    | "Negative"
    | "Positive"
    | "Absolute"
    | "Rational"
    | "Irrational"
    | "Real"
    | "Imaginary"
    | "Quaternion"
    | "Natural"
    | "Complex"
    | "Even"
    | "Odd";

const createMathSymbol: (
    name: MathIconName,
    symbol: string,
    fontSize?: number,
    fontStyle?: "normal" | "italic",
) => Icon = (
    name: MathIconName,
    symbol: string,
    fontSize: number = 18,
    fontStyle: "normal" | "italic" = "normal",
): Icon =>
    createIcon(
        name,
        <text
            x="12"
            y="12"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'Cambria Math', 'STIX Two Math', Georgia, serif"
            fontSize={fontSize}
            fontStyle={fontStyle}
            fontWeight="600"
            fill="currentColor"
            stroke="none"
        >
            {symbol}
        </text>,
    );

export const mathIcons: Record<MathIconName, Icon> = {
    Equal: createIcon(
        "Equal",
        <>
            <path d="M5 9h14M5 15h14" />
        </>,
    ),
    NotEqual: createIcon(
        "NotEqual",
        <>
            <path d="M5 9h14M5 15h14M16 5 8 19" />
        </>,
    ),
    LessThan: createIcon(
        "LessThan",
        <>
            <path d="m17 6-10 6 10 6" />
        </>,
    ),
    GreaterThan: createIcon(
        "GreaterThan",
        <>
            <path d="m7 6 10 6-10 6" />
        </>,
    ),
    Sum: createIcon(
        "Sum",
        <>
            <path d="M18 5H7l6 7-6 7h11" />
        </>,
    ),
    Pi: createIcon(
        "Pi",
        <>
            <path d="M6.5 6.5h11M9 6.5v12M15 6.5v12" />
        </>,
    ),
    Infinity: createIcon(
        "Infinity",
        <>
            <path d="M8.5 8.5a3.5 3.5 0 1 0 0 7c3.5 0 3.5-7 7-7a3.5 3.5 0 1 1 0 7c-3.5 0-3.5-7-7-7Z" />
        </>,
    ),
    SquareRoot: createIcon(
        "SquareRoot",
        <>
            <path d="M3 12h3l2 5 5-11h8" />
        </>,
    ),
    Fraction: createIcon(
        "Fraction",
        <>
            <path d="M7 6h4M13 18h4M5 19 19 5" />
        </>,
    ),
    Percent: createIcon(
        "Percent",
        <>
            <path d="M5 19 19 5" />
            <circle cx="7.5" cy="7.5" r="2.5" />
            <circle cx="16.5" cy="16.5" r="2.5" />
        </>,
    ),
    Integral: createIcon(
        "Integral",
        <>
            <path d="M14 4c-3 0-3 4-3 8s0 8-3 8" />
        </>,
    ),
    Function: createMathSymbol("Function", "ƒ(x)", 14, "italic"),
    Matrix: createIcon(
        "Matrix",
        <>
            <path d="M8 4H4v16h4M16 4h4v16h-4" />
            <circle cx="9" cy="9" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="9" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15" cy="9" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="9" cy="15" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="12" cy="15" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15" cy="15" r="0.8" fill="currentColor" stroke="none" />
        </>,
    ),
    Angle: createIcon(
        "Angle",
        <>
            <path d="M4 19h16M4 19 15 6M8.5 19a4.5 4.5 0 0 0 1.3-3" />
        </>,
    ),
    Delta: createIcon(
        "Delta",
        <>
            <path d="M12 4 21 20H3L12 4Z" />
        </>,
    ),
    Partial: createMathSymbol("Partial", "∂", 22),
    Nabla: createIcon(
        "Nabla",
        <>
            <path d="M4 5h16l-8 15L4 5Z" />
        </>,
    ),
    Product: createIcon(
        "Product",
        <>
            <path d="M6 5h12M8 5v14M16 5v14" />
        </>,
    ),
    Factorial: createIcon(
        "Factorial",
        <>
            <path d="M12 4v11" />
            <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
        </>,
    ),
    Union: createIcon(
        "Union",
        <>
            <path d="M5 5v7a7 7 0 0 0 14 0V5" />
        </>,
    ),
    Intersection: createIcon(
        "Intersection",
        <>
            <path d="M5 19v-7a7 7 0 0 1 14 0v7" />
        </>,
    ),
    ElementOf: createIcon(
        "ElementOf",
        <>
            <path d="M18 6H9a6 6 0 0 0 0 12h9M5 12h11" />
        </>,
    ),
    NotElementOf: createIcon(
        "NotElementOf",
        <>
            <path d="M18 6H9a6 6 0 0 0 0 12h9M5 12h11M5 19 19 5" />
        </>,
    ),
    Subset: createIcon(
        "Subset",
        <>
            <path d="M18 5H10a7 7 0 0 0 0 14h8" />
        </>,
    ),
    ForAll: createIcon(
        "ForAll",
        <>
            <path d="M4 5h16L12 19 4 5ZM8 12h8" />
        </>,
    ),
    Exists: createIcon(
        "Exists",
        <>
            <path d="M6 5h12M6 12h9M6 19h12" />
        </>,
    ),
    PlusMinus: createIcon(
        "PlusMinus",
        <>
            <path d="M12 4v8M8 8h8M4 16h16M8 20h8" />
        </>,
    ),
    Approximately: createIcon(
        "Approximately",
        <>
            <path d="M4 9c2-2 4-2 6 0s4 2 6 0 4-2 4 0M4 15c2-2 4-2 6 0s4 2 6 0 4-2 4 0" />
        </>,
    ),
    Degree: createIcon(
        "Degree",
        <>
            <circle cx="8" cy="7" r="2.5" />
        </>,
    ),
    Proportional: createIcon(
        "Proportional",
        <>
            <path d="M4 9c5-5 11 5 16 0M4 15c5 5 11-5 16 0" />
        </>,
    ),
    Therefore: createIcon(
        "Therefore",
        <>
            <circle cx="7" cy="17" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="10" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="17" cy="17" r="1.2" fill="currentColor" stroke="none" />
        </>,
    ),
    Because: createIcon(
        "Because",
        <>
            <circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="17" cy="7" r="1.2" fill="currentColor" stroke="none" />
        </>,
    ),
    Vector: createIcon(
        "Vector",
        <>
            <path d="M4 19 20 5M13 5h7v7" />
        </>,
    ),
    Coordinate: createIcon(
        "Coordinate",
        <>
            <path d="M5 4v15h15M5 4l-2 2M5 4l2 2M20 19l-2-2M20 19l-2 2" />
        </>,
    ),
    Integer: createMathSymbol("Integer", "ℤ"),
    Negative: createIcon(
        "Negative",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8" />
        </>,
    ),
    Positive: createIcon(
        "Positive",
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8M8 12h8" />
        </>,
    ),
    Absolute: createMathSymbol("Absolute", "|x|", 15),
    Rational: createMathSymbol("Rational", "ℚ"),
    Irrational: createMathSymbol("Irrational", "√2", 16),
    Real: createMathSymbol("Real", "ℝ"),
    Imaginary: createMathSymbol("Imaginary", "i", 20, "italic"),
    Quaternion: createMathSymbol("Quaternion", "ℍ"),
    Natural: createMathSymbol("Natural", "ℕ"),
    Complex: createMathSymbol("Complex", "ℂ"),
    Even: createMathSymbol("Even", "2n", 16),
    Odd: createMathSymbol("Odd", "2n+1", 14),
};
