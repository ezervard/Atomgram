// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { authenticateToken } = require('../middleware/auth'); // Добавили для /users
// Функция для генерации короткого ID (6 символов)
const generateShortId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

router.post('/register', async (req, res) => {
  console.log('POST /auth/register');
  try {
    const { username, email, password, firstName, lastName, patronymic } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь или email уже существует' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      patronymic,
      fullName: `${firstName} ${lastName} ${patronymic}`.trim(),
    });
    await user.save();
    console.log('Пользователь зарегистрирован:', user);
    const token = jwt.sign(
      { username: user.username, userId: user.userId, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, username: user.username, userId: user.userId, fullName: user.fullName });
  } catch (err) {
    console.error('Ошибка регистрации:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/login', async (req, res) => {
  console.log('POST /auth/login');
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Неверное имя пользователя или пароль' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверное имя пользователя или пароль' });
    }
    const token = jwt.sign(
      { username: user.username, userId: user.userId, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Пользователь вошёл:', user);
    res.json({ token, username: user.username, userId: user.userId, fullName: user.fullName });
  } catch (err) {
    console.error('Ошибка входа:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/logout', (req, res) => {
  console.log('POST /auth/logout');
  res.status(200).send();
});

router.get('/users', authenticateToken, async (req, res) => { // Добавили auth
  console.log('GET /auth/users');
  try {
    const users = await User.find({}, 'userId username firstName lastName patronymic fullName email status avatar');
    console.log('Загружены пользователи:', users);
    res.json(users);
  } catch (err) {
    console.error('Ошибка загрузки пользователей:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  console.log('PUT /auth/profile');
  try {
    const { firstName, lastName, patronymic, email } = req.body;
    const userId = req.user.userId;
    
    // Проверяем, что email не занят другим пользователем
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        userId: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email уже используется другим пользователем' });
      }
    }
    
    // Обновляем профиль
    const updateData = {
      firstName,
      lastName,
      patronymic,
      fullName: `${firstName} ${lastName} ${patronymic}`.trim()
    };
    
    if (email) {
      updateData.email = email;
    }
    
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, select: 'userId username firstName lastName patronymic fullName email status avatar' }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    console.log('Профиль обновлен:', updatedUser);
    res.json(updatedUser);
  } catch (err) {
    console.error('Ошибка обновления профиля:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Роут для загрузки аватара
router.post('/avatar', authenticateToken, async (req, res) => {
  console.log('POST /auth/avatar - получен запрос');
  console.log('req.files:', req.files);
  console.log('req.body:', req.body);
  console.log('req.headers:', req.headers);
  try {
    if (!req.files || !req.files.avatar) {
      console.log('Файл аватара не найден');
      return res.status(400).json({ error: 'Файл аватара не найден' });
    }

    const avatar = req.files.avatar;
    const userId = req.user.userId;
    console.log('Аватар получен:', avatar.name, avatar.size, avatar.mimetype);

    // Проверяем тип файла
    if (!avatar.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Файл должен быть изображением' });
    }

    // Проверяем размер файла (максимум 5MB)
    if (avatar.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Размер файла не должен превышать 5MB' });
    }

    // Создаем уникальное имя файла
    const fileExtension = path.extname(avatar.name);
    const fileName = `avatar_${userId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(__dirname, '..', 'Uploads', 'avatars', fileName);

    // Создаем папку avatars если её нет
    const avatarsDir = path.join(__dirname, '..', 'Uploads', 'avatars');
    try {
      await fs.mkdir(avatarsDir, { recursive: true });
    } catch (err) {
      // Папка уже существует
    }

    // Сохраняем файл
    console.log('Сохраняем файл по пути:', filePath);
    await avatar.mv(filePath);
    console.log('Файл успешно сохранен');

    // Обновляем URL аватара в базе данных
    const avatarUrl = `/Uploads/avatars/${fileName}`;
    console.log('Обновляем аватар в базе данных:', avatarUrl);
    await User.findOneAndUpdate(
      { userId },
      { avatar: avatarUrl }
    );
    console.log('Аватар обновлен в базе данных');

    res.json({ avatar: avatarUrl });
  } catch (err) {
    console.error('Ошибка загрузки аватара:', err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;