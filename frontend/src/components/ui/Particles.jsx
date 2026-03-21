const PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  left: `${6 + ((index * 17) % 88)}%`,
  top: `${8 + ((index * 11) % 72)}%`,
  size: 2 + (index % 4),
  delay: index * 220,
  duration: 4200 + (index % 5) * 600,
}));

export function Particles({ className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-grid-clean/40"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            boxShadow: '0 0 14px rgba(34, 197, 94, 0.22)',
            animation: `floatParticle ${particle.duration}ms linear ${particle.delay}ms infinite`,
          }}
        />
      ))}
    </div>
  );
}
