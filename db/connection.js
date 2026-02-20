import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/resumatch";
const client = new MongoClient(uri);

// Database connection / singleton
let dbInstance;

export const connectToDatabase = async () => {
    try {
        await client.connect();
        dbInstance = client.db('resumatch');
        console.log("DB connected");
    } catch (error) {
        console.error("Failed DB connection:", error);
        process.exit(1); 
    }
};

export const getDb = () => {
    if (!dbInstance) {
        throw new Error("Not connected to DB, no instance!");
    }
    return dbInstance;
};

export function getCollections() {
  if (!dbInstance) {
    throw new Error("Database not initialized");
  }

  return {
    about: dbInstance.collection("about"),
    education: dbInstance.collection("education"),
    skills: dbInstance.collection("skills"),
    projects: dbInstance.collection("projects"),
    experiences: dbInstance.collection("experiences"),
  };
}