'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import GameScreen, { type RulesConfig } from './GameScreen';
import { generateId } from '@/lib/utils';

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
    key: 'relance',
    label: 'Relance',
    desc: 'Score 1•1 → le joueur peut relancer ses dés une fois',
  },
  {
    key: 'marchandSable',
    label: 'Marchand de sable',
    desc: 'Score de 3 (1•2) → immunité contre les gorgées ce tour',
  },
  {
    key: 'legende',
    label: 'Légende',
    desc: 'Score de 11 (5•6) → tous les joueurs avec un dé à 5 ou 6 boivent 1 gorgée',
  },
];

const DISABLED_RULES: DisabledRule[] = [
  { label: 'Jeton', desc: 'Score de 7 → boit 1 gorgée' },
  { label: 'Jackpot', desc: 'Trois joueurs à 7 → relance pour distribuer un pot' },
  { label: 'Démon', desc: 'Trois joueurs à 6 → relance pour distribuer un pot' },
];

const HARD_RULE: DisabledRule = {
  label: 'Mode hard',
  desc: 'Pénalités doublées à chaque prolongation',
};

const DEFAULT_RULES: RulesConfig = {
  double: true,
  relance: false,
  marchandSable: true,
  legende: false,
};

// ---- Rules Config Dialog ----

function RulesConfigDialog({
  rules,
  onToggle,
  onClose,
}: {
  rules: RulesConfig;
  onToggle: (key: keyof RulesConfig) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-t-2xl sm:rounded-xl border border-border shadow-lg w-full max-w-sm mx-0 sm:mx-4 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-background border-b border-border">
          <p className="font-semibold text-base">Paramètres de la partie</p>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none p-1"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 px-5 py-4">
          {/* Règles activables */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Règles optionnelles
            </p>
            {TOGGLEABLE_RULES.map(rule => (
              <button
                key={rule.key}
                type="button"
                onClick={() => onToggle(rule.key)}
                className={`flex items-center gap-3 w-full text-left rounded-xl px-3 py-3 transition-colors select-none ${
                  rules[rule.key]
                    ? 'bg-primary/10 ring-1 ring-primary/30'
                    : 'bg-muted/50 ring-1 ring-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{rule.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.desc}</p>
                </div>
                {/* Toggle switch */}
                <div
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                    rules[rule.key] ? 'bg-primary' : 'bg-foreground/20'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      rules[rule.key] ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>

          <Separator />

          {/* Règles désactivées */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Bientôt disponible
            </p>
            {DISABLED_RULES.map(rule => (
              <div
                key={rule.label}
                className="flex items-center gap-3 rounded-xl px-3 py-3 bg-muted/30 opacity-40"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{rule.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.desc}</p>
                </div>
                <div className="relative shrink-0 w-11 h-6 rounded-full bg-foreground/20">
                  <div className="absolute top-0.5 translate-x-0.5 w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 rounded-xl px-3 py-3 bg-destructive/5 opacity-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight text-destructive">
                  {HARD_RULE.label}
                </p>
                <p className="text-xs text-destructive/70 mt-0.5">{HARD_RULE.desc}</p>
              </div>
              <div className="relative shrink-0 w-11 h-6 rounded-full bg-destructive/20">
                <div className="absolute top-0.5 translate-x-0.5 w-5 h-5 bg-white rounded-full shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2">
          <Button className="w-full" onClick={onClose}>
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Lobby ----

interface SingleDeviceLobbyProps {
  onBack: () => void;
}

export default function SingleDeviceLobby({ onBack }: SingleDeviceLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [rules, setRules] = useState<RulesConfig>(DEFAULT_RULES);
  const [gameStarted, setGameStarted] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(false);

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
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      setError('Ce pseudo est déjà dans la partie.');
      return;
    }
    setPlayers(prev => [...prev, { id: generateId(), name }]);
    setInput('');
  }

  function removePlayer(id: string) {
    setPlayers(prev => prev.filter(p => p.id !== id));
  }

  function toggleRule(key: keyof RulesConfig) {
    setRules(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const canStart = players.length >= 2;
  const activeRules = TOGGLEABLE_RULES.filter(r => rules[r.key]);

  return (
    <>
      {showRulesDialog && (
        <RulesConfigDialog
          rules={rules}
          onToggle={toggleRule}
          onClose={() => setShowRulesDialog(false)}
        />
      )}

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
                  onChange={e => {
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
                  {players.map(player => (
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

            {/* ---- Règles — résumé + bouton ---- */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-medium">Règles</span>
                {activeRules.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {activeRules.map(r => (
                      <Badge key={r.key} variant="secondary" className="text-xs">
                        {r.label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Aucune règle active</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRulesDialog(true)}
                className="shrink-0"
              >
                ⚙️ Configurer
              </Button>
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
    </>
  );
}
