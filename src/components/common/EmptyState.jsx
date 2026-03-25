/**
 * EmptyState — full-bleed atmospheric background (Steps.png) with gradient overlay.
 * Pass `image` to override the default background (accepts any public/ path).
 */
const EmptyState = ({ icon, title, description, actionLabel, onAction, image = '/Steps%20.png' }) => (
  <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: '200px' }}>
    {/* Background art */}
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url('${image}')`, filter: 'brightness(0.35)' }}
    />
    {/* Bottom-up gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent" />

    {/* Content */}
    <div className="relative flex flex-col items-center justify-center text-center py-14 px-6 h-full" style={{ minHeight: '200px' }}>
      {icon && (
        <div className="mb-3 p-3 bg-white/10 backdrop-blur-sm rounded-2xl text-white/70">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-white/75 max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

export default EmptyState;
