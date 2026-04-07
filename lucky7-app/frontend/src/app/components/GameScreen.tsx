'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ---- Types ----

interface Player {
  id: string;
  name: string;
}

export interface RulesConfig {
  double: boolean;
  marchandSable: boolean;
}

interface DiceRoll {
  playerId: string;
  dice1: number;
  dice2: number;
  score: number;
  isDouble: boolean;
}

interface RoundResult {
  luckyPlayers: Player[];
  looserPlayers: Player[];
  announcement: number;
  playerScores: Array<{
    player: Player;
    dice1: number;
    dice2: number;
    score: number;
    distance: number;
    isDouble: boolean;
  }>;
}

interface ProlongationState {
  type: 'lucky' | 'looser';
  players: Player[];
  dice: DiceRoll[];
  rollerIndex: number;
  rolling: boolean;
}

interface GameScreenProps {
  players: Player[];
  rules: RulesConfig;
  onEnd: () => void;
}

type Phase = 'announce' | 'roll' | 'results' | 'prolongation';

// ---- Helpers ----

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
function diceFace(n: number) { return DICE_FACES[n - 1] ?? '?'; }
function rollD6(): number { return Math.ceil(Math.random() * 6); }

function ordinal(n: number): string {
  return n === 1 ? '1ère' : `${n}ème`;
}

// ---- Component ----

