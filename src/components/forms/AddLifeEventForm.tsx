import { useState } from 'react';
import type { LifeEvent, LifeEventCategory } from '../../types/lifeTimeline';
import { Field, Input, Select, FormActions } from '../ui/FormField';

type LifeEventFormValues = Omit<LifeEvent, 'id'>;

interface AddLifeEventFormProps {
  initial?: LifeEventFormValues;
  onSubmit: (values: LifeEventFormValues) => void;
  onCancel: () => void;
}

const CATEGORIES: LifeEventCategory[] = ['Career', 'Personal', 'Travel', 'Education', 'Family'];

const defaults: LifeEventFormValues = {
  name: '',
  year: new Date().getFullYear(),
  category: 'Personal',
  estimatedCost: undefined,
  notes: '',
};

export function AddLifeEventForm({ initial, onSubmit, onCancel }: AddLifeEventFormProps) {
  const [values, setValues] = useState<LifeEventFormValues>(initial || defaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Event Name">
        <Input required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="e.g. Move Abroad" />
      </Field>
      <Field label="Year">
        <Input type="number" required value={values.year || ''} onChange={(e) => setValues({ ...values, year: parseInt(e.target.value, 10) || 0 })} />
      </Field>
      <Field label="Category">
        <Select value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value as LifeEventCategory })}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Estimated Cost (₹, optional)">
        <Input
          type="number"
          value={values.estimatedCost ?? ''}
          onChange={(e) => setValues({ ...values, estimatedCost: e.target.value ? parseFloat(e.target.value) || 0 : undefined })}
        />
      </Field>
      <Field label="Notes (optional)">
        <textarea
          value={values.notes || ''}
          onChange={(e) => setValues({ ...values, notes: e.target.value })}
          rows={3}
          className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-accent/50"
        />
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
