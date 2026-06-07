'use client';

import { Check, Clock3, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ApprovalFlowStepStatus = 'done' | 'current' | 'pending' | 'skipped';

export interface ApprovalFlowStep {
  key: string;
  title: string;
  meta?: string;
  status: ApprovalFlowStepStatus;
}

interface ApprovalFlowProps {
  title?: string;
  steps: ApprovalFlowStep[];
  compact?: boolean;
  className?: string;
}

const statusStyles: Record<ApprovalFlowStepStatus, string> = {
  done: 'bg-brand-soft text-brand-500',
  current: 'bg-text-strong text-bg-elevated',
  pending: 'bg-bg-control text-text-muted',
  skipped: 'bg-bg-control text-text-muted opacity-70',
};

const statusIcons = {
  done: Check,
  current: Clock3,
  pending: Clock3,
  skipped: Minus,
};

export function ApprovalFlow({ title, steps, compact = false, className }: ApprovalFlowProps) {
  return (
    <div className={cn('min-w-0', className)}>
      {title && <p className="text-text-muted mb-2 text-xs font-medium">{title}</p>}
      <div
        className={cn(
          'flex flex-wrap',
          compact
            ? 'gap-x-2 gap-y-1.5'
            : 'gap-x-3 gap-y-2 md:flex-nowrap md:items-start',
        )}
      >
        {steps.map((step, index) => {
          const Icon = statusIcons[step.status];

          return (
            <div
              key={step.key}
              className={cn(
                'flex min-w-0 items-start gap-2',
                compact ? 'max-w-full' : 'basis-[148px] md:flex-1',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  compact && 'size-5',
                  statusStyles[step.status],
                )}
              >
                {step.status === 'pending' ? index + 1 : <Icon className="size-3.5" />}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    'block truncate text-sm font-medium',
                    step.status === 'pending' || step.status === 'skipped'
                      ? 'text-text-muted'
                      : 'text-text-strong',
                    compact && 'text-xs leading-5',
                  )}
                >
                  {step.title}
                </span>
                {step.meta && !compact && (
                  <span className="text-text-muted mt-0.5 block truncate text-xs">
                    {step.meta}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
