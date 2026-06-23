const { pool } = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.username, u.email, u.usn, u.department, u.section, u.year,
              u.bio, u.profile_photo, u.cover_photo, u.skills, u.interests, u.social_links,
              u.role, u.status, u.created_at, u.last_active,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
              (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_anonymous = 0) AS posts_count,
              (SELECT COUNT(*) FROM notes WHERE user_id = u.id) AS notes_count
       FROM users u WHERE u.username = ?`,
      [username]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const user = rows[0];
    if (req.user) {
      const [follow] = await pool.query('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, user.id]);
      user.is_following = follow.length > 0;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, bio, department, section, year, skills, interests, social_links } = req.body;
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (bio !== undefined) updates.bio = bio;
    if (department) updates.department = department;
    if (section !== undefined) updates.section = section;
    if (year) updates.year = year;
    if (skills !== undefined) updates.skills = skills;
    if (interests !== undefined) updates.interests = interests;
    if (social_links !== undefined) updates.social_links = social_links;
    if (req.files?.profile_photo?.[0]) updates.profile_photo = `/uploads/profiles/${req.files.profile_photo[0].filename}`;
    if (req.files?.cover_photo?.[0]) updates.cover_photo = `/uploads/covers/${req.files.cover_photo[0].filename}`;

    if (!Object.keys(updates).length) return res.status(400).json({ message: 'No fields to update' });

    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), req.user.id];
    await pool.query(`UPDATE users SET ${fields} WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT id, full_name, username, email, bio, department, section, year, profile_photo, cover_photo, skills, interests, social_links FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { current_password, new_password } = req.body;
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) return res.status(400).json({ message: 'Cannot follow yourself' });

    const [existing] = await pool.query('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, id]);
    if (existing.length) {
      await pool.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, id]);
      return res.json({ following: false });
    }
    await pool.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, id]);

    await pool.query(
      'INSERT INTO notifications (user_id, from_user_id, type, message) VALUES (?, ?, ?, ?)',
      [id, req.user.id, 'follow', `${req.user.username} started following you`]
    );
    res.json({ following: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.username, u.profile_photo, u.department
       FROM follows f JOIN users u ON f.follower_id = u.id WHERE f.following_id = ?`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.username, u.profile_photo, u.department
       FROM follows f JOIN users u ON f.following_id = u.id WHERE f.follower_id = ?`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const [rows] = await pool.query(
      `SELECT id, full_name, username, profile_photo, department, year FROM users
       WHERE status = 'approved' AND (full_name LIKE ? OR username LIKE ? OR usn LIKE ?) LIMIT 20`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile, changePassword, followUser, getFollowers, getFollowing, searchUsers, deleteAccount };
