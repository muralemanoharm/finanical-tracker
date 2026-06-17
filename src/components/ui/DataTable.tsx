import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  keyFor: (row: T) => string;
}

export function DataTable<T>({ rows, columns, keyFor }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-navy-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-800 text-slate-400 text-left">
            {columns.map((col) => (
              <th key={col.header} className="px-4 py-3 font-medium whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyFor(row)} className="border-t border-navy-700 hover:bg-navy-800/60 transition-colors">
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-3 text-slate-200 whitespace-nowrap ${col.className || ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
