/*
    Importation des modules requis
*/
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql";
import { body, validationResult } from "express-validator";
import dateFormat from "dateformat";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
    Connect to server
*/
const server = app.listen(4000, function() {
    console.log("serveur fonctionne sur 4000... ! ");
});
/*
    Configuration de EJS
*/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
/*
    Importation de Bootstrap
*/
app.use("/js", express.static(__dirname + "/node_modules/bootstrap/dist/js"));
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));
app.use(express.static(__dirname + "/Images"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
    Connection au server MySQL
*/
const con = mysql.createConnection({
    host: "localhost",
    user: "scott",
    password: "oracle",
    database: "mybd"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("connected!");
});

/*
    Description des routes
*/

app.get("/", function (req,res){
    res.render("pages/index", {
      siteTitle: "Index",
      pageTitle: "index",
    });
});
app.get("/event/connect", function (req,res){
        res.render("pages/connexion", {
          siteTitle: "Connexion",
          pageTitle: "Connectez-vous",
        });
});
app.get("/event/creationCompte", function (req,res){
    res.render("pages/CreationCompte", {
      siteTitle: "Créer Compte",
      pageTitle: "Créer Compte",
    });
});
app.get("/event/boutique", function (req,res){
    res.render("pages/boutique", {
      siteTitle: "Boutique",
      pageTitle: "Boutique",
    });
});
app.get("/event/test", function (req,res){
    res.render("pages/test", {
      siteTitle: "Boutique",
      pageTitle: "Boutique",
    });
});
app.get("/event/abonnement", function (req,res){
    res.render("pages/abonnement", {
      siteTitle: "Abonnement",
      pageTitle: "Abonnement",
    });
});
app.get("/event/panier", function (req, res) {
    con.query("SELECT * FROM e_produit", function (err, result) {
        if (err) throw err;
        res.render("pages/panier", {
          siteTitle: "Application simple",
          pageTitle: "Liste d'événements",
          items: result
        });
    });
});
