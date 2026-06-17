import { useState } from 'react';
import type { MutualFund, FundType, InvestmentMode } from '../../types/financial';
import { Field, Input, Select, FormActions } from '../ui/FormField';

type MFFormValues = Omit<MutualFund, 'id' | 'createdAt' | 'updatedAt'>;

interface AddMFFormProps {
  initial?: MFFormValues;
  onSubmit: (values: MFFormValues) => void;
  onCancel: () => void;
}

const defaults: MFFormValues = {
  fundName: '',
  fundType: 'Equity',
  investmentMode: 'SIP',
  monthlySipAmount: 0,
  lumpsumAmount: 0,
  startDate: new Date().toISOString().slice(0, 10),
  currentNav: 0,
  unitsHeld: 0,
  expectedAnnualReturn: 12,
  lockInEndDate: undefined,
};

export function AddMFForm({ initial, onSubmit, onCancel }: AddMFFormProps) {
  const [values, setValues] = useState<MFFormValues>(initial || defaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Fund Name">
        <Input required value={values.fundName} onChange={(e) => setValues({ ...values, fundName: e.target.value })} placeholder="e.g. Axis Bluechip Fund" />
      </Field>
      <Field label="Fund Type">
        <Select value={values.fundType} onChange={(e) => setValues({ ...values, fundType: e.target.value as FundType })}>
          <option value="Equity">Equity</option>
          <option value="Debt">Debt</option>
          <option value="Hybrid">Hybrid</option>
          <option value="ELSS">ELSS</option>
        </Select>
      </Field>
      <Field label="Investment Mode">
        <Select value={values.investmentMode} onChange={(e) => setValues({ ...values, investmentMode: e.target.value as InvestmentMode })}>
          <option value="SIP">SIP</option>
          <option value="Lumpsum">Lumpsum</option>
        </Select>
      </Field>
      {values.investmentMode === 'SIP' ? (
        <Field label="Monthly SIP Amount (₹)">
          <Input type="number" value={values.monthlySipAmount || ''} onChange={(e) => setValues({ ...values, monthlySipAmount: parseFloat(e.target.value) || 0 })} />
        </Field>
      ) : (
        <Field label="Lumpsum Amount (₹)">
          <Input type="number" value={values.lumpsumAmount || ''} onChange={(e) => setValues({ ...values, lumpsumAmount: parseFloat(e.target.value) || 0 })} />
        </Field>
      )}
      <Field label="Start Date">
        <Input type="date" required value={values.startDate} onChange={(e) => setValues({ ...values, startDate: e.target.value })} />
      </Field>
      <Field label="Current NAV (₹)">
        <Input type="number" step="0.01" value={values.currentNav || ''} onChange={(e) => setValues({ ...values, currentNav: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Units Held">
        <Input type="number" step="0.001" value={values.unitsHeld || ''} onChange={(e) => setValues({ ...values, unitsHeld: parseFloat(e.target.value) || 0 })} />
      </Field>
      <Field label="Expected Annual Return (%)">
        <Input type="number" step="0.1" value={values.expectedAnnualReturn || ''} onChange={(e) => setValues({ ...values, expectedAnnualReturn: parseFloat(e.target.value) || 0 })} />
      </Field>
      {values.fundType === 'ELSS' && (
        <Field label="Lock-in End Date">
          <Input type="date" value={values.lockInEndDate || ''} onChange={(e) => setValues({ ...values, lockInEndDate: e.target.value })} />
        </Field>
      )}
      <FormActions onCancel={onCancel} />
    </form>
  );
}
