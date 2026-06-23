const { pool } = require('../config/db');

const createTeam = async (req, res) => {
  try {
    const { name, description, required_skills, max_members, project_type } = req.body;
    if (!name || !description) return res.status(400).json({ message: 'Name and description required' });

    const [result] = await pool.query(
      'INSERT INTO teams (creator_id, name, description, required_skills, max_members, project_type) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, name, description, required_skills || null, max_members || 5, project_type || null]
    );
    await pool.query('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [result.insertId, req.user.id, 'leader']);
    const [team] = await pool.query('SELECT * FROM teams WHERE id = ?', [result.insertId]);
    res.status(201).json(team[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getTeams = async (req, res) => {
  try {
    const { q, project_type } = req.query;
    let where = 'WHERE t.status = "open"';
    const params = [];
    if (q) { where += ' AND (t.name LIKE ? OR t.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    if (project_type) { where += ' AND t.project_type = ?'; params.push(project_type); }

    const [teams] = await pool.query(
      `SELECT t.*, u.full_name AS creator_name, u.username AS creator_username, u.profile_photo AS creator_photo,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
       FROM teams t JOIN users u ON t.creator_id = u.id ${where} ORDER BY t.created_at DESC`,
      params
    );
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT t.*, u.full_name AS creator_name, u.username AS creator_username, u.profile_photo AS creator_photo,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
       FROM teams t JOIN users u ON t.creator_id = u.id WHERE t.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Team not found' });

    const [members] = await pool.query(
      'SELECT tm.*, u.full_name, u.username, u.profile_photo, u.department FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = ?',
      [id]
    );
    res.json({ ...rows[0], members });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const requestJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const [team] = await pool.query('SELECT * FROM teams WHERE id = ?', [id]);
    if (!team.length) return res.status(404).json({ message: 'Team not found' });

    const [existing] = await pool.query('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length) return res.status(400).json({ message: 'Already a member' });

    const [req_existing] = await pool.query('SELECT id FROM team_requests WHERE team_id = ? AND user_id = ? AND status = "pending"', [id, req.user.id]);
    if (req_existing.length) return res.status(400).json({ message: 'Request already pending' });

    await pool.query('INSERT INTO team_requests (team_id, user_id, message) VALUES (?, ?, ?)', [id, req.user.id, message || null]);
    await pool.query(
      'INSERT INTO notifications (user_id, from_user_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
      [team[0].creator_id, req.user.id, 'team_request', id, `${req.user.username} wants to join your team "${team[0].name}"`]
    );
    res.json({ message: 'Join request sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const handleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    const [rows] = await pool.query('SELECT tr.*, t.creator_id, t.max_members, t.name FROM team_requests tr JOIN teams t ON tr.team_id = t.id WHERE tr.id = ?', [requestId]);
    if (!rows.length) return res.status(404).json({ message: 'Request not found' });
    if (rows[0].creator_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await pool.query('UPDATE team_requests SET status = ? WHERE id = ?', [action, requestId]);
    if (action === 'accepted') {
      await pool.query('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [rows[0].team_id, rows[0].user_id, 'member']);
      await pool.query(
        'INSERT INTO notifications (user_id, from_user_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
        [rows[0].user_id, req.user.id, 'team_accepted', rows[0].team_id, `Your request to join "${rows[0].name}" was accepted`]
      );
    }
    res.json({ message: `Request ${action}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getTeamRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const [team] = await pool.query('SELECT creator_id FROM teams WHERE id = ?', [id]);
    if (!team.length || team[0].creator_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const [requests] = await pool.query(
      'SELECT tr.*, u.full_name, u.username, u.profile_photo, u.department FROM team_requests tr JOIN users u ON tr.user_id = u.id WHERE tr.team_id = ? AND tr.status = "pending"',
      [id]
    );
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserTeams = async (req, res) => {
  try {
    const [teams] = await pool.query(
      `SELECT t.*, (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
       FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.user_id = ?`,
      [req.user.id]
    );
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createTeam, getTeams, getTeam, requestJoin, handleRequest, getTeamRequests, getUserTeams };
