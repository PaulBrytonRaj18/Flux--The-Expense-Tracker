import { useState, useEffect, useCallback, useRef } from 'react';
import { MdSearch, MdFilterList, MdDelete } from 'react-icons/md';
import { api, showToast } from '../api/client';
import type { Expense, Category } from '../api/client';

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [regretFilter, setRegretFilter] = useState(false);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const fetchExpenses = useCallback(() => {
    setLoading(true);
    setError(false);
    api.getExpenses({
      regret: regretFilter,
      category_id: selectedCat || undefined,
      search: debouncedSearch || undefined,
    })
      .then(setExpenses)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [regretFilter, selectedCat, debouncedSearch]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}); }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.deleteExpense(id);
      showToast('Expense deleted');
      setConfirmDelete(null);
      fetchExpenses();
    } catch {
      showToast('Failed to delete expense', 'error');
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderStars = (score: number) => (
    <span className="stars" style={{ fontSize: '0.75rem' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ opacity: s <= score ? 1 : 0.2 }}>⭐</span>
      ))}
    </span>
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Expenses</h1>
        <p>{expenses.length} transactions</p>
      </div>

      {/* Search */}
      <div className="search-bar">
        <MdSearch className="icon" />
        <input
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search expenses"
        />
      </div>

      {/* Filters */}
      <div className="chips-row">
        <button
          className={`chip ${regretFilter ? 'active' : ''}`}
          onClick={() => setRegretFilter(!regretFilter)}
          aria-pressed={regretFilter}
        >
          <MdFilterList size={14} />
          {regretFilter ? '😔 Regret Only' : 'Regret Filter'}
        </button>
        <button
          className={`chip ${!selectedCat ? 'active' : ''}`}
          onClick={() => setSelectedCat(null)}
          aria-pressed={!selectedCat}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`chip ${selectedCat === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
            aria-pressed={selectedCat === cat.id}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Regret summary */}
      {regretFilter && expenses.length > 0 && (
        <div className="ghost-card mb-md" style={{ borderColor: 'rgba(255, 171, 0, 0.3)' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>😔 Low Satisfaction Purchases</div>
          <div className="text-sm text-muted">
            Total wasted: <span className="text-mono sensitive" style={{ color: 'var(--neon-red)', fontWeight: 700 }}>
              ${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
            </span> across {expenses.length} purchases
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Failed to load expenses</p>
          <button className="btn btn-primary" onClick={fetchExpenses}>Retry</button>
        </div>
      )}

      {/* Expense List */}
      {!error && (
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p className="text-muted">Loading...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <p className="text-muted">
                {regretFilter ? 'No regretted purchases! Great job!' : 'No expenses found'}
              </p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div
                  className="expense-icon"
                  style={{ background: `${expense.category.color}20` }}
                >
                  {expense.category.icon}
                </div>
                <div className="expense-details">
                  <div className="expense-desc">{expense.description}</div>
                  <div className="expense-meta">
                    {expense.category.name} • {formatDate(expense.date)} • {renderStars(expense.satisfaction_score)}
                  </div>
                </div>
                <div className="expense-amount sensitive" style={{
                  color: expense.satisfaction_score <= 2 ? 'var(--neon-red)' : 'var(--text-primary)'
                }}>
                  -${expense.amount.toFixed(2)}
                </div>
                <button
                  className="btn btn-icon btn-ghost expense-delete-btn"
                  onClick={() => setConfirmDelete(expense.id)}
                  aria-label={`Delete ${expense.description}`}
                  style={{ width: 32, height: 32, fontSize: '0.875rem', flexShrink: 0, color: 'var(--text-muted)' }}
                >
                  <MdDelete />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete !== null && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
              <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: 8 }}>Delete Expense?</p>
              <p className="text-sm text-muted" style={{ marginBottom: 24 }}>This action cannot be undone.</p>
              <div className="flex gap-sm">
                <button className="btn btn-ghost" style={{ flex: 1, height: 44 }} onClick={() => setConfirmDelete(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" style={{ flex: 1, height: 44 }} onClick={() => handleDelete(confirmDelete)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
