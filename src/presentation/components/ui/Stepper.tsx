interface StepperProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function Stepper({ currentStep, totalSteps, stepLabels }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isPending = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-colors ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white"
                      : isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center ${
                    isActive
                      ? "text-blue-600"
                      : isCompleted
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connector Line */}
              {index < stepLabels.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    isCompleted ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
