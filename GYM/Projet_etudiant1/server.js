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
    var query = 'SELECT * FROM e_produit';

    if (req.query.vetements && req.query.equipements) {
        query = 'SELECT * FROM e_produit';
    } else if (req.query.vetements) {
        query = 'SELECT * FROM e_produit WHERE E_CATEGORIE = "Vetements"';
    } else if (req.query.equipements) {
        query = 'SELECT * FROM e_produit WHERE E_CATEGORIE = "Equipement"';
    } else {

        query = 'SELECT * FROM e_produit';
    }

    con.query(query, function (error, results, fields) {
        if (error) throw error;

        res.render("pages/boutique", {
            siteTitle: "Boutique",
            pageTitle: "Boutique",
            userDetails: req.session.user,
            products: results
        });
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
app.get("/event/detail", function (req, res) {
    res.render("pages/detail", {
        siteTitle: "Details",
        pageTitle: "Details",
        userDetails: req.session.user,
    });
});

app.get("/event/mdp_oublie", function (req, res) {
    res.render("pages/mdp_oublie", {
        siteTitle: "Changer Mot de passe",
        pageTitle: "Changer Mot de passe",
        userDetails: req.session.user,
    });
});

app.get("/event/apropos", function (req, res) {
    res.render("pages/apropos", {
        siteTitle: "A Propos",
        pageTitle: "A propos",
        userDetails: req.session.user,
    });
});


app.post('/event/panier', (req, res) => {
    const productName = req.body.productName;
    const price = req.body.price;
    const categorie = req.body.categorie;
    const quantite = req.body.quantite;
    const userId = req.session.user ? req.session.user.E_ID : null;

    // Check if the product already exists for the user
    const selectSql = "SELECT * FROM e_produit WHERE E_NOM = ? AND E_USER_ID = ?";
    con.query(selectSql, [productName, userId], (selectErr, selectResult) => {
        if (selectErr) {
            console.error("Error selecting data:", selectErr);
            res.status(500).send("Error selecting data");
            return;
        }

        if (selectResult.length > 0) {
            // If the product already exists, update the quantity
            const updateSql = "UPDATE e_produit SET E_QUANTITE = E_QUANTITE + 1 WHERE E_NOM = ? AND E_USER_ID = ?";
            con.query(updateSql, [productName, userId], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating quantity:", updateErr);
                    res.status(500).send("Error updating quantity");
                } else {
                    console.log("Quantity updated successfully");
                    res.redirect('/event/panier');
                }
            });
        } else {
            // If the product doesn't exist, insert a new record
            const insertSql = "INSERT INTO e_produit (E_NOM, E_PRIX, E_CATEGORIE, E_QUANTITE, E_USER_ID) VALUES (?, ?, ?, ?, ?)";
            const values = [productName, price, categorie, quantite, userId];

            con.query(insertSql, values, (insertErr, insertResult) => {
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


app.get("/event/panier", function (req, res) {
    const loggedInUserId = req.session.user ? req.session.user.E_ID : null;

    if (!loggedInUserId) {
        res.redirect('/event/connect');
        return;
    }
    con.query("SELECT * FROM e_produit WHERE E_USER_ID = ?", [loggedInUserId], function (err, result) {
        if (err) throw err;
        res.render("pages/panier", {
            siteTitle: "Application simple",
            pageTitle: "Liste d'événements",
            userDetails: req.session.user,
            items: result
        });
    });
});

app.post('/delete-item/:productId', (req, res) => {
    const productId = req.params.productId;

    // Quantité de produit
    con.query("SELECT E_QUANTITE FROM e_produit WHERE E_IDPRODUIT = ?", [productId], (selectErr, selectResult) => {
        if (selectErr) {
            console.error("Error retrieving product quantity:", selectErr);
            return res.status(500).send("Error retrieving product quantity");
        }

        if (selectResult.length === 0) {
            // Product not found
            return res.status(404).send("Product not found");
        }

        const currentQuantity = selectResult[0].E_QUANTITE;

        if (currentQuantity > 1) {
            //si il y a plus que 1 produit
            con.query("UPDATE e_produit SET E_QUANTITE = E_QUANTITE - 1 WHERE E_IDPRODUIT = ?", [productId], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error("Error updating product quantity:", updateErr);
                    return res.status(500).send("Error updating product quantity");
                }
                console.log("Product quantity decreased successfully");
                res.redirect('/event/panier'); // Redirect to the cart page after updating the quantity
            });
        } else {
            // Si c'est 1, on delete le produit
            con.query("DELETE FROM e_produit WHERE E_IDPRODUIT = ?", [productId], (deleteErr, deleteResult) => {
                if (deleteErr) {
                    console.error("Error deleting product:", deleteErr);
                    return res.status(500).send("Error deleting product");
                }
                console.log("Product deleted successfully");
                res.redirect('/event/panier'); // Redirect to the cart page after deleting the product
            });
        }
    });
});

app.post('/event/creationCompte', (req, res) => {
    const { nom, prénom, email, num, password } = req.body;

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
        const values = [nom, " ", prénom, email, password, num];

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
            res.redirect('/event/detail');
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
        res.redirect('/event/connect');
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
            userDetails: req.session.user,
        });
    });
});

app.get('/logout', (req, res) => {
    // Detruit la session
    req.session.destroy(err => {
        if (err) {
            console.error("ERREUR:", err);
            res.status(500).send("Internal Server Error");
            return;
        }
        res.redirect('/'); // Revas dans la page d'acceuil
    });
});

app.post('/update-details', (req, res) => {
    const userId = req.body.userId;
    const updatedDetails = req.body;
    delete updatedDetails.userId;

    let updateQuery = "UPDATE e_compte SET ";
    const updateValues = [];
    for (const key in updatedDetails) {
        if (updatedDetails.hasOwnProperty(key)) {
            // capitalize
            const capitalizedKey = key.toUpperCase();
            // change les trucs car sa bug
            if (capitalizedKey === 'NAME') {
                updateQuery += `E_NOM = ?, `;
            } else if (capitalizedKey === 'EMAIL') {
                updateQuery += `E_COURRIEL = ?, `;
            } else if (capitalizedKey === 'NUM') {
                updateQuery += `E_NUMBER = ?, `;

            } else {
                updateQuery += `E_${capitalizedKey} = ?, `;
            }

            updateValues.push(updatedDetails[key]);
        }
    }
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += " WHERE E_ID = ?";
    updateValues.push(userId);

    console.log("Generated SQL query:", updateQuery);
    console.log("Update values:", updateValues);


    con.query(updateQuery, updateValues, (err, result) => {
        if (err) {
            console.error("Error updating user details:", err);
            return res.status(500).send("Error updating user details");
        }

        const userDetailsQuery = "SELECT * FROM e_compte WHERE E_ID = ?";
        con.query(userDetailsQuery, [userId], (err, userDetails) => {
            if (err) {
                console.error("Error fetching updated user details:", err);
                return res.status(500).send("Error fetching updated user details");
            }

            req.session.user = userDetails[0];


            res.render("pages/detail", {
                siteTitle: "Details",
                pageTitle: "Details",

                userDetails: req.session.user,
            });
        });
    });
});
app.post('/delete-account', (req, res) => {
    const userId = req.session.user.E_ID;
    const deleteQuery = "DELETE FROM e_compte WHERE E_ID = ?";
    console.log("deleted");

    con.query(deleteQuery, [userId], (err, result) => {
        if (err) {
            console.error("Error deleting user account:", err);
            return res.status(500).send("Error deleting user account");
        }


        req.session.destroy(err => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).send("Error destroying session");
            }

            res.redirect("/logout");
        });
    });
});