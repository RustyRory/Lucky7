'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface RulesPageProps {
  onBack: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function Rule({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-base shrink-0">{emoji}</span>
      <div>
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default function RulesPage({ onBack }: RulesPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="px-2">
              ←
            </Button>
            <CardTitle className="flex-1">Règles du jeu</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {/* Intro */}
          <p className="text-sm text-muted-foreground">
            Lancez 2 dés et obtenez un score le plus proche possible de l'annonce. Jouable avec de
            vrais dés ou via l'application.
          </p>

          <Separator />

          {/* Préparation */}
          <Section title="Préparation">
            <ul className="text-sm text-muted-foreground flex flex-col gap-1 pl-1">
              <li>• 2 dés à 6 faces par joueur (ou l'application)</li>
              <li>• Un verre par joueur</li>
              <li>• 3 à 8 joueurs recommandés</li>
            </ul>
          </Section>

          <Separator />

          {/* Déroulement */}
          <Section title="Déroulement d'un tour">
            <div className="flex flex-col gap-3">
              <Rule
                emoji="📢"
                title="L'Annonce"
                desc="Le Lucky choisit un nombre entre 2 et 12. Au premier tour, l'annonce est toujours 12. Attention : dire « le moins » pour 2 et « le plus » pour 12 — sinon 1 gorgée de pénalité."
              />
              <Rule
                emoji="🎲"
                title="Lancer des dés"
                desc="Tous les joueurs lancent leurs 2 dés simultanément et calculent leur total."
              />
              <Rule
                emoji="🏆"
                title="Lucky"
                desc="Le joueur le plus proche de l'annonce distribue 1 gorgée (2 s'il obtient le score exact)."
              />
              <Rule
                emoji="💀"
                title="Looser"
                desc="Le joueur le plus éloigné de l'annonce boit 1 gorgée."
              />
              <Rule
                emoji="⚖️"
                title="Égalité"
                desc="En cas d'égalité pour le Lucky ou le Looser, les joueurs concernés rejouent un tour supplémentaire."
              />
            </div>
          </Section>

          <Separator />

          {/* Règles spéciales */}
          <Section title="Règles spéciales">
            <div className="flex flex-col gap-3">
              <Rule
                emoji="🎲"
                title="Double"
                desc="Deux dés identiques → le joueur distribue autant de gorgées que la valeur du dé. Double 1 (score 2) : distribue 1 gorgée ou fait relancer le joueur de son choix."
              />
              <Rule
                emoji="🌙"
                title="Marchand de sable"
                desc="Score de 3 (1+2) → immunité totale contre les gorgées pour ce tour."
              />
              <Rule
                emoji="7️⃣"
                title="Jeton"
                desc="Score de 7 → le joueur boit 1 gorgée."
              />
              <Rule
                emoji="🎰"
                title="Jackpot"
                desc="Trois joueurs obtiennent un 7 → la règle Jeton est suspendue. Un dé est lancé pour fixer le pot, les trois joueurs relancent pour décider qui le distribue."
              />
              <Rule
                emoji="⭐"
                title="Légende"
                desc="Score de 11 (5+6) → tous les joueurs ayant un dé à 5 ou 6 boivent 1 gorgée."
              />
              <Rule
                emoji="😈"
                title="Démon"
                desc="Trois joueurs obtiennent un 6 → un dé est lancé pour le pot, et ces trois joueurs relancent pour décider qui le boit."
              />
            </div>
          </Section>

          <Separator />

          {/* Hors-jeu */}
          <Section title="Pénalités">
            <div className="flex flex-col gap-3">
              <Rule
                emoji="⚠️"
                title="Lancer prématuré (Lucky)"
                desc="Le Lucky lance sans annoncer → il boit et recommence l'annonce."
              />
              <Rule
                emoji="⚠️"
                title="Lancer non autorisé"
                desc="Un joueur qui n'est pas le Lucky lance ses dés → il boit 1 gorgée."
              />
            </div>
          </Section>

          <Separator />

          {/* Fin */}
          <Section title="Fin de partie">
            <p className="text-sm text-muted-foreground">
              Chaque tour est indépendant. À la fin d'un tour, les joueurs choisissent de continuer,
              s'arrêter ou laisser un nouveau joueur rejoindre.
            </p>
          </Section>

          <Button variant="outline" className="w-full mt-1" onClick={onBack}>
            Retour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
