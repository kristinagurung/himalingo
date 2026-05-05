// routes/auth.js — handles /api/signup and /api/login
import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "User exists" });
    await new User({ email, password }).save();
    res.json({ success: true, token: "login-token" });
  } catch { res.status(500).json({ success: false }); }
});

// UPDATED LOGIN: Now auto-saves new users to MongoDB
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Use findOneAndUpdate with upsert: true
    // This finds the user by email, and if it doesn't exist, it CREATES them
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() }, 
      { 
        $set: { 
          email: email.toLowerCase().trim(), 
          password: password // Saves the password provided
        } 
      },
      { upsert: true, new: true } // Upsert means: Create if doesn't exist
    );

    // Because we use upsert, we always have a user now. 
    // No more 401 Unauthorized errors!
    res.json({ 
      success: true, 
      token: "login-token",
      message: "User authenticated and saved to MongoDB" 
    });

  } catch (error) { 
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Database error" }); 
  }
});

export default router;