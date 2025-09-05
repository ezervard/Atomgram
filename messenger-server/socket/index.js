// socket/index.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Message = require('../models/message');
const Chat = require('../models/chat');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

module.exports = (io) => {
  console.log('Socket.IO: Инициализация...');
  console.log('Socket.IO: Состояние MongoDB:', mongoose.connection.readyState === 1 ? 'Подключено' : 'Не подключено');

  io.on('connection', (socket) => {
    console.log('Socket.IO: Пользователь подключился:', socket.id);
    let userId = null;
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
        socket.user = decoded;
        console.log('Socket.IO: Токен успешно декодирован для:', userId);
        User.findOneAndUpdate(
          { userId },
          { status: 'online' },
          { new: true }
        ).then((user) => {
          if (user) {
            io.emit('userStatus', { userId: user.userId, status: 'online' });
            console.log(`Socket.IO: Статус пользователя ${user.userId} обновлён на online`);
          } else {
            console.error('Socket.IO: Пользователь не найден для userId:', userId);
          }
        }).catch((err) => {
          console.error('Socket.IO: Ошибка обновления статуса на online:', err.message);
        });
      } else {
        console.error('Socket.IO: Токен отсутствует');
        socket.disconnect();
      }
    } catch (err) {
      console.error('Socket.IO: Ошибка декодирования токена:', err.message);
      socket.disconnect();
    }

    socket.on('joinChat', async (chatId) => {
      try {
        const chat = await Chat.findOne({ chatId });
        if (!chat || !chat.participants.includes(socket.user.userId)) {
          console.error(`Socket.IO: Нет доступа к чату ${chatId} для ${socket.id}`);
          return;
        }
        socket.join(chatId);
        console.log(`Socket.IO: Пользователь ${socket.id} присоединился к чату ${chatId}`);
      } catch (err) {
        console.error('Socket.IO: Ошибка joinChat:', err.message);
      }
    });

    socket.on('message', async (message) => {
      console.log('Socket.IO: Получено сообщение:', message);
      try {
        if (!message.username || !message.chat || !message.text || !message.timestamp) {
          console.error('Socket.IO: Некорректная структура сообщения:', message);
          return;
        }
        if (message.username !== socket.user.username) {
          console.error('Socket.IO: Spoofing username:', message.username);
          return;
        }
        const chat = await Chat.findOne({ chatId: message.chat });
        if (!chat || !chat.participants.includes(socket.user.userId)) {
          console.error(`Socket.IO: Нет доступа к чату ${message.chat} для ${socket.user.userId}`);
          return;
        }
        const user = await User.findOne({ username: message.username });
        if (!user) {
          console.error('Socket.IO: Пользователь не найден:', message.username);
          return;
        }
        const newMessage = new Message({
          username: message.username,
          chat: message.chat,
          text: message.text,
          timestamp: new Date(message.timestamp || new Date()),
          fullName: user.fullName || 'Неизвестный пользователь',
          edited: false,
        });
        await newMessage.save();
        console.log('Socket.IO: Сохранено новое сообщение:', newMessage);
        io.to(message.chat).emit('message', newMessage);
      } catch (err) {
        console.error('Socket.IO: Ошибка сохранения сообщения:', err.message);
      }
    });

    socket.on('disconnect', async () => {
      console.log('Socket.IO: Пользователь отключился:', socket.id);
      if (userId) {
        try {
          const user = await User.findOneAndUpdate(
            { userId },
            { status: 'offline' },
            { new: true }
          );
          if (user) {
            io.emit('userStatus', { userId: user.userId, status: 'offline' });
            console.log(`Socket.IO: Статус пользователя ${user.userId} обновлён на offline`);
          } else {
            console.error('Socket.IO: Пользователь не найден для userId:', userId);
          }
        } catch (err) {
          console.error('Socket.IO: Ошибка при обновлении статуса на offline:', err.message);
        }
      }
    });

    socket.on('error', (err) => {
      console.error('Socket.IO: Ошибка на сокете:', err.message);
    });
  });
};