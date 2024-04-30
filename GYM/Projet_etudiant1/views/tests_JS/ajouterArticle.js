// ajouterArticle.js

function ajouter_panier(req, res) {
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
}

module.exports = ajouter_panier;
