import React, { useCallback, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFetch } from '../../hooks/useFetch';
import styles from './PromLineChart.module.css';

// --- Types ---

interface PromRangeSeries {
    metric: Record<string, string>;
    values: [number, string][];
}

interface PromRangeResponse {
    status: string;
    data: {
        resultType: string;
        result: PromRangeSeries[];
    };
}

export interface ChartTooltipEntry {
    key: string;
    label: string;
    color: string;
    value: number;
}

// --- Constants ---

export const RANGE_OPTIONS = [
    { label: '1h',  startOffset: 3600,   step: '60',   promRange: '1m',  barWindow: '1h'   },
    { label: '1d',  startOffset: 86400,  step: '300',  promRange: '5m',  barWindow: '1d'   },
    { label: '5d',  startOffset: 432000, step: '1800', promRange: '30m', barWindow: '5d'   },
    { label: 'All', startOffset: null,   step: '3600', promRange: '1h',  barWindow: '365d' },
] as const;
export type RangeLabel = typeof RANGE_OPTIONS[number]['label'];

const CODE_FAMILY_PALETTES: Record<string, string[]> = {
    '2': ['#22c55e', '#16a34a', '#65a30d', '#0d9488', '#15803d'],
    '3': ['#3b82f6', '#0ea5e9', '#6366f1', '#2563eb', '#8b5cf6'],
    '4': ['#f97316', '#f59e0b', '#eab308', '#ea580c', '#e11d48'],
    '5': ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
};
const FALLBACK_COLORS = ['#94a3b8', '#64748b', '#475569'];
// eslint-disable-next-line react-refresh/only-export-components
export const DASH_PATTERNS = ['', '6 3', '2 3', '8 3 2 3', '4 2 2 2'];
const GENERIC_PALETTE = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#84cc16'];

// --- Shared helpers ---

// eslint-disable-next-line react-refresh/only-export-components
export function buildCodeMaps(codes: string[]): { colorMap: Record<string, string>; dashMap: Record<string, string> } {
    const familyCounters: Record<string, number> = {};
    const colorMap: Record<string, string> = {};
    const dashMap: Record<string, string> = {};
    for (const code of [...codes].sort()) {
        const family = code[0];
        const palette = CODE_FAMILY_PALETTES[family] ?? FALLBACK_COLORS;
        const idx = familyCounters[family] ?? 0;
        colorMap[code] = palette[idx % palette.length];
        dashMap[code] = DASH_PATTERNS[idx % DASH_PATTERNS.length];
        familyCounters[family] = idx + 1;
    }
    return { colorMap, dashMap };
}

// --- Sub-components ---

export const RangeToggle: React.FC<{ value: RangeLabel; onChange: (l: RangeLabel) => void }> = ({ value, onChange }) => (
    <div className={styles.rangeToggle}>
        {RANGE_OPTIONS.map(r => (
            <button
                key={r.label}
                className={`${styles.rangeBtn} ${value === r.label ? styles.rangeBtnActive : ''}`}
                onClick={() => onChange(r.label)}
            >
                {r.label}
            </button>
        ))}
    </div>
);

