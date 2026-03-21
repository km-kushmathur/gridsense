export function AnimatedContent({ children, className = '', delay = 0, as: Tag = 'div' }) {
  return (
    <Tag
      className={className}
      style={{
        animation: `revealUp 0.65s ease-out ${delay}ms both`,
      }}
    >
      {children}
    </Tag>
  );
}
