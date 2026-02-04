import type { Account, IncomeState } from '../types/index.ts';
import { calculateTaxBreakdown } from './taxCalculator.ts';
import { simulatePayoff } from './debtPayoff.ts';

export interface WithdrawalInputs {
  balance401k: number;
  expectedReturn: number; // annual % (e.g. 7)
  withdrawalAmount: number;
}

export interface WithdrawalScenario {
  label: string;
  totalDebtInterest: number;
  penalty: number;
  extraTaxes: number;
  lostGrowth: number;
  totalCost: number;
  monthsToPayoff: number;
  ending401k: number;
}

export interface WithdrawalAnalysisResult {
  keepScenario: WithdrawalScenario;
  withdrawScenario: WithdrawalScenario;
  winner: 'keep' | 'withdraw';
  savings: number;
  timeHorizonMonths: number;
}

export function analyzeWithdrawal(
  debts: Account[],
  monthlyBudget: number,
  income: IncomeState,
  inputs: WithdrawalInputs
): WithdrawalAnalysisResult {
  const { balance401k, expectedReturn, withdrawalAmount } = inputs;
  const annualReturn = expectedReturn / 100;

  // --- Scenario A: Keep 401k, pay debts normally ---
  const keepPayoff = simulatePayoff(debts, monthlyBudget, 'avalanche');
  const keepMonths = keepPayoff.totalMonths;
  const keepInterest = keepPayoff.totalInterestPaid;

  // 401k grows untouched over the payoff period
  const keep401kEnding = balance401k * Math.pow(1 + annualReturn, keepMonths / 12);

  const keepScenario: WithdrawalScenario = {
    label: 'Keep 401k',
    totalDebtInterest: keepInterest,
    penalty: 0,
    extraTaxes: 0,
    lostGrowth: 0,
    totalCost: keepInterest,
    monthsToPayoff: keepMonths,
    ending401k: keep401kEnding,
  };

  // --- Scenario B: Withdraw from 401k ---
  const effectiveWithdrawal = Math.min(withdrawalAmount, balance401k);

  // Calculate penalty (10% early withdrawal)
  const penalty = effectiveWithdrawal * 0.10;

  // Calculate extra taxes: tax on (income + withdrawal) minus tax on (income alone)
  const taxWithout = calculateTaxBreakdown(
    income.baseSalary,
    income.monthlyCommission,
    income.dependents,
    income.stateTaxRate,
    income.filingStatus
  );
  const taxWith = calculateTaxBreakdown(
    income.baseSalary + effectiveWithdrawal,
    income.monthlyCommission,
    income.dependents,
    income.stateTaxRate,
    income.filingStatus
  );
  const extraTaxes = taxWith.totalTax - taxWithout.totalTax;

  // Net proceeds after penalty and taxes
  const netProceeds = effectiveWithdrawal - penalty - extraTaxes;

  // Apply net proceeds to debts (avalanche — highest APR first)
  const sortedDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate);
  const adjustedDebts: Account[] = [];
  let remainingProceeds = Math.max(0, netProceeds);

  for (const debt of sortedDebts) {
    const payoff = Math.min(remainingProceeds, debt.balance);
    const newBalance = debt.balance - payoff;
    remainingProceeds -= payoff;
    if (newBalance > 0.01) {
      adjustedDebts.push({ ...debt, balance: newBalance });
    }
  }

  // Simulate remaining payoff
  const withdrawPayoff = simulatePayoff(adjustedDebts, monthlyBudget, 'avalanche');
  const withdrawMonths = withdrawPayoff.totalMonths;
  const withdrawInterest = withdrawPayoff.totalInterestPaid;

  // Use the LONGER time horizon for fair comparison
  const timeHorizonMonths = Math.max(keepMonths, withdrawMonths);

  // 401k after withdrawal grows from reduced balance
  const remaining401k = balance401k - effectiveWithdrawal;
  const withdraw401kEnding = remaining401k * Math.pow(1 + annualReturn, timeHorizonMonths / 12);

  // Lost growth = what 401k would have been if kept vs what it is after withdrawal
  const keep401kAtHorizon = balance401k * Math.pow(1 + annualReturn, timeHorizonMonths / 12);
  const lostGrowth = keep401kAtHorizon - withdraw401kEnding;

  const withdrawTotalCost = withdrawInterest + penalty + extraTaxes + lostGrowth;

  const withdrawScenario: WithdrawalScenario = {
    label: 'Withdraw from 401k',
    totalDebtInterest: withdrawInterest,
    penalty,
    extraTaxes,
    lostGrowth,
    totalCost: withdrawTotalCost,
    monthsToPayoff: withdrawMonths,
    ending401k: withdraw401kEnding,
  };

  const keepTotalCost = keepInterest;
  const winner = keepTotalCost <= withdrawTotalCost ? 'keep' : 'withdraw';
  const savings = Math.abs(keepTotalCost - withdrawTotalCost);

  return {
    keepScenario,
    withdrawScenario,
    winner,
    savings,
    timeHorizonMonths,
  };
}
