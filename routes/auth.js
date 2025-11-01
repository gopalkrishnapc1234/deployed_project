const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// ---- Configure nodemailer ----
// Replace the following with your real email and app password:
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// If you prefer environment variables, replace above with process.env.EMAIL_USER, etc.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Register page
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Register action
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.render('register', { error: 'Email already registered' });

    const user = new User({ name, email, password, role: 'user' });
    await user.save();
    req.session.user = { id: user._id, name: user.name, role: user.role };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Something went wrong' });
  }
});

// Login page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Login action
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.render('login', { error: 'Email not found' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.render('login', { error: 'Invalid Password' });
    req.session.user = { id: user._id, name: user.name, role: user.role };
    if (user.role === 'admin') return res.redirect('/admin');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Something went wrong' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    res.redirect('/');
  });
});

//
// ---- Forgot Password ----
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { message: null, error: null });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.render('forgot-password', { error: 'No account with that email found', message: null });

    // create token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 1000 * 60 * 15; // 15 minutes
    await user.save();

    const resetUrl = `http://${req.headers.host}/reset-password/${token}`;

    const mailOptions = {
      to: user.email,
      from: EMAIL_USER,
      subject: 'GradMate Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.

Please click on the following link, or paste this into your browser to complete the process within 15 minutes of receiving it:

${resetUrl}

If you did not request this, please ignore this email and your password will remain unchanged.
`
    };

    transporter.sendMail(mailOptions, function(err) {
      if (err) {
        console.error('Error sending mail', err);
        return res.render('forgot-password', { error: 'Could not send reset email. Check server logs.', message: null });
      }
      res.render('forgot-password', { message: 'An email has been sent with further instructions.', error: null });
    });
  } catch (err) {
    console.error(err);
    res.render('forgot-password', { error: 'Something went wrong', message: null });
  }
});

// Reset page
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
  if (!user) return res.render('reset-password', { error: 'Password reset token is invalid or has expired.', token: null });
  res.render('reset-password', { error: null, token });
});

router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password, confirm } = req.body;
  try {
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.render('reset-password', { error: 'Password reset token is invalid or has expired.', token: null });

    if (!password || password.length < 6) {
      return res.render('reset-password', { error: 'Password must be at least 6 characters.', token });
    }
    if (password !== confirm) {
      return res.render('reset-password', { error: 'Passwords do not match.', token });
    }

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    // send confirmation email (optional)
    const mailOptions = {
      to: user.email,
      from: EMAIL_USER,
      subject: 'Your password has been changed',
      text: `Hello,

This is a confirmation that the password for your account ${user.email} has just been changed.

If you did not make this change, please contact support immediately.
`
    };
    transporter.sendMail(mailOptions, function(err) {
      if (err) console.error('Error sending confirmation mail', err);
      // ignore error and redirect
      res.redirect('/login');
    });

  } catch (err) {
    console.error(err);
    res.render('reset-password', { error: 'Something went wrong', token: null });
  }
});

module.exports = router;
