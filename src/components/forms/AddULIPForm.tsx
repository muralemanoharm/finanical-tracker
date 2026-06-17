import { useState } from 'react';
import type { ULIP, ULIPFundType } from '../../types/financial';
import { Field, Input, Select, FormActions } from '../ui/FormField';

type ULIPFormValues = Omit<ULIP, 'id' | 'createdAt' | 'updatedAt'>;

interface AddULIPFormProps {
  initial?: ULIPFormValues;
  onSubmit: (values: ULIPFormValues) => void;
  onCancel: () => void;
}

const defaults: ULIPFormValues = {
  policyName: '',
  insurer: '',
  annualPremium: 0,
  policyStartDate: new Date().toISOString().slice(0, 10),
  policyTermYears: 15,
  lockInPeriodYears: 5,
  currentFundValue: 0,
  fundType: 'Balanced',
  expectedReturn: 10,
  mortalityCharges: 1,
  fundManagementCharges: 1.35,
};

export function AddULIPForm({ initial, onSubmit, onCancel }: AddULIPFormProps) {
  const [values, setValues] = useState<ULIPFormValues>(initial || defaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Policy Name">
        <Input required value={values.policyName} onChange={(e) => setValues({ ...values, policyName: e.target.value })} />
      </Field>
      <Field label="Insurer">
        <Input required value={values.insurer} onChange={(e) => setValues({ ...values, insurer: e.target.value })} />
      </Field>
      <Field label="Annual Premium (₹)">
        <Input type="number" value={values.annualPremium || ''} onChange={(e) => setValues({ ...values, annualPremium: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Policy Start Date">
        <Input type="date" required value={values.policyStartDate} onChange={(e) => setValues({ ...values, policyStartDate: e.target.value })} />
      </Field>
      <Field label="Policy Term (years)">
        <Input type="number" value={values.policyTermYears || ''} onChange={(e) => setValues({ ...values, policyTermYears: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Lock-in Period (years)">
        <Input type="number" value={values.lockInPeriodYears || ''} onChange={(e) => setValues({ ...values, lockInPeriodYears: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Current Fund Value (₹)">
        <Input type="number" value={values.currentFundValue || ''} onChange={(e) => setValues({ ...values, currentFundValue: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Fund Type">
        <Select value={values.fundType} onChange={(e) => setValues({ ...values, fundType: e.target.value as ULIPFundType })}>
          <option value="Equity">Equity</option>
          <option value="Debt">Debt</option>
          <option value="Balanced">Balanced</option>
        </Select>
      </Field>
      <Field label="Expected Return (%)">
        <Input type="number" step="0.1" value={values.expectedReturn || ''} onChange={(e) => setValues({ ...values, expectedReturn: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Mortality Charges (%)">
        <Input type="number" step="0.1" value={values.mortalityCharges || ''} onChange={(e) => setValues({ ...values, mortalityCharges: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Fund Management Charges (%)">
        <Input type="number" step="0.1" value={values.fundManagementCharges || ''} onChange={(e) => setValues({ ...values, fundManagementCharges: parseFloat(e.target.value) || 0 })} />
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
