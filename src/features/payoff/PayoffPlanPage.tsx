import { useApp } from '../../common/contexts/AppContext.tsx';
import PageHeader from '../../common/components/PageHeader.tsx';
import PayoffSettings from './PayoffSettings.tsx';
import StrategyComparison from './StrategyComparison.tsx';
import PayoffScheduleTable from './PayoffScheduleTable.tsx';
import PayoffTimelineChart from './PayoffTimelineChart.tsx';
import PaymentFrequencyAnalysis from './PaymentFrequencyAnalysis.tsx';
import WithdrawalAnalysis from './WithdrawalAnalysis.tsx';
import PaymentScheduleView from './PaymentScheduleView.tsx';

export default function PayoffPlanPage() {
  const { state } = useApp();
  const debts = state.accounts.filter((a) => a.type === 'debt');

  return (
    <div>
      <PageHeader title="Payoff Plan" />
      {debts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No debts to pay off</p>
          <p className="text-sm mt-1">Add debts in the Accounts page to create a payoff plan</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PayoffSettings />
            <StrategyComparison />
          </div>
          <PaymentScheduleView />
          <PayoffTimelineChart />
          <PaymentFrequencyAnalysis />
          <WithdrawalAnalysis />
          <PayoffScheduleTable />
        </div>
      )}
    </div>
  );
}
