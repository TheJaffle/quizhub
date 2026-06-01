# Handoff IQ / Sondage - 2026-05-30

Ce document sert de reprise complète pour relancer une conversation et continuer le développement comme si la discussion n'avait pas été interrompue.

## 1. Contexte général

Le chantier principal a porté sur :

- le nouveau flux IQ invité
- la persistance différée des réponses
- la page résultats IQ
- la page de correction/relecture `sondage`
- la compatibilité avec les anciennes tentatives
- les imports/backfills historiques Sarah / Martine

Le ton de la discussion a été très orienté correction rapide, validation sur mobile, et ajustements visuels successifs sur la page de correction.

## 2. Etat cible décidé

### 2.1 Flux IQ invité

Le flux voulu n'est **pas** :

- création complète en base au fil de l'eau
- réponses détaillées écrites immédiatement en SQL

Le flux voulu est :

1. pendant le test, stockage local minimal côté client
2. envoi du mail à la fin du test
3. persistance SQL à ce moment-là
4. passage en `completed` au clic du lien mail

Etat retenu en fin de séance :

- stockage local client pendant le test
- persistance en base au moment de l'envoi du mail
- finalisation `completed` au retour par lien mail

### 2.2 Données minimales côté draft temporaire

Le draft temporaire côté client doit garder le minimum :

- identifiant de question
- réponse donnée
  - `selectedOptionId`
  - ou `selectedPosition`
- temps de réponse `responseTimeMs`
- pour `speed`, `speedTotalTimeMs`

Le draft ne doit pas embarquer de logique de score.

## 3. Conventions métier importantes

### 3.1 Questions non posées dans les groupes `choices`

Convention choisie :

- `response_time_ms = 123456` signifie : **question non posée**

Conséquences :

- ces lignes existent en SQL pour matérialiser les variantes non tirées
- elles ne doivent pas être comptées comme questions répondues
- elles ne doivent pas entrer dans les temps moyens
- elles ne doivent pas apparaître dans la correction

### 3.2 Questions posées mais sans réponse

Convention choisie :

- `response_time_ms = 1000` signifie : **question posée, non répondue**

Conséquences :

- la correction doit montrer la question
- l'état affiché doit être `Non repondue`
- il ne faut jamais inventer une fausse réponse
- il ne faut jamais afficher `Votre reponse : ...`

### 3.3 Réponse erronée sans donnée exploitable de réponse

Convention choisie :

- `response_time_ms = 0` signifie : **réponse erronée**

Conséquences :

- si la vraie mauvaise réponse choisie n'est pas connue, ne rien inventer
- ne pas afficher `Votre reponse : :(`
- afficher un état de type `Reponse erronee`

### 3.4 Réponse erronée avec vraie réponse sélectionnée connue

Dans ce cas :

- afficher `Reponse incorrecte`
- afficher la vraie mauvaise réponse choisie

## 4. Logique de calcul / scoring

La direction prise en fin de séance :

- ne pas faire confiance aux vieux agrégats de `iq_attempts`
- ne pas prendre les vieux `points_earned` historiques comme source de vérité
- recalculer les scores depuis :
  - la question
  - son `weight`
  - la justesse de la réponse

Règle métier visée :

- si réponse correcte : score = `iq_questions.weight`
- si réponse incorrecte : score = `0`

Important :

- les anciennes données historiques peuvent encore avoir des `points_earned` hétérogènes
- les nouvelles pages doivent s'appuyer sur la logique recalculée et non sur les vieux agrégats

## 5. Fichiers clés à connaître

### 5.1 Front IQ

