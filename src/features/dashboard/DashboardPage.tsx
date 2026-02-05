import PageHeader from '../../common/components/PageHeader.tsx';
import SummaryCards from './SummaryCards.tsx';
import ProposedBudget from './ProposedBudget.tsx';
import CreditCardUsageChart from './CreditCardUsageChart.tsx';
import ExpenseBreakdownChart from './ExpenseBreakdownChart.tsx';
import DebtToIncomeChart from './DebtToIncomeChart.tsx';

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="space-y-6">
        <SummaryCards />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProposedBudget />
          <DebtToIncomeChart />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseBreakdownChart />
          <CreditCardUsageChart />
        </div>
      </div>
    </div>
  );
}
