import { useMemo } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import Card from '../../common/components/Card.tsx';
import { compareFilingStatuses } from '../../common/utils/taxCalculator.ts';
import { formatCurrency, formatPercent } from '../../common/utils/formatters.ts';
import type { FilingStatus } from '../../common/types/index.ts';

export default function FilingComparison() {
  const { state, dispatch } = useApp();
  const { baseSalary, monthlyCommission, monthlyBusinessIncome, dependents, stateTaxRate } = state.income;
  const annualBusiness = monthlyBusinessIncome * 12;

  const rows = useMemo(
    () => compareFilingStatuses(baseSalary, monthlyCommission, dependents, stateTaxRate, annualBusiness),
    [baseSalary, monthlyCommission, dependents, stateTaxRate, annualBusiness]
  );

  if (baseSalary + monthlyCommission * 12 === 0) {
    return (
      <Card title="Filing Status Comparison">
        <p className="text-gray-400 text-sm text-center py-6">Enter your income to compare filing statuses</p>
      </Card>
    );
  }

  return (
    <Card title="Filing Status Comparison">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Side-by-side comparison of all filing statuses. The best option is highlighted.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Federal Tax</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">State Tax</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Credit</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Total Tax</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Net Income</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Eff. Rate</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.filingStatus}
                className={`border-b border-gray-100 dark:border-gray-700/50 ${row.isBest ? 'bg-green-50 dark:bg-green-900/20' : ''} ${
                  state.income.filingStatus === row.filingStatus ? 'ring-2 ring-blue-500 ring-inset' : ''
                }`}
              >
                <td className="py-2 px-2 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    {row.label}
                    {row.isBest && (
                      <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-medium">Best</span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2 text-right dark:text-gray-300">{formatCurrency(row.federalTax)}</td>
                <td className="py-2 px-2 text-right dark:text-gray-300">{formatCurrency(row.stateTax)}</td>
                <td className="py-2 px-2 text-right text-green-600 dark:text-green-400">{formatCurrency(row.childTaxCredit)}</td>
                <td className="py-2 px-2 text-right font-medium dark:text-gray-200">{formatCurrency(row.totalTax)}</td>
                <td className="py-2 px-2 text-right font-medium dark:text-gray-200">{formatCurrency(row.netIncome)}</td>
                <td className="py-2 px-2 text-right dark:text-gray-300">{formatPercent(row.effectiveRate)}</td>
                <td className="py-2 px-2">
                  <button
                    onClick={() => dispatch({ type: 'SET_INCOME', payload: { filingStatus: row.filingStatus as FilingStatus } })}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      state.income.filingStatus === row.filingStatus
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    {state.income.filingStatus === row.filingStatus ? 'Selected' : 'Use'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
