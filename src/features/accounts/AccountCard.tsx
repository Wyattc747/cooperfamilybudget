import type { Account } from '../../common/types/index.ts';
import { COMPOUNDING_LABELS, DEBT_CATEGORY_LABELS, DEBT_CATEGORY_COLORS } from '../../common/types/index.ts';
import { formatCurrency, formatPercent } from '../../common/utils/formatters.ts';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

function ordinalSuffix(n: number): string {
  if (n === 1 || n === 21 || n === 31) return 'st';
  if (n === 2 || n === 22) return 'nd';
  if (n === 3 || n === 23) return 'rd';
  return 'th';
}

export default function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const categoryLabel = account.type === 'debt' && account.debtCategory
    ? DEBT_CATEGORY_LABELS[account.debtCategory]
    : account.type;
  const categoryColor = account.type === 'debt' && account.debtCategory
    ? DEBT_CATEGORY_COLORS[account.debtCategory]
    : account.type === 'debt' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';

  return (
    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{account.name}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColor}`}>
            {categoryLabel}
          </span>
        </div>
        <div className="flex gap-3 text-xs text-gray-500 mt-1">
          <span>APR: {formatPercent(account.interestRate)}</span>
          {account.type === 'debt' && account.minimumPayment > 0 && (
            <span>Min: {formatCurrency(account.minimumPayment)}/mo</span>
          )}
          {account.type === 'debt' && account.compoundingType && account.compoundingType !== 'monthly' && (
            <span className="text-blue-500">{COMPOUNDING_LABELS[account.compoundingType]}</span>
          )}
          {account.type === 'debt' && account.dueDay > 0 && (
            <span className="text-purple-500">Due: {account.dueDay}{ordinalSuffix(account.dueDay)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-semibold text-sm ${account.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(account.balance)}
        </span>
        <button
          onClick={() => onEdit(account)}
          className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(account.id)}
          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
