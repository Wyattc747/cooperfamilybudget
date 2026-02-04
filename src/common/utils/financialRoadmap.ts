import type { Account, IncomeState } from '../types/index.ts';
import { simulatePayoff } from './debtPayoff.ts';
import { calculateAffordability, type HouseInputs } from './houseAffordability.ts';

export interface PhaseInfo {
  id: number;
  name: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
  progress: number; // 0-100
  estimatedMonths: number;
  monthlyAllocation: number;
  details: string;
}

export interface ProjectionPoint {
  month: number;
  debt: number;
  emergencyFund: number;
  investments: number;
  netWorth: number;
  phase: number;
}

export interface RoadmapResult {
  phases: PhaseInfo[];
  projections: ProjectionPoint[];
  currentPhase: number;
}

export function calculateRoadmap(
  income: IncomeState,
  debts: Account[],
  totalExpenses: number,
  monthlyBudget: number,
  emergencyTarget?: number,
  payDelayMonths = 0,
  delayBudget = 0
): RoadmapResult {
  const grossMonthlyIncome =
    (income.baseSalary + income.monthlyCommission * 12) / 12 + income.monthlyTaxFree;
  // Emergency fund targets
  const threeMonthExpenses = totalExpenses * 3;
  const sixMonthExpenses = totalExpenses * 6;
  const efTarget = emergencyTarget ?? sixMonthExpenses;

  // Separate credit card debt from other debt
  const creditCardDebts = debts.filter(
    (d) => d.type === 'debt' && (d.debtCategory === 'credit_card' || d.compoundingType === 'daily_compound')
  );
  const otherDebts = debts.filter(
    (d) => d.type === 'debt' && d.debtCategory !== 'credit_card' && d.compoundingType !== 'daily_compound'
  );
  const allDebts = debts.filter((d) => d.type === 'debt');
  const totalDebtBalance = allDebts.reduce((s, d) => s + d.balance, 0);
  const ccDebtBalance = creditCardDebts.reduce((s, d) => s + d.balance, 0);

  const phases: PhaseInfo[] = [];
  const projections: ProjectionPoint[] = [];

  let currentMonth = 0;
  let remainingBudget = monthlyBudget;
  let currentDebt = totalDebtBalance;
  let currentEF = 0;
  let currentInvestments = 0;
  let currentPhase = 1;

  // --- Pay delay period: interest accrues, only delay budget available ---
  if (payDelayMonths > 0) {
    // Simulate the delay period: each month, interest accrues on all debts,
    // only delayBudget available for minimum payments
    const debtBalances = new Map<string, number>();
    for (const d of allDebts) debtBalances.set(d.id, d.balance);

    for (let m = 1; m <= payDelayMonths; m++) {
      currentMonth++;
      // Accrue interest
      for (const debt of allDebts) {
        const bal = debtBalances.get(debt.id) ?? 0;
        if (bal <= 0) continue;
        const interest = bal * (debt.interestRate / 100 / 12);
        debtBalances.set(debt.id, bal + interest);
      }
      // Apply delay budget to minimums
      let budget = delayBudget;
      for (const debt of allDebts) {
        if (budget <= 0) break;
        const bal = debtBalances.get(debt.id) ?? 0;
        if (bal <= 0) continue;
        const payment = Math.min(debt.minimumPayment, bal, budget);
        debtBalances.set(debt.id, bal - payment);
        budget -= payment;
      }

      const remaining = Array.from(debtBalances.values()).reduce((s, b) => s + b, 0);
      projections.push({
        month: currentMonth,
        debt: remaining,
        emergencyFund: 0,
        investments: 0,
        netWorth: -remaining,
        phase: 0,
      });
    }
    // Update debt tracking after delay
    currentDebt = Array.from(debtBalances.values()).reduce((s, b) => s + b, 0);
    // Update individual debt balances for the payoff simulation
    for (const d of creditCardDebts) {
      d.balance = debtBalances.get(d.id) ?? d.balance;
    }
    for (const d of otherDebts) {
      d.balance = debtBalances.get(d.id) ?? d.balance;
    }
  }

  // --- Phase 1: Kill Credit Card Debt ---
  const ccPayoff = creditCardDebts.length > 0
    ? simulatePayoff(creditCardDebts, remainingBudget, 'avalanche')
    : null;
  const ccMonths = ccPayoff?.totalMonths ?? 0;
  const ccInterest = ccPayoff?.totalInterestPaid ?? 0;
  const ccProgress = ccDebtBalance > 0 ? 0 : 100;

  phases.push({
    id: 1,
    name: 'Kill Credit Card Debt',
    description: 'All available budget toward credit card payoff (avalanche by APR)',
    status: ccDebtBalance <= 0 ? 'completed' : 'active',
    progress: ccProgress,
    estimatedMonths: ccMonths,
    monthlyAllocation: ccDebtBalance > 0 ? remainingBudget : 0,
    details: ccDebtBalance > 0
      ? `${creditCardDebts.length} credit cards, ${ccMonths} months, interest: $${ccInterest.toFixed(0)}`
      : 'No credit card debt',
  });

  // Simulate phase 1
  if (ccPayoff && ccMonths > 0) {
    for (let m = 1; m <= ccMonths; m++) {
      const entry = ccPayoff.schedule[m - 1];
      const debtRemaining = entry ? entry.totalRemaining + otherDebts.reduce((s, d) => s + d.balance, 0) : totalDebtBalance;
      currentMonth++;
      projections.push({
        month: currentMonth,
        debt: debtRemaining,
        emergencyFund: 0,
        investments: 0,
        netWorth: -debtRemaining,
        phase: 1,
      });
    }
    currentDebt = otherDebts.reduce((s, d) => s + d.balance, 0);
  }

  if (ccDebtBalance > 0) {
    currentPhase = 1;
  }

  // --- Phase 2: Emergency Fund ---
  const efMonthly = remainingBudget * 0.70;
  const efMonths = efTarget > 0 ? Math.ceil(efTarget / efMonthly) : 0;

  phases.push({
    id: 2,
    name: 'Emergency Fund',
    description: `Build ${efTarget > threeMonthExpenses ? '6' : '3'} months expenses. 70% to savings, 30% to minimum debt payments.`,
    status: ccDebtBalance > 0 ? 'upcoming' : currentEF >= efTarget ? 'completed' : 'active',
    progress: efTarget > 0 ? Math.min(100, (currentEF / efTarget) * 100) : 100,
    estimatedMonths: efMonths,
    monthlyAllocation: efMonthly,
    details: `Target: $${efTarget.toFixed(0)} (${efTarget > threeMonthExpenses ? '6' : '3'} months expenses)`,
  });

  if (ccDebtBalance <= 0 && currentEF < efTarget) {
    currentPhase = 2;
  }

  // Simulate phase 2
  for (let m = 1; m <= efMonths; m++) {
    currentMonth++;
    currentEF = Math.min(efTarget, efMonthly * m);
    projections.push({
      month: currentMonth,
      debt: currentDebt,
      emergencyFund: currentEF,
      investments: 0,
      netWorth: currentEF - currentDebt,
      phase: 2,
    });
  }

  // --- Phase 3: Invest & Prepare for House ---
  const investMonthly = remainingBudget * 0.50;
  const investMonths = 24; // 2 year horizon for house prep

  phases.push({
    id: 3,
    name: 'Invest & Prepare for House',
    description: 'Start retirement contributions, save for closing costs. Track DTI improvement.',
    status: currentPhase < 3 ? 'upcoming' : 'active',
    progress: 0,
    estimatedMonths: investMonths,
    monthlyAllocation: investMonthly,
    details: `Employer match + additional savings. Monthly: $${investMonthly.toFixed(0)}`,
  });

  if (ccDebtBalance <= 0 && currentEF >= efTarget) {
    currentPhase = 3;
  }

  // Simulate phase 3
  for (let m = 1; m <= investMonths; m++) {
    currentMonth++;
    // Investments grow at ~7% annually
    currentInvestments = currentInvestments * (1 + 0.07 / 12) + investMonthly;
    projections.push({
      month: currentMonth,
      debt: currentDebt,
      emergencyFund: efTarget,
      investments: currentInvestments,
      netWorth: efTarget + currentInvestments - currentDebt,
      phase: 3,
    });
  }

  // --- Phase 4: Build House ---
  const houseInputs: HouseInputs = {
    giftDownPayment: 100000,
    loanTermYears: 30,
    mortgageRate: 6.5,
    propertyTaxRate: 1.2,
    annualInsurance: 2400,
  };
  const debtPayments = allDebts.reduce((s, d) => s + d.minimumPayment, 0);
  const houseResult = calculateAffordability(grossMonthlyIncome, debtPayments, houseInputs);

  phases.push({
    id: 4,
    name: 'Build House',
    description: '$100k gift down payment. Build within max affordable price.',
    status: 'upcoming',
    progress: 0,
    estimatedMonths: 12,
    monthlyAllocation: houseResult.totalMonthlyHousing,
    details: `Max price: $${houseResult.maxHomePrice.toLocaleString()} | Monthly: $${houseResult.totalMonthlyHousing.toFixed(0)}`,
  });

  // Simulate phase 4 (simplified - 12 months of house building)
  for (let m = 1; m <= 12; m++) {
    currentMonth++;
    currentInvestments = currentInvestments * (1 + 0.07 / 12);
    projections.push({
      month: currentMonth,
      debt: currentDebt,
      emergencyFund: efTarget,
      investments: currentInvestments,
      netWorth: efTarget + currentInvestments - currentDebt + houseResult.maxHomePrice * (m / 12) * 0.1, // equity building
      phase: 4,
    });
  }

  // --- Phase 5: Financial Freedom ---
  const ffMonthly = remainingBudget * 0.60;

  phases.push({
    id: 5,
    name: 'Financial Freedom',
    description: 'Increase investment rate. Project long-term wealth.',
    status: 'upcoming',
    progress: 0,
    estimatedMonths: 360,
    monthlyAllocation: ffMonthly,
    details: getInvestmentProjectionSummary(currentInvestments, ffMonthly),
  });

  // Simulate phase 5 (project out 30 years = 360 months)
  const yearsToProject = 30;
  // Sample every 12 months for efficiency
  for (let y = 1; y <= yearsToProject; y++) {
    for (let m = 1; m <= 12; m++) {
      currentMonth++;
      currentInvestments = currentInvestments * (1 + 0.07 / 12) + ffMonthly;
    }
    projections.push({
      month: currentMonth,
      debt: 0,
      emergencyFund: efTarget,
      investments: currentInvestments,
      netWorth: efTarget + currentInvestments,
      phase: 5,
    });
  }

  return { phases, projections, currentPhase };
}

