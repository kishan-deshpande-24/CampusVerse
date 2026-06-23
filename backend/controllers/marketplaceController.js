const { pool } = require('../config/db');

const createListing = async (req, res) => {
  try {
    const { title, description, price, category, condition } = req.body;
    if (!title || !price) return res.status(400).json({ message: 'Title and price required' });

    const images = req.files ? req.files.map(f => `/uploads/marketplace/${f.filename}`).join(',') : null;
    const [result] = await pool.query(
      'INSERT INTO marketplace_items (seller_id, title, description, price, category, item_condition, images) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, price, category || 'other', condition || 'good', images]
    );
    const [item] = await pool.query('SELECT * FROM marketplace_items WHERE id = ?', [result.insertId]);
    res.status(201).json(item[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getListings = async (req, res) => {
  try {
    const { category, q, min_price, max_price, condition } = req.query;
    let where = 'WHERE m.status = "available"';
    const params = [];
    if (category) { where += ' AND m.category = ?'; params.push(category); }
    if (q) { where += ' AND (m.title LIKE ? OR m.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    if (min_price) { where += ' AND m.price >= ?'; params.push(min_price); }
    if (max_price) { where += ' AND m.price <= ?'; params.push(max_price); }
    if (condition) { where += ' AND m.item_condition = ?'; params.push(condition); }

    const [items] = await pool.query(
      `SELECT m.*, u.full_name AS seller_name, u.username AS seller_username, u.profile_photo AS seller_photo
       FROM marketplace_items m JOIN users u ON m.seller_id = u.id ${where} ORDER BY m.created_at DESC`,
      params
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getListing = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT m.*, u.full_name AS seller_name, u.username AS seller_username, u.profile_photo AS seller_photo, u.department AS seller_department FROM marketplace_items m JOIN users u ON m.seller_id = u.id WHERE m.id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Item not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markSold = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT seller_id FROM marketplace_items WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Item not found' });
    if (rows[0].seller_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await pool.query('UPDATE marketplace_items SET status = "sold" WHERE id = ?', [id]);
    res.json({ message: 'Item marked as sold' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT seller_id FROM marketplace_items WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Item not found' });
    if (rows[0].seller_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    await pool.query('DELETE FROM marketplace_items WHERE id = ?', [id]);
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createListing, getListings, getListing, markSold, deleteListing };
