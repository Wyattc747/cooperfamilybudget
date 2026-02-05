import { useMemo } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import AccountCard from './AccountCard.tsx';
import type { Account, DebtCategory } from '../../common/types/index.ts';
import { DEBT_CATEGORY_LABELS } from '../../common/types/index.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';

interface DebtListProps {
  onEdit: (account: Account) => void;
}

// Display order for categories
const CATEGORY_ORDER: DebtCategory[] = [
  'credit_card', 'student_loan', 'auto_loan', 'personal_loan', 'medical', 'mortgage', 'other',
];

export default function DebtList({ onEdit }: DebtListProps) {
  const { state, dispatch } = useApp();
  const debts = state.accounts.filter((a) => a.type === 'debt');
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);

  const grouped = useMemo(() => {
    const groups = new Map<DebtCategory, Account[]>();
    for (const d of debts) {
      const cat = d.debtCategory ?? 'other';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(d);
    }
    // Return in display order, filtering empty categories
    return CATEGORY_ORDER
      .filter((cat) => groups.has(cat))
      .map((cat) => ({
        category: cat,
        label: DEBT_CATEGORY_LABELS[cat],
        accounts: groups.get(cat)!,
        total: groups.get(cat)!.reduce((s, a) => s + a.balance, 0),
      }));
  }, [debts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Debts</h3>
        {debts.length > 0 && (
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">Total: {formatCurrency(totalDebt)}</span>
        )}
      </div>
      {debts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No debts added</p>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.category}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {group.label}s
                </span>
                <span className="text-xs font-medium text-red-500 dark:text-red-400">
                  {formatCurrency(group.total)}
                </span>
              </div>
              <div className="space-y-2">
                {group.accounts.map((d) => (
                  <AccountCard
                    key={d.id}
                    account={d}
                    onEdit={onEdit}
                    onDelete={(id) => dispatch({ type: 'DELETE_ACCOUNT', payload: id })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
