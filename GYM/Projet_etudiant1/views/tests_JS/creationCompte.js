function createAccount(req, res) {
    const { nom, prénom, email, num, password } = req.body;

    const checkEmailQuery = "SELECT * FROM e_compte WHERE E_COURRIEL = ?";
    con.query(checkEmailQuery, [email], (checkErr, checkResult) => {
        if (checkErr) {
            return res.status(500).send("Erreur");
        }

        if (checkResult.length > 0) {
            return res.status(400).json({ message: "L'adresse courriel est déjà inscrite." });
        }

        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                return res.status(500).send("Erreur lors du hachage du mot de passe.");
            }

            const insertQuery = `INSERT INTO e_compte (E_NOM, E_LOCATION, E_PRENOM, E_COURRIEL, E_PASSWORD, E_NUMBER) VALUES (?, ?, ?, ?, ?, ?)`;
            const values = [nom, " ", prénom, email, hashedPassword, num];

            con.query(insertQuery, values, (insertErr, insertResult) => {
                if (insertErr) {
                    return res.status(500).send("Erreur lors de l'insertion des données.");
                }
                res.redirect('/event/connect');
            });
        });
    });
}

module.exports = createAccount;
