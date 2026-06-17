import { useState } from 'react';
import type { EPFPPF, EPFPPFAccountType } from '../../types/financial';
import { Field, Input, Select, FormActions } from '../ui/FormField';

type EPFPPFFormValues = Omit<EPFPPF, 'id' | 'createdAt' | 'updatedAt'>;

interface AddEPFPPFFormProps {
  initial?: EPFPPFFormValues;
  onSubmit: (values: EPFPPFFormValues) => void;
  onCancel: () => void;
}

const defaultReturnFor = (type: EPFPPFAccountType) => (type === 'PPF' ? 7.1 : 8.25);

const defaults: EPFPPFFormValues = {
  accountType: 'EPF',
  currentBalance: 0,
  monthlyContribution: 0,
  expectedReturn: defaultReturnFor('EPF'),
  maturityYear: new Date().getFullYear() + 20,
};

export function AddEPFPPFForm({ initial, onSubmit, onCancel }: AddEPFPPFFormProps) {
  const [values, setValues] = useState<EPFPPFFormValues>(initial || defaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Account Type">
        <Select
          value={values.accountType}
          onChange={(e) => {
            const accountType = e.target.value as EPFPPFAccountType;
            setValues({ ...values, accountType, expectedReturn: defaultReturnFor(accountType) });
          }}
        >
          <option value="EPF">EPF</option>
          <option value="PPF">PPF</option>
        </Select>
      </Field>
      <Field label="Current Balance (₹)">
        <Input type="number" value={values.currentBalance || ''} onChange={(e) => setValues({ ...values, currentBalance: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Monthly Contribution (₹)">
        <Input type="number" value={values.monthlyContribution || ''} onChange={(e) => setValues({ ...values, monthlyContribution: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Expected Return (%)">
        <Input type="number" step="0.1" value={values.expectedReturn || ''} onChange={(e) => setValues({ ...values, expectedReturn: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Maturity / Withdrawal Year">
        <Input type="number" value={values.maturityYear || ''} onChange={(e) => setValues({ ...values, maturityYear: parseInt(e.target.value) || 0 })} />
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
