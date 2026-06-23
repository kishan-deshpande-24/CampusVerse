const { pool } = require('../config/db');

const createPost = async (req, res) => {
  try {
    const { content, type, is_anonymous, hashtags } = req.body;
    if (!content && !req.file) return res.status(400).json({ message: 'Post content or image required' });

    const image = req.file ? `/uploads/posts/${req.file.filename}` : null;
    const anon = is_anonymous === 'true' || is_anonymous === true ? 1 : 0;
    const postType = type || 'text';

    const [result] = await pool.query(
      'INSERT INTO posts (user_id, content, image, type, is_anonymous) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, content || null, image, postType, anon]
    );
    const postId = result.insertId;

    if (hashtags) {
      const tags = JSON.parse(hashtags);
      for (const tag of tags) {
        const [ht] = await pool.query('INSERT INTO hashtags (tag) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)', [tag.toLowerCase()]);
        await pool.query('INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)', [postId, ht.insertId]);
      }
    }

    const [post] = await pool.query(
      `SELECT p.*, 
        IF(p.is_anonymous = 0, u.full_name, 'Anonymous') AS author_name,
        IF(p.is_anonymous = 0, u.username, NULL) AS author_username,
        IF(p.is_anonymous = 0, u.profile_photo, NULL) AS author_photo,
        0 AS likes_count, 0 AS comments_count, 0 AS is_liked
       FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
      [postId]
    );
    res.status(201).json(post[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const type = req.query.type || null;
    const userId = req.user?.id || null;

    let whereClause = 'WHERE p.status = "active"';
    const params = [];
    if (type && type !== 'all') { whereClause += ' AND p.type = ?'; params.push(type); }

    const [posts] = await pool.query(
      `SELECT p.*, 
        IF(p.is_anonymous = 0, u.full_name, 'Anonymous') AS author_name,
        IF(p.is_anonymous = 0, u.username, NULL) AS author_username,
        IF(p.is_anonymous = 0, u.profile_photo, NULL) AS author_photo,
        IF(p.is_anonymous = 0, u.department, NULL) AS author_department,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        ${userId ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ${pool.escape(userId)}) AS is_liked,` : '0 AS is_liked,'}
        ${userId ? `(SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ${pool.escape(userId)}) AS is_bookmarked` : '0 AS is_bookmarked'}
       FROM posts p JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM posts p ${whereClause}`, params);
    res.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const [rows] = await pool.query(
      `SELECT p.*, 
        IF(p.is_anonymous = 0, u.full_name, 'Anonymous') AS author_name,
        IF(p.is_anonymous = 0, u.username, NULL) AS author_username,
        IF(p.is_anonymous = 0, u.profile_photo, NULL) AS author_photo,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        ${userId ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ${pool.escape(userId)}) AS is_liked` : '0 AS is_liked'}
       FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Post not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const [rows] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Post not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    await pool.query('UPDATE posts SET content = ?, updated_at = NOW() WHERE id = ?', [content, id]);
    res.json({ message: 'Post updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Post not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length) {
      await pool.query('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [id, req.user.id]);
      return res.json({ liked: false });
    }
    await pool.query('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [id, req.user.id]);

    const [post] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [id]);
    if (post.length && post[0].user_id !== req.user.id) {
      await pool.query(
        'INSERT INTO notifications (user_id, from_user_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
        [post[0].user_id, req.user.id, 'like', id, `${req.user.username} liked your post`]
      );
    }
    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT c.*, u.full_name, u.username, u.profile_photo
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? ORDER BY c.created_at ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Comment content required' });

    const [result] = await pool.query('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [id, req.user.id, content]);
    const [post] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [id]);
    if (post.length && post[0].user_id !== req.user.id) {
      await pool.query(
        'INSERT INTO notifications (user_id, from_user_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
        [post[0].user_id, req.user.id, 'comment', id, `${req.user.username} commented on your post`]
      );
    }

    const [comment] = await pool.query(
      'SELECT c.*, u.full_name, u.username, u.profile_photo FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
      [result.insertId]
    );
    res.status(201).json(comment[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const [rows] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
    if (!rows.length) return res.status(404).json({ message: 'Comment not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const bookmarkPost = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM bookmarks WHERE post_id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length) {
      await pool.query('DELETE FROM bookmarks WHERE post_id = ? AND user_id = ?', [id, req.user.id]);
      return res.json({ bookmarked: false });
    }
    await pool.query('INSERT INTO bookmarks (post_id, user_id) VALUES (?, ?)', [id, req.user.id]);
    res.json({ bookmarked: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user?.id;
    const [posts] = await pool.query(
      `SELECT p.*, u.full_name AS author_name, u.username AS author_username, u.profile_photo AS author_photo,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        ${viewerId ? `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ${pool.escape(viewerId)}) AS is_liked` : '0 AS is_liked'}
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ? AND p.is_anonymous = 0 AND p.status = 'active'
       ORDER BY p.created_at DESC`,
      [userId]
    );
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const reportPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    await pool.query('INSERT INTO reports (reporter_id, reference_id, type, reason) VALUES (?, ?, ?, ?)', [req.user.id, id, 'post', reason]);
    res.json({ message: 'Post reported' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const searchPosts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const [posts] = await pool.query(
      `SELECT p.*, IF(p.is_anonymous=0,u.full_name,'Anonymous') AS author_name,
        IF(p.is_anonymous=0,u.username,NULL) AS author_username,
        IF(p.is_anonymous=0,u.profile_photo,NULL) AS author_photo,
        (SELECT COUNT(*) FROM likes WHERE post_id=p.id) AS likes_count
       FROM posts p JOIN users u ON p.user_id=u.id
       WHERE p.status='active' AND p.content LIKE ? ORDER BY p.created_at DESC LIMIT 20`,
      [`%${q}%`]
    );
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createPost, getFeed, getPost, updatePost, deletePost, likePost, getComments, addComment, deleteComment, bookmarkPost, getUserPosts, reportPost, searchPosts };
