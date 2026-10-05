import * as React from "react";
import { cn } from "@/lib/utils";

export interface Step {
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  className,
}: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full py-4", className)}>
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;
          const isClickable = onStepClick && isCompleted;

          return (
            <li
              key={step.title}
              className={cn(
                "relative flex flex-col items-center flex-1",
                index !== steps.length - 1 &&
                  "after:content-[''] after:w-full after:h-0.5 after:border-b after:border-slate-200 dark:after:border-slate-700 after:top-4 after:left-1/2 after:absolute after:-translate-y-1/2 z-0",
                isCompleted && "after:border-emerald-600 dark:after:border-emerald-500"
              )}
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(index)}
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all select-none",
                  isCompleted
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                    : isCurrent
                    ? "border-2 border-emerald-600 bg-white dark:bg-slate-900 text-emerald-600 ring-4 ring-emerald-50 dark:ring-emerald-950 font-bold"
                    : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center hidden sm:block",
                  isCurrent
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : isCompleted
                    ? "text-slate-700 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                {step.title}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
