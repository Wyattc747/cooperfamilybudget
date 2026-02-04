import type { Account, CompoundingType, PayoffResult, PayoffScheduleEntry } from '../types/index.ts';

function formatMonthDate(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const DAYS_PER_MONTH = 30.44;

/**
 * Calculate monthly interest based on compounding type.
 * - daily_compound: balance * ((1 + APR/365)^30.44 - 1)
 * - daily_simple: balance * (APR/365) * 30.44
 * - monthly: balance * APR/12
 */
export function calculateMonthlyInterest(
  balance: number,
  aprPercent: number,
  compoundingType: CompoundingType
): number {
  if (balance <= 0 || aprPercent <= 0) return 0;
  const apr = aprPercent / 100;

  switch (compoundingType) {
    case 'daily_compound':
      return balance * (Math.pow(1 + apr / 365, DAYS_PER_MONTH) - 1);
    case 'daily_simple':
      return balance * (apr / 365) * DAYS_PER_MONTH;
    case 'monthly':
      return balance * (apr / 12);
  }
}

/**
 * Calculate interest for an arbitrary number of days based on compounding type.
 */
export function calculatePeriodInterest(
  balance: number,
  aprPercent: number,
  compoundingType: CompoundingType,
  days: number
): number {
  if (balance <= 0 || aprPercent <= 0 || days <= 0) return 0;
  const apr = aprPercent / 100;

  switch (compoundingType) {
    case 'daily_compound':
      return balance * (Math.pow(1 + apr / 365, days) - 1);
    case 'daily_simple':
      return balance * (apr / 365) * days;
    case 'monthly':
      return balance * (apr / 365) * days;
  }
}

export interface PayDelay {
  /** Number of months with reduced budget before full pay starts */
  months: number;
  /** Budget available during the delay (e.g. business + tax-free only) */
  delayBudget: number;
}

export function simulatePayoff(
  debts: Account[],
  monthlyBudget: number,
  strategy: 'avalanche' | 'snowball',
  payDelay?: PayDelay
): PayoffResult {
  if (debts.length === 0 || (monthlyBudget <= 0 && (!payDelay || payDelay.delayBudget <= 0))) {
    return { strategy, schedule: [], totalMonths: 0, totalInterestPaid: 0, totalPaid: 0 };
  }

  const balances = new Map<string, number>();
  for (const d of debts) {
    balances.set(d.id, d.balance);
  }

  const schedule: PayoffScheduleEntry[] = [];
  let totalInterestPaid = 0;
  let totalPaid = 0;
  const maxMonths = 600;
  const delayMonths = payDelay?.months ?? 0;
  const delayBudget = payDelay?.delayBudget ?? 0;

  for (let month = 1; month <= maxMonths; month++) {
    const totalRemaining = Array.from(balances.values()).reduce((s, b) => s + b, 0);
    if (totalRemaining <= 0.01) break;

    // Use delay budget for early months, full budget after
    const currentBudget = month <= delayMonths ? delayBudget : monthlyBudget;

    // Charge interest using compounding type
    let monthInterest = 0;
    for (const debt of debts) {
      const bal = balances.get(debt.id) ?? 0;
      if (bal <= 0) continue;
      const interest = calculateMonthlyInterest(bal, debt.interestRate, debt.compoundingType ?? 'monthly');
      balances.set(debt.id, bal + interest);
      monthInterest += interest;
    }
    totalInterestPaid += monthInterest;

    // Pay minimums first
    let budgetRemaining = currentBudget;
    const payments: PayoffScheduleEntry['payments'] = [];

    for (const debt of debts) {
      const bal = balances.get(debt.id) ?? 0;
      if (bal <= 0) {
        payments.push({ accountId: debt.id, accountName: debt.name, payment: 0, remaining: 0 });
        continue;
      }
      const minPayment = Math.min(debt.minimumPayment, bal, budgetRemaining);
      balances.set(debt.id, bal - minPayment);
      budgetRemaining -= minPayment;
      payments.push({ accountId: debt.id, accountName: debt.name, payment: minPayment, remaining: bal - minPayment });
    }

    // Sort remaining debts by strategy
    const activeDebts = debts
      .filter((d) => (balances.get(d.id) ?? 0) > 0.01)
      .sort((a, b) => {
        if (strategy === 'avalanche') return b.interestRate - a.interestRate;
        return (balances.get(a.id) ?? 0) - (balances.get(b.id) ?? 0);
      });

    for (const debt of activeDebts) {
      if (budgetRemaining <= 0) break;
      const bal = balances.get(debt.id) ?? 0;
      const extra = Math.min(budgetRemaining, bal);
      balances.set(debt.id, bal - extra);
      budgetRemaining -= extra;

      const entry = payments.find((p) => p.accountId === debt.id);
      if (entry) {
        entry.payment += extra;
        entry.remaining = balances.get(debt.id) ?? 0;
      }
    }

    for (const p of payments) {
      p.remaining = Math.max(0, balances.get(p.accountId) ?? 0);
    }

    const monthTotalPaid = payments.reduce((s, p) => s + p.payment, 0);
    totalPaid += monthTotalPaid;

    schedule.push({
      month,
      date: formatMonthDate(month),
      payments,
      totalRemaining: Math.max(0, Array.from(balances.values()).reduce((s, b) => s + b, 0)),
      totalInterest: totalInterestPaid,
    });

    if (Array.from(balances.values()).every((b) => b <= 0.01)) break;
  }

  return {
    strategy,
    schedule,
    totalMonths: schedule.length,
    totalInterestPaid,
    totalPaid,
  };
}

export function compareStrategies(debts: Account[], monthlyBudget: number, payDelay?: PayDelay) {
  const avalanche = simulatePayoff(debts, monthlyBudget, 'avalanche', payDelay);
  const snowball = simulatePayoff(debts, monthlyBudget, 'snowball', payDelay);
  return { avalanche, snowball };
}

// --- Payment Frequency Analysis ---

export type PaymentFrequency = 'monthly' | 'biweekly' | 'weekly';

export interface FrequencyResult {
  frequency: PaymentFrequency;
  paymentAmount: number;
  annualTotal: number;
  monthsToPayoff: number;
  totalInterest: number;
  savedVsMonthly: number;
}

const FREQUENCY_DAYS: Record<PaymentFrequency, number> = {
  monthly: DAYS_PER_MONTH,
  biweekly: 14,
  weekly: 7,
};

const PERIODS_PER_YEAR: Record<PaymentFrequency, number> = {
  monthly: 12,
  biweekly: 26,
  weekly: 52,
};

/**
 * Simulate payoff with a specific payment frequency.
 * annualBudget is split evenly across periods.
 * Interest accrues per-period using each debt's compounding type.
 */
function simulatePayoffWithFrequency(
  debts: Account[],
  periodBudget: number,
  frequency: PaymentFrequency,
  strategy: 'avalanche' | 'snowball'
): { totalPeriods: number; totalInterest: number } {
  if (debts.length === 0 || periodBudget <= 0) {
    return { totalPeriods: 0, totalInterest: 0 };
  }

  const days = FREQUENCY_DAYS[frequency];
  const balances = new Map<string, number>();
  for (const d of debts) balances.set(d.id, d.balance);

  let totalInterest = 0;
  const maxPeriods = 600 * (DAYS_PER_MONTH / days); // same 50yr cap

  for (let period = 1; period <= maxPeriods; period++) {
    const totalRemaining = Array.from(balances.values()).reduce((s, b) => s + b, 0);
    if (totalRemaining <= 0.01) break;

    // Accrue interest for this period
    for (const debt of debts) {
      const bal = balances.get(debt.id) ?? 0;
      if (bal <= 0) continue;
      const interest = calculatePeriodInterest(bal, debt.interestRate, debt.compoundingType ?? 'monthly', days);
      balances.set(debt.id, bal + interest);
      totalInterest += interest;
    }

    // Scale minimum payments to period
    const minScale = days / DAYS_PER_MONTH;
    let budgetRemaining = periodBudget;

    for (const debt of debts) {
      const bal = balances.get(debt.id) ?? 0;
      if (bal <= 0) continue;
      const scaledMin = Math.min(debt.minimumPayment * minScale, bal, budgetRemaining);
      balances.set(debt.id, bal - scaledMin);
      budgetRemaining -= scaledMin;
    }

    // Extra to priority debt
    const activeDebts = debts
      .filter((d) => (balances.get(d.id) ?? 0) > 0.01)
      .sort((a, b) => {
        if (strategy === 'avalanche') return b.interestRate - a.interestRate;
        return (balances.get(a.id) ?? 0) - (balances.get(b.id) ?? 0);
      });

    for (const debt of activeDebts) {
      if (budgetRemaining <= 0) break;
      const bal = balances.get(debt.id) ?? 0;
      const extra = Math.min(budgetRemaining, bal);
      balances.set(debt.id, bal - extra);
      budgetRemaining -= extra;
    }

    if (Array.from(balances.values()).every((b) => b <= 0.01)) {
      return { totalPeriods: period, totalInterest };
    }
  }

  return {
    totalPeriods: Math.ceil(maxPeriods),
    totalInterest,
  };
}

// --- Per-Debt Frequency Breakdown ---

export interface DebtFrequencyBreakdown {
  accountId: string;
  accountName: string;
  compoundingType: CompoundingType;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  /** Whether paying more frequently saves meaningful interest */
  benefitsFromFrequency: boolean;
  /** Interest saved by paying weekly vs monthly (same annual budget) */
  weeklySavings: number;
  /** Interest saved by paying biweekly vs monthly (same annual budget) */
  biweeklySavings: number;
  /** Monthly interest at current balance */
  monthlyInterestCost: number;
  recommendation: string;
}

/**
 * Simulate a single debt being paid off at a given frequency with a given per-period budget.
 */
function simulateSingleDebtFrequency(
  debt: Account,
  periodBudget: number,
  frequency: PaymentFrequency
): { totalInterest: number; periods: number } {
  if (debt.balance <= 0 || periodBudget <= 0) return { totalInterest: 0, periods: 0 };

  const days = FREQUENCY_DAYS[frequency];
  let balance = debt.balance;
  let totalInterest = 0;
  const maxPeriods = Math.ceil(600 * (DAYS_PER_MONTH / days));
  const minScale = days / DAYS_PER_MONTH;

  for (let period = 1; period <= maxPeriods; period++) {
    if (balance <= 0.01) return { totalInterest, periods: period - 1 };

    const interest = calculatePeriodInterest(balance, debt.interestRate, debt.compoundingType ?? 'monthly', days);
    balance += interest;
    totalInterest += interest;

    const payment = Math.min(Math.max(periodBudget, debt.minimumPayment * minScale), balance);
    balance -= payment;
  }

  return { totalInterest, periods: maxPeriods };
}

/**
 * Analyze each debt individually to determine which ones benefit from more frequent payments.
 * Uses each debt's own minimum payment as the budget for comparison.
 */
export function analyzePerDebtFrequency(debts: Account[]): DebtFrequencyBreakdown[] {
  return debts
    .filter((d) => d.type === 'debt' && d.balance > 0)
    .map((debt) => {
      const monthlyBudget = Math.max(debt.minimumPayment, 50);
      const annualBudget = monthlyBudget * 12;

      const monthly = simulateSingleDebtFrequency(
        debt, annualBudget / PERIODS_PER_YEAR.monthly, 'monthly'
      );
      const biweekly = simulateSingleDebtFrequency(
        debt, annualBudget / PERIODS_PER_YEAR.biweekly, 'biweekly'
      );
      const weekly = simulateSingleDebtFrequency(
        debt, annualBudget / PERIODS_PER_YEAR.weekly, 'weekly'
      );

      const biweeklySavings = monthly.totalInterest - biweekly.totalInterest;
      const weeklySavings = monthly.totalInterest - weekly.totalInterest;
      const monthlyInterestCost = calculateMonthlyInterest(
        debt.balance, debt.interestRate, debt.compoundingType ?? 'monthly'
      );

      // Meaningful threshold: save at least $5 or 1% of total interest
      const threshold = Math.max(5, monthly.totalInterest * 0.01);
      const benefitsFromFrequency = weeklySavings > threshold;

      let recommendation: string;
      if (debt.compoundingType === 'daily_compound') {
        if (weeklySavings > 50) {
          recommendation = `Pay weekly or biweekly — saves ${weeklySavings > 100 ? 'significant' : 'meaningful'} interest by reducing daily compounding balance`;
        } else if (weeklySavings > threshold) {
          recommendation = 'Pay biweekly if possible — small but real savings on daily compound interest';
        } else {
          recommendation = 'Low balance/rate — frequency has minimal impact';
        }
      } else if (debt.compoundingType === 'daily_simple') {
        if (weeklySavings > threshold) {
          recommendation = 'Pay biweekly if possible — reduces average daily balance for simple interest';
        } else {
          recommendation = 'Low balance/rate — frequency has minimal impact';
        }
      } else {
        recommendation = 'Monthly payment is fine — interest is calculated monthly, so payment frequency doesn\'t affect interest';
      }

      return {
        accountId: debt.id,
        accountName: debt.name,
        compoundingType: debt.compoundingType ?? 'monthly',
        balance: debt.balance,
        interestRate: debt.interestRate,
        minimumPayment: debt.minimumPayment,
        benefitsFromFrequency,
        weeklySavings,
        biweeklySavings,
        monthlyInterestCost,
        recommendation,
      };
    })
    .sort((a, b) => {
      // Sort: benefits first, then by savings amount
      if (a.benefitsFromFrequency !== b.benefitsFromFrequency) {
        return a.benefitsFromFrequency ? -1 : 1;
      }
      return b.weeklySavings - a.weeklySavings;
    });
}

/**
 * Compare payment frequencies.
 * mode: 'same_annual' = same annual total, different frequency
 * mode: 'biweekly_extra' = biweekly gets 13 monthly payments/year (monthly/2 * 26 = 13x monthly)
 */
export function comparePaymentFrequencies(
  debts: Account[],
  monthlyBudget: number,
  strategy: 'avalanche' | 'snowball',
  mode: 'same_annual' | 'biweekly_extra'
): FrequencyResult[] {
  const frequencies: PaymentFrequency[] = ['monthly', 'biweekly', 'weekly'];
  const annualBudget = monthlyBudget * 12;

  const results: FrequencyResult[] = [];
  let monthlyInterest = 0;

  for (const freq of frequencies) {
    let periodBudget: number;
    let annualTotal: number;

    if (mode === 'same_annual') {
      periodBudget = annualBudget / PERIODS_PER_YEAR[freq];
      annualTotal = annualBudget;
    } else {
      // biweekly_extra: monthly stays same, biweekly = monthly/2 (26 payments = 13x monthly)
      if (freq === 'monthly') {
        periodBudget = monthlyBudget;
        annualTotal = monthlyBudget * 12;
      } else if (freq === 'biweekly') {
        periodBudget = monthlyBudget / 2;
        annualTotal = (monthlyBudget / 2) * 26; // 13x monthly
      } else {
        periodBudget = monthlyBudget / 4;
        annualTotal = (monthlyBudget / 4) * 52; // 13x monthly
      }
    }

    const sim = simulatePayoffWithFrequency(debts, periodBudget, freq, strategy);
    const months = sim.totalPeriods * (FREQUENCY_DAYS[freq] / DAYS_PER_MONTH);

    results.push({
      frequency: freq,
      paymentAmount: periodBudget,
      annualTotal,
      monthsToPayoff: Math.ceil(months),
      totalInterest: sim.totalInterest,
      savedVsMonthly: 0,
    });

    if (freq === 'monthly') monthlyInterest = sim.totalInterest;
  }

  // Calculate savings vs monthly
  for (const r of results) {
    r.savedVsMonthly = monthlyInterest - r.totalInterest;
  }

  return results;
}
