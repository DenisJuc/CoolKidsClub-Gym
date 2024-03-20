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
app.get("/", function (req, res) {
    con.query("SELECT * FROM e_events ORDER BY e_start_date DESC", function (err, result) {
        if (err) throw err;
        res.render("pages/index", {
          siteTitle: "Application simple",
          pageTitle: "Liste d'événements",
          items: result
        });
    });
});

app.get("/event/add", function (req, res) {
    con.query("SELECT * FROM e_events ORDER BY e_start_date DESC", function (err, result) {
        if (err) throw err;
        res.render("pages/add-event", {
          siteTitle: "Application simple",
          pageTitle: "Ajouter un nouvel événement",
          items: result
        });
    });
});
app.post("/event/add", function (req, res) {
    const requete = "INSERT INTO e_events (e_name, e_start_date, e_start_end, e_desc, e_location) VALUES (?, ?, ?, ?, ?)";
    const parametres = [
        req.body.e_name,
        dateFormat(req.body.e_start_date, "yyyy-mm-dd"),
        dateFormat(req.body.e_start_end, "yyyy-mm-dd"),
        req.body.e_desc,
        req.body.e_location
    ];
    con.query(requete, parametres, function (err, result) {
        if (err) throw err;
        res.redirect("/");
    });
});
/*
    Permettre l'utilisation de body lors des POST request
*/

app.get("/event/edit/:id", function (req, res) {
    const requete = "SELECT * FROM e_events WHERE e_id = ?";
    const parametres = [req.params.id];
    con.query(requete, parametres, function (err, result) {
      if (err) throw err;
      result[0].E_START_DATE = dateFormat(result[0].E_START_DATE, "yyyy-mm-dd");
      result[0].E_START_END = dateFormat(result[0].E_START_END, "yyyy-mm-dd");
      res.render("pages/edit-event.ejs", {
        siteTitle: "Application simple",
        pageTitle: "Editer événement : " + result[0].e_name,
        items: result,
      });
    });
});
app.post("/event/edit/:id", function (req, res) {
    const requete = "UPDATE e_events SET e_name = ?, e_start_date = ?, e_start_end = ?, e_desc = ?, e_location = ? WHERE e_id = ?";
    const parametres = [
        req.body.e_name,
        req.body.e_start_date,
        req.body.e_end_date,
        req.body.e_desc,
        req.body.e_location,
        req.body.e_id
    ];
    console.log(parametres);
    con.query(requete, parametres, function (err, result) {
        if (err) throw err;
        res.redirect("/");
    });
});
app.get("/event/delete/:id", function (req, res) {
    const requete = "DELETE FROM e_events WHERE e_id = ?";
    con.query(requete, [req.params.id], function (err, result) {
        if (err) throw err;
        res.redirect("/");
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
app.post('/register', (req, res) => {
    const { name, prenom, email, num, password } = req.body;
    // Email Checking
const checkEmail = `SELECT * FROM e_compte WHERE E_COURRIEL = ?`;
con.query(checkEmail, [email], (err, rows) => {
    if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }

    // If email already exists, send a response to the client
    if (rows.length > 0) {
        return res.status(400).json({ message: "L'address courriel est déjà inscrit" });
    }

    // Insert
    const sql = `INSERT INTO e_compte (E_NOM, E_PRENOM, E_COURRIEL, E_PASSWORD, E_NUMBER) VALUES (?, ?, ?, ?, ?)`;
    const values = [name, prenom, email, password, num];

    // SQL QUERY
    connection.query(sql, values, (err, result) => {
        if (err) {
            // Handle error
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {

            res.redirect('/success'); 
        }
    });
});
<<<<<<< Updated upstream
});
=======
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

import nodemailer from "nodemailer";

// Notre compte service
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'PeakLabs@gmail.com', 
        pass: 'PeakLabs123' 
    }
});


function generateResetToken() {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return token;
}


app.post('/event/send_reset_email', (req, res) => {
    const email = req.body.email; 

    const token = generateResetToken(); 

    // Link
    const mailOptions = {
        from: 'PeakLabs@gmail.com', 
        to: email, 
        subject: 'Réinitialiser votre mot de passe', 
        html: `<p>S'il vous plait cliquer <a href="http://yourdomain.com/reset_password?token=${token}">ici</a> pour réinitialiser votre mot de passe.</p>` 
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).send("Error sending email");
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send("Email sent successfully");
        }
    });
});
>>>>>>> Stashed changes