export default function GameScreen({ players, rules, onEnd }: GameScreenProps) {
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>('announce');
  const [announcement, setAnnouncement] = useState(12);
  const [announcementInput, setAnnouncementInput] = useState('');
  const [announcementError, setAnnouncementError] = useState('');
  const [luckyPlayer, setLuckyPlayer] = useState<Player | null>(null);

  // Roll phase
  const [rolledDice, setRolledDice] = useState<DiceRoll[]>([]);
  const [rollerIndex, setRollerIndex] = useState(0);
  const [rolling, setRolling] = useState(false);

  // Results + prolongation counters
  const [result, setResult] = useState<RoundResult | null>(null);
  const [luckyProlongations, setLuckyProlongations] = useState(0);
  const [looserProlongations, setLooserProlongations] = useState(0);

  // Prolongation state
  const [prolongation, setProlongation] = useState<ProlongationState | null>(null);

  // =====================
  // ANNOUNCE PHASE
  // =====================

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

  // =====================
  // ROLL PHASE
  // =====================

  const allRolled = rollerIndex >= players.length;
  const currentPlayer = !allRolled ? players[rollerIndex] : null;

  function handleRoll() {
    if (rolling || allRolled) return;
    setRolling(true);
    setTimeout(() => {
      const d1 = rollD6(), d2 = rollD6();
      const roll: DiceRoll = {
        playerId: players[rollerIndex].id,
        dice1: d1, dice2: d2,
        score: d1 + d2,
        isDouble: d1 === d2,
      };
      setRolledDice(prev => [...prev, roll]);
      setRollerIndex(prev => prev + 1);
      setRolling(false);
    }, 700);
  }

  function computeResults() {
    const playerScores = rolledDice.map(roll => {
      const player = players.find(p => p.id === roll.playerId)!;
      return {
        player,
        dice1: roll.dice1, dice2: roll.dice2,
        score: roll.score,
        distance: Math.abs(roll.score - announcement),
        isDouble: roll.isDouble,
      };
    });

    const minDist = Math.min(...playerScores.map(s => s.distance));
    const maxDist = Math.max(...playerScores.map(s => s.distance));
    const luckyPlayers = playerScores.filter(s => s.distance === minDist).map(s => s.player);
    const looserPlayers = playerScores.filter(s => s.distance === maxDist).map(s => s.player);

    setResult({ luckyPlayers, looserPlayers, announcement, playerScores });
    setPhase('results');
  }

  // =====================
  // PROLONGATION
  // =====================

  function startProlongation(type: 'lucky' | 'looser', tiedPlayers: Player[]) {
    setProlongation({ type, players: tiedPlayers, dice: [], rollerIndex: 0, rolling: false });
    setPhase('prolongation');
  }

  const prolAllRolled = prolongation
    ? prolongation.rollerIndex >= prolongation.players.length
    : false;

  const prolCurrentPlayer = prolongation && !prolAllRolled
    ? prolongation.players[prolongation.rollerIndex]
    : null;

  function handleProlongationRoll() {
    if (!prolongation || prolongation.rolling || prolAllRolled) return;
    setProlongation(prev => prev ? { ...prev, rolling: true } : prev);
    setTimeout(() => {
      setProlongation(prev => {
        if (!prev) return prev;
        const d1 = rollD6(), d2 = rollD6();
        const roll: DiceRoll = {
          playerId: prev.players[prev.rollerIndex].id,
          dice1: d1, dice2: d2,
          score: d1 + d2,
          isDouble: d1 === d2,
        };
        return { ...prev, dice: [...prev.dice, roll], rollerIndex: prev.rollerIndex + 1, rolling: false };
      });
    }, 700);
  }

  function resolveProlongation() {
    if (!prolongation || !result) return;
    const { type, players: tiedPlayers, dice } = prolongation;

    const scores = dice.map(d => ({
      player: tiedPlayers.find(p => p.id === d.playerId)!,
      distance: Math.abs(d.score - announcement),
    }));

    if (type === 'lucky') {
      const minDist = Math.min(...scores.map(s => s.distance));
      const winners = scores.filter(s => s.distance === minDist).map(s => s.player);
      setLuckyProlongations(prev => prev + 1);
      if (winners.length === 1) {
        setResult(prev => prev ? { ...prev, luckyPlayers: winners } : prev);
        setProlongation(null);
        setPhase('results');
      } else {
        // Encore une égalité — relancer avec les mêmes joueurs
        setProlongation({ type: 'lucky', players: winners, dice: [], rollerIndex: 0, rolling: false });
        // reste en phase prolongation
      }
    } else {
      const maxDist = Math.max(...scores.map(s => s.distance));
      const losers = scores.filter(s => s.distance === maxDist).map(s => s.player);
      setLooserProlongations(prev => prev + 1);
      if (losers.length === 1) {
        setResult(prev => prev ? { ...prev, looserPlayers: losers } : prev);
        setProlongation(null);
        setPhase('results');
      } else {
        setProlongation({ type: 'looser', players: losers, dice: [], rollerIndex: 0, rolling: false });
      }
    }
  }

  // =====================
  // RESULTS — DRINK CALC
  // =====================

  function getDrinkMessages(): string[] {
    if (!result) return [];
    const msgs: string[] = [];
    const { luckyPlayers, looserPlayers, playerScores, announcement: ann } = result;

    // Lucky — toujours actif, +1 gorgée par prolongation
    if (luckyPlayers.length === 1) {
      const ls = playerScores.find(s => s.player.id === luckyPlayers[0].id)!;
      const base = ls.score === ann ? 2 : 1;
      const drinks = base + luckyProlongations;
      const extra = luckyProlongations > 0
        ? ` (+${luckyProlongations} prolongation${luckyProlongations > 1 ? 's' : ''})`
        : '';
      msgs.push(`🏆 ${luckyPlayers[0].name} distribue ${drinks} gorgée${drinks > 1 ? 's' : ''}${ls.score === ann ? ' — score exact !' : ''}${extra}`);
    }

    // Looser — toujours actif, +1 gorgée par prolongation
    if (looserPlayers.length === 1) {
      const drinks = 1 + looserProlongations;
      const extra = looserProlongations > 0
        ? ` (+${looserProlongations} prolongation${looserProlongations > 1 ? 's' : ''})`
        : '';
      msgs.push(`💀 ${looserPlayers[0].name} boit ${drinks} gorgée${drinks > 1 ? 's' : ''}${extra}`);
    }

    // Double — optionnel, suspendu pendant les prolongations (déjà géré : on affiche à la fin)
    if (rules.double) {
      playerScores.filter(s => s.isDouble).forEach(s => {
        const diceVal = s.dice1;
        if (diceVal === 1) {
          msgs.push(`🎲 ${s.player.name} — Double 1 : distribue 1 gorgée ou fait relancer un joueur`);
        } else {
          msgs.push(`🎲 ${s.player.name} — Double ${diceVal} : distribue ${diceVal} gorgée${diceVal > 1 ? 's' : ''}`);
        }
      });
    }

    // Marchand de sable — optionnel
    if (rules.marchandSable) {
      playerScores.filter(s => s.score === 3).forEach(s => {
        msgs.push(`🌙 ${s.player.name} — Marchand de sable : immunité !`);
      });
    }

    return msgs;
  }

  // =====================
  // NEXT ROUND
  // =====================

  function nextRound() {
    const newLucky = result?.luckyPlayers.length === 1 ? result.luckyPlayers[0] : null;
    setLuckyPlayer(newLucky);
    setRound(r => r + 1);
    setPhase('announce');
    setAnnouncementInput('');
    setAnnouncementError('');
    setRolledDice([]);
    setRollerIndex(0);
    setRolling(false);
    setResult(null);
    setLuckyProlongations(0);
    setLooserProlongations(0);
    setProlongation(null);
  }

  // ==============================
  // RENDER
  // ==============================

  // ---- Announce ----
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
                <p className="text-muted-foreground text-sm mb-3">Premier tour — annonce automatique</p>
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
                  <span className="font-semibold text-foreground">"le plus"</span> pour 12
                </div>
                <Input
                  type="number"
                  min={2}
                  max={12}
                  placeholder="Annonce (2 – 12)"
                  value={announcementInput}
                  onChange={e => { setAnnouncementInput(e.target.value); setAnnouncementError(''); }}
                />
                {announcementError && <p className="text-destructive text-xs">{announcementError}</p>}
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

  // ---- Roll ----
  if (phase === 'roll') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1">Tour {round}</CardTitle>
              <Badge variant="outline" className="text-base font-bold px-3">{announcement}</Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            {/* Joueurs ayant lancé */}
            {rolledDice.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {rolledDice.map(roll => {
                  const player = players.find(p => p.id === roll.playerId)!;
                  return (
                    <div key={roll.playerId} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{player.name}</span>
                        {roll.isDouble && rules.double && <Badge variant="secondary" className="text-xs">Double</Badge>}
                        {roll.score === 3 && rules.marchandSable && <Badge variant="secondary" className="text-xs">Marchand</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{diceFace(roll.dice1)}{diceFace(roll.dice2)}</span>
                        <span className="text-sm font-bold w-4 text-right">{roll.score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!allRolled ? (
              <>
                {rolledDice.length > 0 && <Separator />}
                <div className="flex flex-col items-center gap-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    Au tour de <span className="font-semibold text-foreground">{currentPlayer!.name}</span>
                  </p>
                  <span className={`text-5xl select-none ${rolling ? 'animate-bounce' : ''}`}>🎲🎲</span>
                  <Button size="lg" className="w-full" onClick={handleRoll} disabled={rolling}>
                    {rolling ? 'Lancer…' : 'Lancer les dés'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground text-center">Tous les joueurs ont lancé</p>
              </>
            )}
          </CardContent>

          {allRolled && (
            <CardFooter>
              <Button className="w-full" size="lg" onClick={computeResults}>
                Voir les résultats
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    );
  }

  // ---- Prolongation ----
  if (phase === 'prolongation' && prolongation) {
    const completedProlongations = prolongation.type === 'lucky' ? luckyProlongations : looserProlongations;
    const prolNumber = completedProlongations + 1;
    // Enjeu = gorgées normales (1) + nombre de prolongations après résolution
    const drinkStake = 1 + prolNumber;
    const isLuckyType = prolongation.type === 'lucky';

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1">
                {isLuckyType ? '🏆 Prolongation Lucky' : '💀 Prolongation Looser'}
              </CardTitle>
              <Badge variant="secondary">{ordinal(prolNumber)}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {prolongation.players.map(p => p.name).join(' · ')}
              {' — '}enjeu : <span className="font-semibold text-foreground">{drinkStake} gorgée{drinkStake > 1 ? 's' : ''}</span>
            </p>
            <p className="text-xs text-muted-foreground">Annonce : {announcement} · Combos suspendues</p>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            {/* Déjà lancé */}
            {prolongation.dice.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {prolongation.dice.map(roll => {
                  const player = prolongation.players.find(p => p.id === roll.playerId)!;
                  return (
                    <div key={roll.playerId} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <span className="text-sm font-medium">{player.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{diceFace(roll.dice1)}{diceFace(roll.dice2)}</span>
                        <span className="text-sm font-bold w-4 text-right">{roll.score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Joueur courant */}
            {!prolAllRolled ? (
              <>
                {prolongation.dice.length > 0 && <Separator />}
                <div className="flex flex-col items-center gap-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    Au tour de <span className="font-semibold text-foreground">{prolCurrentPlayer!.name}</span>
                  </p>
                  <span className={`text-5xl select-none ${prolongation.rolling ? 'animate-bounce' : ''}`}>🎲🎲</span>
                  <Button size="lg" className="w-full" onClick={handleProlongationRoll} disabled={prolongation.rolling}>
                    {prolongation.rolling ? 'Lancer…' : 'Lancer les dés'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground text-center">Tous ont lancé</p>
              </>
            )}
          </CardContent>

          {prolAllRolled && (
            <CardFooter>
              <Button className="w-full" size="lg" onClick={resolveProlongation}>
                Résoudre la prolongation
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    );
  }

  // ---- Results ----
  const luckyTied = (result?.luckyPlayers.length ?? 0) > 1;
  const looserTied = (result?.looserPlayers.length ?? 0) > 1;
  const allResolved = !luckyTied && !looserTied;
  const drinkMessages = getDrinkMessages();
  const sortedScores = result ? [...result.playerScores].sort((a, b) => a.distance - b.distance) : [];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Résultats — Tour {round}</CardTitle>
          <p className="text-xs text-muted-foreground">Annonce : {announcement}</p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Scores */}
          <div className="flex flex-col gap-1.5">
            {sortedScores.map(s => {
              const isLucky = result!.luckyPlayers.some(p => p.id === s.player.id);
              const isLooser = result!.looserPlayers.some(p => p.id === s.player.id);
              return (
                <div
                  key={s.player.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 border ${
                    isLucky && !isLooser ? 'bg-yellow-500/10 border-yellow-500/40' :
                    isLooser && !isLucky ? 'bg-destructive/10 border-destructive/30' :
                    'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {isLucky && <span>🏆</span>}
                    {isLooser && !isLucky && <span>💀</span>}
                    <span className="text-sm font-medium">{s.player.name}</span>
                    {s.isDouble && rules.double && <Badge variant="secondary" className="text-xs">Double</Badge>}
                    {s.score === 3 && rules.marchandSable && <Badge variant="secondary" className="text-xs">Marchand</Badge>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-lg">{diceFace(s.dice1)}{diceFace(s.dice2)}</span>
                    <span className="text-sm font-bold">{s.score}</span>
                    <span className="text-muted-foreground text-xs">
                      {s.distance === 0 ? '(exact !)' : `(±${s.distance})`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prolongation Lucky */}
          {luckyTied && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-3 flex flex-col gap-2">
              <p className="text-sm font-semibold">🏆 Égalité Lucky</p>
              <p className="text-xs text-muted-foreground">
                {result!.luckyPlayers.map(p => p.name).join(', ')} — même distance
              </p>
              <Button size="sm" className="w-full" onClick={() => startProlongation('lucky', result!.luckyPlayers)}>
                Lancer la prolongation
              </Button>
            </div>
          )}

          {/* Prolongation Looser — seulement après résolution du Lucky */}
          {looserTied && !luckyTied && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-3 flex flex-col gap-2">
              <p className="text-sm font-semibold">💀 Égalité Looser</p>
              <p className="text-xs text-muted-foreground">
                {result!.looserPlayers.map(p => p.name).join(', ')} — même distance
              </p>
              <Button size="sm" variant="destructive" className="w-full" onClick={() => startProlongation('looser', result!.looserPlayers)}>
                Lancer la prolongation
              </Button>
            </div>
          )}

          {/* Gorgées — uniquement quand tout est résolu */}
          {allResolved && drinkMessages.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Gorgées</p>
                {drinkMessages.map((msg, i) => (
                  <p key={i} className="text-sm">{msg}</p>
                ))}
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {allResolved && (
            <Button className="w-full" size="lg" onClick={nextRound}>
              Nouveau tour
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={onEnd}>
            Fin de partie
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
