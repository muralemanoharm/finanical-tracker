import { useState } from 'react';
import type { SkillInvestment, SkillStatus } from '../../types/career';
import { Field, Input, Select, FormActions } from '../ui/FormField';

type SkillFormValues = Omit<SkillInvestment, 'id' | 'createdAt'>;

interface AddSkillFormProps {
  initial?: SkillFormValues;
  onSubmit: (values: SkillFormValues) => void;
  onCancel: () => void;
}

const STATUSES: SkillStatus[] = ['Planned', 'In Progress', 'Completed'];

const defaults: SkillFormValues = {
  name: '',
  cost: 0,
  hoursInvested: 0,
  expectedAnnualUplift: 0,
  status: 'Planned',
};

export function AddSkillForm({ initial, onSubmit, onCancel }: AddSkillFormProps) {
  const [values, setValues] = useState<SkillFormValues>(initial || defaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Skill / Course Name">
        <Input required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="e.g. AWS Certification" />
      </Field>
      <Field label="Cost (₹)">
        <Input type="number" value={values.cost || ''} onChange={(e) => setValues({ ...values, cost: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Time Invested (hours)">
        <Input type="number" value={values.hoursInvested || ''} onChange={(e) => setValues({ ...values, hoursInvested: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Expected Salary Uplift (₹/year)">
        <Input type="number" value={values.expectedAnnualUplift || ''} onChange={(e) => setValues({ ...values, expectedAnnualUplift: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Status">
        <Select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value as SkillStatus })}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
