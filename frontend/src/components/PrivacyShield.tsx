import { MdVisibility, MdVisibilityOff } from 'react-icons/md';

interface PrivacyShieldProps {
  active: boolean;
  onToggle: () => void;
}

export function PrivacyShield({ active, onToggle }: PrivacyShieldProps) {
  return (
    <button
      className="btn btn-icon btn-ghost"
      onClick={onToggle}
      title={active ? 'Show amounts' : 'Hide amounts'}
      style={{ color: active ? 'var(--neon-cyan)' : 'var(--text-muted)' }}
    >
      {active ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
    </button>
  );
}
