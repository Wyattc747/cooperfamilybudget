import { useMemo } from 'react';
import { getRecommendedAllocation } from '../../common/utils/financialRoadmap.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

interface BudgetAllocationProps {
  currentPhase: number;
  monthlyBudget: number;
}

export default function BudgetAllocation({ currentPhase, monthlyBudget }: BudgetAllocationProps) {
  const allocation = useMemo(
    () => getRecommendedAllocation(currentPhase, monthlyBudget),
    [currentPhase, monthlyBudget]
  );

  if (monthlyBudget <= 0) {
    return (
      <Card title="Recommended Budget Allocation">
        <p className="text-gray-400 text-sm text-center py-6">
          Set income and expenses to see allocation recommendations
        </p>
      </Card>
    );
  }

  return (
    <Card title="Recommended Budget Allocation">
      <p className="text-xs text-gray-500 mb-4">
        Phase {allocation.phase} recommended split of your {formatCurrency(monthlyBudget)}/mo available budget.
      </p>

      {/* Visual bar */}
      <div className="flex rounded-lg overflow-hidden h-8 mb-4">
        {allocation.allocations.map((a) => (
          <div
            key={a.label}
            className="flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${a.percentage}%`, backgroundColor: a.color }}
            title={`${a.label}: ${a.percentage}%`}
          >
            {a.percentage >= 15 && `${a.percentage}%`}
          </div>
        ))}
      </div>

      {/* Detail rows */}
      <div className="space-y-2">
        {allocation.allocations.map((a) => (
          <div key={a.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: a.color }}
              />
              <span className="text-gray-700">{a.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-xs">{a.percentage}%</span>
              <span className="font-medium">{formatCurrency(a.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
