import mongoose from "mongoose";

const HistorySchema = new mongoose.Schema({
  chatId:         { type: String, unique: true, required: true },
  userEmail:      { type: String, required: true },
  originalText:   String,
  translatedText: String,
  mode:           String,
  pinned:         { type: Boolean, default: false },
  updatedAt:      { type: Date, default: Date.now },
});

export default mongoose.models.History || mongoose.model("History", HistorySchema);