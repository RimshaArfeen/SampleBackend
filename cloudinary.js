
// cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { CloudinaryStorage } from "multer-storage-cloudinary";
dotenv.config({ path: path.resolve("./.env") });

// Vercel injects environment variables automatically, so no need for dotenv.config() here.
const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary using injected environment variables
cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});  

// These console logs are great for debugging but you can remove them for production
console.log("Cloud Name:", cloud_name);
console.log("API Key:", api_key);
console.log("API Secret:", api_secret ? "Loaded ✅" : "❌ Missing");

// Configure Multer storage using Cloudinary
export const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uploads", // folder in cloudinary
    allowed_formats: ["jpg", "png", "pdf"], // restrict file types if needed
  },
});
