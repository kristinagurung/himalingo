# Himalingo MVC Reorganization TODO

## Status: 📋 Planned (0/8)

### 1. [ ] Git Backup
`git add . && git commit -m "pre-reorg backup"`

### 2. [ ] Create data/ & Move Root Data Files
```
mkdir data
mkdir -p data/separated/{conversations,grammar,numbers}
mv bhutia_* clean_* food_* *.sql separated/ data/
```

### 3. [ ] Backend: Create MVC Folders & Move
```
cd backend
mkdir -p controllers utils data config
mv server.js main.py controllers/
mv pinecone_utils.py search_pinecone.py upload_all.py reindex_database.js utils/
mv knowledge_base/dictionary.json data/
mv requirements.txt package*.json config/
```

### 4. [ ] Frontend: Standardize
```
cd ../frontend
mkdir -p config components
mv pages/components/* ../components/
rmdir pages/components
mv package*.json next.config.js jsconfig.json config/
```

### 5. [ ] Verify Structure
`tree -L 3` or `find . -type f | head -20`

### 6. [ ] Fix Broken Imports (after test)
Edit files (e.g. pages/index.jsx components → ../components/)

### 7. [ ] Test
```
cd frontend && npm i && npm run dev  # NEW terminal
cd ../backend/controllers && node server.js
```

### 8. [ ] Git Commit & Update Docs
`git add . && git commit -m "MVC reorg complete" && echo "New structure..." >> README.md`

**Track: Update ✅ as done.**
