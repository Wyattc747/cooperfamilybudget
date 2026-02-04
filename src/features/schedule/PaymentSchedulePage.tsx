import PageHeader from '../../common/components/PageHeader.tsx';
import PaymentScheduleView from '../payoff/PaymentScheduleView.tsx';

export default function PaymentSchedulePage() {
  return (
    <div>
      <PageHeader title="Payment Schedule" />
      <div className="space-y-6">
        <PaymentScheduleView filter="expense" />
        <PaymentScheduleView filter="debt" />
      </div>
    </div>
  );
}
