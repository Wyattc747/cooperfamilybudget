import { useState } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { Input, Select } from '../../common/components/FormInput.tsx';
import Button from '../../common/components/Button.tsx';
import Modal from '../../common/components/Modal.tsx';
import type { Account, CompoundingType, DebtCategory } from '../../common/types/index.ts';
import { DEBT_CATEGORY_LABELS, DEBT_CATEGORY_COMPOUNDING } from '../../common/types/index.ts';

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  editAccount?: Account;
}

const debtCategoryOptions = (Object.keys(DEBT_CATEGORY_LABELS) as DebtCategory[]).map((key) => ({
  value: key,
  label: DEBT_CATEGORY_LABELS[key],
}));

const dueDayOptions = [
  { value: '0', label: 'Not set' },
  ...Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}${i + 1 === 1 || i + 1 === 21 || i + 1 === 31 ? 'st' : i + 1 === 2 || i + 1 === 22 ? 'nd' : i + 1 === 3 || i + 1 === 23 ? 'rd' : 'th'} of the month`,
  })),
];

export default function AccountForm({ open, onClose, editAccount }: AccountFormProps) {
  const { dispatch } = useApp();
  const [name, setName] = useState(editAccount?.name ?? '');
  const [type, setType] = useState<'debt' | 'savings'>(editAccount?.type ?? 'debt');
  const [balance, setBalance] = useState(editAccount?.balance.toString() ?? '');
  const [interestRate, setInterestRate] = useState(editAccount?.interestRate.toString() ?? '');
  const [minimumPayment, setMinimumPayment] = useState(editAccount?.minimumPayment.toString() ?? '');
  const [debtCategory, setDebtCategory] = useState<DebtCategory>(editAccount?.debtCategory ?? 'credit_card');
  const [compoundingType, setCompoundingType] = useState<CompoundingType>(editAccount?.compoundingType ?? 'daily_compound');
  const [dueDay, setDueDay] = useState(editAccount?.dueDay?.toString() ?? '');

  function handleCategoryChange(cat: DebtCategory) {
    setDebtCategory(cat);
    // Auto-set compounding type based on category (only if not editing)
    if (!editAccount) {
      setCompoundingType(DEBT_CATEGORY_COMPOUNDING[cat]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedBalance = parseFloat(balance);
    if (!name.trim() || isNaN(parsedBalance) || parsedBalance < 0) return;

    const account: Account = {
      id: editAccount?.id ?? crypto.randomUUID(),
      name: name.trim(),
      type,
      balance: parsedBalance,
      interestRate: parseFloat(interestRate) || 0,
      minimumPayment: type === 'debt' ? (parseFloat(minimumPayment) || 0) : 0,
      compoundingType: type === 'debt' ? compoundingType : 'monthly',
      debtCategory: type === 'debt' ? debtCategory : 'other',
      dueDay: type === 'debt' ? (parseInt(dueDay) || 0) : 0,
    };

    dispatch({ type: editAccount ? 'EDIT_ACCOUNT' : 'ADD_ACCOUNT', payload: account });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={editAccount ? 'Edit Account' : 'Add Account'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Type"
          options={[
            { value: 'debt', label: 'Debt' },
            { value: 'savings', label: 'Savings' },
          ]}
          value={type}
          onChange={(e) => setType(e.target.value as 'debt' | 'savings')}
        />
        {type === 'debt' && (
          <Select
            label="Debt Category"
            options={debtCategoryOptions}
            value={debtCategory}
            onChange={(e) => handleCategoryChange(e.target.value as DebtCategory)}
          />
        )}
        <Input
          label="Account Name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === 'debt'
            ? debtCategory === 'credit_card' ? 'e.g. Chase Sapphire, Discover It'
            : debtCategory === 'student_loan' ? 'e.g. Federal Direct, Navient'
            : debtCategory === 'auto_loan' ? 'e.g. Honda Civic Loan'
            : 'e.g. Personal Loan'
            : 'e.g. Emergency Fund, High-Yield Savings'
          }
        />
        <Input
          label="Balance"
          type="number"
          step="0.01"
          min="0"
          required
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="0.00"
        />
        <Input
          label="Interest Rate (APR %)"
          type="number"
          step="0.01"
          min="0"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          placeholder="0.00"
        />
        {type === 'debt' && (
          <>
            <Input
              label="Minimum Monthly Payment"
              type="number"
              step="0.01"
              min="0"
              value={minimumPayment}
              onChange={(e) => setMinimumPayment(e.target.value)}
              placeholder="0.00"
            />
            <Select
              label="Interest Compounding"
              options={[
                { value: 'daily_compound', label: 'Daily Compound (Credit Cards)' },
                { value: 'daily_simple', label: 'Daily Simple (Student Loans)' },
                { value: 'monthly', label: 'Monthly (Auto/Personal Loans)' },
              ]}
              value={compoundingType}
              onChange={(e) => setCompoundingType(e.target.value as CompoundingType)}
            />
            <Select
              label="Payment Due Day"
              options={dueDayOptions}
              value={dueDay || '0'}
              onChange={(e) => setDueDay(e.target.value)}
            />
          </>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {editAccount ? 'Save' : 'Add Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
