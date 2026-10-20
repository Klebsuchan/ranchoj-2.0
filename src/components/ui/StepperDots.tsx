import React from 'react';

export interface StepperDotsProps {
  totalSteps: number;
  currentStep: number;
  onSelectStep?: (step: number) => void;
  labels?: string[];
}

export const StepperDots: React.FC<StepperDotsProps> = ({
  totalSteps,
  currentStep,
  onSelectStep,
  labels,
}) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <button
              key={`step-${stepNum}`}
              type="button"
              onClick={() => onSelectStep && onSelectStep(stepNum)}
              disabled={!onSelectStep}
              aria-label={labels?.[idx] ? `Passo ${stepNum}: ${labels[idx]}` : `Passo ${stepNum}`}
              className="min-h-[44px] px-1 flex items-center justify-center focus:outline-none"
            >
              <span
                className={`h-2 rounded-pill transition-all duration-200 ${
                  isActive
                    ? 'w-7 bg-brand'
                    : isCompleted
                    ? 'w-2.5 bg-save'
                    : 'w-2.5 bg-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {labels && labels[currentStep - 1] && (
        <span className="text-[12px] font-medium text-ink-muted tabular-nums">
          Passo {currentStep} de {totalSteps} · {labels[currentStep - 1]}
        </span>
      )}
    </div>
  );
};
