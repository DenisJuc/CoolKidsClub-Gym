import { MongoClient } from "mongodb";
export async function connectToMongo(uri) {
    let mongoClient;
 
    try {
        console.log("URI used for MongoDB connection:", uri); // Ajout d un log pour vérifier l'URI utilisé
        mongoClient = new MongoClient(uri);
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

export async function createReview(db, review) {
    const collection = db.collection('reviews');
    await collection.insertOne(review);
}

export async function findReviewByUsername(db, username) {
    const collection = db.collection('reviews');
    return await collection.findOne({ username });
}

export async function updateReviewByUsername(db, username, updatedContent) {
    const collection = db.collection('reviews');
    await collection.updateOne({ username }, { $set: updatedContent });
}

export async function deleteReviewByUsername(db, username) {
    const collection = db.collection('reviews');
    await collection.deleteOne({ username });
}

// opérations CRUD pour abonnement
export async function createSubscription(db, subscription) {
    const collection = db.collection('subscriptions');
    await collection.insertOne(subscription);
}

export async function findSubscriptionsByUserId(db, userId) {
    const collection = db.collection('subscriptions');
    return await collection.find({ userId }).toArray();
}

export async function updateSubscriptionById(db, subscriptionId, updatedContent) {
    const collection = db.collection('subscriptions');
    await collection.updateOne({ _id: ObjectId(subscriptionId) }, { $set: updatedContent });
}

export async function deleteSubscriptionById(db, subscriptionId) {
    const collection = db.collection('subscriptions');
    await collection.deleteOne({ _id: ObjectId(subscriptionId) });
}

export async function executeGymCrudOperations() {
    const uri = process.env.DB_URI;
    if (!uri || uri.startsWith('undefined')) {
        console.error("DB_URI pas defini (BUT HOWWWWW :'((((  ");
        process.exit(1);
    }
    let mongoClient;

    try {
        mongoClient = await connectToMongo(uri);
        const db = mongoClient.db("gym");
        const reviewsCollection = db.collection("reviews");
        const subscriptionsCollection = db.collection("subscriptions");

        // créer un review
        console.log("Creating a review...");
        await createReview(db, {
            userId: "user1",
            username: "user1name",
            comment: "Great experience, trust",
            rating: 5,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // localiser un review a laide du username
        console.log("Finding a review by username...");
        console.log(await findReviewByUsername(db, "user1name"));

        // update le review
        console.log("Updating a review...");
        await updateReviewByUsername(db, "user1name", { comment: "Updated comment", updatedAt: new Date() });

        // delete le review
        console.log("Deleting a review...");
        await deleteReviewByUsername(db, "user1name");

        // créer un abonnement
        console.log("Creating a subscription...");
        await createSubscription(db, {
            userId: "user1",
            subscriptionType: "Standard",
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            status: "Active"
        });

        // trouver abonnement par ID
        console.log("Finding subscriptions by user ID...");
        console.log(await findSubscriptionsByUserId(db, "user1"));

    } finally {
        if (mongoClient) {
            await mongoClient.close();
        }
    }
    
}
// export { createReviewDocument, findReviewByName, updateReviewByName, deleteReviewByName };