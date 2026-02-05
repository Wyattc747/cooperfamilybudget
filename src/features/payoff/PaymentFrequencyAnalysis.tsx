import { useMemo, useState } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { comparePaymentFrequencies, analyzePerDebtFrequency, type PaymentFrequency } from '../../common/utils/debtPayoff.ts';
import { COMPOUNDING_LABELS } from '../../common/types/index.ts';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';
import ToggleSwitch from '../../common/components/ToggleSwitch.tsx';

const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  monthly: 'Monthly',
  biweekly: 'Biweekly',
  weekly: 'Weekly',
};

export default function PaymentFrequencyAnalysis() {
  const { state } = useApp();
  const { effectiveBudget } = usePayoffBudget();
  const debts = state.accounts.filter((a) => a.type === 'debt' && a.debtCategory === 'credit_card');
  const [mode, setMode] = useState<'same_annual' | 'biweekly_extra'>('same_annual');

  const results = useMemo(
    () => comparePaymentFrequencies(debts, effectiveBudget, 'avalanche', mode),
    [debts, effectiveBudget, mode]
  );

  const perDebtBreakdown = useMemo(
    () => analyzePerDebtFrequency(debts),
    [debts]
  );

  if (debts.length === 0 || effectiveBudget <= 0) {
    return (
      <Card title="Payment Frequency Analysis">
        <p className="text-gray-400 text-sm text-center py-6">
          Add debts and set a budget to analyze payment frequencies
        </p>
      </Card>
    );
  }

  const payMoreOften = perDebtBreakdown.filter((d) => d.benefitsFromFrequency);
  const payMonthly = perDebtBreakdown.filter((d) => !d.benefitsFromFrequency);

  return (
    <Card title="Payment Frequency Analysis">
      {/* Per-debt frequency recommendations */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Per-Debt Frequency Recommendations</h4>

        {payMoreOften.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Pay more frequently</span>
            </div>
            <div className="space-y-2">
              {payMoreOften.map((d) => (
                <div key={d.accountId} className="bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm dark:text-gray-200">{d.accountName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {COMPOUNDING_LABELS[d.compoundingType]} &middot; {d.interestRate}% APR
                      </span>
                    </div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Save {formatCurrency(d.weeklySavings)} weekly / {formatCurrency(d.biweeklySavings)} biweekly
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{d.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {payMonthly.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly payment is fine</span>
            </div>
            <div className="space-y-2">
              {payMonthly.map((d) => (
                <div key={d.accountId} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm dark:text-gray-200">{d.accountName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {COMPOUNDING_LABELS[d.compoundingType]} &middot; {d.interestRate}% APR
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {d.weeklySavings > 0 ? `~${formatCurrency(d.weeklySavings)} savings` : 'No savings'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{d.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Overall frequency comparison table */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Overall Payoff Comparison</h4>
        <div className="mb-4">
          <ToggleSwitch
            options={[
              { value: 'same_annual', label: 'Same Annual Budget' },
              { value: 'biweekly_extra', label: 'Extra Payment' },
            ]}
            value={mode}
            onChange={(v) => setMode(v as 'same_annual' | 'biweekly_extra')}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {mode === 'same_annual'
              ? 'Same total annual amount split into more frequent payments — shows pure frequency benefit.'
              : 'Monthly/2 paid every 2 weeks = 13 monthly payments/year — shows combined frequency + extra payment benefit.'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Frequency</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Payment</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Annual Total</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Months</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Total Interest</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Saved vs Monthly</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.frequency}
                  className={`border-b border-gray-50 dark:border-gray-700/50 ${
                    r.savedVsMonthly > 0 ? 'bg-green-50 dark:bg-green-900/20' : ''
                  }`}
                >
                  <td className="py-2 px-2 font-medium dark:text-gray-200">{FREQUENCY_LABELS[r.frequency]}</td>
                  <td className="py-2 px-2 text-right dark:text-gray-300">{formatCurrency(r.paymentAmount)}</td>
                  <td className="py-2 px-2 text-right dark:text-gray-300">{formatCurrency(r.annualTotal)}</td>
                  <td className="py-2 px-2 text-right dark:text-gray-300">{r.monthsToPayoff}</td>
                  <td className="py-2 px-2 text-right text-red-600 dark:text-red-400">{formatCurrency(r.totalInterest)}</td>
                  <td className="py-2 px-2 text-right">
                    {r.savedVsMonthly > 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(r.savedVsMonthly)}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
