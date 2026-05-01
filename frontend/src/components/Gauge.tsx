import { useEffect, useRef } from 'react';

interface GaugeProps {
  percentage: number;
  total: number;
  daily: number;
  status: 'healthy' | 'caution' | 'danger';
  color: string;
}

export function Gauge({ percentage, total, daily, status, color }: GaugeProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (circleRef.current) {
      const circumference = 2 * Math.PI * 45;
      const offset = circumference - (percentage / 100) * circumference;
      circleRef.current.style.strokeDashoffset = String(offset);
    }
  }, [percentage]);

  const statusLabels = { healthy: 'On Track', caution: 'Watch Out', danger: 'Over Budget' };

  return (
    <div className="card-glass" style={{ textAlign: 'center', padding: '24px 16px' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
        Safe to Spend
      </div>

      <svg width="180" height="110" viewBox="0 0 120 70" style={{ margin: '0 auto', display: 'block' }}>
        {/* Background arc */}
        <path
          d="M 15 65 A 45 45 0 0 1 105 65"
          fill="none"
          stroke="var(--bg-input)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 15 65 A 45 45 0 0 1 105 65"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="141.37"
          strokeDashoffset={141.37 - (percentage / 100) * 141.37}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
        {/* Center text */}
        <text x="60" y="48" textAnchor="middle" fill="var(--text-primary)" fontFamily="var(--font-mono)" fontSize="18" fontWeight="800">
          ${Math.abs(total).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </text>
        <text x="60" y="63" textAnchor="middle" fill="var(--text-muted)" fontFamily="var(--font-primary)" fontSize="7">
          ${daily.toFixed(0)}/day remaining
        </text>
      </svg>

      <span className={`badge badge-${status}`} style={{ marginTop: 8 }}>
        {statusLabels[status]}
      </span>
    </div>
  );
}
