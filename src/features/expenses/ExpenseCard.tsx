import type { Expense } from '../../common/types/index.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <div>
          <p className="font-medium text-sm">{expense.name}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{expense.category}</span>
            {expense.dueDay > 0 && (
              <span className="text-xs text-purple-500">
                Due: {expense.dueDay}{expense.dueDay === 1 || expense.dueDay === 21 || expense.dueDay === 31 ? 'st' : expense.dueDay === 2 || expense.dueDay === 22 ? 'nd' : expense.dueDay === 3 || expense.dueDay === 23 ? 'rd' : 'th'}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm">{formatCurrency(expense.amount)}<span className="text-gray-400 font-normal">/mo</span></span>
        <button
          onClick={() => onEdit(expense)}
          className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(expense.id)}
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
