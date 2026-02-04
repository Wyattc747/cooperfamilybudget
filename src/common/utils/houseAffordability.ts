import type { Account } from '../types/index.ts';

export interface HouseInputs {
  giftDownPayment: number;
  loanTermYears: 15 | 30;
  mortgageRate: number; // annual % (e.g. 6.5)
  propertyTaxRate: number; // annual % of home value (e.g. 1.2)
  annualInsurance: number;
}

export interface HouseAffordabilityResult {
  maxHomePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyPI: number; // principal & interest
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyPMI: number;
  totalMonthlyHousing: number;
  frontEndDTI: number;
  backEndDTI: number;
  limitingFactor: 'front_end' | 'back_end';
}

export interface DebtPayoffImpact {
  debtId: string;
  debtName: string;
  monthlyPayment: number;
  currentBackEndDTI: number;
  newBackEndDTI: number;
  dtiDrop: number;
  maxHomePriceIncrease: number;
  newMaxHomePrice: number;
}

/**
 * Calculate monthly P&I payment for a fixed-rate mortgage.
 */
function calculateMonthlyPI(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0) return 0;
  if (annualRate <= 0) return principal / (termYears * 12);
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * Calculate PMI (if down payment < 20%).
 * Typical PMI: 0.5-1% of loan amount annually. We use 0.75%.
 */
function calculateMonthlyPMI(loanAmount: number, homePrice: number): number {
  const ltv = loanAmount / homePrice;
  if (ltv <= 0.80) return 0;
  return (loanAmount * 0.0075) / 12;
}

/**
 * Calculate max affordable home price given income and existing debts.
 * Uses DTI limits: front-end 28%, back-end 36%.
 */
export function calculateAffordability(
  grossMonthlyIncome: number,
  monthlyDebtPayments: number,
  inputs: HouseInputs
): HouseAffordabilityResult {
  const { giftDownPayment, loanTermYears, mortgageRate, propertyTaxRate, annualInsurance } = inputs;
  const monthlyInsurance = annualInsurance / 12;

  // Front-end limit: housing costs <= 28% of gross income
  const maxFrontEndHousing = grossMonthlyIncome * 0.28;

  // Back-end limit: all debts + housing <= 36% of gross income
  const maxBackEndTotal = grossMonthlyIncome * 0.36;
  const maxBackEndHousing = maxBackEndTotal - monthlyDebtPayments;

  // The effective max housing payment is the lesser of the two limits
  const maxMonthlyHousing = Math.max(0, Math.min(maxFrontEndHousing, maxBackEndHousing));
  const limitingFactor = maxFrontEndHousing <= maxBackEndHousing ? 'front_end' : 'back_end';

  // Iteratively find max home price
  // Monthly housing = P&I + tax + insurance + PMI
  // We need to solve for home price where total monthly = maxMonthlyHousing
  let low = 0;
  let high = 5_000_000;
  let maxHomePrice = 0;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const dp = Math.min(giftDownPayment, mid);
    const loan = mid - dp;
    const pi = calculateMonthlyPI(loan, mortgageRate, loanTermYears);
    const tax = (mid * (propertyTaxRate / 100)) / 12;
    const pmi = calculateMonthlyPMI(loan, mid);
    const total = pi + tax + monthlyInsurance + pmi;

    if (total <= maxMonthlyHousing) {
      maxHomePrice = mid;
      low = mid;
    } else {
      high = mid;
    }

    if (high - low < 100) break;
  }

  // Round to nearest $1000
  maxHomePrice = Math.floor(maxHomePrice / 1000) * 1000;

  const downPayment = Math.min(giftDownPayment, maxHomePrice);
  const loanAmount = maxHomePrice - downPayment;
  const monthlyPI = calculateMonthlyPI(loanAmount, mortgageRate, loanTermYears);
  const monthlyTax = (maxHomePrice * (propertyTaxRate / 100)) / 12;
  const monthlyPMI = calculateMonthlyPMI(loanAmount, maxHomePrice);
  const totalMonthlyHousing = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI;

  const frontEndDTI = grossMonthlyIncome > 0 ? (totalMonthlyHousing / grossMonthlyIncome) * 100 : 0;
  const backEndDTI = grossMonthlyIncome > 0 ? ((totalMonthlyHousing + monthlyDebtPayments) / grossMonthlyIncome) * 100 : 0;

  return {
    maxHomePrice,
    downPayment,
    loanAmount,
    monthlyPI,
    monthlyTax,
    monthlyInsurance,
    monthlyPMI,
    totalMonthlyHousing,
    frontEndDTI,
    backEndDTI,
    limitingFactor,
  };
}

/**
 * Show how paying off each individual debt improves house qualification.
 */
export function calculateDebtPayoffImpact(
  grossMonthlyIncome: number,
  debts: Account[],
  inputs: HouseInputs
): DebtPayoffImpact[] {
  const totalDebtPayments = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const baseline = calculateAffordability(grossMonthlyIncome, totalDebtPayments, inputs);

  return debts
    .filter((d) => d.minimumPayment > 0)
    .map((debt) => {
      const reducedPayments = totalDebtPayments - debt.minimumPayment;
      const improved = calculateAffordability(grossMonthlyIncome, reducedPayments, inputs);

      return {
        debtId: debt.id,
        debtName: debt.name,
        monthlyPayment: debt.minimumPayment,
        currentBackEndDTI: baseline.backEndDTI,
        newBackEndDTI: improved.backEndDTI,
        dtiDrop: baseline.backEndDTI - improved.backEndDTI,
        maxHomePriceIncrease: improved.maxHomePrice - baseline.maxHomePrice,
        newMaxHomePrice: improved.maxHomePrice,
      };
    })
    .sort((a, b) => b.maxHomePriceIncrease - a.maxHomePriceIncrease);
}
