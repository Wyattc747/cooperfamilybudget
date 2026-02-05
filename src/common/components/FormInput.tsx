import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

interface FormRowProps {
  label: string;
  children: ReactNode;
}

export function FormRow({ label, children }: FormRowProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputClasses = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <FormRow label={label}>
      <input className={`${inputClasses} ${className}`} {...props} />
    </FormRow>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <FormRow label={label}>
      <select className={`${inputClasses} ${className}`} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormRow>
  );
}

interface FormGroupProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export function FormGroup({ children, columns = 2 }: FormGroupProps) {
  const colClass =
    columns === 1 ? 'grid-cols-1' :
    columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    columns === 3 ? 'grid-cols-1 sm:grid-cols-3' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return <div className={`grid ${colClass} gap-4`}>{children}</div>;
}
