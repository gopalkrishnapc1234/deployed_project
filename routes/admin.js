const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const AppliedJob = require('../models/AppliedJob');

// Admin middleware
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  return res.redirect('/login');
}

// Admin panel - lists users, jobs, applied users
router.get('/', isAdmin, async (req, res) => {
  const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
  const jobs = await Job.find().sort({ date: -1 }).populate('postedBy');
  const applied = await AppliedJob.find().populate('user job').sort({ appliedAt: -1 });
  res.render('admin-panel', { users, jobs, applied });
});

// Post a job
router.post('/job', isAdmin, async (req, res) => {
  const { title, company, location, description } = req.body;
  const job = new Job({
    title,
    company: company || 'GradMate',
    location: location || 'Remote',
    description,
    postedBy: req.session.user.id
  });
  await job.save();
  res.redirect('/admin');
});

// Delete job and its applications
router.post('/job/delete/:id', isAdmin, async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);
  await AppliedJob.deleteMany({ job: req.params.id });
  res.redirect('/admin');
});
// Resume view/download for admin
router.get('/resume/:id', async (req, res) => {
  try {
    const AppliedJob = require('../models/AppliedJob');
    const app = await AppliedJob.findById(req.params.id);
    if (!app || !app.resume) return res.status(404).send('Resume not found');

    res.set('Content-Type', app.resume.contentType);
    res.set('Content-Disposition', `inline; filename="${app.resume.filename}"`);
    res.send(app.resume.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
module.exports = router;
