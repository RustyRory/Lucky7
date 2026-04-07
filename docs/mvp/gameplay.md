# MVP — Gameplay

## Fonctionnalités implémentées

- Lancer de dés aléatoire (2×d6) — tour par tour
- Détection automatique des Doubles (d1 === d2)
- Calcul du Lucky (distance minimale) et du Looser (distance maximale)
- Gestion des égalités avec prolongations (Lucky et Looser indépendants)
- Bonus de gorgées cumulé à chaque prolongation (+1 par prolongation)
- Règles spéciales suspendues pendant les prolongations
- Affichage des gorgées uniquement quand Lucky et Looser sont désignés
- Enchaînement des tours (mémoire du Lucky pour l'annonce suivante)

---

## Fichiers concernés

| Fichier | Rôle |
|---|---|
| `frontend/src/app/components/GameScreen.tsx` | Moteur de jeu complet |

---

## Phases d'un tour

```
Annonce → Lancer → Résultats
                       ↓ (égalité)
                  Prolongation(s)
                       ↓ (résolu)
                  Résultats (gorgées)
```

### Phase Annonce

- **Tour 1** : annonce automatique = 12 ("le plus"), pas de saisie
- **Tours suivants** : le Lucky saisit un nombre entre 2 et 12
  - Rappel affiché : "le moins" pour 2, "le plus" pour 12
  - Validation : entier dans `[2, 12]` obligatoire

### Phase Lancer

- Les joueurs lancent **un par un** dans l'ordre de la liste
- Chaque lancer :
  - Animation 700 ms (🎲🎲 bounce)
  - Génération `d1 = rollD6()`, `d2 = rollD6()`
  - `score = d1 + d2`
  - `isDouble = d1 === d2`
- Le résultat (faces + score) s'affiche immédiatement dans la liste
- Badges **Double** et **Marchand** affichés en temps réel si les règles sont actives
- Quand tous ont lancé → bouton "Voir les résultats"

### Phase Résultats

- Classement par distance croissante à l'annonce
- `distance = |score - annonce|`
- **Lucky** : distance minimale → fond jaune + 🏆
- **Looser** : distance maximale → fond rouge + 💀
- Si égalité Lucky **et** Looser → le Lucky est résolu en premier
- Section "Gorgées" affichée uniquement quand les deux sont désignés
- Bouton "Nouveau tour" disponible uniquement quand tout est résolu

---

## Calcul des gorgées

### Lucky

| Situation | Gorgées de base | + Prolongations |
|---|---|---|
| Score différent de l'annonce | 1 | +1 par prolongation Lucky |
| Score exact (distance = 0) | 2 | +1 par prolongation Lucky |

### Looser

| Situation | Gorgées de base | + Prolongations |
|---|---|---|
| Toujours | 1 | +1 par prolongation Looser |

### Double *(si règle activée)*

| Valeur du dé | Gorgées |
|---|---|
| 1 (score 2) | 1 gorgée **ou** fait relancer un joueur au choix |
| 2 à 6 | Autant de gorgées que la valeur du dé |

### Marchand de sable *(si règle activée)*

- Score de 3 (1+2) → immunité totale ce tour

---

## Gestion des égalités (prolongations)

### Principe

Une prolongation est déclenchée si plusieurs joueurs partagent la même distance minimale (Lucky) ou maximale (Looser).

- Lucky et Looser sont résolus **indépendamment**
- Les prolongations Lucky et Looser ont chacune leur propre compteur
- Les règles spéciales (Double, Marchand) sont **suspendues** pendant les prolongations

### Flux

```
Égalité détectée sur le Lucky ou le Looser
  → bouton "Lancer la prolongation" affiché
  → Phase Prolongation :
      - Seuls les joueurs à égalité relancent (tour par tour)
      - Même annonce que le tour principal
      - Enjeu affiché = 1 + numéro de prolongation
      - Bouton "Résoudre la prolongation"
          → nouvelle égalité → même joueurs relancent encore
          → désignation → retour aux Résultats avec Lucky/Looser mis à jour
```

### Calcul de l'enjeu en prolongation

```
enjeu = gorgées_de_base + numéro_de_prolongation

Exemple :
  - Prolongation 1 Lucky → Lucky distribue 1 + 1 = 2 gorgées
  - Prolongation 2 Lucky → Lucky distribue 1 + 2 = 3 gorgées
  - Score exact + Prolongation 1 → Lucky distribue 2 + 1 = 3 gorgées
```

### Version hard *(non implémentée)*

Les gorgées sont **doublées** à chaque prolongation au lieu d'être incrémentées.

```
enjeu = gorgées_de_base × 2^numéro_de_prolongation
```

---

## Logique métier

### Génération d'un dé

```ts
function rollD6(): number {
  return Math.ceil(Math.random() * 6); // 1 à 6 inclus
}
```

### Calcul Lucky / Looser

```ts
distance = Math.abs(score - announcement)

Lucky  → joueurs avec distance === Math.min(...distances)
Looser → joueurs avec distance === Math.max(...distances)

// Égalité : length > 1 → prolongation
```

### Résolution d'une prolongation

```ts
// Lucky : re-calcul du min parmi les joueurs à égalité
// Si toujours égalité → même liste relance, compteur incrémenté
// Si désigné → result.luckyPlayers = [winner]

// Idem pour Looser avec le max
```

### État géré dans GameScreen

| Variable | Type | Rôle |
|---|---|---|
| `round` | `number` | Numéro du tour en cours |
| `phase` | `'announce' \| 'roll' \| 'results' \| 'prolongation'` | Phase active |
| `announcement` | `number` | Score cible du tour |
| `luckyPlayer` | `Player \| null` | Lucky du tour précédent (pour l'annonce) |
| `rolledDice` | `DiceRoll[]` | Lancers du tour principal |
| `rollerIndex` | `number` | Index du joueur courant en phase lancer |
| `result` | `RoundResult \| null` | Résultat calculé du tour |
| `luckyProlongations` | `number` | Nombre de prolongations Lucky résolues |
| `looserProlongations` | `number` | Nombre de prolongations Looser résolues |
| `prolongation` | `ProlongationState \| null` | État de la prolongation en cours |

---

## Choix techniques

**Tour par tour pour le lancer**
Sur un seul appareil, chaque joueur prend le téléphone à son tour. Ça reproduit la prise en main physique et évite la saisie manuelle des scores.

**Prolongations Lucky et Looser indépendantes**
Les deux peuvent se produire dans le même tour (ex. 3 joueurs à distance 2, 2 joueurs à distance 5). Chacune a son propre compteur et son propre flux de relance.

**Règles spéciales suspendues en prolongation**
Pendant une prolongation, l'enjeu est uniquement les gorgées du pot. Les Doubles ou Marchands générés en prolongation ne sont pas comptabilisés — conformément aux règles du jeu.

**Affichage des gorgées bloqué tant qu'une égalité subsiste**
La section "Gorgées" et le bouton "Nouveau tour" n'apparaissent qu'une fois Lucky et Looser désignés. Cela évite d'afficher un résultat partiel et incomplet.

**Mémoire du Lucky entre les tours**
`luckyPlayer` est mis à jour en fin de tour. En cas d'égalité non résolue (ne devrait pas arriver), il reste `null` et l'affichage de l'annonce est générique ("Le Lucky").
