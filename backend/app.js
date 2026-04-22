// app.js — sets up express, middleware, and all routes
import express from "express";
import cors    from "cors";
import multer  from "multer";

import "./config/db.js";          // connects MongoDB on import
import "./config/pinecone.js";    // connects Pinecone on import

import authRoutes      from "./routes/auth.js";
import translateRoutes from "./routes/translate.js";
import chatRoutes      from "./routes/chat.js";
import historyRoutes   from "./routes/history.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api",       authRoutes);      // /api/signup, /api/login
app.use("/",          translateRoutes); // /translate
app.use("/",          chatRoutes);      // /chat
app.use("/history",   historyRoutes);   // /history/*

export default app;