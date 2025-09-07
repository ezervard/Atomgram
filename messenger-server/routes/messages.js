// routes/messages.js (замените существующий файл)
const express = require('express');
const Message = require('../models/message');
const Chat = require('../models/chat');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Функция для очистки неиспользуемых файлов
const cleanupUnusedFiles = async () => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'Uploads');
    const files = await fs.readdir(uploadsDir);
    
    // Получаем все файлы, которые используются в сообщениях
    const messages = await Message.find({}, 'files');
    const usedFiles = new Set();
    
    messages.forEach(message => {
      if (message.files) {
        message.files.forEach(file => {
          if (file.url) {
            const fileName = path.basename(file.url);
            usedFiles.add(fileName);
          }
        });
      }
    });
    
    // Удаляем неиспользуемые файлы
    for (const file of files) {
      if (!usedFiles.has(file)) {
        try {
          const filePath = path.join(uploadsDir, file);
          await fs.unlink(filePath);
          console.log('Удален неиспользуемый файл:', file);
        } catch (error) {
          console.error('Ошибка удаления неиспользуемого файла:', file, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка очистки файлов:', error.message);
  }
};

router.get('/:chatId', authenticateToken, async (req, res) => {
  console.log(`GET /messages/${req.params.chatId}`);
  try {
    const chat = await Chat.findOne({ chatId: req.params.chatId });
    if (!chat || !chat.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Нет доступа к чату' });
    }
    const messages = await Message.find({ chat: req.params.chatId }).sort({ timestamp: 1 });
    console.log(`Загружены сообщения для чата ${req.params.chatId}:`, messages.length);
    res.json(messages);
  } catch (err) {
    console.error('Ошибка загрузки сообщений:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/:messageId', authenticateToken, async (req, res) => {
  console.log(`PUT /messages/${req.params.messageId}`);
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Сообщение не найдено' });
    const chat = await Chat.findOne({ chatId: message.chat });
    if (!chat || !chat.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Нет доступа к чату' });
    }
    // Проверяем, не является ли сообщение пересланным
    if (message.forwardedFrom || message.originalMessage) {
      return res.status(403).json({ error: 'Пересланные сообщения нельзя редактировать' });
    }
    
    // Проверяем права на редактирование по userId или username
    if (message.userId && message.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Нет прав для редактирования' });
    }
    if (!message.userId && message.username !== req.user.username) {
      return res.status(403).json({ error: 'Нет прав для редактирования' });
    }
    // Получаем актуальные данные пользователя для обновления имени
    const User = require('../models/user');
    const currentUser = await User.findOne({ userId: req.user.userId });
    const currentUserDisplayName = currentUser ? 
      `${currentUser.lastName || ''} ${currentUser.firstName || ''}`.trim() || currentUser.username :
      req.user.username;

    message.text = req.body.text;
    message.edited = true;
    message.username = currentUserDisplayName;
    message.fullName = currentUserDisplayName; // Убираем "Переслано от" при редактировании
    await message.save();
    req.app.get('io').to(message.chat).emit('messageUpdated', message);
    console.log('Сообщение обновлено:', message);
    res.json(message);
  } catch (err) {
    console.error('Ошибка редактирования сообщения:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/:messageId', authenticateToken, async (req, res) => {
  console.log(`DELETE /messages/${req.params.messageId}`);
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Сообщение не найдено' });
    const chat = await Chat.findOne({ chatId: message.chat });
    if (!chat || !chat.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Нет доступа к чату' });
    }
    // Проверяем права на удаление по userId или username
    if (message.userId && message.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Нет прав для удаления' });
    }
    if (!message.userId && message.username !== req.user.username) {
      return res.status(403).json({ error: 'Нет прав для удаления' });
    }
    
    // Удаляем файлы с сервера, если они есть
    if (message.files && message.files.length > 0) {
      console.log('Удаляем файлы сообщения:', message.files);
      for (const file of message.files) {
        try {
          const filePath = path.join(__dirname, '..', 'Uploads', path.basename(file.url));
          await fs.unlink(filePath);
          console.log('Файл удален с сервера:', filePath);
        } catch (fileError) {
          console.error('Ошибка удаления файла:', file.url, fileError.message);
          // Продолжаем удаление, даже если файл не найден
        }
      }
    }
    
    await message.deleteOne();
    req.app.get('io').to(message.chat).emit('messageDeleted', {
      messageId: req.params.messageId,
      chatId: message.chat,
    });
    console.log('Сообщение удалено:', req.params.messageId);
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка удаления сообщения:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/forward', authenticateToken, async (req, res) => {
  console.log('POST /messages/forward');
  try {
    const { messageId, targetChatId } = req.body;
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) return res.status(404).json({ error: 'Сообщение не найдено' });
    const originalChat = await Chat.findOne({ chatId: originalMessage.chat });
    const targetChat = await Chat.findOne({ chatId: targetChatId });
    if (!originalChat || !originalChat.participants.includes(req.user.userId) ||
        !targetChat || !targetChat.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Нет доступа к чату' });
    }
    // Получаем актуальные данные пользователя
    const User = require('../models/user');
    const currentUser = await User.findOne({ userId: req.user.userId });
    const currentUserDisplayName = currentUser ? 
      `${currentUser.lastName || ''} ${currentUser.firstName || ''}`.trim() || currentUser.username :
      req.user.username;

    // Получаем актуальное имя автора оригинального сообщения
    let originalAuthorName = originalMessage.fullName || originalMessage.username;
    if (originalMessage.userId) {
      const originalAuthor = await User.findOne({ userId: originalMessage.userId });
      if (originalAuthor) {
        originalAuthorName = `${originalAuthor.lastName || ''} ${originalAuthor.firstName || ''}`.trim() || originalAuthor.username;
      }
    }

    const forwardedMessage = new Message({
      userId: req.user.userId,
      username: currentUserDisplayName,
      chat: targetChatId,
      text: originalMessage.text,
      fullName: `Переслано от ${originalAuthorName}`,
      type: originalMessage.type,
      timestamp: new Date(),
      forwardedFrom: originalAuthorName,
      originalMessage: originalMessage._id,
    });
    await forwardedMessage.save();
    req.app.get('io').to(targetChatId).emit('message', forwardedMessage);
    console.log('Сообщение переслано:', forwardedMessage);
    res.json(forwardedMessage);
  } catch (err) {
    console.error('Ошибка пересылки сообщения:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/upload', authenticateToken, async (req, res) => {
  console.log('POST /messages/upload');
  try {
    console.log('req.files:', req.files);
    console.log('req.body:', req.body);
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'Файлы не загружены' });
    }
    const { chatId, userId, username, fullName, text } = req.body;
    const chat = await Chat.findOne({ chatId });
    if (!chat || !chat.participants.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Нет доступа к чату' });
    }
    if (username !== req.user.username) {
      return res.status(403).json({ error: 'Неверный пользователь' });
    }
    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];
    console.log('Загруженные файлы:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    // Функция для определения MIME-типа по расширению
    const getMimeType = (filename) => {
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        '.webm': 'video/webm',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json'
      };
      return mimeTypes[ext] || 'application/octet-stream';
    };
    
    const fileUrls = [];
    for (const file of files) {
      // Исправляем кодировку имени файла
      const originalName = Buffer.from(file.name, 'latin1').toString('utf8');
      const fileName = `${Date.now()}_${originalName}`;
      const filePath = path.join(__dirname, '../Uploads', fileName);
      await file.mv(filePath);
      fileUrls.push(`/Uploads/${fileName}`);
    }
    const filesData = fileUrls.map((url, index) => {
      // Исправляем кодировку имени файла для сохранения в БД
      const originalName = Buffer.from(files[index].name, 'latin1').toString('utf8');
      const mimeType = getMimeType(originalName);
      console.log(`Файл ${originalName}: оригинальный тип ${files[index].type}, определенный тип ${mimeType}`);
      return {
        name: originalName,
        size: files[index].size,
        type: mimeType,
        url,
      };
    });
    
    console.log('Данные файлов для сохранения:', filesData);
    
    const message = new Message({
      userId: userId || req.user.userId,
      username,
      chat: chatId,
      text: text || '',
      fullName: fullName || 'Неизвестный пользователь',
      type: 'file',
      files: filesData,
      timestamp: new Date(),
    });
    
    console.log('Создаваемое сообщение:', JSON.stringify(message, null, 2));
    console.log('Тип files:', typeof message.files);
    console.log('files является массивом:', Array.isArray(message.files));
    await message.save();
    req.app.get('io').to(chatId).emit('message', message);
    console.log('Файлы загружены, сообщение создано:', message);
    res.json({ fileUrls });
  } catch (err) {
    console.error('Ошибка загрузки файлов:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
  }
});

// Эндпоинт для очистки неиспользуемых файлов
router.post('/cleanup-files', authenticateToken, async (req, res) => {
  console.log('POST /messages/cleanup-files');
  try {
    await cleanupUnusedFiles();
    res.json({ message: 'Очистка файлов завершена' });
  } catch (error) {
    console.error('Ошибка очистки файлов:', error.message);
    res.status(500).json({ error: 'Ошибка очистки файлов' });
  }
});

module.exports = router;
module.exports.cleanupUnusedFiles = cleanupUnusedFiles;