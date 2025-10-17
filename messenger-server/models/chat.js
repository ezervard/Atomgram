// models/chat.js
const mongoose = require('mongoose');

// Функция для генерации короткого ID (6 символов)
const generateShortId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const chatSchema = new mongoose.Schema({
  chatId: { type: String, unique: true, default: generateShortId },
  type: { type: String, default: 'private' }, // Добавили default
  participants: [{ type: String }], // Хранит userId
  name: { type: String, default: null }, // Для групповых чатов
  description: { type: String, default: null }, // Описание чата
}, {
  timestamps: true // Автоматически добавляет createdAt и updatedAt
});

module.exports = mongoose.model('Chat', chatSchema);