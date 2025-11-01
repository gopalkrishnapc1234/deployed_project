const mongoose = require('mongoose');

const mongoURI = 'mongodb://127.0.0.1:27017/shivay';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected:', mongoURI))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = mongoose;
