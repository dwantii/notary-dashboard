const express = require('express');
const cors = require('cors');
const { getPool } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

(async () => {
  const pool = await getPool();
  await pool.query(`CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
})();

app.get('/documents', async (req, res) => {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
  res.json(rows);
});

app.post('/documents', async (req, res) => {
  const { title, content } = req.body;
  const pool = await getPool();
  const [result] = await pool.query('INSERT INTO documents (title, content) VALUES (?, ?)', [title, content]);
  res.json({ id: result.insertId, title, content });
});

app.put('/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const pool = await getPool();
  await pool.query('UPDATE documents SET title=?, content=? WHERE id=?', [title, content, id]);
  res.json({ id, title, content });
});

app.delete('/documents/:id', async (req, res) => {
  const { id } = req.params;
  const pool = await getPool();
  await pool.query('DELETE FROM documents WHERE id=?', [id]);
  res.json({ id });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on ${PORT}`));
