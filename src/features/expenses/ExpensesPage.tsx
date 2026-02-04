import { useState } from 'react';
import PageHeader from '../../common/components/PageHeader.tsx';
import Button from '../../common/components/Button.tsx';
import ExpenseList from './ExpenseList.tsx';
import ExpenseForm from './ExpenseForm.tsx';
import ExpenseSummary from './ExpenseSummary.tsx';
import UnexpectedExpenses from './UnexpectedExpenses.tsx';
import type { Expense } from '../../common/types/index.ts';

export default function ExpensesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | undefined>();

  function handleEdit(expense: Expense) {
    setEditExpense(expense);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditExpense(undefined);
  }

  return (
    <div>
      <PageHeader title="Expenses">
        <Button onClick={() => setShowForm(true)}>+ Add Recurring Expense</Button>
      </PageHeader>
      <div className="space-y-6">
        <ExpenseSummary />
        <ExpenseList onEdit={handleEdit} />
        <UnexpectedExpenses />
      </div>
      <ExpenseForm open={showForm} onClose={handleClose} editExpense={editExpense} />
    </div>
  );
}
