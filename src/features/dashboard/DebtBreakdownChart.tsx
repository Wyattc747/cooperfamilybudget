import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

export default function DebtBreakdownChart() {
  const { state } = useApp();

  const data = useMemo(
    () =>
      state.accounts
        .filter((a) => a.type === 'debt' && a.balance > 0)
        .map((a) => ({ name: a.name, value: a.balance })),
    [state.accounts]
  );

  if (data.length === 0) {
    return (
      <Card title="Debt Breakdown">
        <p className="text-gray-400 text-sm text-center py-8">No debts to display</p>
      </Card>
    );
  }

  return (
    <Card title="Debt Breakdown">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(props: PieLabelRenderProps) => props.name ?? ''}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
