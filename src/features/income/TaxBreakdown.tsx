import { useMemo } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import Card from '../../common/components/Card.tsx';
import { calculateTaxBreakdown } from '../../common/utils/taxCalculator.ts';
import { formatCurrency, formatPercent } from '../../common/utils/formatters.ts';

export default function TaxBreakdown() {
  const { state } = useApp();
  const { baseSalary, monthlyCommission, monthlyBusinessIncome, dependents, stateTaxRate, filingStatus } = state.income;
  const annualBusiness = monthlyBusinessIncome * 12;

  const result = useMemo(
    () => calculateTaxBreakdown(baseSalary, monthlyCommission, dependents, stateTaxRate, filingStatus, annualBusiness),
    [baseSalary, monthlyCommission, dependents, stateTaxRate, filingStatus, annualBusiness]
  );

  if (result.grossIncome === 0) {
    return (
      <Card title="Tax Breakdown">
        <p className="text-gray-400 text-sm text-center py-6">Enter your income above to see tax breakdown</p>
      </Card>
    );
  }

  const activeBrackets = result.brackets.filter((b) => b.taxable > 0);

  return (
    <Card title="Bracket-by-Bracket Tax Breakdown">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Bracket</th>
              <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Rate</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Taxable</th>
              <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Tax</th>
            </tr>
          </thead>
          <tbody>
            {activeBrackets.map((b, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                  {formatCurrency(b.bracket.min)} - {b.bracket.max === Infinity ? '...' : formatCurrency(b.bracket.max)}
                </td>
                <td className="py-2 px-2 dark:text-gray-300">{formatPercent(b.bracket.rate * 100, 0)}</td>
                <td className="py-2 px-2 text-right dark:text-gray-300">{formatCurrency(b.taxable)}</td>
                <td className="py-2 px-2 text-right font-medium dark:text-gray-200">{formatCurrency(b.tax)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-300 dark:border-gray-600 font-medium">
              <td colSpan={3} className="py-2 px-2 dark:text-gray-200">Federal Tax Total</td>
              <td className="py-2 px-2 text-right dark:text-gray-200">{formatCurrency(result.totalFederalTax)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Base vs Commission split */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Split: Base vs Commission</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-500 dark:text-gray-400">Tax on Base Salary</p>
            <p className="font-semibold dark:text-gray-200">{formatCurrency(result.baseTax)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-500 dark:text-gray-400">Tax on Commission</p>
            <p className="font-semibold dark:text-gray-200">{formatCurrency(result.commissionTax)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-500 dark:text-gray-400">State Tax (Base)</p>
            <p className="font-semibold dark:text-gray-200">{formatCurrency(result.baseStateTax)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-500 dark:text-gray-400">State Tax (Commission)</p>
            <p className="font-semibold dark:text-gray-200">{formatCurrency(result.commissionStateTax)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
