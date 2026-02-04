import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { compareStrategies, type PayDelay } from '../../common/utils/debtPayoff.ts';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

export default function PayoffComparisonChart() {
  const { state } = useApp();
  const debts = state.accounts.filter((a) => a.type === 'debt');
  const { effectiveBudget: budget, payDelayMonths, delayBudget } = usePayoffBudget();
  const payDelay: PayDelay | undefined = payDelayMonths > 0 ? { months: payDelayMonths, delayBudget } : undefined;

  const results = useMemo(
    () => compareStrategies(debts, budget, payDelay),
    [debts, budget, payDelay]
  );

  if (debts.length === 0 || budget <= 0) {
    return (
      <Card title="Payoff Comparison">
        <p className="text-gray-400 text-sm text-center py-8">Add debts and income to see comparison</p>
      </Card>
    );
  }

  const data = [
    { name: 'Months', avalanche: results.avalanche.totalMonths, snowball: results.snowball.totalMonths },
    { name: 'Interest', avalanche: Math.round(results.avalanche.totalInterestPaid), snowball: Math.round(results.snowball.totalInterestPaid) },
    { name: 'Total Paid', avalanche: Math.round(results.avalanche.totalPaid), snowball: Math.round(results.snowball.totalPaid) },
  ];

  return (
    <Card title="Payoff Comparison">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value) => typeof value === 'number' && value > 100 ? formatCurrency(value) : value} />
          <Legend />
          <Bar dataKey="avalanche" fill="#3b82f6" name="Avalanche" radius={[4, 4, 0, 0]} />
          <Bar dataKey="snowball" fill="#8b5cf6" name="Snowball" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
