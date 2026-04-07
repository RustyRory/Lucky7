# Gestion des parties

## Fonctionnalités implémentées

- Configuration des règles optionnelles avant la partie
- Déroulement d'une partie en 3 phases : Annonce → Lancer → Résultats
- Génération aléatoire de 2 dés par joueur (tour par tour)
- Détection automatique des Doubles
- Calcul automatique du Lucky et du Looser
- Gestion des égalités (signal de prolongation)
- Application des règles actives (Double, Marchand de sable)
- Enchaînement des tours avec mémoire du Lucky précédent
- Pages informatives : Règles du jeu, À propos

---

## Architecture

```
page.tsx
  └── SingleDeviceLobby.tsx   ← configuration joueurs + règles
        └── GameScreen.tsx    ← moteur de jeu (3 phases)
  └── RulesPage.tsx           ← explication des règles du jeu
  └── AboutPage.tsx           ← guide d'utilisation de l'app
```

---

## Fichiers créés / modifiés

| Fichier | Rôle |
|---|---|
| `frontend/src/app/page.tsx` | Ajout des boutons "Règles du jeu" et "À propos" |
| `frontend/src/app/components/SingleDeviceLobby.tsx` | Config des règles optionnelles + lancement |
| `frontend/src/app/components/GameScreen.tsx` | Moteur de jeu complet (annonce / lancer / résultats) |
| `frontend/src/app/components/RulesPage.tsx` | Page des règles du jeu (jouable avec ou sans app) |
| `frontend/src/app/components/AboutPage.tsx` | Page "À propos" — guide d'utilisation de l'app |

---

## Règles

### Règles toujours actives

Ces règles font partie du cœur du jeu et ne sont pas configurables.

| Règle | Description |
|---|---|
| **Lucky** | Le joueur le plus proche de l'annonce distribue 1 gorgée (2 si score exact) |
| **Looser** | Le joueur le plus éloigné de l'annonce boit 1 gorgée |
| **L'Annonce** | Règle orale — le Lucky doit dire "le moins" pour 2 et "le plus" pour 12. Non implémentable automatiquement. |

### Règles optionnelles (configurables)

Cochées par défaut, désactivables dans le lobby avant de lancer la partie.

| Règle | Implémentée | Description |
|---|---|---|
| **Double** | ✅ | Deux dés identiques → le joueur distribue autant de gorgées que la valeur du dé |
| **Marchand de sable** | ✅ | Score de 3 (1+2) → immunité totale ce tour |

### Règles à venir (désactivées)

| Règle | Description |
|---|---|
| **Jeton** | Score de 7 → boit 1 gorgée |
| **Jackpot** | Trois joueurs à 7 → règle Jeton suspendue, pot à distribuer |
| **Légende** | Score de 11 (5+6) → joueurs avec dé à 5 ou 6 boivent |
| **Démon** | Trois joueurs à 6 → pot à distribuer |
| **Mode hard** | Variantes avec pénalités multipliées |

---

## Flux — Déroulement d'une partie

```
SingleDeviceLobby
  → saisie des joueurs (min. 2)
  → configuration des règles optionnelles
  → clic "Lancer la partie"
    → GameScreen

GameScreen — Phase Annonce
  Tour 1 : annonce automatique = 12 ("le plus")
  Tours suivants : le Lucky saisit un nombre entre 2 et 12
  → clic "Commencer le tour" / "Confirmer l'annonce"

GameScreen — Phase Lancer (tour par tour)
  Pour chaque joueur dans l'ordre :
    → affichage du nom du joueur courant
    → clic "Lancer les dés"
      → animation 700ms
      → génération 2×d6 aléatoires
      → calcul : score = d1 + d2, isDouble = (d1 === d2)
      → affichage des faces de dés + score
    → joueur suivant…
  Quand tous ont lancé :
    → bouton "Voir les résultats"

GameScreen — Phase Résultats
  → classement par distance à l'annonce (croissant)
  → Lucky : distance minimale (fond jaune + 🏆)
  → Looser : distance maximale (fond rouge + 💀)
  → en cas d'égalité : message "prolongation !"
  → section "Gorgées" avec les messages des règles actives
  → bouton "Nouveau tour" → retour Phase Annonce (Lucky = winner du tour)
  → bouton "Fin de partie" → retour au lobby
```

---

## Logique métier

### Génération des dés

```ts
function rollD6(): number {
  return Math.ceil(Math.random() * 6); // 1 à 6
}
// score = d1 + d2  (2 à 12)
// isDouble = d1 === d2
```

### Calcul Lucky / Looser

```ts
distance = Math.abs(score - announcement)

Lucky   → distance minimale parmi tous les joueurs
Looser  → distance maximale parmi tous les joueurs

// Égalité : plusieurs joueurs partagent le min ou le max
// → message de prolongation, aucun Lucky/Looser désigné
```

### Distribution des gorgées (Lucky)

| Situation | Gorgées distribuées |
|---|---|
| Score différent de l'annonce | 1 |
| Score exact (distance = 0) | 2 |

### Double

```ts
diceValue = d1  // = d2 car identiques
drinks = diceValue

// Cas spécial Double 1 (score 2) :
// distribue 1 gorgée OU fait relancer un joueur au choix
```

---

## Choix techniques

**Tour par tour pour le lancer**
Sur un seul appareil, les joueurs lancent l'un après l'autre. Cela évite la saisie manuelle des scores et reproduit le côté "prise en main physique du téléphone" du jeu réel.

**Détection automatique des Doubles**
Puisque les dés sont générés numériquement, la détection `d1 === d2` est fiable et immédiate — plus besoin de case à cocher manuelle.

**L'Annonce non implémentée**
L'annonce est une règle orale (pénalité si on oublie "le moins" ou "le plus"). L'application ne peut pas détecter si le joueur l'a dit ou non. Un rappel visuel est affiché, la règle reste à appliquer de bonne foi par les joueurs.

**Mémoire du Lucky entre les tours**
Le Lucky du tour précédent (`luckyPlayer`) est conservé en état pour pré-remplir l'affichage de la phase d'annonce au tour suivant. En cas d'égalité, `luckyPlayer` est `null` et l'affichage est générique.

**Règles toujours actives vs optionnelles**
Lucky et Looser sont le cœur du jeu — ils ne peuvent pas être désactivés. Double et Marchand de sable enrichissent les tours mais ne changent pas la mécanique de base, d'où leur caractère optionnel.
