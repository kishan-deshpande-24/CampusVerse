# CampusVerse 🎓

An unofficial virtual digital campus platform for college students.

## Tech Stack
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, Zustand, React Router
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MySQL
- **Auth**: JWT + bcrypt

## Prerequisites
- Node.js 18+
- MySQL 8+

## Setup Instructions

### 1. Clone & Navigate
```bash
cd campusverse
```

### 2. Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Run schema
source backend/schema.sql
```

### 3. Backend Setup
```bash
cd backend
npm install

# Edit .env with your MySQL credentials and email settings
# DB_PASSWORD=your_mysql_password
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_gmail_app_password

# Seed database (after schema is created)
node seed.js

# Start backend
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 5. Access
- **App**: http://localhost:5173
- **API**: http://localhost:5000

## Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campusverse.com | Admin@123 |
| Student | arjun@college.edu | Student@123 |
| Student | priya@college.edu | Student@123 |

## Features
- ✅ Full authentication with email verification
- ✅ Admin approval workflow with ID card review
- ✅ Social feed with posts, likes, comments
- ✅ Anonymous confessions
- ✅ Notes sharing (PDF/DOC)
- ✅ Team finder
- ✅ Event hub with countdown
- ✅ Marketplace
- ✅ Lost & Found
- ✅ Anonymous faculty reviews
- ✅ Real-time messaging (Socket.IO)
- ✅ Real-time notifications
- ✅ Admin dashboard
- ✅ Profile system with follow/unfollow
- ✅ File uploads
- ✅ Responsive dark UI

## Gmail App Password Setup
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate password for "Mail"
4. Use that as EMAIL_PASS in .env
