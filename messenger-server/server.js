// index.js (основной файл сервера)
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');
const socketHandler = require('./socket/index'); // Импорт улучшенного socket handler

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://192.168.2.15:5173', // Используйте env для гибкости
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
});

// Middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
  next();
});

app.use(cors({ 
  origin: process.env.CLIENT_ORIGIN || 'http://192.168.2.15:5173',
  credentials: true
}));
app.use(express.json());
app.use(fileUpload());
app.use('/auth', authRoutes);
app.use('/chats', chatRoutes);
app.use('/messages', messageRoutes);
app.use('/Uploads', express.static('Uploads'));

app.set('io', io);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/grok_messenger_new', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Подключено к MongoDB');
  
  // Очищаем неиспользуемые файлы при запуске сервера
  try {
    const { cleanupUnusedFiles } = require('./routes/messages');
    await cleanupUnusedFiles();
    console.log('Очистка файлов при запуске завершена');
  } catch (error) {
    console.error('Ошибка очистки файлов при запуске:', error.message);
  }
}).catch((err) => {
  console.error('Ошибка подключения к MongoDB:', err.message);
});

// Инициализация Socket.io с улучшенным handler
socketHandler(io);

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Сервер запущен на ${HOST}:${PORT}`);
});