require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL || "postgresql://neondb_owner:npg_PH7bKVozxXy3@ep-lingering-tree-a8geqhq6-pooler.eastus2.azure.neon.tech/neondb?sslmode=require");

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const createTable = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS accidentDetails (
        id SERIAL PRIMARY KEY,
        victimName VARCHAR(255),
        victimAge INT,
        victimContact VARCHAR(10),
        victimLocation VARCHAR(255),
        victimAccidentdetail VARCHAR(500)
      )
    `;
  } catch (error) {
    console.error("Error creating table:", error);
  }
};

const requestHandler = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");  // Allows all origins
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // Allowed methods
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.url === '/') {
      res.writeHead(200);
      res.end("hello world");
    } else if (req.url === '/get_data') {
      await createTable(); // Ensure table is created before handling requests
      const result = await sql`SELECT * FROM accidentDetails`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } else if (req.url === '/add_data' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { victimName, victimAge, victimContact, victimLocation, victimAccidentdetail } = JSON.parse(body);
          await createTable(); // Ensure table is created before handling requests
          await sql`
            INSERT INTO accidentDetails (victimName, victimAge, victimContact, victimLocation, victimAccidentdetail)
            VALUES (${victimName}, ${victimAge}, ${victimContact}, ${victimLocation}, ${victimAccidentdetail})
          `;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Record added successfully' }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to add record' }));
        }
      });
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
};

http.createServer(requestHandler).listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});