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
  const totalDebtMinimums = accounts.filter((a) => a.type === 'debt').reduce((sum, a) => sum + a.minimumPayment, 0);
  const totalMonthlyObligations = totalExpenses + totalDebtMinimums;
  const totalDebt = accounts.filter((a) => a.type === 'debt').reduce((sum, a) => sum + a.balance, 0);
  const totalCash = accounts.filter((a) => a.type === 'cash').reduce((sum, a) => sum + a.balance, 0);
  const totalInvestments = accounts.filter((a) => a.type === 'investment').reduce((sum, a) => sum + a.balance, 0);
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const netWorth = totalCash + totalInvestments + totalAssets - totalDebt;
  const monthlyNet = taxResult.netIncome / 12 + income.monthlyTaxFree;
  const remaining = monthlyNet - totalMonthlyObligations;

  const cards = [
    {
      label: 'Gross Income',
      value: formatCurrency(taxResult.grossIncome + income.monthlyTaxFree * 12),
      sub: '/year',
      bg: 'bg-blue-50 dark:bg-blue-950',
      color: 'text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Total Tax',
      value: formatCurrency(taxResult.totalTax),
      sub: '/year',
      bg: 'bg-red-50 dark:bg-red-950',
      color: 'text-red-700 dark:text-red-300',
    },
    {
      label: 'Tax Credits',
      value: formatCurrency(taxResult.childTaxCredit),
      sub: '/year',
      bg: 'bg-green-50 dark:bg-green-950',
      color: 'text-green-700 dark:text-green-300',
    },
    {
      label: 'Net Income',
      value: formatCurrency(taxResult.netIncome + income.monthlyTaxFree * 12),
      sub: '/year',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      color: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Monthly Obligations',
      value: formatCurrency(totalMonthlyObligations),
      sub: totalDebtMinimums > 0 ? ` (incl. ${formatCurrency(totalDebtMinimums)} debt mins)` : '/month',
      bg: 'bg-orange-50 dark:bg-orange-950',
      color: 'text-orange-700 dark:text-orange-300',
    },
    {
      label: 'Remaining',
      value: formatCurrency(remaining),
      sub: '/month',
      bg: remaining >= 0 ? 'bg-teal-50 dark:bg-teal-950' : 'bg-red-50 dark:bg-red-950',
      color: remaining >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-red-700 dark:text-red-300',
    },
    {
      label: 'Total Debt',
      value: formatCurrency(totalDebt),
      sub: '',
      bg: 'bg-rose-50 dark:bg-rose-950',
      color: 'text-rose-700 dark:text-rose-300',
    },
    {
      label: 'Cash Accounts',
      value: formatCurrency(totalCash),
      sub: '',
      bg: 'bg-cyan-50 dark:bg-cyan-950',
      color: 'text-cyan-700 dark:text-cyan-300',
    },
    {
      label: 'Investments',
      value: formatCurrency(totalInvestments),
      sub: '',
      bg: 'bg-violet-50 dark:bg-violet-950',
      color: 'text-violet-700 dark:text-violet-300',
    },
    {
      label: 'Total Assets',
      value: formatCurrency(totalAssets),
      sub: '',
      bg: 'bg-indigo-50 dark:bg-indigo-950',
      color: 'text-indigo-700 dark:text-indigo-300',
    },
    {
      label: 'Net Worth',
      value: formatCurrency(netWorth),
      sub: '',
      bg: netWorth >= 0 ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950',
      color: netWorth >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{card.label}</p>
          <p className={`text-lg font-bold ${card.color}`}>
            {card.value}
            {card.sub && <span className="text-xs font-normal text-gray-400 dark:text-gray-500">{card.sub}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}
