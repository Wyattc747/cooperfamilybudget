import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { AppState, AppAction } from '../types/index.ts';
import { loadState } from '../utils/localStorage.ts';
import { useSyncLocalStorage } from '../hooks/useLocalStorage.ts';

const defaultState: AppState = {
  income: {
    baseSalary: 0,
    monthlyCommission: 0,
    monthlyTaxFree: 0,
    monthlyBusinessIncome: 0,
    payStartDate: '',
    payFrequency: 'biweekly',
    nextPayDate: '',
    dependents: 0,
    stateTaxRate: 0,
    filingStatus: 'single',
  },
  expenses: [],
  accounts: [],
  assets: [],
  incomeHistory: [],
  unexpectedExpenses: [],
  payoffSettings: {
    monthlyBudget: 0,
    isManualOverride: false,
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_INCOME':
      return { ...state, income: { ...state.income, ...action.payload } };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'EDIT_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload),
      };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] };
    case 'EDIT_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.payload),
      };
    case 'ADD_ASSET':
      return { ...state, assets: [...state.assets, action.payload] };
    case 'EDIT_ASSET':
      return {
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case 'DELETE_ASSET':
      return {
        ...state,
        assets: state.assets.filter((a) => a.id !== action.payload),
      };
    case 'ADD_INCOME_CHANGE':
      return { ...state, incomeHistory: [action.payload, ...state.incomeHistory] };
    case 'DELETE_INCOME_CHANGE':
      return {
        ...state,
        incomeHistory: state.incomeHistory.filter((e) => e.id !== action.payload),
      };
    case 'ADD_UNEXPECTED_EXPENSE':
      return { ...state, unexpectedExpenses: [action.payload, ...state.unexpectedExpenses] };
    case 'EDIT_UNEXPECTED_EXPENSE':
      return {
        ...state,
        unexpectedExpenses: state.unexpectedExpenses.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_UNEXPECTED_EXPENSE':
      return {
        ...state,
        unexpectedExpenses: state.unexpectedExpenses.filter((e) => e.id !== action.payload),
      };
    case 'SET_PAYOFF_SETTINGS':
      return {
        ...state,
        payoffSettings: { ...state.payoffSettings, ...action.payload },
      };
    case 'LOAD_STATE':
      return action.payload;
  }
}

function inferDebtCategory(a: { compoundingType?: string; name?: string }): string {
  // Try to infer from compounding type
  if (a.compoundingType === 'daily_compound') return 'credit_card';
  if (a.compoundingType === 'daily_simple') return 'student_loan';
  // Try to infer from name
  const n = (a.name ?? '').toLowerCase();
  if (n.includes('credit') || n.includes('card')) return 'credit_card';
  if (n.includes('student') || n.includes('loan') && n.includes('school')) return 'student_loan';
  if (n.includes('auto') || n.includes('car') || n.includes('vehicle')) return 'auto_loan';
  if (n.includes('personal')) return 'personal_loan';
  if (n.includes('medical') || n.includes('hospital')) return 'medical';
  if (n.includes('mortgage') || n.includes('home')) return 'mortgage';
  return 'other';
}

function migrateState(state: AppState): AppState {
  const accounts = state.accounts.map((a) => ({
    ...a,
    // Migrate legacy 'savings' type to 'cash'
    type: (a.type as string) === 'savings' ? 'cash' as const : a.type,
    compoundingType: a.compoundingType ?? 'monthly',
    dueDay: a.dueDay ?? 0,
    debtCategory: a.debtCategory ?? (a.type === 'debt' ? inferDebtCategory(a) : 'other'),
    creditLimit: a.creditLimit ?? 0,
  }));
  const income = {
    ...state.income,
    monthlyBusinessIncome: state.income.monthlyBusinessIncome ?? 0,
    payStartDate: state.income.payStartDate ?? '',
    payFrequency: state.income.payFrequency ?? 'biweekly',
    nextPayDate: state.income.nextPayDate ?? '',
  };
  const assets = state.assets ?? [];
  const incomeHistory = state.incomeHistory ?? [];
  const unexpectedExpenses = state.unexpectedExpenses ?? [];
  const expenses = state.expenses.map((e) => ({
    ...e,
    dueDay: e.dueDay ?? 0,
  }));
  return { ...state, accounts, income, assets, incomeHistory, unexpectedExpenses, expenses };
}

function initState(): AppState {
  const loaded = loadState();
  if (loaded) return migrateState(loaded);
  return defaultState;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, initState);
  useSyncLocalStorage(state);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
