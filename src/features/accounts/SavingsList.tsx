import { useApp } from '../../common/contexts/AppContext.tsx';
import AccountCard from './AccountCard.tsx';
import type { Account } from '../../common/types/index.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';

interface SavingsListProps {
  onEdit: (account: Account) => void;
}

export default function SavingsList({ onEdit }: SavingsListProps) {
  const { state, dispatch } = useApp();
  const savings = state.accounts.filter((a) => a.type === 'savings');
  const totalSavings = savings.reduce((sum, s) => sum + s.balance, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Savings</h3>
        {savings.length > 0 && (
          <span className="text-sm font-semibold text-green-600">Total: {formatCurrency(totalSavings)}</span>
        )}
      </div>
      {savings.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No savings added</p>
      ) : (
        <div className="space-y-2">
          {savings.map((s) => (
            <AccountCard
              key={s.id}
              account={s}
              onEdit={onEdit}
              onDelete={(id) => dispatch({ type: 'DELETE_ACCOUNT', payload: id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
