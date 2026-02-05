interface ToggleSwitchProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export default function ToggleSwitch({ options, value, onChange }: ToggleSwitchProps) {
  return (
    <div className="inline-flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            value === opt.value
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