- [C:\Users\bruno\quizhub\components\iq\iq-phase-page.tsx](C:\Users\bruno\quizhub\components\iq\iq-phase-page.tsx)
- [C:\Users\bruno\quizhub\components\iq\iq-memory-phase-page.tsx](C:\Users\bruno\quizhub\components\iq\iq-memory-phase-page.tsx)
- [C:\Users\bruno\quizhub\components\iq\iq-audio-phase-page.tsx](C:\Users\bruno\quizhub\components\iq\iq-audio-phase-page.tsx)
- [C:\Users\bruno\quizhub\components\iq\iq-speed-phase-page.tsx](C:\Users\bruno\quizhub\components\iq\iq-speed-phase-page.tsx)
- [C:\Users\bruno\quizhub\components\iq\iq-long-memory-answer-page.tsx](C:\Users\bruno\quizhub\components\iq\iq-long-memory-answer-page.tsx)
- [C:\Users\bruno\quizhub\components\iq\iq-intro-page.tsx](C:\Users\bruno\quizhub\components\iq\iq-intro-page.tsx)
- [C:\Users\bruno\quizhub\components\iq\iq-draft-storage.ts](C:\Users\bruno\quizhub\components\iq\iq-draft-storage.ts)

### 5.2 Résultats / correction

- [C:\Users\bruno\quizhub\components\iq\iq-result-page.tsx](C:\Users\bruno\quizhub\components\iq\iq-result-page.tsx)
- [C:\Users\bruno\quizhub\components\iq\iq-sondage-review-page.tsx](C:\Users\bruno\quizhub\components\iq\iq-sondage-review-page.tsx)
- [C:\Users\bruno\quizhub\app\(mainlayout)\iq\results\[token]\page.tsx](C:\Users\bruno\quizhub\app\(mainlayout)\iq\results\[token]\page.tsx)
- [C:\Users\bruno\quizhub\app\(mainlayout)\iq\sondage-review\[token]\page.tsx](C:\Users\bruno\quizhub\app\(mainlayout)\iq\sondage-review\[token]\page.tsx)
- [C:\Users\bruno\quizhub\app\(mainlayout)\iq\sondage-review\page.tsx](C:\Users\bruno\quizhub\app\(mainlayout)\iq\sondage-review\page.tsx)

### 5.3 Backend / métier IQ

- [C:\Users\bruno\quizhub\lib\iq-tests.ts](C:\Users\bruno\quizhub\lib\iq-tests.ts)
- [C:\Users\bruno\quizhub\app\api\iq\tests\[slug]\attempt\route.ts](C:\Users\bruno\quizhub\app\api\iq\tests\[slug]\attempt\route.ts)
- [C:\Users\bruno\quizhub\app\api\iq\attempts\[token]\answers\route.ts](C:\Users\bruno\quizhub\app\api\iq\attempts\[token]\answers\route.ts)
- [C:\Users\bruno\quizhub\app\api\iq\attempts\[token]\complete\route.ts](C:\Users\bruno\quizhub\app\api\iq\attempts\[token]\complete\route.ts)
- [C:\Users\bruno\quizhub\app\api\iq\attempts\[token]\validate-answer\route.ts](C:\Users\bruno\quizhub\app\api\iq\attempts\[token]\validate-answer\route.ts)
- [C:\Users\bruno\quizhub\app\api\result-email-link\route.ts](C:\Users\bruno\quizhub\app\api\result-email-link\route.ts)
- [C:\Users\bruno\quizhub\app\api\result-access\[emailToken]\route.ts](C:\Users\bruno\quizhub\app\api\result-access\[emailToken]\route.ts)
- [C:\Users\bruno\quizhub\lib\result-email-links.ts](C:\Users\bruno\quizhub\lib\result-email-links.ts)

## 6. Accès Git / infra / base

### 6.1 Git

Remote :

- `origin = https://github.com/TheJaffle/quizhub.git`

Branche de travail utilisée :

- `main`

### 6.2 OVH

Serveur SSH :

- hôte : `51.255.82.201`
- user : `ubuntu`

Commande de connexion :

```bash
ssh ubuntu@51.255.82.201
```

Chemin du projet sur OVH :

```bash
/var/www/quizhub
```

### 6.3 Base locale

La base locale tourne dans Docker.

Commande d'accès :

```bash
docker exec -it quizhub-mariadb mariadb -uroot -proot quizhub
```

Dump SQL local :

- fichier untracked vu pendant la séance :
  - [C:\Users\bruno\quizhub\quizhub-local-dump.sql](C:\Users\bruno\quizhub\quizhub-local-dump.sql)

### 6.4 Base OVH

Connexion à la base OVH via les variables de `.env.local` sur le serveur :

