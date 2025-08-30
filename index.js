
//index.js
// import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import JWT from "jsonwebtoken";
import { storage } from "./cloudinary.js";
import User from "./Schema/Applicant.js";
import StudentInfo from "./Schema/StudentInfo.js";
import { connectDB } from "./db.js";
import serverless from "serverless-http";

// dotenv.config();

const app = express();
app.use(express.json());

// ---------------- CORRECTED CORS Config ----------------
const allowedOrigins = [
  "https://gispfrontend.vercel.app", // deployed frontend
  "http://localhost:5173" // local dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ---------------- File uploads ----------------
const upload = multer({ storage });
const jwtKey = process.env.JWT_SECRET || "jwtSecretKey";

// ---------------- Connect to MongoDB ----------------   
 connectDB();
// ---------------- Routes ----------------
app.get("/", (req, res) => {
  res.send("Hello from Vercel backend!");
});

// signup
app.post("/signup", async (req, res) => {
  try {
    
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

// login
app.post("/login", async (req, res) => {
  try {
    
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Please enter email and password" });

    let user = await User.findOne({ email, password }).select("-password");
    if (!user) return res.status(404).json({ error: "No User Found" });

    JWT.sign({ user }, jwtKey, { expiresIn: "2m" }, (err, token) => {
      if (err) return res.status(500).json({ error: "Token generation failed" });
      res.status(200).json({ user, auth: token });
    });
  } catch (error) {
    console.error("Login route error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// applicationForm
app.post("/applicationForm", upload.single("file"), async (req, res) => {
  try {
    
    const student = new StudentInfo({
      ...req.body,
      documentUrl: req.file?.path,
    });
    const result = await student.save();
    res.status(201).json({ message: "Form submitted successfully", data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// token middleware
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
    
    JWT.verify(req.token, jwtKey, (err, authData) => {
      if (err) res.status(403).json({ result: "Invalid token" });
      else res.json({ authData });
    });
  } catch (error) {
    console.error("Profile route error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- ADMIN PAGE (with pagination + lean + selective fields) ----------------
app.get("/adminPg", async (req, res) => {
  try {
    // ✅ Get query params for pagination
    // Default: page=1, limit=10 if not provided
    const { page = 1, limit = 2 } = req.query;

    // ✅ Convert to numbers (query params are strings by default)
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // ✅ Fetch student data with:
    // - .skip() and .limit() for pagination
    // - .select() to only return the fields you need
    // - .lean() to return plain JS objects (faster, lighter than Mongoose docs)
    const studentData = await StudentInfo.find()
      .select("name email status createdAt") // 🔹 adjust fields as needed
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // ✅ Optionally, get total count for frontend pagination
    const totalDocs = await StudentInfo.countDocuments();

    // ✅ Return paginated response
    res.json({
      studentData,
      currentPage: pageNum,
      totalPages: Math.ceil(totalDocs / limitNum),
      totalRecords: totalDocs,
    });
  } catch (error) {
    console.error("AdminPg route error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


app.put("/adminPg/:id", async (req, res) => {
  try {
    
    const { id } = req.params;
    const { status } = req.body;
    const updApplication = await StudentInfo.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ message: `Application ${status.toLowerCase()} successfully`, updApplication });
  } catch (error) {
    console.error("AdminPg put route error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- LOCAL DEV vs VERCEL ----------------
// We use app.listen() for local development.
// Vercel handles the server for you, so it's not needed there.
if (process.env.NODE_ENV !== "production") {
  app.listen(5000, () => console.log("Local API running on http://localhost:5000"));
}

// ---------------- VERCEL EXPORT FIX ----------------
// The critical fix: Export the Express app instance wrapped with serverless-http.
// This single export is what Vercel is looking for.
export default serverless(app);
