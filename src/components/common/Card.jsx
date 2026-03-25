/**
 * Card — Swiss Style "white space is structural"
 * · Uses the 5-color palette: teal primary, cyan/sage/salmon/yellow as accents
 * · Clear title/subtitle hierarchy
 * · Subtle layered shadow (IBM Carbon)
 */
const Card = ({
  children,
  title,
  subtitle,
  className = '',
  actions,
  noPadding = false,
  accent,        // 'primary'|'cyan'|'sage'|'salmon'|'yellow'|'danger' — left border accent
  flat = false,
  ...props
}) => {
  const accentMap = {
    primary: 'border-l-4 border-l-primary-600',
    cyan:    'border-l-4 border-l-cyan-400',
    sage:    'border-l-4 border-l-green-400',
    salmon:  'border-l-4 border-l-orange-400',
    yellow:  'border-l-4 border-l-yellow-400',
    danger:  'border-l-4 border-l-red-500',
    success: 'border-l-4 border-l-green-500',
    warning: 'border-l-4 border-l-yellow-400',
  };

  return (
    <div
      className={`rounded-xl bg-white border border-gray-200 ${noPadding ? '' : 'p-6'} ${accent ? accentMap[accent] ?? '' : ''} ${className}`}
      style={flat ? {} : { boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.06)' }}
      {...props}
    >
      {(title || actions) && (
        <div className={`flex items-start justify-between gap-3 ${noPadding ? 'px-6 pt-5' : ''} ${children ? 'mb-4' : ''}`}>
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-base font-semibold text-gray-900 leading-snug">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 leading-snug font-normal">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
