import type { PhaseInfo } from '../../common/utils/financialRoadmap.ts';
import { formatCurrency } from '../../common/utils/formatters.ts';
import Card from '../../common/components/Card.tsx';

interface PhaseTrackerProps {
  phases: PhaseInfo[];
  currentPhase?: number;
}

const STATUS_STYLES = {
  completed: {
    dot: 'bg-green-500',
    line: 'bg-green-500',
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
  },
  active: {
    dot: 'bg-blue-500 ring-4 ring-blue-100',
    line: 'bg-blue-200',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  upcoming: {
    dot: 'bg-gray-300',
    line: 'bg-gray-200',
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-500',
    badge: 'bg-gray-100 text-gray-500',
  },
};

export default function PhaseTracker({ phases }: PhaseTrackerProps) {
  return (
    <Card title="Financial Roadmap">
      <div className="relative">
        {phases.map((phase, i) => {
          const styles = STATUS_STYLES[phase.status];
          const isLast = i === phases.length - 1;

          return (
            <div key={phase.id} className="relative flex gap-4 pb-6">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${styles.dot}`} />
                {!isLast && <div className={`w-0.5 flex-1 mt-1 ${styles.line}`} />}
              </div>

              {/* Phase card */}
              <div className={`flex-1 rounded-lg border p-4 ${styles.bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold text-sm ${styles.text}`}>
                    Phase {phase.id}: {phase.name}
                  </h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${styles.badge}`}>
                    {phase.status === 'completed' ? 'Done' : phase.status === 'active' ? 'Current' : 'Upcoming'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{phase.description}</p>

                {/* Progress bar for active phase */}
                {phase.status === 'active' && phase.progress > 0 && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{phase.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {phase.estimatedMonths > 0 && phase.estimatedMonths < 360 && (
                    <span>~{phase.estimatedMonths} months</span>
                  )}
                  {phase.monthlyAllocation > 0 && (
                    <span>{formatCurrency(phase.monthlyAllocation)}/mo</span>
                  )}
                </div>
                {phase.details && (
                  <p className="text-xs text-gray-400 mt-1">{phase.details}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
