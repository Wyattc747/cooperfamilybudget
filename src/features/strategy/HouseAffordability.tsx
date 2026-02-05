import { useMemo, useState } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import {
  calculateAffordability,
  calculateDebtPayoffImpact,
  type HouseInputs,
} from '../../common/utils/houseAffordability.ts';
import { formatCurrency, formatPercent } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';
import { Input, Select } from '../../common/components/FormInput.tsx';

export default function HouseAffordability() {
  const { state } = useApp();
  const debts = state.accounts.filter((a) => a.type === 'debt');
  const { income } = state;

  const [giftDownPayment, setGiftDownPayment] = useState('100000');
  const [loanTermYears, setLoanTermYears] = useState<'15' | '30'>('30');
  const [mortgageRate, setMortgageRate] = useState('6.5');
  const [propertyTaxRate, setPropertyTaxRate] = useState('1.2');
  const [annualInsurance, setAnnualInsurance] = useState('2400');

  const grossMonthlyIncome =
    (income.baseSalary + income.monthlyCommission * 12) / 12 + income.monthlyTaxFree;

  const inputs: HouseInputs = useMemo(
    () => ({
      giftDownPayment: parseFloat(giftDownPayment) || 0,
      loanTermYears: parseInt(loanTermYears) as 15 | 30,
      mortgageRate: parseFloat(mortgageRate) || 0,
      propertyTaxRate: parseFloat(propertyTaxRate) || 0,
      annualInsurance: parseFloat(annualInsurance) || 0,
    }),
    [giftDownPayment, loanTermYears, mortgageRate, propertyTaxRate, annualInsurance]
  );

  const totalDebtPayments = debts.reduce((s, d) => s + d.minimumPayment, 0);

  const result = useMemo(
    () => calculateAffordability(grossMonthlyIncome, totalDebtPayments, inputs),
    [grossMonthlyIncome, totalDebtPayments, inputs]
  );

  const debtImpact = useMemo(
    () => calculateDebtPayoffImpact(grossMonthlyIncome, debts, inputs),
    [grossMonthlyIncome, debts, inputs]
  );

  return (
    <div className="space-y-6">
      <Card title="House Affordability Calculator">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input
            label="Gift Down Payment"
            type="number"
            step="1000"
            min="0"
            value={giftDownPayment}
            onChange={(e) => setGiftDownPayment(e.target.value)}
            placeholder="100000"
          />
          <Select
            label="Loan Term"
            options={[
              { value: '30', label: '30 Year Fixed' },
              { value: '15', label: '15 Year Fixed' },
            ]}
            value={loanTermYears}
            onChange={(e) => setLoanTermYears(e.target.value as '15' | '30')}
          />
          <Input
            label="Mortgage Rate (%)"
            type="number"
            step="0.125"
            min="0"
            max="15"
            value={mortgageRate}
            onChange={(e) => setMortgageRate(e.target.value)}
            placeholder="6.5"
          />
          <Input
            label="Property Tax Rate (%)"
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={propertyTaxRate}
            onChange={(e) => setPropertyTaxRate(e.target.value)}
            placeholder="1.2"
          />
          <Input
            label="Annual Insurance"
            type="number"
            step="100"
            min="0"
            value={annualInsurance}
            onChange={(e) => setAnnualInsurance(e.target.value)}
            placeholder="2400"
          />
          <div className="flex flex-col justify-end">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gross Monthly Income</p>
            <p className="text-sm font-semibold dark:text-gray-200">{formatCurrency(grossMonthlyIncome)}</p>
          </div>
        </div>

        {grossMonthlyIncome > 0 ? (
          <>
            {/* Max home price */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 text-center">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Maximum Affordable Home Price</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{formatCurrency(result.maxHomePrice)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Limited by {result.limitingFactor === 'front_end' ? 'front-end DTI (28%)' : 'back-end DTI (36%)'}
              </p>
            </div>

            {/* DTI gauges */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <DTIGauge label="Front-End DTI" value={result.frontEndDTI} limit={28} />
              <DTIGauge label="Back-End DTI" value={result.backEndDTI} limit={36} />
            </div>

            {/* Monthly payment breakdown */}
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">Monthly Payment Breakdown</h4>
              <div className="space-y-1">
                <Row label="Principal & Interest" value={formatCurrency(result.monthlyPI)} />
                <Row label="Property Tax" value={formatCurrency(result.monthlyTax)} />
                <Row label="Insurance" value={formatCurrency(result.monthlyInsurance)} />
                {result.monthlyPMI > 0 && <Row label="PMI" value={formatCurrency(result.monthlyPMI)} />}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-1">
                  <Row label="Total Housing Payment" value={formatCurrency(result.totalMonthlyHousing)} bold />
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Down payment: {formatCurrency(result.downPayment)} | Loan: {formatCurrency(result.loanAmount)}
                {result.monthlyPMI > 0 && ' | PMI required (< 20% down)'}
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">
            Set income on the Income page to calculate affordability
          </p>
        )}
      </Card>

      {/* Debt payoff impact table */}
      {debtImpact.length > 0 && grossMonthlyIncome > 0 && (
        <Card title="Debt Payoff Impact on Home Qualification">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            See how paying off each debt improves your home buying power.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">If you pay off...</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Monthly Payment</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">DTI drops to</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Max Price Increase</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">New Max Price</th>
                </tr>
              </thead>
              <tbody>
                {debtImpact.map((d) => (
                  <tr key={d.debtId} className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="py-2 px-2 font-medium dark:text-gray-200">{d.debtName}</td>
                    <td className="py-2 px-2 text-right dark:text-gray-300">{formatCurrency(d.monthlyPayment)}</td>
                    <td className="py-2 px-2 text-right dark:text-gray-300">
                      {formatPercent(d.newBackEndDTI)}
                      <span className="text-green-600 dark:text-green-400 text-xs ml-1">(-{formatPercent(d.dtiDrop)})</span>
                    </td>
                    <td className="py-2 px-2 text-right text-green-600 dark:text-green-400 font-medium">
                      +{formatCurrency(d.maxHomePriceIncrease)}
                    </td>
                    <td className="py-2 px-2 text-right font-medium dark:text-gray-200">{formatCurrency(d.newMaxHomePrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function DTIGauge({ label, value, limit }: { label: string; value: number; limit: number }) {
  const pct = Math.min((value / limit) * 100, 100);
  const isOver = value > limit;

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-600 dark:text-gray-400">{label}</span>
        <span className={`font-bold ${isOver ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {formatPercent(value)} / {limit}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={`text-gray-600 dark:text-gray-400 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`dark:text-gray-200 ${bold ? 'font-bold' : 'font-medium'}`}>{value}</span>
    </div>
  );
}
