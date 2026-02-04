import { Link } from 'react-router-dom';
import PageHeader from '../../common/components/PageHeader.tsx';
import SummaryCards from './SummaryCards.tsx';
import ProposedBudget from './ProposedBudget.tsx';
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProposedBudget />
          <div>
            <PaymentScheduleView compact />
            <Link
              to="/schedule"
              className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
            >
              View full schedule &rarr;
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseBreakdownChart />
          <DebtBreakdownChart />
        </div>
        <PayoffComparisonChart />
      </div>
    </div>
  );
}
