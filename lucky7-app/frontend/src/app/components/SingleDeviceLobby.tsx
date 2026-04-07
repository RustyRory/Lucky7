'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import GameScreen, { type RulesConfig } from './GameScreen';

interface Player {
  id: string;
  name: string;
}

interface ToggleableRule {
  key: keyof RulesConfig;
  label: string;
  desc: string;
}

interface DisabledRule {
  label: string;
  desc: string;
}

const TOGGLEABLE_RULES: ToggleableRule[] = [
  {
    key: 'double',
    label: 'Double',
    desc: 'Deux dés identiques → distribue autant de gorgées que la valeur du dé',
  },
  {
    key: 'marchandSable',
    label: 'Marchand de sable',
    desc: 'Score de 3 (1+2) → immunité contre les gorgées ce tour',
  },
];

const DISABLED_RULES: DisabledRule[] = [
  { label: 'Jeton', desc: 'Score de 7 → boit 1 gorgée' },
  { label: 'Jackpot', desc: 'Trois joueurs à 7 → relance pour distribuer un pot' },
  { label: 'Légende', desc: 'Score de 11 (5+6) → joueurs avec dé à 5 ou 6 boivent' },
  { label: 'Démon', desc: 'Trois joueurs à 6 → relance pour distribuer un pot' },
  { label: 'Mode hard', desc: 'Variantes difficiles (pénalités multipliées)' },
];

const DEFAULT_RULES: RulesConfig = {
  double: true,
  marchandSable: true,
};

interface SingleDeviceLobbyProps {
  onBack: () => void;
}

export default function SingleDeviceLobby({ onBack }: SingleDeviceLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [rules, setRules] = useState<RulesConfig>(DEFAULT_RULES);
  const [gameStarted, setGameStarted] = useState(false);

  if (gameStarted) {
    return <GameScreen players={players} rules={rules} onEnd={() => setGameStarted(false)} />;
  }

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

  function toggleRule(key: keyof RulesConfig) {
    setRules((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const canStart = players.length >= 2;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
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
          {/* ---- Ajout joueurs ---- */}
          <form onSubmit={addPlayer} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Pseudo du joueur…"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError('');
                }}
                maxLength={20}
              />
              <Button type="submit" disabled={input.trim().length < 2}>
                Ajouter
              </Button>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </form>

          {/* ---- Liste joueurs ---- */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Joueurs</span>
              <Badge variant="secondary">{players.length}</Badge>
            </div>

            {players.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-3">
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

          <Separator />

          {/* ---- Configuration des règles ---- */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Règles optionnelles</p>

            {TOGGLEABLE_RULES.map((rule) => (
              <label
                key={rule.key}
                className="flex items-start gap-2.5 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={rules[rule.key]}
                  onChange={() => toggleRule(rule.key)}
                  className="mt-0.5 accent-primary shrink-0"
                />
                <div>
                  <p className="text-sm font-medium leading-tight">{rule.label}</p>
                  <p className="text-xs text-muted-foreground">{rule.desc}</p>
                </div>
              </label>
            ))}

            <p className="text-sm font-medium mt-1">
              Bientôt disponible{' '}
              <span className="text-xs font-normal text-muted-foreground">
                (règles en cours de développement)
              </span>
            </p>

            <div className="flex flex-col gap-2">
              {DISABLED_RULES.map((rule) => (
                <label
                  key={rule.label}
                  className="flex items-start gap-2.5 opacity-40 cursor-not-allowed select-none"
                >
                  <input type="checkbox" disabled className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium leading-tight">{rule.label}</p>
                    <p className="text-xs text-muted-foreground">{rule.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={!canStart}
            onClick={() => setGameStarted(true)}
          >
            {canStart
              ? 'Lancer la partie'
              : `Encore ${2 - players.length} joueur${players.length === 0 ? 's' : ''} minimum`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
