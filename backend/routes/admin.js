import express from 'express';
import fs from 'fs';
import path from 'path';
import Translation from '../models/Translation.js';

const router = express.Router();

// 1. Get all data for the table
router.get("/all-data", async (req, res) => {
    try {
        const translations = await Translation.find().sort({ createdAt: -1 });
        res.json({ success: true, translations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Sync JSON - Allows ALL data from ALL files
router.post("/sync-json", async (req, res) => {
    try {
        const dataPath = path.join(process.cwd(), 'data');
        const files = fs.readdirSync(dataPath);
        const allData = []; 

        files.forEach(file => {
            if (!file.endsWith('.json')) return;
            try {
                const content = JSON.parse(fs.readFileSync(path.join(dataPath, file), 'utf-8'));
                const items = Array.isArray(content) ? content : [content];

                items.forEach(item => {
                    const eng = (item.english || item.English || item.text || item.question || "").trim();
                    const bhu = (
                        item.transliteration_bhutia || 
                        item.transliteration || 
                        item.bhutia || 
                        item.Bhutia || 
                        item.formal || 
                        item.informal || 
                        item.question ||
                        item.answer ||
                        item.heading ||
                        item.content ||
                             ""
                    ).trim();

                    if (eng && bhu) {
                        allData.push({ 
                            english: eng, 
                            transliteration: bhu, 
                            language: "Bhutia"
                        });
                    }
                });
            } catch (e) { console.error(`Error in ${file}`); }
        });

        if (allData.length > 0) {
            await Translation.deleteMany({}); 
            // ordered: false skips items that cause errors instead of stopping
            await Translation.insertMany(allData, { ordered: false }); 
            return res.json({ success: true, message: `Synced ${allData.length} items successfully!` });
        }
        res.json({ success: false, message: "No translations found." });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// 3. Toggle Status (Checkbox)
router.post("/toggle-status/:id", async (req, res) => {
    try {
        const item = await Translation.findById(req.params.id);
        if (item) {
            item.isChecked = !item.isChecked;
            await item.save();
            return res.json({ success: true, isChecked: item.isChecked });
        }
        res.status(404).json({ success: false });
    } catch (err) { res.status(500).json({ success: false }); }
});

export default router;