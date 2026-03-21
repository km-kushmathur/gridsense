export function GradientText({ children, className = '' }) {
  return (
    <span
      className={`bg-[linear-gradient(120deg,#22c55e_0%,#7dd3fc_45%,#38bdf8_65%,#22c55e_100%)] bg-[length:220%_220%] bg-clip-text text-transparent ${className}`}
      style={{ animation: 'gradientPan 7s ease infinite' }}
    >
      {children}
    </span>
  );
}
