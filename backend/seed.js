require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, connectDB } = require('./config/db');

const seed = async () => {
  await connectDB();

  const adminPass = await bcrypt.hash('Admin@123', 12);
  const student1Pass = await bcrypt.hash('Student@123', 12);
  const student2Pass = await bcrypt.hash('Student@123', 12);

  await pool.query(`
    INSERT IGNORE INTO users (full_name, username, email, password, usn, department, year, role, status, email_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Admin User', 'admin', 'admin@campusverse.com', adminPass, 'ADMIN001', 'Administration', 1, 'admin', 'approved', 1]
  );

  await pool.query(`
    INSERT IGNORE INTO users (full_name, username, email, password, usn, department, section, year, bio, role, status, email_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Arjun Sharma', 'arjun_s', 'arjun@college.edu', student1Pass, 'CS21001', 'Computer Science', 'A', 3, 'Passionate about web dev and open source.', 'student', 'approved', 1]
  );

  await pool.query(`
    INSERT IGNORE INTO users (full_name, username, email, password, usn, department, section, year, bio, role, status, email_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Priya Nair', 'priya_n', 'priya@college.edu', student2Pass, 'EC21002', 'Electronics', 'B', 2, 'Electronics enthusiast and IoT hobbyist.', 'student', 'approved', 1]
  );

  const [users] = await pool.query('SELECT id FROM users WHERE username IN ("arjun_s","priya_n")');
  if (users.length >= 2) {
    const [u1, u2] = users;
    await pool.query('INSERT IGNORE INTO posts (user_id, content, type) VALUES (?, ?, ?)', [u1.id, 'Welcome to CampusVerse! 🎉 The best platform for college students. #campusverse #college', 'text']);
    await pool.query('INSERT IGNORE INTO posts (user_id, content, type, is_anonymous) VALUES (?, ?, ?, ?)', [u2.id, 'Anyone else feel like the canteen food has gotten worse this semester? 😅', 'confession', 1]);
    await pool.query('INSERT IGNORE INTO posts (user_id, content, type) VALUES (?, ?, ?)', [u1.id, 'Looking for teammates for the upcoming hackathon! Need a UI/UX designer and a backend dev. DM me! #hackathon #team', 'announcement']);

    await pool.query('INSERT IGNORE INTO events (creator_id, title, description, category, location, event_date) VALUES (?, ?, ?, ?, ?, ?)',
      [u1.id, 'Annual Tech Fest 2024', 'Join us for the biggest tech event of the year with workshops, hackathons, and more!', 'technical', 'Main Auditorium', '2024-12-15 09:00:00']);

    await pool.query('INSERT IGNORE INTO teams (creator_id, name, description, required_skills, max_members, project_type) VALUES (?, ?, ?, ?, ?, ?)',
      [u1.id, 'WebDev Warriors', 'Building a student portal for our college. Looking for passionate developers!', 'React, Node.js, MySQL', 4, 'Web Development']);

    await pool.query('INSERT IGNORE INTO marketplace_items (seller_id, title, description, price, category, item_condition) VALUES (?, ?, ?, ?, ?, ?)',
      [u2.id, 'Data Structures Textbook', 'CLRS 3rd Edition, barely used. Perfect condition.', 350.00, 'books', 'like_new']);
  }

  console.log('✅ Seed data inserted successfully');
  console.log('Admin login: admin@campusverse.com / Admin@123');
  console.log('Student login: arjun@college.edu / Student@123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
