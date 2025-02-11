require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { neon } = require("@neondatabase/serverless");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ['websocket']
  }
});

const sql = process.env.DATABASE ? neon(process.env.DATABASE) : null;
if (!sql) {
  console.error("Database URL not configured!");
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const createTable = async () => {
  if (!sql) throw new Error("Database not configured");
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS copilot (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age INT,
        number VARCHAR(50),
        location VARCHAR(255) NOT NULL,
        accidentDetails TEXT,
        acquaintance BOOLEAN,
        vehicle VARCHAR(255),
        injuredPeople INT,
        alertLevel INT,
        services TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("Table created or verified successfully");
  } catch (error) {
    console.error("Error creating table:", error);
    throw error;
  }
};

app.post("/add_case", async (req, res) => {
  const { name, age, number, location, accidentDetails, acquaintance, vehicle, injuredPeople, alertLevel, services } = req.body;

  if (!name || !location) {
      return res.status(400).json({ error: "Missing required fields" });
  }

  try {
      await createTable();
      const result = await sql`
          INSERT INTO copilot (
              name, age, number, location, accidentDetails, 
              acquaintance, vehicle, injuredPeople, alertLevel, services
          )
          VALUES (
              ${name}, ${age}, ${number}, ${location}, ${accidentDetails},
              ${acquaintance}, ${vehicle}, ${injuredPeople}, ${alertLevel}, ${services}
          )
          RETURNING *
      `;

      const newCase = result[0];
      console.log('Emitting new case:', newCase); // Add this for debugging
      io.emit('new_case', newCase);

      res.status(200).json({ message: "Case added successfully", id: newCase.id });
  } catch (error) {
      console.error("Error adding case:", error);
      res.status(500).json({ error: "Failed to add case" });
  }
});

app.get("/get_cases", async (req, res) => {
  try {
    await createTable();
    const result = await sql`
      SELECT * FROM copilot ORDER BY created_at DESC
    `;
    res.status(200).json(result || []);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch hospital cases" });
  }
});

app.get("/get_hospital_cases", async (req, res) => {
  try {
    await createTable();
    const result = await sql`
      SELECT * FROM copilot 
      WHERE services LIKE '%Ambulance%'
      ORDER BY created_at DESC
    `;
    res.status(200).json(result || []);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch hospital cases" });
  }
});

app.get("/get_police_cases", async (req, res) => {
  try {
    await createTable();
    const result = await sql`
      SELECT * FROM copilot 
      WHERE services LIKE '%Police%'
      ORDER BY created_at DESC
    `;
    res.status(200).json(result || []);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch police cases" });
  }
});

app.get("/get_fire_cases", async (req, res) => {
  try {
    await createTable();
    const result = await sql`
      SELECT * FROM copilot 
      WHERE services LIKE '%Fire%'
      ORDER BY created_at DESC
    `;
    res.status(200).json(result || []);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch fire cases" });
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
  });

  socket.on("error", (error) => {
      console.error("Socket error:", error);
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server shutdown complete");
    process.exit(0);
  });
});
