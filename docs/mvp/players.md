# MVP — Gestion des joueurs

## Fonctionnalités implémentées

- Sélection du mode de jeu (1 appareil / multijoueur)
- Ajout et suppression de joueurs en local
- Validation des pseudos
- Lobby avec liste des joueurs et bouton de lancement

---

## Architecture

### Mode 1 appareil (implémenté)

Aucun serveur requis. Les joueurs sont gérés en état local React dans le composant `SingleDeviceLobby`.

```
page.tsx
  └── SingleDeviceLobby.tsx   ← état local des joueurs (useState)
```

### Mode multijoueur (préparé, désactivé)

Infrastructure Socket.IO en place pour une future implémentation. Le backend gère une `Map` de joueurs en mémoire, synchronisée en temps réel via les événements socket.

```
page.tsx
  └── JoinForm.tsx             ← connexion socket + émission player:join
  └── PlayersList.tsx          ← affichage de la liste reçue via players:list

Backend (index.js)
  └── Map<socketId, Player>    ← état serveur
  └── player:join              ← événement d'entrée
  └── players:list             ← broadcast de la liste
```

---

## Fichiers créés / modifiés

| Fichier | Rôle |
|---|---|
| `frontend/src/app/page.tsx` | Page d'accueil — sélection du mode |
| `frontend/src/app/components/SingleDeviceLobby.tsx` | Lobby 1 appareil — gestion locale des joueurs |
| `frontend/src/app/components/JoinForm.tsx` | Formulaire de connexion (mode multi) |
| `frontend/src/app/components/PlayersList.tsx` | Liste des joueurs en temps réel (mode multi) |
| `frontend/src/lib/socket.ts` | Singleton socket.io-client |
| `backend/src/index.js` | Serveur Express + Socket.IO avec gestion des joueurs |

---

## Flux — Mode 1 appareil

```
Accueil
  → clic "1 appareil"
  → SingleDeviceLobby s'affiche
      → saisie d'un pseudo + clic "Ajouter"
          → validation (2–20 chars, pas de doublon)
          → joueur ajouté à la liste locale
      → clic ✕ sur un joueur → suppression
      → bouton "Lancer la partie" actif dès 2 joueurs
```

## Flux — Mode multijoueur (préparé)

```
Accueil
  → clic "Multijoueur" (désactivé — bientôt disponible)
  → JoinForm : saisie du pseudo
  → socket.connect() + émission player:join(pseudo)
      → callback serveur : erreur ou succès
  → si succès : affichage de PlayersList
      → écoute players:list → mise à jour en temps réel
      → à la déconnexion : joueur retiré automatiquement
```

---

## Validation des pseudos

| Règle | Mode 1 appareil | Mode multi |
|---|---|---|
| Longueur 2–20 caractères | ✅ frontend | ✅ frontend + backend |
| Pas de doublon (insensible à la casse) | ✅ frontend | ✅ backend |
| Retour d'erreur utilisateur | ✅ | ✅ |

---

## Choix techniques

**Listener `players:list` dans `page.tsx` (mode multi)**
Le listener est monté dès le chargement de la page, avant que le joueur ait rejoint. Cela évite une race condition où le broadcast du serveur arrivait avant que `PlayersList` soit monté, ce qui rendait la liste vide pour le joueur qui venait de rejoindre.

**Pas de socket en mode 1 appareil**
Inutile d'établir une connexion réseau pour une partie locale. L'état est géré avec `useState` et `crypto.randomUUID()` pour les IDs.

**shadcn/ui (style base-nova)**
Composants utilisés : `Button`, `Input`, `Card`, `Badge`, `Separator`. Le style `base-nova` utilise `@base-ui/react` (compatible Tailwind v4 et React 19).
