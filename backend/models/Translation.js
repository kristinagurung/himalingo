import mongoose from "mongoose";

const TranslationSchema = new mongoose.Schema({
  english: { type: String, required: true },
  transliteration: { type: String },
  language: { type: String, default: "Bhutia" },
  isChecked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Avoids model overwrite errors in development
const Translation = mongoose.models.Translation || mongoose.model("Translation", TranslationSchema);

export default Translation;