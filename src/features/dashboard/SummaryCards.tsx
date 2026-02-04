import { useMemo } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { calculateTaxBreakdown } from '../../common/utils/taxCalculator.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';

export default function SummaryCards() {
  const { state } = useApp();
  const { income, expenses, accounts, assets } = state;

  const annualBusiness = income.monthlyBusinessIncome * 12;
  const taxResult = useMemo(
    () => calculateTaxBreakdown(income.baseSalary, income.monthlyCommission, income.dependents, income.stateTaxRate, income.filingStatus, annualBusiness),
    [income, annualBusiness]
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDebt = accounts.filter((a) => a.type === 'debt').reduce((sum, a) => sum + a.balance, 0);
  const totalSavings = accounts.filter((a) => a.type === 'savings').reduce((sum, a) => sum + a.balance, 0);
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const netWorth = totalSavings + totalAssets - totalDebt;
  const monthlyNet = taxResult.netIncome / 12 + income.monthlyTaxFree;
  const remaining = monthlyNet - totalExpenses;

  const cards = [
    {
      label: 'Gross Income',
      value: formatCurrency(taxResult.grossIncome + income.monthlyTaxFree * 12),
      sub: '/year',
      bg: 'bg-blue-50',
      color: 'text-blue-700',
    },
    {
      label: 'Total Tax',
      value: formatCurrency(taxResult.totalTax),
      sub: '/year',
      bg: 'bg-red-50',
      color: 'text-red-700',
    },
    {
      label: 'Tax Credits',
      value: formatCurrency(taxResult.childTaxCredit),
      sub: '/year',
      bg: 'bg-green-50',
      color: 'text-green-700',
    },
    {
      label: 'Net Income',
      value: formatCurrency(taxResult.netIncome + income.monthlyTaxFree * 12),
      sub: '/year',
      bg: 'bg-emerald-50',
      color: 'text-emerald-700',
    },
    {
      label: 'Expenses',
      value: formatCurrency(totalExpenses),
      sub: '/month',
      bg: 'bg-orange-50',
      color: 'text-orange-700',
    },
    {
      label: 'Remaining',
      value: formatCurrency(remaining),
      sub: '/month',
      bg: remaining >= 0 ? 'bg-teal-50' : 'bg-red-50',
      color: remaining >= 0 ? 'text-teal-700' : 'text-red-700',
    },
    {
      label: 'Total Debt',
      value: formatCurrency(totalDebt),
      sub: '',
      bg: 'bg-rose-50',
      color: 'text-rose-700',
    },
    {
      label: 'Total Savings',
      value: formatCurrency(totalSavings),
      sub: '',
      bg: 'bg-cyan-50',
      color: 'text-cyan-700',
    },
    {
      label: 'Total Assets',
      value: formatCurrency(totalAssets),
      sub: '',
      bg: 'bg-indigo-50',
      color: 'text-indigo-700',
    },
    {
      label: 'Net Worth',
      value: formatCurrency(netWorth),
      sub: '',
      bg: netWorth >= 0 ? 'bg-emerald-50' : 'bg-red-50',
      color: netWorth >= 0 ? 'text-emerald-700' : 'text-red-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
          <p className="text-xs text-gray-600 mb-1">{card.label}</p>
          <p className={`text-lg font-bold ${card.color}`}>
            {card.value}
            {card.sub && <span className="text-xs font-normal text-gray-400">{card.sub}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}
