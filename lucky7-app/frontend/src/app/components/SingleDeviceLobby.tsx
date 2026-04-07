'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Player {
  id: string;
  name: string;
}

interface SingleDeviceLobbyProps {
  onBack: () => void;
}

export default function SingleDeviceLobby({ onBack }: SingleDeviceLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function addPlayer(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError('');

    const name = input.trim();

    if (name.length < 2 || name.length > 20) {
      setError('Le pseudo doit faire entre 2 et 20 caractères.');
      return;
    }

    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setError('Ce pseudo est déjà dans la partie.');
      return;
    }

    setPlayers((prev) => [...prev, { id: crypto.randomUUID(), name }]);
    setInput('');
  }

  function removePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  const canStart = players.length >= 2;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="px-2">
              ←
            </Button>
            <CardTitle className="flex-1">Nouvelle partie</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Formulaire d'ajout */}
          <form onSubmit={addPlayer} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Pseudo du joueur..."
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(''); }}
                maxLength={20}
              />
              <Button type="submit" disabled={input.trim().length < 2}>
                Ajouter
              </Button>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </form>

          <Separator />

          {/* Liste des joueurs */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Joueurs</span>
              <Badge variant="secondary">{players.length}</Badge>
            </div>

            {players.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Ajoutez au moins 2 joueurs pour commencer.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {players.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-sm font-medium">{player.name}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removePlayer(player.id)}
                      aria-label={`Supprimer ${player.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button className="w-full" size="lg" disabled={!canStart}>
            {canStart
              ? 'Lancer la partie'
              : `Encore ${2 - players.length} joueur${players.length === 0 ? 's' : ''} minimum`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
