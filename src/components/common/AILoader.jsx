const sizeMap = {
  sm: { container: 'gap-1.5', brain: 'w-4 h-4', dot: 'w-1 h-1', text: 'text-xs' },
  md: { container: 'gap-2',   brain: 'w-6 h-6', dot: 'w-1.5 h-1.5', text: 'text-sm' },
  lg: { container: 'gap-3',   brain: 'w-8 h-8', dot: 'w-2 h-2', text: 'text-base' },
};

const AILoader = ({ label = 'Thinking…', size = 'md' }) => {
  const s = sizeMap[size] || sizeMap.md;
  return (
    <div className={`flex items-center ${s.container} text-primary-600`}>
      {/* Pulsing brain icon */}
      <svg
        className={`${s.brain} animate-pulse`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 2C8.5 2 6 4.5 6 7c0 1.1.3 2.1.9 3C5.3 10.6 4 12.2 4 14c0 2.8 2.2 5 5 5h6c2.8 0 5-2.2 5-5 0-1.8-1.3-3.4-2.9-4 .6-.9.9-1.9.9-3 0-2.5-2.5-5-6-5z" />
      </svg>
      {/* Animated dots */}
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className={`${s.dot} rounded-full bg-current animate-bounce`}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      {label && <span className={`${s.text} font-medium text-gray-600 dark:text-gray-300`}>{label}</span>}
    </div>
  );
};

export default AILoader;
