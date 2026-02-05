import { useState } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import Card from '../../common/components/Card.tsx';
import Button from '../../common/components/Button.tsx';
import { Input, Select } from '../../common/components/FormInput.tsx';
import { formatCurrency } from '../../common/utils/formatters.ts';
import type { IncomeChangeEntry } from '../../common/types/index.ts';
import { INCOME_FIELD_LABELS } from '../../common/types/index.ts';

const fieldOptions = (Object.keys(INCOME_FIELD_LABELS) as IncomeChangeEntry['field'][]).map((key) => ({
  value: key,
  label: INCOME_FIELD_LABELS[key],
}));

export default function IncomeChangeLog() {
  const { state, dispatch } = useApp();
  const { incomeHistory, income } = state;
  const [showForm, setShowForm] = useState(false);
  const [field, setField] = useState<IncomeChangeEntry['field']>('baseSalary');
  const [previousAmount, setPreviousAmount] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prev = parseFloat(previousAmount);
    const next = parseFloat(newAmount);
    if (isNaN(next) || next < 0) return;

    const entry: IncomeChangeEntry = {
      id: crypto.randomUUID(),
      date,
      description: description.trim() || `${INCOME_FIELD_LABELS[field]} changed`,
      field,
      previousAmount: isNaN(prev) ? 0 : prev,
      newAmount: next,
    };

    dispatch({ type: 'ADD_INCOME_CHANGE', payload: entry });

    // Also update the actual income value
    dispatch({ type: 'SET_INCOME', payload: { [field]: next } });

    setShowForm(false);
    setDescription('');
    setPreviousAmount('');
    setNewAmount('');
  }

  function handleStartLog() {
    // Pre-fill previous amount with current value
    const currentValues: Record<IncomeChangeEntry['field'], number> = {
      baseSalary: income.baseSalary,
      monthlyCommission: income.monthlyCommission,
      monthlyBusinessIncome: income.monthlyBusinessIncome,
      monthlyTaxFree: income.monthlyTaxFree,
    };
    setPreviousAmount(currentValues[field].toString());
    setShowForm(true);
  }

  function handleFieldChange(newField: IncomeChangeEntry['field']) {
    setField(newField);
    const currentValues: Record<IncomeChangeEntry['field'], number> = {
      baseSalary: income.baseSalary,
      monthlyCommission: income.monthlyCommission,
      monthlyBusinessIncome: income.monthlyBusinessIncome,
      monthlyTaxFree: income.monthlyTaxFree,
    };
    setPreviousAmount(currentValues[newField].toString());
  }

  return (
    <Card title="Income Change Log">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Track when your income changes over time. Logging a change also updates your current income.
      </p>

      {!showForm ? (
        <Button size="sm" onClick={handleStartLog}>+ Log Income Change</Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Select
              label="Income Field"
              options={fieldOptions}
              value={field}
              onChange={(e) => handleFieldChange(e.target.value as IncomeChangeEntry['field'])}
            />
            <Input
              label={field === 'baseSalary' ? 'Previous Annual Salary' : 'Previous Monthly Amount'}
              type="number"
              min="0"
              step="100"
              value={previousAmount}
              onChange={(e) => setPreviousAmount(e.target.value)}
              placeholder="0"
            />
            <Input
              label={field === 'baseSalary' ? 'New Annual Salary' : 'New Monthly Amount'}
              type="number"
              min="0"
              step="100"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <Input
            label="Note (optional)"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Annual raise, new job, promotion"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm">Save</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {incomeHistory.length > 0 ? (
        <div className="mt-3 space-y-2">
          {incomeHistory.map((entry) => {
            const isIncrease = entry.newAmount > entry.previousAmount;
            const diff = entry.newAmount - entry.previousAmount;
            return (
              <div key={entry.id} className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {INCOME_FIELD_LABELS[entry.field]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{entry.description}</p>
                  <div className="flex items-center gap-1.5 text-xs mt-0.5">
                    <span className="text-gray-400">{formatCurrency(entry.previousAmount)}</span>
                    <span className="text-gray-300 dark:text-gray-600">&rarr;</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(entry.newAmount)}</span>
                    <span className={`font-medium ${isIncrease ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      ({isIncrease ? '+' : ''}{formatCurrency(diff)})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'DELETE_INCOME_CHANGE', payload: entry.id })}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-1 shrink-0"
                  title="Delete entry"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-3 mt-2">
          No changes logged yet. Log changes here when your income goes up or down.
        </p>
      )}
    </Card>
  );
}
