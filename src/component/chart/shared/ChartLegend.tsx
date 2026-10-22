import type { FC } from "react";
import { useInternational, type InternationalContextValue } from "../../../international";
import type { ChartLegendItem } from "./types";

/**
 * Props for the shared chart legend.
 * Type: interface.
 * Fields: items.
 * @example
 * <ChartLegend items={[{ label: "Revenue", color: "#1976d2" }]} />
 */
export interface ChartLegendProps {
    items: readonly ChartLegendItem[];
}

/**
 * Renders series names and swatches under a chart.
 * @param props - Legend entries resolved by the chart.
 * @example
 * <ChartLegend items={legendItems} />
 * @returns An accessible legend list.
 */
const ChartLegend: FC<ChartLegendProps> = ({ items }: ChartLegendProps) => {
    const { t }: InternationalContextValue = useInternational();

    return (
        <ul className="chart-legend" aria-label={t("legend")}>
            {items.map((item: ChartLegendItem, index: number) => (
                <li className="chart-legend__item" key={item.id ?? `${item.label}-${index}`}>
                    <span
                        className="chart-legend__swatch"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                    />
                    <span className="chart-legend__label">{item.label}</span>
                    {item.value === (void 0) ? null : (
                        <span className="chart-legend__value">{item.value}</span>
                    )}
                </li>
            ))}
        </ul>
    );
};

export default ChartLegend;
