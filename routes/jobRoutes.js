const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all jobs
router.get('/', (req, res) => {
  const { keyword = '', location = '', category_id } = req.query;

  let sql = `
    SELECT job_listings.*, users.name AS company_name, job_categories.name AS category_name
    FROM job_listings
    JOIN users ON job_listings.company_id = users.id
    JOIN job_categories ON job_listings.category_id = job_categories.id
    WHERE job_listings.title LIKE ? AND job_listings.location LIKE ?
  `;
  const values = [`%${keyword}%`, `%${location}%`];

  if (category_id) {
    sql += ` AND job_listings.category_id = ?`;
    values.push(category_id);
  }

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});


// Add new job (POST)
router.post('/', (req, res) => {
  const { company_id, title, description, location, salary, category_id } = req.body;
  db.query(
    'INSERT INTO job_listings (company_id, title, description, location, salary, category_id) VALUES (?, ?, ?, ?, ?, ?)',
    [company_id, title, description, location, salary, category_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Job posted successfully' });
    }
  );
});

// Update job
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, location, salary, category_id } = req.body;
  db.query(
    'UPDATE job_listings SET title=?, description=?, location=?, salary=?, category_id=? WHERE id=?',
    [title, description, location, salary, category_id, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Lowongan diperbarui.' });
    }
  );
});

// Delete job
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM job_listings WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Lowongan dihapus.' });
  });
});
// Ambil pelamar untuk satu lowongan
router.get('/:id/applicants', (req, res) => {
  const jobId = req.params.id;
  db.query(
    `SELECT users.name, users.email, job_applications.message
     FROM job_applications
     JOIN users ON job_applications.applicant_id = users.id
     WHERE job_applications.job_id = ?`,
    [jobId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result);
    }
  );
});

// Lamar pekerjaan
router.post('/apply', (req, res) => {
  const { job_id, applicant_id, message } = req.body;

  // Cek apakah sudah pernah melamar
  db.query(
    'SELECT * FROM job_applications WHERE job_id = ? AND applicant_id = ?',
    [job_id, applicant_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.length > 0) {
        return res.status(400).json({ error: "Anda sudah melamar lowongan ini." });
      }

      // Kalau belum, simpan lamaran
      db.query(
        'INSERT INTO job_applications (job_id, applicant_id, message) VALUES (?, ?, ?)',
        [job_id, applicant_id, message],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2 });
          res.json({ message: "Lamaran berhasil dikirim!" });
        }
      );
    }
  );
});

// Daftar lamaran user
router.get('/applications/user/:id', (req, res) => {
  const userId = req.params.id;

  db.query(
    `SELECT ja.*, jl.title, jl.location, jl.salary, u.name AS company_name
     FROM job_applications ja
     JOIN job_listings jl ON ja.job_id = jl.id
     JOIN users u ON jl.company_id = u.id
     WHERE ja.applicant_id = ?
     ORDER BY ja.created_at DESC`,
    [userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json(result);
    }
  );
});


module.exports = router;
