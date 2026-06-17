import { useState } from 'react';
import type { IncomeStream } from '../../types/career';
import { Field, Input } from '../ui/FormField';
import { FormActions } from '../ui/FormField';
import { todayISO } from '../../utils/calculations';

type IncomeStreamFormValues = Omit<IncomeStream, 'id'>;

interface AddIncomeStreamFormProps {
  initial?: IncomeStreamFormValues;
  onSubmit: (values: IncomeStreamFormValues) => void;
  onCancel: () => void;
}

const defaults: IncomeStreamFormValues = {
  name: '',
  monthlyIncomeCurrent: 0,
  monthStarted: todayISO(),
  targetMonthlyIncome: 0,
  growthRatePercentPerMonth: 5,
};

export function AddIncomeStreamForm({ initial, onSubmit, onCancel }: AddIncomeStreamFormProps) {
  const [values, setValues] = useState<IncomeStreamFormValues>(initial || defaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Stream Name">
        <Input required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="e.g. Freelance Design" />
      </Field>
      <Field label="Current Monthly Income (₹)">
        <Input type="number" value={values.monthlyIncomeCurrent || ''} onChange={(e) => setValues({ ...values, monthlyIncomeCurrent: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Month Started">
        <Input type="date" value={values.monthStarted} onChange={(e) => setValues({ ...values, monthStarted: e.target.value })} />
      </Field>
      <Field label="Target Monthly Income (₹)">
        <Input type="number" value={values.targetMonthlyIncome || ''} onChange={(e) => setValues({ ...values, targetMonthlyIncome: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Growth Rate (% per month)">
        <Input type="number" step="0.1" value={values.growthRatePercentPerMonth || ''} onChange={(e) => setValues({ ...values, growthRatePercentPerMonth: parseFloat(e.target.value) || 0 })} />
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
