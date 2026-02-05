import { useMemo, useState } from 'react';
import { useApp } from '../../common/contexts/AppContext.tsx';
import { usePayoffBudget } from '../../common/hooks/usePayoffBudget.ts';
import { analyzeWithdrawal, type WithdrawalInputs } from '../../common/utils/withdrawalAnalysis.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';
import { Input } from '../../common/components/FormInput.tsx';

export default function WithdrawalAnalysis() {
  const { state } = useApp();
  const { effectiveBudget } = usePayoffBudget();
  const debts = state.accounts.filter((a) => a.type === 'debt');

  const [balance401k, setBalance401k] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('7');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  const inputs: WithdrawalInputs | null = useMemo(() => {
    const bal = parseFloat(balance401k);
    const ret = parseFloat(expectedReturn);
    const amt = parseFloat(withdrawalAmount);
    if (isNaN(bal) || bal <= 0 || isNaN(ret) || isNaN(amt) || amt <= 0) return null;
    return { balance401k: bal, expectedReturn: ret, withdrawalAmount: amt };
  }, [balance401k, expectedReturn, withdrawalAmount]);

  const result = useMemo(() => {
    if (!inputs || debts.length === 0 || effectiveBudget <= 0) return null;
    return analyzeWithdrawal(debts, effectiveBudget, state.income, inputs);
  }, [inputs, debts, effectiveBudget, state.income]);

  if (debts.length === 0) {
    return (
      <Card title="401k Withdrawal Analysis">
        <p className="text-gray-400 text-sm text-center py-6">
          Add debts to analyze 401k withdrawal scenarios
        </p>
      </Card>
    );
  }

  return (
    <Card title="401k Withdrawal Analysis">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Should you withdraw from your 401k to pay off debt? Compare the total cost of both approaches.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Input
          label="401k Balance"
          type="number"
          step="100"
          min="0"
          value={balance401k}
          onChange={(e) => setBalance401k(e.target.value)}
          placeholder="50000"
        />
        <Input
          label="Expected Annual Return (%)"
          type="number"
          step="0.1"
          min="0"
          max="30"
          value={expectedReturn}
          onChange={(e) => setExpectedReturn(e.target.value)}
          placeholder="7"
        />
        <Input
          label="Withdrawal Amount"
          type="number"
          step="100"
          min="0"
          value={withdrawalAmount}
          onChange={(e) => setWithdrawalAmount(e.target.value)}
          placeholder="20000"
        />
      </div>

      {result ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <ScenarioCard
              scenario={result.keepScenario}
              isWinner={result.winner === 'keep'}
            />
            <ScenarioCard
              scenario={result.withdrawScenario}
              isWinner={result.winner === 'withdraw'}
            />
          </div>

          <div className={`rounded-lg p-4 text-center ${
            result.winner === 'keep' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          }`}>
            <p className="font-semibold text-sm dark:text-gray-200">
              {result.winner === 'keep'
                ? 'Recommendation: Keep your 401k and pay debts normally'
                : 'Recommendation: Withdrawing may save you money overall'}
            </p>
            <p className="text-sm mt-1 dark:text-gray-300">
              {result.winner === 'keep' ? 'Keeping' : 'Withdrawing'} saves{' '}
              <span className="font-bold text-green-700 dark:text-green-400">{formatCurrency(result.savings)}</span>{' '}
              over {Math.ceil(result.timeHorizonMonths / 12)} years
            </p>
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-sm text-center py-4">
          Enter your 401k balance and withdrawal amount to see analysis
        </p>
      )}
    </Card>
  );
}

function ScenarioCard({
  scenario,
  isWinner,
}: {
  scenario: { label: string; totalDebtInterest: number; penalty: number; extraTaxes: number; lostGrowth: number; totalCost: number; monthsToPayoff: number; ending401k: number };
  isWinner: boolean;
}) {
  return (
    <div className={`rounded-lg border-2 p-4 ${isWinner ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-semibold text-sm dark:text-gray-200">{scenario.label}</h4>
        {isWinner && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300 font-medium">
            Better
          </span>
        )}
      </div>
      <div className="space-y-1.5 text-sm">
        <Row label="Debt interest" value={formatCurrency(scenario.totalDebtInterest)} color="text-red-600" />
        {scenario.penalty > 0 && (
          <Row label="10% penalty" value={formatCurrency(scenario.penalty)} color="text-red-600" />
        )}
        {scenario.extraTaxes > 0 && (
          <Row label="Extra income tax" value={formatCurrency(scenario.extraTaxes)} color="text-red-600" />
        )}
        {scenario.lostGrowth > 0 && (
          <Row label="Lost 401k growth" value={formatCurrency(scenario.lostGrowth)} color="text-amber-600" />
        )}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5">
          <Row label="Total cost" value={formatCurrency(scenario.totalCost)} color="font-bold" />
        </div>
        <Row label="Months to payoff" value={String(scenario.monthsToPayoff)} />
        <Row label="401k ending balance" value={formatCurrency(scenario.ending401k)} color="text-green-600" />
      </div>
    </div>
  );
}

function Row({ label, value, color = '' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`font-medium dark:text-gray-200 ${color}`}>{value}</span>
    </div>
  );
}
