import { useMemo } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { simulatePayoff, type PayDelay } from '../../common/utils/debtPayoff.ts';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

export default function PayoffScheduleTable() {
  const { state } = useApp();
  const debts = state.accounts.filter((a) => a.type === 'debt' && a.debtCategory === 'credit_card');
  const { effectiveBudget: budget, payDelayMonths, delayBudget } = usePayoffBudget();
  const payDelay: PayDelay | undefined = payDelayMonths > 0 ? { months: payDelayMonths, delayBudget } : undefined;

  const schedule = useMemo(
    () => simulatePayoff(debts, budget, 'avalanche', payDelay),
    [debts, budget, payDelay]
  );

  if (debts.length === 0 || budget <= 0 || schedule.schedule.length === 0) {
    return (
      <Card title="Payment Schedule">
        <p className="text-gray-400 text-sm text-center py-6">
          {debts.length === 0 ? 'Add debts to see payment schedule' : 'Set a payoff budget to see schedule'}
        </p>
      </Card>
    );
  }

  return (
    <Card title="Month-by-Month Schedule (Avalanche)">
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white dark:bg-gray-800">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Month</th>
              <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Date</th>
              {debts.map((d) => (
                <th key={d.id} className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">{d.name}</th>
              ))}
              <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Remaining</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Interest</th>
            </tr>
          </thead>
          <tbody>
            {schedule.schedule.map((entry) => (
              <tr key={entry.month} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-1.5 px-2 text-gray-600 dark:text-gray-400">{entry.month}</td>
                <td className="py-1.5 px-2 text-gray-600 dark:text-gray-400">{entry.date}</td>
                {debts.map((d) => {
                  const p = entry.payments.find((pm) => pm.accountId === d.id);
                  return (
                    <td key={d.id} className="py-1.5 px-2 text-right">
                      {p && p.payment > 0 ? (
                        <span className="text-gray-800 dark:text-gray-200">{formatCurrency(p.payment)}</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-1.5 px-2 text-right font-medium dark:text-gray-200">{formatCurrency(entry.totalRemaining)}</td>
                <td className="py-1.5 px-2 text-right text-red-500 dark:text-red-400">{formatCurrency(entry.totalInterest)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Total interest paid</span>
        <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(schedule.totalInterestPaid)}</span>
      </div>
    </Card>
  );
}
