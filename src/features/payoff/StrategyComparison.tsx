import { useMemo } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { compareStrategies, type PayDelay } from '../../common/utils/debtPayoff.ts';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

export default function StrategyComparison() {
  const { state } = useApp();
  const debts = state.accounts.filter((a) => a.type === 'debt');
  const { effectiveBudget: budget, payDelayMonths, delayBudget } = usePayoffBudget();
  const payDelay: PayDelay | undefined = payDelayMonths > 0 ? { months: payDelayMonths, delayBudget } : undefined;

  const results = useMemo(
    () => compareStrategies(debts, budget, payDelay),
    [debts, budget, payDelay]
  );

  if (debts.length === 0) {
    return (
      <Card title="Strategy Comparison">
        <p className="text-gray-400 text-sm text-center py-6">Add debts to compare payoff strategies</p>
      </Card>
    );
  }

  if (budget <= 0) {
    return (
      <Card title="Strategy Comparison">
        <p className="text-gray-400 text-sm text-center py-6">Set a payoff budget to see comparisons</p>
      </Card>
    );
  }

  const cards = [
    {
      label: 'Avalanche',
      description: 'Pays highest interest rate first. Minimizes total interest.',
      data: results.avalanche,
      color: 'blue',
    },
    {
      label: 'Snowball',
      description: 'Pays smallest balance first. Faster early wins.',
      data: results.snowball,
      color: 'purple',
    },
  ];

  const interestSaved = Math.abs(results.snowball.totalInterestPaid - results.avalanche.totalInterestPaid);
  const avalancheWins = results.avalanche.totalInterestPaid <= results.snowball.totalInterestPaid;

  return (
    <Card title="Avalanche vs Snowball">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border-2 p-4 ${
              (card.label === 'Avalanche' && avalancheWins) || (card.label === 'Snowball' && !avalancheWins)
                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <h4 className="font-semibold text-sm dark:text-gray-200 mb-1">{card.label}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{card.description}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Months to payoff</span>
                <span className="font-medium dark:text-gray-200">{card.data.totalMonths}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total interest</span>
                <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(card.data.totalInterestPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total paid</span>
                <span className="font-medium dark:text-gray-200">{formatCurrency(card.data.totalPaid)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {interestSaved > 0 && (
        <p className="text-sm text-green-700 dark:text-green-400 mt-3 font-medium text-center">
          {avalancheWins ? 'Avalanche' : 'Snowball'} saves {formatCurrency(interestSaved)} in interest
        </p>
      )}
    </Card>
  );
}
