const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');

// ✅ GANTI PASSWORD
router.put('/change-password/:id', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.params.id;

  db.query('SELECT password FROM users WHERE id = ?', [userId], async (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });

    const valid = await bcrypt.compare(currentPassword, results[0].password);
    if (!valid) return res.status(401).json({ message: 'Password lama salah' });

    const hashed = await bcrypt.hash(newPassword, 10);
    db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId], (err2) => {
      if (err2) return res.status(500).json({ message: 'Gagal mengganti password' });
      res.json({ message: 'Password berhasil diganti' });
    });
  });
});

// ✅ HAPUS AKUN
router.delete('/:id', (req, res) => {
  const userId = req.params.id;

  // Hapus dulu semua job milik user (jika dia company)
  db.query('DELETE FROM job_listings WHERE company_id = ?', [userId], (err1) => {
    if (err1) return res.status(500).json({ message: 'Gagal menghapus job listing' });

    // Baru hapus user
    db.query('DELETE FROM users WHERE id = ?', [userId], (err2) => {
      if (err2) return res.status(500).json({ message: 'Gagal menghapus akun' });
      res.json({ message: 'Akun berhasil dihapus' });
    });
  });
});

// Setup multer
const storage = multer.diskStorage({
  destination: './uploads/users',
  filename: (req, file, cb) => {
    cb(null, 'user-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ✅ GET: /api/users/:id (ambil data user by ID)
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT id, name, email, role, photo, location FROM users WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data user' });
    res.json(results[0]);
  });
});

// ✅ PUT: /api/users/:id (update + upload photo)
router.put('/:id', upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const { name, email, location } = req.body;
  const photo = req.file ? req.file.filename : null;

  let sql = `UPDATE users SET name=?, email=?, location=?`;
  const params = [name, email, location];

  if (photo) {
    sql += `, photo=?`;
    params.push(photo);
  }

  sql += ` WHERE id=?`;
  params.push(id);

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal update user' });
    res.json({ message: 'Profil berhasil diupdate' });
  });
});

module.exports = router;
