const express = require('express');
const cors = require('cors');
const Redis = require("ioredis");
const { getPool } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Redis client
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379
});

// --- FORCE ES REFRESH SO THAT SEARCHES SEE IMMEDIATE CHANGES ---
const ES_REFRESH = "?refresh=wait_for";

// helper: delete all ES docs whose field `id` equals the given id
async function esDeleteByMySqlId(id) {
  try {
    await fetch(`http://127.0.0.1:9200/documents/_delete_by_query${ES_REFRESH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          term: { id: id }
        }
      })
    });
  } catch (err) {
    console.error("❌ esDeleteByMySqlId error:", err);
  }
}

// helper: index a doc with ES _id = mysql id (PUT)
async function esIndexDoc(doc) {
  try {
    await fetch(`http://127.0.0.1:9200/documents/_doc/${doc.id}${ES_REFRESH}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
  } catch (err) {
    console.error("❌ esIndexDoc error:", err);
  }
}

// helper: delete ES doc by id (_id)
async function esDeleteById(id) {
  try {
    await fetch(`http://127.0.0.1:9200/documents/_doc/${id}${ES_REFRESH}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error("❌ esDeleteById error:", err);
  }
}

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Ensure table exists
(async () => {
  const pool = await getPool();
  await pool.query(`CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
})();

// Get all documents
app.get('/documents', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error("GET /documents error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// Create document
app.post('/documents', async (req, res) => {
  const { title, content } = req.body;
  try {
    const pool = await getPool();
    const [result] = await pool.query(
      'INSERT INTO documents (title, content) VALUES (?, ?)',
      [title, content]
    );

    const [rows] = await pool.query('SELECT * FROM documents WHERE id=?', [result.insertId]);
    const doc = rows[0];

    if (!doc) return res.status(500).json({ error: "Failed to create document" });

    // Remove any stray ES docs that reference this mysql id (safety)
    await esDeleteByMySqlId(doc.id);

    // Index fresh doc with ES _id = mysql id
    await esIndexDoc(doc);

    // Clear redis cache
    await redis.flushall();

    res.json(doc);
  } catch (err) {
    console.error("POST /documents error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// Update document
app.put('/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const pool = await getPool();
    await pool.query(
      'UPDATE documents SET title=?, content=? WHERE id=?',
      [title, content, id]
    );

    const [rows] = await pool.query('SELECT * FROM documents WHERE id=?', [id]);
    const doc = rows[0];

    if (!doc) return res.status(404).json({ error: "Document not found" });

    // Remove any existing ES docs referencing this id
    await esDeleteByMySqlId(doc.id);

    // Re-index updated doc
    await esIndexDoc(doc);

    // Clear redis cache
    await redis.flushall();

    res.json(doc);
  } catch (err) {
    console.error("PUT /documents/:id error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// Delete document
app.delete('/documents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    await pool.query('DELETE FROM documents WHERE id=?', [id]);

    await esDeleteById(id);
    await esDeleteByMySqlId(id);
    await redis.flushall();

    res.json({ id });
  } catch (err) {
    console.error("DELETE /documents/:id error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`API running on ${PORT}`)
);
