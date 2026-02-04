import type { FilingStatus, TaxBracket, TaxBreakdownResult, FilingComparisonRow } from '../types/index.ts';
import { FILING_STATUS_LABELS } from '../types/index.ts';

// 2024 Federal tax brackets
const FEDERAL_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married_jointly: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  married_separately: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
};

// 2024 Standard deductions
const STANDARD_DEDUCTIONS: Record<FilingStatus, number> = {
  single: 14600,
  married_jointly: 29200,
  married_separately: 14600,
  head_of_household: 21900,
};

const CHILD_TAX_CREDIT_PER_DEPENDENT = 2000;

function calculateFederalTax(taxableIncome: number, brackets: TaxBracket[]) {
  const result: { bracket: TaxBracket; taxable: number; tax: number }[] = [];
  let remaining = taxableIncome;

  for (const bracket of brackets) {
    if (remaining <= 0) {
      result.push({ bracket, taxable: 0, tax: 0 });
      continue;
    }
    const bracketWidth = bracket.max - bracket.min;
    const taxable = Math.min(remaining, bracketWidth);
    result.push({ bracket, taxable, tax: taxable * bracket.rate });
    remaining -= taxable;
  }

  return result;
}

export function calculateTaxBreakdown(
  baseSalary: number,
  monthlyCommission: number,
  dependents: number,
  stateTaxRate: number,
  filingStatus: FilingStatus,
  annualBusinessIncome = 0
): TaxBreakdownResult {
  const grossIncome = baseSalary + monthlyCommission * 12 + annualBusinessIncome;
  const standardDeduction = STANDARD_DEDUCTIONS[filingStatus];
  const taxableIncome = Math.max(0, grossIncome - standardDeduction);
  const brackets = FEDERAL_BRACKETS[filingStatus];

  const bracketBreakdown = calculateFederalTax(taxableIncome, brackets);
  const totalFederalTax = bracketBreakdown.reduce((sum, b) => sum + b.tax, 0);

  // State tax is flat percentage on gross income
  const stateTax = grossIncome * (stateTaxRate / 100);

  // Child tax credit
  const childTaxCredit = Math.min(dependents * CHILD_TAX_CREDIT_PER_DEPENDENT, totalFederalTax);

  const totalTax = totalFederalTax - childTaxCredit + stateTax;
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
  const netIncome = grossIncome - totalTax;

  // Tax attribution: base salary vs commission
  const baseTaxableIncome = Math.max(0, baseSalary - standardDeduction);
  const baseBracketBreakdown = calculateFederalTax(baseTaxableIncome, brackets);
  const baseTax = baseBracketBreakdown.reduce((sum, b) => sum + b.tax, 0);
  const commissionTax = totalFederalTax - baseTax;

  const baseStateTax = baseSalary * (stateTaxRate / 100);
  const commissionStateTax = (monthlyCommission * 12) * (stateTaxRate / 100);

  return {
    brackets: bracketBreakdown,
    totalFederalTax,
    stateTax,
    childTaxCredit,
    totalTax,
    effectiveRate,
    grossIncome,
    netIncome,
    baseTax,
    commissionTax,
    baseStateTax,
    commissionStateTax,
  };
}

export function compareFilingStatuses(
  baseSalary: number,
  monthlyCommission: number,
  dependents: number,
  stateTaxRate: number,
  annualBusinessIncome = 0
): FilingComparisonRow[] {
  const statuses: FilingStatus[] = ['single', 'married_jointly', 'married_separately', 'head_of_household'];

  const rows = statuses.map((fs) => {
    const result = calculateTaxBreakdown(baseSalary, monthlyCommission, dependents, stateTaxRate, fs, annualBusinessIncome);
    return {
      filingStatus: fs,
      label: FILING_STATUS_LABELS[fs],
      federalTax: result.totalFederalTax,
      stateTax: result.stateTax,
      childTaxCredit: result.childTaxCredit,
      totalTax: result.totalTax,
      netIncome: result.netIncome,
      effectiveRate: result.effectiveRate,
      isBest: false,
    };
  });

  // Mark the best (lowest total tax)
  const minTax = Math.min(...rows.map((r) => r.totalTax));
  for (const row of rows) {
    row.isBest = row.totalTax === minTax;
  }

  return rows;
}
