import { useMemo, useState } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import { simulatePayoff, type PayDelay } from '../../common/utils/debtPayoff.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';
import type { Account } from '../../common/types/index.ts';

export default function CashLumpSumAnalysis() {
  const { state } = useApp();
  const { effectiveBudget, payDelayMonths, delayBudget } = usePayoffBudget();
  const ccDebts = state.accounts.filter((a) => a.type === 'debt' && a.debtCategory === 'credit_card' && a.balance > 0);
  const cashAccounts = state.accounts.filter((a) => a.type === 'cash' && a.balance > 0);
  const totalCash = cashAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalCCDebt = ccDebts.reduce((sum, a) => sum + a.balance, 0);

  const [cashToApply, setCashToApply] = useState('');

  const payDelay: PayDelay | undefined = payDelayMonths > 0 ? { months: payDelayMonths, delayBudget } : undefined;

  const analysis = useMemo(() => {
    const amount = parseFloat(cashToApply);
    if (isNaN(amount) || amount <= 0 || ccDebts.length === 0 || effectiveBudget <= 0) return null;

    const lumpSum = Math.min(amount, totalCCDebt);

    // Normal payoff (no lump sum)
    const normal = simulatePayoff(ccDebts, effectiveBudget, 'avalanche', payDelay);

    // Apply lump sum following avalanche strategy (highest rate first)
    const sorted = [...ccDebts].sort((a, b) => b.interestRate - a.interestRate);
    let remaining = lumpSum;
    const allocations: { name: string; applied: number }[] = [];
    const modifiedDebts: Account[] = sorted.map((debt) => {
      const apply = Math.min(remaining, debt.balance);
      remaining -= apply;
      if (apply > 0) allocations.push({ name: debt.name, applied: apply });
      return { ...debt, balance: Math.max(0, debt.balance - apply) };
    });

    const activeDebts = modifiedDebts.filter((d) => d.balance > 0);
    const withLumpSum = activeDebts.length > 0
      ? simulatePayoff(activeDebts, effectiveBudget, 'avalanche', payDelay)
      : { totalMonths: 0, totalInterestPaid: 0, totalPaid: 0 };

    const monthsSaved = normal.totalMonths - withLumpSum.totalMonths;
    const interestSaved = normal.totalInterestPaid - withLumpSum.totalInterestPaid;

    return { normal, withLumpSum, lumpSum, monthsSaved, interestSaved, allocations };
  }, [cashToApply, ccDebts, effectiveBudget, totalCCDebt, payDelay]);

  if (ccDebts.length === 0 || totalCash <= 0) return null;

  return (
    <Card title="Use Cash Toward Credit Card Debt">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        See how applying available cash as a lump sum toward your credit cards could accelerate payoff and save on interest.
      </p>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          {cashAccounts.map((a) => (
            <span key={a.id} className="text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded-full">
              {a.name}: {formatCurrency(a.balance)}
            </span>
          ))}
        </div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cash to apply ({formatCurrency(totalCash)} available)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step="100"
            min="0"
            max={totalCash}
            value={cashToApply}
            onChange={(e) => setCashToApply(e.target.value)}
            placeholder={`e.g. ${Math.round(totalCash)}`}
            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setCashToApply(String(Math.round(totalCash)))}
            className="text-xs px-3 py-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-800/40 transition-colors"
          >
            Use all
          </button>
        </div>
      </div>

      {analysis ? (
        <>
          {analysis.allocations.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                Lump sum allocation (highest rate first):
              </p>
              {analysis.allocations.map((a) => (
                <div key={a.name} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{a.name}</span>
                  <span className="font-medium dark:text-gray-200">{formatCurrency(a.applied)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4">
              <h4 className="font-semibold text-sm dark:text-gray-200 mb-3">Without Cash</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Months to payoff</span>
                  <span className="font-medium dark:text-gray-200">{analysis.normal.totalMonths}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total interest</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(analysis.normal.totalInterestPaid)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1.5">
                  <span className="text-gray-600 dark:text-gray-400">Total paid</span>
                  <span className="font-bold dark:text-gray-200">{formatCurrency(analysis.normal.totalPaid)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-sm dark:text-gray-200">With {formatCurrency(analysis.lumpSum)} Cash</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300 font-medium">
                  Faster
                </span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Months to payoff</span>
                  <span className="font-medium dark:text-gray-200">{analysis.withLumpSum.totalMonths}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total interest</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(analysis.withLumpSum.totalInterestPaid)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1.5">
                  <span className="text-gray-600 dark:text-gray-400">Total paid</span>
                  <span className="font-bold dark:text-gray-200">{formatCurrency(analysis.withLumpSum.totalPaid + analysis.lumpSum)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4 text-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="font-semibold text-sm dark:text-gray-200">
              Applying {formatCurrency(analysis.lumpSum)} saves{' '}
              <span className="text-green-700 dark:text-green-400">{formatCurrency(analysis.interestSaved)}</span> in interest
              and pays off{' '}
              <span className="text-green-700 dark:text-green-400">{analysis.monthsSaved} month{analysis.monthsSaved !== 1 ? 's' : ''}</span> sooner
            </p>
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-sm text-center py-4">
          Enter an amount to see how applying cash impacts your payoff timeline
        </p>
      )}
    </Card>
  );
}
