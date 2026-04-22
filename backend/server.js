// server.js — entry point, only starts the server
import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Himalingo server running on port ${PORT}`);
});