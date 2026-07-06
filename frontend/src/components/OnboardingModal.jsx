import React, { useState } from 'react';
import { updateProfile } from '../services/api';

export default function OnboardingModal({ setProfile }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name cannot be empty.');
      return;
    }
    if (trimmed.length > 50) {
      setError('Name must be 50 characters or less.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await updateProfile(trimmed);
      // Update local profile state
      setProfile({
        hasProfile: true,
        name: response.name
      });
    } catch (err) {
      setError(err.message || 'Saving profile failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0a09]/80 backdrop-blur-md p-4 modal-backdrop-animate">
      <div className="w-full max-w-md bg-[#161311] border border-magma/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative font-sans text-on-surface modal-content-animate">
        
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-xenonite flex items-center justify-center gap-2 mb-2">
            <span>👋</span> Welcome to Rocky-LM
          </h2>
          <p className="text-magma font-bold text-sm mb-1 animate-pulse">
            Happy happy happy!
          </p>
          <p className="text-on-surface-variant/60 text-xs mt-3">
            Before our first expedition...
          </p>
          <p className="text-on-surface/90 text-sm mt-1">
            What should Rocky call you?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter your name..."
              className="w-full bg-[#1a1614] border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#e67e22] focus:ring-2 focus:ring-[#e67e22]/25 transition-all duration-200 placeholder:text-on-surface-variant/40 text-on-surface text-center font-mono"
            />
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center font-bold bg-red-500/10 border border-red-500/20 py-2 rounded-lg">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full bg-[#e67e22] hover:bg-[#d35400] active:scale-[0.98] disabled:bg-outline-variant/20 disabled:scale-100 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Registering...' : 'Continue'}
          </button>
        </form>

      </div>
    </div>
  );
}
