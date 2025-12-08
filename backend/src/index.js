import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoutes from "./routes/upload.js";
import { initializeDatabase } from "./db/init.js"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(console.error);

app.use('/api', uploadRoutes);

app.get('/health', (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
});
