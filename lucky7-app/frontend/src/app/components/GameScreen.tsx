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

export interface RulesConfig {
  double: boolean;
  marchandSable: boolean;
}

interface GameScreenProps {
  players: Player[];
  rules: RulesConfig;
  onEnd: () => void;
}

interface PlayerScore {
  playerId: string;
  score: number | '';
  isDouble: boolean;
}

interface RoundResult {
  luckyPlayers: Player[];
  looserPlayers: Player[];
  announcement: number;
  playerScores: Array<{
    player: Player;
    score: number;
    distance: number;
    isDouble: boolean;
  }>;
}

type Phase = 'announce' | 'roll' | 'results';

function emptyScores(players: Player[]): PlayerScore[] {
  return players.map((p) => ({ playerId: p.id, score: '', isDouble: false }));
}

function canBeDouble(score: number | ''): boolean {
  if (score === '') return false;
  const half = (score as number) / 2;
  return Number.isInteger(half) && half >= 1 && half <= 6;
}

export default function GameScreen({ players, rules, onEnd }: GameScreenProps) {
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>('announce');
  const [announcement, setAnnouncement] = useState<number>(12);
  const [announcementInput, setAnnouncementInput] = useState('');
  const [announcementError, setAnnouncementError] = useState('');
  const [luckyPlayer, setLuckyPlayer] = useState<Player | null>(null);
  const [scores, setScores] = useState<PlayerScore[]>(emptyScores(players));
  const [result, setResult] = useState<RoundResult | null>(null);

  // ---- ANNOUNCE PHASE ----
  function confirmAnnouncement() {
    if (round === 1) {
      setAnnouncement(12);
      setPhase('roll');
      return;
    }
    const num = parseInt(announcementInput, 10);
    if (isNaN(num) || num < 2 || num > 12) {
      setAnnouncementError('Choisissez un nombre entre 2 et 12.');
      return;
    }
    setAnnouncement(num);
    setAnnouncementError('');
    setPhase('roll');
  }

  // ---- ROLL PHASE ----
  function updateScore(playerId: string, value: string) {
    const raw = parseInt(value, 10);
    const clamped: number | '' = isNaN(raw) ? '' : Math.min(12, Math.max(2, raw));
    setScores((prev) =>
      prev.map((s) =>
        s.playerId === playerId
          ? { ...s, score: clamped, isDouble: canBeDouble(clamped) ? s.isDouble : false }
          : s
      )
    );
  }

  function toggleDouble(playerId: string) {
    setScores((prev) =>
      prev.map((s) => (s.playerId === playerId ? { ...s, isDouble: !s.isDouble } : s))
    );
  }

  const allFilled = scores.every((s) => s.score !== '' && !isNaN(Number(s.score)));

  function validateScores() {
    if (!allFilled) return;

    const playerScores = scores.map((s) => {
      const player = players.find((p) => p.id === s.playerId)!;
      const score = Number(s.score);
      return { player, score, distance: Math.abs(score - announcement), isDouble: s.isDouble };
    });

    const minDist = Math.min(...playerScores.map((s) => s.distance));
    const maxDist = Math.max(...playerScores.map((s) => s.distance));

    const luckyPlayers = playerScores.filter((s) => s.distance === minDist).map((s) => s.player);
    const looserPlayers = playerScores.filter((s) => s.distance === maxDist).map((s) => s.player);

    setResult({ luckyPlayers, looserPlayers, announcement, playerScores });
    setPhase('results');
  }

  // ---- RESULTS PHASE ----
  function getDrinkMessages(): string[] {
    if (!result) return [];
    const msgs: string[] = [];
    const { luckyPlayers, looserPlayers, playerScores, announcement: ann } = result;

    // Lucky
    if (luckyPlayers.length === 1) {
      const ls = playerScores.find((s) => s.player.id === luckyPlayers[0].id)!;
      const drinks = ls.score === ann ? 2 : 1;
      msgs.push(
        `🏆 ${luckyPlayers[0].name} (Lucky) distribue ${drinks} gorgée${drinks > 1 ? 's' : ''}${ls.score === ann ? ' — score exact !' : ''}`
      );
    } else {
      msgs.push(
        `🏆 Égalité Lucky : ${luckyPlayers.map((p) => p.name).join(' & ')} — prolongation !`
      );
    }

    // Looser
    if (looserPlayers.length === 1) {
      msgs.push(`💀 ${looserPlayers[0].name} (Looser) boit 1 gorgée`);
    } else {
      msgs.push(
        `💀 Égalité Looser : ${looserPlayers.map((p) => p.name).join(' & ')} — prolongation !`
      );
    }

    // Double
    if (rules.double) {
      playerScores
        .filter((s) => s.isDouble)
        .forEach((s) => {
          const diceVal = s.score / 2;
          if (s.score === 2) {
            msgs.push(
              `🎲 ${s.player.name} a un Double 1 — distribue 1 gorgée ou fait relancer un joueur`
            );
          } else {
            msgs.push(
              `🎲 ${s.player.name} a un Double ${diceVal} — distribue ${diceVal} gorgée${diceVal > 1 ? 's' : ''}`
            );
          }
        });
    }

    // Marchand de sable
    if (rules.marchandSable) {
      playerScores
        .filter((s) => s.score === 3)
        .forEach((s) => {
          msgs.push(`🌙 ${s.player.name} a le Marchand de sable (3) — immunité !`);
        });
    }

    return msgs;
  }

  function nextRound() {
    const newLucky = result?.luckyPlayers.length === 1 ? result.luckyPlayers[0] : null;
    setLuckyPlayer(newLucky);
    setRound((r) => r + 1);
    setPhase('announce');
    setAnnouncementInput('');
    setAnnouncementError('');
    setScores(emptyScores(players));
    setResult(null);
  }

  // ---- RENDER ----

  if (phase === 'announce') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1">Tour {round}</CardTitle>
              <Badge variant="secondary">Annonce</Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {round === 1 ? (
              <div className="text-center py-2">
                <p className="text-muted-foreground text-sm mb-3">
                  Premier tour — annonce automatique
                </p>
                <p className="text-6xl font-bold">12</p>
                <p className="text-sm text-muted-foreground mt-1">"le plus"</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-center">
                  <span className="font-semibold">{luckyPlayer?.name ?? 'Le Lucky'}</span> annonce
                  le score cible (2 – 12)
                </p>
                <div className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground">
                  Rappel : dire{' '}
                  <span className="font-semibold text-foreground">"le moins"</span> pour 2 et{' '}
                  <span className="font-semibold text-foreground">"le plus"</span> pour 12 —
                  sinon 1 gorgée de pénalité
                </div>
                <Input
                  type="number"
                  min={2}
                  max={12}
                  placeholder="Annonce (2 – 12)"
                  value={announcementInput}
                  onChange={(e) => {
                    setAnnouncementInput(e.target.value);
                    setAnnouncementError('');
                  }}
                />
                {announcementError && (
                  <p className="text-destructive text-xs">{announcementError}</p>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button className="w-full" size="lg" onClick={confirmAnnouncement}>
              {round === 1 ? 'Commencer le tour' : "Confirmer l'annonce"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (phase === 'roll') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1">Tour {round}</CardTitle>
              <Badge variant="outline" className="text-base font-bold px-3">
                {announcement}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Entrez les scores de chaque joueur (2 – 12)
            </p>
          </CardHeader>

          <CardContent className="flex flex-col gap-2.5">
            {scores.map((s) => {
              const player = players.find((p) => p.id === s.playerId)!;
              const showDouble = rules.double && canBeDouble(s.score);
              return (
                <div
                  key={s.playerId}
                  className="flex flex-col gap-1.5 border border-border rounded-lg px-3 py-2.5"
                >
                  <span className="text-sm font-medium">{player.name}</span>
                  <Input
                    type="number"
                    min={2}
                    max={12}
                    placeholder="Score (2 – 12)"
                    value={s.score}
                    onChange={(e) => updateScore(s.playerId, e.target.value)}
                  />
                  {showDouble && (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={s.isDouble}
                        onChange={() => toggleDouble(s.playerId)}
                        className="accent-primary"
                      />
                      Double ({Number(s.score) / 2}+{Number(s.score) / 2})
                    </label>
                  )}
                </div>
              );
            })}
          </CardContent>

          <CardFooter>
            <Button className="w-full" size="lg" disabled={!allFilled} onClick={validateScores}>
              Valider les scores
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // RESULTS
  const drinkMessages = getDrinkMessages();
  const sortedScores = result
    ? [...result.playerScores].sort((a, b) => a.distance - b.distance)
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="flex-1">Résultats — Tour {round}</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Annonce : {announcement}</p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            {sortedScores.map((s) => {
              const isLucky = result!.luckyPlayers.some((p) => p.id === s.player.id);
              const isLooser = result!.looserPlayers.some((p) => p.id === s.player.id);
              return (
                <div
                  key={s.player.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm border ${
                    isLucky && !isLooser
                      ? 'bg-yellow-500/10 border-yellow-500/40'
                      : isLooser && !isLucky
                        ? 'bg-destructive/10 border-destructive/30'
                        : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {isLucky && <span>🏆</span>}
                    {isLooser && !isLucky && <span>💀</span>}
                    <span className="font-medium">{s.player.name}</span>
                    {s.isDouble && (
                      <Badge variant="secondary" className="text-xs">
                        Double
                      </Badge>
                    )}
                    {s.score === 3 && rules.marchandSable && (
                      <Badge variant="secondary" className="text-xs">
                        Marchand
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-bold">{s.score}</span>
                    <span className="text-muted-foreground text-xs">
                      {s.distance === 0 ? '(exact !)' : `(±${s.distance})`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {drinkMessages.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Gorgées</p>
                {drinkMessages.map((msg, i) => (
                  <p key={i} className="text-sm">
                    {msg}
                  </p>
                ))}
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" size="lg" onClick={nextRound}>
            Nouveau tour
          </Button>
          <Button variant="outline" className="w-full" onClick={onEnd}>
            Fin de partie
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
