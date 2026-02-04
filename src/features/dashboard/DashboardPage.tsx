import PageHeader from '../../common/components/PageHeader.tsx';
import SummaryCards from './SummaryCards.tsx';
import DebtBreakdownChart from './DebtBreakdownChart.tsx';
import ExpenseBreakdownChart from './ExpenseBreakdownChart.tsx';
import PayoffComparisonChart from './PayoffComparisonChart.tsx';
import PaymentScheduleView from '../payoff/PaymentScheduleView.tsx';

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="space-y-6">
        <SummaryCards />
        <PaymentScheduleView compact />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseBreakdownChart />
          <DebtBreakdownChart />
        </div>
        <PayoffComparisonChart />
      </div>
    </div>
  );
}
