# Objectif de l’app

Créer une web app **temps réel multijoueur** pour jouer au *Lucky7* :

- Jouable sur téléphone et PC
- Plusieurs joueurs connectés simultanément
- Synchronisation en live
- Règles automatisées

# Fonctionnalités essentielles

## Partie & joueurs

- Créer une partie
- Rejoindre via code / QR
- Lobby avec joueurs
- Choix mode (normal / hard)

## Gameplay

- Annonce du Lucky
- Lancer de dés (animation)
- Calcul automatique :
    - Lucky (plus proche)
    - Looser (plus éloigné)
- Gestion des égalités (prolongations)

## Règles spéciales

Automatisées :

- Doubles
- 2 (relance spéciale)
- 3 (immunité)
- 7 (jeton)
- 11 (légende)
- Démon / Jackpot

## UX

- Interface mobile-first
- Résultat clair + animations
- Enchaînement rapide des tours

# Stack technique

## Frontend

- Next.js
- Tailwind CSS

## Backend

- Node.js
- Express
- Socket.IO (temps réel)

## Base de données

- PostgreSQL

# Architecture globale

```
[ Frontend (Next.js) ]
        ↓
[ Backend API + Socket.IO ]
        ↓
[ PostgreSQL ]
```

# Dockerisation

Tu vas utiliser :

- Docker
- Docker Compose

## Services à dockeriser

### Frontend

- Next.js
- build + serveur

### Backend

- Node.js + Socket.IO

### Database

- PostgreSQL

# Déploiement

## Setup recommandé

### Serveur

- Ubuntu / Debian

### Reverse proxy

- Nginx

rôle :

- HTTPS
- redirection vers frontend/backend

## HTTPS

- Let's Encrypt

# Temps réel (socket.io)

Avec Socket.IO :

- Un joueur lance → événement
- Serveur calcule → envoie résultat
- Tous les joueurs reçoivent en live

# Organisation du repo

```
/frontend
/backend
/docker-compose.yml
```

Branches :

- main (env prod)
- staging (env test)
- dev
- feat/*
- fix/*
- hotfix/*

# Logique métier

À implémenter côté backend :

- calcul des scores
- gestion Lucky / Looser
- égalités
- règles spéciales

Points critiques

- Synchronisation multi-joueurs
- Gestion des cas d’égalité
- Complexité des règles spéciales
- UX rapide

# Roadmap

## MVP

- Partie + joueurs
- Lancer dés
- Lucky / Looser
- Temps réel

## V2

- Toutes les règles spéciales
- Mode hard

## V3

- Stats
- comptes
- historique