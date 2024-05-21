Pour deployer notre application, 
1. Ouvrir CMD(terminal) et entrez cette ligne de commande : docker run -d -p 3306:3306 --name gym-server -e MYSQL_ROOT_PASSWORD=oracle -e MYSQL_DATABASE=scott -e MYSQL_USER=scott -e MYSQL_PASSWORD=oracle mysql/mysql-server:latest
   et
2.  docker run --name mongo -d -p 27017:27017 mongodb/mongodb-community-server:latest
3. Ouvrir Desktop Docker et partez les deux conteneurs.
4. Cliquez sur les 3 petits points et allez dans le terminal du conteneur gym-server.
5. Entrez la commande dans la terminal du gym-server: mysql -u root -p et entrez le mot de passe : oracle 
6. Exécutez la ligne de commande en dessous dans Docker Desktop du gym-server ** OUVRIR LE README POUR COPY PASTE (NE PAS UTILISER LE PREVIEW) **
7. Ouvrir le fichier github dans visual studio code et aller dans le répertoire \git_web\CoolKidsClub-Gym\GYM\Projet_etudiant1>
8. Connectez a Mongo en utilsant l'extension MongoDB (feuille d'arbre) dans visual studio code
9. Exécuter le server avec : node server.js
10. Ouvrez http://localhost:4000/ dans votre navigateur web.
11. Pour tester la page admin, connectez a cette compte:
    Courriel: peaklabs1@gmail.com
    Mot de Passe: a
12. Pour tester des paiements, utiliser la carte 4242 4242 4242 4242 date : (12 / 30) CVC : (300) Code Postal : H4L 2N3

CREATE DATABASE mybd;

USE mybd;

CREATE TABLE e_compte ( E_ID INT AUTO_INCREMENT NOT NULL, E_NOM VARCHAR(200) NOT NULL, E_PRENOM VARCHAR(200) NOT NULL, E_PASSWORD VARCHAR(200) NOT NULL, E_LOCATION TEXT NOT NULL, E_COURRIEL TEXT NOT NULL, E_NUMBER TEXT NOT NULL, isAdmin BOOLEAN NOT NULL DEFAULT FALSE, PRIMARY KEY(E_ID) ) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI; 

INSERT INTO e_compte (E_NOM, E_PRENOM, E_PASSWORD, E_LOCATION, E_COURRIEL, E_NUMBER, isAdmin) 
VALUES ('Labs', 'Peak', 'a', '', 'peaklabs1@gmail.com', '5142222222', TRUE);

CREATE TABLE e_produit ( E_IDPRODUIT INT NOT NULL AUTO_INCREMENT, E_NOM TEXT NOT NULL, E_PRIX TEXT NOT NULL, E_CATEGORIE TEXT NOT NULL, E_QUANTITE INT NOT NULL, E_USER_ID INT, E_DATE_ACHAT TEXT NOT NULL, PRIMARY KEY(E_IDPRODUIT) ) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI; 

CREATE TABLE e_categorie ( E_ID INT AUTO_INCREMENT NOT NULL, E_VETEMENTS TEXT NOT NULL, E_EQUIPEMENTS TEXT NOT NULL, E_SUPPLEMENTS TEXT NOT NULL, PRIMARY KEY (E_ID) ) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_abonnements ( E_ID INT AUTO_INCREMENT NOT NULL, E_TYPE TEXT NOT NULL, E_PRIX TEXT NOT NULL, PRIMARY KEY (E_ID) ) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_vetements ( E_ID INT AUTO_INCREMENT NOT NULL, E_TYPE TEXT NOT NULL, E_COULEUR TEXT NOT NULL, E_TAILLE TEXT NOT NULL, E_SEXE TEXT NOT NULL, E_FOURNISSEUR_ID INT, PRIMARY KEY (E_ID) ) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_equipements ( E_ID INT AUTO_INCREMENT NOT NULL, E_TYPE TEXT NOT NULL, E_POIDS TEXT NOT NULL, E_FOURNISSEUR_ID INT, PRIMARY KEY (E_ID) ) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_supplements ( E_ID INT AUTO_INCREMENT NOT NULL, E_TYPE TEXT NOT NULL, E_FOURNISSEUR_ID INT, PRIMARY KEY (E_ID) ) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_fournisseur ( E_ID INT AUTO_INCREMENT NOT NULL, PRIMARY KEY (E_ID) ) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;
CREATE TABLE e_produit_achat LIKE e_produit;
GRANT ALL PRIVILEGES ON *.* TO 'scott'@'%';
FLUSH PRIVILEGES;
