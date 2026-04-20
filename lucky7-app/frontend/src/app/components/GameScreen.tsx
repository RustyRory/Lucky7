'use client';

import { useState, useEffect, useRef } from 'react';
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

// Hook : machine à sous avec décélération progressive (~2500ms)
// direction 'up' → cycle 2→12 (jackpot), 'down' → cycle 12→2 (démon)
function useSlotMachine(rolling: boolean, direction: 'up' | 'down' = 'up'): number {
  const [display, setDisplay] = useState(direction === 'up' ? 2 : 12);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterRef = useRef(direction === 'up' ? 2 : 12);

  useEffect(() => {
    if (!rolling) return;
    counterRef.current = direction === 'up' ? 2 : 12;

    // Phases : [durée d'un frame, durée totale de la phase]
    const phases = [
      { interval: 50, phaseDuration: 700 }, // ultra rapide
      { interval: 90, phaseDuration: 600 }, // rapide
      { interval: 160, phaseDuration: 500 }, // ralentit
      { interval: 280, phaseDuration: 420 }, // lent
      { interval: 460, phaseDuration: 280 }, // très lent — derniers clics
    ];

    let phaseIdx = 0;
    let phaseElapsed = 0;

    function tick() {
      counterRef.current =
        direction === 'up'
          ? counterRef.current >= 12
            ? 2
            : counterRef.current + 1
          : counterRef.current <= 2
            ? 12
            : counterRef.current - 1;
      setDisplay(counterRef.current);

      const phase = phases[phaseIdx];
      phaseElapsed += phase.interval;
      if (phaseElapsed >= phase.phaseDuration) {
        phaseIdx++;
        phaseElapsed = 0;
      }
      if (phaseIdx < phases.length) {
        timerRef.current = setTimeout(tick, phases[phaseIdx].interval);
      }
    }

    timerRef.current = setTimeout(tick, phases[0].interval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [rolling, direction]);

  return display;
}

const SLOT_STYLES = {
  jackpot: {
    active: 'border-green-500/70 bg-green-500/10 text-green-500 dark:text-green-400',
    idle: 'border-border text-muted-foreground',
  },
  demon: {
    active:
      'border-red-700/70 bg-red-950/30 text-red-400 dark:text-red-400 shadow-[inset_0_0_8px_rgba(220,38,38,0.2)]',
    idle: 'border-border text-muted-foreground',
  },
} as const;

function SlotMachineDisplay({
  score,
  rolling,
  variant = 'jackpot',
}: {
  score?: number;
  rolling: boolean;
  variant?: 'jackpot' | 'demon';
}) {
  const preview = useSlotMachine(rolling, variant === 'jackpot' ? 'up' : 'down');
  const active = rolling || score !== undefined;
  const styles = SLOT_STYLES[variant];

  return (
    <div
      className={`w-14 h-10 flex items-center justify-center rounded-lg border-2 font-bold text-xl tabular-nums transition-all duration-200 ${
        active ? styles.active : styles.idle
      }`}
    >
      {active ? (rolling ? preview : score) : '—'}
    </div>
  );
}

const CONFETTI_COLORS = [
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f97316',
  '#ec4899',
  '#14b8a6',
];

function TrophyConfetti() {
  return (
    <span className="relative inline-block">
      🏆
      {CONFETTI_COLORS.map((color, i) => (
        <span
          key={i}
          className="anim-confetti-particle"
          style={
            {
              backgroundColor: color,
              '--a': `${i * 45}deg`,
              animationDelay: `${(i * 0.14) % 1.1}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

// ── Jackpot badge coordinator ────────────────────────────────────────────────
// Assigns one of 3 durations (2s/4s/5s) to each badge by registration order.
// When all badges finish, reshuffles and restarts everyone simultaneously.
const JACKPOT_TIERS = [1200, 2500, 4000];

function jShuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const jackpotCoord = (() => {
  let assignments = jShuffle(JACKPOT_TIERS);
  let slots: Array<(d: number) => void> = [];
  let done = 0;
  return {
    register(cb: (d: number) => void): number {
      const idx = slots.length;
      slots.push(cb);
      return assignments[idx] ?? JACKPOT_TIERS[0];
    },
    unregister(cb: (d: number) => void) {
      slots = slots.filter(s => s !== cb);
      if (slots.length === 0) {
        assignments = jShuffle(JACKPOT_TIERS);
        done = 0;
      }
    },
    reportDone() {
      done++;
      if (done >= slots.length && slots.length > 0) {
        setTimeout(() => {
          done = 0;
          assignments = jShuffle(JACKPOT_TIERS);
          slots.forEach((cb, i) => cb(assignments[i]));
        }, 1000);
      }
    },
  };
})();

function JackpotBadge() {
  const [reels, setReels] = useState([7, 7, 7]);
  const [locked, setLocked] = useState([false, false, false]);
  const r = useRef<{ timers: ReturnType<typeof setTimeout>[]; duration: number; spin: () => void }>(
    {
      timers: [],
      duration: 2000,
      spin: () => {},
    }
  );

  useEffect(() => {
    function clearAll() {
      r.current.timers.forEach(t => {
        clearTimeout(t);
        clearInterval(t as unknown as ReturnType<typeof setInterval>);
      });
      r.current.timers = [];
    }

    r.current.spin = function spin() {
      clearAll();
      setLocked([false, false, false]);

      const base = r.current.duration;
      const ivals: ReturnType<typeof setInterval>[] = [];

      [0, 1, 2].forEach(i => {
        const id = setInterval(
          () => {
            setReels(prev => {
              const n = [...prev];
              n[i] = Math.floor(Math.random() * 9) + 1;
              return n;
            });
          },
          80 + i * 15
        );
        r.current.timers.push(id as unknown as ReturnType<typeof setTimeout>);
        ivals.push(id);
      });

      [base, base + 400, base + 800].forEach((delay, i) => {
        const t = setTimeout(() => {
          clearInterval(ivals[i]);
          setReels(prev => {
            const n = [...prev];
            n[i] = 7;
            return n;
          });
          setLocked(prev => {
            const n = [...prev];
            n[i] = true;
            return n;
          });
          // Last reel done — signal coordinator; wait for all badges before restart
          if (i === 2) jackpotCoord.reportDone();
        }, delay);
        r.current.timers.push(t);
      });
    };

    const cb = (d: number) => {
      r.current.duration = d;
      r.current.spin();
    };
    r.current.duration = jackpotCoord.register(cb);
    r.current.spin();

    return () => {
      jackpotCoord.unregister(cb);
      clearAll();
    };
  }, []);

  const allLocked = locked.every(Boolean);
  const [rainKey, setRainKey] = useState(0);
  const prevAllLocked = useRef(false);
  useEffect(() => {
    if (allLocked && !prevAllLocked.current) setRainKey(k => k + 1);
    prevAllLocked.current = allLocked;
  }, [allLocked]);

  return (
    <span className="relative inline-flex items-center gap-px bg-green-500/15 border border-green-500/40 rounded px-1 py-px font-black tabular-nums leading-none text-[11px]">
      {reels.map((n, i) => (
        <span
          key={i}
          className={`w-[9px] text-center transition-colors duration-150 ${locked[i] ? 'text-yellow-400' : 'text-green-400'}`}
        >
          {n}
        </span>
      ))}
      {allLocked &&
        [0, 1, 2].map(i => (
          <span
            key={`${rainKey}-${i}`}
            className="anim-coin-rain"
            style={{ right: `${i * 10}px`, animationDelay: `${i * 0.12}s`, zIndex: 50 }}
          >
            🪙
          </span>
        ))}
    </span>
  );
}

function DoubleBadge({ value }: { value: number }) {
  const [display, setDisplay] = useState(1);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 0;
    for (let target = 2; target <= value; target++) {
      // x1=1.2s, x2=1s, x3=0.8s, x4=0.6s, x5+=0.3s min
      cumulative += Math.max(300, 1200 - (target - 2) * 200);
      const t = setTimeout(() => setDisplay(target), cumulative);
      timers.push(t);
    }
    return () => timers.forEach(clearTimeout);
  }, [value]);

  return (
    <span className="inline-flex items-center bg-blue-500/15 border border-blue-500/40 rounded px-1 py-px font-black tabular-nums leading-none text-[11px] text-blue-400">
      <span key={display} className="anim-badge-slam">
        x{display}
      </span>
    </span>
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
  jeton: boolean;
  jackpot: boolean;
  demon: boolean;
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
          <RuleItem
            label="Jeton"
            active={rules.jeton}
            desc="Score de 7 → boit 1 gorgée et ajoute +1 au pot"
          />
          <RuleItem
            label="Jackpot"
            active={rules.jackpot}
            desc="3+ joueurs à 7 → jeton suspendu, reroll pour distribuer le pot"
          />
          <RuleItem
            label="Démon"
            active={rules.demon}
            desc="3+ joueurs avec un dé à 6 → reroll pour décider qui boit le pot"
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

interface SpecialEventResult {
  type: 'jackpot' | 'demon';
  winner: Player;
  potValue: number;
}

interface SpecialEventState {
  type: 'jackpot' | 'demon';
  triggerPlayers: Player[];
  potValue: number;
  dice: DiceRoll[];
  rollerIndex: number;
  rolling: boolean;
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
  jackpotTriggered: boolean;
  specialResults: SpecialEventResult[];
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

type Phase = 'announce' | 'roll' | 'results' | 'prolongation' | 'special-event' | 'manage-players';

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
  const [detailedResults, setDetailedResults] = useState(false);
  // Cumulative sip bonus from prolongations (sum of participants−1 per round)
  const [luckyProlongBonus, setLuckyProlongBonus] = useState(0);
  const [looserProlongBonus, setLooserProlongBonus] = useState(0);

  // Prolongation state
  const [prolongation, setProlongation] = useState<ProlongationState | null>(null);

  // Special events (jackpot / demon) — queue, premier élément = en cours
  const [specialEvents, setSpecialEvents] = useState<SpecialEventState[]>([]);
  // Pot de gorgées accumulé par la règle Jeton (persiste entre les tours)
  const [pot, setPot] = useState(0);

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

    // ── Détection événements spéciaux ──
    const events: SpecialEventState[] = [];
    let jackpotTriggered = false;

    const sevensPlayers = playerScores.filter(s => s.score === 7);

    // Jackpot : exactement 3 joueurs à 7
    if (rules.jackpot && sevensPlayers.length === 3) {
      jackpotTriggered = true;
    }

    // Mise à jour du pot Jeton — les contributions sont toujours ajoutées,
    // même lors d'un Jackpot (le pot est alors immédiatement distribué puis remis à zéro)
    let currentPot = pot;
    if (rules.jeton && sevensPlayers.length > 0) {
      currentPot = pot + sevensPlayers.length;
      if (!jackpotTriggered) setPot(currentPot);
    }

    // Construction des événements — chacun capture sa valeur de pot
    let potAvailable = currentPot;

    if (jackpotTriggered) {
      const jackpotPot = potAvailable > 0 ? potAvailable : rollD6();
      potAvailable = 0;
      events.push({
        type: 'jackpot',
        triggerPlayers: sevensPlayers.map(s => s.player),
        potValue: jackpotPot,
        dice: [],
        rollerIndex: 0,
        rolling: false,
      });
    }

    // Démon : exactement 3 joueurs avec un score (somme) de 6
    const demonPlayers = playerScores.filter(s => s.score === 6);
    if (rules.demon && demonPlayers.length === 3) {
      const demonPot = potAvailable > 0 ? potAvailable : rollD6();
      potAvailable = 0;
      events.push({
        type: 'demon',
        triggerPlayers: demonPlayers.map(s => s.player),
        potValue: demonPot,
        dice: [],
        rollerIndex: 0,
        rolling: false,
      });
    }

    // Si un événement spécial s'est produit, le pot est consommé → remise à zéro
    if (events.length > 0) setPot(0);

    setResult({
      luckyPlayers,
      looserPlayers,
      announcement,
      playerScores,
      jackpotTriggered,
      specialResults: [],
    });

    if (events.length > 0) {
      setSpecialEvents(events);
      setPhase('special-event');
    } else {
      setPhase('results');
    }
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
      setLuckyProlongBonus(prev => prev + (tiedPlayers.length - 1));
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
      setLooserProlongBonus(prev => prev + (tiedPlayers.length - 1));
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
  // SPECIAL EVENTS (JACKPOT / DEMON)
  // =====================

  function handleSpecialEventRoll() {
    const event = specialEvents[0];
    if (!event || event.rolling || event.rollerIndex >= event.triggerPlayers.length) return;
    setSpecialEvents(prev => [{ ...prev[0], rolling: true }, ...prev.slice(1)]);
    setTimeout(() => {
      setSpecialEvents(prev => {
        const current = prev[0];
        if (!current) return prev;
        const d1 = rollD6(),
          d2 = rollD6();
        const roll: DiceRoll = {
          playerId: current.triggerPlayers[current.rollerIndex].id,
          dice1: d1,
          dice2: d2,
          score: d1 + d2,
          isDouble: d1 === d2,
        };
        return [
          {
            ...current,
            dice: [...current.dice, roll],
            rollerIndex: current.rollerIndex + 1,
            rolling: false,
          },
          ...prev.slice(1),
        ];
      });
    }, 2500);
  }

  function resolveSpecialEvent() {
    const event = specialEvents[0];
    if (!event) return;

    const scores = event.dice.map(d => ({
      player: event.triggerPlayers.find(p => p.id === d.playerId)!,
      score: d.score,
      distance: Math.abs(d.score - announcement),
    }));

    if (event.type === 'jackpot') {
      // Le plus proche distribue le pot
      const minDist = Math.min(...scores.map(s => s.distance));
      const winners = scores.filter(s => s.distance === minDist);
      if (winners.length === 1) {
        setResult(prev =>
          prev
            ? {
                ...prev,
                specialResults: [
                  ...prev.specialResults,
                  { type: 'jackpot', winner: winners[0].player, potValue: event.potValue },
                ],
              }
            : prev
        );
        proceedToNextSpecialEvent();
      } else {
        // Égalité : reroll avec les joueurs à égalité
        setSpecialEvents(prev => [
          {
            ...event,
            triggerPlayers: winners.map(s => s.player),
            dice: [],
            rollerIndex: 0,
            rolling: false,
          },
          ...prev.slice(1),
        ]);
      }
    } else {
      // Démon : le plus éloigné boit le pot
      const maxDist = Math.max(...scores.map(s => s.distance));
      const losers = scores.filter(s => s.distance === maxDist);
      if (losers.length === 1) {
        setResult(prev =>
          prev
            ? {
                ...prev,
                specialResults: [
                  ...prev.specialResults,
                  { type: 'demon', winner: losers[0].player, potValue: event.potValue },
                ],
              }
            : prev
        );
        proceedToNextSpecialEvent();
      } else {
        setSpecialEvents(prev => [
          {
            ...event,
            triggerPlayers: losers.map(s => s.player),
            dice: [],
            rollerIndex: 0,
            rolling: false,
          },
          ...prev.slice(1),
        ]);
      }
    }
  }

  function proceedToNextSpecialEvent() {
    const remaining = specialEvents.slice(1);
    setSpecialEvents(remaining);
    if (remaining.length === 0) setPhase('results');
  }

  // =====================
  // RESULTS — DRINK CALC
  // =====================

  function getDrinkMessages(): string[] {
    if (!result) return [];
    const msgs: string[] = [];
    const {
      luckyPlayers,
      looserPlayers,
      playerScores,
      announcement: ann,
      jackpotTriggered,
      specialResults,
    } = result;

    // Lucky
    if (luckyPlayers.length === 1) {
      const ls = playerScores.find(s => s.player.id === luckyPlayers[0].id)!;
      const base = ls.score === ann ? 2 : 1;
      const total = base + luckyProlongBonus;
      const expl: string[] = [];
      if (ls.score === ann) expl.push('score exact → base 2');
      else expl.push(`base 1`);
      if (luckyProlongations > 0)
        expl.push(
          `+${luckyProlongBonus} (${luckyProlongations} prolongation${luckyProlongations > 1 ? 's' : ''})`
        );
      msgs.push(`🏆 - ${luckyPlayers[0].name} (Lucky) : donne ${total} — ${expl.join(', ')}`);
    }

    // Looser
    if (looserPlayers.length === 1) {
      const ls = playerScores.find(s => s.player.id === looserPlayers[0].id)!;
      const total = 1 + looserProlongBonus;
      const expl: string[] = [`distance de ${ls.distance} depuis l'annonce`];
      if (looserProlongations > 0)
        expl.push(
          `+${looserProlongBonus} (${looserProlongations} prolongation${looserProlongations > 1 ? 's' : ''})`
        );
      msgs.push(`💀 - ${looserPlayers[0].name} (Looser) : boit ${total} — ${expl.join(', ')}`);
    }

    // Double
    if (rules.double) {
      playerScores
        .filter(s => s.isDouble)
        .forEach(s => {
          if (s.dice1 === 1) {
            msgs.push(
              `🎲 - ${s.player.name} (Double) : donne 1 — double 1 (${s.dice1}•${s.dice2}), peut faire relancer`
            );
          } else {
            msgs.push(
              `🎲 - ${s.player.name} (Double) : donne ${s.dice1} — double ${s.dice1} (${s.dice1}•${s.dice2})`
            );
          }
        });
    }

    // Marchand de sable
    if (rules.marchandSable) {
      playerScores
        .filter(s => s.score === 3)
        .forEach(s => {
          msgs.push(
            `🌙 - ${s.player.name} (Marchand de sable) : immunisé — score de 3 (${s.dice1}•${s.dice2})`
          );
        });
    }

    // Légende
    if (rules.legende) {
      const trigger = playerScores.find(s => s.score === 11);
      if (trigger) {
        playerScores
          .filter(s => s.dice1 === 5 || s.dice1 === 6 || s.dice2 === 5 || s.dice2 === 6)
          .forEach(s => {
            const highDie = s.dice1 >= 5 ? s.dice1 : s.dice2;
            const by =
              trigger.player.id !== s.player.id
                ? ` (déclenché par ${trigger.player.name} avec ${trigger.dice1}•${trigger.dice2})`
                : '';
            msgs.push(`⭐ - ${s.player.name} (Légende) : boit 1 — dé à ${highDie}${by}`);
          });
      }
    }

    // Jeton (suspendu si jackpot déclenché)
    if (rules.jeton && !jackpotTriggered) {
      playerScores
        .filter(s => s.score === 7)
        .forEach(s => {
          msgs.push(
            `🪙 - ${s.player.name} (Jeton) : +1🪙 au pot — score de 7 (${s.dice1}•${s.dice2}), pot total : ${pot}`
          );
        });
    }

    // Résultats jackpot / démon
    specialResults.forEach(sr => {
      if (sr.type === 'jackpot') {
        msgs.push(
          `🎰 - ${sr.winner.name} (Jackpot) : donne ${sr.potValue} — meilleur score du reroll`
        );
      } else {
        msgs.push(`😈 - ${sr.winner.name} (Démon) : boit ${sr.potValue} — pire score du reroll`);
      }
    });

    return msgs;
  }

  interface PlayerAction {
    player: Player;
    drinks: number;
    gives: number;
    immune: boolean;
  }

  function getPlayerActions(): PlayerAction[] {
    if (!result) return [];
    const { luckyPlayers, looserPlayers, playerScores, specialResults } = result;

    const map = new Map<string, PlayerAction>();
    function getOrCreate(player: Player): PlayerAction {
      if (!map.has(player.id)) map.set(player.id, { player, drinks: 0, gives: 0, immune: false });
      return map.get(player.id)!;
    }

    if (luckyPlayers.length === 1) {
      const ls = playerScores.find(s => s.player.id === luckyPlayers[0].id)!;
      const base = ls.score === result.announcement ? 2 : 1;
      getOrCreate(luckyPlayers[0]).gives += base + luckyProlongBonus;
    }

    if (looserPlayers.length === 1) {
      getOrCreate(looserPlayers[0]).drinks += 1 + looserProlongBonus;
    }

    if (rules.double) {
      playerScores
        .filter(s => s.isDouble)
        .forEach(s => {
          getOrCreate(s.player).gives += s.dice1 === 1 ? 1 : s.dice1;
        });
    }

    if (rules.marchandSable) {
      playerScores
        .filter(s => s.score === 3)
        .forEach(s => {
          getOrCreate(s.player).immune = true;
        });
    }

    if (rules.legende && playerScores.some(s => s.score === 11)) {
      playerScores
        .filter(s => s.dice1 === 5 || s.dice1 === 6 || s.dice2 === 5 || s.dice2 === 6)
        .forEach(s => {
          getOrCreate(s.player).drinks += 1;
        });
    }

    specialResults.forEach(sr => {
      if (sr.type === 'jackpot') getOrCreate(sr.winner).gives += sr.potValue;
      else getOrCreate(sr.winner).drinks += sr.potValue;
    });

    return Array.from(map.values())
      .map(a => ({ ...a, drinks: a.immune ? 0 : a.drinks }))
      .filter(a => a.drinks > 0 || a.gives > 0);
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
    setLuckyProlongBonus(0);
    setLooserProlongBonus(0);
    setProlongation(null);
    setSpecialEvents([]);
    // pot persiste entre les tours
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
              {rules.jeton && pot > 0 && (
                <p className="text-xs text-muted-foreground">
                  Pot : <span className="font-semibold text-foreground">{pot} 🪙</span>
                </p>
              )}
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
                {(() => {
                  const jackpotVisible =
                    allRolled &&
                    rules.jackpot &&
                    rolledDice.filter(r => r.score === 7).length === 3;
                  const demonVisible =
                    allRolled && rules.demon && rolledDice.filter(r => r.score === 6).length === 3;
                  const legendeVisible = rules.legende && rolledDice.some(r => r.score === 11);

                  return players.map((player, index) => {
                    const roll = rolledDice.find(r => r.playerId === player.id);
                    const isCurrent = index === rollerIndex && !allRolled;
                    const showAnim = isCurrent && rolling;
                    const isRelanceRow = isCurrent && relancePending;
                    const revealed = !!roll && !showAnim;

                    const isJackpotPlayer = jackpotVisible && roll?.score === 7;
                    const isDemonPlayer = demonVisible && roll?.score === 6;
                    const isMarchand =
                      revealed &&
                      !isJackpotPlayer &&
                      !isDemonPlayer &&
                      rules.marchandSable &&
                      roll.score === 3;
                    const isLegende =
                      revealed &&
                      !isJackpotPlayer &&
                      !isDemonPlayer &&
                      legendeVisible &&
                      (roll.dice1 >= 5 || roll.dice2 >= 5);
                    const isLegendeTrigger =
                      revealed &&
                      !isJackpotPlayer &&
                      !isDemonPlayer &&
                      legendeVisible &&
                      roll.score === 11;
                    const isJeton =
                      revealed &&
                      !isJackpotPlayer &&
                      !isDemonPlayer &&
                      rules.jeton &&
                      !jackpotVisible &&
                      roll.score === 7;
                    const isDouble =
                      revealed &&
                      !isJackpotPlayer &&
                      !isDemonPlayer &&
                      rules.double &&
                      roll.isDouble;
                    const isRelanced = relancedPlayerIds.has(player.id);

                    const containerClass = [
                      'relative overflow-hidden flex items-center justify-between rounded-lg border px-3 py-2',
                      isRelanceRow
                        ? 'border-yellow-500/40 bg-yellow-500/10'
                        : isJackpotPlayer
                          ? 'anim-jackpot'
                          : isDemonPlayer
                            ? 'anim-demon'
                            : isMarchand
                              ? 'anim-marchand'
                              : isDouble
                                ? 'anim-double'
                                : isLegendeTrigger
                                  ? 'bg-purple-900/30 border-purple-400/60'
                                  : isCurrent && !roll
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-border',
                    ].join(' ');

                    return (
                      <div key={player.id} className={containerClass}>
                        {/* Décorations thématiques */}
                        {isJackpotPlayer && (
                          <>
                            <span className="absolute right-1 top-0 text-xl opacity-[0.12] select-none pointer-events-none leading-tight">
                              🍀
                            </span>
                            <span className="absolute right-7 bottom-0 text-lg opacity-[0.10] select-none pointer-events-none leading-tight">
                              🍀
                            </span>
                          </>
                        )}
                        {isDemonPlayer && (
                          <span className="absolute right-1 -top-0.5 text-2xl opacity-[0.18] select-none pointer-events-none">
                            🔥
                          </span>
                        )}

                        {isDouble && (
                          <span className="absolute right-1 top-0 text-5xl font-black opacity-[0.18] select-none pointer-events-none leading-tight text-blue-300">
                            {roll.dice1}
                          </span>
                        )}
                        {/* Gauche : nom */}
                        <div className="flex items-center gap-2 min-w-0 relative z-10">
                          {isCurrent && !roll && !rolling && (
                            <span className="text-xs text-primary shrink-0">▶</span>
                          )}
                          <span
                            className={`text-sm font-medium truncate ${
                              !roll && !isCurrent ? 'text-muted-foreground' : ''
                            }`}
                          >
                            {player.name}
                          </span>
                          {isMarchand && <span>🌙</span>}
                          {isJackpotPlayer && <JackpotBadge />}
                          {isDemonPlayer && <span className="anim-demon-laugh">😈</span>}
                          {isDouble && <DoubleBadge value={roll.dice1} />}
                          {isLegende && <span className="anim-badge-pop">⭐</span>}
                          {isJeton && <span className="anim-badge-pop">🪙</span>}
                          {isRelanced && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              Relancé
                            </Badge>
                          )}
                        </div>

                        {/* Droite : dés ou placeholder */}
                        <div className="flex items-center gap-2 shrink-0 relative z-10">
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
                  });
                })()}
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

  // ---- Special Event (Jackpot / Démon) ----
  if (phase === 'special-event' && specialEvents.length > 0) {
    const event = specialEvents[0];
    const eventAllRolled = event.rollerIndex >= event.triggerPlayers.length;
    const eventCurrentPlayer = !eventAllRolled ? event.triggerPlayers[event.rollerIndex] : null;
    const isJackpot = event.type === 'jackpot';

    return (
      <>
        {showRulesDialog && <RulesDialog rules={rules} onClose={() => setShowRulesDialog(false)} />}
        <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="flex-1">
                  {isJackpot ? '🎰 Jackpot !' : '😈 Démon !'}
                </CardTitle>
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
                Pot :{' '}
                <span className="font-semibold text-foreground">
                  {event.potValue} jeton{event.potValue > 1 ? 's' : ''}
                </span>
                {isJackpot ? ' à distribuer' : ' à boire'} · Annonce : {announcement}
              </p>
              <p className="text-sm text-muted-foreground">
                {eventAllRolled ? (
                  'Tous les joueurs ont lancé'
                ) : event.rolling ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {eventCurrentPlayer!.name}
                    </span>{' '}
                    lance les dés…
                  </>
                ) : (
                  <>
                    Au tour de{' '}
                    <span className="font-semibold text-foreground">
                      {eventCurrentPlayer!.name}
                    </span>{' '}
                    de lancer
                  </>
                )}
              </p>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                {event.triggerPlayers.map((player, index) => {
                  const roll = event.dice.find(r => r.playerId === player.id);
                  const isCurrent = index === event.rollerIndex && !eventAllRolled;
                  const showAnim = isCurrent && event.rolling;

                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                        isCurrent && !roll ? 'border-primary/40 bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isCurrent && !roll && !event.rolling && (
                          <span className="text-xs text-primary shrink-0">▶</span>
                        )}
                        <span
                          className={`text-sm font-medium truncate ${!roll && !isCurrent ? 'text-muted-foreground' : ''}`}
                        >
                          {player.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <SlotMachineDisplay
                          score={roll?.score}
                          rolling={showAnim}
                          variant={isJackpot ? 'jackpot' : 'demon'}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>

            <CardFooter>
              {eventAllRolled ? (
                <Button className="w-full" size="lg" onClick={resolveSpecialEvent}>
                  {isJackpot ? 'Résoudre le Jackpot' : 'Résoudre le Démon'}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSpecialEventRoll}
                  disabled={event.rolling}
                >
                  {event.rolling ? 'Lancer…' : 'Lancer les dés'}
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
    const accumulatedBonus = prolongation.type === 'lucky' ? luckyProlongBonus : looserProlongBonus;
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
                  {drinkStake} Gorgée{drinkStake > 1 ? 's' : ''}
                </span>
                {' · '}Annonce : {announcement}
                {rules.jeton && pot > 0 && (
                  <>
                    {' · '}
                    <span className="font-semibold text-foreground">Pot : {pot} 🪙</span>
                  </>
                )}
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
            <p className="text-xs text-muted-foreground">
              Annonce : {announcement}
              {rules.jeton && pot > 0 && (
                <>
                  {' · '}Pot : <span className="font-semibold text-foreground">{pot} 🪙</span>
                </>
              )}
            </p>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {/* Scores */}
            <div className="flex flex-col gap-1.5">
              {(() => {
                const legendeTriggered =
                  rules.legende && result!.playerScores.some(ps => ps.score === 11);
                const jackpotWinnerId = result!.specialResults.find(sr => sr.type === 'jackpot')
                  ?.winner.id;
                const demonWinnerId = result!.specialResults.find(sr => sr.type === 'demon')?.winner
                  .id;

                return sortedScores.map(s => {
                  const isLucky = result!.luckyPlayers.some(p => p.id === s.player.id);
                  const isLooser = result!.looserPlayers.some(p => p.id === s.player.id);
                  const isJackpotPlayer = !!jackpotWinnerId && s.player.id === jackpotWinnerId;
                  const isDemonPlayer = !!demonWinnerId && s.player.id === demonWinnerId;
                  const isMarchand =
                    !isJackpotPlayer && !isDemonPlayer && rules.marchandSable && s.score === 3;
                  const isLegende =
                    !isJackpotPlayer &&
                    !isDemonPlayer &&
                    !isMarchand &&
                    legendeTriggered &&
                    (s.dice1 >= 5 || s.dice2 >= 5);
                  const isJeton =
                    !isJackpotPlayer &&
                    !isDemonPlayer &&
                    rules.jeton &&
                    !result!.jackpotTriggered &&
                    s.score === 7;
                  const isDouble = !isJackpotPlayer && !isDemonPlayer && rules.double && s.isDouble;
                  const isRelanced = relancedPlayerIds.has(s.player.id);

                  const containerClass = [
                    'relative overflow-hidden flex items-center justify-between rounded-lg px-3 py-2.5 border transition-colors',
                    isLucky && !isLooser
                      ? 'bg-yellow-500/10 border-yellow-500/40'
                      : isLooser && !isLucky
                        ? 'bg-destructive/10 border-destructive/30'
                        : isJackpotPlayer
                          ? 'bg-emerald-900/25 border-emerald-500/50'
                          : isDemonPlayer
                            ? 'bg-red-950/40 border-red-700/60'
                            : isMarchand
                              ? 'bg-amber-800/15 border-amber-500/40'
                              : isDouble
                                ? 'bg-blue-500/10 border-blue-500/40'
                                : 'border-border',
                  ].join(' ');

                  return (
                    <div key={s.player.id} className={containerClass}>
                      {/* ── Décorations thématiques ── */}
                      {isJackpotPlayer && (
                        <>
                          <span className="absolute right-1 top-0 text-xl opacity-[0.12] select-none pointer-events-none leading-tight">
                            🍀
                          </span>
                          <span className="absolute right-7 bottom-0 text-lg opacity-[0.10] select-none pointer-events-none leading-tight">
                            🍀
                          </span>
                        </>
                      )}
                      {isDemonPlayer && (
                        <span className="absolute right-1 -top-0.5 text-2xl opacity-[0.18] select-none pointer-events-none">
                          🔥
                        </span>
                      )}

                      {isDouble && (
                        <span className="absolute right-1 top-0 text-5xl font-black opacity-[0.18] select-none pointer-events-none leading-tight text-blue-300">
                          {s.dice1}
                        </span>
                      )}
                      {/* ── Contenu principal ── */}
                      <div className="flex items-center gap-2 flex-wrap relative z-10">
                        {isLucky && <TrophyConfetti />}
                        {isLooser && !isLucky && <span className="anim-skull-decompose">💀</span>}
                        <span className="text-sm font-medium">{s.player.name}</span>
                        {isMarchand && <span>🌙</span>}
                        {isJackpotPlayer && <JackpotBadge />}
                        {isDemonPlayer && <span className="anim-demon-laugh">😈</span>}
                        {isDouble && <DoubleBadge value={s.dice1} />}
                        {isLegende && <span>⭐</span>}
                        {isJeton && <span>🪙</span>}
                        {isRelanced && (
                          <Badge variant="outline" className="text-xs">
                            Relancé
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 relative z-10">
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
                });
              })()}
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
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Gorgées</p>
                    <div className="flex rounded-lg overflow-hidden border border-border text-xs">
                      <button
                        type="button"
                        onClick={() => setDetailedResults(false)}
                        className={`px-2.5 py-1 transition-colors ${!detailedResults ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                      >
                        Résumé
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailedResults(true)}
                        className={`px-2.5 py-1 transition-colors ${detailedResults ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                      >
                        Détail
                      </button>
                    </div>
                  </div>
                  {detailedResults
                    ? drinkMessages.map((msg, i) => (
                        <p key={i} className="text-sm">
                          {msg}
                        </p>
                      ))
                    : getPlayerActions().map(a => {
                        const parts: string[] = [];
                        if (a.gives > 0) parts.push(`distribue ${a.gives}`);
                        if (a.drinks > 0) parts.push(`boit ${a.drinks}`);
                        if (a.immune) parts.push('immunisé 🌙');
                        return (
                          <p key={a.player.id} className="text-sm">
                            <span className="font-medium">{a.player.name}</span> {parts.join(' · ')}
                          </p>
                        );
                      })}
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
