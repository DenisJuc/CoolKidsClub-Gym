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

// Configure session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));


/*
    Connect to server
*/
const server = app.listen(4000, function () {
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

con.connect(function (err) {
    if (err) throw err;
    console.log("connected!");
});

/*
    Description des routes
*/

app.get("/", function (req, res) {
    res.render("pages/index", {
        siteTitle: "Index",
        pageTitle: "index",
        userDetails: req.session.user,
    });
});
app.get("/event/connect", function (req, res) {
    res.render("pages/connexion", {
        siteTitle: "Connexion",
        pageTitle: "Connectez-vous",
        userDetails: req.session.user,
    });
});
app.get("/event/creationCompte", function (req, res) {
    res.render("pages/CreationCompte", {
        siteTitle: "Créer Compte",
        pageTitle: "Créer Compte",
        userDetails: req.session.user,
    });
});
app.get("/event/boutique", function (req, res) {
    res.render("pages/boutique", {
        siteTitle: "Boutique",
        pageTitle: "Boutique",
        userDetails: req.session.user,
    });
});
app.get("/event/test", function (req, res) {
    res.render("pages/test", {
        siteTitle: "Boutique",
        pageTitle: "Boutique",
        userDetails: req.session.user,
    });
});
app.get("/event/abonnement", function (req, res) {
    res.render("pages/abonnement", {
        siteTitle: "Abonnement",
        pageTitle: "Abonnement",
        userDetails: req.session.user,
    });
});
app.get("/event/panier", function (req, res) {
    con.query("SELECT * FROM e_produit", function (err, result) {
        if (err) throw err;
        res.render("pages/panier", {
            siteTitle: "Application simple",
            pageTitle: "Liste d'événements",
            userDetails: req.session.user,
            items: result
        });
    });
});
app.get("/event/detail", function (req, res) {
    res.render("pages/detail", {
        siteTitle: "Details",
        pageTitle: "Details",
        userDetails: req.session.user,
    });
});

app.post('/event/panier', (req, res) => {
    const productName = req.body.productName;
    const price = req.body.price;
    const categorie = req.body.categorie;
    const quantite = req.body.quantite;

    const selectSql = "SELECT * FROM e_produit WHERE E_NOM = ?";
    con.query(selectSql, [productName], (selectErr, selectResult) => {
        if (selectErr) {
            console.error("Error checking existing product:", selectErr);
            res.status(500).send("Error checking existing product");
            return;
        }

        if (selectResult.length > 0) {

            const existingProductId = selectResult[0].E_IDPRODUIT;
            const updateSql = "UPDATE e_produit SET E_QUANTITE = E_QUANTITE + 1 WHERE E_IDPRODUIT = ?";
            con.query(updateSql, [existingProductId], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating quantity:", updateErr);
                    res.status(500).send("Error updating quantity");
                } else {
                    console.log("Quantity updated successfully");
                    res.redirect('/event/panier');
                }
            });
        } else {
            // Product doesn't exist, insert a new record
            const insertSql = "INSERT INTO e_produit (E_NOM, E_PRIX, E_CATEGORIE, E_QUANTITE) VALUES (?, ?, ?, ?)";
            con.query(insertSql, [productName, price, categorie, quantite], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error("Error inserting data:", insertErr);
                    res.status(500).send("Error inserting data");
                } else {
                    console.log("Data inserted successfully");
                    res.redirect('/event/panier');
                }
            });
        }
    });
});


app.post('/event/creationCompte', (req, res) => {
    const { name, prénom, email, num, password } = req.body;

    // Vérifier si l'email existe déjà dans la base de données
    const checkEmailQuery = "SELECT * FROM e_compte WHERE E_COURRIEL = ?";
    con.query(checkEmailQuery, [email], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Erreur lors de la vérification de l'email :", checkErr);
            return res.status(500).send("Erreur interne du serveur");
        }

        // Si l'email existe déjà, envoyer une réponse au client
        if (checkResult.length > 0) {
            return res.status(400).json({ message: "L'adresse courriel est déjà inscrite." });
        }

        // Si l'email n'existe pas encore, procéder à l'insertion dans la base de données
        const insertQuery = `INSERT INTO e_compte (E_NOM, E_LOCATION, E_PRENOM, E_COURRIEL, E_PASSWORD, E_NUMBER) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [name, " ", prénom, email, password, num];

        // Exécuter la requête d'insertion
        con.query(insertQuery, values, (insertErr, insertResult) => {
            if (insertErr) {
                console.error("Erreur lors de l'insertion des données :", insertErr);
                return res.status(500).send("Erreur interne du serveur");
            }
            console.log("Données insérées avec succès");
            res.redirect('/event/connect');
        });
    });
});
app.post('/event/connect', (req, res) => {
    const { email, password } = req.body;

    const verifyUserQuery = "SELECT * FROM e_compte WHERE E_COURRIEL = ? AND E_PASSWORD = ?";
    con.query(verifyUserQuery, [email, password], (err, result) => {
        if (err) {
            console.error("Error verifying user:", err);
            return res.status(500).send("Internal Server Error");
        }
        console.log("Result:", result);

        if (result.length > 0) {
            // Login successful
            req.session.user = result[0];// Store user ID in session

            console.log("User inserted in session:", req.session.user);
            res.redirect('/event/detail'); // Redirect to homepage or wherever you want to redirect after successful login
            return req.session.user;
        } else {
            // Login failed
            console.error("Login failed for email:", email);
            res.status(401).send("Login failed. Please check your email and password.");
        }
    });
});


app.get("/event/detail", (req, res) => {
    console.log("kinda in");
    const loggedInUserId = req.session.user ? req.session.user.E_ID : null;

    if (!loggedInUserId) {
        res.redirect('/event/connect'); // Redirect to login page if user is not logged in
        return;
    }

    const userDetailsQuery = "SELECT * FROM e_compte WHERE E_ID = ?";
    con.query(userDetailsQuery, [loggedInUserId], (err, userDetails) => {
        if (err) {
            console.error("Error fetching user details:", err);
            res.status(500).send("Internal Server Error");
            return;
        }

        if (userDetails.length === 0) {
            res.status(404).send("User not found");
            return;
        }

        res.render("pages/detail", {
            siteTitle: "Details",
            pageTitle: "Details",
            userDetails: req.session.user, // Using userDetails instead of req.session.user
        });
    });
});

app.get('/logout', (req, res) => {
    // Clear the user's session
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            res.status(500).send("Internal Server Error");
            return;
        }
        res.redirect('/'); // Redirect to the homepage after logout
    });
});

