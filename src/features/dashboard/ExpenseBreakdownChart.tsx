import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export default function ExpenseBreakdownChart() {
  const { state } = useApp();

  const data = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const e of state.expenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    }
    return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  }, [state.expenses]);

  if (data.length === 0) {
    return (
      <Card title="Expense Breakdown">
        <p className="text-gray-400 text-sm text-center py-8">No expenses to display</p>
      </Card>
    );
  }

  return (
    <Card title="Expense Breakdown">
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
