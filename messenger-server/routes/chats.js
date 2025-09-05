// routes/chats.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/chat');
const User = require('../models/user');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', authenticateToken, async (req, res) => {
  console.log(`GET /chats for userId: ${req.user.userId}`);
  try {
    const chats = await Chat.find({ participants: req.user.userId });
    console.log(`Загружены чаты для userId: ${req.user.userId}`, chats);
    res.json(chats);
  } catch (err) {
    console.error('Ошибка загрузки чатов:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  console.log('POST /chats');
  try {
    const { otherUserId } = req.body;
    const user = await User.findOne({ userId: otherUserId });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const existingChat = await Chat.findOne({
      participants: { $all: [req.user.userId, otherUserId], $size: 2 },
      type: 'private',
    });
    if (existingChat) {
      console.log('Чат уже существует:', existingChat);
      return res.json(existingChat);
    }
    const chat = new Chat({
      participants: [req.user.userId, otherUserId],
    });
    await chat.save();
    console.log('Создан новый чат:', chat);
    res.json(chat);
  } catch (err) {
    console.error('Ошибка создания чата:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;