// Filing status types
export type FilingStatus = 'single' | 'married_jointly' | 'married_separately' | 'head_of_household';

// Pay frequency
export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 Weeks',
  semimonthly: '1st & 15th',
  monthly: 'Monthly',
};

// Income state
export interface IncomeState {
  baseSalary: number;
  monthlyCommission: number;
  monthlyTaxFree: number;
  monthlyBusinessIncome: number;
  payStartDate: string; // ISO date string, empty if already receiving pay
  payFrequency: PayFrequency;
  nextPayDate: string; // ISO date of next paycheck
  dependents: number;
  stateTaxRate: number;
  filingStatus: FilingStatus;
}

// Tax bracket
export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

// Tax breakdown result
export interface TaxBreakdownResult {
  brackets: { bracket: TaxBracket; taxable: number; tax: number }[];
  totalFederalTax: number;
  stateTax: number;
  childTaxCredit: number;
  totalTax: number;
  effectiveRate: number;
  grossIncome: number;
  netIncome: number;
  // Split attribution
  baseTax: number;
  commissionTax: number;
  baseStateTax: number;
  commissionStateTax: number;
}

// Filing comparison row
export interface FilingComparisonRow {
  filingStatus: FilingStatus;
  label: string;
  federalTax: number;
  stateTax: number;
  childTaxCredit: number;
  totalTax: number;
  netIncome: number;
  effectiveRate: number;
  isBest: boolean;
}

// Expense
export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDay: number; // day of month payment is due (1-31), 0 = not set
}

// Compounding type for debt accounts
export type CompoundingType = 'daily_compound' | 'daily_simple' | 'monthly';

// Debt category
export type DebtCategory = 'credit_card' | 'student_loan' | 'auto_loan' | 'personal_loan' | 'medical' | 'mortgage' | 'other';

export const DEBT_CATEGORY_LABELS: Record<DebtCategory, string> = {
  credit_card: 'Credit Card',
  student_loan: 'Student Loan',
  auto_loan: 'Auto Loan',
  personal_loan: 'Personal Loan',
  medical: 'Medical',
  mortgage: 'Mortgage',
  other: 'Other',
};

export const DEBT_CATEGORY_COLORS: Record<DebtCategory, string> = {
  credit_card: 'bg-red-100 text-red-700',
  student_loan: 'bg-blue-100 text-blue-700',
  auto_loan: 'bg-orange-100 text-orange-700',
  personal_loan: 'bg-purple-100 text-purple-700',
  medical: 'bg-pink-100 text-pink-700',
  mortgage: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-700',
};

/** Default compounding type for each debt category */
export const DEBT_CATEGORY_COMPOUNDING: Record<DebtCategory, CompoundingType> = {
  credit_card: 'daily_compound',
  student_loan: 'daily_simple',
  auto_loan: 'monthly',
  personal_loan: 'monthly',
  medical: 'monthly',
  mortgage: 'monthly',
  other: 'monthly',
};

// Account type
export type AccountType = 'debt' | 'cash' | 'investment';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  debt: 'Debt',
  cash: 'Cash Account',
  investment: 'Investment',
};

// Account (debt, cash, or investment)
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  interestRate: number; // APR as percentage (e.g. 5.5 for 5.5%)
  minimumPayment: number; // monthly minimum (debts only)
  compoundingType: CompoundingType;
  debtCategory: DebtCategory;
  dueDay: number; // day of month payment is due (1-31), 0 = not set
  creditLimit: number; // total credit limit (credit cards only)
}

// Income change log entry
export interface IncomeChangeEntry {
  id: string;
  date: string; // ISO date
  description: string;
  field: 'baseSalary' | 'monthlyCommission' | 'monthlyBusinessIncome' | 'monthlyTaxFree';
  previousAmount: number;
  newAmount: number;
}

export const INCOME_FIELD_LABELS: Record<IncomeChangeEntry['field'], string> = {
  baseSalary: 'Base Salary',
  monthlyCommission: 'Monthly Commission',
  monthlyBusinessIncome: 'Business Income',
  monthlyTaxFree: 'Tax-Free Income',
};

// Unexpected / one-time expense
export interface UnexpectedExpense {
  id: string;
  date: string; // ISO date
  name: string;
  amount: number;
  category: string;
  note: string;
}

// Asset (car, equipment, etc.)
export interface Asset {
  id: string;
  name: string;
  value: number;
  category: string;
}

export const ASSET_CATEGORIES = [
  'Vehicle',
  'Electronics',
  'Real Estate',
  'Equipment',
  'Jewelry',
  'Furniture',
  'Collectibles',
  'Other',
] as const;

export const COMPOUNDING_LABELS: Record<CompoundingType, string> = {
  daily_compound: 'Daily Compound',
  daily_simple: 'Daily Simple',
  monthly: 'Monthly',
};

export const COMPOUNDING_DESCRIPTIONS: Record<CompoundingType, string> = {
  daily_compound: 'Credit Cards — interest compounds daily',
  daily_simple: 'Student Loans — simple daily interest',
  monthly: 'Auto/Personal Loans — monthly interest',
};

// Payoff settings
export interface PayoffSettings {
  monthlyBudget: number;
  isManualOverride: boolean;
}

// Payoff schedule entry
export interface PayoffScheduleEntry {
  month: number;
  date: string;
  payments: { accountId: string; accountName: string; payment: number; remaining: number }[];
  totalRemaining: number;
  totalInterest: number;
}

// Payoff result
export interface PayoffResult {
  strategy: 'avalanche' | 'snowball';
  schedule: PayoffScheduleEntry[];
  totalMonths: number;
  totalInterestPaid: number;
  totalPaid: number;
}

// App state
export interface AppState {
  income: IncomeState;
  expenses: Expense[];
  accounts: Account[];
  assets: Asset[];
  incomeHistory: IncomeChangeEntry[];
  unexpectedExpenses: UnexpectedExpense[];
  payoffSettings: PayoffSettings;
}

// Action types
export type AppAction =
  | { type: 'SET_INCOME'; payload: Partial<IncomeState> }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'EDIT_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'EDIT_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'EDIT_ASSET'; payload: Asset }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'ADD_INCOME_CHANGE'; payload: IncomeChangeEntry }
  | { type: 'DELETE_INCOME_CHANGE'; payload: string }
  | { type: 'ADD_UNEXPECTED_EXPENSE'; payload: UnexpectedExpense }
  | { type: 'EDIT_UNEXPECTED_EXPENSE'; payload: UnexpectedExpense }
  | { type: 'DELETE_UNEXPECTED_EXPENSE'; payload: string }
  | { type: 'SET_PAYOFF_SETTINGS'; payload: Partial<PayoffSettings> }
  | { type: 'LOAD_STATE'; payload: AppState };

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Transportation',
  'Food',
  'Utilities',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Personal',
  'Education',
  'Other',
] as const;

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  married_jointly: 'Married Filing Jointly',
  married_separately: 'Married Filing Separately',
  head_of_household: 'Head of Household',
};
