const mongoose = require('mongoose');

const appliedJobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  name: { type: String, required: true },
  email: { type: String},
  resume: {
    data: Buffer,
    contentType: String,
    filename: String
  },
  appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AppliedJob', appliedJobSchema);
