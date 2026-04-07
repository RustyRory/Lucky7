'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AboutPageProps {
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

function Step({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
        {number}
      </span>
      <div>
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default function AboutPage({ onBack }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="px-2">
              ←
            </Button>
            <CardTitle className="flex-1">À propos</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <p className="text-sm text-muted-foreground">
            Lucky7 est une application compagnon pour le jeu de dés du même nom. Elle gère les
            scores, détermine automatiquement le Lucky et le Looser, et applique les règles
            spéciales.
          </p>

          <Separator />

          {/* Mode 1 appareil */}
          <Section title="Mode 1 appareil">
            <p className="text-sm text-muted-foreground">
              Tous les joueurs sont autour du même téléphone ou tablette. Un seul appareil suffit.
            </p>
            <div className="flex flex-col gap-3 mt-1">
              <Step
                number={1}
                title="Ajouter les joueurs"
                desc="Entrez le pseudo de chaque joueur avant de lancer la partie."
              />
              <Step
                number={2}
                title="Choisir les règles"
                desc="Activez ou désactivez les règles optionnelles (Double, Marchand de sable…)."
              />
              <Step
                number={3}
                title="L'annonce"
                desc="Le Lucky annonce le score cible à voix haute. L'application affiche l'annonce pour le premier tour (12) puis vous demande de la saisir."
              />
              <Step
                number={4}
                title="Saisir les scores"
                desc="Après le lancer, chaque joueur saisit son score sur l'appareil. Cochez « Double » si les deux dés sont identiques."
              />
              <Step
                number={5}
                title="Résultats automatiques"
                desc="L'application affiche le Lucky, le Looser et le nombre de gorgées à distribuer selon les règles actives."
              />
            </div>
          </Section>

          <Separator />

          {/* Mode multijoueur */}
          <Section title="Mode multijoueur">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Chaque joueur utilise son propre téléphone. L'hôte crée la partie et les autres
                rejoignent via un code.
              </p>
              <div className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground">
                Ce mode est en cours de développement — bientôt disponible.
              </div>
            </div>
          </Section>

          <Separator />

          {/* Avec des vrais dés */}
          <Section title="Jouer sans l'application">
            <p className="text-sm text-muted-foreground">
              L'application est optionnelle. Pour jouer avec de vrais dés, consultez les règles via
              le bouton <span className="font-medium text-foreground">Règles du jeu</span> depuis
              l'accueil.
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
