import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { compareStrategies, type PayDelay } from '../../common/utils/debtPayoff.ts';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

export default function PayoffTimelineChart() {
  const { state } = useApp();
  const debts = state.accounts.filter((a) => a.type === 'debt');
  const { effectiveBudget: budget, payDelayMonths, delayBudget } = usePayoffBudget();
  const payDelay: PayDelay | undefined = payDelayMonths > 0 ? { months: payDelayMonths, delayBudget } : undefined;

  const results = useMemo(
    () => compareStrategies(debts, budget, payDelay),
    [debts, budget, payDelay]
  );

  if (debts.length === 0 || budget <= 0 || results.avalanche.schedule.length === 0) {
    return (
      <Card title="Balance Over Time">
        <p className="text-gray-400 text-sm text-center py-6">Add debts and set a budget to see timeline</p>
      </Card>
    );
  }

  const maxLen = Math.max(results.avalanche.schedule.length, results.snowball.schedule.length);
  const chartData = Array.from({ length: maxLen }, (_, i) => ({
    month: i + 1,
    date: results.avalanche.schedule[i]?.date ?? results.snowball.schedule[i]?.date ?? '',
    avalanche: results.avalanche.schedule[i]?.totalRemaining ?? 0,
    snowball: results.snowball.schedule[i]?.totalRemaining ?? 0,
  }));

  return (
    <Card title="Balance Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
          />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend />
          <Line type="monotone" dataKey="avalanche" stroke="#3b82f6" strokeWidth={2} dot={false} name="Avalanche" />
          <Line type="monotone" dataKey="snowball" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Snowball" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
