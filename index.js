

import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import JWT from "jsonwebtoken";
import { storage } from "./cloudinary.js";
import User from "./Schema/Applicant.js";
import StudentInfo from "./Schema/StudentInfo.js";
import { connectDB } from "./db.js";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ CORS config
const allowedOrigins = [
  "https://gispfrontend.vercel.app",  // your deployed frontend
  "http://localhost:5173",            // for local dev
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// File uploads
const upload = multer({ storage });
const jwtKey = process.env.JWT_SECRET || "jwtSecretKey";

// ---------------- Routes ----------------
app.get("/", (req, res) => {
  res.send("Hello from Vercel backend!");
});

app.post("/signup", async (req, res) => {
  try {
    await connectDB();
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;

    JWT.sign({ result }, jwtKey, { expiresIn: "50000s" }, (err, token) => {
      if (err) return res.status(500).json({ message: "Token generation failed" });
      res.json({ message: "User signed up successfully", result, auth: token });
    });
  } catch (error) {
    res.status(500).json({ message: "Error signing up", error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter email and password" });
    }

    let user = await User.findOne({ email, password }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "No User Found" });
    }

    JWT.sign({ user }, jwtKey, { expiresIn: "2m" }, (err, token) => {
      if (err) {
        return res.status(500).json({ error: "Token generation failed" });
      }
      res.status(200).json({ user, auth: token });
    });
  } catch (error) {
    console.error("Login route error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/applicationForm", upload.single("file"), async (req, res) => {
  try {
    await connectDB();

    const student = new StudentInfo({
      ...req.body,
      documentUrl: req.file?.path, // Cloudinary file URL
    });
    const result = await student.save();
    res.status(201).json({ message: "Form submitted successfully", data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to verify token
function verifyToken(req, res, next) {
  let bearerHeader = req.headers["authorization"];
  if (bearerHeader) {
    req.token = bearerHeader.split(" ")[1];
    next();
  } else {
    res.status(403).json({ message: "Token missing" });
  }
}

app.get("/profile", verifyToken, async (req, res) => {
  try {
    await connectDB();

    JWT.verify(req.token, jwtKey, (err, authData) => {
      if (err) res.status(403).json({ result: "Invalid token" });
      else res.json({ authData });
    });
  } catch (error) {
    console.error("Profile route error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/adminPg", async (req, res) => {
  try {
    await connectDB();

    let studentData = await StudentInfo.find();
    res.json({ studentData });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

app.put("/adminPg/:id", async (req, res) => {
  try {
    await connectDB();

    const { id } = req.params;
    const { status } = req.body;
    const updApplication = await StudentInfo.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ message: `Application ${status.toLowerCase()} successfully`, updApplication });
  } catch (error) {
    console.error("AdminPg put route error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- Local Dev ----------------

import serverless from "serverless-http";
export const handler = serverless(app);

