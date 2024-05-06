const ajouter_panier = require('./ajouterArticle');


const con = {
    query: jest.fn((sql, values, callback) => {
        if (sql.includes('SELECT')) {
            callback(null, []);
        } else if (sql.includes('INSERT INTO e_produit')) {
            callback(null, { insertId: 1 });
        } else if (sql.includes('INSERT INTO e_equipements')) {
            callback(null, { insertId: 1 });
        } else if (sql.includes('INSERT INTO e_vetements')) {
            callback(null, { insertId: 1 });
        } else if (sql.includes('UPDATE e_produit')) {
            callback(null, { affectedRows: 1 });
        }
    }),
};

const req = {
    body: {
        productName: 'Test Product',
        price: 10,
        categorie: 'Equipement',
        quantite: 1,
        poids: 5,
        sexe: 'Male',
        color: 'Blue',
        taille: 'L',
    },
    session: {
        user: {
            E_ID: 1,
        },
    },
};

const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
    redirect: jest.fn(),
};


describe('Test ajouter_panier function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should add a new product to the cart when the product is not already in the cart', () => {
        ajouter_panier(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/event/panier');
    });

    it('should update the quantity when the product is already in the cart', () => {
        con.query.mockImplementationOnce((sql, values, callback) => {
            callback(null, [{req}]);
        });
        ajouter_panier(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/event/panier');
    });
});
