// models/user.js
const mongoose = require('mongoose');

// Функция для генерации короткого ID (6 символов)
const generateShortId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, default: generateShortId },
  username: String,
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  patronymic: String,
  fullName: String,
  status: { type: String, default: 'offline' },
  avatar: String, // URL аватара
  lastSeen: { type: Date, default: Date.now },
}, {
  timestamps: true // Автоматически добавляет createdAt и updatedAt
});

module.exports = mongoose.model('User', userSchema);