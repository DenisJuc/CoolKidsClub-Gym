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
import nodemailer from 'nodemailer';

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
server.keepAliveTimeout = 61 * 1000;
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

app.get("/event/newpass", function (req, res) {
    res.render("pages/newpass", {
        siteTitle: "newpass",
        pageTitle: "newpass",
        userDetails: req.session.user,
    });
});

app.get("/event/admin", (req, res) => {
    console.log("kinda in");
    const userDetailsQuery = "SELECT * FROM e_compte WHERE E_ID = ?";
    con.query(userDetailsQuery, (err, userDetails) => {
        if (err) {
            res.status(500).send("Erreur");
            return;
        }

        if (userDetails.length === 0) {
            res.status(404).send("Erreur");
            return;
        }

        res.render("pages/admin", {
            siteTitle: "Admin",
            pageTitle: "Admin",
            userDetails: req.session.user,
        });
    });
});

app.post('/event/panier', (req, res) => {
    const productName = req.body.productName;
    const price = req.body.price;
    const categorie = req.body.categorie;
    const quantite = req.body.quantite;
    const poids = req.body.poids;
    const sexe = req.body.sexe;
    const color = req.body.color;
    const taille = req.body.taille;

    const userId = req.session.user ? req.session.user.E_ID : null;


    const selectSql = "SELECT * FROM e_produit WHERE E_NOM = ? AND E_USER_ID = ?";
    con.query(selectSql, [productName, userId], (selectErr, selectResult) => {
        if (selectErr) {
            res.status(500).send("Erreur");
            return;
        }

        if (selectResult.length > 0) {

            const updateSql = "UPDATE e_produit SET E_QUANTITE = E_QUANTITE + 1 WHERE E_NOM = ? AND E_USER_ID = ?";
            con.query(updateSql, [productName, userId], (updateErr, updateResult) => {
                if (updateErr) {
                    res.redirect('/event/connect');
                } else {
                    res.redirect('/event/panier');
                }
            });
        } else {

            const insertSql = "INSERT INTO e_produit (E_NOM, E_PRIX, E_CATEGORIE, E_QUANTITE, E_USER_ID) VALUES (?, ?, ?, ?, ?)";

            const values = [productName, price, categorie, quantite, userId];

            con.query(insertSql, values, (insertErr, insertResult) => {
                if (categorie === 'Equipement') {
                    const insertEquipmentsSql = "INSERT INTO e_equipements (E_TYPE, E_POIDS, E_FOURNISSEUR_ID) VALUES (?, ?, ?)";
                    const equipmentValues = [productName, poids, null];
                    con.query(insertEquipmentsSql, equipmentValues, (insertEquipmentsErr, insertEquipmentsResult) => {
                        if (insertEquipmentsErr) {
                            console.error("Erreur");
                        } else {
                            console.log("Inserer");
                        }
                    });
                } else if (categorie === 'Vetements') {
                    const insertVetementsSQL = "INSERT INTO e_vetements(E_TYPE, E_COULEUR, E_TAILLE, E_SEXE, E_FOURNISSEUR_ID) VALUES(?, ?, ?, ?, ?)"
                    const vetementsValues = [productName, color, taille, sexe, null];
                    con.query(insertVetementsSQL, vetementsValues, (insertVetementsErr, insertVetementsResult) => {
                        if (insertVetementsErr) {
                            console.error("Erreur");
                        } else {
                            console.log("Inserer");
                        }
                    })
                }
                res.redirect('/event/panier');


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

app.post('/delete-payment', (req, res) => {
    const userId = req.session.user.E_ID;
    const deleteQuery = "DELETE FROM e_produit WHERE E_USER_ID = ?";
    console.log("deleted");

    con.query(deleteQuery, [userId], (err, result) => {
        if (err) {
            return res.status(500).send("Erreur");
        }
        res.redirect('/');
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
            return res.status(404).send("Erreur");
        }

        const currentQuantity = selectResult[0].E_QUANTITE;
            con.query("DELETE FROM e_produit WHERE E_IDPRODUIT = ?", [productId], (deleteErr, deleteResult) => {
                if (deleteErr) {
                    return res.status(500).send("Erreur");
                }
                res.redirect('/event/panier');
            });
        
    });
});

app.post('/event/creationCompte', (req, res) => {
    const { nom, prénom, email, num, password } = req.body;

    // Vérifier si l'email existe déjà dans la base de données
    const checkEmailQuery = "SELECT * FROM e_compte WHERE E_COURRIEL = ?";
    con.query(checkEmailQuery, [email], (checkErr, checkResult) => {
        if (checkErr) {
            return res.status(500).send("Erreur");
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
                return res.status(500).send("Erreur");
            }
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
            req.session.user = result[0];
            res.redirect('/event/detail');
            return req.session.user;
        } else {
            res.status(401).send("Erreur");
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
            res.status(500).send("Erreur");
            return;
        }

        if (userDetails.length === 0) {
            res.status(404).send("Erreur");
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
            res.status(500).send("Erreur");
            return;
        }
        res.redirect('/'); // Revas dans la page d'acceuil
    });
});

app.post('/update-password', (req, res) => {
    const email = req.body.email;
    const newPassword = req.body.password;

    const checkEmailQuery = "SELECT * FROM e_compte WHERE E_COURRIEL" = '${email}';

    con.query(checkEmailQuery, (error, results) => {
        if (error) {
            res.status(500).send("Error checking email in the database");
        } else {
            if (results.length > 0) {
                const updatePasswordQuery = "UPDATE e_compte SET E_PASSWORD = '${newPassword}' WHERE E_COURRIEL" = '${email}';

                con.query(updatePasswordQuery, (error, results) => {
                    if (error) {
                        res.status(500).send("Error updating password");
                    } else {
                        res.redirect("/event/connect")
                    }
                });
            } else {
                res.status(404).json({ message: "ACCOUNT NOT FOUND" });
            }
        }
    });
});

app.get("/event/admin", function (req, res) {
    const userDetailsQuery = "SELECT * FROM e_compte";
    con.query(userDetailsQuery, (err, userDetails) => {
        if (err) {
            res.status(500).send("Erreur");
            return;
        }

        res.render("pages/admin", {
            siteTitle: "Admin",
            pageTitle: "Admin",
            userDetails: userDetails,
        });
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


    con.query(updateQuery, updateValues, (err, result) => {
        if (err) {
            return res.status(500).send("Erreur");
        }

        const userDetailsQuery = "SELECT * FROM e_compte WHERE E_ID = ?";
        con.query(userDetailsQuery, [userId], (err, userDetails) => {
            if (err) {
                return res.status(500).send("Erreur");
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
            return res.status(500).send("Erreur");
        }

        req.session.destroy(err => {
            if (err) {
                return res.status(500).send("Erreur");
            }

            res.redirect("/logout");
        });
    });
});

app.post('/event/add-subscription-to-cart', (req, res) => {
    const { subscriptionType } = req.body;
    const userId = req.session.user ? req.session.user.E_ID : null;

    if (!userId) {
        return res.redirect('/event/connect');
    }

    const subscriptions = {
        'essai-gratuit': { productName: 'Essai Gratuit', price: 0.00 },
        'standard': { productName: 'Abonnement Standard', price: 14.99 },
        'peak': { productName: 'Abonnement Peak', price: 35.99 }
    };

    const subscription = subscriptions[subscriptionType];

    if (!subscription) {
        return res.redirect('/event/abonnement');
    }

    con.query("DELETE FROM e_produit WHERE E_USER_ID = ? AND E_CATEGORIE = 'Abonnement'", [userId], deleteErr => {
        if (deleteErr) {
            console.error("Erreur", deleteErr);
            return res.status(500).send("Erreur");
        }
    });

    con.query("INSERT INTO e_produit (E_NOM, E_PRIX, E_CATEGORIE, E_QUANTITE, E_USER_ID) VALUES (?, ?, 'Abonnement', 1, ?)",
        [subscription.productName, subscription.price, userId], insertErr => {
            if (insertErr) {
                console.error("Erreur", insertErr);
                return res.status(500).send("Erreur");
            }

            res.redirect('/event/panier');
        });
});

import Stripe from 'stripe';
// This is your test secret API key.
const stripe = new Stripe('sk_test_51OvgtJP5VwBXZgOXohPNaXkcg0PbJqdZm05VpQfzYgDpNZSA31iYGd18dnxJVREkqRapCb8vy8cmiyVAZvwgkqC5000DhDQ9Ut');

app.use(express.static("public"));
app.use(express.json());


const buildLineItem = (item) => {
    return {
        amount: item.amount, // Amount in cents
        reference: item.id, // Unique reference for the item in the scope of the calculation
    };
};

// Securely calculate the order amount, including tax
const calculateOrderAmount = (items) => {
    // Replace this constant with a calculation of the order's amount
    // Calculate the order total with any exclusive taxes on the server to prevent
    // people from directly manipulating the amount on the client
  
    var amount=0;
    items.forEach(item => {
      amount += item.amount;
  });
    let orderAmount = amount;
    return orderAmount;
  };

app.post("/create-payment-intent", async (req, res) => {
    const { items } = req.body;

    // Create a Tax Calculation for the items being sold
    const amount = await calculateOrderAmount(items);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "cad",
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
            enabled: true,
        },
    });

    res.send({
        clientSecret: paymentIntent.client_secret,
    });
});

// Invoke this method in your webhook handler when `payment_intent.succeeded` webhook is received
const handlePaymentIntentSucceeded = async (paymentIntent) => {
    // Create a Tax Transaction for the successful payment
    stripe.tax.transactions.createFromCalculation({
        reference: 'myOrder_123', // Replace with a unique reference from your checkout/order system
    });
};


app.get("/event/confirmation", function (req, res) {
    const loggedInUserId = req.session.user ? req.session.user.E_ID : null;
    if (!loggedInUserId) {
        res.redirect('/event/connect');
        return;
    }
    con.query("SELECT * FROM e_produit WHERE E_USER_ID = ?", [loggedInUserId], function (err, result) {
        if (err) throw err;
        res.render("pages/confirmation", {
            siteTitle: "Application simple",
            pageTitle: "Liste d'événements",
            userDetails: req.session.user,
            items: result
        });
    });
});
app.post('/update-quantity', (req, res) => {
    const productId = req.body.productId;
    const newQuantity = req.body.newQuantity;

    con.query("UPDATE e_produit SET E_QUANTITE = ? WHERE E_IDPRODUIT = ?", [newQuantity, productId], (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour de la quantité du produit:', err);
            return res.status(500).send('Erreur lors de la mise à jour de la quantité du produit');
        } else if (newQuantity == 0) {
            con.query("DELETE FROM e_produit WHERE E_IDPRODUIT=?", [productId], deleteErr => {
                if (deleteErr) {
                    console.error("Erreur", deleteErr);
                    return res.status(500).send("Erreur");
                }
            });
        }
    });
});

app.post('/update-page', (req, res) => {
    res.redirect('/event/panier')
});

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
        user: 'peaklabs1@gmail.com',
        pass: 'womv ulmb tpye yfsr'
    }
});

app.post('/send-reset-email', (req, res) => {
    const email = req.body.email;

    const mailOptions = {
        from: 'peaklabs',
        to: email,
        subject: 'Réinitialisation du mot de passe', // Sujet de l'e-mail
        text: `Cher(e) Utilisateur,
    
    Nous avons reçu une demande de réinitialisation de votre mot de passe. Si vous n'avez pas effectué cette demande, vous pouvez ignorer cet e-mail.
    
    Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien suivant :
    http://localhost:4000/event/newpass
    
    Si le lien ne fonctionne pas, veuillez copier et coller l'URL dans la barre d'adresse de votre navigateur.
    
    Merci,
    PeakLabs`
    };
    // Send the email
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            res.status(500).send('Error sending email');
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send('Email sent successfully');
        }
    });
});