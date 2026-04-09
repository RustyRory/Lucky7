# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur Keep a Changelog et ce projet adhère au Semantic Versioning.

## [Unreleased]
---

## [0.3.0] - 2026-04-08

### Added

* **Règle Légende** — score de 11 (5•6) : tous les joueurs ayant un dé à 5 ou 6 boivent 1 gorgée. Activable dans la configuration de partie.
* **Règle Jeton** — score de 7 : le joueur boit 1 gorgée et ajoute +1 au pot. Le pot s'accumule entre les tours jusqu'à être consommé par un Jackpot ou un Démon.
* **Règle Jackpot** — si 3 joueurs ou plus obtiennent un 7 : la règle Jeton est suspendue ce tour. Les joueurs concernés relancent ; le plus proche de l'annonce distribue le pot (pot accumulé ou dé si vide).
* **Règle Démon** — si 3 joueurs ou plus ont un dé à 6 : les joueurs concernés relancent ; le plus éloigné de l'annonce boit le pot (pot accumulé ou dé si vide).
* **Phase `special-event`** — nouvelle phase de jeu déclenchée après le lancer quand un Jackpot ou un Démon est détecté. Les événements sont résolus en séquence avant d'afficher les résultats normaux.
* **Pot persistant** — le pot de gorgées accumulé par la règle Jeton persiste entre les tours jusqu'à consommation.
* **Bonus de prolongation cumulatif** — les gorgées du Lucky et du Looser s'incrémentent de `(participants − 1)` à chaque prolongation successive.
* **Règle Hardcore** — affichée dans le configurateur de règles comme « bientôt disponible » (non activable).

### Changed

* **Configurateur de règles (lobby)** — le dialog de règles expose désormais les règles Légende, Jeton, Jackpot et Démon avec des toggles individuels. Les règles non encore disponibles apparaissent dans une section distincte grisée.
* **Page des règles** — mise à jour pour documenter Jeton, Jackpot et Démon, ainsi que la précision sur la compensation gorgées à donner / à boire.

---

## [0.2.0] - 2026-04-08

### Added

* **Phase de lancer — tableau permanent** — tous les joueurs sont affichés dans un tableau dès le début du tour. Les joueurs en attente apparaissent en grisé avec `—`. L'animation des dés se déroule directement dans la ligne du joueur concerné (plus de dés centraux séparés).
* **Phase de prolongation** — même refonte que la phase de lancer : tableau permanent, animation inline, joueurs en attente grisés.
* **Titre dynamique** — le header des phases roll et prolongation affiche en temps réel qui doit lancer (`Au tour de X de lancer` / `X lance les dés…` / `X — Double 1, relance disponible` / `Tous les joueurs ont lancé`).
* **Points des dés** — rayon des points passé de `size × 0.09` (trop petit aux petites tailles) à `9` unités SVG fixes pour une lisibilité constante quelle que soit la taille d'affichage.
* **Règle Relance (Double 1)** — nouvelle règle optionnelle : un joueur qui fait 1•1 peut relancer ses deux dés une fois. Activable dans la configuration de partie. Si le joueur relance, son résultat est remplacé et un badge « Relancé » s'affiche dans le tableau. S'il garde le 1•1, la règle Double classique s'applique.
* **Dialog de configuration des règles (lobby)** — les règles ne sont plus affichées inline dans l'écran de configuration. Un bouton ⚙️ Configurer ouvre un bottom sheet (glisse depuis le bas sur mobile, centré sur desktop) permettant d'activer/désactiver chaque règle. Les règles actives sont résumées sous forme de badges dans le lobby.
* **Dialog des paramètres en jeu (GameScreen)** — un bouton ⚙️ dans le header de chaque phase (annonce, lancer, prolongation, résultats) affiche les règles actives de la partie en cours (✓ vert / ✗ grisé).
* **Pipeline CI GitHub Actions** (`ci.yml`) — déclenché sur chaque push et pull request : lint & format → tests unitaires → tests E2E (les E2E n'attendent que si lint + unit passent).
* **Tests unitaires** — Vitest + Testing Library, 11 tests couvrant `cn`, `generateId` et le composant `RulesPage`.
* **Tests E2E** — Playwright (Chromium), 7 scénarios couvrant l'accueil, la navigation vers les règles, le lobby et le lancement de partie.
* **Formatage** — Prettier intégré avec `.prettierrc.json` et les scripts `format` et `format:check`.

### Changed

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
