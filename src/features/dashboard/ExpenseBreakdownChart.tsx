import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export default function ExpenseBreakdownChart() {
  const { state } = useApp();

  const { data, total } = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const e of state.expenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    }
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    const data = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value, pct: total > 0 ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
    return { data, total };
  }, [state.expenses]);

  if (data.length === 0) {
    return (
      <Card title="Expense Breakdown">
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No expenses to display</p>
      </Card>
    );
  }

  return (
    <Card title="Expense Breakdown">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, pct }: { name: string; pct: number }) => `${name} ${pct.toFixed(0)}%`}
            labelLine={true}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${formatCurrency(value)} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend with percentages */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-gray-600 dark:text-gray-400 truncate">{d.name}</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium tabular-nums shrink-0 ml-2">
              {d.pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
