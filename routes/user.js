const express = require('express');
const router = express.Router();
const multer = require('multer');
const Job = require('../models/Job');
const AppliedJob = require('../models/AppliedJob');

// ✅ Multer for in-memory resume uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document/;
    allowed.test(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF or Word files allowed.'));
  }
});

// ✅ User middleware
function isUser(req, res, next) {
  if (req.session.user && req.session.user.role === 'user') return next();
  return res.redirect('/login');
}

// ✅ Jobs listing
router.get('/jobs', isUser, async (req, res) => {
  const jobs = await Job.find().sort({ date: -1 });
  const applied = await AppliedJob.find({ user: req.session.user.id });
  const appliedJobIds = applied.map(a => String(a.job));
  res.render('jobs', { jobs, appliedJobIds, currentUser: req.session.user });
});

// ✅ Apply for job (with resume)
router.post('/apply/:id', isUser, upload.single('resume'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.session.user.id;
    const User = require('../models/User'); // make sure this model exists

    // fetch full user record
    const fullUser = await User.findById(userId);
    if (!fullUser) return res.status(404).send('User not found');

    const exists = await AppliedJob.findOne({ user: userId, job: jobId });
    if (exists) return res.redirect('/user/jobs');

    if (!req.file) return res.status(400).send('Resume is required.');

    const app = new AppliedJob({
      user: userId,
      job: jobId,
      name: fullUser.name,
      email: fullUser.email,
      resume: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname
      }
    });

    await app.save();
    res.redirect('/user/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// ✅ User dashboard
router.get('/dashboard', isUser, async (req, res) => {
  const applied = await AppliedJob.find({ user: req.session.user.id }).populate('job');
  res.render('dashboard', { applied });
});

// ✅ Route for downloading resume
router.get('/resume/:id', isUser, async (req, res) => {
  try {
    const app = await AppliedJob.findById(req.params.id);
    if (!app || !app.resume) return res.status(404).send('Resume not found');
    res.set('Content-Type', app.resume.contentType);
    res.set('Content-Disposition', `attachment; filename="${app.resume.filename}"`);
    res.send(app.resume.data);
  } catch {
    res.status(500).send('Server error');
  }
});

module.exports = router;
