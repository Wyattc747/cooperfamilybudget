import { useState } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import Card from '../../common/components/Card.tsx';
import Button from '../../common/components/Button.tsx';
import Modal from '../../common/components/Modal.tsx';
import { Input, Select } from '../../common/components/FormInput.tsx';
import { formatCurrency } from '../../common/utils/formatters.ts';
import type { UnexpectedExpense } from '../../common/types/index.ts';

const CATEGORIES = [
  'Car Repair',
  'Home Repair',
  'Medical',
  'Travel',
  'Legal',
  'Emergency',
  'Gift',
  'Tax',
  'Moving',
  'Other',
] as const;

const categoryOptions = CATEGORIES.map((c) => ({ value: c, label: c }));

export default function UnexpectedExpenses() {
  const { state, dispatch } = useApp();
  const { unexpectedExpenses } = state;
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<UnexpectedExpense | undefined>();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0] as string);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  function openForm(item?: UnexpectedExpense) {
    if (item) {
      setEditItem(item);
      setName(item.name);
      setAmount(item.amount.toString());
      setCategory(item.category);
      setDate(item.date);
      setNote(item.note);
    } else {
      setEditItem(undefined);
      setName('');
      setAmount('');
      setCategory(CATEGORIES[0]);
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditItem(undefined);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const expense: UnexpectedExpense = {
      id: editItem?.id ?? crypto.randomUUID(),
      date,
      name: name.trim(),
      amount: parsedAmount,
      category,
      note: note.trim(),
    };

    dispatch({
      type: editItem ? 'EDIT_UNEXPECTED_EXPENSE' : 'ADD_UNEXPECTED_EXPENSE',
      payload: expense,
    });
    handleClose();
  }

  const totalThisMonth = unexpectedExpenses
    .filter((e) => {
      const d = new Date(e.date + 'T12:00:00');
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amount, 0);

  const totalAll = unexpectedExpenses.reduce((s, e) => s + e.amount, 0);

  // Group by month
  const grouped = unexpectedExpenses.reduce<Map<string, UnexpectedExpense[]>>((map, e) => {
    const d = new Date(e.date + 'T12:00:00');
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
    return map;
  }, new Map());

  const sortedMonths = Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Unexpected Expenses</h3>
          <Button size="sm" onClick={() => openForm()}>+ Add</Button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Track one-time or surprise expenses separate from your recurring monthly bills.
        </p>

        {unexpectedExpenses.length > 0 && (
          <div className="flex gap-4 mb-3">
            <div className="text-center px-3 py-1.5 bg-amber-50 rounded-lg flex-1">
              <p className="text-[10px] text-amber-600 uppercase tracking-wide">This Month</p>
              <p className="text-sm font-semibold text-amber-700">{formatCurrency(totalThisMonth)}</p>
            </div>
            <div className="text-center px-3 py-1.5 bg-gray-50 rounded-lg flex-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">All Time</p>
              <p className="text-sm font-semibold text-gray-700">{formatCurrency(totalAll)}</p>
            </div>
          </div>
        )}

        {sortedMonths.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No unexpected expenses recorded</p>
        ) : (
          <div className="space-y-3">
            {sortedMonths.map(([monthKey, items]) => {
              const [y, m] = monthKey.split('-');
              const monthLabel = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              const monthTotal = items.reduce((s, e) => s + e.amount, 0);
              return (
                <div key={monthKey}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{monthLabel}</span>
                    <span className="text-xs font-medium text-amber-600">{formatCurrency(monthTotal)}</span>
                  </div>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">{item.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">
                              {item.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {item.note && <span className="text-xs text-gray-400">— {item.note}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-gray-700 tabular-nums">{formatCurrency(item.amount)}</span>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                            <button
                              onClick={() => openForm(item)}
                              className="text-gray-400 hover:text-blue-500 p-0.5"
                              title="Edit"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => dispatch({ type: 'DELETE_UNEXPECTED_EXPENSE', payload: item.id })}
                              className="text-gray-400 hover:text-red-500 p-0.5"
                              title="Delete"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={showForm} onClose={handleClose} title={editItem ? 'Edit Unexpected Expense' : 'Add Unexpected Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Car repair, ER visit"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <Select
            label="Category"
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            label="Note (optional)"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any additional details"
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editItem ? 'Save' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
