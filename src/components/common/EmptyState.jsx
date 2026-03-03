const EmptyState = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {icon && (
      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400 dark:text-gray-500">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>
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
);

export default EmptyState;
