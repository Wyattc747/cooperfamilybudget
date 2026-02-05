import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

function dtiColor(ratio: number): string {
  if (ratio <= 20) return '#10b981'; // green - excellent
  if (ratio <= 36) return '#3b82f6'; // blue - good
  if (ratio <= 43) return '#f59e0b'; // amber - caution
  return '#ef4444'; // red - high risk
}

function dtiLabel(ratio: number): string {
  if (ratio <= 20) return 'Excellent';
  if (ratio <= 36) return 'Good';
  if (ratio <= 43) return 'Caution';
  return 'High Risk';
}

function dtiDescription(ratio: number): string {
  if (ratio <= 20) return 'Well within healthy range. Lenders see this favorably.';
  if (ratio <= 36) return 'Acceptable for most lenders. Room for improvement.';
  if (ratio <= 43) return 'At the upper limit for most mortgage approvals.';
  return 'Above recommended levels. Focus on paying down debt.';
}

export default function DebtToIncomeChart() {
  const { state } = useApp();
  const { monthlyNet } = usePayoffBudget();

  const monthlyDebtPayments = useMemo(
    () =>
      state.accounts
        .filter((a) => a.type === 'debt')
        .reduce((sum, a) => sum + a.minimumPayment, 0),
    [state.accounts]
  );

  const dtiRatio = monthlyNet > 0 ? (monthlyDebtPayments / monthlyNet) * 100 : 0;
  const color = dtiColor(dtiRatio);
  const remaining = Math.max(0, 100 - dtiRatio);

  const pieData = [
    { name: 'Debt', value: Math.min(dtiRatio, 100) },
    { name: 'Available', value: remaining },
  ];

  if (monthlyNet <= 0) {
    return (
      <Card title="Debt-to-Income Ratio">
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">Add income to see your DTI ratio</p>
      </Card>
    );
  }

  return (
    <Card title="Debt-to-Income Ratio">
      <div className="flex items-center gap-6">
        {/* Donut chart */}
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
              >
                <Cell fill={color} />
                <Cell fill="#e5e7eb" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>{dtiRatio.toFixed(1)}%</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">DTI</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-3">
          <div>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {dtiLabel(dtiRatio)}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dtiDescription(dtiRatio)}</p>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Monthly Debt Payments</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(monthlyDebtPayments)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Monthly Net Income</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(monthlyNet)}</span>
            </div>
          </div>
          {/* Scale reference */}
          <div className="flex gap-1 text-[9px]">
            <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">&le;20%</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">&le;36%</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">&le;43%</span>
            <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">&gt;43%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