```bash
cd /var/www/quizhub
set -a
. ./.env.local
set +a
mariadb -h "$QUIZHUB_DB_HOST" -P "$QUIZHUB_DB_PORT" -u "$QUIZHUB_DB_USER" -p"$QUIZHUB_DB_PASSWORD" "$QUIZHUB_DB_NAME"
```

Remarque :

- les secrets sont volontairement lus depuis `.env.local`
- ne pas recopier les credentials en dur dans le repo

## 7. Commandes de déploiement OVH

Déploiement classique :

```bash
cd /var/www/quizhub
git pull origin main
npm run build
pm2 restart all
```

Vérification du commit déployé :

```bash
cd /var/www/quizhub
git log -1 --oneline
```

Vérification PM2 :

```bash
pm2 status
```

## 8. Historique utile des commits récents

Commits importants de cette séquence :

- `d52cd39` Handle missing review answer data
- `d2d7b3a` Normalize unanswered review states
- `660f83b` Tighten review header spacing
- `3972576` Place sondage review meta above question
- `4d55c4f` Fix sondage review mobile meta placement
- `81af637` Refine sondage review answer states
- `c376204` Overlay mobile sondage question meta
- `a780094` Show unanswered IQ review questions
- `88e6d48` Simplify unanswered review feedback
- `5d2a3f3` Balance mobile sondage review layout
- `1f47640` Enlarge mobile sondage review visuals
- `e22558d` Handle unasked IQ choice questions
- `5ba8f81` Tighten sondage review mobile layout
- `f39867c` Add sondage correction review flow
- `355007f` Simplify IQ draft storage and result copy

## 9. Correction / relecture `sondage`

### 9.1 Route

Page de correction directe par tentative :

- `/iq/sondage-review/[token]`

Depuis le résultat :

- bouton `Correction` sur la page de résultat `sondage`

### 9.2 Ordre des catégories

Ordre voulu :

- `logic`
- `spatial`
- `verbal`
- `quantitative`
- `memory`
- `long_memory`
- `audio_memory`

`speed` doit être exclu de la correction.

### 9.3 Règles UI importantes

Pour toute la correction :

- si `response_time_ms = 123456` :
  - ne pas afficher la question
- si `response_time_ms = 1000` :
  - afficher la question
  - état = `Non repondue`
  - ne jamais inventer une réponse choisie
- si `response_time_ms = 0` :
  - état = `Reponse erronee`
  - ne pas afficher `Votre reponse : ...` si aucune vraie donnée de réponse exploitable
- si mauvaise réponse réelle connue :
  - afficher la vraie mauvaise réponse

### 9.4 Problèmes UI mobiles encore très sensibles

La page de correction mobile a demandé énormément d'itérations.

Points qui ont posé problème :

- position des badges de méta (`categorie`, `x/y`, `question_key`)
- vide inutile sous la barre `brainspark`
- badges parfois sous / à côté de la question alors qu'ils devaient être au-dessus
- hauteur de l'énigme graphique
- place du bloc feedback
- disparition / réapparition de métadonnées

Si on reprend le chantier, il faut tester en priorité :

- questions purement textuelles
- questions visuelles avec `imageUrl`
- questions visuelles avec `answersImageUrl`
- questions audio
- cas `1000`
- cas `0`
- cas mauvaise réponse réelle connue

## 10. Import / historique Sarah et Martine

### 10.1 Fichier source

Fichier Excel mentionné pendant la séance :

- [C:\Users\bruno\quizhub\Sondage-resultats.xlsx](C:\Users\bruno\quizhub\Sondage-resultats.xlsx)

### 10.2 Fichier SQL de backfill

Fichier SQL local untracked :

- [C:\Users\bruno\quizhub\database\ovh-backfill-sarah-martine.sql](C:\Users\bruno\quizhub\database\ovh-backfill-sarah-martine.sql)

### 10.3 Tentatives concernées

Telles qu'utilisées pendant la séance :

- Sarah :
  - tentative `115`
  - `result_token = 84369ee5-36ad-4e0f-87d1-b17327f1989d`
- Martine :
  - tentative `118`
  - `result_token = 5c0d2801-6a3d-4af5-a496-25495b9119a2`

