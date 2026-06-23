const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    }
  });

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

const pdfFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.pdf' || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

const uploadProfile = multer({ storage: createStorage('profiles'), fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadCover = multer({ storage: createStorage('covers'), fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadPost = multer({ storage: createStorage('posts'), fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadNote = multer({ storage: createStorage('notes'), fileFilter: fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });
const uploadMarketplace = multer({ storage: createStorage('marketplace'), fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadIdCard = multer({ storage: createStorage('id_cards'), fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadEvent = multer({ storage: createStorage('events'), fileFilter: pdfFilter, limits: { fileSize: 20 * 1024 * 1024 } });
const uploadClub = multer({ storage: createStorage('clubs'), fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadClubEvent = multer({ storage: createStorage('club_events'), fileFilter: pdfFilter, limits: { fileSize: 20 * 1024 * 1024 } });
const uploadLostFound = multer({ storage: createStorage('lost_found'), fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { uploadProfile, uploadCover, uploadPost, uploadNote, uploadMarketplace, uploadIdCard, uploadEvent, uploadClub, uploadClubEvent, uploadLostFound };
