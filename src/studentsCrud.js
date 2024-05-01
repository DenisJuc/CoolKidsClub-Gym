import { MongoClient } from "mongodb";
export async function connectToMongo(uri) {
    let mongoClient;
 
    try {
        mongoClient = new MongoClient(uri);
        console.log("Connecting to MongoDB Atlas cluster...");
        await mongoClient.connect();
        console.log("Successfully connected to MongoDB Atlas!");
 
        return mongoClient;
    } catch (error) {
        console.error("Connection to MongoDB Atlas failed!", error);
        process.exit();
    }
}
export async function executeGymCrudOperations() {
    const uri = process.env.DB_URI;
    let mongoClient;
 
    try {
        mongoClient = await connectToMongo(uri);
        const db = mongoClient.db('gym');
        const collection1 = db.collection('review');
        const collection2 = db.collection('abonnement')

        //INsert

        //Update

        //Del


    } finally {
        await mongoClient.close();
    }
}
