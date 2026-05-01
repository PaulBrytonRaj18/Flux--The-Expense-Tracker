import { useState, useEffect } from 'react';
import { MdAdd, MdClose, MdEdit, MdDelete } from 'react-icons/md';
import { api, showToast } from '../api/client';
import type { Goal } from '../api/client';

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '', deadline: '', icon: '🎯' });

  const ICONS = ['🎯', '✈️', '💻', '🛡️', '🏠', '🚗', '💍', '🎓', '🏖️', '💰'];

  const fetchGoals = () => {
    setLoading(true);
    setError(false);
    api.getGoals()
      .then(setGoals)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGoals(); }, []);

  const openCreate = () => {
    setEditingGoal(null);
    setForm({ name: '', target_amount: '', current_amount: '0', deadline: '', icon: '🎯' });
    setShowForm(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name,
      target_amount: String(goal.target_amount),
      current_amount: String(goal.current_amount),
      deadline: goal.deadline || '',
      icon: goal.icon,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      target_amount: parseFloat(form.target_amount) || 0,
      current_amount: parseFloat(form.current_amount) || 0,
      deadline: form.deadline || null,
      icon: form.icon,
    };
    try {
      if (editingGoal) {
        await api.updateGoal(editingGoal.id, payload);
        showToast('Goal updated!');
      } else {
        await api.createGoal(payload);
        showToast('Goal created!');
      }
      setShowForm(false);
      fetchGoals();
    } catch {
      showToast('Failed to save goal', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteGoal(id);
      showToast('Goal deleted');
      fetchGoals();
    } catch {
      showToast('Failed to delete goal', 'error');
    }
  };

  const getProgress = (goal: Goal) => Math.min(100, (goal.current_amount / goal.target_amount) * 100);

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, animation: 'pulse 1.5s infinite' }}>🎯</div>
          <p className="text-muted">Loading your goals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Failed to load goals</p>
          <button className="btn btn-primary" onClick={fetchGoals}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Goals</h1>
        <p>Track your savings targets</p>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="summary-grid" style={{ marginBottom: 20 }}>
          <div className="summary-card">
            <div className="label">Total Goals</div>
            <div className="value" style={{ color: 'var(--neon-cyan)' }}>{goals.length}</div>
          </div>
          <div className="summary-card">
            <div className="label">Saved</div>
            <div className="value sensitive" style={{ color: 'var(--neon-green)' }}>
              ${goals.reduce((s, g) => s + g.current_amount, 0).toLocaleString()}
            </div>
          </div>
          <div className="summary-card">
            <div className="label">Remaining</div>
            <div className="value sensitive" style={{ color: 'var(--neon-amber)' }}>
              ${goals.reduce((s, g) => s + Math.max(0, g.target_amount - g.current_amount), 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <p style={{ fontWeight: 600 }}>No goals yet</p>
          <p className="text-sm text-muted" style={{ marginBottom: 16 }}>Set a savings target to stay motivated</p>
          <button className="btn btn-primary" onClick={openCreate}>
            <MdAdd /> Create Goal
          </button>
        </div>
      ) : (
        <>
          {goals.map((goal) => {
            const pct = getProgress(goal);
            return (
              <div key={goal.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
                <div className="flex items-center justify-between mb-sm">
                  <div className="flex items-center gap-sm">
                    <span style={{ fontSize: '1.5rem' }}>{goal.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{goal.name}</div>
                      {goal.deadline && (
                        <div className="text-sm text-muted">Due {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-xs">
                    <button className="btn btn-icon btn-ghost" style={{ width: 32, height: 32, fontSize: '0.9rem' }} onClick={() => openEdit(goal)} aria-label={`Edit ${goal.name}`}>
                      <MdEdit />
                    </button>
                    <button className="btn btn-icon btn-ghost" style={{ width: 32, height: 32, fontSize: '0.9rem', color: 'var(--neon-red)' }} onClick={() => handleDelete(goal.id)} aria-label={`Delete ${goal.name}`}>
                      <MdDelete />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-sm">
                  <span className="text-mono text-sm sensitive" style={{ color: 'var(--neon-green)' }}>
                    ${goal.current_amount.toLocaleString()}
                  </span>
                  <span className="text-mono text-sm sensitive" style={{ color: 'var(--text-muted)' }}>
                    ${goal.target_amount.toLocaleString()}
                  </span>
                </div>

                <div className="progress-bar">
                  <div
                    className="fill"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 100
                        ? 'var(--neon-green)'
                        : pct >= 50
                        ? 'linear-gradient(90deg, var(--neon-cyan), var(--neon-green))'
                        : 'linear-gradient(90deg, var(--neon-cyan), var(--neon-blue))',
                    }}
                  />
                </div>
                <div className="text-sm text-muted" style={{ marginTop: 4, textAlign: 'right' }}>
                  {pct.toFixed(0)}% complete
                </div>
              </div>
            );
          })}

          <button className="btn btn-primary w-full" style={{ height: 48, marginTop: 8 }} onClick={openCreate}>
            <MdAdd /> Add New Goal
          </button>
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>{editingGoal ? 'Edit Goal' : 'New Goal'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowForm(false)} aria-label="Close">
                <MdClose />
              </button>
            </div>
            <div className="modal-body">
              {/* Icon picker */}
              <div className="text-sm text-muted mb-sm">Icon</div>
              <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    className={`category-item ${form.icon === icon ? 'selected' : ''}`}
                    style={{ padding: '8px 12px', minWidth: 'auto' }}
                    onClick={() => setForm({ ...form, icon })}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                  </button>
                ))}
              </div>

              <label className="text-sm text-muted" htmlFor="goal-name">Name</label>
              <input
                id="goal-name"
                className="input mb-md"
                placeholder="e.g. Japan Trip"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <label className="text-sm text-muted" htmlFor="goal-target">Target Amount</label>
              <input
                id="goal-target"
                className="input mb-md"
                type="number"
                placeholder="5000"
                value={form.target_amount}
                onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
              />

              <label className="text-sm text-muted" htmlFor="goal-current">Saved So Far</label>
              <input
                id="goal-current"
                className="input mb-md"
                type="number"
                placeholder="0"
                value={form.current_amount}
                onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
              />

              <label className="text-sm text-muted" htmlFor="goal-deadline">Deadline (optional)</label>
              <input
                id="goal-deadline"
                className="input mb-lg"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />

              <button
                className="btn btn-primary w-full"
                style={{ height: 48 }}
                onClick={handleSave}
                disabled={!form.name || !form.target_amount}
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
