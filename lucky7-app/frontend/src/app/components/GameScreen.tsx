'use client';

import { useState, useEffect } from 'react';
import { generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ---- Dice SVG ----

// Positions des points pour chaque valeur de dé (grille 3×3, coords en %)
const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [25, 25],
    [75, 75],
  ],
  3: [
    [25, 25],
    [50, 50],
    [75, 75],
  ],
  4: [
    [25, 25],
    [75, 25],
    [25, 75],
    [75, 75],
  ],
  5: [
    [25, 25],
    [75, 25],
    [50, 50],
    [25, 75],
    [75, 75],
  ],
  6: [
    [25, 25],
    [75, 25],
    [25, 50],
    [75, 50],
    [25, 75],
    [75, 75],
  ],
};

function DiceFace({
  value,
  size = 56,
  rolling = false,
}: {
  value: number;
  size?: number;
  rolling?: boolean;
}) {
  const dots = DOT_POSITIONS[value] ?? [];
  const r = 9;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`shrink-0 transition-transform ${rolling ? 'animate-spin' : ''}`}
      style={rolling ? { animationDuration: '200ms' } : undefined}
    >
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="18"
        ry="18"
        fill="white"
        stroke="#d1d5db"
        strokeWidth="4"
      />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#1f2937" />
      ))}
    </svg>
  );
}

// Hook : pendant le rolling, cycle les valeurs aléatoirement à 100ms
function useRollingDice(rolling: boolean): [number, number] {
  const [preview, setPreview] = useState<[number, number]>(() => [rollD6(), rollD6()]);
  useEffect(() => {
    if (!rolling) return;
    const id = setInterval(() => {
      setPreview([rollD6(), rollD6()]);
    }, 100);
    return () => clearInterval(id);
  }, [rolling]);
  return preview;
}

// ---- Types ----

interface Player {
  id: string;
  name: string;
}

export interface RulesConfig {
  double: boolean;
  relance: boolean;
  marchandSable: boolean;
  legende: boolean;
}

// ---- Rules Dialog ----

