import { useEffect, useState } from 'react';
import { Button, Input, View } from '@tarojs/components';

interface CartQuantityStepperProps {
  value: number;
  onChange: (quantity: number) => void;
  size?: 'compact' | 'regular';
}

const MAX_CART_QUANTITY = 999;

export function CartQuantityStepper({
  value,
  onChange,
  size = 'regular',
}: CartQuantityStepperProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commitQuantity(rawValue: string) {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 1) return;
    onChange(Math.min(MAX_CART_QUANTITY, Math.floor(parsed)));
  }

  return (
    <View
      className={`cart-quantity-stepper ${size === 'compact' ? 'stepper-compact' : ''}`}
      onClick={(event) => event.stopPropagation()}
    >
      <Button
        className="stepper-button"
        onClick={(event) => {
          event.stopPropagation();
          onChange(Math.max(0, value - 1));
        }}
      >
        -
      </Button>
      <Input
        className="stepper-input"
        type="number"
        value={draft}
        maxlength={3}
        onClick={(event) => event.stopPropagation()}
        onInput={(event) => {
          const nextDraft = String(event.detail.value).replace(/\D/g, '').slice(0, 3);
          setDraft(nextDraft);
          if (nextDraft) commitQuantity(nextDraft);
        }}
        onBlur={() => {
          const parsed = Number(draft);
          if (!draft || !Number.isFinite(parsed) || parsed < 1) {
            setDraft(String(value));
            return;
          }
          setDraft(String(Math.min(MAX_CART_QUANTITY, Math.floor(parsed))));
        }}
      />
      <Button
        className="stepper-button"
        onClick={(event) => {
          event.stopPropagation();
          onChange(Math.min(MAX_CART_QUANTITY, value + 1));
        }}
      >
        +
      </Button>
    </View>
  );
}
