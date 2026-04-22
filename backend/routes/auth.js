// routes/auth.js — handles /api/signup and /api/login
import express from "express";
import User    from "../models/User.js";

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

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    res.json({ success: true, token: "login-token" });
  } catch { res.status(500).json({ success: false }); }
});

export default router;