Tokens mail utilisés pour tests :

- Sarah :
  - `795ca47e02158387b5123d5afde05b9ae8454f455abad3513a74d6104a953942`
- Martine :
  - `4595c2ac711642a8cc3eba3c63126c0db71a97b7f85755b2c1eb4f0e0e8e0b1a`

### 10.4 Conventions retenues pour le backfill

Conventions métier explicitées :

- `123456` = question non posée
- `1000` = question posée, non répondue
- `0` = réponse erronée sans détail fiable
- `> 0` et différent de `1000/123456` = réponse renseignée avec temps

### 10.5 Point de vigilance

Ne jamais supposer qu'un import historique dispose d'une vraie réponse choisie :

- si la donnée ne permet pas de reconstituer la réponse,
  - ne rien inventer

## 11. Fichiers non suivis vus à la fin de la séance

Toujours présents en `git status` :

- [C:\Users\bruno\quizhub\Sondage-resultats.xlsx](C:\Users\bruno\quizhub\Sondage-resultats.xlsx)
- [C:\Users\bruno\quizhub\database\ovh-backfill-sarah-martine.sql](C:\Users\bruno\quizhub\database\ovh-backfill-sarah-martine.sql)
- [C:\Users\bruno\quizhub\quizhub-local-dump.sql](C:\Users\bruno\quizhub\quizhub-local-dump.sql)
- [C:\Users\bruno\quizhub\~$Sondage-resultats.xlsx](C:\Users\bruno\quizhub\~$Sondage-resultats.xlsx)

Ces fichiers n'ont pas été commit.

## 12. Points encore à surveiller au prochain redémarrage

### 12.1 Correction mobile

C'est le point le plus fragile.

A revalider systématiquement :

- badges juste sous la barre `brainspark`
- aucune marge vide inutile
- questions graphiques assez grandes
- bloc feedback compact
- `Retour` / `OK` visibles sans scroll autant que possible

### 12.2 Cas de réponse

Tester explicitement :

1. bonne réponse
2. mauvaise réponse avec vraie réponse connue
3. `1000`
4. `0`
5. `123456`

### 12.3 OVH vs local

Plusieurs fois pendant la séance, des comportements “non corrigés” venaient simplement du fait que :

- le code local était corrigé
- mais OVH tournait encore sur un ancien commit

Toujours vérifier :

```bash
git log -1 --oneline
```

sur OVH après un `pull`.

## 13. URLs utiles de test

### Martine résultat

Local :

- [http://localhost:3000/iq/results/5c0d2801-6a3d-4af5-a496-25495b9119a2?email_token=4595c2ac711642a8cc3eba3c63126c0db71a97b7f85755b2c1eb4f0e0e8e0b1a](http://localhost:3000/iq/results/5c0d2801-6a3d-4af5-a496-25495b9119a2?email_token=4595c2ac711642a8cc3eba3c63126c0db71a97b7f85755b2c1eb4f0e0e8e0b1a)

### Sarah résultat

Local :

- [http://localhost:3000/iq/results/84369ee5-36ad-4e0f-87d1-b17327f1989d?email_token=795ca47e02158387b5123d5afde05b9ae8454f455abad3513a74d6104a953942](http://localhost:3000/iq/results/84369ee5-36ad-4e0f-87d1-b17327f1989d?email_token=795ca47e02158387b5123d5afde05b9ae8454f455abad3513a74d6104a953942)

### Correction `sondage`

Route générique :

- [http://localhost:3000/iq/sondage-review](http://localhost:3000/iq/sondage-review)

Route directe par tentative :

- `/iq/sondage-review/[token]`

## 14. Recommandation de reprise

Si une nouvelle conversation redémarre, la meilleure entrée est :

1. ouvrir ce document
2. vérifier le dernier commit local et OVH
3. tester le cas concret Martine sur mobile
4. vérifier en priorité :
   - états `1000 / 0 / vraie mauvaise réponse`
   - position des badges
   - encombrement vertical de la correction mobile

Si un comportement semble “pas corrigé”, toujours distinguer :

- bug réel du composant
- ancien code encore déployé sur OVH

