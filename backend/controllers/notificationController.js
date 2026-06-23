const { pool } = require('../config/db');

const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, u.full_name AS from_name, u.username AS from_username, u.profile_photo AS from_photo
       FROM notifications n LEFT JOIN users u ON n.from_user_id = u.id
       WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications, markRead, getUnreadCount };
