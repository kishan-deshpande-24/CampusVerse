const { pool } = require('../config/db');

const getOrCreateChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user.id;
    if (parseInt(userId) === myId) return res.status(400).json({ message: 'Cannot chat with yourself' });

    const [existing] = await pool.query(
      `SELECT c.* FROM chats c
       JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ?
       JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ?
       WHERE c.type = 'direct'`,
      [myId, userId]
    );

    if (existing.length) return res.json(existing[0]);

    const [result] = await pool.query('INSERT INTO chats (type) VALUES (?)', ['direct']);
    const chatId = result.insertId;
    await pool.query('INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?), (?, ?)', [chatId, myId, chatId, userId]);

    const [chat] = await pool.query('SELECT * FROM chats WHERE id = ?', [chatId]);
    res.status(201).json(chat[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyChats = async (req, res) => {
  try {
    const [chats] = await pool.query(
      `SELECT c.*, 
        (SELECT m.content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
        (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_time,
        (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != ? AND m.is_read = 0) AS unread_count
       FROM chats c
       JOIN chat_participants cp ON c.id = cp.chat_id AND cp.user_id = ?
       ORDER BY last_message_time DESC`,
      [req.user.id, req.user.id]
    );

    for (const chat of chats) {
      if (chat.type === 'direct') {
        const [other] = await pool.query(
          `SELECT u.id, u.full_name, u.username, u.profile_photo FROM users u
           JOIN chat_participants cp ON u.id = cp.user_id
           WHERE cp.chat_id = ? AND u.id != ?`,
          [chat.id, req.user.id]
        );
        chat.other_user = other[0] || null;
      }
    }
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const [participant] = await pool.query('SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (!participant.length) return res.status(403).json({ message: 'Not a participant' });

    const [messages] = await pool.query(
      `SELECT m.*, u.full_name AS sender_name, u.username AS sender_username, u.profile_photo AS sender_photo
       FROM messages m JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = ? ORDER BY m.created_at ASC LIMIT 100`,
      [chatId]
    );
    await pool.query('UPDATE messages SET is_read = 1 WHERE chat_id = ? AND sender_id != ?', [chatId, req.user.id]);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const image = req.file ? `/uploads/posts/${req.file.filename}` : null;
    if (!content && !image) return res.status(400).json({ message: 'Message content required' });

    const [participant] = await pool.query('SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (!participant.length) return res.status(403).json({ message: 'Not a participant' });

    const [result] = await pool.query(
      'INSERT INTO messages (chat_id, sender_id, content, image) VALUES (?, ?, ?, ?)',
      [chatId, req.user.id, content || null, image]
    );
    const [msg] = await pool.query(
      'SELECT m.*, u.full_name AS sender_name, u.username AS sender_username, u.profile_photo AS sender_photo FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?',
      [result.insertId]
    );
    res.status(201).json(msg[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createGroupChat = async (req, res) => {
  try {
    const { name, memberIds, description, rules, icon } = req.body;
    if (!name || !memberIds || memberIds.length < 2) {
      return res.status(400).json({ message: 'Group name and at least 2 members are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO chats (type, name, description, rules, icon) VALUES (?, ?, ?, ?, ?)',
      ['group', name, description || null, rules || null, icon || '💬']
    );
    const chatId = result.insertId;

    const allMembers = [...new Set([req.user.id, ...memberIds])];
    const values = allMembers.map(id => [chatId, id]);
    await pool.query('INSERT INTO chat_participants (chat_id, user_id) VALUES ?', [values]);

    const [chat] = await pool.query('SELECT * FROM chats WHERE id = ?', [chatId]);
    res.status(201).json(chat[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateGroupInfo = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { name, description, rules, icon } = req.body;

    const [chat] = await pool.query('SELECT id FROM chats WHERE id = ? AND type = ?', [chatId, 'group']);
    if (!chat.length) return res.status(404).json({ message: 'Group not found' });

    const [participant] = await pool.query('SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (!participant.length) return res.status(403).json({ message: 'Not a participant' });

    await pool.query(
      'UPDATE chats SET name = COALESCE(?, name), description = ?, rules = ?, icon = COALESCE(?, icon) WHERE id = ?',
      [name || null, description ?? null, rules ?? null, icon || null, chatId]
    );

    const [updated] = await pool.query('SELECT * FROM chats WHERE id = ?', [chatId]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const { chatId } = req.params;
    const [participant] = await pool.query('SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (!participant.length) return res.status(403).json({ message: 'Not a participant' });

    const [members] = await pool.query(
      `SELECT u.id, u.full_name, u.username, u.profile_photo
       FROM users u JOIN chat_participants cp ON u.id = cp.user_id
       WHERE cp.chat_id = ?`,
      [chatId]
    );
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addGroupMembers = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { memberIds } = req.body;
    if (!memberIds || memberIds.length === 0) return res.status(400).json({ message: 'No members provided' });

    const [chat] = await pool.query('SELECT id FROM chats WHERE id = ? AND type = ?', [chatId, 'group']);
    if (!chat.length) return res.status(404).json({ message: 'Group not found' });

    const [participant] = await pool.query('SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (!participant.length) return res.status(403).json({ message: 'Not a participant' });

    // Insert only members not already in the group
    for (const id of memberIds) {
      await pool.query(
        'INSERT IGNORE INTO chat_participants (chat_id, user_id) VALUES (?, ?)',
        [chatId, id]
      );
    }
    res.json({ message: 'Members added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const removeGroupMember = async (req, res) => {
  try {
    const { chatId, userId } = req.params;

    const [chat] = await pool.query('SELECT id FROM chats WHERE id = ? AND type = ?', [chatId, 'group']);
    if (!chat.length) return res.status(404).json({ message: 'Group not found' });

    const [participant] = await pool.query('SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?', [chatId, req.user.id]);
    if (!participant.length) return res.status(403).json({ message: 'Not a participant' });

    await pool.query('DELETE FROM chat_participants WHERE chat_id = ? AND user_id = ?', [chatId, userId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getOrCreateChat, getMyChats, getMessages, sendMessage, createGroupChat, updateGroupInfo, getGroupMembers, addGroupMembers, removeGroupMember };
