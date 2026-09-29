"use client";

import * as React from "react";
import { EmptyState } from "@/components/page";

type DayPoint = {
  label: string;
  count: number;
};

type StatusPoint = {
  label: string;
  count: number;
  color: string;
};

export function MessagesSentChart({ data }: { data: DayPoint[] }) {
  const [active, setActive] = React.useState<number | null>(null);
  const total = data.reduce((sum, point) => sum + point.count, 0);
  const max = Math.max(1, ...data.map((point) => point.count));
  const width = 700;
  const height = 260;
  const padding = { top: 20, right: 16, bottom: 42, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const points = data.map((point, index) => {
    const x = padding.left + (plotWidth / Math.max(1, data.length - 1)) * index;
    const y = padding.top + plotHeight - (point.count / max) * plotHeight;
    return { ...point, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding.left},${padding.top + plotHeight} ${line} ${padding.left + plotWidth},${padding.top + plotHeight}`;
  const activePoint = active === null ? null : points[active];

  if (total === 0) {
    return <EmptyState title="No message volume yet" description="The weekly chart will populate after real SMS records are created." />;
  }

  return (
    <div className="relative" aria-label="Messages sent chart">
      <svg className="h-auto w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="messages-chart-title messages-chart-desc">
        <title id="messages-chart-title">Messages sent over the last seven days</title>
        <desc id="messages-chart-desc">Line chart showing SMS sent from Monday to Sunday using database message records.</desc>
        <defs>
          <linearGradient id="smsflow-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#D4A017" stopOpacity="0.36" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.05" />
          </linearGradient>
          <filter id="smsflow-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padding.top + plotHeight * tick;
          const value = Math.round(max * (1 - tick));
          return (
            <g key={tick}>
              <line x1={padding.left} x2={padding.left + plotWidth} y1={y} y2={y} stroke="rgb(212 160 23 / 0.18)" strokeDasharray="4 6" />
              <text x={padding.left - 12} y={y + 4} textAnchor="end" className="fill-[var(--text-muted)] text-[11px]">
                {value}
              </text>
            </g>
          );
        })}
        <polygon points={area} fill="url(#smsflow-area)" />
        <polyline points={line} fill="none" stroke="#D4A017" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" filter="url(#smsflow-glow)" />
        {points.map((point, index) => (
          <g key={point.label}>
            <line x1={point.x} x2={point.x} y1={padding.top} y2={padding.top + plotHeight} stroke="transparent" strokeWidth={54} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} tabIndex={0} aria-label={`${point.label}: ${point.count} messages`} />
            <circle cx={point.x} cy={point.y} r={active === index ? 6 : 4.5} fill="#fff" stroke="#D4A017" strokeWidth="3" />
            <text x={point.x} y={height - 12} textAnchor="middle" className="fill-[var(--text-secondary)] text-[12px]">
              {point.label.slice(0, 3)}
            </text>
          </g>
        ))}
      </svg>
      {activePoint && (
        <div className="pointer-events-none absolute rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs shadow-[var(--shadow-lg)]" style={{ left: `${(activePoint.x / width) * 100}%`, top: `${Math.max(0, activePoint.y - 12)}px`, transform: "translate(-50%, -100%)" }}>
          <p className="font-medium text-[var(--text-primary)]">{activePoint.label}</p>
          <p className="mt-0.5 text-[var(--text-secondary)]">{activePoint.count} messages</p>
        </div>
      )}
    </div>
  );
}

export function StatusDonutChart({ data }: { data: StatusPoint[] }) {
  const total = data.reduce((sum, point) => sum + point.count, 0);
  const [active, setActive] = React.useState(0);
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total === 0) {
    return <EmptyState title="No delivery status yet" description="Delivery status analytics will appear after messages are sent." />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[240px_1fr] sm:items-center" aria-label="Messages by status chart">
      <div className="relative mx-auto h-56 w-56">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200" role="img" aria-labelledby="status-chart-title status-chart-desc">
          <title id="status-chart-title">Messages by status</title>
          <desc id="status-chart-desc">Donut chart of delivered, pending, failed, and queued SMS records.</desc>
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgb(232 215 167 / 0.72)" strokeWidth="32" />
          {data.map((point, index) => {
            const length = (point.count / total) * circumference;
            const node = (
              <circle
                key={point.label}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={point.color}
                strokeWidth={active === index ? 36 : 32}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActive(index)}
              />
            );
            offset += length;
            return node;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-[var(--text-muted)]">Total</span>
          <span className="tabular mt-1 text-3xl font-semibold">{total.toLocaleString("en-NG")}</span>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((point, index) => {
          const percent = total ? Math.round((point.count / total) * 1000) / 10 : 0;
          return (
            <button key={point.label} type="button" onClick={() => setActive(index)} className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
              <span className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: point.color }} />
                <span>
                  <span className="block text-sm font-medium">{point.label}</span>
                  <span className="block text-xs text-[var(--text-muted)]">{percent}%</span>
                </span>
              </span>
              <span className="tabular text-sm text-[var(--text-secondary)]">{point.count.toLocaleString("en-NG")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
