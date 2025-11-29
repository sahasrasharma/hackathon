/* eslint-env node */
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// MongoDB URI
const uri =
  "mongodb+srv://charanyareddy646_db_user:QgZGfnuvKeQfwQx6@cluster0.uaswuul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);
let db;

// Start server only after DB connects
async function startServer() {
  try {
    await client.connect();
    db = client.db("loan"); // Database name
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

startServer();


// -------------------- TEST INSERT --------------------
app.get("/test-insert", async (req, res) => {
  try {
    const result = await db.collection("users").insertOne({
      name: "Test User",
      email: "test@example.com",
      password: "123456",
      role: "user",
      time: new Date()
    });
    res.status(200).json({
      message: "Test document inserted",
      insertedId: result.insertedId
    });
  } catch (err) {
    res.status(500).json({ error: "Test insert failed", details: err.message });
  }
});


// -------------------- SIGNUP --------------------
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const usersCollection = db.collection("users");
    const result = await usersCollection.insertOne({ name, email, password, role });
    res.status(201).json({
      message: "User created successfully",
      userId: result.insertedId
    });
  } catch (err) {
    res.status(500).json({ error: "Signup failed", details: err.message });
  }
});


// -------------------- SIGNIN --------------------
app.post("/api/auth/signin", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ email, password, role });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user
    });
  } catch (err) {
    res.status(500).json({ error: "Signin failed", details: err.message });
  }
});
