'use client';

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    BarChart,
    Bar,
    ComposedChart,
    Line,
} from 'recharts';
import type { ProjectionResult } from '@/lib/types';

// ============================================
// Custom Tooltip
// ============================================

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-strong rounded-xl p-4 shadow-2xl border border-[var(--border-accent)] min-w-[200px]">
            <p className="text-xs font-bold text-[var(--foreground-muted)] mb-3 uppercase tracking-wider">
                Month {label}
            </p>
            {payload.map((entry: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-6 py-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                        <span className="text-xs text-[var(--foreground-muted)]">{entry.name}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[var(--foreground)]">
                        {typeof entry.value === 'number'
                            ? entry.name.includes('$') || entry.name.includes('Cost') || entry.name.includes('Savings')
                                ? `$${entry.value.toFixed(2)}`
                                : entry.value.toLocaleString()
                            : entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ============================================
// Cumulative Cost Chart (Area)
// ============================================

interface CostChartProps {
    data: ProjectionResult[];
    comparisonData?: ProjectionResult[];
    primaryLabel?: string;
    comparisonLabel?: string;
    height?: number;
}

export function CumulativeCostChart({
    data,
    comparisonData,
    primaryLabel = 'Your Plan',
    comparisonLabel = 'Alternative',
    height = 320,
}: CostChartProps) {
    const chartData = data.map((d, i) => ({
        month: d.month,
        [primaryLabel]: d.totalCost,
        ...(comparisonData?.[i] ? { [comparisonLabel]: comparisonData[i].totalCost } : {}),
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradComparison" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                    tickFormatter={(v) => `M${v}`}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    wrapperStyle={{ fontSize: 11, color: 'var(--foreground-muted)' }}
                    iconType="circle"
                    iconSize={8}
                />
                <Area
                    type="monotone"
                    dataKey={primaryLabel}
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#gradPrimary)"
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'var(--background)' }}
                />
                {comparisonData && (
                    <Area
                        type="monotone"
                        dataKey={comparisonLabel}
                        stroke="var(--warning)"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        fill="url(#gradComparison)"
                        dot={false}
                        activeDot={{ r: 4, fill: 'var(--warning)', stroke: 'var(--background)' }}
                    />
                )}
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Credit Balance & Waste Chart (Composed)
// ============================================

export function CreditBalanceChart({ data, height = 320 }: { data: ProjectionResult[]; height?: number }) {
    const chartData = data.map((d) => ({
        month: d.month,
        'Credits Used': d.creditsConsumed,
        'Wasted': d.wastedCredits,
        'Balance': d.creditBalance,
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                    tickFormatter={(v) => `M${v}`}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Bar dataKey="Credits Used" fill="var(--primary)" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar dataKey="Wasted" fill="var(--error)" radius={[4, 4, 0, 0]} opacity={0.5} />
                <Line
                    type="monotone"
                    dataKey="Balance"
                    stroke="var(--accent-light)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--accent-light)', stroke: 'var(--background)' }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Cost Per Credit Chart
// ============================================

export function CostPerCreditChart({ data, height = 280 }: { data: ProjectionResult[]; height?: number }) {
    const chartData = data.map((d) => ({
        month: d.month,
        'Cost/Credit': Number(d.costPerCredit.toFixed(4)),
    }));

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="gradEfficiency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--info)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--info)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                    tickFormatter={(v) => `M${v}`}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                    type="monotone"
                    dataKey="Cost/Credit"
                    stroke="var(--info)"
                    strokeWidth={2}
                    fill="url(#gradEfficiency)"
                    dot={{ r: 3, fill: 'var(--info)', stroke: 'var(--background)' }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
