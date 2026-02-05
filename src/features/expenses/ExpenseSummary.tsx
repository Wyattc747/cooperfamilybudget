import { useMemo } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { calculateTaxBreakdown } from '../../common/utils/taxCalculator.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';

export default function ExpenseSummary() {
  const { state } = useApp();

  const totalExpenses = useMemo(
    () => state.expenses.reduce((sum, e) => sum + e.amount, 0),
    [state.expenses]
  );

  const { baseSalary, monthlyCommission, monthlyBusinessIncome, dependents, stateTaxRate, filingStatus } = state.income;
  const annualBusiness = monthlyBusinessIncome * 12;
  const taxResult = useMemo(
    () => calculateTaxBreakdown(baseSalary, monthlyCommission, dependents, stateTaxRate, filingStatus, annualBusiness),
    [baseSalary, monthlyCommission, dependents, stateTaxRate, filingStatus, annualBusiness]
  );

  const monthlyNet = taxResult.netIncome / 12 + state.income.monthlyTaxFree;
  const remaining = monthlyNet - totalExpenses;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Net Monthly Income</p>
        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(monthlyNet)}</p>
      </div>
      <div className="bg-red-50 dark:bg-red-950 rounded-xl p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
        <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalExpenses)}</p>
      </div>
      <div className={`rounded-xl p-4 ${remaining >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
        <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
        <p className={`text-xl font-bold ${remaining >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
          {formatCurrency(remaining)}
        </p>
      </div>
    </div>
  );
}
