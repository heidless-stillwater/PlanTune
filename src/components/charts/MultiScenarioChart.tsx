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
} from 'recharts';
import type { ProjectionResult } from '@/lib/types';

// ============================================
// Color Palette for Scenarios
// ============================================

const SCENARIO_COLORS = [
    { stroke: '#14b8a6', fill: 'rgba(20, 184, 166, 0.15)' },   // Teal
    { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.10)' },    // Amber
    { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.10)' },    // Violet
    { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.10)' },     // Rose
    { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.10)' },     // Cyan
];

// ============================================
// Custom Tooltip
// ============================================

function MultiTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-strong rounded-xl p-4 shadow-2xl border border-[var(--border-accent)] min-w-[220px]">
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
                        ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ============================================
// Multi-Scenario Cost Overlay Chart
// ============================================

interface MultiScenarioCostChartProps {
    projections: ProjectionResult[][];
    labels: string[];
    height?: number;
}

export function MultiScenarioCostChart({
    projections,
    labels,
    height = 400,
}: MultiScenarioCostChartProps) {
    if (!projections.length || !projections[0]?.length) {
        return (
            <div className="flex items-center justify-center h-full text-white/20 text-sm">
                No projection data
            </div>
        );
    }

    // Merge all projections into a single dataset keyed by month
    const months = projections[0].length;
    const chartData = Array.from({ length: months }, (_, i) => {
        const point: Record<string, any> = { month: i + 1 };
        projections.forEach((proj, idx) => {
            const label = labels[idx] || `Scenario ${idx + 1}`;
            point[label] = proj[i]?.totalCost ?? 0;
        });
        return point;
    });

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                    {projections.map((_, idx) => (
                        <linearGradient key={idx} id={`multiGrad${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={SCENARIO_COLORS[idx % SCENARIO_COLORS.length].stroke} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={SCENARIO_COLORS[idx % SCENARIO_COLORS.length].stroke} stopOpacity={0} />
                        </linearGradient>
                    ))}
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
                <Tooltip content={<MultiTooltip />} />
                <Legend
                    wrapperStyle={{ fontSize: 11, color: 'var(--foreground-muted)' }}
                    iconType="circle"
                    iconSize={8}
                />
                {projections.map((_, idx) => {
                    const label = labels[idx] || `Scenario ${idx + 1}`;
                    const color = SCENARIO_COLORS[idx % SCENARIO_COLORS.length];
                    return (
                        <Area
                            key={idx}
                            type="monotone"
                            dataKey={label}
                            stroke={color.stroke}
                            strokeWidth={idx === 0 ? 2.5 : 1.5}
                            strokeDasharray={idx > 0 ? '6 3' : undefined}
                            fill={`url(#multiGrad${idx})`}
                            dot={false}
                            activeDot={{ r: 4, fill: color.stroke, stroke: 'var(--background)' }}
                        />
                    );
                })}
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ============================================
// Multi-Scenario Balance Overlay Chart
// ============================================

interface MultiScenarioBalanceChartProps {
    projections: ProjectionResult[][];
    labels: string[];
    height?: number;
}

export function MultiScenarioBalanceChart({
    projections,
    labels,
    height = 250,
}: MultiScenarioBalanceChartProps) {
    if (!projections.length || !projections[0]?.length) {
        return (
            <div className="flex items-center justify-center h-full text-white/20 text-sm">
                No projection data
            </div>
        );
    }

    const months = projections[0].length;
    const chartData = Array.from({ length: months }, (_, i) => {
        const point: Record<string, any> = { month: i + 1 };
        projections.forEach((proj, idx) => {
            const label = labels[idx] || `Scenario ${idx + 1}`;
            point[label] = proj[i]?.creditBalance ?? 0;
        });
        return point;
    });

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                <Tooltip content={<MultiTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                {projections.map((_, idx) => {
                    const label = labels[idx] || `Scenario ${idx + 1}`;
                    const color = SCENARIO_COLORS[idx % SCENARIO_COLORS.length];
                    return (
                        <Area
                            key={idx}
                            type="monotone"
                            dataKey={label}
                            stroke={color.stroke}
                            strokeWidth={idx === 0 ? 2 : 1.5}
                            fill="transparent"
                            dot={false}
                            activeDot={{ r: 3, fill: color.stroke, stroke: 'var(--background)' }}
                        />
                    );
                })}
            </AreaChart>
        </ResponsiveContainer>
    );
}
