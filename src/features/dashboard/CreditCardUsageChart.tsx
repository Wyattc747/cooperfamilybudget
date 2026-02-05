import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#3b82f6'];

function utilizationColor(pct: number): string {
  if (pct <= 30) return '#10b981'; // green - good
  if (pct <= 50) return '#f59e0b'; // amber - caution
  if (pct <= 75) return '#f97316'; // orange - high
  return '#ef4444'; // red - critical
}

export default function CreditCardUsageChart() {
  const { state } = useApp();

  const cards = useMemo(
    () =>
      state.accounts
        .filter((a) => a.type === 'debt' && a.debtCategory === 'credit_card')
        .map((a) => ({
          name: a.name,
          balance: a.balance,
          limit: a.creditLimit || 0,
          utilization: a.creditLimit > 0 ? (a.balance / a.creditLimit) * 100 : 0,
        })),
    [state.accounts]
  );

  const totalBalance = cards.reduce((s, c) => s + c.balance, 0);
  const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
  const totalUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  if (cards.length === 0) {
    return (
      <Card title="Credit Card Usage">
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No credit cards to display</p>
      </Card>
    );
  }

  const hasLimits = totalLimit > 0;

  return (
    <Card title="Credit Card Usage">
      {/* Total summary */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <div className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950">
          <span className="text-red-500 dark:text-red-400">Total Balance </span>
          <span className="font-semibold text-red-700 dark:text-red-300">{formatCurrency(totalBalance)}</span>
        </div>
        {hasLimits && (
          <>
            <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950">
              <span className="text-blue-500 dark:text-blue-400">Total Limit </span>
              <span className="font-semibold text-blue-700 dark:text-blue-300">{formatCurrency(totalLimit)}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: `${utilizationColor(totalUtilization)}15` }}>
              <span className="text-gray-500 dark:text-gray-400">Utilization </span>
              <span className="font-semibold" style={{ color: utilizationColor(totalUtilization) }}>{totalUtilization.toFixed(1)}%</span>
            </div>
          </>
        )}
      </div>

      {/* Overall utilization bar */}
      {hasLimits && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-1">
            <span>0%</span>
            <span>30%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(totalUtilization, 100)}%`,
                backgroundColor: utilizationColor(totalUtilization),
              }}
            />
            {/* 30% marker */}
            <div className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-500" style={{ left: '30%' }} />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            {totalUtilization <= 30 ? 'Good — under 30% recommended utilization' : totalUtilization <= 50 ? 'Moderate — try to get below 30%' : 'High — this may impact your credit score'}
          </p>
        </div>
      )}

      {/* Per-card breakdown */}
      {hasLimits ? (
        <ResponsiveContainer width="100%" height={Math.max(120, cards.length * 50)}>
          <BarChart data={cards} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} stroke="#6b7280" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={100} stroke="#6b7280" />
            <Tooltip
              formatter={(value: number, _name: string, props: { payload: { balance: number; limit: number } }) =>
                [`${value.toFixed(1)}% (${formatCurrency(props.payload.balance)} / ${formatCurrency(props.payload.limit)})`, 'Utilization']
              }
            />
            <ReferenceLine x={30} stroke="#9ca3af" strokeDasharray="3 3" />
            <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
              {cards.map((c, i) => (
                <Cell key={i} fill={utilizationColor(c.utilization)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="space-y-2">
          {cards.map((c, i) => (
            <div key={c.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-gray-700 dark:text-gray-300">{c.name}</span>
              </div>
              <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(c.balance)}</span>
            </div>
          ))}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
            Add credit limits to your cards in Accounts to see utilization tracking.
          </p>
        </div>
      )}
    </Card>
  );
}
