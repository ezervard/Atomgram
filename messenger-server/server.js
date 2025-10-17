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
const { createGraphQLServer } = require('./graphql/server-simple');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://10.185.101.19:5173', // Используйте env для гибкости
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
  origin: process.env.CLIENT_ORIGIN || 'http://10.185.101.19:5173',
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
  
  // Инициализация Socket.io с улучшенным handler
  socketHandler(io);
  
  // Инициализация GraphQL сервера
  await createGraphQLServer(app, server, io);
  
  const PORT = process.env.PORT || 8080;
  const HOST = process.env.HOST || '10.185.101.19';
  server.listen(PORT, HOST, () => {
    console.log(`Сервер запущен на ${HOST}:${PORT}`);
    console.log(`REST API доступен на ${HOST}:${PORT}/auth, /chats, /messages`);
    console.log(`GraphQL API доступен на ${HOST}:${PORT}/graphql`);
    console.log(`GraphQL Playground доступен на ${HOST}:${PORT}/graphql`);
  });
}).catch((err) => {
  console.error('Ошибка подключения к MongoDB:', err.message);
});