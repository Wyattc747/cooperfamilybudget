import { useMemo } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { calculateTaxBreakdown } from '../../common/utils/taxCalculator.ts';
import { formatCurrency, formatPercent } from '../../common/utils/formatters.ts';

export default function NetIncomeDisplay() {
  const { state } = useApp();
  const { baseSalary, monthlyCommission, monthlyBusinessIncome, dependents, stateTaxRate, filingStatus } = state.income;
  const annualBusinessIncome = monthlyBusinessIncome * 12;

  const result = useMemo(
    () => calculateTaxBreakdown(baseSalary, monthlyCommission, dependents, stateTaxRate, filingStatus, annualBusinessIncome),
    [baseSalary, monthlyCommission, dependents, stateTaxRate, filingStatus, annualBusinessIncome]
  );

  const { monthlyTaxFree } = state.income;
  const annualTaxFree = monthlyTaxFree * 12;
  const totalNetIncome = result.netIncome + annualTaxFree;

  if (result.grossIncome === 0 && monthlyTaxFree === 0) return null;

  const items = [
    { label: 'Gross Taxable Income', value: result.grossIncome, color: 'text-gray-900' },
    ...(annualBusinessIncome > 0
      ? [{ label: '  (includes business income)', value: annualBusinessIncome, color: 'text-gray-500' }]
      : []),
    { label: 'Federal Tax', value: -result.totalFederalTax, color: 'text-red-600' },
    { label: 'State Tax', value: -result.stateTax, color: 'text-red-600' },
    { label: 'Child Tax Credit', value: result.childTaxCredit, color: 'text-green-600' },
    { label: 'Total Tax', value: -result.totalTax, color: 'text-red-700' },
    ...(monthlyTaxFree > 0
      ? [{ label: 'Tax-Free Income', value: annualTaxFree, color: 'text-green-600' }]
      : []),
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-lg font-semibold mb-4">Income Summary</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className={`font-medium ${item.color}`}>{formatCurrency(Math.abs(item.value))}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
          <span className="font-semibold">Net Annual Income</span>
          <span className="font-bold text-green-700 text-lg">{formatCurrency(totalNetIncome)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Net Monthly Income</span>
          <span className="font-medium">{formatCurrency(totalNetIncome / 12)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Effective Tax Rate</span>
          <span className="font-medium">{formatPercent(result.effectiveRate)}</span>
        </div>
      </div>
    </div>
  );
}
