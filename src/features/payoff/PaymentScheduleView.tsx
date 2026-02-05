import { useMemo } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import Card from '../../common/components/Card.tsx';
import { formatCurrency } from '../../common/utils/formatters.ts';
import type { PayFrequency } from '../../common/types/index.ts';

function getNextPayDates(nextPayDate: string, frequency: PayFrequency, count: number): Date[] {
  if (!nextPayDate) return [];
  const dates: Date[] = [];
  let current = new Date(nextPayDate + 'T00:00:00');

  for (let i = 0; i < count; i++) {
    dates.push(new Date(current));
    switch (frequency) {
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'biweekly':
        current.setDate(current.getDate() + 14);
        break;
      case 'semimonthly':
        if (current.getDate() <= 1) {
          current.setDate(15);
        } else if (current.getDate() <= 15) {
          current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        } else {
          current = new Date(current.getFullYear(), current.getMonth() + 1, 15);
        }
        break;
      case 'monthly':
        current = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate());
        break;
    }
  }
  return dates;
}

function getNextDueDates(dueDay: number, count: number): Date[] {
  if (dueDay <= 0) return [];
  const dates: Date[] = [];
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();

  if (now.getDate() > dueDay) {
    month++;
    if (month > 11) { month = 0; year++; }
  }

  for (let i = 0; i < count; i++) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(dueDay, lastDay);
    dates.push(new Date(year, month, day));
    month++;
    if (month > 11) { month = 0; year++; }
  }
  return dates;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function paycheckAmount(monthlyNet: number, frequency: PayFrequency): number {
  switch (frequency) {
    case 'weekly': return monthlyNet * 12 / 52;
    case 'biweekly': return monthlyNet * 12 / 26;
    case 'semimonthly': return monthlyNet / 2;
    case 'monthly': return monthlyNet;
  }
}

interface DueItem {
  name: string;
  dueDate: Date;
  dueDay: number;
  amount: number;
  type: 'debt' | 'expense';
}

interface SimulatedItem extends DueItem {
  daysUntilDue: number;
  balanceAfter: number;
  insufficientFunds: boolean;
}

interface PaycheckGroup {
  payDate: Date;
  paycheckDeposit: number;
  balanceBefore: number; // cash before paycheck deposit
  balanceAfterDeposit: number; // cash after deposit, before payments
  expenseItems: SimulatedItem[];
  debtItems: SimulatedItem[];
  totalExpenses: number;
  totalDebt: number;
  balanceAfter: number; // cash after all payments
}

interface PaymentScheduleViewProps {
  compact?: boolean;
  filter?: 'debt' | 'expense' | 'all';
  title?: string;
}

