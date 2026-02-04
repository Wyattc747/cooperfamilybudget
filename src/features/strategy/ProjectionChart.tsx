import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { ProjectionPoint, PhaseInfo } from '../../common/utils/financialRoadmap.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

interface ProjectionChartProps {
  projections: ProjectionPoint[];
  phases: PhaseInfo[];
}

export default function ProjectionChart({ projections, phases }: ProjectionChartProps) {
  // Sample data for readability (at most ~100 points)
  const chartData = useMemo(() => {
    if (projections.length <= 100) return projections;
    const step = Math.ceil(projections.length / 100);
    return projections.filter((_, i) => i % step === 0 || i === projections.length - 1);
  }, [projections]);

  // Find phase transition months for reference lines
  const phaseTransitions = useMemo(() => {
    const transitions: { month: number; label: string }[] = [];
    let lastPhase = 0;
    for (const p of projections) {
      if (p.phase !== lastPhase) {
        const phaseInfo = phases.find((ph) => ph.id === p.phase);
        transitions.push({
          month: p.month,
          label: phaseInfo?.name ?? `Phase ${p.phase}`,
        });
        lastPhase = p.phase;
      }
    }
    return transitions;
  }, [projections, phases]);

  if (chartData.length === 0) {
    return (
      <Card title="Financial Projection">
        <p className="text-gray-400 text-sm text-center py-6">
          Add income, debts, and expenses to see projections
        </p>
      </Card>
    );
  }

  const formatYAxis = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`;
    return `$${v.toFixed(0)}`;
  };

  const formatXAxis = (month: number) => {
    if (month < 12) return `${month}mo`;
    const y = Math.round(month / 12);
    return `${y}yr`;
  };

  return (
    <Card title="Financial Projection Timeline">
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10 }}
            tickFormatter={formatXAxis}
            interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
          />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={formatYAxis} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(month) => formatXAxis(month as number)}
          />
          <Legend />

          {/* Phase transition lines */}
          {phaseTransitions.map((t) => (
            <ReferenceLine
              key={t.month}
              x={t.month}
              stroke="#9ca3af"
              strokeDasharray="3 3"
              label={{ value: t.label, position: 'top', fontSize: 9, fill: '#6b7280' }}
            />
          ))}

          <Area
            type="monotone"
            dataKey="debt"
            stackId="negative"
            stroke="#ef4444"
            fill="#fecaca"
            fillOpacity={0.6}
            name="Debt"
          />
          <Area
            type="monotone"
            dataKey="emergencyFund"
            stackId="positive"
            stroke="#3b82f6"
            fill="#bfdbfe"
            fillOpacity={0.6}
            name="Emergency Fund"
          />
          <Area
            type="monotone"
            dataKey="investments"
            stackId="positive"
            stroke="#10b981"
            fill="#a7f3d0"
            fillOpacity={0.6}
            name="Investments"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
