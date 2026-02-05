import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext.tsx';
import { calculateTaxBreakdown } from '../utils/taxCalculator.ts';

export interface PayoffBudget {
  monthlyNet: number;
  totalExpenses: number;
  /** Sum of all debt account minimum payments */
  totalDebtMinimums: number;
  /** Sum of non-credit-card debt minimum payments */
  nonCCDebtMinimums: number;
  /** totalExpenses + totalDebtMinimums (for display) */
  totalMonthlyObligations: number;
  calculatedBudget: number;
  effectiveBudget: number;
  /** Budget during the pay-delay period (no salary/commission, only business + tax-free) */
  delayBudget: number;
  /** Full months until first paycheck arrives (0 if pay already started) */
  payDelayMonths: number;
}

export function usePayoffBudget(): PayoffBudget {
  const { state } = useApp();
  const { income, expenses, payoffSettings } = state;

  const annualBusinessIncome = income.monthlyBusinessIncome * 12;

  // Full income tax result (salary + commission + business)
  const taxResult = useMemo(
    () =>
      calculateTaxBreakdown(
        income.baseSalary,
        income.monthlyCommission,
        income.dependents,
        income.stateTaxRate,
        income.filingStatus,
        annualBusinessIncome
      ),
    [income, annualBusinessIncome]
  );

  // Delay-period tax result (no salary/commission, only business income)
  const delayTaxResult = useMemo(
    () =>
      calculateTaxBreakdown(
        0,
        0,
        income.dependents,
        income.stateTaxRate,
        income.filingStatus,
        annualBusinessIncome
      ),
    [income.dependents, income.stateTaxRate, income.filingStatus, annualBusinessIncome]
  );

  const monthlyNet = taxResult.netIncome / 12 + income.monthlyTaxFree;
  const delayMonthlyNet = delayTaxResult.netIncome / 12 + income.monthlyTaxFree;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const allDebts = state.accounts.filter((a) => a.type === 'debt');
  const totalDebtMinimums = allDebts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const nonCCDebtMinimums = allDebts
    .filter((d) => d.debtCategory !== 'credit_card')
    .reduce((sum, d) => sum + d.minimumPayment, 0);
  const totalMonthlyObligations = totalExpenses + totalDebtMinimums;

  const calculatedBudget = Math.max(0, monthlyNet - totalExpenses - nonCCDebtMinimums);
  const effectiveBudget = payoffSettings.isManualOverride
    ? payoffSettings.monthlyBudget
    : calculatedBudget;

  const delayBudget = Math.max(0, delayMonthlyNet - totalExpenses - nonCCDebtMinimums);

  // Calculate months until pay starts
  let payDelayMonths = 0;
  if (income.payStartDate) {
    const now = new Date();
    const start = new Date(income.payStartDate);
    if (start > now) {
      const diffDays = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      payDelayMonths = Math.ceil(diffDays / 30.44);
    }
  }

  return { monthlyNet, totalExpenses, totalDebtMinimums, nonCCDebtMinimums, totalMonthlyObligations, calculatedBudget, effectiveBudget, delayBudget, payDelayMonths };
}
