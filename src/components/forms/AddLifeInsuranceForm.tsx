import { useState } from 'react';
import type { LifeInsurance, LifePolicyType } from '../../types/financial';
import { Field, Input, Select, FormActions } from '../ui/FormField';

type LifeInsuranceFormValues = Omit<LifeInsurance, 'id' | 'createdAt' | 'updatedAt'>;

interface AddLifeInsuranceFormProps {
  initial?: LifeInsuranceFormValues;
  onSubmit: (values: LifeInsuranceFormValues) => void;
  onCancel: () => void;
}

const defaults: LifeInsuranceFormValues = {
  policyName: '',
  sumAssured: 0,
  annualPremium: 0,
  policyStartDate: new Date().toISOString().slice(0, 10),
  policyTermYears: 20,
  premiumPaymentTermYears: 20,
  policyType: 'Term',
};

export function AddLifeInsuranceForm({ initial, onSubmit, onCancel }: AddLifeInsuranceFormProps) {
  const [values, setValues] = useState<LifeInsuranceFormValues>(initial || defaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Policy Name">
        <Input required value={values.policyName} onChange={(e) => setValues({ ...values, policyName: e.target.value })} placeholder="e.g. Tata AIA Sampoorna Raksha" />
      </Field>
      <Field label="Sum Assured (₹)">
        <Input type="number" value={values.sumAssured || ''} onChange={(e) => setValues({ ...values, sumAssured: parseFloat(e.target.value) || 0 })} />
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
      <Field label="Premium Payment Term (years)">
        <Input type="number" value={values.premiumPaymentTermYears || ''} onChange={(e) => setValues({ ...values, premiumPaymentTermYears: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Policy Type">
        <Select value={values.policyType} onChange={(e) => setValues({ ...values, policyType: e.target.value as LifePolicyType })}>
          <option value="Term">Term</option>
          <option value="Endowment">Endowment</option>
          <option value="Money-back">Money-back</option>
        </Select>
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
