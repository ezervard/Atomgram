// models/chat.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Используем uuid последовательно

const chatSchema = new mongoose.Schema({
  chatId: { type: String, unique: true, default: uuidv4 },
  type: { type: String, default: 'private' }, // Добавили default
  participants: [{ type: String }], // Хранит userId
  name: { type: String, default: null }, // Для групповых чатов
});

module.exports = mongoose.model('Chat', chatSchema);