import { useState } from 'react';
import type { Goal } from '../../types/financial';
import { Field, Input, FormActions } from '../ui/FormField';

export interface InstrumentOption {
  id: string;
  label: string;
}

type GoalFormValues = Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'reviewed'>;

interface GoalFormProps {
  initial?: GoalFormValues;
  options: InstrumentOption[];
  onSubmit: (values: GoalFormValues) => void;
  onCancel: () => void;
}

const defaults: GoalFormValues = {
  goalName: '',
  targetAmount: 0,
  targetDate: new Date().toISOString().slice(0, 10),
  linkedInstrumentIds: [],
};

export function GoalForm({ initial, options, onSubmit, onCancel }: GoalFormProps) {
  const [values, setValues] = useState<GoalFormValues>(initial || defaults);

  const toggleInstrument = (id: string) => {
    setValues((prev) => ({
      ...prev,
      linkedInstrumentIds: prev.linkedInstrumentIds.includes(id)
        ? prev.linkedInstrumentIds.filter((i) => i !== id)
        : [...prev.linkedInstrumentIds, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Goal Name">
        <Input required value={values.goalName} onChange={(e) => setValues({ ...values, goalName: e.target.value })} placeholder="e.g. Child's Education" />
      </Field>
      <Field label="Target Amount (₹)">
        <Input type="number" value={values.targetAmount || ''} onChange={(e) => setValues({ ...values, targetAmount: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Target Date">
        <Input type="date" required value={values.targetDate} onChange={(e) => setValues({ ...values, targetDate: e.target.value })} />
      </Field>
      <Field label="Linked Instruments">
        {options.length === 0 ? (
          <p className="text-sm text-slate-500">No instruments to link yet — add some on the Instruments page.</p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1 border border-navy-600 rounded-lg p-2">
            {options.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-300 px-2 py-1.5 rounded-md hover:bg-navy-700 cursor-pointer">
                <input type="checkbox" checked={values.linkedInstrumentIds.includes(opt.id)} onChange={() => toggleInstrument(opt.id)} className="accent-cyan-500" />
                {opt.label}
              </label>
            ))}
          </div>
        )}
      </Field>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
