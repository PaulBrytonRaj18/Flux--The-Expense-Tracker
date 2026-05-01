import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api } from '../api/client';
import type { Insights as InsightsData } from '../api/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export function Insights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<'roi' | 'opportunity' | 'ghosts'>('roi');

  const fetchData = () => {
    setLoading(true);
    setError(false);
    api.getInsights().then(setData).catch(() => setError(true)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, animation: 'pulse 1.5s infinite' }}>🧠</div>
          <p className="text-muted">Analyzing your spending patterns...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Failed to load insights</p>
          <button className="btn btn-primary" onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  const oppChartData = {
    labels: data.opportunity_costs.map((c) => c.category),
    datasets: [
      {
        label: 'Spent',
        data: data.opportunity_costs.map((c) => c.total_spent),
        backgroundColor: 'rgba(255, 23, 68, 0.6)',
        borderRadius: 4,
      },
      {
        label: 'Could Be Worth',
        data: data.opportunity_costs.map((c) => c.projected_value),
        backgroundColor: 'rgba(0, 230, 118, 0.6)',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Insights</h1>
        <p>Understand your spending psychology</p>
      </div>

      {/* Tab bar */}
      <div className="chips-row" style={{ paddingBottom: 0, marginBottom: 20 }} role="tablist">
        <button className={`chip ${tab === 'roi' ? 'active' : ''}`} onClick={() => setTab('roi')} role="tab" aria-selected={tab === 'roi'}>
          💎 Joy per Dollar
        </button>
        <button className={`chip ${tab === 'opportunity' ? 'active' : ''}`} onClick={() => setTab('opportunity')} role="tab" aria-selected={tab === 'opportunity'}>
          📈 Opportunity Cost
        </button>
        <button className={`chip ${tab === 'ghosts' ? 'active' : ''}`} onClick={() => setTab('ghosts')} role="tab" aria-selected={tab === 'ghosts'}>
          👻 Ghost Hunter
        </button>
      </div>

      {/* TAB: Emotional ROI */}
      {tab === 'roi' && (
        <div role="tabpanel" aria-label="Joy per Dollar">
          <p className="text-sm text-muted mb-lg">
            Categories ranked by happiness per dollar spent. Higher = more joy for your money.
          </p>
          {data.emotional_roi.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
              <p className="text-muted">No data yet — add some expenses first!</p>
            </div>
          ) : (
            data.emotional_roi.map((item, i) => (
              <div key={item.category} className="roi-item">
                <div className="roi-rank">#{i + 1}</div>
                <div className="roi-icon">{item.icon}</div>
                <div className="roi-info">
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.category}</div>
                  <div className="text-sm text-muted">
                    Avg: {'⭐'.repeat(Math.round(item.avg_satisfaction))} • <span className="sensitive">${item.total_spent.toFixed(0)}</span> spent
                  </div>
                </div>
                <div className="roi-score" style={{ color: item.joy_per_dollar > 1 ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                  {item.joy_per_dollar.toFixed(1)}
                  <span className="text-sm text-muted" style={{ display: 'block', fontSize: '0.625rem' }}>joy/$</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: Opportunity Cost */}
      {tab === 'opportunity' && (
        <div role="tabpanel" aria-label="Opportunity Cost">
          <p className="text-sm text-muted mb-lg">
            What your spending could have become if invested at compound growth.
          </p>

          {data.opportunity_costs.length > 0 && (
            <div className="chart-container mb-lg" style={{ height: 280 }}>
              <Bar
                data={oppChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: {
                    tooltip: {
                      backgroundColor: '#1a1f2e',
                      borderColor: 'rgba(0, 229, 255, 0.3)',
                      borderWidth: 1,
                      titleColor: '#f0f4ff',
                      bodyColor: '#8892b0',
                      callbacks: {
                        label: (ctx: any) => ` $${ctx.parsed.x.toLocaleString()}`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: '#5a6380', callback: (v: any) => `$${v.toLocaleString()}`, font: { size: 10 } },
                      grid: { color: 'rgba(255,255,255,0.04)' },
                    },
                    y: {
                      ticks: { color: '#8892b0', font: { size: 11 } },
                      grid: { display: false },
                    },
                  },
                }}
              />
            </div>
          )}

          {data.opportunity_costs.map((item) => (
            <div key={item.category} className="card mb-sm" style={{ padding: 16 }}>
              <div className="flex items-center justify-between">
                <span style={{ fontWeight: 500 }}>{item.category}</span>
                <span className="text-mono text-sm sensitive" style={{ color: 'var(--neon-red)' }}>
                  -${item.total_spent.toLocaleString()}
                </span>
              </div>
              <div className="text-sm" style={{ color: 'var(--neon-green)', marginTop: 4 }}>
                Could be worth <span className="text-mono sensitive">${item.projected_value.toLocaleString()}</span> in {item.years_to_grow} years
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Ghost Hunter */}
      {tab === 'ghosts' && (
        <div role="tabpanel" aria-label="Ghost Hunter">
          <p className="text-sm text-muted mb-lg">
            Subscriptions where your satisfaction is declining — time to cancel?
          </p>

          {data.ghost_subscriptions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <p style={{ fontWeight: 600 }}>No ghosts found!</p>
              <p className="text-sm text-muted">All your subscriptions still bring you joy.</p>
            </div>
          ) : (
            data.ghost_subscriptions.map((ghost) => (
              <div key={ghost.recurring_id} className="ghost-card mb-md">
                <div className="flex items-center justify-between mb-sm">
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{ghost.description}</span>
                  <span className="text-mono sensitive" style={{ color: 'var(--neon-red)', fontWeight: 700, fontSize: '1.125rem' }}>
                    ${ghost.monthly_cost}/mo
                  </span>
                </div>

                <div className="text-sm mb-sm">
                  <span className="text-muted">Category:</span> {ghost.category}
                </div>

                <div className="text-sm mb-sm">
                  <span className="text-muted">Satisfaction trend:</span>{' '}
                  {ghost.satisfaction_trend.map((s, i) => (
                    <span key={i}>
                      {i > 0 && ' → '}
                      <span style={{ color: s >= 3 ? 'var(--neon-green)' : s >= 2 ? 'var(--neon-amber)' : 'var(--neon-red)' }}>
                        {s}★
                      </span>
                    </span>
                  ))}
                </div>

                <div className="opp-cost-card" style={{ padding: 12, marginTop: 8 }}>
                  <span className="text-sm">Cancel to save </span>
                  <span className="text-mono sensitive" style={{ color: 'var(--neon-green)', fontWeight: 700 }}>
                    ${ghost.annual_cost.toFixed(0)}/year
                  </span>
                </div>

                <div className="text-sm" style={{ color: 'var(--neon-amber)', marginTop: 8 }}>
                  💡 {ghost.recommendation}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
