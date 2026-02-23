import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("iftar.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    district TEXT NOT NULL,
    upazila TEXT NOT NULL,
    village TEXT NOT NULL,
    address TEXT NOT NULL,
    date_range TEXT NOT NULL,
    start_time TEXT,
    iftar_time TEXT,
    contact TEXT,
    description TEXT,
    image_url TEXT,
    lat REAL,
    lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/events", (req, res) => {
    const { district, upazila, village, type } = req.query;
    let query = "SELECT * FROM events WHERE 1=1";
    const params: any[] = [];

    if (district) {
      query += " AND district = ?";
      params.push(district);
    }
    if (upazila) {
      query += " AND upazila = ?";
      params.push(upazila);
    }
    if (village) {
      query += " AND village LIKE ?";
      params.push(`%${village}%`);
    }
    if (type) {
      query += " AND type = ?";
      params.push(type);
    }

    query += " ORDER BY created_at DESC";
    
    try {
      const events = db.prepare(query).all(...params);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/events", (req, res) => {
    const { name, type, district, upazila, village, address, date_range, start_time, iftar_time, contact, description, image_url, lat, lng } = req.body;
    
    if (!name || !type || !district || !upazila || !village || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO events (name, type, district, upazila, village, address, date_range, start_time, iftar_time, contact, description, image_url, lat, lng)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(name, type, district, upazila, village, address, date_range, start_time, iftar_time, contact, description, image_url, lat, lng);
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to add event" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
