const { pool } = require('../config/db');

const uploadNote = async (req, res) => {
  try {
    const { title, description, subject, semester, department, year } = req.body;
    if (!title || !subject || !req.file) return res.status(400).json({ message: 'Title, subject and file are required' });

    const filePath = `/uploads/notes/${req.file.filename}`;
    const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'doc';

    const [result] = await pool.query(
      'INSERT INTO notes (user_id, title, description, subject, semester, department, year, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, subject, semester || null, department || req.user.department, year || null, filePath, fileType, req.file.size]
    );
    const [note] = await pool.query(
      'SELECT n.*, u.full_name AS uploader_name, u.username AS uploader_username, u.profile_photo AS uploader_photo FROM notes n JOIN users u ON n.user_id = u.id WHERE n.id = ?',
      [result.insertId]
    );
    res.status(201).json(note[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getNotes = async (req, res) => {
  try {
    const { subject, semester, department, q, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (subject) { where += ' AND n.subject LIKE ?'; params.push(`%${subject}%`); }
    if (semester) { where += ' AND n.semester = ?'; params.push(semester); }
    if (department) { where += ' AND n.department = ?'; params.push(department); }
    if (q) { where += ' AND (n.title LIKE ? OR n.subject LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

    const [notes] = await pool.query(
      `SELECT n.*, u.full_name AS uploader_name, u.username AS uploader_username, u.profile_photo AS uploader_photo,
        (SELECT COUNT(*) FROM note_likes WHERE note_id = n.id) AS likes_count,
        (SELECT COUNT(*) FROM note_comments WHERE note_id = n.id) AS comments_count
       FROM notes n JOIN users u ON n.user_id = u.id ${where}
       ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM notes n ${where}`, params);
    res.json({ notes, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getNote = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notes SET downloads = downloads + 1 WHERE id = ?', [id]);
    const [rows] = await pool.query(
      'SELECT n.*, u.full_name AS uploader_name, u.username AS uploader_username, u.profile_photo AS uploader_photo FROM notes n JOIN users u ON n.user_id = u.id WHERE n.id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Note not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const likeNote = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM note_likes WHERE note_id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length) {
      await pool.query('DELETE FROM note_likes WHERE note_id = ? AND user_id = ?', [id, req.user.id]);
      return res.json({ liked: false });
    }
    await pool.query('INSERT INTO note_likes (note_id, user_id) VALUES (?, ?)', [id, req.user.id]);
    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const commentNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Comment required' });
    const [result] = await pool.query('INSERT INTO note_comments (note_id, user_id, content) VALUES (?, ?, ?)', [id, req.user.id, content]);
    const [comment] = await pool.query(
      'SELECT nc.*, u.full_name, u.username, u.profile_photo FROM note_comments nc JOIN users u ON nc.user_id = u.id WHERE nc.id = ?',
      [result.insertId]
    );
    res.status(201).json(comment[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getNoteComments = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT nc.*, u.full_name, u.username, u.profile_photo FROM note_comments nc JOIN users u ON nc.user_id = u.id WHERE nc.note_id = ? ORDER BY nc.created_at ASC',
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT user_id FROM notes WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Note not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    await pool.query('DELETE FROM notes WHERE id = ?', [id]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { uploadNote, getNotes, getNote, likeNote, commentNote, getNoteComments, deleteNote };
