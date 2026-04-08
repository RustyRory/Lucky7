# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur Keep a Changelog et ce projet adhère au Semantic Versioning.

## [Unreleased]
---

## [0.2.0] - 2026-04-08

### Added

* **Règle Relance (Double 1)** — nouvelle règle optionnelle : un joueur qui fait 1•1 peut relancer ses deux dés une fois. Activable dans la configuration de partie. Si le joueur relance, son résultat est remplacé et un badge « Relancé » s'affiche dans le tableau. S'il garde le 1•1, la règle Double classique s'applique.
* **Dialog de configuration des règles (lobby)** — les règles ne sont plus affichées inline dans l'écran de configuration. Un bouton ⚙️ Configurer ouvre un bottom sheet (glisse depuis le bas sur mobile, centré sur desktop) permettant d'activer/désactiver chaque règle. Les règles actives sont résumées sous forme de badges dans le lobby.
* **Dialog des paramètres en jeu (GameScreen)** — un bouton ⚙️ dans le header de chaque phase (annonce, lancer, prolongation, résultats) affiche les règles actives de la partie en cours (✓ vert / ✗ grisé).
* **Pipeline CI GitHub Actions** (`ci.yml`) — déclenché sur chaque push et pull request : lint & format → tests unitaires → tests E2E (les E2E n'attendent que si lint + unit passent).
* **Tests unitaires** — Vitest + Testing Library, 11 tests couvrant `cn`, `generateId` et le composant `RulesPage`.
* **Tests E2E** — Playwright (Chromium), 7 scénarios couvrant l'accueil, la navigation vers les règles, le lobby et le lancement de partie.
* **Formatage** — Prettier intégré avec `.prettierrc.json` et les scripts `format` et `format:check`.

### Changed

* **Phase de lancer — tableau permanent** — tous les joueurs sont affichés dans un tableau dès le début du tour. Les joueurs en attente apparaissent en grisé avec `—`. L'animation des dés se déroule directement dans la ligne du joueur concerné (plus de dés centraux séparés).
* **Phase de prolongation** — même refonte que la phase de lancer : tableau permanent, animation inline, joueurs en attente grisés.
* **Titre dynamique** — le header des phases roll et prolongation affiche en temps réel qui doit lancer (`Au tour de X de lancer` / `X lance les dés…` / `X — Double 1, relance disponible` / `Tous les joueurs ont lancé`).
* **Points des dés** — rayon des points passé de `size × 0.09` (trop petit aux petites tailles) à `9` unités SVG fixes pour une lisibilité constante quelle que soit la taille d'affichage.
* **Déploiement staging** — le job `deploy` est désormais conditionné par les jobs `lint`, `test-unit` et `test-e2e` via `needs`. Un déploiement échoue automatiquement si l'un des checks ne passe pas.
* **Scripts `package.json`** — ajout de `typecheck`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`, `test:e2e`, `test:e2e:ui`.

### Fixed

* **ESLint** — désactivation de `react/no-unescaped-entities` (incompatible avec les apostrophes du français) ; ajout des répertoires `e2e/`, `coverage/`, `playwright-report/` aux ignores.
* **État `lastRolledId`** — supprimé car devenu inutilisé après la refonte du tableau de la phase de lancer.

---

## [0.1.1] - 2026-04-07

### Added

* Environnements : dev / staging
* Pipelines :
    * Tests unitaires & e2e
    * Lint / format
    * Build & déploiement automatique

---

## [0.1.0] - 2026-04-07

### Added

* Initialisation du backend avec Express
* Ajout de Socket.IO pour la communication temps réel
* Création d’une route de test (`GET /`)
* Initialisation du frontend avec Next.js
* Installation et configuration de Tailwind CSS
* Intégration de MongoDB avec Mongoose
* Mise en place des variables d’environnement (`.env`)
* Création de l’architecture du projet (`frontend/`, `backend/`)
* Ajout des fichiers `.gitignore`
* Configuration du serveur pour utiliser les ES Modules
* Gestion des erreurs de connexion MongoDB
