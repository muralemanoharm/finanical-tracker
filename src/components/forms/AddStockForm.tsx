import { useState } from 'react';
import type { Stock } from '../../types/financial';
import { Field, Input, FormActions } from '../ui/FormField';

type StockFormValues = Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>;

interface AddStockFormProps {
  initial?: StockFormValues;
  onSubmit: (values: StockFormValues) => void;
  onCancel: () => void;
}

const defaults: StockFormValues = {
  stockName: '',
  quantity: 0,
  buyPrice: 0,
  currentPrice: 0,
  sector: '',
};

export function AddStockForm({ initial, onSubmit, onCancel }: AddStockFormProps) {
  const [values, setValues] = useState<StockFormValues>(initial || defaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Stock Name / Ticker">
        <Input required value={values.stockName} onChange={(e) => setValues({ ...values, stockName: e.target.value })} placeholder="e.g. RELIANCE" />
      </Field>
      <Field label="Quantity">
        <Input type="number" value={values.quantity || ''} onChange={(e) => setValues({ ...values, quantity: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Buy Price (₹)">
        <Input type="number" step="0.01" value={values.buyPrice || ''} onChange={(e) => setValues({ ...values, buyPrice: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Current Price (₹)">
        <Input type="number" step="0.01" value={values.currentPrice || ''} onChange={(e) => setValues({ ...values, currentPrice: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Sector">
        <Input value={values.sector} onChange={(e) => setValues({ ...values, sector: e.target.value })} placeholder="e.g. Energy" />
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
