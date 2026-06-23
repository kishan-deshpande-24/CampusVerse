const { pool } = require('../config/db');

const reportLost = async (req, res) => {
  try {
    const { title, description, location, contact, type } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });
    const image = req.file ? `/uploads/lost_found/${req.file.filename}` : null;
    const [result] = await pool.query(
      'INSERT INTO lost_found (user_id, title, description, location, contact, type, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, location || null, contact || null, type || 'lost', image]
    );
    const [item] = await pool.query('SELECT lf.*, u.full_name, u.username, u.profile_photo FROM lost_found lf JOIN users u ON lf.user_id = u.id WHERE lf.id = ?', [result.insertId]);
    res.status(201).json(item[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getLostFound = async (req, res) => {
  try {
    const { type, q } = req.query;
    let where = 'WHERE lf.status = "active"';
    const params = [];
    if (type) { where += ' AND lf.type = ?'; params.push(type); }
    if (q) { where += ' AND (lf.title LIKE ? OR lf.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

    const [items] = await pool.query(
      `SELECT lf.*, u.full_name, u.username, u.profile_photo FROM lost_found lf JOIN users u ON lf.user_id = u.id ${where} ORDER BY lf.created_at DESC`,
      params
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markFound = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT user_id FROM lost_found WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Item not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await pool.query('UPDATE lost_found SET status = "resolved" WHERE id = ?', [id]);
    res.json({ message: 'Item marked as found/resolved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { reportLost, getLostFound, markFound };
