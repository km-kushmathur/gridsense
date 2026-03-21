export function SpotlightCard({ children, className = '' }) {
  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty('--spotlight-x', `${x}%`);
    event.currentTarget.style.setProperty('--spotlight-y', `${y}%`);
  }

  return (
    <div onPointerMove={handlePointerMove} className={`spotlight-card ${className}`}>
      {children}
    </div>
  );
}
