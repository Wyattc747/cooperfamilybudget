import { useState } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { Input, Select } from '../../common/components/FormInput.tsx';
import Button from '../../common/components/Button.tsx';
import Modal from '../../common/components/Modal.tsx';
import type { Expense } from '../../common/types/index.ts';
import { EXPENSE_CATEGORIES } from '../../common/types/index.ts';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  editExpense?: Expense;
}

export default function ExpenseForm({ open, onClose, editExpense }: ExpenseFormProps) {
  const { dispatch } = useApp();
  const [name, setName] = useState(editExpense?.name ?? '');
  const [amount, setAmount] = useState(editExpense?.amount.toString() ?? '');
  const [category, setCategory] = useState(editExpense?.category ?? EXPENSE_CATEGORIES[0]);
  const [dueDay, setDueDay] = useState(editExpense?.dueDay?.toString() ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const expense: Expense = {
      id: editExpense?.id ?? crypto.randomUUID(),
      name: name.trim(),
      amount: parsedAmount,
      category,
      dueDay: parseInt(dueDay) || 0,
    };

    dispatch({ type: editExpense ? 'EDIT_EXPENSE' : 'ADD_EXPENSE', payload: expense });
    onClose();
  }

  const categoryOptions = EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }));

  const dueDayOptions = [
    { value: '0', label: 'Not set' },
    ...Array.from({ length: 31 }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1}${i + 1 === 1 || i + 1 === 21 || i + 1 === 31 ? 'st' : i + 1 === 2 || i + 1 === 22 ? 'nd' : i + 1 === 3 || i + 1 === 23 ? 'rd' : 'th'} of the month`,
    })),
  ];

  return (
    <Modal open={open} onClose={onClose} title={editExpense ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rent, Groceries"
        />
        <Input
          label="Monthly Amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
        <Select
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Select
          label="Due Day"
          options={dueDayOptions}
          value={dueDay || '0'}
          onChange={(e) => setDueDay(e.target.value)}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {editExpense ? 'Save' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
