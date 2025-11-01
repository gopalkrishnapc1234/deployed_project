require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('./config/db');
const contactRouter = require("./routes/contactRouter");
// Models for seeding
const User = require('./models/User');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));


// Make user session available to all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use("/", contactRouter);
// Landing
app.get('/', (req, res) => {
  res.render('index');
});

// Seed admin if not exists (using credentials provided)
async function seedAdmin() {
  const adminEmail = 'gopalkrishnashukla336@gmail.com';
  const adminPassword = 'shivay1234';
  try {
    const exists = await User.findOne({ email: adminEmail });
    if (!exists) {
      const admin = new User({
        name: 'GradMate Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user seeded:', adminEmail);
    } else {
      console.log('Admin already exists:', adminEmail);
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
  }
}

seedAdmin();

// Start server
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`GradMate running: http://localhost:${PORT}`));
