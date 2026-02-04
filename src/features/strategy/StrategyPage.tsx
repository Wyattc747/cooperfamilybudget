import { useMemo } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import { calculateRoadmap } from '../../common/utils/financialRoadmap.ts';
import PageHeader from '../../common/components/PageHeader.tsx';
import PhaseTracker from './PhaseTracker.tsx';
import BudgetAllocation from './BudgetAllocation.tsx';
import ProjectionChart from './ProjectionChart.tsx';
import HouseAffordability from './HouseAffordability.tsx';

export default function StrategyPage() {
  const { state } = useApp();
  const { totalExpenses, effectiveBudget, payDelayMonths, delayBudget } = usePayoffBudget();
  const debts = state.accounts.filter((a) => a.type === 'debt');

  const roadmap = useMemo(
    () => calculateRoadmap(state.income, debts, totalExpenses, effectiveBudget, undefined, payDelayMonths, delayBudget),
    [state.income, debts, totalExpenses, effectiveBudget, payDelayMonths, delayBudget]
  );

  return (
    <div>
      <PageHeader title="Strategy" />
      <div className="space-y-6">
        {/* Roadmap + Allocation side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PhaseTracker phases={roadmap.phases} currentPhase={roadmap.currentPhase} />
          </div>
          <div>
            <BudgetAllocation currentPhase={roadmap.currentPhase} monthlyBudget={effectiveBudget} />
          </div>
        </div>

        {/* Projection chart */}
        <ProjectionChart projections={roadmap.projections} phases={roadmap.phases} />

        {/* House Affordability */}
        <HouseAffordability />
      </div>
    </div>
  );
}
