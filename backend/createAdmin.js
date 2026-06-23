// Run: node createAdmin.js
const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

async function createAdmin() {
    const hash = await bcrypt.hash('Admin@123', 12);

    await pool.query('DELETE FROM users WHERE username = ?', ['admin']);

    await pool.query(
        `INSERT INTO users (full_name, username, email, password, usn, department, year, role, status, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', 'approved', 1)`,
        ['Admin', 'admin', 'admin@campusverse.com', hash, 'ADMIN001', 'Administration', 1]
    );

    console.log('✅ Admin created successfully');
    console.log('   Email:    admin@campusverse.com');
    console.log('   Password: Admin@123');
    process.exit(0);
}

createAdmin().catch((err) => { console.error(err); process.exit(1); });
