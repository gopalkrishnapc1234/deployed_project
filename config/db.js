const mongoose = require('mongoose');
require('dotenv').config();
MONGO_URL='mongodb+srv://GopalKrishnaShukla:shivay1234@gradmat.rjpehe6.mongodb.net/?appName=gradMat';


mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

module.exports = mongoose;
