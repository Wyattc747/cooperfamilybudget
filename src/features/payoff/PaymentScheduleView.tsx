import { useMemo } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
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

interface DueItem {
  name: string;
  dueDate: Date;
  dueDay: number;
  amount: number;
  type: 'debt' | 'expense';
}

interface PaycheckGroup {
  payDate: Date;
  items: (DueItem & { daysUntilDue: number })[];
  totalDue: number;
}

interface PaymentScheduleViewProps {
  compact?: boolean;
}

export default function PaymentScheduleView({ compact = false }: PaymentScheduleViewProps) {
  const { state } = useApp();
  const { income, accounts, expenses } = state;
  const debts = accounts.filter((a) => a.type === 'debt' && a.dueDay > 0);
  const dueExpenses = expenses.filter((e) => e.dueDay > 0);
  const hasDueItems = debts.length > 0 || dueExpenses.length > 0;
  const hasPayDate = !!income.nextPayDate;

  const monthsAhead = compact ? 2 : 3;

  // Build all due items with their next due dates
  const allDueItems = useMemo(() => {
    const items: DueItem[] = [];
    for (const debt of debts) {
      const dueDates = getNextDueDates(debt.dueDay, monthsAhead);
      for (const d of dueDates) {
        items.push({ name: debt.name, dueDate: d, dueDay: debt.dueDay, amount: debt.minimumPayment, type: 'debt' });
      }
    }
    for (const exp of dueExpenses) {
      const dueDates = getNextDueDates(exp.dueDay, monthsAhead);
      for (const d of dueDates) {
        items.push({ name: exp.name, dueDate: d, dueDay: exp.dueDay, amount: exp.amount, type: 'expense' });
      }
    }
    items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return items;
  }, [debts, dueExpenses, monthsAhead]);

  // Group due items by which paycheck they should come from
  const paycheckGroups = useMemo(() => {
    if (!hasPayDate || allDueItems.length === 0) return [];

    const payDates = getNextPayDates(income.nextPayDate, income.payFrequency, monthsAhead * 5);
    if (payDates.length === 0) return [];

    const groups: PaycheckGroup[] = [];

    // For each due item, find the most recent paycheck on or before the due date
    const assigned = new Map<number, (DueItem & { daysUntilDue: number })[]>(); // payDate index → items

    for (const item of allDueItems) {
      let bestIdx = -1;
      for (let i = 0; i < payDates.length; i++) {
        if (payDates[i] <= item.dueDate) {
          bestIdx = i;
        } else {
          break;
        }
      }

      // If no paycheck before the due date, assign to the first paycheck (pay early)
      const idx = bestIdx >= 0 ? bestIdx : 0;
      if (!assigned.has(idx)) assigned.set(idx, []);
      assigned.get(idx)!.push({
        ...item,
        daysUntilDue: daysBetween(payDates[idx], item.dueDate),
      });
    }

    // Build groups in paycheck order
    const sortedIndices = Array.from(assigned.keys()).sort((a, b) => a - b);
    for (const idx of sortedIndices) {
      const items = assigned.get(idx)!;
      items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      groups.push({
        payDate: payDates[idx],
        items,
        totalDue: items.reduce((s, i) => s + i.amount, 0),
      });
    }

    return compact ? groups.slice(0, 3) : groups;
  }, [hasPayDate, income.nextPayDate, income.payFrequency, allDueItems, monthsAhead, compact]);

  // Flat timeline for when no pay date is set (just show chronological due dates)
  const flatTimeline = useMemo(() => {
    if (hasPayDate) return [];
    return allDueItems.slice(0, compact ? 8 : 20);
  }, [hasPayDate, allDueItems, compact]);

  if (!hasDueItems && !hasPayDate) {
    if (compact) return null;
    return (
      <Card title="Payment Schedule">
        <p className="text-sm text-gray-500">
          Add due dates to your debts or expenses, and set your next pay date in Income settings.
        </p>
      </Card>
    );
  }

  const typeDot = (type: 'debt' | 'expense') =>
    type === 'debt' ? 'bg-red-500' : 'bg-amber-500';
  const typeText = (type: 'debt' | 'expense') =>
    type === 'debt' ? 'text-red-700' : 'text-amber-700';

  return (
    <Card title="Payment Schedule">
      {!hasPayDate && hasDueItems && (
        <p className="text-sm text-amber-600 mb-3">
          Set your next pay date and pay frequency in Income to see which paycheck to use for each bill.
        </p>
      )}

      {hasPayDate && !hasDueItems && (
        <p className="text-sm text-gray-500 mb-3">
          Add due dates to your debts and expenses to see payment alignment with your paycheck.
        </p>
      )}

      {/* Grouped by paycheck */}
      {paycheckGroups.length > 0 && (
        <div className="space-y-4">
          {paycheckGroups.map((group, gi) => {
            const isNext = gi === 0;
            return (
              <div key={gi} className={`rounded-lg border ${isNext ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
                {/* Paycheck header */}
                <div className={`flex items-center justify-between px-4 py-2 rounded-t-lg ${isNext ? 'bg-green-100' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className={`text-sm font-semibold ${isNext ? 'text-green-800' : 'text-gray-700'}`}>
                      {formatDateLong(group.payDate)} Paycheck
                    </span>
                    {isNext && (
                      <span className="text-[10px] font-medium bg-green-200 text-green-800 px-1.5 py-0.5 rounded">NEXT</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {formatCurrency(group.totalDue)} due
                  </span>
                </div>

                {/* Bills to pay from this paycheck */}
                <div className="divide-y divide-gray-100">
                  {group.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-3 px-4 py-2 text-sm">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${typeDot(item.type)}`} />
                      <span className={`font-medium ${typeText(item.type)}`}>
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        due {formatDate(item.dueDate)}
                        {item.daysUntilDue > 0 && ` (${item.daysUntilDue}d)`}
                        {item.daysUntilDue === 0 && ' (same day)'}
                        {item.daysUntilDue < 0 && ' (overdue)'}
                      </span>
                      <span className="text-gray-600 ml-auto font-medium">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flat timeline when no pay date set */}
      {flatTimeline.length > 0 && (
        <div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Debt</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Expense</span>
          </div>
          <div className="space-y-1.5">
            {flatTimeline.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 text-sm px-3 py-1.5 rounded-lg ${
                  item.type === 'debt' ? 'bg-red-50' : 'bg-amber-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${typeDot(item.type)}`} />
                <span className="text-gray-500 w-16 shrink-0">{formatDate(item.dueDate)}</span>
                <span className={`font-medium ${typeText(item.type)}`}>{item.name}</span>
                {item.amount > 0 && (
                  <span className="text-gray-500 ml-auto">{formatCurrency(item.amount)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      {paycheckGroups.length > 0 && !compact && (
        <div className="flex items-center gap-4 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Payday</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Debt Payment</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Expense</span>
        </div>
      )}
    </Card>
  );
}
