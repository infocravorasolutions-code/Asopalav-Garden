export default function AutoStepInSwitch({ checked, onChange, disabled = false, showLabel = true }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Auto Step-In"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 disabled:opacity-50"
    >
      <span className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
      {showLabel && <span className="text-sm font-medium text-gray-800">Auto Step-In</span>}
      <span className={`text-xs font-semibold ${checked ? 'text-green-700' : 'text-gray-500'}`}>
        {checked ? 'On' : 'Off'}
      </span>
    </button>
  );
}
