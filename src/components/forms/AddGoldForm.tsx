import { useState } from 'react';
import type { Gold } from '../../types/financial';
import { Field, Input, FormActions } from '../ui/FormField';

type GoldFormValues = Omit<Gold, 'id' | 'createdAt' | 'updatedAt'>;

interface AddGoldFormProps {
  initial?: GoldFormValues;
  onSubmit: (values: GoldFormValues) => void;
  onCancel: () => void;
}

const defaults: GoldFormValues = {
  assetName: '',
  quantityGrams: 0,
  buyPricePerGram: 0,
  currentPricePerGram: 0,
};

export function AddGoldForm({ initial, onSubmit, onCancel }: AddGoldFormProps) {
  const [values, setValues] = useState<GoldFormValues>(initial || defaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Asset Name">
        <Input required value={values.assetName} onChange={(e) => setValues({ ...values, assetName: e.target.value })} placeholder="e.g. Gold Coins" />
      </Field>
      <Field label="Quantity (grams)">
        <Input type="number" step="0.01" value={values.quantityGrams || ''} onChange={(e) => setValues({ ...values, quantityGrams: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Buy Price per Gram (₹)">
        <Input type="number" value={values.buyPricePerGram || ''} onChange={(e) => setValues({ ...values, buyPricePerGram: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Current Price per Gram (₹)">
        <Input type="number" value={values.currentPricePerGram || ''} onChange={(e) => setValues({ ...values, currentPricePerGram: parseFloat(e.target.value) || 0 })} />
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
