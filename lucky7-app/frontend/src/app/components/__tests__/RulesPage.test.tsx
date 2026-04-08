import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RulesPage from '../RulesPage';

describe('RulesPage', () => {
  it('affiche le titre', () => {
    render(<RulesPage onBack={vi.fn()} />);
    expect(screen.getByText('Règles du jeu')).toBeInTheDocument();
  });

  it('affiche les sections principales', () => {
    render(<RulesPage onBack={vi.fn()} />);
    expect(screen.getByText('Préparation')).toBeInTheDocument();
    expect(screen.getByText("Déroulement d'un tour")).toBeInTheDocument();
    expect(screen.getByText('Règles spéciales')).toBeInTheDocument();
    expect(screen.getByText('Pénalités')).toBeInTheDocument();
    expect(screen.getByText('Fin de partie')).toBeInTheDocument();
  });

  it('affiche la règle Relance', () => {
    render(<RulesPage onBack={vi.fn()} />);
    expect(screen.getByText('Relance (Double 1)')).toBeInTheDocument();
  });

  it('appelle onBack au clic sur le bouton retour', async () => {
    const onBack = vi.fn();
    render(<RulesPage onBack={onBack} />);
    await userEvent.click(screen.getAllByRole('button')[0]);
    expect(onBack).toHaveBeenCalledOnce();
  });
});
