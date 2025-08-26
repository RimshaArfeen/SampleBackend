import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import JWT from "jsonwebtoken";
import { storage } from "./cloudinary.js";
import User from "./Schema/Applicant.js";
import StudentInfo from "./Schema/StudentInfo.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
const PORT = 8000;
// ✅ MongoDB connection (optimized for serverless)
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 40000,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));
}

const upload = multer({ storage });
const jwtKey = process.env.JWT_SECRET || "jwtSecretKey";

// Routes
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

    JWT.sign({ result }, jwtKey, { expiresIn: "5000s" }, (err, token) => {
      if (err) return res.status(500).json({ message: "Token generation failed" });
      res.json({ message: "User signed up successfully", result, auth: token });
    });
  } catch (error) {
    res.status(500).json({ message: "Error signing up", error: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ error: "Please enter email and password" });

  let user = await User.findOne({ email, password }).select("-password");
  if (!user) return res.json({ error: "No User Found" });

  JWT.sign({ user }, jwtKey, { expiresIn: "2m" }, (err, token) => {
    if (err) res.json({ error: "Token generation failed" });
    else res.json({ user, auth: token });
  });
});

app.post("/applicationForm", upload.single("file"), async (req, res) => {
  try {
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

app.get("/profile", verifyToken, (req, res) => {
  JWT.verify(req.token, jwtKey, (err, authData) => {
    if (err) res.status(403).json({ result: "Invalid token" });
    else res.json({ authData });
  });
});

app.get("/adminPg", async (req, res) => {
  try {
    let studentData = await StudentInfo.find();
    res.json({ studentData });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

app.put("/adminPg/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updApplication = await StudentInfo.findByIdAndUpdate(id, { status }, { new: true });
  res.json({ message: `Application ${status.toLowerCase()} successfully`, updApplication });
});


app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
})

//api/index.js
