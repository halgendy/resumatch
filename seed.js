import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/resumatch"; 

async function seedApplications() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to database...");
        
        const db = client.db("resumatch"); 
        const collection = db.collection("applications");

        const dummyApps = [];
        for (let i = 1; i <= 1000; i++) {
            dummyApps.push({
                jobTitle: `Software Engineer Role ${i}`,
                company: `Tech Company ${i}`,
                jobDescription: `This is a dummy job description for role ${i}. We need someone who knows JavaScript and Python.`,
                constraints: { maxPages: 1, fontSize: 11 },
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        console.log("Inserting 1000 applications...");
        const result = await collection.insertMany(dummyApps);
        
        console.log(`Success! Inserted ${result.insertedCount} documents.`);
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        await client.close();
        console.log("Database connection closed.");
    }
}

seedApplications();