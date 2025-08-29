// db.js
import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    isConnected = conn.connections[0].readyState;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
    throw err;
  }
};

