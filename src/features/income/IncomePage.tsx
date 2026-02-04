import PageHeader from '../../common/components/PageHeader.tsx';
import IncomeForm from './IncomeForm.tsx';
import TaxBreakdown from './TaxBreakdown.tsx';
import NetIncomeDisplay from './NetIncomeDisplay.tsx';
import FilingComparison from './FilingComparison.tsx';
import IncomeChangeLog from './IncomeChangeLog.tsx';

export default function IncomePage() {
  return (
    <div>
      <PageHeader title="Income" />
      <div className="space-y-6">
        <IncomeForm />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaxBreakdown />
          <NetIncomeDisplay />
        </div>
        <IncomeChangeLog />
        <FilingComparison />
      </div>
    </div>
  );
}
