/**
 * Button — IBM Carbon / WCAG 2.1 AA compliant
 * · No scale-on-hover (enterprise convention)
 * · Proper focus rings for keyboard navigation
 * · 8-px grid sizing
 */
const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
  icon,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1';

  const variants = {
    primary:   'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm',
    secondary: 'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm',
    danger:    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm',
    success:   'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm',
    outline:   'border-2 border-primary-600 text-primary-700 hover:bg-primary-50 active:bg-primary-100',
    ghost:     'text-gray-600 hover:bg-gray-100 active:bg-gray-200 hover:text-gray-900',
  };

  // 8-px grid sizing
  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0 flex items-center">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
