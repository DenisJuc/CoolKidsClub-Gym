/*
    Importation des modules requis
*/
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql";
import bcrypt from 'bcrypt';
import Stripe from 'stripe';
import { config } from "dotenv";
import nodemailer from 'nodemailer';
import { getMongoDb, createReview, mongoClient } from "./gymCrud.js"; // Import mongoClient
import { MongoClient, ObjectId } from 'mongodb';
//import { executeGymCrudOperations } from "./gymCrud.js";

config();

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
    createAdminAccount();
});

async function createAdminAccount() {
    const adminEmail = 'peaklabs1@gmail.com';
    const adminPassword = 'a';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const checkAdminQuery = "SELECT * FROM e_compte WHERE E_COURRIEL = ?";
    con.query(checkAdminQuery, [adminEmail], async (err, result) => {
        if (err) {
            console.error("Error checking for existing admin account:", err);
            return;
        }

        if (result.length === 0) {
            const insertAdminQuery = `INSERT INTO e_compte (E_NOM, E_PRENOM, E_PASSWORD, E_LOCATION, E_COURRIEL, E_NUMBER, isAdmin) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const values = ['Labs', 'Peak', hashedPassword, '', adminEmail, '5142222222', true];

            con.query(insertAdminQuery, values, async (insertErr, insertResult) => {
                if (insertErr) {
                    console.error("Error inserting admin account:", insertErr);
                } else {
                    console.log("Admin account created successfully.");

                    // Get the userId of the newly created admin account
                    const userId = insertResult.insertId;

                    // Create a free trial subscription for the admin account
                    const freeTrialSubscription = {
                        userId,
                        productName: 'Essai Gratuit',
                        price: 0.00,
                        category: 'Abonnement',
                        quantity: 1,
                        startDate: new Date(),
                        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from start date
                        status: 'Active'
                    };

                    try {
                        const db = await getMongoDb();
                        if (!mongoClient.topology || !mongoClient.topology.isConnected()) {
                            console.log("Reconnecting to MongoDB...");
                            await mongoClient.connect();
                        }

                        await db.collection('activeSubscriptions').insertOne(freeTrialSubscription);
                        console.log("Free trial subscription assigned to admin account.");
                    } catch (error) {
                        console.error("Error assigning free trial subscription to admin account:", error);
                    }
                }
            });
        } else {
            console.log("Admin account already exists.");
        }
    });
}

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
app.get("/event/review", async (req, res) => {
    try {
        const db = await getMongoDb();
        if (!mongoClient.topology || !mongoClient.topology.isConnected()) {
            console.log("Reconnecting to MongoDB...");
            await mongoClient.connect();
        }
        console.log("Fetching reviews from MongoDB...");
        const reviews = await db.collection('reviews').find({}).toArray();
        console.log("Fetched reviews:", reviews);
        res.render("pages/review", {
            siteTitle: "Review",
            pageTitle: "Review",
            userDetails: req.session.user,
            reviews: reviews
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).send('Error fetching reviews: ' + error.message);
    }
});

process.on('SIGINT', async () => {
    if (mongoClient && mongoClient.topology && mongoClient.topology.isConnected()) {
        await mongoClient.close();
    }
    process.exit(0);
});



app.get("/event/test", function (req, res) {
    res.render("pages/test", {
        siteTitle: "Boutique",
        pageTitle: "Boutique",
        userDetails: req.session.user,
    });
});
app.get("/event/abonnement", async (req, res) => {
    const userId = req.session.user ? req.session.user.E_ID : null;

    let activeSubscriptions = null;

    if (userId) {
        try {
            const db = await getMongoDb();
            if (!mongoClient.topology || !mongoClient.topology.isConnected()) {
                console.log("Reconnecting to MongoDB...");
                await mongoClient.connect();
            }

            // Fetch the user's current subscription from the activeSubscriptions collection
            activeSubscriptions = await db.collection('activeSubscriptions').findOne({ userId });

        } catch (error) {
            console.error("Error fetching current subscription:", error);
        }
    }

    res.render("pages/abonnement", {
        siteTitle: "Abonnement",
        pageTitle: userId ? "Améliorez votre adhésion" : "Abonnement",
        userDetails: req.session.user,
        activeSubscriptions: activeSubscriptions
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

app.get("/event/admin", async (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).send("Forbidden");
    }

    console.log("kinda in");
    const userDetailsQuery = "SELECT * FROM e_compte";
    const productQuery = "SELECT * FROM e_produit_achat";

    con.query(userDetailsQuery, (err, userDetails) => {
        if (err) {
            console.error("Error executing userDetailsQuery:", err);
            return res.status(500).send("Internal Server Error");
        }

        con.query(productQuery, async (err, products) => {
            if (err) {
                console.error("Error executing productQuery:", err);
                return res.status(500).send("Internal Server Error");
            }

            try {
                const mongoDb = await getMongoDb();

                // Ensure the client is connected
                if (!mongoClient.topology || !mongoClient.topology.isConnected()) {
                    console.log("Reconnecting to MongoDB...");
                    await mongoClient.connect();
                }

                const subscriptions = await mongoDb.collection('activeSubscriptions').find({}).toArray();

                res.render("pages/admin", {
                    siteTitle: "Admin",
                    pageTitle: "Admin",
                    userDetails: userDetails,
                    products: products,
                    subscriptions: subscriptions
                });
            } catch (mongoError) {
                console.error("Error fetching subscriptions:", mongoError);
                return res.status(500).send("Internal Server Error");
            }
        });
    });
});


app.post('/event/panier', (req, res) => {
    const productName = req.body.productName;
    const categorie = req.body.categorie;
    const sexe = req.body.sexe;
    const color = req.body.color;
    const taille = req.body.taille;

    const userId = req.session.user ? req.session.user.E_ID : null;
    let price, poids, quantite;

    switch (categorie) {
        case 'Equipement':
            price = calculateEquipmentPrice(productName);
            poids = poidsEquipement(productName);
            quantite = 1;
            break;
        case 'Vetements':
            price = calculateClothingPrice(productName);
            quantite = 1;
            break;
        case 'Autre':
            price = 55;
            quantite = 1;
        default:
            break;
    }

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

            const insertSql = "INSERT INTO e_produit (E_NOM, E_PRIX, E_CATEGORIE, E_QUANTITE, E_USER_ID, E_DATE_ACHAT) VALUES (?, ?, ?, ?, ?, ?)";
            const currentDate = new Date().toISOString().slice(0, 10);

            const values = [productName, price, categorie, quantite, userId, "Incoming"];

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
function calculateEquipmentPrice(productName) {
    switch (productName) {
        case 'Haltère':
            return 20;
        case 'Plaque 20kg':
            return 30;
        case 'Barre W':
            return 40;
        default:
            return 0;
    }
}
function poidsEquipement(productName) {
    switch (productName) {
        case 'Haltère':
            return '1kg-10kg';
        case 'Plaque 20kg':
            return '20kg';
        case 'Barre W':
            return '20.4kg';
        default:
            return 0;
    }
}
function calculateClothingPrice(productName) {
    switch (productName) {
        case 'Chandail Peak Labs':
            return 25;
        case 'Hoodie Peak Labs':
            return 35;
        case 'Protein Powder Peak Labs':
            return 55;
        default:
            return 0;
    }
}

app.get("/event/panier", async (req, res) => {
    const userId = req.session.user ? req.session.user.E_ID : null;

    if (!userId) {
        return res.redirect('/event/connect');
    }

    try {
        const db = await getMongoDb();
        const mongoProducts = await db.collection('subscriptions').find({ userId }).toArray();

        con.query("SELECT * FROM e_produit WHERE E_USER_ID = ?", [userId], function (err, sqlProducts) {
            if (err) throw err;

            const allProducts = [...sqlProducts, ...mongoProducts];

            res.render("pages/panier", {
                siteTitle: "Application simple",
                pageTitle: "Liste d'événements",
                userDetails: req.session.user,
                items: allProducts
            });
        });
    } catch (error) {
        console.error("Erreur fetching panier items", error);
        res.status(500).send("Erreur");
    }
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

app.post('/delete-item/:productId', async (req, res) => {
    const productId = req.params.productId;

    try {
        const db = await getMongoDb();

        // Check if the productId is a valid MySQL ID
        if (!isNaN(productId)) {
            con.query("DELETE FROM e_produit WHERE E_IDPRODUIT = ?", [productId], async (deleteErr, deleteResult) => {
                if (deleteErr) {
                    console.error("Error deleting from MySQL:", deleteErr);
                    return res.status(500).send("Error deleting from MySQL");
                }

                // If MySQL deletion was not successful, attempt MongoDB deletion
                if (deleteResult.affectedRows === 0) {
                    try {
                        await db.collection('subscriptions').deleteOne({ _id: new ObjectId(productId) });
                        return res.redirect('/event/panier');
                    } catch (mongoErr) {
                        console.error("Error deleting from MongoDB:", mongoErr);
                        return res.status(500).send("Error deleting from MongoDB");
                    }
                }

                res.redirect('/event/panier');
            });
        } else {
            // Attempt MongoDB deletion if productId is not a valid MySQL ID
            try {
                await db.collection('subscriptions').deleteOne({ _id: new ObjectId(productId) });
                return res.redirect('/event/panier');
            } catch (mongoErr) {
                console.error("Error deleting from MongoDB:", mongoErr);
                return res.status(500).send("Error deleting from MongoDB");
            }
        }
    } catch (error) {
        console.error("Erreur deleting item", error);
        res.status(500).send("Erreur deleting item");
    }
});


app.post('/event/creationCompte', async (req, res) => {
    const { nom, prénom, email, num, password } = req.body;

    const checkEmailQuery = "SELECT * FROM e_compte WHERE E_COURRIEL = ?";
    con.query(checkEmailQuery, [email], async (checkErr, checkResult) => {
        if (checkErr) {
            return res.status(500).send("Erreur");
        }

        if (checkResult.length > 0) {
            return res.status(400).json({ message: "L'adresse courriel est déjà inscrite." });
        }

        bcrypt.hash(password, 10, async (hashErr, hashedPassword) => {
            if (hashErr) {
                return res.status(500).send("Erreur lors du hachage du mot de passe.");
            }

            const insertQuery = `INSERT INTO e_compte (E_NOM, E_LOCATION, E_PRENOM, E_COURRIEL, E_PASSWORD, E_NUMBER) VALUES (?, ?, ?, ?, ?, ?)`;
            const values = [nom, " ", prénom, email, hashedPassword, num];

            con.query(insertQuery, values, async (insertErr, insertResult) => {
                if (insertErr) {
                    return res.status(500).send("Erreur lors de l'insertion des données.");
                }

                // After creating the user, assign the free trial subscription
                const userId = insertResult.insertId;
                const freeTrialSubscription = {
                    userId,
                    productName: 'Essai Gratuit',
                    price: 0.00,
                    category: 'Abonnement',
                    quantity: 1,
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from start date
                    status: 'Active'
                };

                try {
                    const db = await getMongoDb();
                    await db.collection('activeSubscriptions').insertOne(freeTrialSubscription);
                } catch (error) {
                    console.error("Erreur lors de l'ajout de l'abonnement d'essai gratuit:", error);
                }

                res.redirect('/event/connect');
            });
        });
    });
});



app.post('/event/connect', (req, res) => {
    const { email, password } = req.body;

    const verifyUserQuery = "SELECT * FROM e_compte WHERE E_COURRIEL = ?";
    con.query(verifyUserQuery, [email], (err, result) => {
        if (err) {
            console.error("Error verifying user:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (result.length === 0) {
            return res.status(401).send("Email not found");
        }

        const user = result[0];

        bcrypt.compare(password, user.E_PASSWORD, (compareErr, isMatch) => {
            if (compareErr) {
                console.error("Error comparing passwords:", compareErr);
                return res.status(500).send("Internal Server Error");
            }

            if (isMatch) {
                req.session.user = user;
                res.redirect('/event/detail');
            } else {
                res.status(401).send("Incorrect password");
            }
        });
    });
});



app.get("/event/detail", async (req, res) => {
    const loggedInUserId = req.session.user ? req.session.user.E_ID : null;

    if (!loggedInUserId) {
        res.redirect('/event/connect');
        return;
    }

    try {
        const userDetailsQuery = "SELECT * FROM e_compte WHERE E_ID = ?";
        const db = await getMongoDb();

        // Fetch user details from MySQL
        con.query(userDetailsQuery, [loggedInUserId], async (err, userDetails) => {
            if (err) {
                console.error("MySQL error:", err);
                res.status(500).send("Erreur");
                return;
            }

            if (userDetails.length === 0) {
                console.error("User not found");
                res.status(404).send("Erreur");
                return;
            }

            // Fetch user subscriptions from MongoDB
            try {
                const subscriptions = await db.collection('activeSubscriptions').find({ userId: loggedInUserId }).toArray();

                res.render("pages/detail", {
                    siteTitle: "Details",
                    pageTitle: "Details",
                    userDetails: req.session.user,
                    subscriptions: subscriptions
                });
            } catch (mongoError) {
                console.error("MongoDB error:", mongoError);
                res.status(500).send("Erreur");
            }
        });
    } catch (error) {
        console.error("Error fetching user details and subscriptions:", error);
        res.status(500).send("Erreur");
    }
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

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.isAdmin) {
        next();
    } else {
        res.status(403).send("Unauthorized access");
    }
};

app.post('/update-password', (req, res) => {
    const email = req.body.email;
    const newPassword = req.body.password;

    const checkEmailQuery = `SELECT * FROM e_compte WHERE E_COURRIEL = '${email}'`;
    con.query(checkEmailQuery, (error, results) => {
        if (error) {
            res.status(500).send("Error checking email in the database");
        } else {
            if (results.length > 0) {
                const updatePasswordQuery = `UPDATE e_compte SET E_PASSWORD = '${newPassword}' WHERE E_COURRIEL = '${email}'`;


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

app.post('/update-details', async (req, res) => {
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

    con.query(updateQuery, updateValues, async (err, result) => {
        if (err) {
            return res.status(500).send("Erreur");
        }

        const userDetailsQuery = "SELECT * FROM e_compte WHERE E_ID = ?";
        con.query(userDetailsQuery, [userId], async (err, userDetails) => {
            if (err) {
                return res.status(500).send("Erreur");
            }

            req.session.user = userDetails[0];
            if (req.session.user.E_COURRIEL === "peaklabs1@gmail.com") {
                req.session.user.isAdmin = true;
            }

            // Fetch user subscriptions from MongoDB
            try {
                const db = await getMongoDb();
                const subscriptions = await db.collection('activeSubscriptions').find({ userId: userId }).toArray();

                res.render("pages/detail", {
                    siteTitle: "Details",
                    pageTitle: "Details",
                    userDetails: req.session.user,
                    subscriptions: subscriptions
                });
            } catch (mongoError) {
                console.error("MongoDB error:", mongoError);
                return res.status(500).send("Erreur");
            }
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

app.post('/event/add-subscription-to-cart', async (req, res) => {
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

    try {
        const db = await getMongoDb();
        if (!mongoClient.topology || !mongoClient.topology.isConnected()) {
            console.log("Reconnecting to MongoDB...");
            await mongoClient.connect();
        }

        // Remove the current active subscription if it exists
        await db.collection('activeSubscriptions').deleteMany({ userId });

        // Add the new subscription to the cart
        const newSubscription = {
            userId,
            productName: subscription.productName,
            price: subscription.price,
            category: 'Abonnement',
            quantity: 1,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from start date
            status: 'Active',
            inCart: true
        };

        // Remove previous subscriptions from the cart
        await db.collection('subscriptions').deleteMany({ userId, inCart: true });

        await db.collection('subscriptions').insertOne(newSubscription);

        res.redirect('/event/panier');
    } catch (error) {
        console.error("Erreur", error);
        res.status(500).send("Erreur");
    }
});



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


const calculateOrderAmount = (items) => {

    var amount = 0;
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


app.get("/event/confirmation", async (req, res) => {
    const loggedInUserId = req.session.user ? req.session.user.E_ID : null;
    if (!loggedInUserId) {
        res.redirect('/event/connect');
        return;
    }

    try {
        const [sqlResults, mongoDb] = await Promise.all([
            new Promise((resolve, reject) => {
                con.query("SELECT * FROM e_produit WHERE E_USER_ID = ?", [loggedInUserId], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            }),
            getMongoDb()
        ]);

        const mongoResults = await mongoDb.collection('subscriptions').find({ userId: loggedInUserId }).toArray();
        const items = [...sqlResults, ...mongoResults];

        res.render("pages/confirmation", {
            siteTitle: "Confirmation",
            pageTitle: "Confirmation",
            userDetails: req.session.user,
            items: items
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/event/confirmation', async (req, res) => {
    const loggedInUserId = req.session.user ? req.session.user.E_ID : null;
    if (!loggedInUserId) {
        res.redirect('/event/connect');
        return;
    }

    const currentDate = new Date().toISOString().slice(0, 10);
    const updateSql = "INSERT INTO e_produit_achat (E_NOM, E_PRIX, E_CATEGORIE, E_QUANTITE, E_USER_ID, E_DATE_ACHAT) SELECT E_NOM, E_PRIX, E_CATEGORIE, E_QUANTITE, E_USER_ID, ? AS E_DATE_ACHAT FROM e_produit WHERE E_USER_ID = ? AND E_DATE_ACHAT = 'Incoming'";
    const deleteSql = "DELETE FROM e_produit WHERE E_USER_ID = ? AND E_DATE_ACHAT = 'Incoming'";

    try {
        const db = await getMongoDb();

        // Move subscriptions from 'subscriptions' to 'activeSubscriptions'
        const subscriptions = await db.collection('subscriptions').find({ userId: loggedInUserId }).toArray();

        if (subscriptions.length > 0) {
            const activeSubscriptions = subscriptions.map(subscription => ({
                ...subscription,
                status: 'Active'
            }));

            await db.collection('activeSubscriptions').insertMany(activeSubscriptions);
            await db.collection('subscriptions').deleteMany({ userId: loggedInUserId });
        }

        con.beginTransaction((err) => {
            if (err) {
                console.error("Transaction error:", err);
                return res.status(500).send("Erreur");
            }

            con.query(updateSql, [currentDate, loggedInUserId], (updateErr, updateResult) => {
                if (updateErr) {
                    con.rollback(() => {
                        console.error("Error moving data to e_produit_achat:", updateErr);
                        res.status(500).send("Erreur");
                    });
                } else {
                    con.query(deleteSql, [loggedInUserId], (deleteErr, deleteResult) => {
                        if (deleteErr) {
                            con.rollback(() => {
                                console.error("Error deleting data from e_produit:", deleteErr);
                                res.status(500).send("Erreur");
                            });
                        } else {
                            con.commit((commitErr) => {
                                if (commitErr) {
                                    con.rollback(() => {
                                        console.error("Commit error:", commitErr);
                                        res.status(500).send("Erreur");
                                    });
                                } else {
                                    res.redirect('/');
                                }
                            });
                        }
                    });
                }
            });
        });
    } catch (error) {
        console.error("Erreur during subscription confirmation", error);
        res.status(500).send("Erreur during subscription confirmation");
    }
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

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000);
}

let storedVerificationCode = 0; // Variable to store the verification code
let storeEmail;

app.post('/send-reset-email', (req, res) => {
    const email = req.body.email;
    const verificationCode = generateVerificationCode();

    // Store the verification code in the variable

    storedVerificationCode = verificationCode;
    storeEmail = email;

    const mailOptions = {
        from: 'peaklabs',
        to: email,
        subject: 'Réinitialisation du mot de passe',
        text: `Cher(e) Utilisateur,
    
Nous avons reçu une demande de réinitialisation de votre mot de passe. Si vous n'avez pas effectué cette demande, vous pouvez ignorer cet e-mail.
    
Votre code de vérification est : ${verificationCode}
    
Pour réinitialiser votre mot de passe, veuillez cliquer sur le lien suivant :
http://localhost:4000/event/newpass
    
Si le lien ne fonctionne pas, veuillez copier et coller l'URL dans la barre d'adresse de votre navigateur.
    
Merci,
PeakLabs`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).send('Error sending email');
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send('Email sent successfully');
        }
    });
});

app.post('/update-password-verif', (req, res) => {
    const email = req.body.email;
    const newPassword = req.body.password;
    const verificationCode = req.body.verificationCode;

    console.log(verificationCode);
    console.log(storedVerificationCode);
    console.log(email);
    console.log(storeEmail);

    if (verificationCode == storedVerificationCode && email == storeEmail) {
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                res.status(500).send('Error hashing password');
                return;
            }
            const updatePasswordQuery = `UPDATE e_compte SET E_PASSWORD = '${hashedPassword}' WHERE E_COURRIEL = '${email}'`;
            con.query(updatePasswordQuery, (error, results) => {
                if (error) {
                    console.error('Error updating password:', error);
                    res.status(500).send('Error updating password');
                } else {
                    console.log('Password updated successfully');
                    res.json({ message: "SUCCESS" });
                }
            });
        });
    } else {
        // Invalid verification code
        res.status(400).json({ message: "INVALID VERIFICATION CODE" });
    }
});



app.get("/event/review", function (req, res) {
    res.render("pages/review", {
        siteTitle: "Review",
        pageTitle: "Review",
        userDetails: req.session.user,
    });
});
app.get("/event/apply", function (req, res) {
    res.render("pages/appliquer", {
        siteTitle: "Appli",
        pageTitle: "Appli",
        userDetails: req.session.user,
    });
});


app.post('/event/soumettre-avis', async (req, res) => {
    const { userName, userRating, userReview } = req.body;

    const newReview = {
        username: userName,
        rating: parseInt(userRating),
        review: userReview,
        createdAt: new Date()
    };

    try {
        const db = await getMongoDb();
        await createReview(db, newReview);
        res.redirect('/event/review');
    } catch (error) {
        console.error("Error saving review:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.get('/product-purchases', (req, res) => {
    const { timeframe } = req.query;

    let startDate;
    let endDate = new Date();
    switch (timeframe) {
        case '7days':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 6);
            break;
        case '30days':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 29);
            break;
        case '1year':
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        default:
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 29);
            break;
    }

    con.query('SELECT DATE_FORMAT(E_DATE_ACHAT, "%Y-%m-%d") AS purchaseDate, COUNT(*) AS purchaseCount FROM e_produit_achat WHERE E_DATE_ACHAT BETWEEN ? AND ? GROUP BY purchaseDate', [startDate, endDate], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        const labels = results.map(entry => entry.purchaseDate);
        const data = results.map(entry => entry.purchaseCount);
        const chartData = { labels, data };

        res.json(chartData);
    });
});


app.post('/set-admin-status', (req, res) => {
    const { userId, adminCheckbox } = req.body;
    const isAdmin = adminCheckbox === 'on';

    const updateAdminQuery = "UPDATE e_compte SET isAdmin = ? WHERE E_ID = ?";
    con.query(updateAdminQuery, [isAdmin, userId], (err, result) => {
        if (err) {
            console.error("Error updating admin status:", err);
            return res.status(500).send("Erreur lors de la mise à jour du statut administrateur");
        }

        if (result.affectedRows === 0) {
            console.error("No rows affected while updating admin status");
            return res.status(500).send("Erreur lors de la mise à jour du statut administrateur");
        }

        const userDetailsQuery = "SELECT * FROM e_compte WHERE E_ID = ?";
        con.query(userDetailsQuery, [userId], (err, userDetails) => {
            if (err) {
                console.error("Error fetching user details:", err);
                return res.status(500).send("Erreur lors de la récupération des détails de l'utilisateur");
            }

            req.session.user = userDetails[0];
            req.session.user.isAdmin = true;

            res.redirect('/event/admin');
        });
    });
});


app.post('/reviews', async (req, res) => {
    const db = await getMongoDb();
    const { username, rating, review } = req.body;
    try {
        await createReview(db, {
            username: username,
            rating: parseInt(rating),
            review: review,
            createdAt: new Date()
        });
        res.redirect('/event/review');  // Redirige l'utilisateur vers la page des avis
    } catch (error) {
        res.status(500).send("Erreur lors de la création de l'avis: ' + error.message");
    }
});

/*
const server = app.listen(4000, function () {
    console.log("serveur fonctionne sur 4000... !");
});
*/
app.get('/reviews/:username', async (req, res) => {
    const db = await getMongoDb();
    try {
        const review = await findReviewByUsername(db, req.params.username);
        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/reviews/:username', async (req, res) => {
    const db = await getMongoDb();
    try {
        await updateReviewByUsername(db, req.params.username, req.body);
        res.status(200).send('Review modifié');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/reviews/:username', async (req, res) => {
    const db = await getMongoDb();
    try {
        await deleteReviewByUsername(db, req.params.username);
        res.status(200).send('Review effacé');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/event/cancel-subscription', async (req, res) => {
    const userId = req.session.user ? req.session.user.E_ID : null;

    if (!userId) {
        return res.redirect('/event/connect');
    }

    try {
        const db = await getMongoDb();
        await db.collection('activeSubscriptions').deleteMany({ userId });

        res.redirect('/event/abonnement');
    } catch (error) {
        console.error("Erreur lors de l'annulation de l'abonnement:", error);
        res.status(500).send("Erreur");
    }
});
