'use client';

import { useState, FormEvent } from 'react';
import { getSocket } from '@/lib/socket';

interface JoinFormProps {
  onJoined: (pseudo: string) => void;
}

export default function JoinForm({ onJoined }: JoinFormProps) {
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = pseudo.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError('Le pseudo doit faire entre 2 et 20 caractères.');
      return;
    }

    setLoading(true);
    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('player:join', trimmed, (res: { error?: string; player?: { pseudo: string } }) => {
      setLoading(false);
      if (res?.error) {
        setError(res.error);
      } else {
        onJoined(trimmed);
      }
    });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Lucky7</h1>
        <p className="text-zinc-400 text-center text-sm mb-8">Rejoindre la partie</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Ton pseudo..."
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={20}
            disabled={loading}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition disabled:opacity-50"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || pseudo.trim().length < 2}
            className="w-full rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 transition"
          >
            {loading ? 'Connexion...' : 'Rejoindre'}
          </button>
        </form>
      </div>
    </div>
  );
}
