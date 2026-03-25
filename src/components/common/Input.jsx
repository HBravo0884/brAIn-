/**
 * Input — WCAG 2.1 AA compliant form input
 * · Clear label hierarchy (uppercase tracked label)
 * · Teal (#097C87) focus ring
 * · Meaningful error state
 */
const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  hint,
  className = '',
  inputClassName = '',
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1 normal-case tracking-normal">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={[
          'w-full px-3 py-2',
          'text-sm text-gray-900 placeholder:text-gray-400',
          'bg-white',
          'border rounded-lg',
          'transition-colors duration-150',
          'outline-none',
          'hover:border-gray-400',
          'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300',
          inputClassName,
        ].join(' ')}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-gray-500 mt-1.5 leading-snug">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1.5 font-medium leading-snug flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};

export default Input;
