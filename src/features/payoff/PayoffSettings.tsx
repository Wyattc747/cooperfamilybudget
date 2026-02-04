import { useApp } from '../../common/contexts/AppContext.tsx';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';
import Button from '../../common/components/Button.tsx';

export default function PayoffSettings() {
  const { state, dispatch } = useApp();
  const { payoffSettings } = state;
  const { monthlyNet, totalExpenses, calculatedBudget, effectiveBudget, payDelayMonths, delayBudget } = usePayoffBudget();

  function handleBudgetChange(value: string) {
    const num = parseFloat(value);
    dispatch({
      type: 'SET_PAYOFF_SETTINGS',
      payload: { monthlyBudget: isNaN(num) ? 0 : num, isManualOverride: true },
    });
  }

  function resetToCalculated() {
    dispatch({
      type: 'SET_PAYOFF_SETTINGS',
      payload: { monthlyBudget: calculatedBudget, isManualOverride: false },
    });
  }

  return (
    <Card title="Payoff Budget">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Net Monthly Income</span>
          <span className="font-medium">{formatCurrency(monthlyNet)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Monthly Expenses</span>
          <span className="font-medium text-red-600">-{formatCurrency(totalExpenses)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between">
          <span className="text-gray-600">Available for Debt Payoff</span>
          <span className="font-semibold">{formatCurrency(calculatedBudget)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payoff Budget</label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={payoffSettings.isManualOverride ? payoffSettings.monthlyBudget : calculatedBudget}
            onChange={(e) => handleBudgetChange(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {payoffSettings.isManualOverride && (
            <Button variant="secondary" size="sm" onClick={resetToCalculated}>
              Reset to calculated
            </Button>
          )}
        </div>
        {payoffSettings.isManualOverride && (
          <p className="text-xs text-amber-600 mt-1">Manually overridden</p>
        )}
      </div>

      {payDelayMonths > 0 && (
        <p className="text-sm text-amber-600 mt-3">
          Pay starts in ~{payDelayMonths} month{payDelayMonths !== 1 ? 's' : ''}.
          Budget during delay: {formatCurrency(delayBudget)}/mo (minimums only).
        </p>
      )}

      {effectiveBudget <= 0 && (
        <p className="text-sm text-red-500 mt-3">
          No budget available for debt payoff. Add income or reduce expenses.
        </p>
      )}
    </Card>
  );
}
