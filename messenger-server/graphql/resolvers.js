const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;
const { PubSub } = require('graphql-subscriptions');
const { GraphQLError } = require('graphql');

const User = require('../models/user');
const Chat = require('../models/chat');
const Message = require('../models/message');
const { handleMultipleFileUpload, validateFile } = require('./uploadHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const pubsub = new PubSub();

// Функция для генерации короткого ID
const generateShortId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Middleware для аутентификации
const authenticateUser = (context) => {
  const authHeader = context.req.headers.authorization;
  if (!authHeader) {
    throw new GraphQLError('Токен авторизации отсутствует', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new GraphQLError('Недействительный токен', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
};

// Функция для обогащения чатов информацией о пользователях
const enrichChatsWithUsers = async (chats, currentUserId) => {
  const enrichedChats = await Promise.all(chats.map(async (chat) => {
    const participants = await User.find({ userId: { $in: chat.participants } });
    
    // Получаем последнее сообщение
    const lastMessage = await Message.findOne({ chat: chat.chatId })
      .sort({ timestamp: -1 })
      .limit(1);

    // Определяем название чата
    let chatName = chat.name;
    if (!chatName && chat.type === 'private') {
      // Для приватных чатов используем имя другого участника
      const otherParticipant = participants.find(p => p.userId !== currentUserId);
      if (otherParticipant) {
        chatName = otherParticipant.fullName || otherParticipant.username;
      }
    } else if (chat.type === 'favorites') {
      // Для чата "Избранное" используем специальное название
      chatName = 'Избранное';
    }

    return {
      ...chat.toObject(),
      type: chat.type?.toUpperCase() || 'PRIVATE',
      name: chatName,
      participants: participants.map(p => ({
        ...p.toObject(),
        status: p.status?.toUpperCase() || 'OFFLINE',
        createdAt: p.createdAt || new Date(),
        updatedAt: p.updatedAt || new Date()
      })),
      lastMessage: lastMessage ? {
        ...lastMessage.toObject(),
        _id: lastMessage._id.toString(),
        type: lastMessage.type?.toUpperCase() || 'TEXT',
        createdAt: lastMessage.createdAt || new Date(),
        updatedAt: lastMessage.updatedAt || new Date()
      } : null,
      createdAt: chat.createdAt || new Date(),
      updatedAt: chat.updatedAt || new Date()
    };
  }));

  return enrichedChats;
};

// Функция для обогащения сообщений информацией о пользователях
const enrichMessagesWithUsers = async (messages) => {
  const userIds = [...new Set(messages.map(msg => msg.userId))];
  const users = await User.find({ userId: { $in: userIds } });
  const userMap = users.reduce((acc, user) => {
    acc[user.userId] = user;
    return acc;
  }, {});

  return messages.map(message => {
    // Создаем объект напрямую из Mongoose документа или lean объекта
    const messageObj = message.toObject ? message.toObject() : message;
    
    // Логируем файлы для отладки
    if (messageObj.files && messageObj.files.length > 0) {
      console.log('enrichMessagesWithUsers - файлы в сообщении:', messageObj.files);
      console.log('enrichMessagesWithUsers - первый файл:', messageObj.files[0]);
      console.log('enrichMessagesWithUsers - поля первого файла:', Object.keys(messageObj.files[0]));
    }
    
    const enrichedMessage = {
      _id: message._id ? message._id.toString() : 'unknown',
      text: messageObj.text || '',
      userId: messageObj.userId || '',
      username: userMap[message.userId]?.fullName || messageObj.username || '',
      fullName: userMap[message.userId]?.fullName || messageObj.fullName || '',
      chat: messageObj.chat || '',
      type: messageObj.type?.toUpperCase() || 'TEXT',
      files: messageObj.files || [],
      replyTo: messageObj.replyTo || null,
      forwardedFrom: messageObj.forwardedFrom || null,
      originalMessage: messageObj.originalMessage || null,
      edited: messageObj.edited || false,
      timestamp: messageObj.timestamp || new Date(),
      createdAt: messageObj.createdAt || new Date(),
      updatedAt: messageObj.updatedAt || new Date()
    };
    
    // Дополнительная проверка _id
    if (!enrichedMessage._id || enrichedMessage._id === 'unknown') {
      console.error('Message without valid _id:', message);
      enrichedMessage._id = `temp_${Date.now()}_${Math.random()}`;
    }
    
    return enrichedMessage;
  });
};

const resolvers = {
  DateTime: {
    serialize: (date) => date instanceof Date ? date.toISOString() : null,
    parseValue: (value) => new Date(value),
    parseLiteral: (ast) => new Date(ast.value)
  },
  
  Message: {
    _id: (parent) => {
      // Принудительно преобразуем _id в строку
      const id = parent._id || parent.id;
      if (!id) {
        console.error('Message without _id:', parent);
        return `error_${Date.now()}`;
      }
      return id.toString();
    },
    
    text: (parent) => {
      const text = parent.text || '';
      if (text === null || text === undefined) {
        console.error('Message without text:', parent);
        return '';
      }
      return text;
    },
    
    userId: (parent) => {
      return parent.userId || '';
    },
    
    username: (parent) => {
      return parent.username || '';
    },
    
    fullName: (parent) => {
      return parent.fullName || '';
    },
    
    chat: (parent) => {
      return parent.chat || '';
    },
    
    type: (parent) => {
      return (parent.type || 'TEXT').toUpperCase();
    },
    
    edited: (parent) => {
      return Boolean(parent.edited);
    },
    
    timestamp: (parent) => {
      return parent.timestamp || new Date();
    },
    
    createdAt: (parent) => {
      return parent.createdAt || new Date();
    },
    
    updatedAt: (parent) => {
      return parent.updatedAt || new Date();
    }
  },

  Query: {
    me: async (_, __, context) => {
      const user = authenticateUser(context);
      const foundUser = await User.findOne({ userId: user.userId });
      if (!foundUser) {
        throw new GraphQLError('Пользователь не найден', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }
      return {
        ...foundUser.toObject(),
        status: foundUser.status?.toUpperCase() || 'OFFLINE',
        createdAt: foundUser.createdAt || new Date(),
        updatedAt: foundUser.updatedAt || new Date()
      };
    },

    users: async (_, __, context) => {
      authenticateUser(context);
      const users = await User.find({});
      return users.map(user => ({
        ...user.toObject(),
        status: user.status?.toUpperCase() || 'OFFLINE',
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date()
      }));
    },

    chats: async (_, __, context) => {
      const user = authenticateUser(context);
      const chats = await Chat.find({ participants: user.userId });
      return await enrichChatsWithUsers(chats, user.userId);
    },

    chat: async (_, { chatId }, context) => {
      const user = authenticateUser(context);
      const chat = await Chat.findOne({ chatId, participants: user.userId });
      if (!chat) {
        throw new GraphQLError('Чат не найден', {
          extensions: { code: 'CHAT_NOT_FOUND' }
        });
      }
      const enrichedChats = await enrichChatsWithUsers([chat], user.userId);
      return enrichedChats[0];
    },

    messages: async (_, { chatId, limit = 50, offset = 0 }, context) => {
      const user = authenticateUser(context);
      
      // Проверяем, что пользователь является участником чата
      const chat = await Chat.findOne({ chatId, participants: user.userId });
      if (!chat) {
        throw new GraphQLError('Чат не найден', {
          extensions: { code: 'CHAT_NOT_FOUND' }
        });
      }

      const messages = await Message.find({ chat: chatId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .lean(); // Используем lean() для получения простых объектов JavaScript

      return await enrichMessagesWithUsers(messages.reverse());
    },

    message: async (_, { messageId }, context) => {
      authenticateUser(context);
      const message = await Message.findById(messageId);
      if (!message) {
        throw new GraphQLError('Сообщение не найдено', {
          extensions: { code: 'MESSAGE_NOT_FOUND' }
        });
      }
      const enrichedMessages = await enrichMessagesWithUsers([message]);
      return enrichedMessages[0];
    },

    searchUsers: async (_, { query }, context) => {
      authenticateUser(context);
      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { fullName: { $regex: query, $options: 'i' } },
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ]
      });
      return users.map(user => ({
        ...user.toObject(),
        status: user.status?.toUpperCase() || 'OFFLINE',
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date()
      }));
    }
  },

  Mutation: {
    login: async (_, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user || !await bcrypt.compare(password, user.password)) {
        throw new GraphQLError('Неверные учетные данные', {
          extensions: { code: 'INVALID_CREDENTIALS' }
        });
      }

      const token = jwt.sign(
        { username: user.username, userId: user.userId, fullName: user.fullName },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        token,
        user: {
          ...user.toObject(),
          status: user.status?.toUpperCase() || 'OFFLINE',
          createdAt: user.createdAt || new Date(),
          updatedAt: user.updatedAt || new Date()
        }
      };
    },

    register: async (_, { input }) => {
      const { username, email, password, firstName, lastName, patronymic } = input;
      
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        throw new GraphQLError('Пользователь или email уже существует', {
          extensions: { code: 'USER_EXISTS' }
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const fullName = `${firstName || ''} ${lastName || ''}`.trim();
      
      const user = new User({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        patronymic,
        fullName: fullName || username,
      });

      await user.save();

      // Создаем чат "Избранное" для нового пользователя
      const favoritesChat = new Chat({
        type: 'favorites',
        participants: [user.userId],
        name: 'Избранное'
      });
      await favoritesChat.save();

      const token = jwt.sign(
        { username: user.username, userId: user.userId, fullName: user.fullName },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        token,
        user: {
          ...user.toObject(),
          status: 'OFFLINE'
        }
      };
    },

    logout: async (_, __, context) => {
      const user = authenticateUser(context);
      // В реальном приложении здесь можно добавить логику для инвалидации токена
      return {
        success: true,
        message: 'Успешный выход'
      };
    },

    createPrivateChat: async (_, { otherUserId }, context) => {
      const currentUser = authenticateUser(context);
      
      // Если пользователь пытается создать чат с самим собой, создаем чат "Избранное"
      if (otherUserId === currentUser.userId) {
        let favoritesChat = await Chat.findOne({
          type: 'favorites',
          participants: [currentUser.userId]
        });

        if (!favoritesChat) {
          favoritesChat = new Chat({
            type: 'favorites',
            participants: [currentUser.userId],
            name: 'Избранное'
          });
          await favoritesChat.save();
        }

        const enrichedChats = await enrichChatsWithUsers([favoritesChat], currentUser.userId);
        return enrichedChats[0];
      }
      
      // Проверяем, что другой пользователь существует
      const otherUser = await User.findOne({ userId: otherUserId });
      if (!otherUser) {
        throw new GraphQLError('Пользователь не найден', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }

      // Проверяем, не существует ли уже чат между этими пользователями
      const existingChat = await Chat.findOne({
        type: 'private',
        participants: { $all: [currentUser.userId, otherUserId] }
      });

      if (existingChat) {
        const enrichedChats = await enrichChatsWithUsers([existingChat], currentUser.userId);
        return enrichedChats[0];
      }

      // Создаем новый чат
      const chat = new Chat({
        type: 'private',
        participants: [currentUser.userId, otherUserId]
      });

      await chat.save();

      const enrichedChats = await enrichChatsWithUsers([chat], currentUser.userId);
      return enrichedChats[0];
    },

    sendMessage: async (_, { input }, context) => {
      const user = authenticateUser(context);
      const { chatId, text, type = 'TEXT' } = input;

      // Проверяем, что пользователь является участником чата
      const chat = await Chat.findOne({ chatId, participants: user.userId });
      if (!chat) {
        throw new GraphQLError('Чат не найден', {
          extensions: { code: 'CHAT_NOT_FOUND' }
        });
      }

      const message = new Message({
        chat: chatId,
        userId: user.userId,
        username: user.fullName || user.username,
        fullName: user.fullName || user.username,
        text,
        type: type.toLowerCase(),
        timestamp: new Date()
      });

      await message.save();

      // Обновляем последнее сообщение в чате
      chat.updatedAt = new Date();
      await chat.save();

      // Публикуем событие для subscriptions
      pubsub.publish('MESSAGE_ADDED', {
        messageAdded: message,
        chatId
      });

      // Отправляем событие через Socket.IO для реального времени
      if (context.io) {
        const enrichedMessage = (await enrichMessagesWithUsers([message]))[0];
        context.io.to(chatId).emit('message', enrichedMessage);
        console.log('Socket.IO: Отправлено событие message для чата:', chatId);
      }

      const enrichedMessages = await enrichMessagesWithUsers([message]);
      return enrichedMessages[0];
    },

    editMessage: async (_, { messageId, text }, context) => {
      const user = authenticateUser(context);
      
      const message = await Message.findById(messageId);
      if (!message) {
        throw new GraphQLError('Сообщение не найдено', {
          extensions: { code: 'MESSAGE_NOT_FOUND' }
        });
      }

      if (message.userId !== user.userId) {
        throw new GraphQLError('Нет прав для редактирования этого сообщения', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      message.text = text;
      message.edited = true;
      await message.save();

      // Публикуем событие для subscriptions
      pubsub.publish('MESSAGE_UPDATED', {
        messageUpdated: message,
        chatId: message.chat
      });

      const enrichedMessages = await enrichMessagesWithUsers([message]);
      return enrichedMessages[0];
    },

    deleteMessage: async (_, { messageId }, context) => {
      const user = authenticateUser(context);
      
      const message = await Message.findById(messageId);
      if (!message) {
        throw new GraphQLError('Сообщение не найдено', {
          extensions: { code: 'MESSAGE_NOT_FOUND' }
        });
      }

      // Проверяем, что пользователь является участником чата
      const chat = await Chat.findOne({ chatId: message.chat, participants: user.userId });
      if (!chat) {
        throw new GraphQLError('Нет доступа к чату', {
          extensions: { code: 'CHAT_ACCESS_DENIED' }
        });
      }

      // В личных чатах разрешаем удаление любых сообщений
      // В групповых чатах можно удалять только свои сообщения
      if (chat.type !== 'private' && message.userId !== user.userId) {
        throw new GraphQLError('Нет прав для удаления этого сообщения', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      await Message.findByIdAndDelete(messageId);

      // Публикуем событие для subscriptions
      pubsub.publish('MESSAGE_DELETED', {
        messageDeleted: {
          messageId,
          chatId: message.chat
        },
        chatId: message.chat
      });

      return {
        success: true,
        message: 'Сообщение успешно удалено'
      };
    },

    updateProfile: async (_, { input }, context) => {
      const user = authenticateUser(context);
      const { firstName, lastName, patronymic, email } = input;

      const foundUser = await User.findOne({ userId: user.userId });
      if (!foundUser) {
        throw new GraphQLError('Пользователь не найден', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }

      // Проверяем уникальность email
      if (email && email !== foundUser.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new GraphQLError('Email уже используется', {
            extensions: { code: 'EMAIL_EXISTS' }
          });
        }
      }

      if (firstName) foundUser.firstName = firstName;
      if (lastName) foundUser.lastName = lastName;
      if (patronymic) foundUser.patronymic = patronymic;
      if (email) foundUser.email = email;

      foundUser.fullName = `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || foundUser.username;
      foundUser.updatedAt = new Date();

      await foundUser.save();

      return {
        ...foundUser.toObject(),
        status: foundUser.status?.toUpperCase() || 'OFFLINE',
        createdAt: foundUser.createdAt || new Date(),
        updatedAt: foundUser.updatedAt || new Date()
      };
    },

    uploadAvatar: async (_, { avatar }, context) => {
      const user = authenticateUser(context);
      
      if (!avatar) {
        throw new GraphQLError('Файл аватара не предоставлен', {
          extensions: { code: 'NO_FILE' }
        });
      }

      const { createReadStream, filename, mimetype } = await avatar;
      
      // Проверяем тип файла
      if (!mimetype.startsWith('image/')) {
        throw new GraphQLError('Поддерживаются только изображения', {
          extensions: { code: 'INVALID_FILE_TYPE' }
        });
      }

      const stream = createReadStream();
      const chunks = [];
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      
      // Проверяем размер файла (максимум 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        throw new GraphQLError('Файл слишком большой (максимум 5MB)', {
          extensions: { code: 'FILE_TOO_LARGE' }
        });
      }

      const avatarDir = path.join(__dirname, '../Uploads/avatars');
      await fs.mkdir(avatarDir, { recursive: true });

      const avatarFileName = `avatar_${user.userId}_${Date.now()}.${filename.split('.').pop()}`;
      const avatarPath = path.join(avatarDir, avatarFileName);
      
      await fs.writeFile(avatarPath, buffer);

      const avatarUrl = `/Uploads/avatars/${avatarFileName}`;

      // Обновляем аватар пользователя
      await User.findOneAndUpdate(
        { userId: user.userId },
        { avatar: avatarUrl, updatedAt: new Date() }
      );

      return { avatar: avatarUrl };
    },

    // uploadFiles: async (_, { chatId, files, text }, context) => {
    //   // Эта мутация отключена, используется REST API для загрузки файлов
    //   throw new GraphQLError('Загрузка файлов через GraphQL отключена, используйте REST API', {
    //     extensions: { code: 'UPLOAD_DISABLED' }
    //   });
    // },

    forwardMessage: async (_, { messageId, targetChatId }, context) => {
      const user = authenticateUser(context);

      // Получаем исходное сообщение
      const originalMessage = await Message.findById(messageId);
      if (!originalMessage) {
        throw new GraphQLError('Сообщение не найдено', {
          extensions: { code: 'MESSAGE_NOT_FOUND' }
        });
      }

      // Проверяем, что пользователь является участником целевого чата
      const targetChat = await Chat.findOne({ chatId: targetChatId, participants: user.userId });
      if (!targetChat) {
        throw new GraphQLError('Целевой чат не найден', {
          extensions: { code: 'CHAT_NOT_FOUND' }
        });
      }

      // Создаем пересланное сообщение
      const forwardedMessage = new Message({
        chat: targetChatId,
        userId: user.userId,
        username: user.fullName || user.username,
        fullName: user.fullName || user.username,
        text: originalMessage.text,
        type: originalMessage.type, // Уже в правильном формате из БД
        files: originalMessage.files || [],
        forwardedFrom: originalMessage._id ? originalMessage._id.toString() : null,
        originalMessage: originalMessage._id ? originalMessage._id.toString() : null,
        timestamp: new Date()
      });

      await forwardedMessage.save();
      
      console.log('Forwarded message saved:', {
        _id: forwardedMessage._id,
        chatId: targetChatId,
        userId: user.userId,
        text: forwardedMessage.text
      });

      // Обновляем последнее сообщение в чате
      targetChat.updatedAt = new Date();
      await targetChat.save();

      // Публикуем событие для subscriptions
      pubsub.publish('MESSAGE_ADDED', {
        messageAdded: forwardedMessage,
        chatId: targetChatId
      });

      console.log('Before enrichment:', {
        forwardedMessageId: forwardedMessage._id,
        forwardedMessageType: typeof forwardedMessage._id
      });
      
      const enrichedMessages = await enrichMessagesWithUsers([forwardedMessage]);
      const result = enrichedMessages[0];
      
      console.log('After enrichment:', {
        resultId: result._id,
        resultType: typeof result._id,
        resultKeys: Object.keys(result)
      });
      
      // Убеждаемся, что _id не null
      if (!result._id || result._id === 'unknown') {
        console.log('Fixing null _id');
        result._id = forwardedMessage._id ? forwardedMessage._id.toString() : `forwarded_${Date.now()}`;
      }
      
      console.log('Final result:', {
        finalId: result._id,
        finalType: typeof result._id
      });
      
      return result;
    }
  },

  Subscription: {
    messageAdded: {
      subscribe: (_, { chatId }, context) => {
        const user = authenticateUser(context);
        
        return pubsub.asyncIterator([`MESSAGE_ADDED_${chatId}`]);
      },
      resolve: (payload) => {
        return payload.messageAdded;
      }
    },

    messageUpdated: {
      subscribe: (_, { chatId }, context) => {
        const user = authenticateUser(context);
        
        return pubsub.asyncIterator([`MESSAGE_UPDATED_${chatId}`]);
      },
      resolve: (payload) => {
        return payload.messageUpdated;
      }
    },

    messageDeleted: {
      subscribe: (_, { chatId }, context) => {
        const user = authenticateUser(context);
        
        return pubsub.asyncIterator([`MESSAGE_DELETED_${chatId}`]);
      },
      resolve: (payload) => {
        return payload.messageDeleted;
      }
    },

    userStatusChanged: {
      subscribe: (_, __, context) => {
        authenticateUser(context);
        return pubsub.asyncIterator(['USER_STATUS_CHANGED']);
      }
    }
  }
};

module.exports = { resolvers, pubsub };
