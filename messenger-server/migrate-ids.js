// migrate-ids.js - Скрипт для миграции ID на короткие 6-символьные
const mongoose = require('mongoose');
const User = require('./models/user');
const Chat = require('./models/chat');
const Message = require('./models/message');

// Функция для генерации короткого ID (6 символов)
const generateShortId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Функция для проверки уникальности ID
const isIdUnique = async (newId, model) => {
  const existing = await model.findOne({ userId: newId });
  return !existing;
};

const migrateUsers = async () => {
  console.log('Начинаем миграцию пользователей...');
  const users = await User.find({});
  
  for (const user of users) {
    if (user.userId.length > 6) {
      let newId;
      do {
        newId = generateShortId();
      } while (!(await isIdUnique(newId, User)));
      
      console.log(`Мигрируем пользователя ${user.username}: ${user.userId} -> ${newId}`);
      user.userId = newId;
      await user.save();
    }
  }
  console.log('Миграция пользователей завершена');
};

const migrateChats = async () => {
  console.log('Начинаем миграцию чатов...');
  const chats = await Chat.find({});
  
  for (const chat of chats) {
    if (chat.chatId.length > 6) {
      let newId;
      do {
        newId = generateShortId();
      } while (!(await isIdUnique(newId, Chat)));
      
      console.log(`Мигрируем чат: ${chat.chatId} -> ${newId}`);
      chat.chatId = newId;
      await chat.save();
    }
  }
  console.log('Миграция чатов завершена');
};

const migrateMessages = async () => {
  console.log('Начинаем миграцию сообщений...');
  const messages = await Message.find({});
  
  for (const message of messages) {
    let updated = false;
    
    // Мигрируем userId в сообщениях
    if (message.userId && message.userId.length > 6) {
      const user = await User.findOne({ userId: message.userId });
      if (user) {
        console.log(`Мигрируем userId в сообщении: ${message.userId} -> ${user.userId}`);
        message.userId = user.userId;
        updated = true;
      }
    }
    
    // Мигрируем chat в сообщениях
    if (message.chat && message.chat.length > 6) {
      const chat = await Chat.findOne({ chatId: message.chat });
      if (chat) {
        console.log(`Мигрируем chat в сообщении: ${message.chat} -> ${chat.chatId}`);
        message.chat = chat.chatId;
        updated = true;
      }
    }
    
    if (updated) {
      await message.save();
    }
  }
  console.log('Миграция сообщений завершена');
};

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/grok_messenger_new', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Подключено к MongoDB');
    
    await migrateUsers();
    await migrateChats();
    await migrateMessages();
    
    console.log('Миграция завершена успешно!');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка миграции:', error);
    process.exit(1);
  }
};

main();
