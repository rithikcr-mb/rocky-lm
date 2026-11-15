import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { updateProfile } from '../services/api';

export default function OnboardingModal({ setProfile }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a name to continue.');
      return;
    }
    if (trimmed.length > 50) {
      setError('Names can be 50 characters or fewer.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await updateProfile(trimmed);
      setProfile({
        hasProfile: true,
        name: response.name,
      });
    } catch (err) {
      setError(err.message || 'Could not save your name. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop-animate fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="modal-content-animate w-full max-w-[420px] rounded-2xl border border-line bg-surface p-6 shadow-overlay sm:p-8"
      >
        <img
          src="/rocky-mascot.png"
          alt=""
          aria-hidden="true"
          className="mx-auto h-14 w-14 object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="mt-4 text-center">
          <h2 id="onboarding-title" className="text-xl font-medium text-ink">Welcome to Rocky-LM</h2>
          <p className="mt-1.5 text-[13px] leading-5 text-ink-secondary">
            Rocky learns from the notes you upload.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <label htmlFor="student-name" className="text-[12px] text-ink-secondary">
            What should Rocky call you?
          </label>
          <input
            id="student-name"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Your name"
            className="mt-2 h-11 w-full rounded-[10px] border border-line bg-surface-raised px-3.5 text-sm text-ink transition-colors duration-150 ease-ease placeholder:text-ink-muted focus:border-ember/60 focus:outline-none"
          />

          {error && (
            <p className="mt-2.5 flex items-start gap-1.5 text-[12px] leading-5 text-negative" role="alert">
              <AlertCircle size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            aria-busy={isSubmitting}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-ink text-sm font-medium text-background transition-colors duration-150 ease-ease hover:bg-white disabled:bg-surface-high disabled:text-ink-muted"
          >
            {isSubmitting && <Loader2 size={15} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Starting' : 'Start session'}
          </button>
        </form>
      </div>
    </div>
  );
}
