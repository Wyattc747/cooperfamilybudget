import { useApp } from '../../common/contexts/AppContext.tsx';
import PageHeader from '../../common/components/PageHeader.tsx';
import PayoffSettings from './PayoffSettings.tsx';
import StrategyComparison from './StrategyComparison.tsx';
import PayoffScheduleTable from './PayoffScheduleTable.tsx';
import PayoffTimelineChart from './PayoffTimelineChart.tsx';
import PaymentFrequencyAnalysis from './PaymentFrequencyAnalysis.tsx';
import WithdrawalAnalysis from './WithdrawalAnalysis.tsx';
import CashLumpSumAnalysis from './CashLumpSumAnalysis.tsx';

export default function PayoffPlanPage() {
  const { state } = useApp();
  const debts = state.accounts.filter((a) => a.type === 'debt' && a.debtCategory === 'credit_card');
  const hasNonCCDebts = state.accounts.some((a) => a.type === 'debt' && a.debtCategory !== 'credit_card');

  return (
    <div>
      <PageHeader title="Credit Card Payoff Plan" />
      {debts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No credit card debt to pay off</p>
          <p className="text-sm mt-1">
            {hasNonCCDebts
              ? 'The payoff plan focuses on credit cards. Your other debt minimums are included in monthly expenses.'
              : 'Add credit card debts in the Accounts page to create a payoff plan.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PayoffSettings />
            <StrategyComparison />
          </div>
          <PayoffTimelineChart />
          <CashLumpSumAnalysis />
          <PaymentFrequencyAnalysis />
          <WithdrawalAnalysis />
          <PayoffScheduleTable />
        </div>
      )}
    </div>
  );
}
