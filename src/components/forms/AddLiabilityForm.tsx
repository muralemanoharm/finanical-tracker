import { useState } from 'react';
import type { Liability, LoanType } from '../../types/financial';
import { Field, Input, Select, FormActions } from '../ui/FormField';

type LiabilityFormValues = Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>;

interface AddLiabilityFormProps {
  initial?: LiabilityFormValues;
  onSubmit: (values: LiabilityFormValues) => void;
  onCancel: () => void;
}

const defaults: LiabilityFormValues = {
  loanType: 'Home',
  lender: '',
  outstandingPrincipal: 0,
  emiAmount: 0,
  interestRate: 9,
  remainingTenureMonths: 12,
};

export function AddLiabilityForm({ initial, onSubmit, onCancel }: AddLiabilityFormProps) {
  const [values, setValues] = useState<LiabilityFormValues>(initial || defaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Loan Type">
        <Select value={values.loanType} onChange={(e) => setValues({ ...values, loanType: e.target.value as LoanType })}>
          <option value="Home">Home</option>
          <option value="Car">Car</option>
          <option value="Personal">Personal</option>
          <option value="Education">Education</option>
        </Select>
      </Field>
      <Field label="Lender">
        <Input required value={values.lender} onChange={(e) => setValues({ ...values, lender: e.target.value })} placeholder="e.g. SBI" />
      </Field>
      <Field label="Outstanding Principal (₹)">
        <Input type="number" value={values.outstandingPrincipal || ''} onChange={(e) => setValues({ ...values, outstandingPrincipal: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="EMI Amount (₹)">
        <Input type="number" value={values.emiAmount || ''} onChange={(e) => setValues({ ...values, emiAmount: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Interest Rate (% annual)">
        <Input type="number" step="0.1" value={values.interestRate || ''} onChange={(e) => setValues({ ...values, interestRate: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Remaining Tenure (months)">
        <Input type="number" value={values.remainingTenureMonths || ''} onChange={(e) => setValues({ ...values, remainingTenureMonths: parseFloat(e.target.value) || 0 })} />
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
