export function SkeletonCard({ className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ background: '#1A1D27', borderRadius: 6, ...style }}
    />
  );
}
