'use client';

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TopicStatus } from '@/lib/analytics/computeTopicAccuracy';

export interface TopicAccuracyRow {
  topic: string;
  accuracy: number; // 0-1
  questionsAnswered: number;
  status: TopicStatus;
}

// Status is fixed, reserved meaning (dataviz skill: "Status is fixed") — not the app's
// categorical palette, and always paired with an icon/label, never color alone (the legend row
// below, plus each bar's direct % label and the tooltip's status word).
const STATUS_COLOR: Record<TopicStatus, string> = {
  strong: 'rgb(var(--color-success))',
  watch: 'rgb(var(--color-warning))',
  weak: 'rgb(var(--color-danger))',
};
const STATUS_LABEL: Record<TopicStatus, string> = {
  strong: 'Strong (≥75%)',
  watch: 'Watch (50–74%)',
  weak: 'Weak (<50%)',
};
const TRACK_COLOR = 'rgb(var(--color-text-muted) / 0.14)';

interface TooltipPayloadItem {
  payload: TopicAccuracyRow & { accuracyPct: number };
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-md border border-subtle bg-surface px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-primary">{row.topic}</p>
      <p className="text-secondary">
        {row.accuracyPct}% correct — {STATUS_LABEL[row.status]}
      </p>
      <p className="text-xs text-muted">{row.questionsAnswered} question{row.questionsAnswered === 1 ? '' : 's'} answered</p>
    </div>
  );
}

// Section 4.3/4.4: port of the dashboard mock's "Accuracy by topic" bars, via Recharts (per
// Section 4.4's explicit instruction), colored by status per the dataviz skill's status-encoding
// rule (fixed scale, never the categorical theme, always icon/label-paired).
export function TopicAccuracyTable({ topics }: { topics: TopicAccuracyRow[] }) {
  if (topics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-subtle p-8 text-center text-muted">
        Answer a few questions to see your accuracy by topic here.
      </div>
    );
  }

  const data = topics.map((t) => ({ ...t, accuracyPct: Math.round(t.accuracy * 100) }));
  const rowHeight = 36;

  return (
    <div className="rounded-lg border border-subtle bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-primary">Accuracy by topic</h2>
        <div className="flex items-center gap-3 text-xs text-secondary">
          {(Object.keys(STATUS_LABEL) as TopicStatus[]).map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[status] }}
                aria-hidden
              />
              {STATUS_LABEL[status]}
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(data.length * rowHeight, rowHeight)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="topic"
            width={160}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 13 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--color-text-muted) / 0.08)' }} />
          <Bar dataKey="accuracyPct" background={{ fill: TRACK_COLOR, radius: 4 }} radius={4} maxBarSize={16}>
            {data.map((row) => (
              <Cell key={row.topic} fill={STATUS_COLOR[row.status]} />
            ))}
            <LabelList
              dataKey="accuracyPct"
              position="right"
              formatter={(value) => `${value}%`}
              fill="rgb(var(--color-text-primary))"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Accessible data table mirroring the chart above — dataviz skill: "a table view exists". */}
      <table className="sr-only">
        <caption>Accuracy by topic</caption>
        <thead>
          <tr>
            <th scope="col">Topic</th>
            <th scope="col">Accuracy</th>
            <th scope="col">Status</th>
            <th scope="col">Questions answered</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.topic}>
              <td>{row.topic}</td>
              <td>{row.accuracyPct}%</td>
              <td>{STATUS_LABEL[row.status]}</td>
              <td>{row.questionsAnswered}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
