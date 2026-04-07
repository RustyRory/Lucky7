'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SingleDeviceLobby from './components/SingleDeviceLobby';
import RulesPage from './components/RulesPage';
import AboutPage from './components/AboutPage';

type Mode = 'single' | 'rules' | 'about' | null;

export default function Home() {
  const [mode, setMode] = useState<Mode>(null);

  if (mode === 'single') return <SingleDeviceLobby onBack={() => setMode(null)} />;
  if (mode === 'rules') return <RulesPage onBack={() => setMode(null)} />;
  if (mode === 'about') return <AboutPage onBack={() => setMode(null)} />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Lucky7 🎲</CardTitle>
          <CardDescription>
            Lance les dés, sois le plus proche de l'annonce !
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <Button size="lg" className="w-full" onClick={() => setMode('single')}>
            1 appareil
          </Button>

          <Button size="lg" variant="outline" className="w-full flex flex-col h-auto py-3" disabled>
            <span>Multijoueur</span>
            <span className="text-xs font-normal opacity-60">Bientôt disponible</span>
          </Button>

          <Button size="lg" variant="outline" className="w-full" onClick={() => setMode('rules')}>
            Règles du jeu
          </Button>

          <Button size="lg" variant="ghost" className="w-full" onClick={() => setMode('about')}>
            À propos / Comment utiliser l'app
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
