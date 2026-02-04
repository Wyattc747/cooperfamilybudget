import { useApp } from '../../common/contexts/AppContext.tsx';
import { Input, Select, FormGroup } from '../../common/components/FormInput.tsx';
import Card from '../../common/components/Card.tsx';
import type { FilingStatus, PayFrequency } from '../../common/types/index.ts';
import { FILING_STATUS_LABELS, PAY_FREQUENCY_LABELS } from '../../common/types/index.ts';

export default function IncomeForm() {
  const { state, dispatch } = useApp();
  const { income } = state;

  function update(field: string, value: string) {
    const numVal = parseFloat(value);
    if (field === 'filingStatus') {
      dispatch({ type: 'SET_INCOME', payload: { filingStatus: value as FilingStatus } });
    } else if (field === 'payStartDate' || field === 'nextPayDate') {
      dispatch({ type: 'SET_INCOME', payload: { [field]: value } });
    } else if (field === 'payFrequency') {
      dispatch({ type: 'SET_INCOME', payload: { payFrequency: value as PayFrequency } });
    } else {
      dispatch({ type: 'SET_INCOME', payload: { [field]: isNaN(numVal) ? 0 : numVal } });
    }
  }

  const filingOptions = (Object.keys(FILING_STATUS_LABELS) as FilingStatus[]).map((key) => ({
    value: key,
    label: FILING_STATUS_LABELS[key],
  }));

  const payFrequencyOptions = (Object.keys(PAY_FREQUENCY_LABELS) as PayFrequency[]).map((key) => ({
    value: key,
    label: PAY_FREQUENCY_LABELS[key],
  }));

  const payStartDaysAway = income.payStartDate
    ? Math.max(0, Math.ceil((new Date(income.payStartDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const payStarted = !income.payStartDate || payStartDaysAway <= 0;

  return (
    <div className="space-y-6">
      <Card title="Employment Income">
        <FormGroup columns={2}>
          <Input
            label="Base Salary (Annual)"
            type="number"
            min="0"
            step="1000"
            value={income.baseSalary || ''}
            onChange={(e) => update('baseSalary', e.target.value)}
            placeholder="75000"
          />
          <Input
            label="Monthly Commission"
            type="number"
            min="0"
            step="100"
            value={income.monthlyCommission || ''}
            onChange={(e) => update('monthlyCommission', e.target.value)}
            placeholder="1000"
          />
          <Input
            label="Pay Start Date"
            type="date"
            value={income.payStartDate || ''}
            onChange={(e) => update('payStartDate', e.target.value)}
          />
          <Select
            label="Pay Frequency"
            options={payFrequencyOptions}
            value={income.payFrequency}
            onChange={(e) => update('payFrequency', e.target.value)}
          />
          <Input
            label="Next Pay Date"
            type="date"
            value={income.nextPayDate || ''}
            onChange={(e) => update('nextPayDate', e.target.value)}
          />
          <Input
            label="Tax-Free Monthly Income"
            type="number"
            min="0"
            step="100"
            value={income.monthlyTaxFree || ''}
            onChange={(e) => update('monthlyTaxFree', e.target.value)}
            placeholder="0"
          />
          <Input
            label="Number of Dependents"
            type="number"
            min="0"
            step="1"
            value={income.dependents || ''}
            onChange={(e) => update('dependents', e.target.value)}
            placeholder="0"
          />
          <Input
            label="State Tax Rate (%)"
            type="number"
            min="0"
            max="15"
            step="0.1"
            value={income.stateTaxRate || ''}
            onChange={(e) => update('stateTaxRate', e.target.value)}
            placeholder="4.5"
          />
        </FormGroup>
        <div className="mt-4">
          <Select
            label="Filing Status"
            options={filingOptions}
            value={income.filingStatus}
            onChange={(e) => update('filingStatus', e.target.value)}
          />
        </div>
        {!payStarted && (
          <p className="text-sm text-amber-600 mt-3">
            Pay starts in {payStartDaysAway} day{payStartDaysAway !== 1 ? 's' : ''} ({income.payStartDate}).
            Projections will account for no salary income until then.
          </p>
        )}
      </Card>

      <Card title="Business Income">
        <p className="text-xs text-gray-500 mb-3">
          Track income from your business separately. This is included in your total monthly income and tax calculations.
        </p>
        <FormGroup columns={2}>
          <Input
            label="Monthly Business Income"
            type="number"
            min="0"
            step="100"
            value={income.monthlyBusinessIncome || ''}
            onChange={(e) => update('monthlyBusinessIncome', e.target.value)}
            placeholder="0"
          />
        </FormGroup>
        {income.monthlyBusinessIncome === 0 && (
          <p className="text-xs text-gray-400 mt-2">
            No business income yet — update this as revenue comes in.
          </p>
        )}
      </Card>
    </div>
  );
}
