// models/user.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Используем uuid

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, default: uuidv4 },
  username: String,
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  patronymic: String,
  fullName: String,
  status: { type: String, default: 'offline' },
});

module.exports = mongoose.model('User', userSchema);