function getInvestmentProjectionSummary(startingBalance: number, monthlyContribution: number): string {
  const milestones = [5, 10, 20, 30];
  const parts = milestones.map((years) => {
    let bal = startingBalance;
    for (let m = 0; m < years * 12; m++) {
      bal = bal * (1 + 0.07 / 12) + monthlyContribution;
    }
    return `${years}yr: $${(bal / 1000).toFixed(0)}k`;
  });
  return parts.join(' | ');
}

export interface BudgetAllocationRecommendation {
  phase: number;
  allocations: { label: string; percentage: number; amount: number; color: string }[];
}

export function getRecommendedAllocation(
  currentPhase: number,
  monthlyBudget: number
): BudgetAllocationRecommendation {
  switch (currentPhase) {
    case 1:
      return {
        phase: 1,
        allocations: [
          { label: 'Credit Card Debt', percentage: 100, amount: monthlyBudget, color: '#ef4444' },
        ],
      };
    case 2:
      return {
        phase: 2,
        allocations: [
          { label: 'Emergency Fund', percentage: 70, amount: monthlyBudget * 0.70, color: '#3b82f6' },
          { label: 'Min Debt Payments', percentage: 30, amount: monthlyBudget * 0.30, color: '#f59e0b' },
        ],
      };
    default:
      return {
        phase: currentPhase,
        allocations: [
          { label: 'Needs', percentage: 50, amount: monthlyBudget * 0.50, color: '#6b7280' },
          { label: 'Savings & Debt', percentage: 20, amount: monthlyBudget * 0.20, color: '#3b82f6' },
          { label: 'Wants', percentage: 30, amount: monthlyBudget * 0.30, color: '#10b981' },
        ],
      };
  }
}
