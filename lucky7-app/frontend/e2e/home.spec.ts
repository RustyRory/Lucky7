import { test, expect } from '@playwright/test';

// CardTitle est un <div data-slot="card-title">, pas un heading HTML
const cardTitle = (page: import('@playwright/test').Page, name: string) =>
  page.locator('[data-slot="card-title"]', { hasText: name });

test.describe("Page d'accueil", () => {
  test('affiche le titre et les boutons principaux', async ({ page }) => {
    await page.goto('/');
    await expect(cardTitle(page, 'Lucky7')).toBeVisible();
    await expect(page.getByRole('button', { name: '1 appareil' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Règles du jeu' })).toBeVisible();
    await expect(page.getByRole('button', { name: /À propos/i })).toBeVisible();
  });

  test('le bouton Multijoueur est désactivé', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Multijoueur/i })).toBeDisabled();
  });
});

test.describe('Règles du jeu', () => {
  test('navigue vers la page des règles', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Règles du jeu' }).click();
    await expect(cardTitle(page, 'Règles du jeu')).toBeVisible();
    await expect(page.getByText('Préparation')).toBeVisible();
    await expect(page.getByText('Règles spéciales')).toBeVisible();
  });

  test("le bouton retour ramène à l'accueil", async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Règles du jeu' }).click();
    await page.getByRole('button', { name: '←' }).first().click();
    await expect(cardTitle(page, 'Lucky7')).toBeVisible();
  });
});

test.describe('Lobby — 1 appareil', () => {
  test("affiche le formulaire d'ajout de joueurs", async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '1 appareil' }).click();
    await expect(page.getByPlaceholder('Pseudo du joueur…')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ajouter' })).toBeVisible();
  });

  test('ajoute et supprime un joueur', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '1 appareil' }).click();

    await page.getByPlaceholder('Pseudo du joueur…').fill('Alice');
    await page.getByRole('button', { name: 'Ajouter' }).click();
    await expect(page.getByText('Alice')).toBeVisible();

    await page.getByRole('button', { name: 'Supprimer Alice' }).click();
    await expect(page.getByText('Alice')).not.toBeVisible();
  });

  test('le bouton Lancer est désactivé avec moins de 2 joueurs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '1 appareil' }).click();

    await expect(page.getByRole('button', { name: /Encore/i })).toBeDisabled();

    await page.getByPlaceholder('Pseudo du joueur…').fill('Alice');
    await page.getByRole('button', { name: 'Ajouter' }).click();
    await expect(page.getByRole('button', { name: /Encore/i })).toBeDisabled();
  });

  test('peut lancer une partie avec 2 joueurs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '1 appareil' }).click();

    for (const name of ['Alice', 'Bob']) {
      await page.getByPlaceholder('Pseudo du joueur…').fill(name);
      await page.getByRole('button', { name: 'Ajouter' }).click();
    }

    await page.getByRole('button', { name: 'Lancer la partie' }).click();
    await expect(cardTitle(page, 'Tour 1')).toBeVisible();
  });
});
