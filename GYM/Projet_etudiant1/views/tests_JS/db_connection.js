const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "scott",
    password: "oracle",
    database: "mybd"
});

con.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

module.exports = { query };