export default function PaymentScheduleView({ compact = false, filter = 'all', title }: PaymentScheduleViewProps) {
  const { state } = useApp();
  const { income, accounts, expenses } = state;
  const { monthlyNet } = usePayoffBudget();

  const debts = accounts.filter((a) => a.type === 'debt' && a.dueDay > 0);
  const dueExpenses = expenses.filter((e) => e.dueDay > 0);
  const cashAccounts = accounts.filter((a) => a.type === 'cash');
  const startingCash = cashAccounts.reduce((sum, s) => sum + s.balance, 0);
  const hasPayDate = !!income.nextPayDate;

  // Items to display based on filter
  const showDebts = filter !== 'expense' ? debts : [];
  const showExpenses = filter !== 'debt' ? dueExpenses : [];
  const hasDueItems = showDebts.length > 0 || showExpenses.length > 0;

  // Always simulate with ALL items so cash balance is accurate
  const allDebts = debts;
  const allExpenses = dueExpenses;

  const monthsAhead = compact ? 2 : 3;
  const perPaycheck = paycheckAmount(monthlyNet, income.payFrequency);

  const cardTitle = title ?? (
    filter === 'debt' ? 'Debt Payment Schedule' :
    filter === 'expense' ? 'Expense Payment Schedule' :
    'Payment Schedule'
  );

  // Build ALL due items (for cash simulation)
  const allDueItems = useMemo(() => {
    const items: DueItem[] = [];
    for (const debt of allDebts) {
      const dueDates = getNextDueDates(debt.dueDay, monthsAhead);
      for (const d of dueDates) {
        items.push({ name: debt.name, dueDate: d, dueDay: debt.dueDay, amount: debt.minimumPayment, type: 'debt' });
      }
    }
    for (const exp of allExpenses) {
      const dueDates = getNextDueDates(exp.dueDay, monthsAhead);
      for (const d of dueDates) {
        items.push({ name: exp.name, dueDate: d, dueDay: exp.dueDay, amount: exp.amount, type: 'expense' });
      }
    }
    items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return items;
  }, [allDebts, allExpenses, monthsAhead]);

  // Set of names to show (based on filter)
  const showDebtNames = useMemo(() => new Set(showDebts.map(d => d.name)), [showDebts]);
  const showExpenseNames = useMemo(() => new Set(showExpenses.map(e => e.name)), [showExpenses]);

  function shouldShowItem(item: DueItem): boolean {
    if (filter === 'all') return true;
    if (item.type === 'debt') return showDebtNames.has(item.name);
    return showExpenseNames.has(item.name);
  }

  // Simulate cash flow grouped by paycheck
  const paycheckGroups = useMemo(() => {
    if (!hasPayDate || allDueItems.length === 0) return [];

    const payDates = getNextPayDates(income.nextPayDate, income.payFrequency, monthsAhead * 5);
    if (payDates.length === 0) return [];

    // Assign each due item to a paycheck
    const assigned = new Map<number, DueItem[]>();
    for (const item of allDueItems) {
      let bestIdx = -1;
      for (let i = 0; i < payDates.length; i++) {
        if (payDates[i] <= item.dueDate) {
          bestIdx = i;
        } else {
          break;
        }
      }
      const idx = bestIdx >= 0 ? bestIdx : 0;
      if (!assigned.has(idx)) assigned.set(idx, []);
      assigned.get(idx)!.push(item);
    }

    // Simulate cash balance
    let cash = startingCash;
    const groups: PaycheckGroup[] = [];
    const sortedIndices = Array.from(assigned.keys()).sort((a, b) => a - b);

    for (const idx of sortedIndices) {
      const items = assigned.get(idx)!;
      items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

      const balanceBefore = cash;
      cash += perPaycheck;
      const balanceAfterDeposit = cash;

      const expenseItems: SimulatedItem[] = [];
      const debtItems: SimulatedItem[] = [];

      for (const item of items) {
        cash -= item.amount;
        const simulated: SimulatedItem = {
          ...item,
          daysUntilDue: daysBetween(payDates[idx], item.dueDate),
          balanceAfter: cash,
          insufficientFunds: cash < 0,
        };
        if (item.type === 'expense') {
          expenseItems.push(simulated);
        } else {
          debtItems.push(simulated);
        }
      }

      groups.push({
        payDate: payDates[idx],
        paycheckDeposit: perPaycheck,
        balanceBefore,
        balanceAfterDeposit,
        expenseItems,
        debtItems,
        totalExpenses: expenseItems.reduce((s, i) => s + i.amount, 0),
        totalDebt: debtItems.reduce((s, i) => s + i.amount, 0),
        balanceAfter: cash,
      });
    }

    return compact ? groups.slice(0, 3) : groups;
  }, [hasPayDate, income.nextPayDate, income.payFrequency, allDueItems, monthsAhead, startingCash, perPaycheck, compact]);

  // Flat timeline when no pay date set
  const flatTimeline = useMemo(() => {
    if (hasPayDate) return [];
    return allDueItems.filter(shouldShowItem).slice(0, compact ? 8 : 20);
  }, [hasPayDate, allDueItems, compact, filter]);

  if (!hasDueItems && !hasPayDate) {
    if (compact) return null;
    const emptyMsg = filter === 'debt'
      ? 'Add due dates to your debts in the Accounts page to see the payment schedule.'
      : filter === 'expense'
      ? 'Add due dates to your expenses in the Expenses page to see the payment schedule.'
      : 'Add due dates to your debts or expenses, and set your next pay date in Income settings.';
    return (
      <Card title={cardTitle}>
        <p className="text-sm text-gray-500">{emptyMsg}</p>
      </Card>
    );
  }

  if (!hasDueItems) {
    if (compact) return null;
    const emptyMsg = filter === 'debt'
      ? 'No debts have due dates set. Add due dates in the Accounts page.'
      : filter === 'expense'
      ? 'No expenses have due dates set. Add due dates in the Expenses page.'
      : 'No items have due dates set.';
    return (
      <Card title={cardTitle}>
        <p className="text-sm text-gray-500">{emptyMsg}</p>
      </Card>
    );
  }

  const balanceColor = (bal: number) =>
    bal < 0 ? 'text-red-600 dark:text-red-400' : bal < 200 ? 'text-amber-600 dark:text-amber-400' : 'text-green-700 dark:text-green-400';

  function renderItem(item: SimulatedItem) {
    const isDot = item.type === 'debt' ? 'bg-red-500' : 'bg-amber-500';
    const isText = item.type === 'debt' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400';
    return (
      <div
        key={`${item.name}-${item.dueDate.getTime()}`}
        className={`flex items-center gap-3 px-4 py-1.5 text-sm ${item.insufficientFunds ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${isDot}`} />
        <span className={`font-medium ${isText}`}>{item.name}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          due {formatDate(item.dueDate)}
          {item.daysUntilDue > 0 && ` (${item.daysUntilDue}d)`}
          {item.daysUntilDue === 0 && ' (same day)'}
        </span>
        {item.insufficientFunds && (
          <span className="text-[10px] font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">
            INSUFFICIENT
          </span>
        )}
        <span className="text-gray-600 dark:text-gray-300 ml-auto font-medium tabular-nums">
          {formatCurrency(item.amount)}
        </span>
      </div>
    );
  }

  return (
    <Card title={cardTitle}>
      {/* Starting balance summary */}
      {!compact && hasPayDate && (
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <span className="text-blue-500 dark:text-blue-400">Starting Cash </span>
            <span className="font-semibold text-blue-700 dark:text-blue-300">{formatCurrency(startingCash)}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30">
            <span className="text-green-500 dark:text-green-400">Per Paycheck </span>
            <span className="font-semibold text-green-700 dark:text-green-300">{formatCurrency(perPaycheck)}</span>
          </div>
        </div>
      )}

      {!hasPayDate && hasDueItems && (
        <p className="text-sm text-amber-600 mb-3">
          Set your next pay date and pay frequency in Income to see cash flow simulation.
        </p>
      )}

      {/* Grouped by paycheck with cash simulation */}
      {paycheckGroups.length > 0 && (
        <div className="space-y-4">
          {paycheckGroups.map((group, gi) => {
            const isNext = gi === 0;
            const hasInsufficient = group.balanceAfter < 0;

            // Filter items for display
            const visibleExpenses = group.expenseItems.filter(shouldShowItem);
            const visibleDebts = group.debtItems.filter(shouldShowItem);
            if (visibleExpenses.length === 0 && visibleDebts.length === 0) return null;

            return (
              <div key={gi} className={`rounded-lg border ${hasInsufficient ? 'border-red-300 dark:border-red-800' : isNext ? 'border-green-300 dark:border-green-800' : 'border-gray-200 dark:border-gray-700'}`}>
                {/* Paycheck header */}
                <div className={`flex items-center justify-between px-4 py-2 rounded-t-lg ${hasInsufficient ? 'bg-red-50 dark:bg-red-900/20' : isNext ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${hasInsufficient ? 'bg-red-500' : 'bg-green-500'}`} />
                    <span className={`text-sm font-semibold ${hasInsufficient ? 'text-red-800 dark:text-red-300' : isNext ? 'text-green-800 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {formatDateLong(group.payDate)} Paycheck
                    </span>
                    {isNext && !hasInsufficient && (
                      <span className="text-[10px] font-medium bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300 px-1.5 py-0.5 rounded">NEXT</span>
                    )}
                    {hasInsufficient && (
                      <span className="text-[10px] font-medium bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded">SHORTFALL</span>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-green-600 font-medium">+{formatCurrency(group.paycheckDeposit)}</span>
                    {!compact && (
                      <span className={`ml-2 font-semibold ${balanceColor(group.balanceAfter)}`}>
                        bal {formatCurrency(group.balanceAfter)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {/* Expense items */}
                  {visibleExpenses.length > 0 && (
                    <>
                      {filter === 'all' && (
                        <div className="px-4 py-1 bg-amber-50/50 dark:bg-amber-900/10">
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Bills & Expenses</span>
                        </div>
                      )}
                      {visibleExpenses.map(renderItem)}
                    </>
                  )}

                  {/* Debt items */}
                  {visibleDebts.length > 0 && (
                    <>
                      {filter === 'all' && (
                        <div className="px-4 py-1 bg-red-50/50 dark:bg-red-900/10">
                          <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Debt Payments</span>
                        </div>
                      )}
                      {visibleDebts.map(renderItem)}
                    </>
                  )}

                  {/* Balance footer */}
                  {!compact && (
                    <div className="flex items-center justify-between px-4 py-1.5 text-xs bg-gray-50/50 dark:bg-gray-800/50">
                      <span className="text-gray-400">
                        {filter === 'all'
                          ? `${formatCurrency(group.totalExpenses + group.totalDebt)} total payments`
                          : filter === 'expense'
                          ? `${formatCurrency(group.totalExpenses)} in expenses`
                          : `${formatCurrency(group.totalDebt)} in debt payments`}
                      </span>
                      <span className={`font-semibold ${balanceColor(group.balanceAfter)}`}>
                        Remaining: {formatCurrency(group.balanceAfter)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flat timeline when no pay date set */}
      {flatTimeline.length > 0 && (
        <div>
          {filter === 'all' && (
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Debt</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Expense</span>
            </div>
          )}
          <div className="space-y-1.5">
            {flatTimeline.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 text-sm px-3 py-1.5 rounded-lg ${
                  item.type === 'debt' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'debt' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <span className="text-gray-500 dark:text-gray-400 w-16 shrink-0">{formatDate(item.dueDate)}</span>
                <span className={`font-medium ${item.type === 'debt' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>{item.name}</span>
                {item.amount > 0 && (
                  <span className="text-gray-500 dark:text-gray-400 ml-auto">{formatCurrency(item.amount)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      {paycheckGroups.length > 0 && !compact && (
        <div className="flex items-center gap-4 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Payday</span>
          {(filter === 'all' || filter === 'debt') && (
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Debt</span>
          )}
          {(filter === 'all' || filter === 'expense') && (
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Expense</span>
          )}
          <span className="ml-auto text-gray-300">Cash from cash accounts</span>
        </div>
      )}
    </Card>
  );
}
