const bcrypt = require('bcrypt');

const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "scott",
    password: "oracle",
    database: "mybd"
});

const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    redirect: jest.fn()
};

const connection = (req, res) => {
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

        // Compare the provided password with the hashed password from the database
        bcrypt.compare(password, user.E_PASSWORD, (compareErr, isMatch) => {
            if (compareErr) {
                console.error("Error comparing passwords:", compareErr);
                return res.status(500).send("Internal Server Error");
            }

            if (isMatch) {
                // Passwords match, user is authenticated
                req.session.user = {
                    E_COURRIEL: email,
                    E_PASSWORD: user.E_PASSWORD
                };
                if (user.E_COURRIEL === "peaklabs1@gmail.com") {
                    req.session.user.isAdmin = true;
                }
                res.redirect('/event/detail');
            } else {
                // Passwords do not match
                res.status(401).send("Incorrect password");
            }
        });
    });
};

module.exports = connection;