export const ChartTooltip: React.FC<{ active?: boolean; header: string; entries: ChartTooltipEntry[] }> = ({ active, header, entries }) => {
    if (!active || entries.length === 0) return null;
    return (
        <div className={styles.tooltipContainer}>
            <div className={styles.tooltipHeader}>{header}</div>
            <div className={styles.tooltipBody}>
                {entries.map(entry => (
                    <div key={entry.key} className={styles.tooltipRow}>
                        <span className={styles.tooltipRowLabel}>
                            <span className={styles.tooltipDot} style={{ background: entry.color }} />
                            {entry.label}
                        </span>
                        <strong className={styles.tooltipValue}>{entry.value.toLocaleString()}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- PromLineChart ---

export const PromLineChart: React.FC<{
    title: string;
    queryTemplate: string;
    seriesKey: string;
    seriesDisplay?: (key: string) => string;
    buildMaps?: (keys: string[]) => { colorMap: Record<string, string>; dashMap: Record<string, string> };
    subtitle: (range: typeof RANGE_OPTIONS[number]) => string;
    defaultRange?: RangeLabel;
    refreshKey: number;
}> = ({ title, queryTemplate, seriesKey, seriesDisplay, buildMaps, subtitle, defaultRange, refreshKey }) => {
    const [rangeLabel, setRangeLabel] = useState<RangeLabel>(defaultRange ?? '1h');
    const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
    const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);
    const selectedRange = RANGE_OPTIONS.find(r => r.label === rangeLabel)!;
    const endpoint = useMemo(() => {
        const nowSec = Math.floor(Date.now() / 1000);
        const startSec = selectedRange.startOffset === null ? 0 : nowSec - selectedRange.startOffset;
        const query = queryTemplate.replace(/\$RANGE/g, selectedRange.promRange);
        return '/metrics/prom-range?query=' + encodeURIComponent(query) + '&startTime=' + startSec + '&step=' + selectedRange.step;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryTemplate, selectedRange.promRange, selectedRange.startOffset, selectedRange.step, refreshKey]);
    const dataFetch = useFetch<PromRangeResponse>(endpoint);

    const chartComputed = useMemo(() => {
        const result = dataFetch.data?.data?.result;
        if (!result?.length) return null;
        const keys = [...new Set(result.map(s => s.metric[seriesKey] ?? '(none)'))].sort();
        const { colorMap, dashMap } = buildMaps
            ? buildMaps(keys)
            : (() => {
                const cm: Record<string, string> = {};
                const dm: Record<string, string> = {};
                keys.forEach((k, i) => { cm[k] = GENERIC_PALETTE[i % GENERIC_PALETTE.length]; dm[k] = DASH_PATTERNS[i % DASH_PATTERNS.length]; });
                return { colorMap: cm, dashMap: dm };
            })();
        const timeMap = new Map<number, Record<string, number>>();
        for (const s of result) {
            const key = s.metric[seriesKey] ?? '(none)';
            for (const [ts, val] of s.values) {
                if (!timeMap.has(ts)) timeMap.set(ts, { ts });
                timeMap.get(ts)![key] = Number(val);
            }
        }
        for (const row of timeMap.values()) {
            for (const key of keys) {
                if (!(key in row)) row[key] = 0;
            }
        }
        const chartData = [...timeMap.values()]
            .sort((a, b) => a.ts - b.ts)
            .map(row => ({ ...row, time: new Date(row.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }));
        return { keys, colorMap, dashMap, chartData };
    }, [dataFetch.data, seriesKey, buildMaps]);

    const displayFn = useMemo(() => seriesDisplay ?? ((k: string) => k), [seriesDisplay]);

    let subtitleText: string;
    if (dataFetch.loading) subtitleText = 'Loading…';
    else if (dataFetch.error) subtitleText = 'Prometheus unavailable';
    else if (dataFetch.data?.data?.result?.length === 0) subtitleText = 'No data yet — send requests through APISIX to populate this chart';
    else subtitleText = subtitle(selectedRange);

    const tooltipContent = useCallback(({ active, payload, label }: { active?: boolean; payload?: ReadonlyArray<{ dataKey?: unknown; color?: string; value?: unknown }>; label?: unknown }) => {
        const entries = (payload ?? [])
            .filter(e => e.value != null)
            .map(e => ({ key: String(e.dataKey), label: displayFn(String(e.dataKey)), color: e.color ?? '', value: Number(e.value) }));
        return <ChartTooltip active={active} header={String(label ?? '')} entries={entries} />;
    }, [displayFn]);

    return (
        <div className={`card ${styles.fullWidthCard}`}>
            <div className="card-header">{title}</div>
            <RangeToggle value={rangeLabel} onChange={setRangeLabel} />
            <div className={`text-small text-muted ${styles.emptyHint}`}>{subtitleText}</div>
            <div className={styles.chartArea}>
                {chartComputed && (
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={chartComputed.chartData} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
                            <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={48} axisLine={false} tickLine={false} />
                            <Tooltip content={tooltipContent} />
                            <Legend
                                onClick={(e) => {
                                    const key = e.dataKey as string;
                                    setHiddenSeries(prev => {
                                        const next = new Set(prev);
                                        if (next.has(key)) next.delete(key); else next.add(key);
                                        return next;
                                    });
                                }}
                                onMouseEnter={(e) => setHoveredSeries(e.dataKey as string)}
                                onMouseLeave={() => setHoveredSeries(null)}
                                wrapperStyle={{ cursor: 'pointer' }}
                            />
                            {chartComputed.keys.map(key => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={chartComputed.colorMap[key]}
                                    strokeDasharray={chartComputed.dashMap[key]}
                                    strokeWidth={hoveredSeries === key ? 3 : 2}
                                    strokeOpacity={hoveredSeries && hoveredSeries !== key ? 0.2 : 1}
                                    dot={false}
                                    hide={hiddenSeries.has(key)}
                                    isAnimationActive={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};
