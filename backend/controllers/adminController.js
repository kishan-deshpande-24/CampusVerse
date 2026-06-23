const { pool } = require('../config/db');
const { sendApprovalEmail, sendRejectionEmail } = require('../config/email');

const getDashboard = async (req, res) => {
  try {
    const [[users]] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE role != "admin"');
    const [[pending]] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE status = "pending"');
    const [[approved]] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE status = "approved"');
    const [[posts]] = await pool.query('SELECT COUNT(*) AS total FROM posts');
    const [[notes]] = await pool.query('SELECT COUNT(*) AS total FROM notes');
    const [[events]] = await pool.query('SELECT COUNT(*) AS total FROM events');
    const [[reports]] = await pool.query('SELECT COUNT(*) AS total FROM reports WHERE status = "pending"');
    const [[marketplace]] = await pool.query('SELECT COUNT(*) AS total FROM marketplace_items');

    const [recentUsers] = await pool.query(
      'SELECT id, full_name, username, email, department, status, created_at FROM users WHERE role != "admin" ORDER BY created_at DESC LIMIT 5'
    );
    const [recentPosts] = await pool.query(
      `SELECT p.id, p.content, p.type, p.created_at, u.username FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 5`
    );

    res.json({
      stats: { users: users.total, pending: pending.total, approved: approved.total, posts: posts.total, notes: notes.total, events: events.total, reports: reports.total, marketplace: marketplace.total },
      recentUsers,
      recentPosts
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, username, email, usn, department, section, year, id_card_image, email_verified, created_at FROM users WHERE status = "pending" ORDER BY created_at ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT full_name, email, status FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    if (rows[0].status !== 'pending') return res.status(400).json({ message: 'User is not pending' });

    await pool.query('UPDATE users SET status = "approved" WHERE id = ?', [id]);
    await sendApprovalEmail(rows[0].email, rows[0].full_name);
    res.json({ message: 'User approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const [rows] = await pool.query('SELECT full_name, email FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    await pool.query('UPDATE users SET status = "rejected" WHERE id = ?', [id]);
    await sendRejectionEmail(rows[0].email, rows[0].full_name, reason);
    res.json({ message: 'User rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE users SET status = "banned" WHERE id = ?', [id]);
    res.json({ message: 'User banned' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { status, q } = req.query;
    let where = 'WHERE role != "admin"';
    const params = [];
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (q) { where += ' AND (full_name LIKE ? OR username LIKE ? OR email LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

    const [rows] = await pool.query(
      `SELECT id, full_name, username, email, usn, department, status, role, created_at, last_active FROM users ${where} ORDER BY created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getReports = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name AS reporter_name, u.username AS reporter_username FROM reports r JOIN users u ON r.reporter_id = u.id WHERE r.status = 'pending' ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE reports SET status = "resolved" WHERE id = ?', [id]);
    res.json({ message: 'Report resolved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const adminDeletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ message: 'Post deleted by admin' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboard, getPendingUsers, approveUser, rejectUser, banUser, getAllUsers, getReports, resolveReport, adminDeletePost };
