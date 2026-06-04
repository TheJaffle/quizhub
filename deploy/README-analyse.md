# Outil d'analyse des réponses IQ

Outil web autonome pour analyser, **par question**, les réponses aux tests de QI
du projet quizhub / brainspark.

## Contexte technique

- Projet Next.js, base MariaDB.
- App servie via **pm2** sur le port **3000**, **nginx** en reverse proxy.
- Serveur OVH : `ubuntu@51.255.82.201`, code dans `/var/www/quizhub`.
- Domaine `brainspark.fr` (certificat Let's Encrypt). Également `qi-free.com`
  (mais le certificat HTTPS est émis pour brainspark.fr → utiliser brainspark.fr).

## Fichier principal

`scripts/iq-analysis-tool.mjs` — serveur Node autonome (mysql2 + module `http`
natif, aucune dépendance supplémentaire).

Il lit la config base (`QUIZHUB_DB_*`) et les comptes d'accès depuis `.env.local`.

Il sert :

1. **Page de garde (login)** : email + mot de passe + menu déroulant du test à
   analyser (liste tirée de la table `iq_tests`).
2. **Page d'analyse agrégée par question** sur les tentatives `completed` du test
   sélectionné :
   - % présentée (fréquence d'affichage réelle — révèle les questions
     sous-présentées, ex. mémoire longue tronquée),
   - % non répondue (parmi les présentations),
   - % bonnes réponses (calcul *live* depuis la banque actuelle),
   - temps de réponse moyen / min / max (sentinelles 123456 « non présentée » et
     1000 « non répondue » exclues),
   - n répondues, difficulté.
   - Regroupée par section, triable par colonne, avec compteur de questions
     sous-présentées (<95 %).

## Configuration (`.env.local` du serveur)

```
# Connexion base (déjà présent pour l'app)
QUIZHUB_DB_HOST=localhost
QUIZHUB_DB_PORT=3306
QUIZHUB_DB_USER=...
QUIZHUB_DB_PASSWORD=...
QUIZHUB_DB_NAME=quizhub_prod

# Comptes d'accès à l'outil (un ou plusieurs, séparés par des virgules)
IQ_ANALYSIS_USERS=email1@exemple.com:MotDePasse1,email2@exemple.com:MotDePasse2

# Secret de signature des sessions (FIXE, sinon sessions invalidées à chaque
# redémarrage). Générer avec : openssl rand -hex 32
IQ_ANALYSIS_SECRET=...
```

Contraintes du format `IQ_ANALYSIS_USERS` : pas de virgule dans un mot de passe
(séparateur de comptes), pas d'espaces en début/fin. Le login peut être un email
(seul le premier `:` sépare login et mot de passe).

Variables optionnelles : `IQ_ANALYSIS_PORT` (def. 4555), `IQ_ANALYSIS_HOST`
(def. 127.0.0.1), `IQ_ANALYSIS_IDLE_MINUTES` (def. 0 = pas d'arrêt auto).

## Sécurité

- Auth multi-comptes obligatoire (l'outil refuse de démarrer sans compte défini).
- Sessions par **cookie HMAC signé** (HttpOnly, SameSite=Lax, Secure derrière HTTPS).
- Écoute sur `127.0.0.1:4555` uniquement → accessible seulement via le reverse
  proxy nginx (HTTPS).

## Déploiement à la demande (systemd socket activation)

Le programme ne tourne pas en continu : systemd écoute le port à sa place,
démarre le service à la 1re connexion, et le service s'arrête seul après 30 min
d'inactivité. Le programme écoute le descripteur (fd 3) passé par systemd.

Fichiers : `deploy/iq-analysis.socket` et `deploy/iq-analysis.service`
(vérifier `ExecStart` = chemin de `node`, et `User`/`Group` = propriétaire de
`/var/www/quizhub` ; valeurs par défaut `/usr/bin/node` + `ubuntu` confirmées OK).

Installation :

```
sudo cp deploy/iq-analysis.socket  /etc/systemd/system/
sudo cp deploy/iq-analysis.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now iq-analysis.socket   # activer le .socket SEULEMENT
```

Vérifier : `systemctl status iq-analysis.socket` → `active (listening)`.
Le service est inactif au repos (normal), il démarre à la première requête.

## nginx

Vhost complet : `deploy/nginx-quizhub.conf` (contient un bloc
`location /iq-analyse/` proxifiant vers `127.0.0.1:4555` ; le `/` final retire le
préfixe, les appels client sont relatifs). Installation :

```
sudo cp deploy/nginx-quizhub.conf /etc/nginx/sites-enabled/quizhub
sudo nginx -t && sudo systemctl reload nginx
```

Important : ne jamais laisser de fichier `.bak` dans `/etc/nginx/sites-enabled/`
(nginx charge tout le dossier → erreur « duplicate default server »). Ranger les
sauvegardes ailleurs (`~/quizhub.bak`).

## Accès

```
https://brainspark.fr/iq-analyse/
```

Page de garde → login (email + mot de passe + choix du test) → analyse.

## Test rapide (sur le serveur, sans nginx)

```
curl -is http://127.0.0.1:4555/ | head -50          # doit renvoyer la page de garde + menu des tests
journalctl -u iq-analysis.service -n 40 --no-pager  # logs / erreurs base
```

## Améliorations possibles (non faites)

- Drill-down par question : distribution des options choisies (quelle réponse,
  combien de fois) pour repérer distracteurs trop attractifs / questions ambiguës.
- Récap par section.

## Lien avec les autres travaux de la session

Cet outil sert notamment à repérer les questions de **mémoire longue** non
atteintes (test terminé avant les rappels espacés de 60 s). Un correctif a été
ajouté dans `lib/iq-tests.ts` (`backfillUnansweredLongMemoryAnswers`) qui, à la
fin du test, insère une sentinelle « non répondu » (1000) pour chaque rappel
long_memory programmé mais jamais affiché — visible ensuite dans cet outil.
