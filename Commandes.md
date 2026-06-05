### Dump Base OVH



ssh ubuntu@51.255.82.201

cd /var/www/quizhub

set -a

. ./.env.local

set +a

mariadb-dump -h "$QUIZHUB\_DB\_HOST" -P "$QUIZHUB\_DB\_PORT" -u "$QUIZHUB\_DB\_USER" -p"$QUIZHUB\_DB\_PASSWORD" --default-character-set=utf8mb4 --single-transaction "$QUIZHUB\_DB\_NAME" > /tmp/quizhub-ovh-dump.sql

exit



Pwd : ddGSTaaeFIOH3zyw

PWD MDB : ddGSTaaeFIOH3zyx



#### Recuperation Dump OVH sur PC



scp ubuntu@51.255.82.201:/tmp/quizhub-ovh-dump.sql C:\\Users\\bruno\\quizhub\\quizhub-ovh-dump.sql





#### Lancement DBEAVER sur PC



&#x09;- Lancer Docker

&#x09;- docker start quizhub-mariadb

&#x09;- Import du dump (attention au nom)

&#x09;docker exec -i quizhub-mariadb mariadb -uroot -proot quizhub < C:\\Users\\bruno\\quizhub\\quizhub-ovh-dump.sql



Puis Dbeaver



#### COMMIT PUSH



git add .

git commit -m "Test"

git push origin main



#### COMMIT PUSH AVEC RETARD GIT



&#x09;git status pour voir l etat du truc



##### &#x20;    Mise en stack du travail sur PC

&#x09;git stash push -u -m "avant pull"



##### &#x20;    Pull du Git

&#x09;git pull --rebase origin main



##### &#x20;    Reconciliation

&#x09;git stash pop Là gestion des problemes si y en a



##### PULL GIT en LOCAL



&#x09;git pull origin main



#### PULL OVH

&#x09;

ssh ubuntu@51.255.82.201

PWD : ddGSTaaeFIOH3zyw

cd /var/www/quizhub

git pull origin main



##### &#x20;    Si reconstruction Base / JSON :

&#x09;set -a

&#x09;. ./.env.local

&#x09;set +a

&#x09;npm run sync:iq-content



npm run build

pm2 restart all



#### Destruction User en base OVH



ssh ubuntu@51.255.82.201

PWD : ddGSTaaeFIOH3zyw

cd /var/www/quizhub

set -a

. ./.env.local

set +a

mariadb -h "$QUIZHUB\_DB\_HOST" -P "$QUIZHUB\_DB\_PORT" -u "$QUIZHUB\_DB\_USER" -p"$QUIZHUB\_DB\_PASSWORD" "$QUIZHUB\_DB\_NAME"



##### SCRIPT D ERASE



&#x09;START TRANSACTION;



&#x09;DELETE aa

&#x09;FROM iq\_attempt\_answers aa

&#x09;JOIN iq\_attempts a ON a.id = aa.attempt\_id

&#x09;JOIN users u ON u.id = a.user\_id

&#x09;WHERE u.email = 'bruno.dindelli@bricodecorama.com';



&#x09;DELETE rel

&#x09;FROM result\_email\_links rel

&#x09;LEFT JOIN users u ON u.email = rel.email

&#x09;LEFT JOIN iq\_attempts a ON a.attempt\_token = rel.result\_token

&#x09;WHERE rel.email = 'bruno.dindelli@bricodecorama.com'

&#x20;  	OR u.email = 'bruno.dindelli@bricodecorama.com'

&#x20;  	OR a.user\_id IN (

&#x20;   	 SELECT id FROM users WHERE email = 'bruno.dindelli@bricodecorama.com'

&#x20;  	);



&#x09;DELETE a

&#x09;FROM iq\_attempts a

&#x09;JOIN users u ON u.id = a.user\_id

&#x09;WHERE u.email = 'bruno.dindelli@bricodecorama.com';



&#x09;DELETE FROM users

&#x09;WHERE email = 'bruno.dindelli@bricodecorama.com';



&#x09;COMMIT;



##### Relancer l'outil d'analyse apres modif



sudo systemctl restart iq-analysis.service





#### Lancer l outil d analyse si demarre pas 



sudo cp deploy/iq-analysis.socket  /etc/systemd/system/

sudo cp deploy/iq-analysis.service /etc/systemd/system/

sudo systemctl daemon-reload

sudo systemctl enable --now iq-analysis.socket





##### Resynchro de la base avec les JSON Question



cd /var/www/quizhub

set -a

. ./.env.local

set +a

npm run sync:iq-content



##### Visualiser le .env sur OVH



cat .env.local

