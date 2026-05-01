import { useState, useEffect } from 'react';
import { MdClose, MdArrowForward, MdArrowBack } from 'react-icons/md';
import { api, showToast } from '../api/client';
import type { Category, OpportunityCostPrompt } from '../api/client';

interface QuickEntryProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type Step = 'amount' | 'category' | 'satisfaction' | 'opportunity' | 'done';

export function QuickEntry({ open, onClose, onSaved }: QuickEntryProps) {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [satisfaction, setSatisfaction] = useState(3);
  const [description, setDescription] = useState('');
  const [oppCost, setOppCost] = useState<OpportunityCostPrompt | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      api.getCategories().then(setCategories).catch(() => {});
      setStep('amount');
      setAmount('');
      setSelectedCat(null);
      setSatisfaction(3);
      setDescription('');
      setOppCost(null);
    }
  }, [open]);

  const handleKeypad = (key: string) => {
    if (key === 'del') {
      setAmount((p) => p.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount((p) => p + '.');
    } else {
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
      setAmount((p) => p + key);
    }
  };

  const goToCategory = () => {
    if (parseFloat(amount) > 0) setStep('category');
  };

  const goToSatisfaction = (cat: Category) => {
    setSelectedCat(cat);
    setStep('satisfaction');
  };

  const goToOpportunity = async () => {
    try {
      const cost = await api.getOpportunityCost(parseFloat(amount));
      setOppCost(cost);
      setStep('opportunity');
    } catch {
      await saveExpense();
    }
  };

  const saveExpense = async () => {
    if (!selectedCat || !amount) return;
    setSaving(true);
    try {
      await api.createExpense({
        amount: parseFloat(amount),
        category_id: selectedCat.id,
        description: description || selectedCat.name,
        satisfaction_score: satisfaction,
      });
      setStep('done');
      showToast(`$${parseFloat(amount).toFixed(2)} expense saved!`);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 800);
    } catch {
      showToast('Failed to save expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="Add expense">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontWeight: 700 }}>
            {step === 'amount' && 'Enter Amount'}
            {step === 'category' && 'Pick Category'}
            {step === 'satisfaction' && 'How Happy?'}
            {step === 'opportunity' && '🤔 Think Twice'}
            {step === 'done' && '✅ Saved!'}
          </h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <MdClose />
          </button>
        </div>

        <div className="modal-body">
          {/* STEP 1: Amount */}
          {step === 'amount' && (
            <>
              <div className="amount-display">
                <span className="currency">$</span>
                <span className="value sensitive">{amount || '0'}</span>
              </div>

              <input
                className="input mb-md"
                placeholder="What's this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ textAlign: 'center' }}
                aria-label="Expense description"
              />

              <div className="keypad" role="group" aria-label="Number keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map((key) => (
                  <button
                    key={key}
                    className={`keypad-btn ${key === 'del' ? 'delete' : ''}`}
                    onClick={() => handleKeypad(key)}
                    aria-label={key === 'del' ? 'Delete' : key}
                  >
                    {key === 'del' ? '⌫' : key}
                  </button>
                ))}
              </div>

              <button
                className="btn btn-primary w-full"
                style={{ marginTop: 16, height: 48 }}
                onClick={goToCategory}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                Next <MdArrowForward />
              </button>
            </>
          )}

          {/* STEP 2: Category */}
          {step === 'category' && (
            <>
              <div className="category-grid" role="radiogroup" aria-label="Select category">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`category-item ${selectedCat?.id === cat.id ? 'selected' : ''}`}
                    onClick={() => goToSatisfaction(cat)}
                    role="radio"
                    aria-checked={selectedCat?.id === cat.id}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && goToSatisfaction(cat)}
                  >
                    <span className="cat-icon">{cat.icon}</span>
                    <span className="cat-name">{cat.name}</span>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-ghost w-full"
                style={{ marginTop: 16 }}
                onClick={() => setStep('amount')}
              >
                <MdArrowBack /> Back
              </button>
            </>
          )}

          {/* STEP 3: Satisfaction */}
          {step === 'satisfaction' && (
            <div style={{ textAlign: 'center' }}>
              <p className="text-muted mb-md">How satisfied will you be with this purchase?</p>
              <div className="stars" style={{ justifyContent: 'center', fontSize: '2rem', gap: 8 }} role="radiogroup" aria-label="Satisfaction rating">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`star ${s <= satisfaction ? 'filled' : ''}`}
                    onClick={() => setSatisfaction(s)}
                    style={{ cursor: 'pointer' }}
                    role="radio"
                    aria-checked={s === satisfaction}
                    aria-label={`${s} star${s > 1 ? 's' : ''}`}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSatisfaction(s)}
                  >
                    {s <= satisfaction ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted" style={{ marginTop: 8 }}>
                {satisfaction <= 2 ? '😔 Low satisfaction — consider skipping' :
                 satisfaction <= 3 ? '😐 Moderate — think it through' :
                 '😊 Sounds worthwhile!'}
              </p>

              <button
                className="btn btn-primary w-full"
                style={{ marginTop: 24, height: 48 }}
                onClick={goToOpportunity}
              >
                Continue <MdArrowForward />
              </button>
              <button
                className="btn btn-ghost w-full"
                style={{ marginTop: 8 }}
                onClick={() => setStep('category')}
              >
                <MdArrowBack /> Back
              </button>
            </div>
          )}

          {/* STEP 4: Opportunity Cost */}
          {step === 'opportunity' && oppCost && (
            <div>
              <div className="opp-cost-card">
                <p className="text-muted text-sm">If you invested this instead...</p>
                <div className="growth sensitive">${oppCost.projected_value.toLocaleString()}</div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  in {oppCost.years} years at compound growth
                </p>
              </div>

              <p className="text-sm text-muted" style={{ marginTop: 16, textAlign: 'center' }}>
                {oppCost.message}
              </p>

              <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, height: 48 }}
                  onClick={() => { onClose(); }}
                >
                  Skip It
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, height: 48 }}
                  onClick={saveExpense}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Still Buy'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Done */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>✅</div>
              <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>Expense Saved!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
