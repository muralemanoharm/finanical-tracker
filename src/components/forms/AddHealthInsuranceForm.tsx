import { useState } from 'react';
import type { HealthInsurance, CoverageType } from '../../types/financial';
import { Field, Input, Select, FormActions } from '../ui/FormField';

type HealthInsuranceFormValues = Omit<HealthInsurance, 'id' | 'createdAt' | 'updatedAt'>;

interface AddHealthInsuranceFormProps {
  initial?: HealthInsuranceFormValues;
  onSubmit: (values: HealthInsuranceFormValues) => void;
  onCancel: () => void;
}

const defaults: HealthInsuranceFormValues = {
  insurerName: '',
  planName: '',
  sumInsured: 500000,
  annualPremium: 0,
  policyStartDate: new Date().toISOString().slice(0, 10),
  renewalDate: new Date().toISOString().slice(0, 10),
  coverageType: 'Individual',
  membersCovered: [],
  noClaimBonusPercent: 0,
  waitingPeriodMonths: 0,
};

export function AddHealthInsuranceForm({ initial, onSubmit, onCancel }: AddHealthInsuranceFormProps) {
  const [values, setValues] = useState<HealthInsuranceFormValues>(initial || defaults);
  const [membersText, setMembersText] = useState((initial?.membersCovered || []).join(', '));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...values, membersCovered: membersText.split(',').map((m) => m.trim()).filter(Boolean) });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Insurer Name">
        <Input required value={values.insurerName} onChange={(e) => setValues({ ...values, insurerName: e.target.value })} />
      </Field>
      <Field label="Plan Name">
        <Input required value={values.planName} onChange={(e) => setValues({ ...values, planName: e.target.value })} />
      </Field>
      <Field label="Sum Insured (₹)">
        <Input type="number" value={values.sumInsured || ''} onChange={(e) => setValues({ ...values, sumInsured: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Annual Premium (₹)">
        <Input type="number" value={values.annualPremium || ''} onChange={(e) => setValues({ ...values, annualPremium: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Policy Start Date">
        <Input type="date" required value={values.policyStartDate} onChange={(e) => setValues({ ...values, policyStartDate: e.target.value })} />
      </Field>
      <Field label="Renewal Date">
        <Input type="date" required value={values.renewalDate} onChange={(e) => setValues({ ...values, renewalDate: e.target.value })} />
      </Field>
      <Field label="Coverage Type">
        <Select value={values.coverageType} onChange={(e) => setValues({ ...values, coverageType: e.target.value as CoverageType })}>
          <option value="Individual">Individual</option>
          <option value="Family Floater">Family Floater</option>
        </Select>
      </Field>
      <Field label="Members Covered (comma-separated)">
        <Input value={membersText} onChange={(e) => setMembersText(e.target.value)} placeholder="e.g. Self, Spouse, Child" />
      </Field>
      <Field label="No-claim Bonus (%)">
        <Input type="number" value={values.noClaimBonusPercent || ''} onChange={(e) => setValues({ ...values, noClaimBonusPercent: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Waiting Period (months)">
        <Input type="number" value={values.waitingPeriodMonths || ''} onChange={(e) => setValues({ ...values, waitingPeriodMonths: parseFloat(e.target.value) || 0 })} />
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
