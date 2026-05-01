import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { api } from '../api/client';
import type { Dashboard as DashboardData, Goal } from '../api/client';
import { Gauge } from '../components/Gauge';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      api.getDashboard(),
      api.getGoals().catch(() => []),
    ])
      .then(([dashboard, goalsData]) => {
        setData(dashboard);
        setGoals(goalsData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>💰</div>
          <p className="text-muted">Loading your finances...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Failed to load dashboard</p>
          <p className="text-sm text-muted" style={{ marginBottom: 16 }}>Check that the backend server is running</p>
          <button className="btn btn-primary" onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  const { safe_to_spend, spending_summary, category_breakdown, spending_trend, ghost_alerts } = data;

  // Doughnut chart data
  const doughnutData = {
    labels: category_breakdown.map((c) => `${c.icon} ${c.name}`),
    datasets: [{
      data: category_breakdown.map((c) => c.amount),
      backgroundColor: category_breakdown.map((c) => c.color),
      borderWidth: 0,
      borderRadius: 4,
      spacing: 2,
    }],
  };

  // Line chart data
  const trendLabels = spending_trend.map((d) => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const lineData = {
    labels: trendLabels,
    datasets: [{
      label: 'Spending',
      data: spending_trend.map((d) => d.amount),
      borderColor: '#00e5ff',
      backgroundColor: 'rgba(0, 229, 255, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#00e5ff',
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1f2e',
        borderColor: 'rgba(0, 229, 255, 0.3)',
        borderWidth: 1,
        titleColor: '#f0f4ff',
        bodyColor: '#8892b0',
        callbacks: {
          label: (ctx: any) => `$${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        ticks: { color: '#5a6380', maxTicksLimit: 7, font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        display: true,
        ticks: { color: '#5a6380', callback: (v: any) => `$${v}`, font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
    },
  };

  return (
    <div className="page-content">
      {/* Safe-to-Spend Gauge */}
      <Gauge
        percentage={safe_to_spend.percentage}
        total={safe_to_spend.total}
        daily={safe_to_spend.daily}
        status={safe_to_spend.status}
        color={safe_to_spend.color}
      />

      {/* Spending Summary */}
      <div className="summary-grid" style={{ marginTop: 16 }}>
        <div className="summary-card">
          <div className="label">Today</div>
          <div className="value sensitive" style={{ color: 'var(--neon-cyan)' }}>
            ${spending_summary.today.toFixed(0)}
          </div>
        </div>
        <div className="summary-card">
          <div className="label">This Week</div>
          <div className="value sensitive" style={{ color: 'var(--neon-amber)' }}>
            ${spending_summary.this_week.toFixed(0)}
          </div>
        </div>
        <div className="summary-card">
          <div className="label">This Month</div>
          <div className="value sensitive" style={{ color: 'var(--neon-magenta)' }}>
            ${spending_summary.this_month.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Goals Progress Widget */}
      {goals.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 className="section-title mb-md">🎯 Savings Goals</h3>
          {goals.slice(0, 3).map((goal) => {
            const pct = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
            return (
              <div key={goal.id} className="card" style={{ padding: '12px 16px', marginBottom: 8 }}>
                <div className="flex items-center justify-between mb-sm">
                  <div className="flex items-center gap-sm">
                    <span>{goal.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{goal.name}</span>
                  </div>
                  <span className="text-mono text-sm sensitive" style={{ color: 'var(--neon-green)' }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="fill"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? 'var(--neon-green)' : 'linear-gradient(90deg, var(--neon-cyan), var(--neon-blue))',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ghost Alerts */}
      {ghost_alerts.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="section-header">
            <h3 className="section-title">👻 Ghost Subscriptions</h3>
            <span className="badge badge-danger">{ghost_alerts.length} found</span>
          </div>
          {ghost_alerts.map((ghost) => (
            <div key={ghost.recurring_id} className="ghost-card" style={{ marginBottom: 8 }}>
              <div className="flex items-center justify-between mb-sm">
                <span style={{ fontWeight: 600 }}>{ghost.description}</span>
                <span className="text-mono sensitive" style={{ color: 'var(--neon-red)', fontWeight: 700 }}>
                  ${ghost.monthly_cost}/mo
                </span>
              </div>
              <div className="text-sm text-muted mb-sm">
                Satisfaction: {ghost.satisfaction_trend.map((s) => '⭐'.repeat(s)).join(' → ')}
              </div>
              <div className="text-sm" style={{ color: 'var(--neon-amber)' }}>
                {ghost.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Breakdown */}
      <div style={{ marginTop: 24 }}>
        <h3 className="section-title mb-md">📊 Category Breakdown</h3>
        {category_breakdown.length > 0 ? (
          <div className="chart-container" style={{ height: 240 }}>
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      color: '#8892b0',
                      font: { size: 11, family: 'Inter' },
                      padding: 8,
                      usePointStyle: true,
                      pointStyleWidth: 8,
                    },
                  },
                  tooltip: {
                    backgroundColor: '#1a1f2e',
                    borderColor: 'rgba(0, 229, 255, 0.3)',
                    borderWidth: 1,
                    titleColor: '#f0f4ff',
                    bodyColor: '#8892b0',
                    callbacks: {
                      label: (ctx: any) => ` $${ctx.parsed.toFixed(2)} (${category_breakdown[ctx.dataIndex]?.percentage}%)`,
                    },
                  },
                },
              }}
            />
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <p className="text-muted">No spending data this month yet</p>
          </div>
        )}
      </div>

      {/* Spending Trend */}
      <div style={{ marginTop: 24 }}>
        <h3 className="section-title mb-md">📈 30-Day Trend</h3>
        <div className="chart-container" style={{ height: 200 }}>
          <Line data={lineData} options={lineOptions as any} />
        </div>
      </div>
    </div>
  );
}