function RuleItem({ label, active, desc }: { label: string; active: boolean; desc: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`text-sm shrink-0 mt-0.5 ${active ? 'text-green-500' : 'text-muted-foreground'}`}
      >
        {active ? '✓' : '✗'}
      </span>
      <div>
        <p
          className={`text-sm font-medium leading-tight ${!active ? 'text-muted-foreground' : ''}`}
        >
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function RulesDialog({ rules, onClose }: { rules: RulesConfig; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl border border-border shadow-lg w-full max-w-xs mx-4 p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold">Paramètres de la partie</p>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <RuleItem
            label="Double"
            active={rules.double}
            desc="Deux dés identiques → distribue autant de gorgées que la valeur"
          />
          <RuleItem
            label="Relance (Double 1)"
            active={rules.relance}
            desc="Double 1 → peut relancer ses dés une fois"
          />
          <RuleItem
            label="Marchand de sable"
            active={rules.marchandSable}
            desc="Score de 3 → immunité ce tour"
          />
          <RuleItem
            label="Légende"
            active={rules.legende}
            desc="Score de 11 (5+6) → tous les joueurs avec un dé à 5 ou 6 boivent"
          />
        </div>
      </div>
    </div>
  );
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

type Phase = 'announce' | 'roll' | 'results' | 'prolongation' | 'manage-players';

// ---- Helpers ----

function rollD6(): number {
  return Math.ceil(Math.random() * 6);
}

function ordinal(n: number): string {
  return n === 1 ? '1ère' : `${n}ème`;
}

// ---- Component ----

export default function GameScreen({ players: initialPlayers, rules, onEnd }: GameScreenProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [manageInput, setManageInput] = useState('');
  const [manageError, setManageError] = useState('');

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
  const [previewD1, previewD2] = useRollingDice(rolling);

  // Results + prolongation counters
  const [result, setResult] = useState<RoundResult | null>(null);
  const [luckyProlongations, setLuckyProlongations] = useState(0);
  const [looserProlongations, setLooserProlongations] = useState(0);
  // Cumulative sip bonus from prolongations (sum of participants−1 per round)
  const [luckyProlongBonus, setLuckyProlongBonus] = useState(0);
  const [looserProlongBonus, setLooserProlongBonus] = useState(0);

  // Prolongation state
  const [prolongation, setProlongation] = useState<ProlongationState | null>(null);

  // Relance state
  const [relancePending, setRelancePending] = useState(false);
  const [relancedPlayerIds, setRelancedPlayerIds] = useState<Set<string>>(new Set());

  // Rules dialog
  const [showRulesDialog, setShowRulesDialog] = useState(false);

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
    if (rolling || allRolled || relancePending) return;
    setRolling(true);
    setTimeout(() => {
      const d1 = rollD6(),
        d2 = rollD6();
      const playerId = players[rollerIndex].id;
      const roll: DiceRoll = {
        playerId,
        dice1: d1,
        dice2: d2,
        score: d1 + d2,
        isDouble: d1 === d2,
      };
      setRolledDice(prev => [...prev, roll]);
      setRolling(false);
      if (d1 === 1 && d2 === 1 && rules.relance && !relancedPlayerIds.has(playerId)) {
        setRelancePending(true);
      } else {
        setRollerIndex(prev => prev + 1);
      }
    }, 700);
  }

  function handleRelanceRoll() {
    if (rolling) return;
    const playerId = players[rollerIndex].id;
    setRelancedPlayerIds(prev => new Set(prev).add(playerId));
    setRelancePending(false);
    setRolling(true);
    setTimeout(() => {
      const d1 = rollD6(),
        d2 = rollD6();
      const roll: DiceRoll = {
        playerId,
        dice1: d1,
        dice2: d2,
        score: d1 + d2,
        isDouble: d1 === d2,
      };
      setRolledDice(prev => [...prev.slice(0, -1), roll]);
      setRollerIndex(prev => prev + 1);
      setRolling(false);
    }, 700);
  }

  function skipRelance() {
    setRelancePending(false);
    setRollerIndex(prev => prev + 1);
  }

  function computeResults() {
    const playerScores = rolledDice.map(roll => {
      const player = players.find(p => p.id === roll.playerId)!;
      return {
        player,
        dice1: roll.dice1,
        dice2: roll.dice2,
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

  const prolCurrentPlayer =
    prolongation && !prolAllRolled ? prolongation.players[prolongation.rollerIndex] : null;

  function handleProlongationRoll() {
    if (!prolongation || prolongation.rolling || prolAllRolled) return;
    setProlongation(prev => (prev ? { ...prev, rolling: true } : prev));
    setTimeout(() => {
      setProlongation(prev => {
        if (!prev) return prev;
        const d1 = rollD6(),
          d2 = rollD6();
        const roll: DiceRoll = {
          playerId: prev.players[prev.rollerIndex].id,
          dice1: d1,
          dice2: d2,
          score: d1 + d2,
          isDouble: d1 === d2,
        };
        return {
          ...prev,
          dice: [...prev.dice, roll],
          rollerIndex: prev.rollerIndex + 1,
          rolling: false,
        };
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
        setResult(prev => (prev ? { ...prev, luckyPlayers: winners } : prev));
        setProlongation(null);
        setPhase('results');
      } else {
        // Encore une égalité — relancer avec les mêmes joueurs
        setProlongation({
          type: 'lucky',
          players: winners,
          dice: [],
          rollerIndex: 0,
          rolling: false,
        });
        // reste en phase prolongation
      }
    } else {
      const maxDist = Math.max(...scores.map(s => s.distance));
      const losers = scores.filter(s => s.distance === maxDist).map(s => s.player);
      setLooserProlongations(prev => prev + 1);
      if (losers.length === 1) {
        setResult(prev => (prev ? { ...prev, looserPlayers: losers } : prev));
        setProlongation(null);
        setPhase('results');
      } else {
        setProlongation({
          type: 'looser',
          players: losers,
          dice: [],
          rollerIndex: 0,
          rolling: false,
        });
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
      const extra =
        luckyProlongations > 0
          ? ` (+${luckyProlongations} prolongation${luckyProlongations > 1 ? 's' : ''})`
          : '';
      msgs.push(
        `🏆 ${luckyPlayers[0].name} distribue ${drinks} ${drinks > 1 ? 's' : ''}${ls.score === ann ? ' — score exact !' : ''}${extra}`
      );
    }

    // Looser — toujours actif, +1 gorgée par prolongation
    if (looserPlayers.length === 1) {
      const drinks = 1 + looserProlongations;
      const extra =
        looserProlongations > 0
          ? ` (+${looserProlongations} prolongation${looserProlongations > 1 ? 's' : ''})`
          : '';
      msgs.push(`💀 ${looserPlayers[0].name} boit ${drinks} ${drinks > 1 ? 's' : ''}${extra}`);
    }

    // Double — optionnel, suspendu pendant les prolongations (déjà géré : on affiche à la fin)
    if (rules.double) {
      playerScores
        .filter(s => s.isDouble)
        .forEach(s => {
          const diceVal = s.dice1;
          if (diceVal === 1) {
            msgs.push(`🎲 ${s.player.name} — Double 1 : distribue 1 ou fait relancer un joueur`);
          } else {
            msgs.push(
              `🎲 ${s.player.name} — Double ${diceVal} : distribue ${diceVal} ${diceVal > 1 ? 's' : ''}`
            );
          }
        });
    }

    // Marchand de sable — optionnel
    if (rules.marchandSable) {
      playerScores
        .filter(s => s.score === 3)
        .forEach(s => {
          msgs.push(`🌙 ${s.player.name} — Marchand de sable : immunité !`);
        });
    }

    // Légende — optionnel
    if (rules.legende) {
      const legendeTriggered = playerScores.some(s => s.score === 11);
      if (legendeTriggered) {
        const affected = playerScores.filter(
          s => s.dice1 === 5 || s.dice1 === 6 || s.dice2 === 5 || s.dice2 === 6
        );
        if (affected.length > 0) {
          const names = affected.map(s => s.player.name).join(', ');
          msgs.push(
            `⭐ Légende ! ${names} boi${affected.length > 1 ? 'vent' : 't'} 1 (dé à 5 ou 6)`
          );
        }
      }
    }

    return msgs;
  }

  // =====================
  // MANAGE PLAYERS
  // =====================

  function addPlayer(e: { preventDefault: () => void }) {
    e.preventDefault();
    setManageError('');
    const name = manageInput.trim();
    if (name.length < 2 || name.length > 20) {
      setManageError('Le pseudo doit faire entre 2 et 20 caractères.');
      return;
    }
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      setManageError('Ce pseudo est déjà dans la partie.');
      return;
    }
    setPlayers(prev => [...prev, { id: generateId(), name }]);
    setManageInput('');
  }

  function removePlayer(id: string) {
    if (players.length <= 2) {
      setManageError('La partie nécessite au moins 2 joueurs.');
      return;
    }
    // Si c'est le Lucky, on le réinitialise
    if (luckyPlayer?.id === id) setLuckyPlayer(null);
    setPlayers(prev => prev.filter(p => p.id !== id));
    setManageError('');
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
    setRelancePending(false);
    setRelancedPlayerIds(new Set());
  }

  // ==============================
  // RENDER
  // ==============================

  // ---- Announce ----
  if (phase === 'announce') {
    return (
      <>
        {showRulesDialog && <RulesDialog rules={rules} onClose={() => setShowRulesDialog(false)} />}
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="flex-1">Tour {round}</CardTitle>
                <Badge variant="secondary">Annonce</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRulesDialog(true)}
                  className="px-2 text-muted-foreground"
                  aria-label="Paramètres"
                >
                  ⚙️
                </Button>
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
                    Rappel : dire <span className="font-semibold text-foreground">"le moins"</span>{' '}
                    pour 2 et <span className="font-semibold text-foreground">"le plus"</span> pour
                    12
                  </div>
                  <Input
                    type="number"
                    min={2}
                    max={12}
                    placeholder="Annonce (2 – 12)"
                    value={announcementInput}
                    onChange={e => {
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
      </>
    );
  }

  // ---- Roll ----
  if (phase === 'roll') {
    return (
      <>
        {showRulesDialog && <RulesDialog rules={rules} onClose={() => setShowRulesDialog(false)} />}
        <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="flex-1">Tour {round}</CardTitle>
                <Badge variant="outline" className="text-base font-bold px-3">
                  {announcement}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRulesDialog(true)}
                  className="px-2 text-muted-foreground"
                  aria-label="Paramètres"
                >
                  ⚙️
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {allRolled ? (
                  'Tous les joueurs ont lancé'
                ) : relancePending ? (
                  <>
                    <span className="font-semibold text-foreground">{currentPlayer!.name}</span> —
                    Double 1, relance disponible
                  </>
                ) : rolling ? (
                  <>
                    <span className="font-semibold text-foreground">{currentPlayer!.name}</span>{' '}
                    lance les dés…
                  </>
                ) : (
                  <>
                    Au tour de{' '}
                    <span className="font-semibold text-foreground">{currentPlayer!.name}</span> de
                    lancer
                  </>
                )}
              </p>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {/* Tableau complet — tous les joueurs */}
              <div className="flex flex-col gap-1.5">
                {players.map((player, index) => {
                  const roll = rolledDice.find(r => r.playerId === player.id);
                  const isCurrent = index === rollerIndex && !allRolled;
                  const showAnim = isCurrent && rolling;
                  const isRelanceRow = isCurrent && relancePending;

                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                        isRelanceRow
                          ? 'border-yellow-500/40 bg-yellow-500/10'
                          : isCurrent && !roll
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border'
                      }`}
                    >
                      {/* Gauche : nom + badges */}
                      <div className="flex items-center gap-2 min-w-0">
                        {isCurrent && !roll && !rolling && (
                          <span className="text-xs text-primary shrink-0">▶</span>
                        )}
                        <span
                          className={`text-sm font-medium truncate ${!roll && !isCurrent ? 'text-muted-foreground' : ''}`}
                        >
                          {player.name}
                        </span>
                        {roll && !showAnim && roll.isDouble && rules.double && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Double
                          </Badge>
                        )}
                        {roll && !showAnim && roll.score === 3 && rules.marchandSable && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Marchand de sable
                          </Badge>
                        )}
                        {relancedPlayerIds.has(player.id) && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            Relance
                          </Badge>
                        )}
                      </div>

                      {/* Droite : dés ou placeholder */}
                      <div className="flex items-center gap-2 shrink-0">
                        {showAnim ? (
                          <>
                            <div className="flex gap-1">
                              <DiceFace value={previewD1} size={30} rolling />
                              <DiceFace value={previewD2} size={30} rolling />
                            </div>
                            <span className="text-sm font-bold w-4" />
                          </>
                        ) : roll ? (
                          <>
                            <div className="flex gap-1">
                              <DiceFace value={roll.dice1} size={30} />
                              <DiceFace value={roll.dice2} size={30} />
                            </div>
                            <span className="text-sm font-bold w-4 text-right">{roll.score}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground pr-6">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bannière relance */}
              {relancePending && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2.5 text-center">
                  <p className="text-sm font-semibold">🎲 Double 1 — Relance disponible</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentPlayer!.name} peut relancer ses dés une fois
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter>
              {relancePending ? (
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleRelanceRoll}
                    disabled={rolling}
                  >
                    {rolling ? 'Lancer…' : 'Relancer les dés'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={skipRelance}
                    disabled={rolling}
                  >
                    Garder le 1•1
                  </Button>
                </div>
              ) : allRolled ? (
                <Button className="w-full" size="lg" onClick={computeResults}>
                  Voir les résultats
                </Button>
              ) : (
                <Button size="lg" className="w-full" onClick={handleRoll} disabled={rolling}>
                  {rolling ? 'Lancer…' : 'Lancer les dés'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }

  // ---- Prolongation ----
  if (phase === 'prolongation' && prolongation) {
    const completedProlongations =
      prolongation.type === 'lucky' ? luckyProlongations : looserProlongations;
    const prolNumber = completedProlongations + 1;
    const accumulatedBonus =
      prolongation.type === 'lucky' ? luckyProlongBonus : looserProlongBonus;
    const drinkStake = 1 + accumulatedBonus + (prolongation.players.length - 1);
    const isLuckyType = prolongation.type === 'lucky';

    return (
      <>
        {showRulesDialog && <RulesDialog rules={rules} onClose={() => setShowRulesDialog(false)} />}
        <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="flex-1">
                  {isLuckyType ? '🏆 Prolongation Lucky' : '💀 Prolongation Looser'}
                </CardTitle>
                <Badge variant="secondary">{ordinal(prolNumber)}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRulesDialog(true)}
                  className="px-2 text-muted-foreground"
                  aria-label="Paramètres"
                >
                  ⚙️
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enjeu :{' '}
                <span className="font-semibold text-foreground">
                  {drinkStake} {drinkStake > 1 ? 's' : ''}
                </span>
                {' · '}Annonce : {announcement}
              </p>
              <p className="text-sm text-muted-foreground">
                {prolAllRolled ? (
                  'Tous les joueurs ont lancé'
                ) : prolongation.rolling ? (
                  <>
                    <span className="font-semibold text-foreground">{prolCurrentPlayer!.name}</span>{' '}
                    lance les dés…
                  </>
                ) : (
                  <>
                    Au tour de{' '}
                    <span className="font-semibold text-foreground">{prolCurrentPlayer!.name}</span>{' '}
                    de lancer
                  </>
                )}
              </p>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {/* Tableau complet — tous les joueurs de la prolongation */}
              <div className="flex flex-col gap-1.5">
                {prolongation.players.map((player, index) => {
                  const roll = prolongation.dice.find(r => r.playerId === player.id);
                  const isCurrent = index === prolongation.rollerIndex && !prolAllRolled;
                  const showAnim = isCurrent && prolongation.rolling;

                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                        isCurrent && !roll ? 'border-primary/40 bg-primary/5' : 'border-border'
                      }`}
                    >
                      {/* Gauche : nom */}
                      <div className="flex items-center gap-2 min-w-0">
                        {isCurrent && !roll && !prolongation.rolling && (
                          <span className="text-xs text-primary shrink-0">▶</span>
                        )}
                        <span
                          className={`text-sm font-medium truncate ${!roll && !isCurrent ? 'text-muted-foreground' : ''}`}
                        >
                          {player.name}
                        </span>
                      </div>

                      {/* Droite : dés ou placeholder */}
                      <div className="flex items-center gap-2 shrink-0">
                        {showAnim ? (
                          <>
                            <div className="flex gap-1">
                              <DiceFace value={previewD1} size={30} rolling />
                              <DiceFace value={previewD2} size={30} rolling />
                            </div>
                            <span className="text-sm font-bold w-4" />
                          </>
                        ) : roll ? (
                          <>
                            <div className="flex gap-1">
                              <DiceFace value={roll.dice1} size={30} />
                              <DiceFace value={roll.dice2} size={30} />
                            </div>
                            <span className="text-sm font-bold w-4 text-right">{roll.score}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground pr-6">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>

            <CardFooter>
              {prolAllRolled ? (
                <Button className="w-full" size="lg" onClick={resolveProlongation}>
                  Résoudre la prolongation
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleProlongationRoll}
                  disabled={prolongation.rolling}
                >
                  {prolongation.rolling ? 'Lancer…' : 'Lancer les dés'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }

  // ---- Manage Players ----
  if (phase === 'manage-players') {
    const canRemove = players.length > 2;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPhase('results')}
                className="px-2"
              >
                ←
              </Button>
              <CardTitle className="flex-1">Gérer les joueurs</CardTitle>
              <Badge variant="secondary">{players.length}</Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {/* Ajout */}
            <form onSubmit={addPlayer} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Nouveau joueur…"
                  value={manageInput}
                  onChange={e => {
                    setManageInput(e.target.value);
                    setManageError('');
                  }}
                  maxLength={20}
                />
                <Button type="submit" disabled={manageInput.trim().length < 2}>
                  Ajouter
                </Button>
              </div>
              {manageError && <p className="text-destructive text-xs">{manageError}</p>}
            </form>

            <Separator />

            {/* Liste */}
            <ul className="flex flex-col gap-1.5">
              {players.map(player => (
                <li
                  key={player.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{player.name}</span>
                    {luckyPlayer?.id === player.id && (
                      <Badge variant="secondary" className="text-xs">
                        Lucky
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!canRemove}
                    onClick={() => removePlayer(player.id)}
                    aria-label={`Supprimer ${player.name}`}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    ✕
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                setPhase('results');
              }}
            >
              Retour aux résultats
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onEnd}>
              Fin de partie
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ---- Results ----
  const luckyTied = (result?.luckyPlayers.length ?? 0) > 1;
  const looserTied = (result?.looserPlayers.length ?? 0) > 1;
  const allResolved = !luckyTied && !looserTied;
  const drinkMessages = getDrinkMessages();
  const sortedScores = result
    ? [...result.playerScores].sort((a, b) => a.distance - b.distance)
    : [];

  return (
    <>
      {showRulesDialog && <RulesDialog rules={rules} onClose={() => setShowRulesDialog(false)} />}
      <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1">Résultats — Tour {round}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRulesDialog(true)}
                className="px-2 text-muted-foreground"
                aria-label="Paramètres"
              >
                ⚙️
              </Button>
            </div>
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
                      <span className="text-sm font-medium">{s.player.name}</span>
                      {s.isDouble && rules.double && (
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
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-1">
                        <DiceFace value={s.dice1} size={28} />
                        <DiceFace value={s.dice2} size={28} />
                      </div>
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
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => startProlongation('lucky', result!.luckyPlayers)}
                >
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
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => startProlongation('looser', result!.looserPlayers)}
                >
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
                    <p key={i} className="text-sm">
                      {msg}
                    </p>
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setManageError('');
                setManageInput('');
                setPhase('manage-players');
              }}
            >
              Gérer les joueurs
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onEnd}>
              Fin de partie
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
