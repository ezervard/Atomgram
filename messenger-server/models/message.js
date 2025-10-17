// models/message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: String, // ID чата
  userId: String, // ID пользователя
  username: String, // Имя пользователя (для обратной совместимости)
  fullName: String, // Полное имя пользователя (для обратной совместимости)
  text: String, // Текст сообщения
  type: { type: String, default: 'text' }, // text или file
  timestamp: { type: Date, default: Date.now }, // Время отправки
  edited: { type: Boolean, default: false }, // Флаг редактирования
  forwardedFrom: { type: String, required: false }, // Имя пользователя, от которого переслано
  originalMessage: { type: String, required: false }, // ID оригинального сообщения
  files: [{
    filename: { type: String, required: false },
    originalName: { type: String, required: false },
    mimetype: { type: String, required: false },
    size: { type: Number, required: false },
    url: { type: String, required: false },
    uploadedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true // Автоматически добавляет createdAt и updatedAt
});

module.exports = mongoose.model('Message', messageSchema);