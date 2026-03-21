export function ShinyText({ children, className = '' }) {
  return <span className={`text-shimmer ${className}`}>{children}</span>;
}
