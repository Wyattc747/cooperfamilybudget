import { useApp } from '../../common/contexts/AppContext.tsx';
import AccountCard from './AccountCard.tsx';
import type { Account } from '../../common/types/index.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';

interface InvestmentsListProps {
  onEdit: (account: Account) => void;
}

export default function InvestmentsList({ onEdit }: InvestmentsListProps) {
  const { state, dispatch } = useApp();
  const investments = state.accounts.filter((a) => a.type === 'investment');
  const totalInvestments = investments.reduce((sum, s) => sum + s.balance, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Investments</h3>
        {investments.length > 0 && (
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Total: {formatCurrency(totalInvestments)}</span>
        )}
      </div>
      {investments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No investments added</p>
      ) : (
        <div className="space-y-2">
          {investments.map((s) => (
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
