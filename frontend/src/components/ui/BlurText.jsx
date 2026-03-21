export function BlurText({ children, className = '', delay = 0 }) {
  return (
    <div
      className={className}
      style={{
        animation: `blurIn 0.8s ease-out ${delay}ms both`,
      }}
    >
      {children}
    </div>
  );
}
