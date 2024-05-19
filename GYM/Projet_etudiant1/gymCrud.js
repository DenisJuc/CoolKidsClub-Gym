import { MongoClient } from "mongodb";

let mongoClient;
let db;

export async function connectToMongo(uri) {
    if (!mongoClient) {
        console.log("Creating new MongoClient instance...");
        mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    if (!mongoClient.topology || !mongoClient.topology.isConnected()) {
        try {
            console.log("Connecting to MongoDB Atlas cluster...");
            await mongoClient.connect();
            console.log("Successfully connected to MongoDB Atlas!");
            db = mongoClient.db("gym");
        } catch (error) {
            console.error("Connection to MongoDB Atlas failed!", error);
            process.exit(1);
        }
    }
    return db;
}

export async function getMongoDb() {
    if (!db) {
        const uri = process.env.DB_URI;
        if (!uri || uri.startsWith('undefined')) {
            console.error("DB_URI not defined");
            process.exit(1);
        }
        db = await connectToMongo(uri);
    }
    return db;
}

export { mongoClient };



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

// CRUD operations for subscriptions
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
    await collection.updateOne({ _id: new ObjectId(subscriptionId) }, { $set: updatedContent });
}

export async function deleteSubscriptionById(db, subscriptionId) {
    const collection = db.collection('subscriptions');
    await collection.deleteOne({ _id: new ObjectId(subscriptionId) });
}

export async function executeGymCrudOperations() {
    const uri = process.env.DB_URI;
    if (!uri || uri.startsWith('undefined')) {
        console.error("DB_URI not defined");
        process.exit(1);
    }

    try {
        const db = await connectToMongo(uri);

        // Create a review
        console.log("Creating a review...");
        await createReview(db, {
            userId: "user1",
            username: "user1name",
            comment: "Great experience, trust",
            rating: 5,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Find a review by username
        console.log("Finding a review by username...");
        console.log(await findReviewByUsername(db, "user1name"));

        // Update the review
        console.log("Updating a review...");
        await updateReviewByUsername(db, "user1name", { comment: "Updated comment", updatedAt: new Date() });

        // Delete the review
        console.log("Deleting a review...");
        await deleteReviewByUsername(db, "user1name");

        // Create a subscription
        console.log("Creating a subscription...");
        await createSubscription(db, {
            userId: "user1",
            subscriptionType: "Standard",
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            status: "Active"
        });

        // Find subscriptions by user ID
        console.log("Finding subscriptions by user ID...");
        console.log(await findSubscriptionsByUserId(db, "user1"));

    } finally {
        if (mongoClient) {
            await mongoClient.close();
        }
    }
}
