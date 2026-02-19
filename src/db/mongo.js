import { MongoClient } from "mongodb";

let client;
let db;

export async function connectToMongo(uri, dbName) {
  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  console.log("Connected to MongoDB");
  return db;
}

export function getCollections() {
  if (!db) {
    throw new Error("Database not initialized");
  }

  return {
    about: db.collection("about"),
    education: db.collection("education"),
    skills: db.collection("skills"),
    projects: db.collection("projects"),
    experiences: db.collection("experiences"),
  };
}
