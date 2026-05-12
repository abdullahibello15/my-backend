const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'user'
  },
  initialBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  accountType: {
    type: String,
    enum: ['Standard', 'Premium', 'Business'],
    default: 'Standard'
  },
  accountStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
