'use client';

interface Player {
  id: string;
  pseudo: string;
}

interface PlayersListProps {
  currentPseudo: string;
  players: Player[];
}

export default function PlayersList({ currentPseudo, players }: PlayersListProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white text-center mb-1">Lucky7</h1>
        <p className="text-yellow-500 text-center font-semibold mb-6">
          Bienvenue, {currentPseudo} !
        </p>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-zinc-300 font-semibold text-sm uppercase tracking-wider">
            Joueurs connectés
          </h2>
          <span className="text-xs bg-zinc-800 text-zinc-400 rounded-full px-2 py-0.5">
            {players.length}
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {players.map(player => (
            <li
              key={player.id}
              className="flex items-center gap-3 bg-zinc-800 rounded-xl px-4 py-3"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              <span className="text-white font-medium">
                {player.pseudo}
                {player.pseudo === currentPseudo && (
                  <span className="ml-2 text-xs text-yellow-500 font-normal">(toi)</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {players.length === 0 && (
          <p className="text-zinc-600 text-sm text-center mt-4">Aucun joueur pour l'instant…</p>
        )}
      </div>
    </div>
  );
}
