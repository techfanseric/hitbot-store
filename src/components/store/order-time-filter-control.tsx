import type { OrderTimeFilter } from '@/lib/order-filters';
import { Input } from '@/components/ui/input';

interface TimeFilterOption {
  key: OrderTimeFilter;
  label: string;
}

interface OrderTimeFilterControlProps {
  options: TimeFilterOption[];
  value: OrderTimeFilter;
  from: string;
  to: string;
  labels: {
    from: string;
    to: string;
  };
  onValueChange: (value: OrderTimeFilter) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export function OrderTimeFilterControl({
  options,
  value,
  from,
  to,
  labels,
  onValueChange,
  onFromChange,
  onToChange,
}: OrderTimeFilterControlProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={() => onValueChange(filter.key)}
          className={`inline-flex h-[36px] items-center rounded-sm px-2.5 text-md transition-colors ${
            value === filter.key
              ? 'bg-bg-elevated text-text-strong font-semibold'
              : 'bg-bg-control text-text-muted hover:text-text'
          }`}
        >
          {filter.label}
        </button>
      ))}
      <label className="bg-bg-control inline-flex h-[36px] items-center gap-1.5 rounded-sm pl-2.5">
        <span className="text-text-muted text-md whitespace-nowrap">{labels.from}</span>
        <Input
          type="date"
          value={from}
          max={to || undefined}
          aria-label={labels.from}
          className="h-[36px] w-[142px] rounded-sm bg-transparent px-1.5 text-md hover:bg-transparent focus-visible:ring-0"
          onChange={(event) => onFromChange(event.target.value)}
        />
      </label>
      <label className="bg-bg-control inline-flex h-[36px] items-center gap-1.5 rounded-sm pl-2.5">
        <span className="text-text-muted text-md whitespace-nowrap">{labels.to}</span>
        <Input
          type="date"
          value={to}
          min={from || undefined}
          aria-label={labels.to}
          className="h-[36px] w-[142px] rounded-sm bg-transparent px-1.5 text-md hover:bg-transparent focus-visible:ring-0"
          onChange={(event) => onToChange(event.target.value)}
        />
      </label>
    </div>
  );
}
