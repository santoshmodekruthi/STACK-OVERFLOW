import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js"
import questionroute from "./routes/question.js"
import answerroutes from "./routes/answer.js"
import postroutes from "./routes/post.js"
import forgotPasswordroutes from "./routes/forgotPassword.js"
import subscriptionroutes from "./routes/subscription.js"
import rewardroutes from "./routes/reward.js"
import loginHistoryroutes from "./routes/loginHistory.js"
import languageroutes from "./routes/language.js"

const app = express();
dotenv.config();
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.get("/", (req, res) => {
  res.send("Stackoverflow clone is running perfect");
});
app.use('/user',userroutes)
app.use('/question',questionroute)
app.use('/answer',answerroutes)
app.use('/post',postroutes)
app.use('/forgot-password',forgotPasswordroutes)
app.use('/subscription',subscriptionroutes)
app.use('/reward',rewardroutes)
app.use('/login-history',loginHistoryroutes)
app.use('/language',languageroutes)
const PORT = process.env.PORT || 5000;
const databaseurl = process.env.MONGODB_URL;

// Start server first, try to connect to MongoDB
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Try to connect to MongoDB with retries
let connectionAttempts = 0;
const maxRetries = 3;
const retryDelay = 5000; // 5 seconds

const connectDB = () => {
  if (!databaseurl) {
    console.error("⚠️  MONGODB_URL not set in .env file");
    console.error("📝 To use a cloud database, update .env with:");
    console.error("   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname");
    console.error("   Or for local MongoDB: MONGODB_URL=mongodb://localhost:27017/stackoverflow-clone");
    return;
  }

  mongoose
    .connect(databaseurl)
    .then(() => {
      console.log("✅ Connected to MongoDB");
      connectionAttempts = 0;
    })
    .catch((err) => {
      connectionAttempts++;
      console.error(`❌ MongoDB connection error (attempt ${connectionAttempts}/${maxRetries}):`, err.message);
      
      if (connectionAttempts < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
        setTimeout(connectDB, retryDelay);
      } else {
        console.warn("⚠️  Could not connect to MongoDB after retries. API will work but database operations will fail.");
      }
    });
};

connectDB();
