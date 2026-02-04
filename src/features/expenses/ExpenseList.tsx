import { useApp } from '../../common/contexts/AppContext.tsx';
import ExpenseCard from './ExpenseCard.tsx';
import type { Expense } from '../../common/types/index.ts';

interface ExpenseListProps {
  onEdit: (expense: Expense) => void;
}

export default function ExpenseList({ onEdit }: ExpenseListProps) {
  const { state, dispatch } = useApp();

  function handleDelete(id: string) {
    dispatch({ type: 'DELETE_EXPENSE', payload: id });
  }

  if (state.expenses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No expenses yet</p>
        <p className="text-sm mt-1">Add your monthly expenses to track spending</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {state.expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
