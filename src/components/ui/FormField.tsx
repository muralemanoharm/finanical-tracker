import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react';

const inputBase = 'w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-accent/50';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm text-slate-300 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className || ''}`} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputBase} ${props.className || ''}`}>
      {children}
    </select>
  );
}

export function FormActions({ onCancel, submitLabel = 'Save' }: { onCancel: () => void; submitLabel?: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="submit" className="flex-1 bg-cyan-accent text-navy-950 font-medium rounded-lg py-2.5 text-sm hover:bg-cyan-300 transition-colors">
        {submitLabel}
      </button>
      <button type="button" onClick={onCancel} className="flex-1 bg-navy-700 text-slate-200 font-medium rounded-lg py-2.5 text-sm hover:bg-navy-600 transition-colors">
        Cancel
      </button>
    </div>
  );
}
