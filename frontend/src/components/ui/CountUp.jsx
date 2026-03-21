import { useEffect, useState } from 'react';

export function CountUp({
  value = 0,
  duration = 1100,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  style = {},
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId;
    const start = performance.now();
    const startValue = displayValue;
    const endValue = Number(value) || 0;

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (endValue - startValue) * eased;
      setDisplayValue(nextValue);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return (
    <span className={className} style={style}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}
