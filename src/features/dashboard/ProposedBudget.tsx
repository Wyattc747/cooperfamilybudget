import { useMemo, useState } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';
import { DEBT_CATEGORY_LABELS } from '../../common/types/index.ts';

interface BudgetLine {
  label: string;
  amount: number;
  pct: number;
  actual: number;
  color: string;
  why: string;
  group: 'needs' | 'debt' | 'goals';
}

export default function ProposedBudget() {
  const { state } = useApp();
  const { expenses, accounts } = state;
  const { monthlyNet, totalExpenses } = usePayoffBudget();
  const [showNeeds, setShowNeeds] = useState(false);

  const debts = accounts.filter((a) => a.type === 'debt');
  const ccDebts = debts.filter((d) => d.debtCategory === 'credit_card');
  const otherDebts = debts.filter((d) => d.debtCategory !== 'credit_card');
  const ccMinPayments = ccDebts.reduce((s, d) => s + d.minimumPayment, 0);
  const hasCCDebt = ccDebts.some((d) => d.balance > 0);
  const hasOtherDebt = otherDebts.some((d) => d.balance > 0);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return map;
  }, [expenses]);

  const budget = useMemo(() => {
    if (monthlyNet <= 0) return { needs: [] as BudgetLine[], strategic: [] as BudgetLine[], needsTotal: 0, strategicTotal: 0 };

    const needs: BudgetLine[] = [];
    const strategic: BudgetLine[] = [];

    // --- Necessities: use actual expenses or sensible defaults ---
    const needsMap: [string, string[], string, string][] = [
      ['Housing', ['Housing'], '#6366f1', '28% rule — lenders cap housing at this ratio of gross income'],
      ['Utilities', ['Utilities'], '#8b5cf6', 'Electric, water, internet — typically 5-10% of income'],
      ['Food', ['Food'], '#f59e0b', '10-15% of net income covers groceries and basic meals'],
      ['Transportation', ['Transportation'], '#f97316', 'Gas, insurance, maintenance — aim for under 10%'],
      ['Insurance & Health', ['Insurance', 'Healthcare'], '#ec4899', 'Health, dental, life — non-negotiable protection'],
    ];

    for (const [label, cats, color, why] of needsMap) {
      const actual = cats.reduce((s, c) => s + (expenseByCategory.get(c) ?? 0), 0);
      const amount = Math.max(actual, 1); // Use actual if entered, otherwise just a placeholder
      if (actual > 0) {
        needs.push({ label, amount, pct: (amount / monthlyNet) * 100, actual, color, why, group: 'needs' });
      }
    }

    // Other entered expense categories not in the above
    const coveredCategories = new Set(['Housing', 'Utilities', 'Food', 'Transportation', 'Insurance', 'Healthcare']);
    const otherExpenseActual = expenses
      .filter((e) => !coveredCategories.has(e.category))
      .reduce((s, e) => s + e.amount, 0);
    if (otherExpenseActual > 0) {
      needs.push({
        label: 'Other Expenses',
        amount: otherExpenseActual,
        pct: (otherExpenseActual / monthlyNet) * 100,
        actual: otherExpenseActual,
        color: '#9ca3af',
        why: 'Personal, education, entertainment — keep flexible spending in check',
        group: 'needs',
      });
    }

    const needsTotal = needs.reduce((s, l) => s + l.amount, 0);

    // --- Debt minimum payments ---
    const debtCatTotals = new Map<string, number>();
    for (const d of otherDebts) {
      if (d.minimumPayment <= 0) continue;
      const cat = DEBT_CATEGORY_LABELS[d.debtCategory] ?? 'Other';
      debtCatTotals.set(cat, (debtCatTotals.get(cat) ?? 0) + d.minimumPayment);
    }
    for (const [cat, amount] of debtCatTotals) {
      strategic.push({
        label: `${cat} Min Payment`,
        amount,
        pct: (amount / monthlyNet) * 100,
        actual: amount,
        color: '#fb923c',
        why: 'Minimum payments protect your credit score — never skip these',
        group: 'debt',
      });
    }

    // --- Strategic allocations with the remaining money ---
    const debtMins = Array.from(debtCatTotals.values()).reduce((s, v) => s + v, 0);
    const remaining = Math.max(0, monthlyNet - needsTotal - debtMins);

    if (hasCCDebt) {
      strategic.push({
        label: 'Credit Card Payoff',
        amount: ccMinPayments + remaining,
        pct: ((ccMinPayments + remaining) / monthlyNet) * 100,
        actual: ccMinPayments,
        color: '#ef4444',
        why: 'Credit cards charge 20-30% APR compounded daily — every dollar here saves the most interest of any option',
        group: 'debt',
      });
    } else if (hasOtherDebt) {
      const efAmount = remaining * 0.50;
      const debtExtra = remaining * 0.30;
      const retire = remaining * 0.10;
      const wants = remaining * 0.10;

      strategic.push({
        label: 'Emergency Fund',
        amount: efAmount,
        pct: (efAmount / monthlyNet) * 100,
        actual: 0,
        color: '#3b82f6',
        why: '3-6 months of expenses in savings prevents new debt when surprises happen — the #1 reason people go back into debt',
        group: 'goals',
      });
      strategic.push({
        label: 'Extra Debt Payments',
        amount: debtExtra,
        pct: (debtExtra / monthlyNet) * 100,
        actual: 0,
        color: '#f59e0b',
        why: 'Pay above minimums on highest-APR debt first (avalanche method) — mathematically saves the most',
        group: 'debt',
      });
      strategic.push({
        label: 'Retirement',
        amount: retire,
        pct: (retire / monthlyNet) * 100,
        actual: 0,
        color: '#10b981',
        why: 'At minimum, capture your employer 401k match — it\'s a 50-100% instant return on your money',
        group: 'goals',
      });
      strategic.push({
        label: 'Wants',
        amount: wants,
        pct: (wants / monthlyNet) * 100,
        actual: 0,
        color: '#6b7280',
        why: 'A small guilt-free budget prevents burnout — you\'re more likely to stick with the plan',
        group: 'goals',
      });
    } else {
      const save = remaining * 0.20;
      const invest = remaining * 0.30;
      const wants = remaining * 0.30;
      const goals = remaining * 0.20;

      strategic.push({
        label: 'Savings',
        amount: save,
        pct: (save / monthlyNet) * 100,
        actual: 0,
        color: '#3b82f6',
        why: 'High-yield savings for emergencies and short-term goals — keep 3-6 months expenses liquid',
        group: 'goals',
      });
      strategic.push({
        label: 'Investing',
        amount: invest,
        pct: (invest / monthlyNet) * 100,
        actual: 0,
        color: '#10b981',
        why: 'Index funds average ~10% annually — $500/mo becomes ~$1M in 30 years through compound growth',
        group: 'goals',
      });
      strategic.push({
        label: 'Wants',
        amount: wants,
        pct: (wants / monthlyNet) * 100,
        actual: 0,
        color: '#6b7280',
        why: 'Dining, entertainment, hobbies — enjoy your money while it grows elsewhere',
        group: 'goals',
      });
      strategic.push({
        label: 'Goals',
        amount: goals,
        pct: (goals / monthlyNet) * 100,
        actual: 0,
        color: '#8b5cf6',
        why: 'House down payment, vacation, giving — dedicated savings for what matters to you',
        group: 'goals',
      });
    }

    const strategicTotal = strategic.reduce((s, l) => s + l.amount, 0);
    return { needs, strategic, needsTotal, strategicTotal };
  }, [monthlyNet, expenseByCategory, expenses, hasCCDebt, hasOtherDebt, ccMinPayments, otherDebts]);

  if (monthlyNet <= 0) {
    return (
      <Card title="Proposed Budget">
        <p className="text-sm text-gray-400 text-center py-6">
          Add your income to see a proposed budget.
        </p>
      </Card>
    );
  }

  const allLines = [...budget.needs, ...budget.strategic];
  const phaseLabel = hasCCDebt ? 'Debt Attack' : hasOtherDebt ? 'Build & Pay' : 'Grow Wealth';
  const phaseColor = hasCCDebt ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : hasOtherDebt ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';

  return (
    <Card title="Proposed Budget">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatCurrency(monthlyNet)}<span className="text-gray-400 dark:text-gray-500">/mo net</span>
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${phaseColor}`}>
          {phaseLabel}
        </span>
      </div>

      {/* Stacked bar */}
      <div className="flex rounded-md overflow-hidden h-5 mb-3">
        {allLines.map((line) => {
          const pct = (line.amount / monthlyNet) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={line.label}
              className="flex items-center justify-center text-white text-[8px] font-bold"
              style={{ width: `${pct}%`, backgroundColor: line.color, minWidth: pct > 2 ? undefined : 3 }}
              title={`${line.label}: ${formatCurrency(line.amount)}`}
            >
              {pct >= 10 && `${pct.toFixed(0)}%`}
            </div>
          );
        })}
      </div>

      {/* Necessities (collapsible) */}
      {budget.needs.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setShowNeeds(!showNeeds)}
            className="flex items-center justify-between w-full text-left py-1.5 group"
          >
            <div className="flex items-center gap-1.5">
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform ${showNeeds ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Necessities</span>
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {formatCurrency(budget.needsTotal)}
              <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">{((budget.needsTotal / monthlyNet) * 100).toFixed(0)}%</span>
            </span>
          </button>
          {showNeeds && (
            <div className="space-y-1 ml-4 mb-2">
              {budget.needs.map((line) => (
                <div key={line.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: line.color }} />
                    <span className="text-gray-600 dark:text-gray-400">{line.label}</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 tabular-nums">{formatCurrency(line.amount)}</span>
                </div>
              ))}
              <p className="text-[10px] text-gray-400 mt-1">
                Based on your entered expenses. Aim to keep total necessities under 50% of net income.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Strategic allocations */}
      <div className="space-y-2">
        {budget.strategic.map((line) => (
          <div key={line.label} className="group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: line.color }} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{line.label}</span>
                <span className="text-[10px] text-gray-400">{line.pct.toFixed(0)}%</span>
              </div>
              <span className="text-sm font-semibold dark:text-gray-200 tabular-nums">{formatCurrency(line.amount)}</span>
            </div>
            <p className="text-[11px] text-gray-400 ml-4 leading-tight">{line.why}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <span>Spending: {formatCurrency(totalExpenses)}/mo</span>
        <span>Remaining: {formatCurrency(Math.max(0, monthlyNet - totalExpenses))}/mo</span>
      </div>
    </Card>
  );
}
