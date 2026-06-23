const { pool } = require('../config/db');

const addReview = async (req, res) => {
  try {
    const { faculty_name, subject, department, rating, teaching_rating, content } = req.body;
    if (!faculty_name || !rating) return res.status(400).json({ message: 'Faculty name and rating required' });

    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE user_id = ? AND faculty_name = ? AND subject = ?',
      [req.user.id, faculty_name, subject]
    );
    if (existing.length) return res.status(400).json({ message: 'You already reviewed this faculty for this subject' });

    const [result] = await pool.query(
      'INSERT INTO reviews (user_id, faculty_name, subject, department, rating, teaching_rating, content) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, faculty_name, subject || null, department || req.user.department, rating, teaching_rating || null, content || null]
    );
    const [review] = await pool.query('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
    res.status(201).json(review[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getReviews = async (req, res) => {
  try {
    const { faculty_name, department, q } = req.query;
    let where = 'WHERE r.status = "active"';
    const params = [];
    if (faculty_name) { where += ' AND r.faculty_name LIKE ?'; params.push(`%${faculty_name}%`); }
    if (department) { where += ' AND r.department = ?'; params.push(department); }
    if (q) { where += ' AND (r.faculty_name LIKE ? OR r.subject LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

    const [reviews] = await pool.query(
      `SELECT r.id, r.faculty_name, r.subject, r.department, r.rating, r.teaching_rating, r.content, r.created_at,
        'Anonymous' AS reviewer_name
       FROM reviews r ${where} ORDER BY r.created_at DESC`,
      params
    );

    const [stats] = await pool.query(
      `SELECT faculty_name, department, AVG(rating) AS avg_rating, AVG(teaching_rating) AS avg_teaching, COUNT(*) AS review_count
       FROM reviews WHERE status = 'active' GROUP BY faculty_name, department`,
    );
    res.json({ reviews, stats });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT user_id FROM reviews WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Review not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addReview, getReviews, deleteReview };
