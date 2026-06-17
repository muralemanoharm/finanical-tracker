import { useState } from 'react';
import type { FD, InterestPayoutType } from '../../types/financial';
import { Field, Input, Select, FormActions } from '../ui/FormField';

type FDFormValues = Omit<FD, 'id' | 'createdAt' | 'updatedAt'>;

interface AddFDFormProps {
  initial?: FDFormValues;
  onSubmit: (values: FDFormValues) => void;
  onCancel: () => void;
}

const defaults: FDFormValues = {
  bankName: '',
  principalAmount: 0,
  interestRate: 7,
  tenureMonths: 12,
  startDate: new Date().toISOString().slice(0, 10),
  payoutType: 'Cumulative',
};

export function AddFDForm({ initial, onSubmit, onCancel }: AddFDFormProps) {
  const [values, setValues] = useState<FDFormValues>(initial || defaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Bank Name">
        <Input required value={values.bankName} onChange={(e) => setValues({ ...values, bankName: e.target.value })} placeholder="e.g. HDFC Bank" />
      </Field>
      <Field label="Principal Amount (₹)">
        <Input type="number" value={values.principalAmount || ''} onChange={(e) => setValues({ ...values, principalAmount: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Interest Rate (% annual)">
        <Input type="number" step="0.1" value={values.interestRate || ''} onChange={(e) => setValues({ ...values, interestRate: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Tenure (months)">
        <Input type="number" value={values.tenureMonths || ''} onChange={(e) => setValues({ ...values, tenureMonths: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Start Date">
        <Input type="date" required value={values.startDate} onChange={(e) => setValues({ ...values, startDate: e.target.value })} />
      </Field>
      <Field label="Interest Payout Type">
        <Select value={values.payoutType} onChange={(e) => setValues({ ...values, payoutType: e.target.value as InterestPayoutType })}>
          <option value="Cumulative">Cumulative</option>
          <option value="Monthly">Monthly</option>
        </Select>
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
