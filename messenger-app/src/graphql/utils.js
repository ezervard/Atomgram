import { gql } from '@apollo/client';

// Утилиты для работы с GraphQL

// Функция для обновления кэша после создания нового чата
export const updateChatsCache = (cache, newChat, query) => {
  try {
    const existingChats = cache.readQuery({ query });
    if (existingChats && !existingChats.chats.find(chat => chat.chatId === newChat.chatId)) {
      cache.writeQuery({
        query,
        data: {
          chats: [...existingChats.chats, newChat]
        }
      });
    }
  } catch (error) {
    console.error('Ошибка обновления кэша чатов:', error);
  }
};

// Функция для обновления кэша после добавления сообщения
export const updateMessagesCache = (cache, newMessage, chatId, query) => {
  try {
    const existingMessages = cache.readQuery({ 
      query, 
      variables: { chatId } 
    });
    
    if (existingMessages && !existingMessages.messages.find(msg => msg._id === newMessage._id)) {
      cache.writeQuery({
        query,
        variables: { chatId },
        data: {
          messages: [...existingMessages.messages, newMessage]
        }
      });
    }
  } catch (error) {
    console.error('Ошибка обновления кэша сообщений:', error);
  }
};

// Функция для обновления кэша после редактирования сообщения
export const updateMessageInCache = (cache, updatedMessage) => {
  try {
    cache.modify({
      id: cache.identify(updatedMessage),
      fields: {
        text: () => updatedMessage.text,
        edited: () => true,
        updatedAt: () => updatedMessage.updatedAt
      }
    });
  } catch (error) {
    console.error('Ошибка обновления сообщения в кэше:', error);
  }
};

// Функция для удаления сообщения из кэша
export const removeMessageFromCache = (cache, messageId, chatId, query) => {
  try {
    const existingMessages = cache.readQuery({ 
      query, 
      variables: { chatId } 
    });
    
    if (existingMessages) {
      cache.writeQuery({
        query,
        variables: { chatId },
        data: {
          messages: existingMessages.messages.filter(msg => msg._id !== messageId)
        }
      });
    }
  } catch (error) {
    console.error('Ошибка удаления сообщения из кэша:', error);
  }
};

// Функция для обновления статуса пользователя в кэше
export const updateUserStatusInCache = (cache, userId, status, lastSeen) => {
  try {
    cache.modify({
      id: cache.identify({ __typename: 'User', userId }),
      fields: {
        status: () => status,
        lastSeen: () => lastSeen
      }
    });
  } catch (error) {
    console.error('Ошибка обновления статуса пользователя в кэше:', error);
  }
};

// Функция для обновления последнего сообщения в чате
export const updateLastMessageInChat = (cache, chatId, lastMessage) => {
  try {
    cache.modify({
      id: cache.identify({ __typename: 'Chat', chatId }),
      fields: {
        lastMessage: () => lastMessage,
        updatedAt: () => new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Ошибка обновления последнего сообщения в чате:', error);
  }
};

// Функция для оптимистичного обновления UI
export const optimisticUpdate = {
  // Добавление сообщения
  addMessage: (message, chatId) => ({
    __typename: 'Message',
    _id: `temp-${Date.now()}`,
    ...message,
    chat: chatId,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }),

  // Редактирование сообщения
  editMessage: (messageId, text) => ({
    __typename: 'Message',
    _id: messageId,
    text,
    edited: true,
    updatedAt: new Date().toISOString()
  }),

  // Создание чата
  createChat: (chatData) => ({
    __typename: 'Chat',
    chatId: `temp-${Date.now()}`,
    ...chatData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
};

// Функция для обработки ошибок GraphQL
export const handleGraphQLError = (error, defaultMessage = 'Произошла ошибка') => {
  console.error('GraphQL Error:', error);
  
  if (error.networkError) {
    return 'Ошибка сети: не удается подключиться к серверу';
  }
  
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];
    if (graphQLError.message.includes('Unauthorized')) {
      return 'Сессия истекла, необходимо войти заново';
    }
    return graphQLError.message || defaultMessage;
  }
  
  return error.message || defaultMessage;
};

// Функция для проверки авторизации
export const isAuthorized = (token) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return false;
  }
};

// Функция для нормализации данных пользователя
export const normalizeUser = (user) => ({
  userId: user.userId,
  username: user.username,
  email: user.email,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  patronymic: user.patronymic || '',
  fullName: user.fullName || `${user.lastName || ''} ${user.firstName || ''}`.trim() || user.username,
  avatar: user.avatar,
  status: user.status || 'OFFLINE',
  lastSeen: user.lastSeen,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

// Функция для нормализации данных сообщения
export const normalizeMessage = (message) => ({
  _id: message._id,
  text: message.text,
  userId: message.userId,
  username: message.username,
  fullName: message.fullName,
  chat: message.chat,
  type: message.type || 'TEXT',
  files: message.files || [],
  replyTo: message.replyTo,
  forwardedFrom: message.forwardedFrom,
  edited: message.edited || false,
  timestamp: message.timestamp,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt
});

// Функция для нормализации данных чата
export const normalizeChat = (chat) => ({
  chatId: chat.chatId,
  type: chat.type,
  name: chat.name,
  description: chat.description,
  participants: chat.participants || [],
  lastMessage: chat.lastMessage,
  createdAt: chat.createdAt,
  updatedAt: chat.updatedAt
});

export default {
  updateChatsCache,
  updateMessagesCache,
  updateMessageInCache,
  removeMessageFromCache,
  updateUserStatusInCache,
  updateLastMessageInChat,
  optimisticUpdate,
  handleGraphQLError,
  isAuthorized,
  normalizeUser,
  normalizeMessage,
  normalizeChat
};
