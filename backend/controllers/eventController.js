const { pool } = require('../config/db');
const path = require('path');

const createEvent = async (req, res) => {
  try {
    const { title, description, category, location, event_date, registration_deadline, max_attendees, registration_form_link } = req.body;
    if (!title || !event_date) return res.status(400).json({ message: 'Title and event date required' });

    const pdf_file = req.file ? `/uploads/events/${req.file.filename}` : null;
    const [result] = await pool.query(
      'INSERT INTO events (creator_id, title, description, category, location, event_date, registration_deadline, max_attendees, pdf_file, registration_form_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, category || 'general', location || null, event_date, registration_deadline || null, max_attendees || null, pdf_file, registration_form_link || null]
    );
    const [event] = await pool.query(
      `SELECT e.*, u.full_name AS creator_name, u.username AS creator_username FROM events e JOIN users u ON e.creator_id = u.id WHERE e.id = ?`,
      [result.insertId]
    );
    res.status(201).json(event[0]);
  } catch (err) {
    console.error('createEvent error:', err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

const getEvents = async (req, res) => {
  try {
    const { category, upcoming, q } = req.query;
    let where = 'WHERE e.status = "active"';
    const params = [];
    if (category) { where += ' AND e.category = ?'; params.push(category); }
    if (upcoming === 'true') { where += ' AND e.event_date >= UTC_TIMESTAMP()'; }
    if (q) { where += ' AND (e.title LIKE ? OR e.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

    const [events] = await pool.query(
      `SELECT e.*, u.full_name AS creator_name, u.username AS creator_username,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) AS attendees_count
       FROM events e JOIN users u ON e.creator_id = u.id ${where} ORDER BY e.event_date ASC`,
      params
    );

    // attach user reminder/registration status if logged in
    if (req.user) {
      for (const ev of events) {
        const [reg] = await pool.query('SELECT status FROM event_registrations WHERE event_id = ? AND user_id = ?', [ev.id, req.user.id]);
        ev.user_status = reg.length ? reg[0].status : null;
        const [rem] = await pool.query('SELECT id FROM event_reminders WHERE event_id = ? AND user_id = ?', [ev.id, req.user.id]);
        ev.reminder_set = rem.length > 0;
      }
    }
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT e.*, u.full_name AS creator_name, u.username AS creator_username, u.profile_photo AS creator_photo,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) AS attendees_count
       FROM events e JOIN users u ON e.creator_id = u.id WHERE e.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Event not found' });

    if (req.user) {
      const [reg] = await pool.query('SELECT status FROM event_registrations WHERE event_id = ? AND user_id = ?', [id, req.user.id]);
      rows[0].user_status = reg.length ? reg[0].status : null;
      const [rem] = await pool.query('SELECT id FROM event_reminders WHERE event_id = ? AND user_id = ?', [id, req.user.id]);
      rows[0].reminder_set = rem.length > 0;
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const registerEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const [event] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (!event.length) return res.status(404).json({ message: 'Event not found' });

    const [existing] = await pool.query('SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length) {
      if (status === 'none') {
        await pool.query('DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?', [id, req.user.id]);
        return res.json({ status: null });
      }
      await pool.query('UPDATE event_registrations SET status = ? WHERE event_id = ? AND user_id = ?', [status, id, req.user.id]);
    } else {
      await pool.query('INSERT INTO event_registrations (event_id, user_id, status) VALUES (?, ?, ?)', [id, req.user.id, status || 'going']);
    }
    res.json({ status: status || 'going' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const [event] = await pool.query('SELECT id, event_date FROM events WHERE id = ?', [id]);
    if (!event.length) return res.status(404).json({ message: 'Event not found' });

    const [existing] = await pool.query('SELECT id FROM event_reminders WHERE event_id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length) {
      await pool.query('DELETE FROM event_reminders WHERE event_id = ? AND user_id = ?', [id, req.user.id]);
      return res.json({ reminder_set: false, message: 'Reminder removed' });
    }

    // remind 1 hour before event
    const remindAt = new Date(new Date(event[0].event_date).getTime() - 60 * 60 * 1000);
    await pool.query('INSERT INTO event_reminders (event_id, user_id, remind_at) VALUES (?, ?, ?)', [id, req.user.id, remindAt]);
    res.json({ reminder_set: true, message: 'Reminder set for 1 hour before the event' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const downloadEventPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT pdf_file, title FROM events WHERE id = ?', [id]);
    if (!rows.length || !rows[0].pdf_file) return res.status(404).json({ message: 'PDF not found' });

    const filePath = path.join(__dirname, '..', rows[0].pdf_file);
    res.download(filePath, `${rows[0].title}.pdf`);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT creator_id FROM events WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Event not found' });
    if (rows[0].creator_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
    await pool.query('DELETE FROM events WHERE id = ?', [id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createEvent, getEvents, getEvent, registerEvent, toggleReminder, downloadEventPdf, deleteEvent };
