Pour deployer notre application, 

1. Exécutez cette ligne de commande dans Docker Desktop en bas des indiquations. ** OUVRIR LE README POUR COPY PASTE (NE PAS UTILISER LE PREVIEW) **
2. Ouvrir le fichier github dans visual studio code et aller dans le répertoire \git_web\CoolKidsClub-Gym\GYM\Projet_etudiant1>
3. Exécuter le server avec : node .\server.js
4. Ouvrez http://localhost:4000/ dans votre navigateur web.

CREATE DATABASE mybd;

USE mybd;

CREATE TABLE e_compte (
    E_ID INT AUTO_INCREMENT NOT NULL, 
    E_NOM VARCHAR(200) NOT NULL,
    E_PRENOM VARCHAR(200) NOT NULL,
    E_PASSWORD VARCHAR(200) NOT NULL,
    E_LOCATION TEXT NOT NULL,
    E_COURRIEL TEXT NOT NULL,
    E_NUMBER TEXT NOT NULL,
    PRIMARY KEY(E_ID)
) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_produit (
    E_IDPRODUIT INT NOT NULL AUTO_INCREMENT, 
    E_NOM TEXT NOT NULL,
    E_PRIX TEXT NOT NULL,
    E_CATEGORIE TEXT NOT NULL,
    E_QUANTITE INT NOT NULL,
    E_USER_ID INT,
    PRIMARY KEY(E_IDPRODUIT)
) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_categorie (
    E_ID INT AUTO_INCREMENT NOT NULL,
    E_VETEMENTS TEXT NOT NULL,
    E_EQUIPEMENTS TEXT NOT NULL,
    E_SUPPLEMENTS TEXT NOT NULL,
    PRIMARY KEY (E_ID)
) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_abonnements (
    E_ID INT AUTO_INCREMENT NOT NULL,
    E_TYPE TEXT NOT NULL,
    E_PRIX TEXT NOT NULL,
    PRIMARY KEY (E_ID)
) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_vetements (
    E_ID INT AUTO_INCREMENT NOT NULL,
    E_TYPE TEXT NOT NULL,
    E_COULEUR TEXT NOT NULL,
    E_TAILLE TEXT NOT NULL,
    E_SEXE TEXT NOT NULL,
    E_FOURNISSEUR_ID INT,
    PRIMARY KEY (E_ID)
) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_equipements (
    E_ID INT AUTO_INCREMENT NOT NULL,
    E_TYPE TEXT NOT NULL,
    E_POIDS TEXT NOT NULL,
    E_FOURNISSEUR_ID INT,
    PRIMARY KEY (E_ID)
) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_supplements (
    E_ID INT AUTO_INCREMENT NOT NULL,
    E_TYPE TEXT NOT NULL,
    E_FOURNISSEUR_ID INT,
    PRIMARY KEY (E_ID)
) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;

CREATE TABLE e_fournisseur (
    E_ID INT AUTO_INCREMENT NOT NULL,
    PRIMARY KEY (E_ID)
) ENGINE=INNODB DEFAULT CHARSET=UTF8MB4 COLLATE=UTF8MB4_0900_AI_CI;




DROP USER 'scott'@'%';
CREATE USER 'scott'@'%' IDENTIFIED WITH mysql_native_password BY 'oracle';
GRANT ALL PRIVILEGES ON . TO 'scott'@'%';
FLUSH PRIVILEGES;
GRANT ALL PRIVILEGES ON *.* TO 'scott'@'%';
